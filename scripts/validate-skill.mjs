#!/usr/bin/env node
/**
 * validate-skill.mjs — Cross-platform Forge SKILL.md validator
 *
 * Usage:
 *   node scripts/validate-skill.mjs core/skills/
 *   node scripts/validate-skill.mjs core/skills/bug-fixer
 *   node scripts/validate-skill.mjs --strict core/skills/
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const REQUIRED_SECTIONS = [
  "Task",
  "Dependency Check",
  "First Principles",
  "Not For",
  "File Structure",
  "Workflow",
  "Initialization",
];
const RECOMMENDED_SECTIONS = ["Output Style", "Gotchas", "Output Artifacts"];

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const targets = args.filter((a) => !a.startsWith("--"));

if (targets.length === 0) {
  console.error("Usage: node scripts/validate-skill.mjs [--strict] <skill-dir-or-parent>");
  process.exit(1);
}

let fail = 0;
let warn = 0;
let pass = 0;

function error(msg) {
  console.log(`  ERROR: ${msg}`);
  fail++;
}
function warning(msg) {
  console.log(`  WARN:  ${msg}`);
  warn++;
}
function ok() {
  pass++;
}

function collectSkillDirs(target) {
  const abs = path.resolve(ROOT, target);
  if (!fs.existsSync(abs)) {
    console.error(`Path not found: ${target}`);
    process.exit(1);
  }
  if (fs.existsSync(path.join(abs, "SKILL.md"))) return [abs];
  return fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(abs, e.name))
    .filter((d) => fs.existsSync(path.join(d, "SKILL.md")));
}

function validateSkill(dir) {
  console.log(`\n=== Validating: ${path.relative(ROOT, dir)} ===`);
  const skillMd = path.join(dir, "SKILL.md");
  const skillJson = path.join(dir, "skill.json");
  const content = fs.readFileSync(skillMd, "utf-8");

  if (!content.includes("---")) error("Missing frontmatter (--- delimiters)");
  else ok();

  if (!/^name:/m.test(content)) error("Missing 'name' in frontmatter");
  else ok();

  if (!/^description:/m.test(content)) error("Missing 'description' in frontmatter");
  else ok();

  const dirname = path.basename(dir);
  if (!/^[a-z][a-z0-9-]*$/.test(dirname)) {
    error(`Directory name '${dirname}' is not kebab-case`);
  } else ok();

  if (!fs.existsSync(skillJson)) {
    error("skill.json not found");
  } else {
    try {
      const d = JSON.parse(fs.readFileSync(skillJson, "utf-8"));
      for (const k of ["name", "version", "description"]) {
        if (!(k in d)) error(`skill.json missing field: ${k}`);
        else ok();
      }
      if (!d.triggers || !["auto", "manual", "command"].every((k) => k in d.triggers)) {
        error("skill.json triggers missing auto/manual/command");
      } else ok();

      const cmd = d.triggers?.command;
      const hasCmdFile =
        fs.existsSync(path.join(dir, "commands")) &&
        fs.readdirSync(path.join(dir, "commands")).length > 0;
      if (cmd && cmd !== "null" && !hasCmdFile) {
        error(`triggers.command=${cmd} but commands/*.md missing`);
      }
    } catch (e) {
      error(`skill.json parse error: ${e.message}`);
    }
  }

  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(`[${section}`)) error(`Missing required section [${section}]`);
    else ok();
  }

  for (const section of RECOMMENDED_SECTIONS) {
    if (!content.includes(`[${section}`)) {
      warning(`Missing recommended section [${section}]`);
      if (strict) fail++;
    } else ok();
  }

  const lines = content.split("\n").length;
  if (lines > 500) {
    warning(`SKILL.md is ${lines} lines (recommended: under 500)`);
    if (strict && lines > 600) error("Strict: SKILL.md exceeds 600 lines");
  } else ok();
}

for (const target of targets) {
  for (const dir of collectSkillDirs(target)) {
    validateSkill(dir);
  }
}

console.log(`\n=== Summary: ${pass} passed checks, ${fail} errors, ${warn} warnings ===`);
process.exit(fail > 0 ? 1 : 0);
