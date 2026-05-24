#!/usr/bin/env node
/**
 * hooks-wired — full loadout 的 10 个默认 hook 均在 core/hooks 有实现
 */
import path from "path";
import fs from "fs";
import { ROOT, createRunner, hookExists } from "./lib.mjs";

const r = createRunner("hooks-wired");
const hooksDir = path.join(ROOT, "core", "hooks");
const fullLoadout = path.join(ROOT, "core", "loadouts", "full.json");
const data = JSON.parse(fs.readFileSync(fullLoadout, "utf-8"));

r.assert(Array.isArray(data.hooks), "full.json must list hooks");
r.assert(data.hooks.length === 10, `full loadout expected 10 hooks, got ${data.hooks.length}`);

for (const hook of data.hooks) {
  r.assert(hookExists(hooksDir, hook), `full loadout hook '${hook}' missing in core/hooks/`);
}

const evolutionSh = fs.readFileSync(path.join(hooksDir, "check-evolution.sh"), "utf-8");
r.assert(evolutionSh.includes("find_feedback_index"), "check-evolution.sh must resolve multi-client feedback paths");
r.assert(evolutionSh.includes("find_bootstrap_file"), "check-evolution.sh must resolve forge-bootstrap");

r.finish();
