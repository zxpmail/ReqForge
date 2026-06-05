#!/usr/bin/env node
/**
 * forge-evidence.mjs — 三级证据分级报告
 *
 * 从 forge-loop --fde 产生的证据数据中，按三级粒度生成报告：
 *   dev     — 代码级细节（覆盖率、diff、traces、门禁明细）
 *   lead    — 负责人视图（门禁通过率、趋势、回归汇总）
 *   client  — 客户视图（功能交付确认、验收标准）
 *
 * 用法：
 *   pnpm forge-evidence generate <phase> [--tier dev|lead|client] [--dir <dir>] [--json]
 *   pnpm forge-evidence aggregate [--tier lead|client] [--dir <dir>]
 *   pnpm forge-evidence list [--dir <dir>]
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname, basename, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── CLI ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const cmd = args[0];

function usage() {
  console.log(`Usage:
  pnpm forge-evidence generate <phase> [--tier dev|lead|client] [--dir <dir>] [--json]
  pnpm forge-evidence aggregate [--tier lead|client] [--dir <dir>]
  pnpm forge-evidence list [--dir <dir>]`);
  process.exit(1);
}

if (!cmd) usage();

// ─── Utilities ─────────────────────────────────────────────────────

function normalizePath(p) {
  // Convert cygwin/Git Bash /c/... style paths to Windows C:\...
  if (process.platform === "win32" && p && p.match(/^\/[a-zA-Z]\//)) {
    return p[1].toUpperCase() + ":\\" + p.slice(3).replace(/\//g, "\\");
  }
  return p;
}

function resolveDir(raw) {
  if (!raw) return normalizePath(process.cwd());
  // Already absolute (Windows drive letter)
  if (raw.match(/^[A-Z]:\\/)) return raw;
  // Absolute cygwin-style — normalize
  if (raw.startsWith("/")) return normalizePath(raw);
  // Relative — resolve against cwd then normalize
  return normalizePath(join(process.cwd(), raw));
}

function loadJson(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, "utf-8")); }
  catch { return null; }
}

/** Read .forge/evidence/phase-<N>-report.json */
function loadEvidenceReport(phase, projectDir) {
  const p = join(projectDir, ".forge", "evidence", `phase-${phase}-report.json`);
  return loadJson(p);
}

/** List all evidence phase numbers available */
function listPhases(projectDir) {
  const evDir = join(projectDir, ".forge", "evidence");
  if (!existsSync(evDir)) return [];
  return readdirSync(evDir)
    .filter(f => f.match(/^phase-(\d+)-report\.json$/))
    .map(f => parseInt(f.match(/^phase-(\d+)/)[1], 10))
    .sort((a, b) => a - b);
}

/** Read DEV-PLAN.md and extract phase section */
function loadDevPlanSection(phase, projectDir) {
  const planPath = join(projectDir, "DEV-PLAN.md");
  if (!existsSync(planPath)) return null;
  const text = readFileSync(planPath, "utf-8");
  const lines = text.split("\n");
  let inPhase = false, result = [];
  for (const line of lines) {
    const m = line.match(/^## Phase (\d+):/);
    if (m) {
      if (parseInt(m[1], 10) === parseInt(phase, 10)) { inPhase = true; result.push(line); }
      else if (inPhase) break;
      continue;
    }
    if (inPhase) result.push(line);
  }
  return result.join("\n").trim() || null;
}

/** Extract phase name from DEV-PLAN.md title line */
function getPhaseName(phase, projectDir) {
  const section = loadDevPlanSection(phase, projectDir);
  if (!section) return `Phase ${phase}`;
  const first = section.split("\n")[0];
  const m = first.match(/^## Phase \d+:\s*(.+)/);
  return m ? m[1].trim() : `Phase ${phase}`;
}

/** Read step traces from .forge/trace/step-traces.jsonl */
function loadStepTraces(projectDir, phase) {
  const p = join(projectDir, ".forge", "trace", "step-traces.jsonl");
  if (!existsSync(p)) return [];
  const lines = readFileSync(p, "utf-8").split("\n").filter(Boolean);
  const traces = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  if (phase) return traces.filter(t => t.phase === parseInt(phase, 10));
  return traces;
}

/** Get git diff stats relative to main */
function getGitDiff(projectDir) {
  try {
    let mergeBase;
    try { mergeBase = execSync("git merge-base HEAD main", { cwd: projectDir, encoding: "utf-8", timeout: 15000 }).trim(); }
    catch { mergeBase = "main"; }
    const files = execSync(`git diff --name-only "${mergeBase}"...HEAD`, { cwd: projectDir, encoding: "utf-8", timeout: 15000, stdio: "pipe" }).trim();
    const statsRaw = execSync(`git diff --shortstat "${mergeBase}"...HEAD`, { cwd: projectDir, encoding: "utf-8", timeout: 15000, stdio: "pipe" }).trim();
    const stats = { files: 0, added: 0, deleted: 0 };
    if (statsRaw) {
      const fm = statsRaw.match(/(\d+)\s+file/);
      if (fm) stats.files = parseInt(fm[1], 10);
      const im = statsRaw.match(/(\d+)\s+insertion/);
      if (im) stats.added = parseInt(im[1], 10);
      const dm = statsRaw.match(/(\d+)\s+deletion/);
      if (dm) stats.deleted = parseInt(dm[1], 10);
    }
    return {
      filesChanged: files ? files.split("\n") : [],
      stats,
      raw: statsRaw,
    };
  } catch {
    return { filesChanged: [], stats: { files: 0, added: 0, deleted: 0 }, raw: "" };
  }
}

/** Run forge-coverage for dev tier */
function getCoverage(projectDir) {
  const scriptPath = join(ROOT, "scripts", "forge-coverage.mjs");
  if (!existsSync(scriptPath)) return null;
  try {
    const out = execSync(
      `node "${scriptPath}" report --dir "${projectDir}" --json`,
      { cwd: ROOT, encoding: "utf-8", timeout: 120000, stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
    return JSON.parse(out);
  } catch {
    return null;
  }
}

/** Count checkmarks in a DEV-PLAN.md acceptance section */
function countAcceptanceCriteria(phase, projectDir) {
  const section = loadDevPlanSection(phase, projectDir);
  if (!section) return { total: 0, completed: 0 };
  const lines = section.split("\n");
  let inAcceptance = false;
  let total = 0, completed = 0;
  for (const line of lines) {
    if (line.includes("**Acceptance Criteria**") || line.includes("**验收标准**")) { inAcceptance = true; continue; }
    if (inAcceptance && line.match(/^## /) && !line.match(/^## Phase/)) break;
    if (inAcceptance && line.match(/^[-*]\s+/)) {
      total++;
      if (line.includes("✅") || line.includes("✓")) completed++;
    }
  }
  return { total, completed };
}

// ─── Tier: Dev ─────────────────────────────────────────────────────

function generateDevReport(phase, projectDir) {
  const report = loadEvidenceReport(phase, projectDir);
  const coverage = getCoverage(projectDir);
  const diff = getGitDiff(projectDir);
  const traces = loadStepTraces(projectDir, phase);
  const phaseName = getPhaseName(phase, projectDir);
  const evidence = report?.evidence || { checklist: { ok: false, passed: 0, omitted: 0, total: 0 }, ui: { ok: false }, test: { ok: false } };

  const lines = [];
  lines.push(`# Dev Evidence Report — Phase ${phase}: ${phaseName}`);
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push(``);

  // 1. Gate Results
  lines.push(`## Gate Results`);
  lines.push(``);
  lines.push(`| Gate | Result | Detail |`);
  lines.push(`|------|--------|--------|`);
  lines.push(`| 交付清单 | ${evidence.checklist.ok ? "✅" : "❌"} | ${evidence.checklist.passed}/${evidence.checklist.total} 通过, ${evidence.checklist.omitted} 遗漏 |`);
  lines.push(`| UI 检查 | ${evidence.ui.ok ? "✅" : "❌"} | ${evidence.ui.ok ? "通过" : "失败"} |`);
  lines.push(`| 测试 | ${evidence.test.ok ? "✅" : "❌"} | ${evidence.test.ok ? "通过" : "失败"} |`);
  lines.push(``);

  // 2. Test Coverage
  lines.push(`## Test Coverage`);
  lines.push(``);
  if (coverage?.files?.length > 0) {
    const covFiles = coverage.files;
    const wellCovered = covFiles.filter(f => (f.lines ?? f.estimatedCoverage ?? 0) >= 80);
    const partial = covFiles.filter(f => { const c = f.lines ?? f.estimatedCoverage ?? 0; return c >= 50 && c < 80; });
    const low = covFiles.filter(f => (f.lines ?? f.estimatedCoverage ?? 0) < 50);
    lines.push(`| Category | Count |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Well-covered (≥80%) | ${wellCovered.length} |`);
    lines.push(`| Partial (50-79%) | ${partial.length} |`);
    lines.push(`| Low (<50%) | ${low.length} |`);
    lines.push(`| **Total** | **${covFiles.length}** |`);
    lines.push(``);
    if (low.length > 0) {
      lines.push(`### Low-coverage files`);
      lines.push(``);
      lines.push(`| File | Coverage |`);
      lines.push(`|------|----------|`);
      for (const f of low) {
        const cov = f.lines ?? f.estimatedCoverage ?? 0;
        lines.push(`| \`${f.path}\` | ${cov}% |`);
      }
      lines.push(``);
    }
  } else {
    lines.push(`No coverage data available. Run forge-coverage to generate.`);
    lines.push(``);
  }

  // 3. Git Diff
  lines.push(`## Git Diff`);
  lines.push(``);
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Files changed | ${diff.stats.files} |`);
  lines.push(`| Lines added | ${diff.stats.added} |`);
  lines.push(`| Lines deleted | ${diff.stats.deleted} |`);
  lines.push(``);
  if (diff.filesChanged.length > 0) {
    lines.push(`### Files`);
    lines.push(``);
    lines.push("```");
    lines.push(diff.filesChanged.join("\n"));
    lines.push("```");
    lines.push(``);
  }

  // 4. Step Traces
  lines.push(`## Step Traces`);
  lines.push(``);
  if (traces.length > 0) {
    const failures = traces.filter(t => t.status === "fail");
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total steps | ${traces.length} |`);
    lines.push(`| Failures | ${failures.length} |`);
    if (failures.length > 0) {
      lines.push(``);
      lines.push(`### Failures`);
      lines.push(``);
      for (const f of failures) {
        lines.push(`- Step: ${f.step || "?"} | Type: ${f.failure?.type || "?"} | Detail: ${(f.failure?.detail || "").slice(0, 200)}`);
      }
    }
    lines.push(``);
  } else {
    lines.push(`No step traces recorded.`);
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`*Generated by forge-evidence — dev tier*`);
  return lines.join("\n");
}

// ─── Tier: Lead ────────────────────────────────────────────────────

function generateLeadReport(phase, projectDir) {
  const report = loadEvidenceReport(phase, projectDir);
  const phaseName = getPhaseName(phase, projectDir);
  const allPhases = listPhases(projectDir);
  const evidence = report?.evidence || { checklist: { ok: false, passed: 0, omitted: 0, total: 0 }, ui: { ok: false }, test: { ok: false } };

  const lines = [];
  lines.push(`# Lead Evidence Report — Phase ${phase}: ${phaseName}`);
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push(``);

  // Phase status
  lines.push(`## Phase Status`);
  lines.push(``);
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| Status | ${report?.status || "unknown"} |`);
  lines.push(`| Completed | ${evidence.checklist.ok && evidence.ui.ok && evidence.test.ok ? "✅" : "❌"} |`);
  lines.push(`| Files changed | ${report?.filesChanged?.length || 0} |`);
  lines.push(`| Auto-created | ${report?.autoCreated?.length || 0} |`);
  lines.push(``);

  // Gate pass rates
  lines.push(`## Gate Pass Rates`);
  lines.push(``);
  if (allPhases.length > 0) {
    let checklistPass = 0, uiPass = 0, testPass = 0;
    for (const p of allPhases) {
      const r = loadEvidenceReport(p, projectDir);
      if (!r) continue;
      if (r.evidence?.checklist?.ok) checklistPass++;
      if (r.evidence?.ui?.ok) uiPass++;
      if (r.evidence?.test?.ok) testPass++;
    }
    lines.push(`| Gate | Pass Rate |`);
    lines.push(`|------|-----------|`);
    lines.push(`| 交付清单 | ${allPhases.length > 0 ? Math.round(checklistPass / allPhases.length * 100) : 0}% (${checklistPass}/${allPhases.length}) |`);
    lines.push(`| UI 检查 | ${allPhases.length > 0 ? Math.round(uiPass / allPhases.length * 100) : 0}% (${uiPass}/${allPhases.length}) |`);
    lines.push(`| 测试 | ${allPhases.length > 0 ? Math.round(testPass / allPhases.length * 100) : 0}% (${testPass}/${allPhases.length}) |`);
    lines.push(``);
  } else {
    lines.push(`Single phase — pass rates not available.`);
    lines.push(``);
  }

  // Open issues
  lines.push(`## Issues`);
  lines.push(``);
  const issues = [];
  if (!evidence.checklist.ok) issues.push(`交付清单: ${evidence.checklist.passed}/${evidence.checklist.total} passed, ${evidence.checklist.omitted} omitted`);
  if (!evidence.ui.ok) issues.push(`UI 检查: failed`);
  if (!evidence.test.ok) issues.push(`测试: failed`);
  if (issues.length === 0) {
    lines.push(`No open issues.`);
  } else {
    for (const issue of issues) lines.push(`- ❌ ${issue}`);
  }
  lines.push(``);

  lines.push(`---`);
  lines.push(`*Generated by forge-evidence — lead tier*`);
  return lines.join("\n");
}

// ─── Tier: Client ──────────────────────────────────────────────────

function generateClientReport(phase, projectDir) {
  const report = loadEvidenceReport(phase, projectDir);
  const phaseName = getPhaseName(phase, projectDir);
  const section = loadDevPlanSection(phase, projectDir);
  const evidence = report?.evidence || { checklist: { ok: false }, ui: { ok: false }, test: { ok: false } };
  const ac = countAcceptanceCriteria(phase, projectDir);

  const lines = [];
  lines.push(`# Delivery Report — Phase ${phase}: ${phaseName}`);
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push(``);

  // Description
  lines.push(`## Overview`);
  lines.push(``);
  if (section) {
    // Extract first few non-header lines as description
    const descLines = section.split("\n").filter(l => !l.startsWith("#") && !l.startsWith("**") && !l.match(/^\s*$/));
    const desc = descLines.slice(0, 5).join("\n").trim();
    if (desc) lines.push(desc);
  }
  lines.push(``);

  // Deliverables (key files created/modified)
  lines.push(`## Deliverables`);
  lines.push(``);
  const changedFiles = report?.filesChanged || [];
  if (changedFiles.length > 0) {
    for (const f of changedFiles) {
      lines.push(`- [x] \`${f}\``);
    }
  } else {
    lines.push(`Pending — no deliverable files confirmed.`);
  }
  lines.push(``);

  // Acceptance Criteria
  lines.push(`## Acceptance Criteria`);
  lines.push(``);
  if (section) {
    const sectionLines = section.split("\n");
    let inAcceptance = false;
    let found = false;
    for (const line of sectionLines) {
      if (line.includes("**Acceptance Criteria**") || line.includes("**验收标准**")) {
        inAcceptance = true;
        found = true;
        continue;
      }
      if (inAcceptance && line.match(/^## /) && !line.match(/^## Phase/)) break;
      if (inAcceptance && line.match(/^[-*]\s+/)) {
        const hasCheck = line.includes("✅") || line.includes("✓");
        lines.push(`- ${hasCheck ? "[x]" : "[ ]"} ${line.replace(/^[-*]\s+/, "").replace(/✅/, "").trim()}`);
      }
    }
    if (!found) {
      lines.push(`(No acceptance criteria section found in DEV-PLAN.md for this phase.)`);
    }
  } else {
    lines.push(`(DEV-PLAN.md section not found.)`);
  }
  lines.push(``);

  // Gate summary (no technical detail)
  lines.push(`## Quality Gates`);
  lines.push(``);
  const allOk = evidence.checklist.ok && evidence.ui.ok && evidence.test.ok;
  lines.push(`- ${allOk ? "[x]" : "[ ]"} All quality gates passed`);
  lines.push(``);

  lines.push(`---`);
  lines.push(`*Generated by forge-evidence — client tier*`);
  return lines.join("\n");
}

// ─── Aggregate ─────────────────────────────────────────────────────

function aggregateLead(projectDir) {
  const phases = listPhases(projectDir);
  const lines = [];
  lines.push(`# Lead Aggregate Report — All Phases`);
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push(``);

  if (phases.length === 0) {
    lines.push(`No evidence data found.`);
    lines.push(``);
    lines.push(`---`);
    lines.push(`*Generated by forge-evidence — lead aggregate*`);
    return lines.join("\n");
  }

  lines.push(`## Phase Summary`);
  lines.push(``);
  lines.push(`| Phase | Name | Status | Checklist | UI | Test |`);
  lines.push(`|-------|------|--------|-----------|----|------|`);
  let checklistPass = 0, uiPass = 0, testPass = 0;
  let passed = 0, failed = 0;
  for (const p of phases) {
    const r = loadEvidenceReport(p, projectDir);
    const name = getPhaseName(p, projectDir);
    const status = r?.status || "?";
    const ck = r?.evidence?.checklist?.ok ? "✅" : "❌";
    const ui = r?.evidence?.ui?.ok ? "✅" : "❌";
    const test = r?.evidence?.test?.ok ? "✅" : "❌";
    if (r?.evidence?.checklist?.ok) checklistPass++;
    if (r?.evidence?.ui?.ok) uiPass++;
    if (r?.evidence?.test?.ok) testPass++;
    if (status === "passed") passed++;
    else failed++;
    lines.push(`| ${p} | ${name.slice(0, 40)} | ${status} | ${ck} | ${ui} | ${test} |`);
  }
  lines.push(``);

  // Trend
  lines.push(`## Gate Trend`);
  lines.push(``);
  lines.push(`| Gate | Pass Rate |`);
  lines.push(`|------|-----------|`);
  lines.push(`| 交付清单 | ${Math.round(checklistPass / phases.length * 100)}% (${checklistPass}/${phases.length}) |`);
  lines.push(`| UI 检查 | ${Math.round(uiPass / phases.length * 100)}% (${uiPass}/${phases.length}) |`);
  lines.push(`| 测试 | ${Math.round(testPass / phases.length * 100)}% (${testPass}/${phases.length}) |`);
  lines.push(``);

  // Regression summary
  lines.push(`## Status Summary`);
  lines.push(``);
  lines.push(`| Outcome | Count |`);
  lines.push(`|---------|-------|`);
  lines.push(`| Passed | ${passed} |`);
  lines.push(`| Failed / Max-reached | ${failed} |`);
  lines.push(`| **Total phases** | **${phases.length}** |`);
  lines.push(``);

  lines.push(`---`);
  lines.push(`*Generated by forge-evidence — lead aggregate*`);
  return lines.join("\n");
}

function aggregateClient(projectDir) {
  const phases = listPhases(projectDir);
  const lines = [];
  lines.push(`# Delivery Confirmation — All Phases`);
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push(``);

  if (phases.length === 0) {
    lines.push(`No evidence data found.`);
    lines.push(``);
    lines.push(`---`);
    lines.push(`*Generated by forge-evidence — client aggregate*`);
    return lines.join("\n");
  }

  let totalAc = 0, completedAc = 0;
  let totalFiles = new Set();

  for (const p of phases) {
    const report = loadEvidenceReport(p, projectDir);
    const name = getPhaseName(p, projectDir);
    const allOk = report?.evidence?.checklist?.ok && report?.evidence?.ui?.ok && report?.evidence?.test?.ok;
    const ac = countAcceptanceCriteria(p, projectDir);
    totalAc += ac.total;
    completedAc += ac.completed;

    lines.push(`### Phase ${p}: ${name}`);
    lines.push(``);
    lines.push(`- ${allOk ? "[x]" : "[ ]"} All quality gates passed`);
    if (report?.filesChanged) {
      for (const f of report.filesChanged) {
        totalFiles.add(f);
      }
    }
    lines.push(`  - Files: ${report?.filesChanged?.length || 0}`);
    lines.push(`  - Acceptance criteria: ${ac.completed}/${ac.total}`);
    lines.push(``);
  }

  lines.push(`### Summary`);
  lines.push(``);
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Phases completed | ${phases.length} |`);
  lines.push(`| Unique files delivered | ${totalFiles.size} |`);
  lines.push(`| Acceptance criteria met | ${completedAc}/${totalAc} |`);
  lines.push(``);

  lines.push(`---`);
  lines.push(`*Generated by forge-evidence — client aggregate*`);
  return lines.join("\n");
}

// ─── Dispatch ──────────────────────────────────────────────────────

async function main() {
  let phase, tier = "dev", projectDir = process.cwd(), jsonOutput = false;

  // Parse global options and command
  if (cmd === "generate") {
    phase = args[1];
    if (!phase || !/^\d+$/.test(phase)) usage();
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--tier" && args[i + 1]) { tier = args[++i]; continue; }
      if (args[i] === "--dir" && args[i + 1]) { projectDir = resolveDir(args[++i]); continue; }
      if (args[i] === "--json") { jsonOutput = true; continue; }
    }
    if (!["dev", "lead", "client"].includes(tier)) { console.error(`Invalid tier: ${tier}. Use dev|lead|client.`); process.exit(1); }

    let content;
    if (tier === "dev") content = generateDevReport(phase, projectDir);
    else if (tier === "lead") content = generateLeadReport(phase, projectDir);
    else content = generateClientReport(phase, projectDir);

    if (jsonOutput) {
      console.log(JSON.stringify({ phase: parseInt(phase, 10), tier, content, generatedAt: new Date().toISOString() }));
    } else {
      // Write report file
      const outDir = join(projectDir, ".forge", "evidence");
      mkdirSync(outDir, { recursive: true });
      const outPath = join(outDir, `phase-${phase}-${tier}-report.md`);
      writeFileSync(outPath, content, "utf-8");
      console.log(`📊 ${tier} tier evidence report → ${outPath}`);
    }
  } else if (cmd === "aggregate") {
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--tier" && args[i + 1]) { tier = args[++i]; continue; }
      if (args[i] === "--dir" && args[i + 1]) { projectDir = resolveDir(args[++i]); continue; }
    }
    if (!["lead", "client"].includes(tier)) { console.error(`Aggregate supports lead|client tiers only.`); process.exit(1); }

    const content = tier === "lead" ? aggregateLead(projectDir) : aggregateClient(projectDir);
    const outDir = join(projectDir, ".forge", "evidence");
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, `aggregate-${tier}-report.md`);
    writeFileSync(outPath, content, "utf-8");
    console.log(`📊 ${tier} aggregate report → ${outPath}`);
  } else if (cmd === "list") {
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--dir" && args[i + 1]) { projectDir = resolveDir(args[++i]); continue; }
    }
    const phases = listPhases(projectDir);
    if (phases.length === 0) {
      console.log("No evidence phases found.");
    } else {
      console.log("Evidence phases:");
      for (const p of phases) {
        const name = getPhaseName(p, projectDir);
        console.log(`  Phase ${p}: ${name}`);
      }
    }
  } else {
    usage();
  }
}

main().catch(e => {
  console.error(`forge-evidence error: ${e.message}`);
  process.exit(1);
});
