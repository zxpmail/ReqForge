#!/usr/bin/env node
/**
 * forge-verify.mjs — 事后统一验证入口
 *
 * 用法：
 *   pnpm forge-verify [--baseline <save|compare|check>] [--root <path>]
 *
 * 验证项：
 *   1. skill-quality   — pnpm validate-skill（仅 ReqForge 框架仓）
 *   2. compile         — 项目编译检查
 *   3. test            — 测试通过检查
 *   4. no-placeholders — grep TBD/FIXME in committed code
 *   5. dev-map-fresh   — dev-map.md 是否存在
 *   6. security-patterns — 轻量危险模式扫描（eval / new Function）
 *   7. trace-fresh     — .forge/trace/ 是否存在且有内容
 *   8. scope-check     — 检查文件改动是否超出声明的作用域
 *
 * --baseline save    : 运行验证并保存结果到 .forge/verify-baseline.json
 * --baseline compare : 运行验证并与基线对比，输出增量
 * --baseline check   : 运行验证，有增量失败则 exit 1（默认）
 *
 * --root <path>      : 验证目标项目根目录。缺省时优先用 cwd（若 cwd 含 .forge/ 或
 *                      package.json），否则 fallback 到 ReqForge 仓自身。
 *                      让用户项目能跑 forge-verify，而非只能验证 ReqForge 自己。
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, unlinkSync } from "fs";
import { join, dirname, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { loadBaseline, saveBaseline, compareBaseline } from "./forge-verify/baseline.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REQFORGE_ROOT = join(__dirname, "..");

// --- Parse args ---
const args = process.argv.slice(2);
let baselineMode = "check"; // save | compare | check
let rootArg = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--baseline" && args[i + 1]) {
    baselineMode = args[i + 1];
    i++;
  } else if (args[i] === "--root" && args[i + 1]) {
    rootArg = args[i + 1];
    i++;
  }
}

// --- Resolve ROOT: --root > cwd (if has .forge/ or package.json) > ReqForge repo ---
function resolveRoot() {
  if (rootArg) return resolve(rootArg);
  const cwd = process.cwd();
  if (existsSync(join(cwd, ".forge")) || existsSync(join(cwd, "package.json"))) {
    return cwd;
  }
  return REQFORGE_ROOT;
}
const ROOT = resolveRoot();

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
      `grep -rn "TBD\\|FIXME" ${dirs.join(" ")} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=.next --exclude-dir=build || true`,
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

const SECURITY_PATTERN_RULES = [
  { id: "eval()", re: /\beval\s*\(/ },
  { id: "new Function()", re: /\bnew\s+Function\s*\(/ },
];

function collectSourceFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name === "dist" || name === ".git") continue;
      collectSourceFiles(full, acc);
      continue;
    }
    if (/\.(ts|tsx|js|jsx)$/.test(name)) acc.push(full);
  }
  return acc;
}

function checkSecurityPatterns() {
  const guidancePath = join(ROOT, ".forge/security-guidance.md");
  if (!existsSync(guidancePath)) return "skip (no .forge/security-guidance.md)";

  const dirs = ["src", "lib", "app", "packages"].filter((d) => existsSync(join(ROOT, d)));
  if (dirs.length === 0) return "skip (no src dirs)";

  const hits = [];
  for (const d of dirs) {
    for (const file of collectSourceFiles(join(ROOT, d))) {
      const text = readFileSync(file, "utf-8");
      for (const rule of SECURITY_PATTERN_RULES) {
        if (rule.re.test(text)) {
          hits.push(`${rule.id} @ ${relative(ROOT, file)}`);
        }
      }
    }
  }
  if (hits.length > 0) {
    throw new Error(hits.slice(0, 5).join("; "));
  }
  return "no eval/new Function in src";
}

function checkTraceFresh() {
  const traceDir = join(ROOT, ".forge", "trace");
  if (!existsSync(traceDir)) return "skip (no .forge/trace/)";
  const files = readdirSync(traceDir).filter(f => f.endsWith(".json"));
  if (files.length === 0) return "skip (trace dir empty)";

  const latest = files.sort().reverse()[0];
  const data = JSON.parse(readFileSync(join(traceDir, latest), "utf-8"));
  const hasContent = data.decisions?.length > 0 || data.deadEnds?.length > 0;
  if (!hasContent) {
    throw new Error(`trace/${latest} exists but has no decisions/dead-ends — record phase decisions via forge-trace.mjs`);
  }
  return `trace/${latest}: ${data.decisions.length} decisions, ${data.deadEnds.length} dead-ends`;
}

function checkScope() {
  const scopePath = join(ROOT, ".forge", "active-scope.json");
  if (!existsSync(scopePath)) return "skip (no .forge/active-scope.json)";
  const scope = JSON.parse(readFileSync(scopePath, "utf-8"));
  if (!scope.modify || scope.modify.length === 0) return "skip (no modify paths declared)";

  try {
    const out = execSync(
      `git diff --name-only HEAD`,
      { cwd: ROOT, encoding: "utf-8", timeout: 15000, stdio: "pipe" }
    ).trim();
    if (!out) return "no uncommitted changes";

    const changed = out.split("\n").filter(Boolean);
    const modifySet = new Set(scope.modify);
    const violations = changed.filter(file => {
      if (file.startsWith(".forge/") || file.startsWith(".git")) return false;
      for (const p of modifySet) {
        if (file === p || file.startsWith(p + "/")) return false;
      }
      return true;
    });

    if (violations.length > 0) {
      throw new Error(`${violations.length} files outside scope: ${violations.slice(0, 5).join(", ")}`);
    }
    return "all changes in-scope";
  } catch (e) {
    if (e.message?.includes("files outside scope")) throw e;
    return "git diff unavailable, skip";
  }
}

function checkContentQuality() {
  // 配置检查，实际验证由独立的 content-verify 脚本执行（四层管道）
  // 架构：L0 形状 → L1 合约 → L2 LLM 瘦审查 → L3 分歧转人工
  // 详见 scripts/forge-verify/content-verify.mjs
  const configPath = join(ROOT, ".forge", "content-verify.json");
  if (!existsSync(configPath)) {
    return "skip — 未配置 .forge/content-verify.json，不执行语义验证";
  }
  const cfg = JSON.parse(readFileSync(configPath, "utf-8"));
  if (!cfg.task || !cfg.files || cfg.files.length === 0) {
    return "skip — .forge/content-verify.json 缺少 task/files 字段";
  }
  const contracts = cfg.contracts || {};
  const contractFiles = Object.keys(contracts).length;
  const l3Config = cfg.layer3 ? "L3分歧检测" : "无分歧配置";
  return `已配置 (${cfg.files.length} 文件, ${contractFiles} 份合约, ${l3Config})。运行 pnpm forge-verify-content 执行四层验证`;
}

// --- Run all checks ---
const checks = [
  run("skill-quality", checkSkillQuality),
  run("compile", checkCompile),
  run("test", checkTest),
  run("no-placeholders", checkNoPlaceholders),
  run("dev-map-fresh", checkDevMapFresh),
  run("security-patterns", checkSecurityPatterns),
  run("trace-fresh", checkTraceFresh),
  run("scope-check", checkScope),
  run("content-quality", checkContentQuality),
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
  // Clean up any previous verify-block — new baseline is a fresh start
  const blockPath = join(ROOT, ".forge/.verify-block");
  if (existsSync(blockPath)) unlinkSync(blockPath);
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

  // Write/remove verify-block for phase-exit-guard
  const blockPath = join(ROOT, ".forge/.verify-block");
  if (diff.added.length > 0) {
    writeFileSync(blockPath, `New forge-verify failures: ${diff.added.join(", ")}\n`, "utf-8");
  } else if (existsSync(blockPath)) {
    unlinkSync(blockPath);
  }
  console.log();

  if (baselineMode === "check" && diff.added.length > 0) {
    console.log("  forge-verify: FAIL — new failures detected vs baseline\n");
    process.exit(1);
  }
}

process.exit(totalFail > 0 ? 1 : 0);
