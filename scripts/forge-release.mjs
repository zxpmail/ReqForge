#!/usr/bin/env node
/**
 * forge-release.mjs — 发布自动化
 *
 * 用法：
 *   pnpm forge-release version [patch|minor|major]    # 升级版本号
 *   pnpm forge-release changelog                       # 从 git log 生成 CHANGELOG.md
 *   pnpm forge-release tag                             # 创建 git tag + push --tags
 *   pnpm forge-release check [--no-build]              # 发布前检查清单
 *   pnpm forge-release full [patch|minor|major]        # 全自动流水线
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const args = process.argv.slice(2);
const cmd = args[0];

function usage() {
  console.log(`Usage:
  pnpm forge-release version [patch|minor|major]
  pnpm forge-release changelog
  pnpm forge-release tag
  pnpm forge-release check [--no-build]
  pnpm forge-release full [patch|minor|major]`);
  process.exit(1);
}

if (!cmd) usage();

// ─── Version ───────────────────────────────────────────────────────

function readVersion() {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
  return pkg.version;
}

function writeVersion(newVersion) {
  const pkgPath = join(ROOT, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
}

function bumpVersion(current, type) {
  const parts = current.split(".").map(Number);
  if (parts.length !== 3) throw new Error(`Invalid semver: ${current}`);
  if (type === "major") { parts[0]++; parts[1] = 0; parts[2] = 0; }
  else if (type === "minor") { parts[1]++; parts[2] = 0; }
  else if (type === "patch") { parts[2]++; }
  else throw new Error(`Unknown bump type: ${type}. Use patch|minor|major`);
  return parts.join(".");
}

function cmdVersion(bump) {
  if (!bump || !["patch", "minor", "major"].includes(bump)) {
    console.error(`Usage: pnpm forge-release version [patch|minor|major]`);
    process.exit(1);
  }
  const current = readVersion();
  const next = bumpVersion(current, bump);
  writeVersion(next);
  console.log(`${current} → ${next}`);
}

// ─── Changelog ─────────────────────────────────────────────────────

function cmdChangelog() {
  const version = readVersion();

  // Find last tag
  let lastTag = "";
  try {
    lastTag = execSync("git describe --tags --abbrev=0", { cwd: ROOT, encoding: "utf-8", timeout: 15000 }).trim();
  } catch {
    lastTag = "";
  }

  // Get log since last tag
  const range = lastTag ? `${lastTag}..HEAD` : "HEAD";
  let log = "";
  try {
    log = execSync(`git log --oneline "${range}"`, { cwd: ROOT, encoding: "utf-8", timeout: 15000 }).trim();
  } catch {
    log = "";
  }

  if (!log) {
    console.log("No new commits since last tag.");
    return;
  }

  const lines = log.split("\n").map(l => l.replace(/^[0-9a-f]+\s+/, "- ")).join("\n");
  const date = new Date().toISOString().slice(0, 10);
  const entry = `## [${version}] - ${date}\n\n${lines}\n\n`;

  const changelogPath = join(ROOT, "CHANGELOG.md");
  const existing = existsSync(changelogPath) ? readFileSync(changelogPath, "utf-8") : "";
  writeFileSync(changelogPath, entry + existing, "utf-8");
  console.log(`CHANGELOG.md updated for v${version} (${lines.split("\n").length} entries)`);
}

// ─── Tag ───────────────────────────────────────────────────────────

function cmdTag() {
  const version = readVersion();
  const tag = `v${version}`;

  // Check if tag already exists
  try {
    const existing = execSync(`git tag --list "${tag}"`, { cwd: ROOT, encoding: "utf-8", timeout: 15000 }).trim();
    if (existing) {
      console.log(`Tag ${tag} already exists.`);
      return;
    }
  } catch {}

  execSync(`git tag "${tag}"`, { cwd: ROOT, encoding: "utf-8", timeout: 15000 });
  execSync(`git push --tags`, { cwd: ROOT, encoding: "utf-8", timeout: 60000, stdio: "pipe" });
  console.log(`Tagged and pushed: ${tag}`);
}

// ─── Check ─────────────────────────────────────────────────────────

function cmdCheck() {
  const noBuild = args.includes("--no-build");
  const version = readVersion();
  const checks = [];

  // 1. Git workspace clean
  try {
    const status = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf-8", timeout: 15000 }).trim();
    checks.push({ name: "Git workspace clean", ok: !status, detail: status ? `${status.split("\n").length} uncommitted` : "clean" });
  } catch {
    checks.push({ name: "Git workspace clean", ok: false, detail: "error" });
  }

  // 2. Build
  if (!noBuild) {
    try {
      execSync("pnpm build", { cwd: ROOT, encoding: "utf-8", timeout: 120000, stdio: ["pipe", "pipe", "pipe"] });
      checks.push({ name: "Build", ok: true, detail: "passed" });
    } catch {
      checks.push({ name: "Build", ok: false, detail: "failed" });
    }
  }

  // 3. CHANGELOG for current version
  const changelogPath = join(ROOT, "CHANGELOG.md");
  if (existsSync(changelogPath)) {
    const cl = readFileSync(changelogPath, "utf-8");
    checks.push({ name: "CHANGELOG updated", ok: cl.includes(`[${version}]`), detail: cl.includes(`[${version}]`) ? `v${version} found` : `v${version} not found` });
  } else {
    checks.push({ name: "CHANGELOG updated", ok: false, detail: "CHANGELOG.md missing" });
  }

  // 4. Tests (lightweight — vitest run)
  try {
    execSync("pnpm test", { cwd: ROOT, encoding: "utf-8", timeout: 120000, stdio: ["pipe", "pipe", "pipe"] });
    checks.push({ name: "Tests", ok: true, detail: "passed" });
  } catch {
    checks.push({ name: "Tests", ok: false, detail: "failed" });
  }

  // Summary
  console.log(`\nRelease check for v${version}:`);
  console.log("");
  for (const c of checks) {
    console.log(`  ${c.ok ? "✅" : "❌"} ${c.name} — ${c.detail}`);
  }
  console.log("");
  const allOk = checks.every(c => c.ok);
  console.log(allOk ? "✅ All checks passed — ready to release." : "❌ Some checks failed — fix before releasing.");
  process.exit(allOk ? 0 : 1);
}

// ─── Full ──────────────────────────────────────────────────────────

function cmdFull(bump) {
  if (!bump || !["patch", "minor", "major"].includes(bump)) {
    console.error(`Usage: pnpm forge-release full [patch|minor|major]`);
    process.exit(1);
  }

  console.log("═══════════════════════════════════════");
  console.log("  forge-release full pipeline");
  console.log("═══════════════════════════════════════\n");

  // Step 1: Version bump
  console.log("▸ Version bump...");
  const current = readVersion();
  const next = bumpVersion(current, bump);
  writeVersion(next);
  console.log(`  ${current} → ${next}\n`);

  // Step 2: Changelog
  console.log("▸ Changelog...");
  const version = readVersion();
  let lastTag = "";
  try {
    lastTag = execSync("git describe --tags --abbrev=0", { cwd: ROOT, encoding: "utf-8", timeout: 15000 }).trim();
  } catch { lastTag = ""; }
  const range = lastTag ? `${lastTag}..HEAD` : "HEAD";
  let log = "";
  try { log = execSync(`git log --oneline "${range}"`, { cwd: ROOT, encoding: "utf-8", timeout: 15000 }).trim(); } catch { log = ""; }
  if (log) {
    const lines = log.split("\n").map(l => l.replace(/^[0-9a-f]+\s+/, "- ")).join("\n");
    const date = new Date().toISOString().slice(0, 10);
    const entry = `## [${version}] - ${date}\n\n${lines}\n\n`;
    const changelogPath = join(ROOT, "CHANGELOG.md");
    const existing = existsSync(changelogPath) ? readFileSync(changelogPath, "utf-8") : "";
    writeFileSync(changelogPath, entry + existing, "utf-8");
    console.log(`  CHANGELOG.md updated (${lines.split("\n").length} entries)\n`);
  } else {
    console.log("  No new commits, skipping changelog\n");
  }

  // Step 3: Tag
  console.log("▸ Tag...");
  const tag = `v${version}`;
  try {
    const existing = execSync(`git tag --list "${tag}"`, { cwd: ROOT, encoding: "utf-8", timeout: 15000 }).trim();
    if (existing) {
      console.log(`  Tag ${tag} already exists, skipping\n`);
    } else {
      execSync(`git tag "${tag}"`, { cwd: ROOT, encoding: "utf-8", timeout: 15000 });
      execSync(`git push --tags`, { cwd: ROOT, encoding: "utf-8", timeout: 60000, stdio: "pipe" });
      console.log(`  Tagged and pushed: ${tag}\n`);
    }
  } catch (e) {
    console.error(`  Tag failed: ${e.message?.split("\n")[0]}\n`);
  }

  console.log("═══════════════════════════════════════");
  console.log(`  Release v${version} ready.`);
  console.log("═══════════════════════════════════════");
}

// ─── Dispatch ──────────────────────────────────────────────────────

try {
  if (cmd === "version") cmdVersion(args[1]);
  else if (cmd === "changelog") cmdChangelog();
  else if (cmd === "tag") cmdTag();
  else if (cmd === "check") cmdCheck();
  else if (cmd === "full") cmdFull(args[1]);
  else usage();
} catch (e) {
  console.error(`forge-release error: ${e.message}`);
  process.exit(1);
}
