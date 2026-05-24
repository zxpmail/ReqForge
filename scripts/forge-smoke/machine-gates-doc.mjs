#!/usr/bin/env node
/**
 * machine-gates-doc — CLAUDE.md 声明三门 Machine Gates；OpenCode AGENTS.md 与主控文件同步
 */
import fs from "fs";
import path from "path";
import { ROOT, createRunner } from "./lib.mjs";

const r = createRunner("machine-gates-doc");
const claudeMd = path.join(ROOT, "CLAUDE.md");
const opencodeAgents = path.join(ROOT, "adapters/opencode/.opencode/AGENTS.md");

r.assert(fs.existsSync(claudeMd), "CLAUDE.md missing at repo root");

const content = fs.readFileSync(claudeMd, "utf-8");
const gates = [
  "Spec-Before-Code Gate",
  "Hallucination Gate",
  "Sloppiness Gate",
  "Overstepping Gate",
  "spec-confirmed",
  "implementer-session",
];

for (const gate of gates) {
  r.assert(content.includes(gate), `CLAUDE.md missing '${gate}'`);
}

r.assert(content.includes("Machine Gates"), "CLAUDE.md missing 'Machine Gates' section reference");

r.assert(fs.existsSync(opencodeAgents), "adapters/opencode/.opencode/AGENTS.md missing");
const opencodeContent = fs.readFileSync(opencodeAgents, "utf-8");
r.assert(
  opencodeContent.includes("[Skill Dispatch]"),
  "OpenCode AGENTS.md missing Skill Dispatch — run pnpm sync (must mirror CLAUDE.md, not agents-template)",
);
for (const gate of gates) {
  r.assert(opencodeContent.includes(gate), `OpenCode AGENTS.md missing '${gate}'`);
}

r.finish();
