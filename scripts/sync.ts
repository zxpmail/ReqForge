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
    "core/agents": ".cursor/rules/agents",
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
};

// Files that should NOT be synced to adapters (ReqForge-self only)
export const SKIP_FILES = new Set(["check-sync.sh", "check-sync.bat"]);

export function syncDir(srcDir: string, destDir: string): void {
  if (!fs.existsSync(srcDir)) {
    console.warn(`  ⚠️  Source directory not found: ${srcDir}`);
    return;
  }

  // Clear destination directory
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  // Copy all files, skipping ReqForge-self-only files
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_FILES.has(entry.name)) continue;

    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
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

function fileHash(filePath: string): string {
  const content = fs.readFileSync(filePath);
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
      const coreFiles = collectFiles(coreDir, "", SKIP_FILES);
      const adapFiles = collectFiles(adapDir, "");
      const allKeys = new Set([...coreFiles.keys(), ...adapFiles.keys()]);

      for (const rel of allKeys) {
        if (coreFiles.has(rel) && adapFiles.has(rel)) {
          const hCore = fileHash(coreFiles.get(rel)!);
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

    // Sync directory mappings
    for (const [src, dest] of Object.entries(syncMap)) {
      const srcPath = path.join(ROOT, src);
      const destPath = path.join(adapterDir, dest);
      syncDir(srcPath, destPath);
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
