#!/usr/bin/env node
/**
 * forge-ops.mjs — 运营闭环：监控 → 检测 → 诊断 → 修复 → 部署
 *
 * 用法：
 *   pnpm forge-ops <url>                                 # 单次健康检查
 *   pnpm forge-ops --all                                  # 检查 config.json 所有端点
 *   pnpm forge-ops <url> --interval 300                   # 循环监控
 *   pnpm forge-ops <url> --fix                            # 生成 fix-brief
 *   pnpm forge-ops <url> --deploy                         # 失败时自动部署
 *   pnpm forge-ops --init-config                          # 生成默认 config.json
 *
 * 工作流：
 *   1. Monitor   — HTTP 健康检查（单端点或并行多端点）
 *   2. Detect    — 运行验证套件 + 基线对比
 *   3. Diagnose  — 收集错误上下文
 *   4. Notify    — Slack/飞书/Console 告警
 *   5. Fix       — 生成 .forge/ops/fix-brief.md（--fix）
 *   6. Deploy    — 自动部署（--deploy）
 *   7. Report    — .forge/ops/report.md
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadBaseline, saveBaseline, compareBaseline } from "./forge-verify/baseline.mjs";
import { sendAlert, sendConsole, formatError } from "./forge-ops/alerts.mjs";
import { triggerDeploy, waitForHealthy, isCooldownActive, readDeployLog } from "./forge-ops/deploy.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OPS_DIR = join(ROOT, ".forge", "ops");
const CONFIG_FILE = join(OPS_DIR, "config.json");
const REPORT_FILE = join(OPS_DIR, "report.md");
const FIX_BRIEF = join(OPS_DIR, "fix-brief.md");

// ─── Args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let cliUrl = null;
let interval = 0;
let baselineMode = "check";
let fixMode = false;
let deployMode = false;
let allEndpoints = false;
let initConfig = false;
let verbose = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--interval" && args[i + 1]) { interval = parseInt(args[++i], 10) * 1000; continue; }
  if (args[i] === "--baseline" && args[i + 1]) { baselineMode = args[++i]; continue; }
  if (args[i] === "--fix") { fixMode = true; continue; }
  if (args[i] === "--deploy") { deployMode = true; continue; }
  if (args[i] === "--all") { allEndpoints = true; continue; }
  if (args[i] === "--init-config") { initConfig = true; continue; }
  if (args[i] === "--verbose") { verbose = true; continue; }
  if (args[i].startsWith("http")) { cliUrl = args[i]; }
}

// ─── Init Config ────────────────────────────────────────────────────

function generateDefaultConfig() {
  return {
    endpoints: [
      { url: "http://localhost:3000/health", name: "local", interval: 300 },
    ],
    notifications: {
      slack: { webhook: "" },
      feishu: { webhook: "" },
    },
    deploy: {
      command: "",
      onFailure: false,
      cooldownMs: 300000,
    },
  };
}

if (initConfig) {
  mkdirSync(OPS_DIR, { recursive: true });
  if (!existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, JSON.stringify(generateDefaultConfig(), null, 2), "utf-8");
    console.log(`✅ Default config → ${CONFIG_FILE}`);
    console.log("   Edit it to add your endpoints, webhooks, and deploy command.");
  } else {
    console.log(`ℹ️  Config already exists: ${CONFIG_FILE}`);
  }
  process.exit(0);
}

// ─── Config Loading ─────────────────────────────────────────────────

function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return null;
  try { return JSON.parse(readFileSync(CONFIG_FILE, "utf-8")); }
  catch { return null; }
}

function loadEndpoints() {
  const config = loadConfig();
  const endpoints = [];

  if (cliUrl) {
    endpoints.push({ url: cliUrl, name: cliUrl.replace(/https?:\/\//, "").split("/")[0] });
  }

  if (allEndpoints && config?.endpoints) {
    for (const ep of config.endpoints) {
      // Don't duplicate if already added via --url
      if (!endpoints.some(e => e.url === ep.url)) {
        endpoints.push(ep);
      }
    }
  }

  // If no endpoints specified, use CLI url or fall back to config
  if (endpoints.length === 0) {
    if (cliUrl) {
      endpoints.push({ url: cliUrl, name: cliUrl.replace(/https?:\/\//, "").split("/")[0] });
    } else if (config?.endpoints?.length > 0) {
      endpoints.push(config.endpoints[0]);
    }
  }

  return { config, endpoints };
}

// ─── Health Check ────────────────────────────────────────────────────

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

// ─── Parallel Multi-endpoint Polling ─────────────────────────────────

async function pollAll(endpoints) {
  const results = [];
  for (const ep of endpoints) {
    const health = healthCheck(ep.url);
    results.push({ endpoint: ep, health });
  }
  return results;
}

// ─── Detection ───────────────────────────────────────────────────────

function runDetection() {
  const verifyPath = join(ROOT, "scripts", "forge-verify.mjs");
  if (!existsSync(verifyPath)) return null;

  let output = "";
  try {
    output = execSync(`node "${verifyPath}" --baseline check`, {
      cwd: ROOT, encoding: "utf-8", timeout: 120000, stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (e) {
    // Weld: keep stderr — a failed baseline check's real reason is there.
    output = `${e.stdout || ""}\n${e.stderr || ""}`.trim();
  }

  const checks = {};
  for (const line of output.split("\n")) {
    const passMatch = line.match(/✓\s+(.+)$/);
    const failMatch = line.match(/✗\s+(.+?)(?:\s*—\s*(.+))?$/);
    if (passMatch) checks[passMatch[1].trim()] = { status: "pass", detail: "" };
    if (failMatch) checks[failMatch[1].trim()] = { status: "fail", detail: failMatch[2]?.trim() || "" };
  }

  const baseline = loadBaseline(ROOT);
  const diff = compareBaseline(checks, baseline);
  return { results: checks, baseline, diff, output };
}

// ─── Diagnosis ───────────────────────────────────────────────────────

function diagnose(results) {
  const issues = [];
  for (const r of results) {
    if (!r.health.ok) {
      issues.push(`Health[${r.endpoint.name || r.endpoint.url}]: ${r.health.status} (${r.health.latency}ms)${r.health.error ? " — " + r.health.error : ""}`);
    }
  }
  if (results.length === 0) {
    issues.push("No endpoints configured");
  }
  return issues;
}

// ─── Fix Brief ───────────────────────────────────────────────────────

function generateFixBrief(results, tick) {
  const brief = [];
  brief.push(`# Forge Ops Fix Brief — ${new Date().toISOString()}`);
  brief.push(`> Tick #${tick}`);
  brief.push("");
  brief.push("## Issues Detected");
  brief.push("");
  for (const r of results) {
    if (!r.health.ok) {
      brief.push(`- ❌ ${r.endpoint.name || r.endpoint.url}: ${r.health.status} (${r.health.latency}ms)`);
    }
  }
  brief.push("");
  brief.push("## Health Details");
  brief.push("");
  for (const r of results) {
    brief.push(`### ${r.endpoint.name || r.endpoint.url}`);
    brief.push(`- Status: ${r.health.status || "unreachable"}`);
    brief.push(`- Latency: ${r.health.latency}ms`);
    if (r.health.error) brief.push(`- Error: ${r.health.error}`);
  }
  brief.push("");
  brief.push("## Fix instructions");
  brief.push("1. Identify the root cause");
  brief.push("2. Fix the issue");
  brief.push("3. Re-run: pnpm forge-ops --all --baseline compare");
  brief.push("");
  brief.push("---");
  brief.push("Auto-generated by forge-ops");
  return brief.join("\n");
}

// ─── Report ──────────────────────────────────────────────────────────

function generateReport(results, issues, tick, deployResult) {
  const lines = [];
  const allOk = issues.length === 0;
  lines.push(`# Forge Ops Report — Tick #${tick}`);
  lines.push(`> ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`**Overall**: ${allOk ? "✅ Healthy" : "❌ Issues detected"}`);
  lines.push("");

  lines.push("## 1. Endpoints");
  lines.push("| Name | URL | Status | Latency |");
  lines.push("|------|-----|--------|---------|");
  for (const r of results) {
    const icon = r.health.ok ? "✅" : "❌";
    lines.push(`| ${r.endpoint.name || "-"} | ${r.endpoint.url} | ${icon} ${r.health.status} | ${r.health.latency}ms |`);
  }
  lines.push("");

  if (issues.length > 0) {
    lines.push("## 2. Issues");
    issues.forEach(i => lines.push(`- ${i}`));
    lines.push("");
  }

  if (deployResult) {
    lines.push("## 3. Deploy");
    const icon = deployResult.success ? "✅" : "❌";
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Result | ${icon} |`);
    lines.push(`| Exit Code | ${deployResult.exitCode ?? "N/A"} |`);
    lines.push(`| Duration | ${deployResult.durationMs}ms |`);
    if (deployResult.error) lines.push(`| Error | ${deployResult.error} |`);
    lines.push("");
  }

  if (fixMode && !allOk) {
    lines.push(`## Next Steps`);
    lines.push(`- Fix brief → ${FIX_BRIEF}`);
    lines.push(`- Re-check: pnpm forge-ops --all --baseline compare`);
    if (!deployMode) lines.push(`- Run with --deploy to auto-deploy on failure`);
    lines.push("");
  }

  lines.push(`*Generated by forge-ops · ${new Date().toISOString()}*`);
  return lines.join("\n");
}

// ─── Main Loop ───────────────────────────────────────────────────────

let tick = 0;
let previousIssueCount = 0;

async function runOnce() {
  tick++;
  const { config, endpoints } = loadEndpoints();
  const endpointList = endpoints || [];

  if (endpointList.length === 0) {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ⚠️  No endpoints. Use <url>, --all, or --init-config.`);
    return false;
  }

  console.log(`\n[${new Date().toISOString().slice(11, 19)}] 🔄 Tick #${tick} — ${endpointList.length} endpoint(s)`);

  // Step 1: Monitor
  const results = await pollAll(endpointList);

  // Step 2: Detect
  const detection = runDetection();
  if (detection?.diff?.added?.length > 0) {
    console.log(`   Regression: ${detection.diff.added.length} check(s) regressed`);
  }

  // Step 3: Diagnose
  const issues = diagnose(results);
  const allOk = issues.length === 0;
  const newIssues = issues.length > previousIssueCount;
  const recovered = issues.length === 0 && previousIssueCount > 0;

  // Print status per endpoint
  for (const r of results) {
    const icon = r.health.ok ? "✅" : "❌";
    console.log(`   ${icon} ${r.endpoint.name || r.endpoint.url}: ${r.health.status} (${r.health.latency}ms)`);
  }

  if (allOk && !newIssues) {
    console.log(`   ✅ All clear`);
  }

  // Save baseline
  if (baselineMode === "save" && detection?.results) {
    saveBaseline(detection.results, ROOT);
    console.log(`   📦 Baseline saved`);
  }

  // Step 4: Notify
  if (newIssues) {
    const summary = `forge-ops tick #${tick}: ${issues.length} issue(s) on ${endpointList.length} endpoint(s)\n${issues.join("\n")}`;
    await sendAlert(summary, "error");
  } else if (recovered) {
    await sendAlert("forge-ops: All issues resolved", "success");
  }

  // Step 5: Fix brief
  if (fixMode && issues.length > 0) {
    mkdirSync(OPS_DIR, { recursive: true });
    writeFileSync(FIX_BRIEF, generateFixBrief(results, tick));
    console.log(`   📋 Fix brief → ${FIX_BRIEF}`);
  }

  // Step 6: Auto deploy
  let deployResult = null;
  if (deployMode && issues.length > 0 && config?.deploy?.command) {
    if (isCooldownActive(config.deploy.cooldownMs || 300000)) {
      console.log(`   ⏳ Deploy cooldown active, skipping`);
    } else {
      console.log(`   🚀 Deploying: ${config.deploy.command}`);
      deployResult = triggerDeploy(config.deploy);
      const icon = deployResult.success ? "✅" : "❌";
      console.log(`   ${icon} Deploy: exit=${deployResult.exitCode} (${deployResult.durationMs}ms)`);
      await sendAlert(`Deploy: ${deployResult.success ? "success" : "failed"} (${deployResult.durationMs}ms)`, deployResult.success ? "info" : "error");

      // Wait for healthy
      if (deployResult.success && endpointList.length > 0) {
        const targetUrl = endpointList[0].url;
        console.log(`   ⏳ Waiting for ${targetUrl} to recover...`);
        const healthResult = await waitForHealthy(targetUrl, 300000, 10000);
        if (healthResult.ok) {
          console.log(`   ✅ Service healthy after deploy (${healthResult.elapsedMs}ms, ${healthResult.attempts} attempts)`);
          await sendAlert(`Service healthy after deploy (${healthResult.elapsedMs}ms)`, "success");
        } else {
          console.log(`   ❌ Service not healthy after deploy (${healthResult.attempts} attempts)`);
          await sendAlert(`Service NOT healthy after deploy`, "error");
        }
      }
    }
  } else if (deployMode && issues.length > 0 && !config?.deploy?.command) {
    console.log(`   ⏭️  No deploy command configured in config.json`);
  }

  // Step 7: Report
  mkdirSync(OPS_DIR, { recursive: true });
  const report = generateReport(results, issues, tick, deployResult);
  writeFileSync(REPORT_FILE, report);
  if (verbose) console.log(`\n${report}`);

  previousIssueCount = issues.length;
  return allOk;
}

// ─── Startup ─────────────────────────────────────────────────────────

async function main() {
  const clean = await runOnce();

  if (interval > 0) {
    if (!clean) {
      console.log(`\n⚠️  Issues found. Continuing to monitor...`);
    }
    const timer = setInterval(async () => {
      const ok = await runOnce();
      if (ok && fixMode) {
        if (existsSync(FIX_BRIEF)) {
          writeFileSync(FIX_BRIEF, "# forge-ops: All checks passing\n");
          console.log(`   ✅ Fix brief cleared`);
        }
      }
      console.log(`   Next check in ${interval / 1000}s...`);
    }, interval);

    process.on("SIGINT", () => {
      clearInterval(timer);
      console.log(`\n${REPORT_FILE}`);
      process.exit(0);
    });
  } else {
    process.exit(clean ? 0 : 1);
  }
}

main().catch(e => {
  console.error(`Fatal: ${e.message}`);
  process.exit(1);
});
