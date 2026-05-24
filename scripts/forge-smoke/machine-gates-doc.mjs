#!/usr/bin/env node
/**
 * machine-gates-doc — CLAUDE.md 声明三门 Machine Gates
 */
import fs from "fs";
import path from "path";
import { ROOT, createRunner } from "./lib.mjs";

const r = createRunner("machine-gates-doc");
const claudeMd = path.join(ROOT, "CLAUDE.md");

r.assert(fs.existsSync(claudeMd), "CLAUDE.md missing at repo root");

const content = fs.readFileSync(claudeMd, "utf-8");
const gates = ["Hallucination Gate", "Sloppiness Gate", "Overstepping Gate"];

for (const gate of gates) {
  r.assert(content.includes(gate), `CLAUDE.md missing '${gate}'`);
}

r.assert(content.includes("Machine Gates"), "CLAUDE.md missing 'Machine Gates' section reference");

r.finish();
