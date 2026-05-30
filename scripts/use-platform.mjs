#!/usr/bin/env node
/**
 * use-platform.mjs — Swap .claude/settings.json for current platform
 *
 * Usage:
 *   node scripts/use-platform.mjs              # auto-detect from process.platform
 *   node scripts/use-platform.mjs --unix       # force Unix (.sh hooks)
 *   node scripts/use-platform.mjs --windows    # force Windows (.bat hooks)
 *
 * Reads .claude/settings.{platform}.json and copies over .claude/settings.json.
 * Also updates adapters/claude-code/.claude/settings.json when run in forge root.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const forceWin = args.includes("--windows") || args.includes("-w");
const forceUnix = args.includes("--unix") || args.includes("-u");

let platform;
if (forceWin) platform = "windows";
else if (forceUnix) platform = "unix";
else platform = process.platform === "win32" ? "windows" : "unix";

const suffix = platform === "windows" ? "windows" : "unix";

function swapSettings(settingsDir, label) {
  const src = path.join(settingsDir, `settings.${suffix}.json`);
  const dest = path.join(settingsDir, "settings.json");

  if (!fs.existsSync(src)) {
    console.log(`  SKIP ${label}: settings.${suffix}.json not found`);
    return false;
  }

  fs.copyFileSync(src, dest);
  console.log(`  OK ${label}: ${src} → ${dest}`);
  return true;
}

console.log(`Platform: ${platform} (suffix: .${suffix})`);

// Repo root
swapSettings(path.join(ROOT, ".claude"), "forge root");

// Adapters
const adapterDirs = [
  "adapters/claude-code/.claude",
];
for (const rel of adapterDirs) {
  swapSettings(path.join(ROOT, rel), rel);
}

console.log("Done.");
