#!/usr/bin/env node
/**
 * forge-skill-eval.mjs — 技能评估状态面板
 *
 * 集中查看所有技能的评估包状态、judge 部署情况。
 *
 * 用法：
 *   pnpm forge-skill-eval status        # 查看所有技能评估状态
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SKILLS_DIR = join(ROOT, ".forge", "skills");

const args = process.argv.slice(2);
const cmd = args[0];

function usage() {
  console.log(`Usage:
  pnpm forge-skill-eval status    View eval status across all skills`);
  process.exit(1);
}

if (!cmd) usage();

function getSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith("."))
    .map(d => d.name)
    .sort();
}

function cmdStatus() {
  const skills = getSkills();
  if (skills.length === 0) {
    console.log("No skills found in .forge/skills/");
    return;
  }

  console.log(`\n=== Skill Eval Status: ${skills.length} skills ===\n`);

  console.log("| # | Skill | triggers | cases | judge-config | judge-history |");
  console.log("|---|-------|----------|-------|-------------|---------------|");

  let withTriggers = 0;
  let withCases = 0;
  let withJudgeConfig = 0;
  let withHistory = 0;

  skills.forEach((name, i) => {
    const evalDir = join(SKILLS_DIR, name, "eval");

    const hasTriggers = existsSync(join(evalDir, "triggers.json"));
    const hasCases = existsSync(join(evalDir, "cases.json"));
    const hasJudgeConfig = existsSync(join(evalDir, "judge-config.json"));
    const hasHistory = existsSync(join(evalDir, "judge-history.json"));

    const triggersCount = hasTriggers
      ? JSON.parse(readFileSync(join(evalDir, "triggers.json"), "utf-8")).cases?.length || 0
      : 0;
    const casesCount = hasCases
      ? JSON.parse(readFileSync(join(evalDir, "cases.json"), "utf-8")).cases?.length || 0
      : 0;

    if (hasTriggers) withTriggers++;
    if (hasCases) withCases++;
    if (hasJudgeConfig) withJudgeConfig++;
    if (hasHistory) withHistory++;

    console.log(
      `| ${i+1} | ${name} | ${hasTriggers ? `${triggersCount} ✅` : "❌"} | ${hasCases ? `${casesCount} ✅` : "❌"} | ${hasJudgeConfig ? "✅" : "❌"} | ${hasHistory ? "✅" : "❌"} |`
    );
  });

  console.log("");
  console.log("Summary:");
  console.log(`  Total skills:       ${skills.length}`);
  console.log(`  With triggers:      ${withTriggers}/${skills.length}`);
  console.log(`  With cases:         ${withCases}/${skills.length}`);
  console.log(`  With judge-config:  ${withJudgeConfig}/${skills.length}`);
  console.log(`  With judge-history: ${withHistory}/${skills.length}`);
  console.log("");

  if (withJudgeConfig < skills.length) {
    console.log(`Run: pnpm skill-eval judge-all to deploy missing judge-configs`);
  }
  if (withHistory < skills.length) {
    console.log(`Run: pnpm skill-eval judge <name> → AI sub-agent → pnpm skill-eval judge-record <name> --report <file>`);
  }
}

try {
  if (cmd === "status") cmdStatus();
  else usage();
} catch (e) {
  console.error(`forge-skill-eval error: ${e.message}`);
  process.exit(1);
}
