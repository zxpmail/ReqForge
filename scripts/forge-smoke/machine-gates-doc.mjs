#!/usr/bin/env node
/**
 * machine-gates-doc — Machine Gates 契约 ⇄ 实现一致：
 *   1) CLAUDE.md 声明为 hook-enforced 的 gate 必须有真实 enforcing file（防 ghost gate）；
 *   2) 声明为 not-yet-enforced 的 gate 必须显式标注（契约不得声称它不 enforce 的东西）；
 *   3) OpenCode AGENTS.md 与主控文件同步（gate 名字齐全）。
 */
import fs from "fs";
import path from "path";
import { ROOT, createRunner } from "./lib.mjs";

const r = createRunner("machine-gates-doc");
const claudeMd = path.join(ROOT, "CLAUDE.md");
const opencodeAgents = path.join(ROOT, "adapters/opencode/.opencode/AGENTS.md");

r.assert(fs.existsSync(claudeMd), "CLAUDE.md missing at repo root");

const content = fs.readFileSync(claudeMd, "utf-8");

// Names that must appear in the contract (enforced + declared-not-yet-enforced).
const gateNames = [
  "Spec-Before-Code Gate",
  "Idea Stage Exit Criteria",
  "Hallucination Gate",
  "Sloppiness Gate",
  "Overstepping Gate",
  "spec-confirmed",
  "plan-confirmed",
  "implementer-session",
];
for (const gate of gateNames) {
  r.assert(content.includes(gate), `CLAUDE.md missing '${gate}'`);
}
r.assert(content.includes("Machine Gates"), "CLAUDE.md missing 'Machine Gates' section reference");

// Contract ⇄ reality: every gate CLAUDE.md presents as hook-enforced must have a real enforcing file.
const enforced = [
  { gate: "Spec-Before-Code Gate", files: ["scripts/hooks/spec-before-code-gate.mjs"] },
  { gate: "Hallucination Gate", files: ["core/hooks/hallucination-gate.sh"] },
  { gate: "Sloppiness Gate", files: ["scripts/forge-verify.mjs", "core/hooks/phase-exit-guard.sh"] },
];
for (const { gate, files } of enforced) {
  for (const f of files) {
    r.assert(
      fs.existsSync(path.join(ROOT, f)),
      `enforcement missing for ${gate}: ${f} (contract claims it is hook-enforced)`,
    );
  }
}

// Honesty: Overstepping has procedural enforcement (Step 8.5 / files_to_modify); hook-level still deferred.
// CLAUDE.md must state both — not claim "fully hook-enforced" and not claim "nothing exists".
r.assert(
  /Overstepping Gate[\s\S]{0,220}?(procedural|Step 8\.5)/i.test(content) &&
    /Overstepping Gate[\s\S]{0,400}?(hook-level|PreToolUse)[\s\S]{0,80}?deferred/i.test(content),
  "Overstepping Gate must distinguish procedural enforcement vs hook-level deferred (see CLAUDE.md + deferred-ideas.md)",
);

r.assert(fs.existsSync(opencodeAgents), "adapters/opencode/.opencode/AGENTS.md missing");
const opencodeContent = fs.readFileSync(opencodeAgents, "utf-8");
r.assert(
  opencodeContent.includes("[Skill Dispatch]"),
  "OpenCode AGENTS.md missing Skill Dispatch — run pnpm sync (must mirror CLAUDE.md, not agents-template)",
);
for (const gate of gateNames) {
  r.assert(opencodeContent.includes(gate), `OpenCode AGENTS.md missing '${gate}'`);
}

r.finish();
