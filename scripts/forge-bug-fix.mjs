#!/usr/bin/env node
/**
 * forge-bug-fix.mjs — 调试-修复-验证循环自动化
 *
 * bug-fixer Skill 的机械辅助脚本：诊断、trace、验证。
 *
 * 用法：
 *   pnpm forge-bug-fix diagnose            运行 preflight + 环境检查
 *   pnpm forge-bug-fix trace <name>        捕获调试 trace 到 .forge/trace/
 *   pnpm forge-bug-fix verify              编译 + 测试验证
 *   pnpm forge-bug-fix status              当前调试上下文概览
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TRACE_DIR = join(ROOT, ".forge", "trace");

const args = process.argv.slice(2);
const cmd = args[0];

function usage() {
  console.log(`Usage:
  pnpm forge-bug-fix diagnose           Run preflight + environment check
  pnpm forge-bug-fix trace <name>       Capture debug trace
  pnpm forge-bug-fix verify             Run compile + test verification
  pnpm forge-bug-fix status             Show active bug contexts`);
  process.exit(1);
}

if (!cmd) usage();

// ─── Helpers ──────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf-8", timeout: 30000, ...opts }).trim();
  } catch (e) {
    return e.stderr?.trim() || e.message;
  }
}

function findTestCommand() {
  if (existsSync(join(ROOT, "pnpm-lock.yaml"))) return "pnpm test";
  if (existsSync(join(ROOT, "package-lock.json"))) return "npm test";
  if (existsSync(join(ROOT, "yarn.lock"))) return "yarn test";
  return null;
}

// ─── Diagnose ─────────────────────────────────────────────────────

function cmdDiagnose() {
  console.log("=== Bug Diagnose ===\n");

  // 1. Check git status
  const gitStatus = run("git status --short");
  const hasChanges = gitStatus.length > 0;
  console.log(`[Git] ${hasChanges ? "Uncommitted changes" : "Clean"}`);
  if (hasChanges) {
    console.log(gitStatus.split("\n").slice(0, 10).map(l => `  ${l}`).join("\n"));
  }

  // 2. Check test status
  const testCmd = findTestCommand();
  let testResult = "unknown";
  let testPass = false;
  if (testCmd && !process.env.FORGE_QUICK) {
    try {
      const out = execSync(testCmd, { cwd: ROOT, encoding: "utf-8", timeout: 60000 });
      testPass = !out.includes("FAIL");
      testResult = testPass ? "All tests passed" : "Some tests failed";
      const match = out.match(/(\d+) passed.*?(\d+) failed/);
      if (match) testResult = `${match[1]} passed, ${match[2]} failed`;
    } catch (e) {
      const out = e.stdout || "";
      const match = out.match(/(\d+) passed.*?(\d+) failed/);
      testResult = match ? `${match[1]} passed, ${match[2]} failed` : "Tests failed";
    }
  }
  console.log(`[Tests] ${testResult}`);

  // 3. Check TypeScript compilation
  if (existsSync(join(ROOT, "tsconfig.json"))) {
    const tscResult = run("npx tsc --noEmit 2>&1 || true");
    const hasErrors = tscResult.includes("error");
    console.log(`[TSC]   ${hasErrors ? `Errors found (${tscResult.split("error").length - 1})` : "Clean compilation"}`);
    if (hasErrors) {
      const lines = tscResult.split("\n").filter(l => l.includes("error")).slice(0, 5);
      for (const l of lines) console.log(`  ${l.trim()}`);
    }
  }

  // 4. Check last commit
  const lastCommit = run("git log -1 --oneline");
  console.log(`[Git]   Last commit: ${lastCommit}`);

  // 5. Check for recent forge traces
  if (existsSync(TRACE_DIR)) {
    const traces = readdirSync(TRACE_DIR).filter(f => f.endsWith(".json"));
    if (traces.length > 0) {
      console.log(`[Trace] ${traces.length} trace(s) available`);
      for (const t of traces.slice(-3)) {
        console.log(`  ${t}`);
      }
    }
  }

  console.log("\nDiagnose complete.");
}

// ─── Trace ────────────────────────────────────────────────────────

function cmdTrace(name) {
  if (!name) { console.error("Usage: pnpm forge-bug-fix trace <name>"); process.exit(1); }

  mkdirSync(TRACE_DIR, { recursive: true });

  const trace = {
    name,
    captured_at: new Date().toISOString(),
    git: {
      commit: run("git rev-parse HEAD"),
      branch: run("git rev-parse --abbrev-ref HEAD"),
      status: run("git status --short"),
    },
    env: {
      node: process.version,
      platform: process.platform,
    },
  };

  const traceFile = join(TRACE_DIR, `bug-${name}-${Date.now().toString(36)}.json`);
  writeFileSync(traceFile, JSON.stringify(trace, null, 2) + "\n", "utf-8");
  console.log(`Trace captured: ${traceFile}`);
}

// ─── Verify ───────────────────────────────────────────────────────

function cmdVerify() {
  console.log("=== Bug Fix Verify ===\n");

  const testCmd = findTestCommand();
  let allPass = true;

  // 1. TypeScript compile check
  if (existsSync(join(ROOT, "tsconfig.json"))) {
    console.log("[1/3] TypeScript compilation...");
    try {
      execSync("npx tsc --noEmit", { cwd: ROOT, encoding: "utf-8", timeout: 30000 });
      console.log("  ✅ TypeScript compilation passed");
    } catch (e) {
      console.log("  ❌ TypeScript compilation failed");
      const lines = (e.stdout || "").split("\n").filter(l => l.includes("error")).slice(0, 5);
      for (const l of lines) console.log(`     ${l.trim()}`);
      allPass = false;
    }
  }

  // 2. Tests
  if (testCmd) {
    console.log(`[2/3] Running tests (${testCmd})...`);
    try {
      const out = execSync(testCmd, { cwd: ROOT, encoding: "utf-8", timeout: 120000 });
      const match = out.match(/(\d+) passed.*?(\d+) failed/);
      if (match) {
        console.log(`  ✅ Tests: ${match[0]}`);
      } else {
        console.log("  ✅ All tests passed");
      }
    } catch (e) {
      const out = e.stdout || "";
      const match = out.match(/(\d+) passed.*?(\d+) failed/);
      if (match) {
        console.log(`  ❌ Tests: ${match[0]}`);
      } else {
        console.log("  ❌ Tests failed");
      }
      allPass = false;
    }
  }

  // 3. Git status
  console.log("[3/3] Checking for uncommitted fixes...");
  const gitStatus = run("git status --short");
  if (gitStatus.length > 0) {
    console.log("  ⚠️  Uncommitted changes:");
    console.log(gitStatus.split("\n").map(l => `     ${l}`).join("\n"));
  } else {
    console.log("  ✅ Working tree clean");
  }

  console.log(`\n=== Verify ${allPass ? "PASSED ✅" : "FAILED ❌"} ===`);
  process.exit(allPass ? 0 : 1);
}

// ─── Status ───────────────────────────────────────────────────────

function cmdStatus() {
  console.log("=== Bug Fix Status ===\n");

  if (!existsSync(TRACE_DIR)) {
    console.log("No traces found.");
    return;
  }

  const traces = readdirSync(TRACE_DIR)
    .filter(f => f.startsWith("bug-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (traces.length === 0) {
    console.log("No bug traces found.");
    return;
  }

  console.log(`Recent bug traces (${traces.length} total):\n`);
  for (const t of traces.slice(0, 10)) {
    try {
      const data = JSON.parse(readFileSync(join(TRACE_DIR, t), "utf-8"));
      console.log(`  ${t}`);
      console.log(`    Bug: ${data.name}`);
      console.log(`    At:  ${data.captured_at?.slice(0, 19)}`);
      console.log(`    Git: ${data.git?.commit?.slice(0, 8)} on ${data.git?.branch}`);
    } catch {
      console.log(`  ${t} (unreadable)`);
    }
    console.log("");
  }

  // Check current test status (skip in CI/quick mode)
  const testCmd = findTestCommand();
  if (testCmd && !process.env.FORGE_QUICK) {
    const testOut = run(`${testCmd} 2>&1 || true`);
    const match = testOut.match(/(\d+) passed.*?(\d+) failed/);
    if (match) {
      console.log(`Current test status: ${match[0]}`);
    }
  }
}

// ─── Dispatch ─────────────────────────────────────────────────────

try {
  if (cmd === "diagnose") cmdDiagnose();
  else if (cmd === "trace") cmdTrace(args[1]);
  else if (cmd === "verify") cmdVerify();
  else if (cmd === "status") cmdStatus();
  else usage();
} catch (e) {
  console.error(`forge-bug-fix error: ${e.message}`);
  process.exit(1);
}
