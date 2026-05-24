#!/usr/bin/env node
/**
 * loadouts-valid — 4 个 loadout JSON 结构合法，且 skills/agents/hooks 引用存在
 */
import fs from "fs";
import path from "path";
import {
  ROOT,
  createRunner,
  listSkillNames,
  listAgentNames,
  hookExists,
  listLoadoutFiles,
} from "./lib.mjs";

const r = createRunner("loadouts-valid");
const skills = new Set(listSkillNames(path.join(ROOT, "core", "skills")));
const agents = new Set(listAgentNames(path.join(ROOT, "core", "agents")));
const hooksDir = path.join(ROOT, "core", "hooks");
const loadoutsDir = path.join(ROOT, "core", "loadouts");
const files = listLoadoutFiles(loadoutsDir);

const KEBAB = /^[a-z][a-z0-9-]*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;

r.assert(files.length >= 4, `expected at least 4 loadouts, found ${files.length}`);

for (const file of files) {
  const base = path.basename(file, ".json");
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {
    r.fail(`${base}: invalid JSON — ${e.message}`);
    continue;
  }

  r.assert(data.name === base, `${base}: name field must match filename`);
  r.assert(typeof data.description === "string" && data.description.length > 0, `${base}: missing description`);
  r.assert(SEMVER.test(data.version ?? ""), `${base}: version must be semver`);
  r.assert(Array.isArray(data.skills) && data.skills.length > 0, `${base}: skills must be non-empty array`);
  r.assert(Array.isArray(data.agents) && data.agents.length > 0, `${base}: agents must be non-empty array`);
  r.assert(Array.isArray(data.hooks), `${base}: hooks must be an array`);

  for (const skill of data.skills) {
    r.assert(KEBAB.test(skill), `${base}: invalid skill name '${skill}'`);
    r.assert(skills.has(skill), `${base}: unknown skill '${skill}'`);
  }
  for (const agent of data.agents) {
    r.assert(KEBAB.test(agent), `${base}: invalid agent name '${agent}'`);
    r.assert(agents.has(agent), `${base}: unknown agent '${agent}'`);
  }
  for (const hook of data.hooks) {
    r.assert(KEBAB.test(hook), `${base}: invalid hook name '${hook}'`);
    r.assert(hookExists(hooksDir, hook), `${base}: hook '${hook}' not found in core/hooks/`);
  }

  r.assert(Array.isArray(data.scenarios) && data.scenarios.length > 0, `${base}: scenarios must be non-empty array`);
  for (const scenario of data.scenarios) {
    r.assert(KEBAB.test(scenario), `${base}: invalid scenario tag '${scenario}'`);
  }
}

r.finish();
