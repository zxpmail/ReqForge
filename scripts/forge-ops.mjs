#!/usr/bin/env node
/**
 * forge-ops.mjs — 运营闭环：监控 → 检测 → 诊断 → 修复 → 验证
 *
 * 用法：
 *   pnpm forge-ops <url>                               # 单次健康检查 + 基线对比
 *   pnpm forge-ops <url> --interval 300                 # 循环监控（每 300 秒）
 *   pnpm forge-ops <url> --fix                          # 自动生成 fix-brief
 *   pnpm forge-ops <url> --baseline save                # 保存健康基线
 *   pnpm forge-ops <url> --baseline compare             # 对比基线
 *
 * 工作流：
 *   1. Monitor   — HTTP 健康检查
 *   2. Detect    — 运行验证套件 + 基线对比
 *   3. Diagnose  — 收集错误上下文
 *   4. Fix       — 生成 .forge/ops/fix-brief.md（--fix）
 *   5. Report    — .forge/ops/report.md
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadBaseline, saveBaseline, compareBaseline } from "./forge-verify/baseline.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OPS_DIR = join(ROOT, ".forge", "ops");
const REPORT_FILE = join(OPS_DIR, "report.md");
const FIX_BRIEF = join(OPS_DIR, "fix-brief.md");

// === Args ===
const args = process.argv.slice(2);
let targetUrl = null;
let interval = 0;
let baselineMode = "check";
let fixMode = false;
let verbose = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--interval" && args[i + 1]) { interval = parseInt(args[++i], 10) * 1000; continue; }
  if (args[i] === "--baseline" && args[i + 1]) { baselineMode = args[++i]; continue; }
  if (args[i] === "--fix") { fixMode = true; continue; }
  if (args[i] === "--verbose") { verbose = true; continue; }
  if (args[i].startsWith("http")) { targetUrl = args[i]; }
}

if (!targetUrl) {
  console.error("Usage: pnpm forge-ops <url> [--interval <sec>] [--baseline save|compare] [--fix]");
  console.error("  <url>             Production URL to monitor (e.g. https://myapp.com)");
  console.error("  --interval <sec>  Loop mode: re-check every N seconds");
  console.error("  --baseline save   Save current state as baseline");
  console.error("  --baseline compare  Compare against saved baseline");
  console.error("  --fix             Generate fix-brief.md when issues found");
  process.exit(1);
}

function ensureDir(p) { if (!existsSync(p)) mkdirSync(p, { recursive: true }); }

// === Step 1: Monitor — health check ===
function healthCheck(url) {
  const result = { ok: false, status: 0, latency: 0, error: null };
  const start = Date.now();
  try {
    const out = execSync(`curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "${url}"`, {
      cwd: ROOT, encoding: "utf-8", timeout: 35000, stdio: "pipe",
    });
    result.status = parseInt(out.trim(), 10);
    result.ok = result.status >= 200 && result.status < 500;
  } catch (e) {
    result.error = e.message?.split("\n")[0] || "connection failed";
    result.status = 0;
  }
  result.latency = Date.now() - start;
  return result;
}

// === Step 2: Detect — run verify suite + baseline ===
function runDetection() {
  const verifyPath = join(ROOT, "scripts", "forge-verify.mjs");
  if (!existsSync(verifyPath)) return null;

  let verifyOk = false;
  let output = "";
  try {
    output = execSync(`node "${verifyPath}" --baseline check`, {
      cwd: ROOT, encoding: "utf-8", timeout: 120000, stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    verifyOk = true;
  } catch (e) {
    output = (e.stdout || "").trim();
    // forge-verify exits 1 on failure, that's expected
  }

  // Parse checks from output: "✓ name" or "✗ name — reason"
  const checks = {};
  for (const line of output.split("\n")) {
    const passMatch = line.match(/✓\s+(.+)$/);
    const failMatch = line.match(/✗\s+(.+?)(?:\s*—\s*(.+))?$/);
    if (passMatch) checks[passMatch[1].trim()] = { status: "pass", detail: "" };
    if (failMatch) checks[failMatch[1].trim()] = { status: "fail", detail: failMatch[2]?.trim() || "" };
  }

  // Compare with baseline
  const baseline = loadBaseline(ROOT);
  const diff = compareBaseline(checks, baseline);
  return { results: checks, baseline, diff, output };
}

// === Step 3: Diagnose ===
function diagnose(health, detection) {
  const issues = [];

  if (!health.ok) {
    issues.push(`Health: ${health.status} (${health.latency}ms)`);
  }

  if (detection?.diff?.added?.length > 0) {
    for (const check of detection.diff.added) {
      issues.push(`Regression: ${check} — previously passed, now failing`);
    }
  }

  if (detection?.diff?.firstRun) {
    issues.push("Baseline: first run — no prior baseline to compare against");
  }

  return issues;
}

// === Step 4: Fix brief ===
function generateFixBrief(issues, health, detection) {
  const brief = [];
  brief.push(`# Forge Ops Fix Brief — ${new Date().toISOString()}`);
  brief.push(`> Target: ${targetUrl}`);
  brief.push("");
  brief.push("## Issues Detected");
  brief.push("");
  issues.forEach(i => brief.push(`- ❌ ${i}`));
  brief.push("");

  if (!health.ok) {
    brief.push("## Health Check Failed");
    brief.push(`- Status: ${health.status || "unreachable"}`);
    brief.push(`- Latency: ${health.latency}ms`);
    brief.push(`- Error: ${health.error || "none"}`);
    brief.push("- Check: Is the server running? Has a deployment broken the endpoint?");
    brief.push("");
  }

  if (detection?.diff?.added?.length > 0) {
    brief.push("## Regression Detected");
    for (const item of detection.diff.added) {
      const cur = detection.results?.[item];
      brief.push(`- ${item}: ${cur?.detail || "failed"}`);
    }
    brief.push("");
    brief.push("### Fix instructions");
    brief.push("1. Read the regression details above");
    brief.push("2. Identify the root cause (code change, config, dependency)");
    brief.push("3. Fix the issue");
    brief.push("4. Re-run: pnpm forge-ops " + targetUrl + " --baseline compare");
    brief.push("");
  }

  brief.push("---");
  brief.push("Auto-generated by forge-ops");
  return brief.join("\n");
}

// === Step 5: Report ===
function generateReport(health, detection, issues, tick) {
  const lines = [];
  lines.push(`# Forge Ops Report — Tick #${tick}`);
  lines.push(`> ${new Date().toISOString()} | Target: ${targetUrl}`);
  lines.push("");

  // Summary bar
  const ok = health.ok && (!detection?.diff?.added?.length || detection.diff.added.length === 0);
  lines.push(`**Overall**: ${ok ? "✅ Healthy" : "❌ Issues detected"}`);
  lines.push("");

  // Health
  lines.push("## 1. Health Check");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Status | ${health.status || "N/A"} |`);
  lines.push(`| Latency | ${health.latency}ms |`);
  lines.push(`| Reachable | ${health.ok ? "✅" : "❌"} |`);
  if (health.error) lines.push(`| Error | ${health.error} |`);
  lines.push("");

  // Verification
  if (detection?.results) {
    lines.push("## 2. Verification Suite");
    lines.push(`| Check | Status | Detail |`);
    lines.push(`|-------|--------|--------|`);
    for (const [name, r] of Object.entries(detection.results)) {
      lines.push(`| ${name} | ${r.status === "pass" ? "✅" : "❌"} | ${r.detail || ""} |`);
    }
    lines.push("");
  }

  // Baseline comparison
  if (detection?.diff) {
    lines.push("## 3. Baseline Comparison");
    if (detection.diff.firstRun) {
      lines.push("> No prior baseline. Run `pnpm forge-ops <url> --baseline save` to save one.");
    } else {
      lines.push(`| Delta | Count |`);
      lines.push(`|-------|-------|`);
      lines.push(`| Regressed (newly failing) | ${detection.diff.added.length} |`);
      lines.push(`| Recovered (newly passing) | ${detection.diff.removed.length} |`);
      lines.push(`| Unchanged | ${detection.diff.unchanged.length} |`);
      if (detection.diff.added.length > 0) {
        lines.push("");
        lines.push("**Regressed checks:**");
        detection.diff.added.forEach(c => lines.push(`  - ${c}`));
      }
    }
    lines.push("");
  }

  // Issues summary
  if (issues.length > 0) {
    lines.push("## 4. Issues");
    issues.forEach(i => lines.push(`- ${i}`));
    lines.push("");
  }

  // Next steps
  if (!ok) {
    lines.push("## Next Steps");
    if (fixMode) {
      lines.push(`- Fix brief → ${FIX_BRIEF}`);
    } else {
      lines.push("- Run with --fix to generate fix brief");
    }
    lines.push(`- Re-check: pnpm forge-ops ${targetUrl} --baseline compare`);
  }

  lines.push("");
  lines.push(`*Generated by forge-ops · ${new Date().toISOString()}*`);
  return lines.join("\n");
}

// === Main loop ===
let tick = 0;

function runOnce() {
  tick++;
  console.log(`\n[${new Date().toISOString().slice(11, 19)}] 🔄 Tick #${tick} — ${targetUrl}`);

  const health = healthCheck(targetUrl);
  console.log(`   Health: ${health.ok ? "✅" : "❌"} (${health.status}, ${health.latency}ms)`);

  const detection = runDetection();
  if (detection?.diff?.added?.length > 0) {
    console.log(`   Regression: ${detection.diff.added.length} check(s) regressed`);
  }

  const issues = diagnose(health, detection);
  if (issues.length === 0) {
    console.log(`   ✅ All clear`);
  }

  // Save baseline if requested
  if (baselineMode === "save" && detection?.results) {
    saveBaseline(detection.results, ROOT);
    console.log(`   📦 Baseline saved`);
  }

  // Generate fix brief if issues found and --fix
  if (fixMode && issues.length > 0) {
    ensureDir(OPS_DIR);
    writeFileSync(FIX_BRIEF, generateFixBrief(issues, health, detection));
    console.log(`   📋 Fix brief → ${FIX_BRIEF}`);
  }

  // Generate report
  ensureDir(OPS_DIR);
  const report = generateReport(health, detection, issues, tick);
  writeFileSync(REPORT_FILE, report);
  if (verbose) console.log(`\n${report}`);

  return issues.length === 0;
}

// First run
const clean = runOnce();

// Loop mode
if (interval > 0) {
  if (!clean) {
    console.log(`\n⚠️  Issues found on first check. Continuing to monitor...`);
  }
  const timer = setInterval(() => {
    const ok = runOnce();
    if (ok && fixMode) {
      // If clean after a fix, clear fix-brief
      if (existsSync(FIX_BRIEF)) {
        writeFileSync(FIX_BRIEF, "# forge-ops: All checks passing\n");
        console.log(`   ✅ Fix brief cleared — all issues resolved`);
      }
    }
    console.log(`   Next check in ${interval / 1000}s...`);
  }, interval);

  // Graceful shutdown
  process.on("SIGINT", () => {
    clearInterval(timer);
    console.log(`\n${REPORT_FILE}`);
    process.exit(0);
  });
} else {
  process.exit(clean ? 0 : 1);
}
