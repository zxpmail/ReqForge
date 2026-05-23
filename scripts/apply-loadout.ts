/**
 * apply-loadout.ts — Validate and apply Forge loadout hook bundles to adapter settings
 *
 * Usage:
 *   pnpm apply-loadout full claude-code
 *   pnpm apply-loadout minimal cursor --dry-run
 *
 * Merges hook registrations from a loadout into the adapter settings.json.
 * Skills/agents in the loadout are informational — copy via forge-install + manual selection.
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

type Client = "claude-code" | "cursor" | "opencode";

const CLIENT_PATHS: Record<Client, { settings: string; hooksPrefix: string }> = {
  "claude-code": {
    settings: "adapters/claude-code/.claude/settings.json",
    hooksPrefix: ".claude/hooks",
  },
  cursor: {
    settings: "adapters/cursor/.cursor/settings.json",
    hooksPrefix: ".cursor/rules/hooks",
  },
  opencode: {
    settings: "adapters/opencode/.opencode/settings.json",
    hooksPrefix: ".opencode/hooks",
  },
};

/** Hook name → settings event key + shell command suffix */
const HOOK_REGISTRY: Record<
  string,
  { event: string; sh: string; bat: string; combineWith?: string[] }
> = {
  "hallucination-gate": {
    event: "PreToolUse",
    sh: "hallucination-gate.sh",
    bat: "hallucination-gate.bat",
  },
  "pre-commit-check": { event: "PreCommit", sh: "pre-commit-check.sh", bat: "pre-commit-check.bat" },
  "auto-push": { event: "PostCommit", sh: "auto-push.sh", bat: "auto-push.bat" },
  "stop-gate": { event: "BeforeCommand", sh: "stop-gate.sh", bat: "stop-gate.bat", combineWith: ["detect-feedback-signal"] },
  "detect-feedback-signal": {
    event: "BeforeCommand",
    sh: "detect-feedback-signal.sh",
    bat: "detect-feedback-signal.bat",
    combineWith: ["stop-gate"],
  },
  "mark-review-needed": {
    event: "AfterCommand",
    sh: "mark-review-needed.sh",
    bat: "mark-review-needed.bat",
    combineWith: ["memory-check"],
  },
  "memory-check": {
    event: "AfterCommand",
    sh: "memory-check.sh",
    bat: "memory-check.bat",
    combineWith: ["mark-review-needed"],
  },
  "context-compaction": {
    event: "PostToolUse",
    sh: "context-compaction.sh",
    bat: "context-compaction.bat",
    combineWith: ["check-handoff"],
  },
  "check-handoff": {
    event: "PostToolUse",
    sh: "check-handoff.sh",
    bat: "check-handoff.bat",
    combineWith: ["context-compaction"],
  },
  "check-evolution": { event: "OnInit", sh: "check-evolution.sh", bat: "check-evolution.bat" },
};

interface Loadout {
  name: string;
  version: string;
  description: string;
  skills: string[];
  agents: string[];
  hooks: string[];
}

function loadLoadout(name: string): Loadout {
  const file = path.join(ROOT, "core/loadouts", `${name}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Loadout not found: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf-8")) as Loadout;
}

function buildRun(prefix: string, scripts: string[], windows: boolean): string {
  const sep = windows ? " && " : " && ";
  const ext = windows ? ".bat" : ".sh";
  const runner = windows ? "" : "sh ";
  return scripts
    .map((s) => {
      const script = s.endsWith(ext) ? s : `${s}${ext}`;
      const p = windows ? `${prefix}\\${script.replace(".sh", ".bat")}` : `${prefix}/${script}`;
      return windows ? p : `${runner}${p}`;
    })
    .join(sep);
}

function applyHooks(loadout: Loadout, client: Client, windows: boolean): Record<string, { run: string }> {
  const { hooksPrefix } = CLIENT_PATHS[client];
  const hooksConfig: Record<string, { run: string }> = {};
  const eventsBuilt = new Set<string>();

  for (const hookName of loadout.hooks) {
    const reg = HOOK_REGISTRY[hookName];
    if (!reg) {
      console.warn(`  ⚠️  Unknown hook in loadout: ${hookName} (skipped)`);
      continue;
    }
    if (eventsBuilt.has(reg.event)) continue;

    const siblings = reg.combineWith ?? [];
    const allHooks = [hookName, ...siblings].filter((h) => loadout.hooks.includes(h));
    const scripts = allHooks.map((h) => HOOK_REGISTRY[h]?.sh.replace(".sh", "") ?? h);
    hooksConfig[reg.event] = { run: buildRun(hooksPrefix, scripts, windows) };
    eventsBuilt.add(reg.event);
  }

  return hooksConfig;
}

function main(): void {
  const [loadoutName, clientArg, ...rest] = process.argv.slice(2);
  const dryRun = rest.includes("--dry-run");

  if (!loadoutName || !clientArg || !(clientArg in CLIENT_PATHS)) {
    console.log("Usage: pnpm apply-loadout <loadout> <claude-code|cursor|opencode> [--dry-run]");
    console.log("Loadouts: full, web-app, cli-tool, minimal");
    process.exit(1);
  }

  const client = clientArg as Client;
  const loadout = loadLoadout(loadoutName);
  const settingsPath = path.join(ROOT, CLIENT_PATHS[client].settings);

  console.log(`📦 Loadout: ${loadout.name} v${loadout.version}`);
  console.log(`   ${loadout.description}`);
  console.log(`   Skills (${loadout.skills.length}): ${loadout.skills.join(", ")}`);
  console.log(`   Agents (${loadout.agents.length}): ${loadout.agents.join(", ")}`);
  console.log(`   Hooks (${loadout.hooks.length}): ${loadout.hooks.join(", ")}`);

  const hooksSh = applyHooks(loadout, client, false);
  const settings = fs.existsSync(settingsPath)
    ? (JSON.parse(fs.readFileSync(settingsPath, "utf-8")) as { hooks?: Record<string, { run: string }> })
    : { hooks: {} };

  settings.hooks = { ...settings.hooks, ...hooksSh };

  if (dryRun) {
    console.log("\n[DRY RUN] Would write hooks to:", settingsPath);
    console.log(JSON.stringify(settings.hooks, null, 2));
    return;
  }

  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf-8");
  console.log(`\n✅ Updated ${settingsPath}`);

  const winPath = settingsPath.replace("settings.json", "settings.windows.json");
  if (fs.existsSync(winPath)) {
    const hooksBat = applyHooks(loadout, client, true);
    const winSettings = JSON.parse(fs.readFileSync(winPath, "utf-8")) as {
      hooks?: Record<string, { run: string }>;
    };
    winSettings.hooks = { ...winSettings.hooks, ...hooksBat };
    fs.writeFileSync(winPath, `${JSON.stringify(winSettings, null, 2)}\n`, "utf-8");
    console.log(`✅ Updated ${winPath}`);
  }
}

main();
