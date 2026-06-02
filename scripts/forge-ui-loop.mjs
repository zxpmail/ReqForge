#!/usr/bin/env node
/**
 * forge-ui-loop.mjs — Phase UI 自动完成循环（单次迭代）
 *
 * 用法：
 *   node scripts/forge-ui-loop.mjs <N> [--max <M>] [--url <URL>] [--reset]
 *   pnpm forge-ui-loop <N> [--max <M>] [--url <URL>] [--reset]
 *
 * 功能：
 *   单次迭代：运行 forge-ui-check，如有 UI 问题则生成 fix-brief.md，
 *   供 AI（YOLO 模式）读取并执行修复。
 *
 *   状态文件 .forge/ui-loop/{state.json,fix-brief.md}
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, ".forge", "ui-loop");
const CHECK_SCRIPT = join(ROOT, "scripts", "forge-ui-check.mjs");

// --- Parse args ---
const args = process.argv.slice(2);
let phaseNum = null;
let maxIterations = 5;
let baseUrl = null;
let reset = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--max" && args[i + 1]) {
    maxIterations = parseInt(args[++i], 10);
    continue;
  }
  if (args[i] === "--url" && args[i + 1]) {
    baseUrl = args[++i];
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
    console.log(`重置 Phase ${phaseNum || "?"} UI 循环状态。`);
  } else {
    console.log("无状态需要重置。");
  }
  process.exit(0);
}

if (!phaseNum) {
  console.error("Usage: node scripts/forge-ui-loop.mjs <N> [--max <M>] [--url <URL>] [--reset]");
  console.error("  <N>       Phase number");
  console.error("  --max     Max iterations (default: 5)");
  console.error("  --url     Dev server URL for Playwright checks");
  console.error("  --reset   Reset loop state");
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

function writeState(s) {
  ensureDir(STATE_DIR);
  writeFileSync(join(STATE_DIR, "state.json"), JSON.stringify(s, null, 2));
}

// --- Run check ---
function runCheck() {
  const urlFlag = baseUrl ? ` --url "${baseUrl}"` : "";
  try {
    execSync(
      `node "${CHECK_SCRIPT}" ${phaseNum}${urlFlag}`,
      { cwd: ROOT, encoding: "utf-8", timeout: 180000, stdio: ["pipe", "pipe", "pipe"] },
    );
    return { exitCode: 0 };
  } catch (e) {
    return { exitCode: e.status || 1, output: e.stdout || "", error: e.stderr || "" };
  }
}

// --- Main ---
const state = readState();

if (state.phase !== phaseNum) {
  state.phase = phaseNum;
  state.iteration = 0;
  state.status = "ready";
}

if (state.status === "max-reached") {
  console.log(`⚠️ Phase ${phaseNum} UI 已达最大迭代次数 ${maxIterations}。`);
  console.log(`检查 ${join(STATE_DIR, "state.json")} 查看最终状态。`);
  process.exit(0);
}

if (state.status === "complete") {
  console.log(`✅ Phase ${phaseNum} UI 之前已完成。`);
  process.exit(0);
}

console.log(`🔍 Phase ${phaseNum} UI — Iteration ${state.iteration + 1}/${maxIterations}`);
const result = runCheck();

if (result.exitCode === 0) {
  state.status = "complete";
  writeState(state);
  console.log(`\n✅ Phase ${phaseNum} UI 全部通过！`);
  process.exit(0);
}

// Has failures
state.iteration += 1;
if (state.iteration >= maxIterations) {
  state.status = "max-reached";
  writeState(state);
  console.log(`\n⚠️ Phase ${phaseNum} UI 已达最大迭代次数 ${maxIterations}。`);
  process.exit(0);
}

// Generate fix brief
state.status = "in-progress";
writeState(state);

// Read the generated fix brief from ui-check
const briefSrc = join(ROOT, ".forge", "ui-loop", "fix-brief.md");
if (existsSync(briefSrc)) {
  console.log(`\n📋 Fix brief: ${briefSrc}`);
} else {
  // Generate fallback brief
  ensureDir(STATE_DIR);
  const planPath = join(ROOT, "DEV-PLAN.md");
  let uiItems = [];
  if (existsSync(planPath)) {
    const plan = readFileSync(planPath, "utf-8");
    const lines = plan.split("\n");
    let inPhase = false;
    for (const line of lines) {
      const m = line.match(/^## Phase (\d+):/);
      if (m) { inPhase = parseInt(m[1], 10) === phaseNum; continue; }
      if (inPhase && line.match(/^## /)) break;
      if (inPhase) {
        const li = line.match(/^[-*]\s+(.+)/);
        if (li) uiItems.push(li[1].trim());
      }
    }
  }

  const brief = [`# Phase ${phaseNum} UI Fix Brief — Iteration ${state.iteration}/${maxIterations}`, ""];
  brief.push("UI 验证未通过，需修复以下问题：");
  brief.push("");
  for (const item of uiItems) {
    const files = (item.match(/`[^`]+`/g) || []).map(f => f.replace(/`/g, ""));
    if (files.length > 0) {
      brief.push(`## ${item}`);
      brief.push("**目标文件**: " + files.join(", "));
      brief.push("**要求**: 确保文件存在且导出正确。");
      brief.push("");
    }
  }
  brief.push("---");
  brief.push("修复后运行：");
  brief.push("```bash");
  brief.push(`pnpm forge-ui-check ${phaseNum}${baseUrl ? ` --url ${baseUrl}` : ""}`);
  brief.push("```");

  writeFileSync(briefSrc, brief.join("\n"));
  console.log(`\n📋 Fix brief: ${briefSrc}`);
}

console.log(`迭代: ${state.iteration}/${maxIterations}`);
console.log("请读取 fix-brief.md 执行所有修复指令，然后重新运行。");
process.exit(0);
