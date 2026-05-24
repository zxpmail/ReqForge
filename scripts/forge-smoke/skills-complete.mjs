#!/usr/bin/env node
/**
 * skills-complete — 12 个 Skill 目录齐，且 validate-skill 通过
 */
import { spawnSync } from "child_process";
import path from "path";
import { ROOT, createRunner, listSkillNames } from "./lib.mjs";

const r = createRunner("skills-complete");
const skillsDir = path.join(ROOT, "core", "skills");
const names = listSkillNames(skillsDir);

r.assert(names.length === 12, `expected 12 skills, found ${names.length}: ${names.join(", ")}`);

const result = spawnSync(
  process.execPath,
  [path.join(ROOT, "scripts", "validate-skill.mjs"), "core/skills/"],
  { cwd: ROOT, encoding: "utf-8" },
);

if (result.status !== 0) {
  r.fail("validate-skill.mjs failed for core/skills/");
  if (result.stdout) console.error(result.stdout.slice(-2000));
  if (result.stderr) console.error(result.stderr.slice(-2000));
} else {
  r.ok();
}

r.finish();
