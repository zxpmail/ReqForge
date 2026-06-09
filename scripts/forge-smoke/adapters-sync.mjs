#!/usr/bin/env node
/**
 * adapters-sync — core/skills 与四端 adapter 技能目录名一致
 */
import path from "path";
import { ROOT, createRunner, listSkillNames, ADAPTER_SKILL_PATHS } from "./lib.mjs";

const r = createRunner("adapters-sync");
const coreNames = listSkillNames(path.join(ROOT, "core", "skills"));
const coreJson = JSON.stringify(coreNames);

r.assert(coreNames.length === 15, `core/skills expected 15, got ${coreNames.length}`);

for (const [adapter, relPath] of Object.entries(ADAPTER_SKILL_PATHS)) {
  const adapterDir = path.join(ROOT, relPath);
  const adapterNames = listSkillNames(adapterDir);
  const adapterJson = JSON.stringify(adapterNames);

  r.assert(adapterNames.length > 0, `${adapter}: skills directory missing or empty (${relPath})`);
  r.assert(
    coreJson === adapterJson,
    `${adapter}: out of sync with core/skills\n    core:    ${coreNames.join(", ")}\n    adapter: ${adapterNames.join(", ")}`,
  );
}

r.finish();
