#!/usr/bin/env node
/**
 * forge-evolve.mjs — 进化引擎闭环
 *
 * 扫描 feedback 条目，识别演化候选，生成提案。
 *
 * 用法：
 *   pnpm forge-evolve status          # 查看演化状态
 *   pnpm forge-evolve scan            # 扫描 feedback 候选
 *   pnpm forge-evolve propose         # 生成提案
 *   pnpm forge-evolve apply <id>      # 应用提案
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FEEDBACK_DIR = join(ROOT, ".claude", "feedback");
const EVO_DIR = join(ROOT, ".forge", "evolution");

const args = process.argv.slice(2);
const cmd = args[0];

function usage() {
  console.log(`Usage:
  pnpm forge-evolve status
  pnpm forge-evolve scan
  pnpm forge-evolve propose
  pnpm forge-evolve apply <proposal-id>`);
  process.exit(1);
}

if (!cmd) usage();

// ─── Feedback parsing ──────────────────────────────────────────────

function parseFrontmatter(content) {
  content = content.replace(/\r/g, "");
  const m = content.match(/^---\n([\s\S]+?)\n---\n?/);
  if (!m) return {};
  const fm = {};
  const lines = m[1].split("\n");
  let currentKey = null;
  for (const line of lines) {
    const clean = line.replace(/\r$/, "");
    const kv = clean.match(/^(\w+):\s*(.*)/);
    if (kv) {
      currentKey = kv[1];
      const val = kv[2].trim();
      if (currentKey === "scores") {
        fm.scores = {};
      } else {
        fm[currentKey] = val;
      }
    } else if (currentKey === "scores" && fm.scores) {
      const nv = clean.match(/^\s{2}(\w+):\s+(\d+)/);
      if (nv) fm.scores[nv[1]] = parseInt(nv[2], 10);
    }
  }
  fm.occurrences = parseInt(fm.occurrences, 10) || 1;
  return fm;
}

function loadFeedbackEntries() {
  const indexPath = join(FEEDBACK_DIR, "FEEDBACK-INDEX.md");
  if (!existsSync(indexPath)) return [];
  const index = readFileSync(indexPath, "utf-8");
  const entries = [];
  for (const line of index.split("\n")) {
    const m = line.match(/\[(.+?)\]\((.+?\.md)\)/);
    if (!m) continue;
    const filePath = join(FEEDBACK_DIR, m[2]);
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, "utf-8");
    const fm = parseFrontmatter(content);
    entries.push({ filename: m[2], filePath, frontmatter: fm, body: content });
  }
  return entries;
}

// ─── Status ────────────────────────────────────────────────────────

function cmdStatus() {
  const entries = loadFeedbackEntries();
  if (entries.length === 0) {
    console.log("No feedback entries found.");
    return;
  }

  console.log(`\nFeedback entries: ${entries.length}\n`);
  console.log("| # | Skill | Issue | Occ | Failure Class | Scores | Graduated |");
  console.log("|---|-------|-------|-----|---------------|--------|-----------|");
  entries.forEach((e, i) => {
    const fm = e.frontmatter;
    const scores = fm.scores
      ? `P${fm.scores.precision||"-"}/C${fm.scores.coverage||"-"}/E${fm.scores.efficiency||"-"}/S${fm.scores.satisfaction||"-"}`
      : "none";
    console.log(`| ${i+1} | ${fm.source_skill || "?"} | ${fm.description?.slice(0, 50) || "?"} | ${fm.occurrences} | ${fm.failure_class || "unset"} | ${scores} | ${fm.graduated === "true" ? "✅" : "❌"} |`);
  });
  console.log("");

  // Stats
  const l2 = entries.filter(e => e.frontmatter.occurrences >= 3 && e.frontmatter.graduated !== "true" && e.frontmatter.skipped !== "true");
  const l3Skills = {};
  for (const e of entries) {
    const s = e.frontmatter.source_skill;
    if (!s) continue;
    if (!l3Skills[s]) l3Skills[s] = { entries: [], lowScoreCount: 0 };
    l3Skills[s].entries.push(e);
    const sc = e.frontmatter.scores;
    if (sc) {
      const vals = [sc.precision, sc.coverage, sc.efficiency, sc.satisfaction].filter(v => v);
      if (vals.length > 0 && vals.reduce((a, b) => a + b, 0) / vals.length < 2.5) l3Skills[s].lowScoreCount++;
    }
  }
  const l3 = Object.entries(l3Skills).filter(([_, v]) => v.lowScoreCount >= 2);

  console.log("Summary:");
  console.log(`  Total entries:     ${entries.length}`);
  console.log(`  Level 2 cand.:     ${l2.length} (occurrences >= 3)`);
  console.log(`  Level 3 cand.:     ${l3.length} skill(s) with consistently low scores`);
  if (l2.length > 0) console.log(`  Run: pnpm forge-evolve propose`);
  if (l3.length > 0) console.log(`  Run: pnpm forge-evolve propose`);
}

// ─── Scan ──────────────────────────────────────────────────────────

function cmdScan() {
  const entries = loadFeedbackEntries();
  const l2 = entries.filter(e =>
    e.frontmatter.occurrences >= 3 &&
    e.frontmatter.graduated !== "true" &&
    e.frontmatter.skipped !== "true"
  );
  const l3Skills = {};
  for (const e of entries) {
    const s = e.frontmatter.source_skill;
    if (!s) continue;
    if (!l3Skills[s]) l3Skills[s] = { entries: [], scores: [] };
    l3Skills[s].entries.push(e);
    if (e.frontmatter.scores) l3Skills[s].scores.push(e.frontmatter.scores);
  }
  const l3 = Object.entries(l3Skills).filter(([_, v]) => {
    if (v.scores.length < 2) return false;
    const avg = {};
    for (const dim of ["precision", "coverage", "efficiency", "satisfaction"]) {
      avg[dim] = v.scores.reduce((s, sc) => s + (sc[dim] || 0), 0) / v.scores.length;
    }
    return Object.values(avg).some(v => v <= 2.5);
  });

  if (l2.length === 0 && l3.length === 0) {
    console.log("No evolution candidates found.");
    return;
  }

  if (l2.length > 0) {
    console.log(`\nLevel 2 — Rule graduation candidates (${l2.length}):\n`);
    for (const e of l2) {
      console.log(`  - ${e.frontmatter.source_skill}: ${e.frontmatter.description?.slice(0, 60)}`);
      console.log(`    occurrences: ${e.frontmatter.occurrences}, file: ${e.filename}`);
    }
    console.log("");
  }

  if (l3.length > 0) {
    console.log(`\nLevel 3 — Skill optimization candidates (${l3.length}):\n`);
    for (const [skill, data] of l3) {
      const counts = data.scores.length;
      const avg = {};
      for (const dim of ["precision", "coverage", "efficiency", "satisfaction"]) {
        avg[dim] = (data.scores.reduce((s, sc) => s + (sc[dim] || 0), 0) / counts).toFixed(1);
      }
      console.log(`  - ${skill} (${counts} entries)`);
      console.log(`    avg scores: P${avg.precision} C${avg.coverage} E${avg.efficiency} S${avg.satisfaction}`);
    }
    console.log("");
  }

  console.log(`Run: pnpm forge-evolve propose to generate proposals.`);
}

// ─── Propose ───────────────────────────────────────────────────────

function cmdPropose() {
  const entries = loadFeedbackEntries();
  const candidates = [];

  // Level 2 candidates
  for (const e of entries) {
    if (e.frontmatter.occurrences >= 3 && e.frontmatter.graduated !== "true" && e.frontmatter.skipped !== "true") {
      candidates.push({
        type: "rule-graduation",
        source_skill: e.frontmatter.source_skill,
        target: `core/skills/${e.frontmatter.source_skill}/SKILL.md`,
        threshold: `occurrences: ${e.frontmatter.occurrences} (>= 3)`,
        description: e.frontmatter.description,
        filename: e.filename,
        body: e.body,
      });
    }
  }

  // Level 3 candidates
  const l3Skills = {};
  for (const e of entries) {
    const s = e.frontmatter.source_skill;
    if (!s) continue;
    if (!l3Skills[s]) l3Skills[s] = { entries: [] };
    l3Skills[s].entries.push(e);
  }
  for (const [skill, data] of Object.entries(l3Skills)) {
    const scored = data.entries.filter(e => e.frontmatter.scores);
    if (scored.length < 2) continue;
    const avg = {};
    for (const dim of ["precision", "coverage", "efficiency", "satisfaction"]) {
      avg[dim] = scored.reduce((s, e) => s + (e.frontmatter.scores[dim] || 0), 0) / scored.length;
    }
    if (Object.values(avg).some(v => v <= 2.5)) {
      candidates.push({
        type: "skill-optimization",
        source_skill: skill,
        target: `core/skills/${skill}/SKILL.md`,
        threshold: `avg scores P${avg.precision.toFixed(1)} C${avg.coverage.toFixed(1)} E${avg.efficiency.toFixed(1)} S${avg.satisfaction.toFixed(1)}`,
        description: `${scored.length} feedback entries with low average scores`,
        filename: `${skill}-optimization`,
        body: scored.map(e => `- ${e.frontmatter.description}`).join("\n"),
      });
    }
  }

  if (candidates.length === 0) {
    console.log("No evolution proposals to generate.");
    return;
  }

  mkdirSync(join(EVO_DIR, "proposals"), { recursive: true });

  for (const c of candidates) {
    const id = `evo-${Date.now().toString(36)}-${c.filename.replace(/\.md$/, "").slice(0, 30)}`;
    const proposal = [
      "---",
      `id: ${id}`,
      `type: ${c.type}`,
      `source_skill: ${c.source_skill}`,
      `target: ${c.target}`,
      `threshold: "${c.threshold}"`,
      `created: ${new Date().toISOString().slice(0, 10)}`,
      "status: pending",
      "---",
      "",
      `# Evolution Proposal: ${c.type}`,
      "",
      `**RED**: ${c.description}`,
      "",
      "**GREEN**:",
      `- Review \`${c.target}\` for applicable section ([Gotchas], [Workflow], or [First Principles])`,
      `- Add guidance addressing the recurring issue`,
      "",
      "**Predicted Effect**: Reduced occurrence count for this failure class",
      "",
      "**Verify By**: After applying, run `pnpm forge-evolve status` and confirm no further candidates for this topic",
      "",
      "---",
      "## Source Feedback",
      "",
      c.body.slice(0, 500),
      "",
    ].join("\n");

    const proposalPath = join(EVO_DIR, "proposals", `${id}.md`);
    writeFileSync(proposalPath, proposal, "utf-8");
    console.log(`  ${c.type}: ${id}`);
    console.log(`    → ${proposalPath}`);
  }
  console.log(`\n${candidates.length} proposal(s) generated.`);
  console.log(`Run: pnpm forge-evolve apply <id> to apply a proposal.`);
}

// ─── Apply ─────────────────────────────────────────────────────────

function cmdApply(proposalId) {
  if (!proposalId) { console.error("Usage: pnpm forge-evolve apply <proposal-id>"); process.exit(1); }

  const proposalsDir = join(EVO_DIR, "proposals");
  if (!existsSync(proposalsDir)) { console.log("No proposals directory found."); return; }

  const files = readdirSync(proposalsDir).filter(f => f.startsWith(proposalId));
  if (files.length === 0) { console.log(`Proposal "${proposalId}" not found.`); return; }

  const proposalPath = join(proposalsDir, files[0]);
  const content = readFileSync(proposalPath, "utf-8");
  const fm = parseFrontmatter(content);

  // Update proposal status
  const updated = content.replace(/status: pending/, "status: applied");
  writeFileSync(proposalPath, updated, "utf-8");

  // If proposal references a feedback file, mark it graduated
  const body = content.replace(/^---[\s\S]*?---\n?/, "");
  for (const entry of loadFeedbackEntries()) {
    if (entry.frontmatter.source_skill === fm.source_skill && entry.frontmatter.graduated !== "true") {
      const graded = entry.body.replace(/graduated:\s*false/, "graduated: true");
      writeFileSync(entry.filePath, graded, "utf-8");
      console.log(`  Updated ${entry.filename}: graduated → true`);
    }
  }

  console.log(`Proposal ${proposalId} applied.`);
  console.log(`\nNext: Review the GREEN change and manually apply it to ${fm.target || "the target file"}.`);
}

// ─── Dispatch ──────────────────────────────────────────────────────

try {
  if (cmd === "status") cmdStatus();
  else if (cmd === "scan") cmdScan();
  else if (cmd === "propose") cmdPropose();
  else if (cmd === "apply") cmdApply(args[1]);
  else usage();
} catch (e) {
  console.error(`forge-evolve error: ${e.message}`);
  process.exit(1);
}
