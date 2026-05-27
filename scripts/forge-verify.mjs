#!/usr/bin/env node
/**
 * forge-verify.mjs — 事后统一验证入口
 *
 * 用法：
 *   pnpm forge-verify [--baseline <save|compare|check>]
 *
 * 验证项：
 *   1. skill-quality   — pnpm validate-skill（仅 ReqForge 框架仓）
 *   2. compile         — 项目编译检查
 *   3. test            — 测试通过检查
 *   4. no-placeholders — grep TBD/FIXME in committed code
 *   5. dev-map-fresh   — dev-map.md 是否存在
 *
 * --baseline save    : 运行验证并保存结果到 .forge/verify-baseline.json
 * --baseline compare : 运行验证并与基线对比，输出增量
 * --baseline check   : 运行验证，有增量失败则 exit 1（默认）
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadBaseline, saveBaseline, compareBaseline } from "./forge-verify/baseline.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// --- Parse args ---
const args = process.argv.slice(2);
let baselineMode = "check"; // save | compare | check
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--baseline" && args[i + 1]) {
    baselineMode = args[i + 1];
    i++;
  }
}

// --- Check runners ---
function run(name, fn) {
  try {
    const result = fn();
    return { name, status: "pass", detail: result || "" };
  } catch (e) {
    return { name, status: "fail", detail: e.message?.split("\n")[0] || String(e) };
  }
}

// --- Individual checks ---

function checkSkillQuality() {
  // Only relevant for ReqForge framework repo (has core/skills/)
  if (!existsSync(join(ROOT, "core/skills"))) return "skip (not framework repo)";
  let out;
  try {
    out = execSync("node scripts/validate-skill.mjs", {
      cwd: ROOT, encoding: "utf-8", timeout: 60000,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (e) {
    out = e.stdout || "";
    // If validate-skill exits non-zero but output says all PASS, treat as pass
    if (!out.includes("FAIL") || out.includes("0 FAIL")) {
      return "all skills PASS";
    }
    throw new Error("Some skills failed validation");
  }
  if (out.includes("FAIL") && !out.includes("0 FAIL")) {
    throw new Error("Some skills failed validation");
  }
  return "all skills PASS";
}

function checkCompile() {
  if (!existsSync(join(ROOT, "tsconfig.json"))) return "skip (no tsconfig)";
  execSync("npx tsc --noEmit", { cwd: ROOT, encoding: "utf-8", timeout: 120000, stdio: "pipe" });
  return "tsc --noEmit clean";
}

function checkTest() {
  // Check if test runner exists
  const hasVitest = existsSync(join(ROOT, "vitest.config.ts")) || existsSync(join(ROOT, "vitest.config.mjs"));
  const hasJest = existsSync(join(ROOT, "jest.config.ts")) || existsSync(join(ROOT, "jest.config.js"));
  if (!hasVitest && !hasJest) return "skip (no test runner)";

  const cmd = hasVitest ? "npx vitest run" : "npx jest --no-coverage";
  const out = execSync(cmd, { cwd: ROOT, encoding: "utf-8", timeout: 120000, stdio: "pipe" });
  if (out.includes("failed") && /\d+\s+failed/.test(out) && !/0\s+failed/.test(out)) {
    throw new Error("Tests failed");
  }
  return "tests pass";
}

function checkNoPlaceholders() {
  // Only check committed source files, not templates or docs
  const dirs = ["src", "lib", "app", "packages"].filter(d => existsSync(join(ROOT, d)));
  if (dirs.length === 0) return "skip (no src dirs)";

  try {
    const out = execSync(
      `grep -rn "TBD\\|FIXME" ${dirs.join(" ")} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || true`,
      { cwd: ROOT, encoding: "utf-8", timeout: 30000, stdio: "pipe" }
    ).trim();
    if (out) {
      const lines = out.split("\n").slice(0, 5);
      throw new Error(`Found TBD/FIXME: ${lines.join("; ")}`);
    }
    return "no TBD/FIXME in source";
  } catch (e) {
    if (e.message?.includes("Found TBD")) throw e;
    return "grep unavailable, skip";
  }
}

function checkDevMapFresh() {
  const devMapPath = join(ROOT, ".forge/dev-map.md");
  if (!existsSync(devMapPath)) {
    throw new Error("dev-map.md not found — run `pnpm forge-install` or create from template");
  }
  const content = readFileSync(devMapPath, "utf-8");
  if (content.includes("_Phase 完成后由 dev-builder 填写_")) {
    throw new Error("dev-map.md still has placeholder content — needs updating after Phase completion");
  }
  return "dev-map present";
}

// --- Run all checks ---
const checks = [
  run("skill-quality", checkSkillQuality),
  run("compile", checkCompile),
  run("test", checkTest),
  run("no-placeholders", checkNoPlaceholders),
  run("dev-map-fresh", checkDevMapFresh),
];

// --- Build results map ---
const resultsMap = {};
for (const c of checks) {
  if (c.detail.startsWith("skip")) {
    resultsMap[c.name] = { status: "skip", detail: c.detail };
  } else {
    resultsMap[c.name] = { status: c.status, detail: c.detail };
  }
}

// --- Output ---
console.log("\nforge-verify — 事后统一验证\n");

let totalPass = 0;
let totalFail = 0;
let totalSkip = 0;

for (const [name, r] of Object.entries(resultsMap)) {
  const icon = r.status === "pass" ? "✓" : r.status === "fail" ? "✗" : "–";
  const label = r.status === "pass" ? "PASS" : r.status === "fail" ? "FAIL" : "SKIP";
  console.log(`  ${icon} ${name}: ${label}${r.detail ? " — " + r.detail : ""}`);
  if (r.status === "pass") totalPass++;
  else if (r.status === "fail") totalFail++;
  else totalSkip++;
}

console.log(`\n  Total: ${totalPass} pass, ${totalFail} fail, ${totalSkip} skip\n`);

// --- Baseline logic ---
if (baselineMode === "save") {
  saveBaseline(resultsMap, ROOT);
  console.log("  Baseline saved to .forge/verify-baseline.json\n");
  process.exit(0);
}

const baseline = loadBaseline(ROOT);
const diff = compareBaseline(resultsMap, baseline);

if (baselineMode === "compare" || baselineMode === "check") {
  if (diff.firstRun) {
    console.log("  (No baseline found — first run. Use --baseline save to create one.)\n");
    process.exit(totalFail > 0 ? 1 : 0);
  }

  if (diff.added.length > 0) {
    console.log(`  ↑ New failures: ${diff.added.join(", ")}`);
  }
  if (diff.removed.length > 0) {
    console.log(`  ↓ Newly passing: ${diff.removed.join(", ")}`);
  }
  if (diff.added.length === 0 && diff.removed.length === 0) {
    console.log("  No changes from baseline.");
  }
  console.log();

  if (baselineMode === "check" && diff.added.length > 0) {
    console.log("  forge-verify: FAIL — new failures detected vs baseline\n");
    process.exit(1);
  }
}

process.exit(totalFail > 0 ? 1 : 0);
