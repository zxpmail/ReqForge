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

function main(): void {
  console.log("🔄 Syncing core -> adapters...\n");

  for (const [adapter, syncMap] of Object.entries(ADAPTERS)) {
    console.log(`📦 ${adapter}:`);

    for (const [src, dest] of Object.entries(syncMap)) {
      const srcPath = path.join(ROOT, src);
      const destPath = path.join(ROOT, "adapters", adapter, dest);
      syncDir(srcPath, destPath);
    }

    console.log("");
  }

  console.log("✅ Sync complete");
}

main();
