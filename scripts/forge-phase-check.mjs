#!/usr/bin/env node
/**
 * forge-phase-check.mjs — Phase 完成检查
 *
 * 用法：
 *   node scripts/forge-phase-check.mjs <N> [--base <branch>]
 *   pnpm forge-phase-check <N>
 *
 * 功能：
 *   读取 DEV-PLAN.md Phase N 的交付清单，git diff 比对实际变更，
 *   输出遗漏/冗余/完成三项报告。
 *
 *   不靠 AI 判断 — 纯机械的清单⇔文件对照。
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, statSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// --- Parse args ---
const args = process.argv.slice(2);
let phaseNum = null;
let baseBranch = "main";
let jsonOutput = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--base" && args[i + 1]) {
    baseBranch = args[++i];
    continue;
  }
  if (args[i] === "--json") {
    jsonOutput = true;
    continue;
  }
  if (/^\d+$/.test(args[i])) {
    phaseNum = parseInt(args[i], 10);
  }
}

if (!phaseNum) {
  console.error("Usage: node scripts/forge-phase-check.mjs <N> [--base <branch>] [--json]");
  console.error("  <N>       Phase number (e.g. 3 for Phase 3)");
  console.error("  --base    Git base branch for diff comparison (default: main)");
  console.error("  --json    Output raw JSON report instead of formatted text");
  process.exit(1);
}

// --- 1. Parse DEV-PLAN.md ---
const planPath = join(ROOT, "DEV-PLAN.md");
if (!existsSync(planPath)) {
  console.error("DEV-PLAN.md not found at", planPath);
  process.exit(1);
}

const plan = readFileSync(planPath, "utf-8");
const lines = plan.split("\n");

// Find Phase header
let phaseStart = -1;
let phaseEnd = lines.length;
for (let i = 0; i < lines.length; i++) {
  const headerMatch = lines[i].match(/^## Phase (\d+):/);
  if (headerMatch) {
    const n = parseInt(headerMatch[1], 10);
    if (phaseStart === -1 && n === phaseNum) {
      phaseStart = i;
    } else if (phaseStart !== -1 && n <= phaseNum) {
      // Same or earlier phase header — skip
    } else if (phaseStart !== -1) {
      phaseEnd = i;
      break;
    }
  }
}

if (phaseStart === -1) {
  console.error(`Phase ${phaseNum} not found in DEV-PLAN.md`);
  process.exit(1);
}

const phaseLines = lines.slice(phaseStart, phaseEnd);

// Extract checklist items from 交付内容, 关键文件, 验收标准 sections
function extractItems(lines) {
  const items = [];
  let currentSection = null;
  for (const line of lines) {
    // Skip the Phase header itself
    if (line.match(/^## Phase \d+:/)) continue;
    if (line.includes("**交付内容**")) { currentSection = "deliverables"; continue; }
    if (line.includes("**关键文件**"))  { currentSection = "keyfiles"; continue; }
    if (line.includes("**验收标准**"))  { currentSection = "acceptance"; continue; }
    if (line.match(/^## /)) break;
    const match = line.match(/^[-*]\s+(.+)/);
    if (match && currentSection) {
      items.push({ section: currentSection, text: match[1].trim() });
    }
  }
  return items;
}

const items = extractItems(phaseLines);

if (items.length === 0) {
  console.error(`No checklist items found for Phase ${phaseNum}`);
  process.exit(1);
}

// --- 2. git diff — get changed files ---
function getGitDiff(base) {
  try {
    // Get merge-base first, then diff against it
    let mergeBase;
    try {
      mergeBase = execSync(
        `git merge-base HEAD "${base}"`,
        { cwd: ROOT, encoding: "utf-8", timeout: 15000, stdio: ["pipe", "pipe", "pipe"] },
      ).trim();
    } catch {
      mergeBase = base;
    }
    // If we're ON the base branch, merge-base == HEAD → empty diff.
    // Try upstream tracking branch first (captures all unmerged commits),
    // fall back to HEAD~1 (last commit only).
    const head = execSync(`git rev-parse HEAD`, { cwd: ROOT, encoding: "utf-8", timeout: 10000 }).trim();
    if (mergeBase === head) {
      try {
        mergeBase = execSync(
          `git rev-parse @{upstream}`,
          { cwd: ROOT, encoding: "utf-8", timeout: 10000, stdio: ["pipe", "pipe", "pipe"] },
        ).trim();
      } catch {
        mergeBase = execSync(
          `git rev-parse HEAD~1`,
          { cwd: ROOT, encoding: "utf-8", timeout: 10000, stdio: ["pipe", "pipe", "pipe"] },
        ).trim();
      }
    }
    const out = execSync(
      `git diff --name-only "${mergeBase}"...HEAD`,
      { cwd: ROOT, encoding: "utf-8", timeout: 30000, stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
    return out ? out.split("\n").filter(Boolean) : [];
  } catch {
    try {
      const out = execSync(
        `git diff --name-only HEAD.."${base}"`,
        { cwd: ROOT, encoding: "utf-8", timeout: 30000, stdio: ["pipe", "pipe", "pipe"] },
      ).trim();
      return out ? out.split("\n").filter(Boolean) : [];
    } catch {
      return [];
    }
  }
}

const changedFiles = getGitDiff(baseBranch);

// Also get unstaged/working tree changes
function getWorkingChanges() {
  try {
    const out = execSync(
      `git diff --name-only`,
      { cwd: ROOT, encoding: "utf-8", timeout: 10000, stdio: "pipe" },
    ).trim();
    if (out) return out.split("\n").filter(Boolean);
  } catch {}
  return [];
}

const workingChanges = getWorkingChanges();
const allChanges = [...new Set([...changedFiles, ...workingChanges])];

// --- 3. Cross-reference ---
// For each item, extract keywords (files, module names, terms)
function extractKeywords(text) {
  // Extract file paths
  const fileMatches = text.match(/`[^`]+`/g) || [];
  const files = fileMatches.map(f => f.replace(/`/g, ""));
  // Extract bare words (skip common words)
  const words = text
    .replace(/`[^`]+`/g, "")
    .split(/[\s,，、()（）\[\]]+/)
    .filter(w => w.length >= 2 && !/^\d+$/.test(w));
  return { files, words };
}

function matchItemToFiles(item, changedFiles, allFiles) {
  const { files: explicitFiles, words } = extractKeywords(item.text);
  const matchedFiles = [];

  // Priority 1: explicit file path matches
  for (const ef of explicitFiles) {
    const hit = allFiles.find(f => f.includes(ef.replace(/^\.\//, "")));
    if (hit) matchedFiles.push(hit);
  }

  // Priority 2: keyword matches in file paths
  if (matchedFiles.length === 0) {
    for (const w of words) {
      const kw = w.toLowerCase();
      const hits = allFiles.filter(f => f.toLowerCase().includes(kw));
      for (const h of hits) {
        if (!matchedFiles.includes(h)) matchedFiles.push(h);
      }
    }
  }

  return matchedFiles;
}

function isItemLikelyCode(item) {
  // Key files that match actual file paths should always be checked
  return true;
}

const report = {
  phase: phaseNum,
  baseBranch,
  totalItems: items.length,
  completed: [],
  omitted: [],
  redundant: [],
  items,
  changedFiles: allChanges,
};

for (const item of items) {
  const matched = matchItemToFiles(item, changedFiles, allChanges);
  if (matched.length > 0) {
    report.completed.push({ item, matchedFiles: matched });
  } else if (isItemLikelyCode(item)) {
    report.omitted.push({ item });
  } else {
    report.completed.push({ item, matchedFiles: ["(non-code item)"] });
  }
}

// Redundancy check: files changed but not matched to any item
const allMatchedFiles = new Set();
for (const c of report.completed) {
  for (const f of c.matchedFiles) {
    allMatchedFiles.add(f);
  }
}

for (const f of allChanges) {
    const skipPrefixes = [".git/", "node_modules/", ".pnpm/", ".forge/"];
    if (skipPrefixes.some(p => f.startsWith(p))) continue;
    if (!allMatchedFiles.has(f)) {
    report.redundant.push(f);
  }
}

// --- 4. Output ---
function formatReport(r) {
  const lines = [];
  const pct = r.completed.length / r.totalItems;

  lines.push(`# Phase ${r.phase} 完成检查报告`);
  lines.push(`> 基线分支: ${r.baseBranch} · 变更文件: ${r.changedFiles.length} 个`);
  lines.push(`> 清单项: ${r.totalItems} 项`);
  lines.push("");

  // Summary bar
  const barLen = 20;
  const done = Math.round(pct * barLen);
  const remain = barLen - done;
  lines.push(`**${Math.round(pct * 100)}% 完成** (${r.completed.length}/${r.totalItems})`);
  lines.push(`[${"#".repeat(done)}${"-".repeat(remain)}]`);
  lines.push("");

  // Omissions
  if (r.omitted.length > 0) {
    lines.push(`## ❌ 遗漏 (${r.omitted.length})`);
    for (const o of r.omitted) {
      lines.push(`- **${o.item.section}**: ${o.item.text}`);
    }
    lines.push("");
  }

  // Completed
  lines.push(`## ✅ 完成 (${r.completed.length})`);
  for (const c of r.completed) {
    const files = c.matchedFiles.length > 0 ? c.matchedFiles.join(", ") : "(无文件匹配)";
    lines.push(`- ${c.item.text}`);
    lines.push(`  → ${files}`);
  }
  lines.push("");

  // Redundancy
  if (r.redundant.length > 0) {
    lines.push(`## ⚠️ 可能冗余 (${r.redundant.length})`);
    lines.push(`以下文件被修改但未匹配到任何清单项（${r.redundant.length} 个，最多显示 20 个）：`);
    const showRedundant = r.redundant.slice(0, 20);
    for (const f of showRedundant) {
      lines.push(`- ${f}`);
    }
    if (r.redundant.length > 20) {
      lines.push(`  ... 另有 ${r.redundant.length - 20} 个未显示`);
    }

  }

  // Verdict
  if (r.omitted.length === 0) {
    lines.push("**结论**: 所有清单项均有对应文件变更。");
  } else {
    lines.push(`**结论**: 有 ${r.omitted.length} 项可能遗漏，建议补充实现后再完成 Phase。`);
  }

  return lines.join("\n");
}

if (jsonOutput) {
  console.log(JSON.stringify(report));
} else {
  console.log(formatReport(report));
}

// Exit code: 0 if no omissions, 1 if omissions found
process.exit(report.omitted.length > 0 ? 1 : 0);
