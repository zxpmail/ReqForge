#!/usr/bin/env node
/**
 * validate-skill.mjs — Cross-platform Forge SKILL.md validator
 *
 * Usage:
 *   node scripts/validate-skill.mjs core/skills/
 *   node scripts/validate-skill.mjs core/skills/bug-fixer
 *   node scripts/validate-skill.mjs --strict core/skills/
 *   node scripts/validate-skill.mjs --fix core/skills/foo
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
const HARD_GATE_SKILLS = new Set(["product-spec-builder", "dev-planner", "dev-builder"]);

const VALID_TIERS = new Set(["workflow", "interactive", "component"]);

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const fixMode = args.includes("--fix");
const targets = args.filter((a) => !a.startsWith("--"));

if (targets.length === 0) {
  console.error("Usage: node scripts/validate-skill.mjs [--strict|--fix] <skill-dir-or-parent>");
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

  /* SKILL.md frontmatter */
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

  /* skill.json */
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

      /* P7-lite: tier + intent */
      if (!("tier" in d)) {
        error("skill.json missing field: tier (must be workflow|interactive|component)");
      } else if (!VALID_TIERS.has(d.tier)) {
        error(`skill.json tier='${d.tier}' invalid; must be one of: ${[...VALID_TIERS].join("|")}`);
      } else ok();

      if (!("intent" in d)) {
        error("skill.json missing field: intent");
      } else if (typeof d.intent !== "string" || !d.intent.trim()) {
        error("skill.json intent must be a non-empty string");
      } else ok();

      /* description quality: hint at trigger context */
      if (d.description.length < 20) {
        warning(`skill.json description is very short (${d.description.length} chars) — add trigger context`);
        if (strict) fail++;
      }

    } catch (e) {
      error(`skill.json parse error: ${e.message}`);
    }
  }

  /* SKILL.md required sections */
  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(`[${section}`)) error(`Missing required section [${section}]`);
    else ok();
  }

  if (HARD_GATE_SKILLS.has(dirname)) {
    if (!content.includes("[HARD-GATE]")) error("Missing required section [HARD-GATE]");
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

  /* commands/*.md: argument-hint required (string). Bare `[foo]` is YAML array — Copilot CLI drops skill.
   * Use argument-hint: "[foo]" or argument-hint: "" when no args (see issue #10 / PR #11). */
  const cmdDir = path.join(dir, "commands");
  if (fs.existsSync(cmdDir)) {
    for (const name of fs.readdirSync(cmdDir).filter((f) => f.endsWith(".md"))) {
      const cmdPath = path.join(cmdDir, name);
      const cmd = fs.readFileSync(cmdPath, "utf-8");
      const bare = cmd.match(/^argument-hint:\s*\[/m);
      if (bare) {
        error(
          `commands/${name}: bare argument-hint: [...] is YAML array — quote it as argument-hint: "[...]" (Copilot CLI str validation)`,
        );
      } else if (!/^argument-hint:/m.test(cmd)) {
        error(
          `commands/${name}: missing argument-hint (required for slash commands; use argument-hint: "" if none)`,
        );
      } else {
        ok();
      }
    }
  }
}

function applyFix(dir) {
  const skillJson = path.join(dir, "skill.json");
  const dirname = path.basename(dir);
  if (!fs.existsSync(skillJson)) {
    console.log(`  SKIP (no skill.json): ${dirname}`);
    return;
  }

  let changed = false;
  const d = JSON.parse(fs.readFileSync(skillJson, "utf-8"));

  if (!("tier" in d)) {
    const hasCmds = d.commands && d.commands.length > 0;
    const isAuto = d.triggers?.auto;
    if (hasCmds) {
      d.tier = "workflow";
    } else if (isAuto) {
      d.tier = "interactive";
    } else {
      d.tier = "component";
    }
    console.log(`  FIX: tier -> ${d.tier}`);
    changed = true;
  }

  if (!("intent" in d)) {
    d.intent = `Describe the purpose of ${dirname} and when it should be used.`;
    console.log(`  FIX: intent -> (placeholder)`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(skillJson, JSON.stringify(d, null, 2) + "\n");
    console.log(`  SAVED: ${path.relative(ROOT, skillJson)}`);
  } else {
    console.log(`  OK: no fix needed`);
  }
}

/* main */
for (const target of targets) {
  if (fixMode) {
    for (const dir of collectSkillDirs(target)) applyFix(dir);
  } else {
    for (const dir of collectSkillDirs(target)) validateSkill(dir);
  }
}

if (!fixMode) {
  console.log(`\n=== Summary: ${pass} passed checks, ${warn} warnings, ${fail} errors ===`);
  process.exit(fail > 0 ? 1 : 0);
}
