#!/usr/bin/env node
/**
 * forge-bug-fix.mjs — 调试-修复-验证循环自动化
 *
 * bug-fixer Skill 的机械辅助脚本：诊断、trace、bisect、分类、验证。
 *
 * 用法：
 *   pnpm forge-bug-fix diagnose                       运行通用 preflight + 环境检查
 *   pnpm forge-bug-fix diagnose --scenario compile    编译错误专项诊断
 *   pnpm forge-bug-fix diagnose --scenario config     环境配置专项诊断
 *   pnpm forge-bug-fix diagnose --scenario data       数据不一致专项诊断
 *   pnpm forge-bug-fix trace <name>                   捕获调试 trace 到 .forge/trace/
 *   pnpm forge-bug-fix bisect <good> [bad]            自动 git bisect 定位首个故障提交
 *   pnpm forge-bug-fix classify [trace]               分类错误类型并给出建议
 *   pnpm forge-bug-fix verify                         编译 + 测试验证
 *   pnpm forge-bug-fix status                         当前调试上下文概览
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { tryCompile } from "./lib/compile-check.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TRACE_DIR = join(ROOT, ".forge", "trace");

const args = process.argv.slice(2);
const cmd = args[0];

function usage() {
  console.log(`Usage:
  pnpm forge-bug-fix diagnose                       Run generic preflight + env check
  pnpm forge-bug-fix diagnose --scenario compile    Compile-specific diagnostics
  pnpm forge-bug-fix diagnose --scenario config     Config-specific diagnostics
  pnpm forge-bug-fix diagnose --scenario data       Data-specific diagnostics
  pnpm forge-bug-fix trace <name>                   Capture debug trace
  pnpm forge-bug-fix bisect <good> [bad]            Auto git bisect to find first bad commit
  pnpm forge-bug-fix classify [trace]               Classify error type from trace or current state
  pnpm forge-bug-fix verify                         Run compile + test verification
  pnpm forge-bug-fix status                         Show active bug contexts`);
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

/** Language-aware compile probe (shared with forge-verify). */
function runCompileProbe() {
  return tryCompile(ROOT);
}

/** Best-effort command; swallow failure (replaces shell `cmd || true`). */
function runOptional(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf-8", timeout: 30000, stdio: "pipe", ...opts }).trim();
  } catch {
    return "";
  }
}

/** Portable recursive file finder — walks dirs matching extensions. Works on all platforms. */
function findFiles(dir, extensions, maxFiles = 100) {
  const results = [];
  const fullDir = join(ROOT, dir);
  if (!existsSync(fullDir)) return results;
  const queue = [fullDir];
  while (queue.length > 0 && results.length < maxFiles) {
    const current = queue.shift();
    try {
      const entries = readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        if (results.length >= maxFiles) break;
        const fullPath = join(current, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
          queue.push(fullPath);
        } else if (entry.isFile()) {
          if (extensions.length === 0 || extensions.includes(extname(entry.name))) {
            results.push(fullPath);
          }
        }
      }
    } catch { /* skip inaccessible dirs */ }
  }
  return results;
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
      // Weld: keep stderr so a failed test run carries its real reason.
      const out = `${e.stdout || ""}\n${e.stderr || ""}`;
      const match = out.match(/(\d+) passed.*?(\d+) failed/);
      testResult = match ? `${match[1]} passed, ${match[2]} failed` : `Tests failed: ${(e.stderr || e.message || "no output").trim().split("\n")[0]}`;
    }
  }
  console.log(`[Tests] ${testResult}`);

  // 3. Language-aware compile
  {
    const probe = runCompileProbe();
    if (probe.skipped) {
      console.log(`[Compile] ${probe.detail}`);
    } else if (probe.ok) {
      console.log(`[Compile] ${probe.detail}`);
    } else {
      console.log(`[Compile] failed`);
      const lines = probe.output.split("\n").filter(Boolean).slice(0, 5);
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

// ─── Scenario-specific diagnostics ────────────────────────────────

function cmdDiagnoseScenario(scenario) {
  const scenarios = { compile, config, data };
  if (!scenarios[scenario]) {
    console.error(`Unknown scenario: "${scenario}". Valid: compile, config, data`);
    process.exit(1);
  }
  scenarios[scenario]();
}

function compile() {
  console.log("=== Compile Diagnostic ===\n");

  // 1. tsconfig.json check
  const tsconfigPath = join(ROOT, "tsconfig.json");
  if (!existsSync(tsconfigPath)) {
    console.log("  [tsconfig] Not found — skipping TypeScript checks\n");
    console.log("Diagnose complete.");
    return;
  }
  console.log("[1/4] tsconfig.json...");
  try {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
    const target = tsconfig.compilerOptions?.target || "unknown";
    const strict = tsconfig.compilerOptions?.strict ?? "not set";
    console.log(`  Target: ${target}`);
    console.log(`  Strict: ${strict}`);
    if (strict !== true) {
      console.log("  ⚠️  strict mode not enabled — type errors may slip through");
    }
  } catch {
    console.log("  ❌ Invalid JSON in tsconfig.json");
  }

  // 2. Language-aware compilation
  console.log("\n[2/4] Compile (language-aware)...");
  {
    const probe = runCompileProbe();
    if (probe.skipped) {
      console.log(`  ⚠️  ${probe.detail}`);
    } else if (probe.ok) {
      console.log(`  ✅ ${probe.detail}`);
    } else {
      console.log("  ❌ compile failed");
      const lines = probe.output.split("\n").filter(Boolean).slice(0, 8);
      for (const l of lines) console.log(`     ${l.trim()}`);
    }
  }

  // 3. Import resolution scan
  console.log("\n[3/4] Import resolution scan...");
  const tsFiles = findFiles("core", [".ts", ".tsx"], 50).concat(findFiles("scripts", [".ts", ".tsx"], 50));
  let suspicious = 0;
  for (const f of tsFiles.slice(0, 30)) {
    const content = readFileSync(f, "utf-8");
    // Check for bare relative imports that might break after refactoring
    const bare = content.match(/from ['"]\.\.\/\.\.\/[^']+['"]/g);
    if (bare && bare.length > 5) suspicious++;
  }
  if (suspicious > 0) {
    console.log(`  ⚠️  ${suspicious} file(s) have many deep relative imports (../..) — fragile`);
  } else {
    console.log("  ✅ No suspicious import patterns");
  }

  // 4. Node version compatibility
  console.log("\n[4/4] Node.js version...");
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1), 10);
  if (nodeMajor < 18) {
    console.log(`  ❌ Node ${nodeVersion} is too old — upgrade to 18+`);
  } else if (nodeMajor >= 22) {
    console.log(`  ✅ Node ${nodeVersion} (latest)`);
  } else {
    console.log(`  ⚠️  Node ${nodeVersion} — OK but consider upgrading to 22`);
  }

  console.log("\nCompile diagnostic complete.");
}

function config() {
  console.log("=== Environment Config Diagnostic ===\n");

  // 1. Git config
  console.log("[1/5] Git configuration...");
  const gitUser = runOptional("git config user.name");
  const gitEmail = runOptional("git config user.email");
  if (gitUser && gitEmail) {
    console.log(`  User: ${gitUser} <${gitEmail}>`);
  } else {
    console.log("  ⚠️  Git user not configured");
  }

  // 2. Environment variables
  console.log("\n[2/5] Environment variables...");
  const dotenvPath = join(ROOT, ".env");
  if (existsSync(dotenvPath)) {
    console.log("  .env file exists");
    const content = readFileSync(dotenvPath, "utf-8");
    const keys = content.split("\n")
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("#"))
      .map(l => l.split("=")[0]);
    for (const k of keys) {
      const val = process.env[k];
      if (!val) {
        console.log(`  ⚠️  ${k} defined in .env but not loaded into process.env`);
      }
    }
  } else {
    console.log("  ⚠️  No .env file found");
  }

  // 3. System dependencies
  console.log("\n[3/5] System dependencies...");
  const depChecks = [
    { name: "git", cmd: "git --version" },
    { name: "node", cmd: "node --version" },
    { name: "npm", cmd: "npm --version" },
  ];
  // detect package manager
  if (existsSync(join(ROOT, "pnpm-lock.yaml"))) depChecks.push({ name: "pnpm", cmd: "pnpm --version" });
  if (existsSync(join(ROOT, "yarn.lock"))) depChecks.push({ name: "yarn", cmd: "yarn --version" });

  for (const dep of depChecks) {
    const out = runOptional(dep.cmd);
    if (out) {
      console.log(`  ✅ ${dep.name}: ${out.split("\n")[0]}`);
    } else {
      console.log(`  ❌ ${dep.name}: not found in PATH`);
    }
  }

  // 4. Node modules
  console.log("\n[4/5] Node modules...");
  const nmPath = join(ROOT, "node_modules");
  if (existsSync(nmPath)) {
    const pkgCount = runOptional("ls node_modules/.package-lock.json 2>/dev/null && echo ready || ls node_modules/ | wc -l");
    console.log(`  ✅ node_modules exists`);
    // Check for stale node_modules (package.json newer than node_modules)
    const pkgMod = existsSync(join(ROOT, "package.json"))
      ? statSync(join(ROOT, "package.json")).mtimeMs : 0;
    const nmMod = statSync(nmPath).mtimeMs;
    if (pkgMod > nmMod) {
      console.log("  ⚠️  package.json newer than node_modules — possibly stale, re-run install");
    }
  } else {
    console.log("  ❌ node_modules missing — run pnpm install");
  }

  // 5. Port conflicts (common in dev)
  console.log("\n[5/5] Port conflict check...");
  const commonPorts = [3000, 5173, 8080, 3001, 4173];
  for (const port of commonPorts) {
    try {
      execSync(`node -e "require('net').createServer().listen(${port},'127.0.0.1').close()"`, {
        cwd: ROOT, encoding: "utf-8", timeout: 3000, stdio: "pipe",
      });
    } catch {
      console.log(`  ⚠️  Port ${port} is already in use`);
    }
  }
  console.log("  ✅ No conflicts on checked ports");

  console.log("\nConfig diagnostic complete.");
}

function data() {
  console.log("=== Data Diagnostic ===\n");

  // 1. File encoding check
  console.log("[1/4] File encoding scan...");
  let encodingIssues = 0;
  const scanFiles = findFiles(".", [".ts", ".tsx", ".json", ".md"], 100)
    .filter(f => !f.includes("node_modules") && !f.includes(".git"));
  for (const f of scanFiles.slice(0, 50)) {
    const buf = readFileSync(f);
    // Check BOM
    if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      console.log(`  ⚠️  BOM marker found: ${f.replace(ROOT, ".")}`);
      encodingIssues++;
    }
  }
  if (encodingIssues === 0) console.log("  ✅ No BOM issues found");

  // 2. JSON file validation
  console.log("\n[2/4] JSON file validation...");
  let jsonErrors = 0;
  const jsonFiles = findFiles(".", [".json"], 50)
    .filter(f => !f.includes("node_modules") && !f.includes(".git"));
  for (const f of jsonFiles) {
    try {
      JSON.parse(readFileSync(f, "utf-8"));
    } catch {
      console.log(`  ❌ Invalid JSON: ${f.replace(ROOT, ".")}`);
      jsonErrors++;
    }
  }
  if (jsonErrors === 0) console.log("  ✅ All JSON files valid");

  // 3. Line ending consistency
  console.log("\n[3/4] Line ending consistency...");
  let mixedEndings = 0;
  const textFiles = findFiles(".", [".ts", ".tsx", ".css", ".html", ".md", ".json"], 50)
    .filter(f => !f.includes("node_modules") && !f.includes(".git"));
  for (const f of textFiles) {
    const content = readFileSync(f, "utf-8");
    if (content.includes("\r\n")) mixedEndings++;
  }
  if (mixedEndings > 0) {
    console.log(`  ⚠️  ${mixedEndings} file(s) have Windows line endings (CRLF)`);
  } else {
    console.log("  ✅ Unix line endings (LF) consistent");
  }

  // 4. Large file detection
  console.log("\n[4/4] Large file detection...");
  const allFiles = findFiles(".", [], 200)
    .filter(f => !f.includes("node_modules") && !f.includes(".git"));
  let largeFiles = 0;
  for (const f of allFiles) {
    try {
      const size = statSync(f).size;
      if (size > 500 * 1024) {
        const sizeKB = (size / 1024).toFixed(0);
        console.log(`  ⚠️  Large file (${sizeKB}KB): ${f.replace(ROOT, ".")}`);
        largeFiles++;
      }
    } catch { /* skip */ }
  }
  if (largeFiles === 0) console.log("  ✅ No files over 500KB");

  console.log("\nData diagnostic complete.");
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
  runOptional(`git checkout ${badCommit}`);

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
        // Weld: keep stderr — a failing run's reason lives there.
        input = `${e.stdout || ""}\n${e.stderr || ""}`.trim() || e.message || "no output";
      }
    }

    // Append compile probe output if failed
    {
      const probe = runCompileProbe();
      if (!probe.ok && !probe.skipped && probe.output) {
        input += "\n" + probe.output;
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

  // 1. Language-aware compile check
  console.log("[1/3] Compile (language-aware)...");
  {
    const probe = runCompileProbe();
    if (probe.skipped) {
      console.log(`  ⚠️  ${probe.detail}`);
    } else if (probe.ok) {
      console.log(`  ✅ ${probe.detail}`);
    } else {
      console.log("  ❌ compile failed");
      const lines = probe.output.split("\n").filter(Boolean).slice(0, 5);
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
      // Weld: keep stderr — a failed run's real reason is on stderr.
      const out = `${e.stdout || ""}\n${e.stderr || ""}`;
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
  if (cmd === "diagnose") {
    if (args[1] === "--scenario") {
      cmdDiagnoseScenario(args[2]);
    } else {
      cmdDiagnose();
    }
  } else if (cmd === "trace") cmdTrace(args[1]);
  else if (cmd === "bisect") cmdBisect(args[1], args[2]);
  else if (cmd === "classify") cmdClassify(args[1]);
  else if (cmd === "verify") cmdVerify();
  else if (cmd === "status") cmdStatus();
  else usage();
} catch (e) {
  console.error(`forge-bug-fix error: ${e.message}`);
  process.exit(1);
}
