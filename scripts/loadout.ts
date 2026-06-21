/**
 * loadout.ts — Shared loadout loading, filtering, and hook application
 * Used by forge-install (--loadout) and apply-loadout.
 */

import * as fs from "fs";
import * as path from "path";
import type { InstallClient } from "./install";

export interface Loadout {
  name: string;
  version: string;
  description: string;
  skills: string[];
  agents: string[];
  hooks: string[];
}

export interface AdapterLayout {
  /** Relative to adapter install root (e.g. `.claude`) */
  skillsRel: string;
  agentsRel: string;
  hooksPrefix: string;
}

export const ADAPTER_LAYOUT: Record<InstallClient, AdapterLayout> = {
  "claude-code": {
    skillsRel: "skills",
    agentsRel: "agents",
    hooksPrefix: ".claude/hooks",
  },
  cursor: {
    skillsRel: "rules/skills",
    agentsRel: "rules/agents",
    hooksPrefix: ".cursor/rules/hooks",
  },
  opencode: {
    skillsRel: "skills",
    agentsRel: "agents",
    hooksPrefix: ".opencode/hooks",
  },
};

/** Hook name → settings event key + shell command suffix */
export const HOOK_REGISTRY: Record<
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
  "phase-exit-guard": {
    event: "BeforeCommand",
    sh: "phase-exit-guard.sh",
    bat: "phase-exit-guard.bat",
    combineWith: ["stop-gate", "retry-gate", "detect-feedback-signal"],
  },
  "stop-gate": {
    event: "BeforeCommand",
    sh: "stop-gate.sh",
    bat: "stop-gate.bat",
    combineWith: ["phase-exit-guard", "retry-gate", "detect-feedback-signal"],
  },
  "retry-gate": {
    event: "BeforeCommand",
    sh: "retry-gate.sh",
    bat: "retry-gate.bat",
    combineWith: ["phase-exit-guard", "stop-gate", "detect-feedback-signal"],
  },
  "detect-feedback-signal": {
    event: "BeforeCommand",
    sh: "detect-feedback-signal.sh",
    bat: "detect-feedback-signal.bat",
    combineWith: ["phase-exit-guard", "stop-gate", "retry-gate"],
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
  "memory-guard": {
    event: "PostToolUse",
    sh: "memory-guard.sh",
    bat: "memory-guard.bat",
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

export function listLoadoutNames(forgeRoot: string): string[] {
  const dir = path.join(forgeRoot, "core/loadouts");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.includes("schema"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

export function loadLoadout(name: string, forgeRoot: string): Loadout {
  const file = path.join(forgeRoot, "core/loadouts", `${name}.json`);
  if (!fs.existsSync(file)) {
    const available = listLoadoutNames(forgeRoot);
    throw new Error(
      `Loadout not found: ${name}. Available: ${available.join(", ") || "(none)"}`,
    );
  }
  return JSON.parse(fs.readFileSync(file, "utf-8")) as Loadout;
}

/** Whether a relative path under the adapter tree should be copied for this loadout */
export function shouldIncludeForLoadout(
  relativePath: string,
  loadout: Loadout,
  layout: AdapterLayout,
): boolean {
  const norm = relativePath.replace(/\\/g, "/");

  if (norm.startsWith(`${layout.skillsRel}/`) || norm === layout.skillsRel) {
    if (norm === layout.skillsRel) return true;
    const rest = norm.slice(layout.skillsRel.length + 1);
    const segment = rest.split("/")[0];
    if (segment === "_shared") return true;
    if (segment === "AGENTS.md" || segment === "skill.schema.json") return true;
    return loadout.skills.includes(segment);
  }

  if (norm.startsWith(`${layout.agentsRel}/`) || norm === layout.agentsRel) {
    if (norm === layout.agentsRel) return true;
    const rest = norm.slice(layout.agentsRel.length + 1);
    if (rest === "AGENTS.md") return true;
    const agentName = rest.replace(/\.md$/, "");
    return loadout.agents.includes(agentName);
  }

  return true;
}

function buildHookRun(prefix: string, scripts: string[], windows: boolean): string {
  const sep = " && ";
  const ext = windows ? ".bat" : ".sh";
  const runner = windows ? "cmd /c " : "sh ";
  return scripts
    .map((s) => {
      const script = s.endsWith(ext) ? s : `${s}${ext}`;
      const p = windows ? `${prefix}\\${script.replace(".sh", ".bat")}` : `${prefix}/${script}`;
      return `${runner}${p}`;
    })
    .join(sep);
}

export function buildHooksConfig(
  loadout: Loadout,
  hooksPrefix: string,
  windows: boolean,
  warn?: (msg: string) => void,
): Record<string, { run: string }> {
  const hooksConfig: Record<string, { run: string }> = {};
  const eventsBuilt = new Set<string>();

  for (const hookName of loadout.hooks) {
    const reg = HOOK_REGISTRY[hookName];
    if (!reg) {
      warn?.(`  ⚠️  Unknown hook in loadout: ${hookName} (skipped)`);
      continue;
    }
    if (eventsBuilt.has(reg.event)) continue;

    const siblings = reg.combineWith ?? [];
    const allHooks = [hookName, ...siblings].filter((h) => loadout.hooks.includes(h));
    const scripts = allHooks.map((h) => HOOK_REGISTRY[h]?.sh.replace(".sh", "") ?? h);
    hooksConfig[reg.event] = { run: buildHookRun(hooksPrefix, scripts, windows) };
    eventsBuilt.add(reg.event);
  }

  return hooksConfig;
}

/** Merge loadout hook registrations into a settings.json file */
export function applyLoadoutHooksToSettingsFile(
  settingsPath: string,
  loadout: Loadout,
  hooksPrefix: string,
  windows: boolean,
  warn?: (msg: string) => void,
): void {
  if (!fs.existsSync(settingsPath)) return;

  const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8")) as {
    hooks?: Record<string, { run: string }>;
  };
  const hooksPatch = buildHooksConfig(loadout, hooksPrefix, windows, warn);
  settings.hooks = { ...settings.hooks, ...hooksPatch };
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf-8");
}

/** Apply loadout hooks to adapter settings under install dest (user project) */
export function applyLoadoutHooksInDest(
  client: InstallClient,
  destDir: string,
  loadout: Loadout,
  log: (msg: string) => void,
): void {
  const layout = ADAPTER_LAYOUT[client];
  const settingsPath = path.join(destDir, "settings.json");
  applyLoadoutHooksToSettingsFile(settingsPath, loadout, layout.hooksPrefix, false, log);

  const winPath = path.join(destDir, "settings.windows.json");
  if (fs.existsSync(winPath)) {
    applyLoadoutHooksToSettingsFile(winPath, loadout, layout.hooksPrefix, true, log);
  }

  log(`  ✅ Loadout hooks (${loadout.name}): ${loadout.hooks.length} hook(s) → settings`);
}

/** Write active loadout marker for user project */
export function installLoadoutMarker(
  targetRoot: string,
  loadout: Loadout,
  log: (msg: string) => void,
  force?: boolean,
): void {
  const forgeDir = path.join(path.resolve(targetRoot), ".forge");
  const dest = path.join(forgeDir, "loadout-active.json");
  if (fs.existsSync(dest) && !force) {
    log(`  ⏭️  .forge/loadout-active.json exists (use --force to overwrite)`);
    return;
  }
  fs.mkdirSync(forgeDir, { recursive: true });
  fs.writeFileSync(
    dest,
    `${JSON.stringify(
      {
        name: loadout.name,
        version: loadout.version,
        skills: loadout.skills,
        installed_at: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  log(`  ✅ ${dest}`);
}
