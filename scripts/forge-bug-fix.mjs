#!/usr/bin/env node
/**
 * forge-bug-fix.mjs — 调试-修复-验证循环自动化
 *
 * bug-fixer Skill 的机械辅助脚本：诊断、trace、bisect、分类、验证。
 *
 * 用法：
 *   pnpm forge-bug-fix diagnose            运行 preflight + 环境检查
 *   pnpm forge-bug-fix trace <name>        捕获调试 trace 到 .forge/trace/
 *   pnpm forge-bug-fix bisect <good> [bad] 自动 git bisect 定位首个故障提交
 *   pnpm forge-bug-fix classify [trace]    分类错误类型并给出建议
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
  pnpm forge-bug-fix diagnose             Run preflight + environment check
  pnpm forge-bug-fix trace <name>         Capture debug trace
  pnpm forge-bug-fix bisect <good> [bad]  Auto git bisect to find first bad commit
  pnpm forge-bug-fix classify [trace]     Classify error type from trace or current state
  pnpm forge-bug-fix verify               Run compile + test verification
  pnpm forge-bug-fix status               Show active bug contexts`);
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

function loadTrace(name) {
  if (!existsSync(TRACE_DIR)) return null;
  const files = readdirSync(TRACE_DIR).filter(f => f.startsWith(`bug-${name}`) && f.endsWith(".json"));
  if (files.length === 0) return null;
  const latest = files.sort().reverse()[0];
  return JSON.parse(readFileSync(join(TRACE_DIR, latest), "utf-8"));
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
  if (testCmd && !process.env.FORGE_QUICK) {
    try {
      const out = execSync(testCmd, { cwd: ROOT, encoding: "utf-8", timeout: 60000 });
      const match = out.match(/(\d+) passed.*?(\d+) failed/);
      testResult = match ? `${match[1]} passed, ${match[2]} failed` : "All tests passed";
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
      log: run("git log --oneline -10"),
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

// ─── Bisect ───────────────────────────────────────────────────────

function cmdBisect(goodCommit, badCommit) {
  if (!goodCommit) {
    console.error("Usage: pnpm forge-bug-fix bisect <good-commit> [bad-commit]");
    process.exit(1);
  }
  badCommit = badCommit || "HEAD";

  const testCmd = findTestCommand();
  if (!testCmd) {
    console.error("No test command found (pnpm-lock / package-lock / yarn-lock)");
    process.exit(1);
  }

  // Check worktree cleanliness
  const status = run("git status --short");
  if (status.length > 0) {
    console.error("Working tree is not clean. Stash or commit changes before bisect.");
    process.exit(1);
  }

  console.log(`=== Git Bisect ===`);
  console.log(`Good commit: ${goodCommit}`);
  console.log(`Bad commit:  ${badCommit}`);
  console.log(`Test cmd:    ${testCmd}\n`);

  // Ensure we're on the bad commit before starting
  run(`git checkout ${badCommit} 2>&1 || true`);

  try {
    const result = execSync(`git bisect start ${badCommit} ${goodCommit} 2>&1`, {
      cwd: ROOT, encoding: "utf-8", timeout: 10000,
    });
    console.log(result.trim());

    // Run bisect with test command
    console.log(`Running: git bisect run ${testCmd}\n`);
    const bisectOut = execSync(`git bisect run ${testCmd} 2>&1`, {
      cwd: ROOT, encoding: "utf-8", timeout: 600000,
    }).trim();
    console.log(bisectOut);

    // Save bisect result
    mkdirSync(TRACE_DIR, { recursive: true });
    const traceFile = join(TRACE_DIR, `bisect-${goodCommit.replace(/[^a-f0-9]/g, "_")}-${badCommit.replace(/[^a-f0-9]/g, "_")}-${Date.now().toString(36)}.json`);
    writeFileSync(traceFile, JSON.stringify({
      command: "bisect",
      good: goodCommit,
      bad: badCommit,
      testCommand: testCmd,
      result: bisectOut,
      timestamp: new Date().toISOString(),
    }, null, 2) + "\n", "utf-8");
    console.log(`\nBisect trace saved: ${traceFile}`);
  } catch (e) {
    console.error(`Bisect error: ${e.message}`);
    run("git bisect reset 2>&1");
    process.exit(1);
  }
}

// ─── Classify ─────────────────────────────────────────────────────

const ERROR_CLASSIFIERS = [
  {
    category: "compile",
    label: "TypeScript / 编译错误",
    patterns: [
      /TS\d+:/, /Cannot find name/, /is not assignable to type/,
      /Module (not found|'"')/, /SyntaxError/,
      /Cannot find module/, /not a module/,
    ],
    suggestion: "检查类型定义、import 路径、tsconfig 配置",
  },
  {
    category: "runtime",
    label: "运行时错误",
    patterns: [
      /TypeError/, /ReferenceError/, /RangeError/,
      /Cannot read propert/, /Cannot read properties/,
      /undefined is not/, /null is not/,
      /is not a function/, /is not defined/,
    ],
    suggestion: "检查空值访问、变量作用域、异步时序",
  },
  {
    category: "logic",
    label: "逻辑 / 断言失败",
    patterns: [
      /expected.*received/, /assertion failed/i,
      /AssertionError/, /Expected.*to equal/,
      /Expected.*to be/, /to contain/,
    ],
    suggestion: "断言不匹配 — 检查业务逻辑和边界条件",
  },
  {
    category: "data",
    label: "数据 / IO 错误",
    patterns: [
      /JSON\.parse/, /Unexpected token/,
      /ECONNREFUSED/, /ENOENT/, /EACCES/,
      /ETIMEOUT/, /ECONNRESET/,
      /socket hang up/, /request failed/i,
    ],
    suggestion: "数据解析错误或网络/文件系统异常",
  },
  {
    category: "compile",
    label: "依赖 / 打包错误",
    patterns: [
      /Module not found/, /Cannot resolve/,
      /Missing dependency/, /peer dep/,
    ],
    suggestion: "检查依赖安装状态和版本兼容性",
  },
];

const SEVERITY_PATTERNS = [
  { level: "fatal", patterns: [/FATAL/i, /PANIC/i, /Segmentation fault/i] },
  { level: "error", patterns: [/error/i, /Error/, /FAIL/i] },
  { level: "warning", patterns: [/warning/i, /WARN/i, /deprecated/i] },
];

function classifyErrors(input) {
  const lines = input.split("\n");
  const matches = [];

  for (const classifier of ERROR_CLASSIFIERS) {
    for (const pattern of classifier.patterns) {
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          matches.push({
            ...classifier,
            matchedLine: lines[i].trim(),
            lineNumber: i + 1,
          });
          break; // one match per classifier per pass
        }
      }
    }
  }

  // Deduplicate by category
  const seen = new Set();
  const unique = [];
  for (const m of matches) {
    const key = `${m.category}:${m.matchedLine.slice(0, 80)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(m);
    }
  }

  return unique;
}

function classifySeverity(input) {
  for (const s of SEVERITY_PATTERNS) {
    for (const p of s.patterns) {
      if (p.test(input)) return s.level;
    }
  }
  return "unknown";
}

function cmdClassify(traceName) {
  console.log("=== Error Classification ===\n");

  let input = "";

  if (traceName) {
    // Load from trace
    const trace = loadTrace(traceName);
    if (!trace) {
      console.error(`Trace "${traceName}" not found in .forge/trace/`);
      process.exit(1);
    }
    input = JSON.stringify(trace, null, 2);
    console.log(`Source: trace "${traceName}" (${trace.captured_at})\n`);
  } else {
    // Capture current state: test output + tsc output
    console.log("Source: current working state\n");

    // Try to get test output
    const testCmd = findTestCommand();
    if (testCmd && !process.env.FORGE_QUICK) {
      try {
        input = execSync(testCmd, { cwd: ROOT, encoding: "utf-8", timeout: 60000 });
      } catch (e) {
        input = e.stdout || e.message || "";
      }
    }

    // Append tsc output if available
    if (existsSync(join(ROOT, "tsconfig.json"))) {
      const tscOut = run("npx tsc --noEmit 2>&1 || true");
      if (tscOut.includes("error")) {
        input += "\n" + tscOut;
      }
    }
  }

  // Classify
  const severity = classifySeverity(input);
  const errors = classifyErrors(input);

  console.log(`Severity: ${severity.toUpperCase()}\n`);

  if (errors.length === 0) {
    console.log("No recognizable error patterns found.");
    return;
  }

  // Group by category
  const grouped = {};
  for (const e of errors) {
    if (!grouped[e.category]) grouped[e.category] = [];
    grouped[e.category].push(e);
  }

  console.log(`Found ${errors.length} error signal(s) across ${Object.keys(grouped).length} category(ies):\n`);

  for (const [category, items] of Object.entries(grouped)) {
    console.log(`  [${items[0].label}]`);
    console.log(`    → ${items[0].suggestion}`);
    for (const item of items.slice(0, 3)) {
      console.log(`    · ${item.matchedLine.slice(0, 100)}`);
    }
    console.log("");
  }

  // Summary recommendation
  const primary = errors[0];
  console.log("=== Recommendation ===");
  console.log(`  Primary category: ${primary.label}`);
  console.log(`  Suggested action: ${primary.suggestion}`);
  console.log(`  First signal:     ${primary.matchedLine.slice(0, 80)}`);
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
    .filter(f => (f.startsWith("bug-") || f.startsWith("bisect-")) && f.endsWith(".json"))
    .sort()
    .reverse();

  if (traces.length === 0) {
    console.log("No bug traces found.");
    return;
  }

  const bugTraces = traces.filter(f => f.startsWith("bug-"));
  const bisectTraces = traces.filter(f => f.startsWith("bisect-"));

  if (bugTraces.length > 0) {
    console.log(`Bug traces (${bugTraces.length}):\n`);
    for (const t of bugTraces.slice(0, 10)) {
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
  }

  if (bisectTraces.length > 0) {
    console.log(`Bisect results (${bisectTraces.length}):\n`);
    for (const t of bisectTraces.slice(0, 5)) {
      try {
        const data = JSON.parse(readFileSync(join(TRACE_DIR, t), "utf-8"));
        const result = data.result || "";
        const firstBad = result.match(/is the first bad commit/);
        console.log(`  ${t}`);
        console.log(`    Range: ${data.good?.slice(0, 8)}..${data.bad?.slice(0, 8)}`);
        if (firstBad) {
          const lines = result.split("\n");
          const idx = lines.findIndex(l => l.includes("is the first bad commit"));
          console.log(`    First bad: ${lines[Math.max(0, idx - 1)]?.trim().slice(0, 60)}`);
        }
        console.log(`    At:    ${data.timestamp?.slice(0, 19)}`);
      } catch {
        console.log(`  ${t} (unreadable)`);
      }
      console.log("");
    }
  }
}

// ─── Dispatch ─────────────────────────────────────────────────────

try {
  if (cmd === "diagnose") cmdDiagnose();
  else if (cmd === "trace") cmdTrace(args[1]);
  else if (cmd === "bisect") cmdBisect(args[1], args[2]);
  else if (cmd === "classify") cmdClassify(args[1]);
  else if (cmd === "verify") cmdVerify();
  else if (cmd === "status") cmdStatus();
  else usage();
} catch (e) {
  console.error(`forge-bug-fix error: ${e.message}`);
  process.exit(1);
}
