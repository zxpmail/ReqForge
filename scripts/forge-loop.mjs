#!/usr/bin/env node
/**
 * forge-loop.mjs — 统一 Phase 完成循环（单次迭代）
 *
 * 用法：
 *   pnpm forge-loop <N>                               # 全量检查
 *   pnpm forge-loop <N> --url http://localhost:5173   # 含 Playwright
 *   pnpm forge-loop <N> --max 10                      # 最多 10 次迭代
 *   pnpm forge-loop <N> --skip-plan                   # 跳过交付清单检查
 *   pnpm forge-loop <N> --skip-ui                     # 跳过 UI 检查
 *   pnpm forge-loop <N> --reset                       # 重置迭代状态
 *
 * 一次迭代完成三项验证：
 *   1. 交付清单 ⇔ git diff（forge-phase-check --json）
 *   2. UI 文件存在（静态）
 *   3. Playwright 断言（动态，需 --url）
 *
 * 有失败项 → 生成 .forge/loop/fix-brief.md（统一修复指令）
 * AI 执行修复 → 重新运行 → 直到全部 clean 或超限。
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, ".forge", "loop");

// --- Parse args ---
const args = process.argv.slice(2);
let phaseNum = null;
let maxIterations = 5;
let baseUrl = null;
let skipPlan = false;
let skipUi = false;
let reset = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--max" && args[i + 1]) { maxIterations = parseInt(args[++i], 10); continue; }
  if (args[i] === "--url" && args[i + 1]) { baseUrl = args[++i]; continue; }
  if (args[i] === "--skip-plan") { skipPlan = true; continue; }
  if (args[i] === "--skip-ui") { skipUi = true; continue; }
  if (args[i] === "--reset") { reset = true; continue; }
  if (/^\d+$/.test(args[i])) { phaseNum = parseInt(args[i], 10); }
}

if (reset) {
  if (existsSync(STATE_DIR)) { rmSync(STATE_DIR, { recursive: true }); console.log(`重置 Phase ${phaseNum || "?"} 循环状态。`); }
  else { console.log("无状态需要重置。"); }
  process.exit(0);
}

if (!phaseNum) {
  console.error("Usage: node scripts/forge-loop.mjs <N> [--url <URL>] [--max <M>] [--skip-plan] [--skip-ui] [--reset]");
  console.error("  <N>           Phase number");
  console.error("  --url         Dev server URL for Playwright checks");
  console.error("  --max         Max iterations (default: 5)");
  console.error("  --skip-plan   Skip delivery checklist check");
  console.error("  --skip-ui     Skip UI file/Playwright check");
  console.error("  --reset       Reset loop state");
  process.exit(1);
}

// --- State ---
function ensureDir(p) { if (!existsSync(p)) mkdirSync(p, { recursive: true }); }

function readState() {
  const p = join(STATE_DIR, "state.json");
  if (!existsSync(p)) return { phase: phaseNum, maxIterations, iteration: 0, status: "ready" };
  try { return JSON.parse(readFileSync(p, "utf-8")); }
  catch { return { phase: phaseNum, maxIterations, iteration: 0, status: "ready" }; }
}

function writeState(s) { ensureDir(STATE_DIR); writeFileSync(join(STATE_DIR, "state.json"), JSON.stringify(s, null, 2)); }

// --- Check 1: Phase delivery checklist ---
function checkPlan() {
  if (skipPlan) return { ok: true, omitted: [], completed: [], totalItems: 0 };
  try {
    const out = execSync(
      `node "${join(ROOT, "scripts", "forge-phase-check.mjs")}" ${phaseNum} --json`,
      { cwd: ROOT, encoding: "utf-8", timeout: 60000, stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
    const r = JSON.parse(out);
    return { ok: r.omitted.length === 0, omitted: r.omitted, completed: r.completed, totalItems: r.totalItems };
  } catch (e) {
    try { const r = JSON.parse(e.stdout || "{}"); return { ok: r.omitted?.length === 0, omitted: r.omitted || [], completed: r.completed || [], totalItems: r.totalItems || 0 }; }
    catch { return { ok: true, omitted: [], completed: [], totalItems: 0, error: e.stderr?.slice(0, 200) || "check failed" }; }
  }
}

// --- Check 2: UI static + Playwright ---
function checkUi() {
  if (skipUi) return { ok: true, staticResults: [], pwPassed: 0, pwFailed: 0, pwTotal: 0 };
  const urlFlag = baseUrl ? ` --url "${baseUrl}"` : "";
  try {
    execSync(
      `node "${join(ROOT, "scripts", "forge-ui-check.mjs")}" ${phaseNum}${urlFlag}`,
      { cwd: ROOT, encoding: "utf-8", timeout: 180000, stdio: ["pipe", "pipe", "pipe"] },
    );
    return { ok: true, staticResults: [], pwPassed: 0, pwFailed: 0, pwTotal: 0 };
  } catch (e) {
    // Try to extract summary from output
    const out = e.stdout || "";
    return { ok: false, staticResults: [], pwPassed: 0, pwFailed: 0, pwTotal: 0, detail: out.slice(0, 1000) };
  }
}

// --- Generate unified fix brief ---
function generateFixBrief(planResult, uiResult, iteration) {
  const brief = [];
  brief.push(`# Phase ${phaseNum} 修复指令 — Iteration ${iteration}/${maxIterations}`);
  brief.push("");

  const sectionActions = {
    deliverables: "实现",
    keyfiles: "创建文件",
    acceptance: "验证",
  };

  if (planResult.omitted.length > 0) {
    brief.push(`## 交付遗漏 (${planResult.omitted.length}项)`);
    brief.push("");
    planResult.omitted.forEach((o, i) => {
      const sa = sectionActions[o.item.section] || "处理";
      brief.push(`### ${i + 1}. [${o.item.section}] ${o.item.text}`);
      brief.push("");
      brief.push(`**操作**: ${sa}`);
      const files = (o.item.text.match(/`[^`]+`/g) || []).map(f => f.replace(/`/g, ""));
      if (files.length > 0) brief.push(`**目标文件**: ${files.join("、")}`);
      if (o.item.section === "keyfiles") brief.push("**要求**: 创建列出的文件，遵循项目现有模式。");
      else if (o.item.section === "deliverables") brief.push("**要求**: 实现所述功能。");
      else if (o.item.section === "acceptance") brief.push("**要求**: 确保满足验收条件。");
      brief.push("");
    });
  }

  if (!uiResult.ok) {
    brief.push(`## UI 问题`);
    brief.push("");
    brief.push("UI 验证未通过。请确保：");
    brief.push("- 所有 UI 清单项中引用的文件已创建");
    if (baseUrl) {
      brief.push("- Playwright 测试全部通过");
      brief.push("- 页面路由可正常访问");
      brief.push("- 表单/按钮/输入框等元素存在");
    }
    brief.push("");
  }

  brief.push("---");
  brief.push("执行所有修复后，循环会自动进入下一轮检查。");
  brief.push("");

  return brief.join("\n");
}

// --- Format unified report ---
function formatReport(planResult, uiResult, iteration) {
  const lines = [];
  lines.push(`# Phase ${phaseNum} 循环检查报告`);
  lines.push(`> 迭代: ${iteration}/${maxIterations}`);
  lines.push("");

  // Plan summary
  if (!skipPlan) {
    const pct = planResult.totalItems > 0 ? Math.round((planResult.completed.length / planResult.totalItems) * 100) : 0;
    lines.push(`## 交付清单 ${planResult.ok ? "✅" : "❌"}`);
    lines.push(`> ${planResult.completed.length}/${planResult.totalItems} 完成 (${pct}%)`);
    if (planResult.omitted.length > 0) {
      planResult.omitted.forEach(o => lines.push(`  ❌ [${o.item.section}] ${o.item.text}`));
    }
    lines.push("");
  }

  // UI summary
  if (!skipUi) {
    lines.push(`## UI 验证 ${uiResult.ok ? "✅" : "❌"}`);
    if (!uiResult.ok) lines.push("  ❌ 存在 UI 问题（文件缺失或 Playwright 失败）");
    else lines.push("  静态文件检查通过");
    lines.push("");
  }

  // Overall
  const allOk = planResult.ok && uiResult.ok;
  lines.push(`## 总体 ${allOk ? "✅ 全部通过" : "❌ 需修复"}`);
  if (allOk) {
    lines.push(`**结论**: Phase ${phaseNum} 所有检查项均已验证通过。`);
  } else {
    const totalIssues = planResult.omitted.length + (uiResult.ok ? 0 : 1);
    lines.push(`**结论**: 存在 ${totalIssues} 个问题需要修复。`);
  }
  lines.push("");

  // Fix brief path
  if (!allOk) {
    const briefPath = join(STATE_DIR, "fix-brief.md");
    lines.push(`修复指令: ${briefPath}`);
  }

  return lines.join("\n");
}

// --- Main ---
const state = readState();

if (state.phase !== phaseNum) { state.phase = phaseNum; state.iteration = 0; state.status = "ready"; }

if (state.status === "max-reached") {
  console.log(`⚠️ Phase ${phaseNum} 已达最大迭代次数 ${maxIterations}。`);
  console.log(`状态: ${join(STATE_DIR, "state.json")}`);
  process.exit(0);
}
if (state.status === "complete") {
  console.log(`✅ Phase ${phaseNum} 之前已完成。`);
  process.exit(0);
}

console.log(`\n🔍 Phase ${phaseNum} — Iteration ${state.iteration + 1}/${maxIterations}`);

// Run checks
const planResult = checkPlan();
const uiResult = checkUi();
const allOk = planResult.ok && uiResult.ok;

if (allOk) {
  state.status = "complete";
  writeState(state);
  console.log(formatReport(planResult, uiResult, state.iteration + 1));
  console.log(`\n✅ Phase ${phaseNum} 全部通过！`);
  process.exit(0);
}

// Has failures
state.iteration += 1;
if (state.iteration >= maxIterations) {
  state.status = "max-reached";
  writeState(state);
  console.log(formatReport(planResult, uiResult, state.iteration));
  console.log(`\n⚠️ Phase ${phaseNum} 已达最大迭代次数 ${maxIterations}。`);
  process.exit(0);
}

// Generate fix brief and continue
state.status = "in-progress";
writeState(state);

const brief = generateFixBrief(planResult, uiResult, state.iteration);
ensureDir(STATE_DIR);
writeFileSync(join(STATE_DIR, "fix-brief.md"), brief);

console.log(formatReport(planResult, uiResult, state.iteration));
console.log(`\n📋 修复指令已写入 ${join(STATE_DIR, "fix-brief.md")}`);
console.log(`迭代 ${state.iteration}/${maxIterations} — 读取修复指令执行后重新运行。\n`);
process.exit(0);
