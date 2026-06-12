#!/usr/bin/env node
/**
 * skill-fixtures — Skill TDD 静态探针：YAML fixture 对照 core/skills 下各 SKILL.md
 */
import fs from "fs";
import path from "path";
import { ROOT, createRunner } from "./lib.mjs";

const r = createRunner("skill-fixtures");
const fixturesRoot = path.join(ROOT, "tests", "skill-fixtures");
const skillsRoot = path.join(ROOT, "core", "skills");

function loadYamlLike(filePath) {
  const text = fs.readFileSync(filePath, "utf-8");
  const out = { expect_skill_contains: [], expect_reference_contains: [] };
  let key = null;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    const km = line.match(/^([a-z_]+):\s*$/);
    if (km) {
      key = km[1];
      continue;
    }
    const item = line.match(/^\s+-\s+(.+)$/);
    if (item && key && Array.isArray(out[key])) {
      let value = item[1].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out[key].push(value);
      continue;
    }
    const scalar = line.match(/^([a-z_]+):\s+(.+)$/);
    if (scalar && !Array.isArray(out[scalar[1]])) {
      out[scalar[1]] = scalar[2].trim();
    }
  }
  return out;
}

function collectReferenceText(skillDir) {
  const refDir = path.join(skillDir, "references");
  if (!fs.existsSync(refDir)) return "";
  return fs
    .readdirSync(refDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => fs.readFileSync(path.join(refDir, f), "utf-8"))
    .join("\n");
}

r.assert(fs.existsSync(fixturesRoot), "tests/skill-fixtures/ missing");

const skillDirs = fs.readdirSync(fixturesRoot, { withFileTypes: true }).filter((e) => e.isDirectory());
r.assert(skillDirs.length >= 3, "expected at least 3 skill fixture directories");

let fixtureCount = 0;

for (const dir of skillDirs) {
  const fixtureDir = path.join(fixturesRoot, dir.name);
  const yamls = fs.readdirSync(fixtureDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  for (const yf of yamls) {
    fixtureCount++;
    const fx = loadYamlLike(path.join(fixtureDir, yf));
    const skillName = fx.skill || dir.name;
    const skillMd = path.join(skillsRoot, skillName, "SKILL.md");
    r.assert(fs.existsSync(skillMd), `${yf}: skill missing ${skillMd}`);
    const skillText = fs.readFileSync(skillMd, "utf-8");
    const refText = collectReferenceText(path.join(skillsRoot, skillName));

    for (const needle of fx.expect_skill_contains || []) {
      r.assert(skillText.includes(needle), `${yf}: SKILL.md missing '${needle}'`);
    }
    for (const needle of fx.expect_reference_contains || []) {
      r.assert(refText.includes(needle), `${yf}: references missing '${needle}'`);
    }
  }
}

r.assert(fixtureCount >= 3, `expected >= 3 fixtures, got ${fixtureCount}`);

const specGate = fs.readFileSync(path.join(ROOT, "scripts", "hooks", "spec-before-code-gate.mjs"), "utf-8");
r.assert(specGate.includes("Product-Spec.md"), "spec-before-code-gate.mjs must check Product-Spec.md");
r.assert(specGate.includes("hasIdeaStageExitCriteria"), "spec-before-code-gate.mjs must check Idea Stage Exit Criteria");
r.assert(specGate.includes("spec-confirmed.json"), "spec-before-code-gate.mjs must check spec-confirmed marker");
r.assert(specGate.includes("implementer-session.json"), "spec-before-code-gate.mjs must check implementer-session marker");

r.finish();
