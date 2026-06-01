#!/usr/bin/env node
/**
 * forge-phase-loop.mjs — Phase 自动完成循环（单次迭代）
 *
 * 用法：
 *   node scripts/forge-phase-loop.mjs <N> [--max <M>]
 *   pnpm forge-phase-loop <N> [--max <M>]
 *
 * 功能：
 *   单次迭代：运行 forge-phase-check，如有遗漏则生成 fix-brief.md，
 *   供 AI（YOLO 模式）读取并执行修复。
 *
 *   状态文件 .forge/phase-loop/{state.json,fix-brief.md}
 *   — 循环由 AI session 驱动，本脚本只负责检查 + 生成 brief。
 *
 * YOLO 工作流：
 *   1. pnpm forge-phase-loop <N> --max 5
 *   2. 有遗漏？→ 读取 .forge/phase-loop/fix-brief.md
 *   3. 执行所有修复指令
 *   4. 重复 1-3 直到 clean 或达到 max 次数
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, ".forge", "phase-loop");
const CHECK_SCRIPT = join(ROOT, "scripts", "forge-phase-check.mjs");

// --- Parse args ---
const args = process.argv.slice(2);
let phaseNum = null;
let maxIterations = 5;
let reset = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--max" && args[i + 1]) {
    maxIterations = parseInt(args[++i], 10);
    continue;
  }
  if (args[i] === "--reset") {
    reset = true;
    continue;
  }
  if (/^\d+$/.test(args[i])) {
    phaseNum = parseInt(args[i], 10);
  }
}

if (reset) {
  if (existsSync(STATE_DIR)) {
    rmSync(STATE_DIR, { recursive: true });
    console.log(`重置 Phase ${phaseNum || "?"} 循环状态。`);
  } else {
    console.log("无状态需要重置。");
  }
  process.exit(0);
}

if (!phaseNum) {
  console.error("Usage: node scripts/forge-phase-loop.mjs <N> [--max <M>] [--reset]");
  console.error("  <N>       Phase number (e.g. 3 for Phase 3)");
  console.error("  --max     Max iterations before giving up (default: 5)");
  console.error("  --reset   Reset loop state for this phase");
  process.exit(1);
}

// --- Helpers ---
function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function readState() {
  const p = join(STATE_DIR, "state.json");
  if (!existsSync(p)) {
    return { phase: phaseNum, maxIterations, iteration: 0, status: "ready" };
  }
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return { phase: phaseNum, maxIterations, iteration: 0, status: "ready" };
  }
}

function writeState(s) {
  ensureDir(STATE_DIR);
  writeFileSync(join(STATE_DIR, "state.json"), JSON.stringify(s, null, 2));
}

// --- Run forge-phase-check and get JSON report ---
function runCheck() {
  try {
    const out = execSync(
      `node "${CHECK_SCRIPT}" ${phaseNum} --json`,
      { cwd: ROOT, encoding: "utf-8", timeout: 60000, stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
    return JSON.parse(out);
  } catch (e) {
    // Try to parse partial JSON from error output
    const stderr = e.stderr || "";
    const stdout = e.stdout || "";
    try { return JSON.parse(stdout.trim()); } catch {}
    console.error("forge-phase-check failed:", stderr.slice(0, 500));
    return null;
  }
}

// --- Extract DEV-PLAN.md context for an omitted item ---
function getPhasePlanContext(phaseNum) {
  const planPath = join(ROOT, "DEV-PLAN.md");
  if (!existsSync(planPath)) return null;

  const plan = readFileSync(planPath, "utf-8");
  const lines = plan.split("\n");

  // Find Phase header and extract raw text
  let inPhase = false;
  const phaseLines = [];
  for (let i = 0; i < lines.length; i++) {
    const headerMatch = lines[i].match(/^## Phase (\d+):/);
    if (headerMatch) {
      const n = parseInt(headerMatch[1], 10);
      if (n === phaseNum) { inPhase = true; continue; }
      if (inPhase && n !== phaseNum) break;
    }
    if (inPhase) phaseLines.push(lines[i]);
  }
  return phaseLines.join("\n");
}

// --- Generate fix-brief.md ---
function generateFixBrief(report, iteration) {
  const lines = [];
  lines.push(`# Phase ${report.phase} Fix Brief — Iteration ${iteration}/${maxIterations}`);
  lines.push("");
  lines.push(`> 基线分支: ${report.baseBranch}`);
  lines.push(`> 遗漏: ${report.omitted.length} 项 · 已完成: ${report.completed.length}/${report.totalItems}`);
  lines.push("");
  lines.push("依以下指令逐个实现遗漏项。完成后重新运行检查确认。");
  lines.push("");

  const sectionActions = {
    deliverables: { action: "实现", icon: "实现" },
    keyfiles: { action: "创建文件", icon: "创建" },
    acceptance: { action: "验证", icon: "验证" },
  };

  report.omitted.forEach((o, i) => {
    const sa = sectionActions[o.item.section] || { action: "处理", icon: "" };
    lines.push(`## ${i + 1}. [${o.item.section}] ${o.item.text}`);
    lines.push("");
    lines.push(`**操作**: ${sa.action}`);

    // Extract file paths from backtick-quoted text
    const fileMatches = o.item.text.match(/`[^`]+`/g);
    if (fileMatches) {
      const files = fileMatches.map(f => f.replace(/`/g, ""));
      lines.push(`**目标文件**: ${files.join("、")}`);
    }

    // Add section-specific guidance
    if (o.item.section === "keyfiles") {
      lines.push(`**要求**: 创建所列文件，遵循项目现有模式和约定。`);
    } else if (o.item.section === "deliverables") {
      lines.push(`**要求**: 实现所述功能，确保功能完整、边界情况妥善处理。`);
    } else if (o.item.section === "acceptance") {
      lines.push(`**要求**: 确保通过所列验收条件。`);
    }

    lines.push("");
  });

  lines.push("---");
  lines.push(`执行完所有修复后运行：`);
  lines.push("");
  lines.push("```bash");
  lines.push(`pnpm forge-phase-check ${phaseNum}`);
  lines.push("```");
  lines.push("");

  return lines.join("\n");
}

// --- Main ---
const state = readState();

// Reset state if phase changed
if (state.phase !== phaseNum) {
  state.phase = phaseNum;
  state.iteration = 0;
  state.status = "ready";
}

// Check if max iterations reached
if (state.status === "max-reached") {
  console.log(`⚠️ Phase ${phaseNum} 已达最大迭代次数 ${maxIterations}，仍有遗漏未修复。`);
  console.log(`检查 ${join(STATE_DIR, "state.json")} 查看最终状态。`);
  process.exit(0);
}

if (state.status === "complete") {
  console.log(`✅ Phase ${phaseNum} 之前已完成。`);
  process.exit(0);
}

// Run check
console.log(`🔍 Phase ${phaseNum} — Iteration ${state.iteration + 1}/${maxIterations}`);
const report = runCheck();

if (!report) {
  console.error("❌ forge-phase-check 执行失败");
  process.exit(1);
}

if (report.omitted.length === 0) {
  // ALL DONE
  state.status = "complete";
  writeState(state);

  console.log("");
  console.log(`✅ Phase ${phaseNum} 全部完成！共 ${report.totalItems} 项清单均已匹配。`);
  console.log(`变更文件: ${report.changedFiles.length} 个`);
  if (report.redundant.length > 0) {
    console.log(`⚠️ 冗余文件: ${report.redundant.length} 个（未匹配到清单项）`);
  }
  process.exit(0);
}

// Has omissions — check if exceeded max
state.iteration += 1;
if (state.iteration >= maxIterations) {
  state.status = "max-reached";
  writeState(state);

  console.log("");
  console.log(`⚠️ Phase ${phaseNum} 已达最大迭代次数 ${maxIterations}，仍有 ${report.omitted.length} 项遗漏。`);
  console.log(`进度: ${report.completed.length}/${report.totalItems} 完成`);
  report.omitted.forEach(o => {
    console.log(`  - [${o.item.section}] ${o.item.text}`);
  });
  console.log(`状态已保存至 ${join(STATE_DIR, "state.json")}`);
  process.exit(0);
}

// Generate fix brief
state.status = "in-progress";
writeState(state);

const brief = generateFixBrief(report, state.iteration);
ensureDir(STATE_DIR);
writeFileSync(join(STATE_DIR, "fix-brief.md"), brief);

console.log("");
console.log(`📋 Phase ${phaseNum} 尚有 ${report.omitted.length} 项遗漏。`);
console.log(`Fix brief: ${join(STATE_DIR, "fix-brief.md")}`);
console.log(`迭代: ${state.iteration}/${maxIterations}`);
console.log("");
console.log("遗漏摘要:");
report.omitted.forEach(o => {
  console.log(`  ${o.item.section === "deliverables" ? "⚡" : o.item.section === "keyfiles" ? "📄" : "✅"} [${o.item.section}] ${o.item.text}`);
});
console.log("");
console.log("请读取 fix-brief.md 执行所有修复指令，然后重新运行本脚本。");
process.exit(0);
