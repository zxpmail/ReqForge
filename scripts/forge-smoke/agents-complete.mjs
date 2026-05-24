#!/usr/bin/env node
/**
 * agents-complete — full loadout 引用的 agent 均在 core/agents 存在
 */
import fs from "fs";
import path from "path";
import { ROOT, createRunner, listAgentNames } from "./lib.mjs";

const r = createRunner("agents-complete");
const agents = new Set(listAgentNames(path.join(ROOT, "core", "agents")));
const fullLoadout = path.join(ROOT, "core", "loadouts", "full.json");
const data = JSON.parse(fs.readFileSync(fullLoadout, "utf-8"));

r.assert(agents.size >= 10, `expected at least 10 agents in core/agents, found ${agents.size}`);

for (const agent of data.agents) {
  r.assert(agents.has(agent), `full loadout references unknown agent '${agent}'`);
}

r.finish();
