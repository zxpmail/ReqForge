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
  },
  "cursor": {
    "core/skills": ".cursor/rules/skills",
    "core/agents": ".cursor/rules/agents",
    "core/templates": ".cursor/rules/templates",
    "core/feedback": ".cursor/rules/feedback",
    "core/hooks": ".cursor/rules/hooks",
  },
  "opencode": {
    "core/skills": ".opencode/skills",
    "core/agents": ".opencode/agents",
    "core/templates": ".opencode/templates",
    "core/feedback": ".opencode/feedback",
    "core/hooks": ".opencode/hooks",
  },
};

function syncDir(srcDir: string, destDir: string): void {
  if (!fs.existsSync(srcDir)) {
    console.warn(`  ⚠️  Source directory not found: ${srcDir}`);
    return;
  }

  // Clear destination directory
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  // Copy all files
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
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

function copyFile(src: string, dest: string): void {
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

function main(): void {
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

    // Sync root CLAUDE.md -> adapter's primary control file
    copyFile(path.join(ROOT, "CLAUDE.md"), path.join(adapterDir, cfg.controlFile));

    // OpenCode also keeps CLAUDE.md as fallback (OpenCode reads CLAUDE.md if no AGENTS.md)
    if (adapter === "opencode") {
      copyFile(path.join(ROOT, "CLAUDE.md"), path.join(adapterDir, ".opencode", "CLAUDE.md"));
    }

    // Sync EVOLUTION.md
    copyFile(path.join(ROOT, "EVOLUTION.md"), path.join(adapterDir, cfg.evolutionFile));

    console.log("");
  }

  console.log("✅ Sync complete");
}

main();
