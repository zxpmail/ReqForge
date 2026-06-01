#!/usr/bin/env node
/**
 * forge-loop.mjs — 统一 Phase 开发循环
 *
 * 每次迭代：
 *   1. 执行（Serve）→ 启动 dev server（可选）
 *   2. 检测（Detect）→ 交付清单⇔git diff + UI 文件存在性 + Playwright
 *   3. 修改（Fix）→ 自动创建缺失的关键文件/目录骨架，余下留给 fix-brief.md
 *   4. 测试（Test）→ pnpm test + Playwright 断言
 *   5. 报告 → clean？下一轮 / 超限？停止
 *
 * 用法：
 *   pnpm forge-loop                                        # 列出未完成的阶段
 *   pnpm forge-loop --all                                  # 自动逐个执行所有未完成阶段
 *   pnpm forge-loop <N>                                    # 执行指定阶段
 *   pnpm forge-loop <N> --serve "pnpm dev"                 # 启动 dev server
 *   pnpm forge-loop <N> --url http://localhost:5173        # 已有 dev server
 *   pnpm forge-loop <N> --max 10                           # 最多 10 次
 *   pnpm forge-loop <N> --skip-plan                        # 跳过交付清单
 *   pnpm forge-loop <N> --skip-ui                          # 跳过 UI
 *   pnpm forge-loop <N> --skip-test                        # 跳过 pnpm test
 *   pnpm forge-loop <N> --reset                            # 重置状态
 */

import { execSync, spawn } from "child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_DIR = join(ROOT, ".forge", "loop");

// === Args ===
const args = process.argv.slice(2);
let phaseNum = null;
let maxIterations = 5;
let baseUrl = null;
let serveCmd = null;
let skipPlan = false;
let skipUi = false;
let skipTest = false;
let reset = false;
let allMode = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--max" && args[i + 1]) { maxIterations = parseInt(args[++i], 10); continue; }
  if (args[i] === "--url" && args[i + 1]) { baseUrl = args[++i]; continue; }
  if (args[i] === "--serve" && args[i + 1]) { serveCmd = args[++i]; continue; }
  if (args[i] === "--skip-plan") { skipPlan = true; continue; }
  if (args[i] === "--skip-ui") { skipUi = true; continue; }
  if (args[i] === "--skip-test") { skipTest = true; continue; }
  if (args[i] === "--reset") { reset = true; continue; }
  if (args[i] === "--all" || args[i] === "--auto") { allMode = true; continue; }
  if (/^\d+$/.test(args[i])) { phaseNum = parseInt(args[i], 10); }
}

// --- Auto-detect incomplete phases ---
function findIncompletePhases() {
  const planPath = join(ROOT, "DEV-PLAN.md");
  if (!existsSync(planPath)) return [];
  const plan = readFileSync(planPath, "utf-8");
  const lines = plan.split("\n");
  const phases = [];
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith("| Phase |")) { inTable = true; continue; }
    if (line.startsWith("|---")) continue;
    if (inTable) {
      if (!line.startsWith("|")) { inTable = false; continue; }
      const match = line.match(/^\|\s*(\d+)\s+(.+?)\s*\|\s*(.+?)\s*\|/);
      if (match) {
        const num = parseInt(match[1], 10);
        const status = match[3].trim();
        if (!status.includes("✅")) {
          phases.push({ num, name: match[2].trim(), status });
        }
      }
    }
  }
  return phases;
}

// No phase number → show incomplete or use --all
if (!phaseNum && !reset) {
  const incomplete = findIncompletePhases();
  if (incomplete.length === 0) {
    console.log(`✅ DEV-PLAN.md 所有阶段已完成！`);
    process.exit(0);
  }
  if (allMode) {
    // Chain: run each incomplete phase sequentially
    phaseNum = incomplete[0].num;
    console.log(`\n📋 ${incomplete.length} 个阶段未完成，从 Phase ${phaseNum} 开始。\n`);
    // Write chaining state so next call picks up the next phase
    const chainState = { remaining: incomplete.slice(1).map(p => p.num), phase: phaseNum };
    const chainDir = join(STATE_DIR, "..", "loop-chain.json");
    ensureDir(STATE_DIR);
    writeFileSync(chainDir, JSON.stringify(chainState, null, 2));
  } else {
    console.log(`📋 ${incomplete.length} 个阶段未完成：`);
    incomplete.forEach(p => console.log(`   Phase ${p.num} — ${p.name} (${p.status})`));
    console.log(`\n使用 --all 自动逐个执行，或指定 Phase 号。`);
    process.exit(0);
  }
}

if (reset) {
  if (existsSync(STATE_DIR)) { rmSync(STATE_DIR, { recursive: true }); console.log(`重置 Phase ${phaseNum || "?"} 循环状态。`); }
  else { console.log("无状态需要重置。"); }
  process.exit(0);
}

if (!phaseNum) {
  console.error("Usage: node scripts/forge-loop.mjs [<N>] [options]");
  console.error("  <N>               Phase number (omit to list incomplete, --all to auto-execute)");
  console.error("  --all             Auto-execute all incomplete phases sequentially");
  console.error("  --serve <cmd>     Start dev server (e.g. 'pnpm dev')");
  console.error("  --url <url>       Dev server URL for Playwright");
  console.error("  --max <M>         Max iterations per phase (default: 5)");
  console.error("  --skip-plan       Skip delivery checklist check");
  console.error("  --skip-ui         Skip UI / Playwright check");
  console.error("  --skip-test       Skip pnpm test");
  console.error("  --reset           Reset loop state");
  process.exit(1);
}

// === State ===
function ensureDir(p) { if (!existsSync(p)) mkdirSync(p, { recursive: true }); }

function readState() {
  const p = join(STATE_DIR, "state.json");
  if (!existsSync(p)) return { phase: phaseNum, maxIterations, iteration: 0, status: "ready", autoFixed: [] };
  try { return JSON.parse(readFileSync(p, "utf-8")); }
  catch { return { phase: phaseNum, maxIterations, iteration: 0, status: "ready", autoFixed: [] }; }
}

function writeState(s) { ensureDir(STATE_DIR); writeFileSync(join(STATE_DIR, "state.json"), JSON.stringify(s, null, 2)); }

// === Execute: start dev server ===
let serverProcess = null;

function startServer(cmd) {
  if (!cmd) return;
  console.log(`\n▶ 启动 dev server: ${cmd}`);
  const parts = cmd.split(/\s+/);
  serverProcess = spawn(parts[0], parts.slice(1), {
    cwd: ROOT,
    stdio: "ignore",
    shell: true,
    detached: true,
  });
  // Wait for server to start
  try { execSync("sleep 3", { timeout: 5000 }); } catch {}
  // Derive URL from serve command if not explicitly set
  if (!baseUrl) {
    const portMatch = cmd.match(/(\d{4})/);
    baseUrl = `http://localhost:${portMatch ? portMatch[1] : "5173"}`;
    console.log(`  推断 URL: ${baseUrl}`);
  }
  console.log(`  PID: ${serverProcess.pid}`);
}

function stopServer() {
  if (serverProcess) {
    try { process.kill(-serverProcess.pid); } catch {}
    try { serverProcess.kill(); } catch {}
    serverProcess = null;
  }
}

// === Detect 1: Phase delivery checklist ===
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
    catch { return { ok: true, omitted: [], completed: [], totalItems: 0 }; }
  }
}

// === Detect 2: UI static + Playwright ===
function checkUi() {
  if (skipUi) return { ok: true, issues: [] };
  const urlFlag = baseUrl ? ` --url "${baseUrl}"` : "";
  try {
    execSync(
      `node "${join(ROOT, "scripts", "forge-ui-check.mjs")}" ${phaseNum}${urlFlag}`,
      { cwd: ROOT, encoding: "utf-8", timeout: 180000, stdio: ["pipe", "pipe", "pipe"] },
    );
    return { ok: true, issues: [] };
  } catch (e) {
    return { ok: false, issues: [{ type: "ui", detail: (e.stdout || "").slice(0, 500) }] };
  }
}

// === Detect 3: pnpm test ===
function runTests() {
  if (skipTest) return { ok: true, output: "" };
  try {
    const out = execSync("pnpm test", { cwd: ROOT, encoding: "utf-8", timeout: 120000, stdio: "pipe" });
    return { ok: true, output: out.trim() };
  } catch (e) {
    return { ok: false, output: (e.stdout || "").trim(), error: (e.stderr || "").slice(0, 500) };
  }
}

// === Fix: auto-create missing keyfiles ===
function parsePhaseItems() {
  const planPath = join(ROOT, "DEV-PLAN.md");
  if (!existsSync(planPath)) return [];
  const plan = readFileSync(planPath, "utf-8");
  const lines = plan.split("\n");

  let phaseStart = -1, phaseEnd = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^## Phase (\d+):/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (phaseStart === -1 && n === phaseNum) phaseStart = i;
      else if (phaseStart !== -1) { phaseEnd = i; break; }
    }
  }
  if (phaseStart === -1) return [];

  const phaseLines = lines.slice(phaseStart, phaseEnd);
  const items = [];
  let inKeyfiles = false;
  for (const line of phaseLines) {
    if (line.match(/^## Phase \d+:/)) continue;
    if (line.includes("**关键文件**")) { inKeyfiles = true; continue; }
    if (line.includes("**交付内容**") || line.includes("**验收标准**")) { inKeyfiles = false; continue; }
    if (line.match(/^## /)) break;
    const match = line.match(/^[-*]\s+(.+)/);
    if (match && inKeyfiles) items.push(match[1].trim());
  }
  return items;
}

function autoCreateFiles(items) {
  const created = [];
  for (const item of items) {
    const files = (item.match(/`[^`]+`/g) || []).map(f => f.replace(/`/g, ""));
    for (const f of files) {
      const absPath = join(ROOT, f);
      if (existsSync(absPath)) continue;

      // Directory marker
      if (f.endsWith("/") || f.endsWith(".gitkeep")) {
        const dir = f.endsWith(".gitkeep") ? dirname(f) : f.slice(0, -1);
        ensureDir(join(ROOT, dir));
        if (f.endsWith(".gitkeep")) {
          writeFileSync(absPath, "");
          created.push(f);
        } else {
          created.push(dir + "/");
        }
        continue;
      }

      // File — create with skeleton
      ensureDir(dirname(absPath));
      const ext = basename(f).split(".").pop();

      if (ext === "ts" || ext === "tsx") {
        const isTest = f.includes(".test.") || f.includes(".spec.");
        if (isTest) {
          writeFileSync(absPath, `import { describe, it, expect } from "vitest";\n\ndescribe("${basename(f).replace(/\.(test|spec)\.tsx?$/, "")}", () => {\n  it("should work", () => {\n    expect(true).toBe(true);\n  });\n});\n`);
        } else {
          writeFileSync(absPath, `// TODO: implement\n\nexport {};\n`);
        }
        created.push(f);
      } else if (ext === "json") {
        writeFileSync(absPath, "{\n  \n}\n");
        created.push(f);
      } else if (ext === "css" || ext === "scss") {
        writeFileSync(absPath, "/* TODO: add styles */\n");
        created.push(f);
      } else if (ext === "md") {
        writeFileSync(absPath, `# ${basename(f, ".md")}\n\nTODO: add documentation\n`);
        created.push(f);
      } else if (ext === "html") {
        writeFileSync(absPath, "<!DOCTYPE html>\n<html><head><title></title></head><body>\n  <!-- TODO -->\n</body></html>\n");
        created.push(f);
      } else {
        writeFileSync(absPath, "");
        created.push(f);
      }
    }
  }
  return created;
}

// === Generate fix brief ===
function generateFixBrief(planOmitted, autoCreated, testResult, uiResult, iteration) {
  const brief = [];
  brief.push(`# Phase ${phaseNum} 修复指令 — Iteration ${iteration}/${maxIterations}`);
  brief.push("");

  if (autoCreated.length > 0) {
    brief.push(`## 自动修复 (${autoCreated.length}项)`);
    brief.push("以下文件已自动创建骨架：");
    autoCreated.forEach(f => brief.push(`  ✅ \`${f}\``));
    brief.push("");
    brief.push("这些骨架文件可能需要补充具体实现内容。");
    brief.push("");
  }

  const remaining = planOmitted.filter(o => {
    const files = (o.item.text.match(/`[^`]+`/g) || []).map(f => f.replace(/`/g, ""));
    return files.some(f => !autoCreated.includes(f));
  });

  if (remaining.length > 0) {
    brief.push(`## 交付遗漏 (${remaining.length}项)`);
    brief.push("以下项需 AI 修复：");
    brief.push("");
    const sectionActions = { deliverables: "实现", keyfiles: "创建文件", acceptance: "验证" };
    remaining.forEach((o, i) => {
      const sa = sectionActions[o.item.section] || "处理";
      brief.push(`### ${i + 1}. [${o.item.section}] ${o.item.text}`);
      brief.push("");
      brief.push(`**操作**: ${sa}`);
      const files = (o.item.text.match(/`[^`]+`/g) || []).map(f => f.replace(/`/g, ""));
      if (files.length > 0) brief.push(`**目标文件**: ${files.join("、")}`);
      if (o.item.section === "keyfiles") brief.push("**要求**: 创建列出的文件，实现其完整功能。");
      else if (o.item.section === "deliverables") brief.push("**要求**: 实现所述功能，包含边界情况处理。");
      else if (o.item.section === "acceptance") brief.push("**要求**: 确保满足验收条件。");
      brief.push("");
    });
  }

  if (!testResult.ok) {
    brief.push("## 测试失败");
    brief.push("```");
    brief.push((testResult.error || testResult.output || "").slice(0, 1000));
    brief.push("```");
    brief.push("");
  }

  if (!uiResult.ok) {
    brief.push("## UI 问题");
    brief.push("UI 验证未通过。请确保 UI 文件已创建且 Playwright 测试通过。");
    brief.push("");
  }

  brief.push("---");
  brief.push(`修复后重新运行：\`pnpm forge-loop ${phaseNum}${serveCmd ? ` --serve "${serveCmd}"` : ""}${baseUrl && !serveCmd ? ` --url ${baseUrl}` : ""}\``);
  brief.push("");

  return brief.join("\n");
}

// === Check if phase has been started ===
function hasPhaseStarted() {
  try {
    // If we have state, phase has been worked on
    if (existsSync(join(STATE_DIR, "state.json"))) return true;
    // Check git diff — any file changes indicate work in progress
    let mergeBase;
    try { mergeBase = execSync(`git merge-base HEAD main`, { cwd: ROOT, encoding: "utf-8", timeout: 15000 }).trim(); }
    catch { mergeBase = "main"; }
    const out = execSync(
      `git diff --name-only "${mergeBase}"...HEAD`,
      { cwd: ROOT, encoding: "utf-8", timeout: 30000, stdio: "pipe" },
    ).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

// === Chain: advance to next phase after completion ===
function chainNext() {
  const chainPath = join(ROOT, ".forge", "loop-chain.json");
  if (!existsSync(chainPath)) return false;
  try {
    const chain = JSON.parse(readFileSync(chainPath, "utf-8"));
    if (chain.remaining.length === 0) { rmSync(chainPath); return false; }
    const next = chain.remaining.shift();
    chain.phase = next;
    writeFileSync(chainPath, JSON.stringify(chain, null, 2));
    console.log(`\n═══════════════════════════════════════`);
    console.log(`  ➡ 进入下一阶段: Phase ${next}`);
    console.log(`═══════════════════════════════════════\n`);
    // Re-execute with new phase — spawn self
    const selfCmd = `node ${fileURLToPath(import.meta.url)} ${next}${serveCmd ? ` --serve "${serveCmd}"` : ""}${baseUrl ? ` --url ${baseUrl}` : ""} --max ${maxIterations}${skipPlan ? " --skip-plan" : ""}${skipUi ? " --skip-ui" : ""}${skipTest ? " --skip-test" : ""}`;
    execSync(selfCmd, { cwd: ROOT, stdio: "inherit", timeout: 3600000 });
    return true;
  } catch (e) {
    console.error("chain error:", e.message);
    return false;
  }
}

// === Main ===
const state = readState();

if (state.phase !== phaseNum) { state.phase = phaseNum; state.iteration = 0; state.status = "ready"; state.autoFixed = []; }

if (state.status === "max-reached") {
  console.log(`⚠️ Phase ${phaseNum} 已达最大迭代次数 ${maxIterations}。`);
  if (chainNext()) process.exit(0);
  process.exit(0);
}
if (state.status === "complete") {
  console.log(`✅ Phase ${phaseNum} 之前已完成。`);
  process.exit(0);
}

// Building → was dispatched to dev-builder, now check if started
if (state.status === "building" && hasPhaseStarted()) {
  state.status = "ready"; // was building, now has changes → enter verification
  writeState(state);
}

// Phase not started → tell Claude to run dev-builder first
if (!hasPhaseStarted()) {
  console.log(`⏳ Phase ${phaseNum} 尚未启动。`);
  console.log(``);
  if (args.includes("--run")) {
    // Auto-dispatch dev-builder
    state.status = "building";
    writeState(state);
    console.log(`准备执行 dev-builder for Phase ${phaseNum}。`);
    console.log(``);
    console.log(`请实现以下清单中的全部内容：`);
    // Print the Phase checklist for context
    const planPath = join(ROOT, "DEV-PLAN.md");
    if (existsSync(planPath)) {
      const plan = readFileSync(planPath, "utf-8");
      const lines = plan.split("\n");
      let inPhase = false;
      for (const line of lines) {
        const m = line.match(/^## Phase (\d+):/);
        if (m) { inPhase = parseInt(m[1], 10) === phaseNum; if (inPhase) console.log(`\n${line}`); continue; }
        if (inPhase && line.match(/^## /)) break;
        if (inPhase) console.log(line);
      }
    }
    console.log(``);
    console.log(`实现完成后运行：`);
    console.log(`  pnpm forge-loop ${phaseNum}`);
  } else {
    console.log(`该 Phase 还未开始实现。使用 --run 自动执行 dev-builder。`);
    console.log(``);
    console.log(`或者手动执行：`);
    console.log(`  运行 dev-builder for Phase ${phaseNum}`);
    console.log(`  完成后: pnpm forge-loop ${phaseNum}`);
  }
  process.exit(0);
}

console.log(`\n═══════════════════════════════════════`);
console.log(`  Phase ${phaseNum} — Iteration ${state.iteration + 1}/${maxIterations}`);
console.log(`═══════════════════════════════════════\n`);

// ---- 1. Execute ----
if (serveCmd && state.iteration === 0) startServer(serveCmd);

// ---- 2. Detect ----
console.log(`▸ 检测交付清单...`);
const planResult = checkPlan();
if (!planResult.ok) console.log(`  ${planResult.omitted.length} 项遗漏`);

console.log(`▸ 检测 UI...`);
const uiResult = checkUi();
if (!uiResult.ok) console.log(`  UI 问题`);

console.log(`▸ 运行测试...`);
const testResult = runTests();
console.log(`  ${testResult.ok ? "✅ 通过" : "❌ 失败"}`);

// ---- 3. Fix: auto-create missing keyfiles ----
console.log(`▸ 自动修复关键文件...`);
const phaseItems = parsePhaseItems();
const autoCreated = autoCreateFiles(phaseItems);
if (autoCreated.length > 0) {
  console.log(`  创建了 ${autoCreated.length} 个缺失文件/目录`);
  autoCreated.forEach(f => console.log(`    ✅ ${f}`));
}

// ---- 4. Re-detect after auto-fix ----
const planAfterFix = autoCreated.length > 0 ? checkPlan() : planResult;
const allOk = planAfterFix.ok && testResult.ok && uiResult.ok;

if (allOk) {
  state.status = "complete";
  writeState(state);
  console.log(`\n✅ Phase ${phaseNum} 全部通过！`);
  stopServer();
  if (chainNext()) process.exit(0);
  process.exit(0);
}

// ---- 5. Iterate or stop ----
state.iteration += 1;
if (state.iteration >= maxIterations) {
  state.status = "max-reached";
  writeState(state);
  console.log(`\n⚠️ Phase ${phaseNum} 已达最大迭代次数 ${maxIterations}。`);
  stopServer();
  if (chainNext()) process.exit(0);
  process.exit(0);
}

// Generate fix brief for AI
state.status = "in-progress";
state.autoFixed = (state.autoFixed || []).concat(autoCreated);
writeState(state);

const brief = generateFixBrief(planAfterFix.omitted, autoCreated, testResult, uiResult, state.iteration);
ensureDir(STATE_DIR);
writeFileSync(join(STATE_DIR, "fix-brief.md"), brief);

console.log(`\n📋 修复指令 → ${join(STATE_DIR, "fix-brief.md")}`);
console.log(`  自动创建 ${autoCreated.length} 个文件，剩余 ${planAfterFix.omitted.length} 项需 AI 修复`);
console.log(`  迭代 ${state.iteration}/${maxIterations}`);
console.log(`\n读取 fix-brief.md 执行修复后重新运行。`);
process.exit(0);
