#!/usr/bin/env node
/**
 * skill-bypass.mjs — P2：带 command 的 Skill 须在 CLAUDE.md Skill Dispatch 中可发现
 */
import fs from "fs";
import path from "path";
import { ROOT, createRunner, listSkillNames } from "./lib.mjs";

const r = createRunner("skill-bypass");
const skillsDir = path.join(ROOT, "core", "skills");
const claudeMd = fs.readFileSync(path.join(ROOT, "CLAUDE.md"), "utf-8");

const DISPATCH_SKILLS = [
  "product-spec-builder",
  "change-manager",
  "dev-planner",
  "dev-builder",
  "bug-fixer",
  "code-review",
  "release-builder",
  "skill-builder",
  "evolution-engine",
];

for (const name of DISPATCH_SKILLS) {
  const slash = `/${name}`;
  r.assert(
    claudeMd.includes(slash),
    `CLAUDE.md Skill Dispatch must reference '${slash}' (skill-bypass / silent-bypass guard)`,
  );
}

for (const name of listSkillNames(skillsDir)) {
  const skillJson = path.join(skillsDir, name, "skill.json");
  if (!fs.existsSync(skillJson)) continue;
  const data = JSON.parse(fs.readFileSync(skillJson, "utf-8"));
  const cmd = data.triggers?.command;
  if (!cmd || cmd === "null") continue;
  const cmdFile = path.join(skillsDir, name, "commands", `${cmd.replace(/^\//, "")}.md`);
  r.assert(fs.existsSync(cmdFile), `skill '${name}' command ${cmd} missing commands/*.md`);
}

r.finish();
