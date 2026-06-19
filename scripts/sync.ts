/**
 * Forge sync script
 *
 * Syncs core/ content to all adapter directories:
 * - core/skills/  -> adapters/{adapter}/.claude/skills/
 * - core/agents/  -> adapters/{adapter}/.claude/agents/
 * - core/templates/ -> adapters/{adapter}/.claude/templates/
 *
 * Usage: pnpm sync
 * Or: npx ts-node scripts/sync.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

const ADAPTERS: Record<string, Record<string, string>> = {
  "claude-code": {
    "core/skills": ".claude/skills",
    "core/agents": ".claude/agents",
    "core/templates": ".claude/templates",
    "core/feedback": ".claude/feedback",
    "core/hooks": ".claude/hooks",
    "core/loadouts": ".claude/loadouts",
  },
  "cursor": {
    "core/skills": ".cursor/rules/skills",
    "core/agents": ".cursor/agents",
    "core/templates": ".cursor/rules/templates",
    "core/feedback": ".cursor/rules/feedback",
    "core/hooks": ".cursor/rules/hooks",
    "core/loadouts": ".cursor/rules/loadouts",
  },
  "opencode": {
    "core/skills": ".opencode/skills",
    "core/agents": ".opencode/agents",
    "core/templates": ".opencode/templates",
    "core/feedback": ".opencode/feedback",
    "core/hooks": ".opencode/hooks",
    "core/loadouts": ".opencode/loadouts",
  },
  "gemini-cli": {
    "core/skills": ".gemini/skills",
    "core/agents": ".gemini/agents",
    "core/templates": ".gemini/templates",
    "core/feedback": ".gemini/feedback",
    "core/hooks": ".gemini/hooks",
    "core/loadouts": ".gemini/loadouts",
  },
};

// Files that should NOT be synced to adapters (ReqForge-self only)
export const SKIP_FILES = new Set(["check-sync.sh", "check-sync.bat"]);

// Index/convention files inside core/agents/ that are NOT sub-agent definitions.
// Keep them out of platform sub-agent scan dirs (.cursor/agents, .gemini/agents, ...)
// where they would otherwise surface as a bogus agent entry.
export const AGENT_DIR_SKIP = new Set([...SKIP_FILES, "AGENTS.md"]);

// Claude Code sub-agent model aliases (opus/sonnet/haiku) are invalid on other
// platforms. Normalize them to `inherit` (valid on Cursor 2.4, Gemini CLI
// v0.38.1+, OpenCode; and equivalent to Claude Code's behavior when the model
// field is omitted). The claude-code adapter keeps the original pinning.
const CLAUDE_MODEL_LINE = /^([ \t]*model:[ \t]*)(opus|sonnet|haiku)([ \t]*)$/m;

export function adaptAgentContent(adapter: string, content: string): string {
  if (adapter === "claude-code") return content;
  return content.replace(CLAUDE_MODEL_LINE, "$1inherit$3");
}

export function syncDir(
  srcDir: string,
  destDir: string,
  opts?: { skip?: Set<string>; transform?: (content: string) => string }
): void {
  if (!fs.existsSync(srcDir)) {
    console.warn(`  ⚠️  Source directory not found: ${srcDir}`);
    return;
  }

  const skip = opts?.skip ?? SKIP_FILES;
  const transform = opts?.transform;

  // Clear destination directory
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  // Copy all files, skipping excluded files; apply optional per-platform transform
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (skip.has(entry.name)) continue;

    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else if (transform) {
      fs.writeFileSync(destPath, transform(fs.readFileSync(srcPath, "utf-8")), "utf-8");
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  console.log(`  ✅ ${destDir}`);
}

export function copyFile(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠️  Source not found: ${src}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`  ✅ ${dest}`);
}

const ADAPTER_CONFIGS: Record<string, { controlFile: string; evolutionFile: string }> = {
  "claude-code": { controlFile: ".claude/CLAUDE.md", evolutionFile: ".claude/EVOLUTION.md" },
  "cursor": { controlFile: ".cursor/rules/reqforge.mdc", evolutionFile: ".cursor/rules/EVOLUTION.md" },
  "opencode": { controlFile: ".opencode/AGENTS.md", evolutionFile: ".opencode/EVOLUTION.md" },
  "gemini-cli": { controlFile: ".gemini/GEMINI.md", evolutionFile: ".gemini/EVOLUTION.md" },
};

// ── Discover mode ──

interface DiscoverEntry {
  relPath: string;
  adapterFile?: string;
  coreFile?: string;
  status: "synced" | "drifted" | "orphan" | "missing";
}

function collectFiles(dir: string, prefix: string, skip?: Set<string>): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(dir)) return map;
  function walk(d: string, rel: string) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (skip?.has(e.name)) continue;
      const full = path.join(d, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(full, r);
      else map.set(r, full);
    }
  }
  walk(dir, prefix);
  return map;
}

function fileHash(filePath: string, transform?: (content: string) => string): string {
  let content: string | Buffer = fs.readFileSync(filePath);
  if (transform) content = transform(content.toString("utf-8"));
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 12);
}

function discover(): void {
  const SEP = "━".repeat(21);
  console.log(`🔍 Sync Discovery Report\n${SEP}\n`);

  let totalSynced = 0, totalDrifted = 0, totalOrphan = 0, totalMissing = 0;

  for (const [adapter, syncMap] of Object.entries(ADAPTERS)) {
    console.log(`📦 ${adapter}:`);
    const adapterDir = path.join(ROOT, "adapters", adapter);

    let synced = 0;
    const drifted: { rel: string; dest: string }[] = [];
    const orphan: { rel: string; dest: string }[] = [];
    const missing: { rel: string }[] = [];

    for (const [coreSrc, adapterDest] of Object.entries(syncMap)) {
      const coreDir = path.join(ROOT, coreSrc);
      const adapDir = path.join(adapterDir, adapterDest);
      const isAgents = coreSrc === "core/agents";
      const coreSkip = isAgents ? AGENT_DIR_SKIP : SKIP_FILES;
      const agentTransform = isAgents
        ? (c: string) => adaptAgentContent(adapter, c)
        : undefined;
      const coreFiles = collectFiles(coreDir, "", coreSkip);
      const adapFiles = collectFiles(adapDir, "");
      const allKeys = new Set([...coreFiles.keys(), ...adapFiles.keys()]);

      for (const rel of allKeys) {
        if (coreFiles.has(rel) && adapFiles.has(rel)) {
          // Hash core side through the same per-platform transform that sync
          // applies, so transformed adapters compare as in-sync (not drift).
          const hCore = fileHash(coreFiles.get(rel)!, agentTransform);
          const hAdap = fileHash(adapFiles.get(rel)!);
          if (hCore === hAdap) { synced++; }
          else { drifted.push({ rel, dest: adapterDest }); }
        } else if (coreFiles.has(rel)) {
          missing.push({ rel });
        } else {
          orphan.push({ rel, dest: adapterDest });
        }
      }
    }

    totalSynced += synced; totalDrifted += drifted.length; totalOrphan += orphan.length; totalMissing += missing.length;

    console.log(`  ✅ ${synced} files in sync (match core)`);
    if (drifted.length > 0) {
      console.log(`  ⚠️  ${drifted.length} drifted:`);
      for (const d of drifted) console.log(`     ${d.dest}/${d.rel}`);
    }
    if (orphan.length > 0) {
      console.log(`  📄 ${orphan.length} orphan (adapter-only):`);
      for (const o of orphan) console.log(`     ${o.dest}/${o.rel}`);
    }
    if (missing.length > 0) {
      console.log(`  ❌ ${missing.length} missing (core-only):`);
      for (const m of missing) console.log(`     core/${m.rel}`);
    }
    console.log("");
  }

  console.log(`${SEP}`);
  console.log(`Summary: ${totalDrifted} drifted · ${totalOrphan} orphan · ${totalMissing} missing · ${totalSynced} in sync`);
  if (totalDrifted > 0 || totalMissing > 0) {
    console.log(`Run \`pnpm sync\` to overwrite adapter files with core versions.`);
  } else {
    console.log(`✅ All adapters are in sync with core.`);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes("--discover")) {
    discover();
    return;
  }
  console.log("🔄 Syncing core -> adapters...\n");

  for (const [adapter, syncMap] of Object.entries(ADAPTERS)) {
    console.log(`📦 ${adapter}:`);
    const adapterDir = path.join(ROOT, "adapters", adapter);
    const cfg = ADAPTER_CONFIGS[adapter];

    // Sync directory mappings (agents dir: skip index docs + normalize Claude
    // model aliases to `inherit` for non-Claude adapters)
    for (const [src, dest] of Object.entries(syncMap)) {
      const srcPath = path.join(ROOT, src);
      const destPath = path.join(adapterDir, dest);
      if (src === "core/agents") {
        syncDir(srcPath, destPath, {
          skip: AGENT_DIR_SKIP,
          transform: (c) => adaptAgentContent(adapter, c),
        });
      } else {
        syncDir(srcPath, destPath);
      }
    }

    // Sync control file to adapter (Forge dispatch map; OpenCode reads AGENTS.md, same content as CLAUDE.md)
    copyFile(path.join(ROOT, "CLAUDE.md"), path.join(adapterDir, cfg.controlFile));

    // Sync EVOLUTION.md
    copyFile(path.join(ROOT, "EVOLUTION.md"), path.join(adapterDir, cfg.evolutionFile));

    console.log("");
  }

  console.log("✅ Sync complete");
}

if (require.main === module) {
  main();
}
