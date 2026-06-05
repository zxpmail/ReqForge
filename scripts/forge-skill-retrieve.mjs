#!/usr/bin/env node
/**
 * forge-skill-retrieve.mjs — Skill dynamic retrieval engine
 *
 * Rule-based context→section mapping for SKILL.md files.
 * After the Skill tool loads a full SKILL.md, the AI runs this script
 * to get a retrieval plan: which sections to focus on (mustRead),
 * which are available but not primary (onDemand), and which to skip.
 *
 * CLI:
 *   node scripts/forge-skill-retrieve.mjs list <skill> [--refs]
 *   node scripts/forge-skill-retrieve.mjs plan <skill> --context <json>
 *   node scripts/forge-skill-retrieve.mjs add-rule <skill> --when <dim:val> --sections <a,b,c>
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..");
const SKILLS_DIR = join(ROOT, "core", "skills");
const MAP_FILE = join(ROOT, ".forge", "skill-retrieval-map.json");

// ─── Section Parsing ──────────────────────────────────────────────

const SECTION_RE = /<!--\s*begin:\s*([\w-]+)\s*-->/g;

/**
 * Parse all section names from SKILL.md content.
 * Uses <!-- begin: NAME --> delimiters, falls back to [Title] headers.
 *
 * @param {string} content
 * @returns {string[]} section ids
 */
export function parseSections(content) {
  const sections = [];
  let match;
  SECTION_RE.lastIndex = 0;
  while ((match = SECTION_RE.exec(content)) !== null) {
    sections.push(match[1]);
  }
  // Fallback: [Title] headers when no HTML delimiters found
  if (sections.length === 0) {
    const titleRe = /^\[([^\]]+)\]/gm;
    while ((match = titleRe.exec(content)) !== null) {
      sections.push(match[1].toLowerCase().replace(/\s+/g, "-"));
    }
  }
  return sections;
}

/**
 * List all sections for a skill.
 *
 * @param {string} skillName
 * @returns {{ id: string, line: number }[]}
 */
export function listSections(skillName) {
  const content = readSkillFile(skillName);
  if (content === null) return [];

  const sections = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/<!--\s*begin:\s*([\w-]+)\s*-->/);
    if (m) {
      sections.push({ id: m[1], line: i + 1 });
    }
  }
  // Fallback
  if (sections.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\[([^\]]+)\]/);
      if (m) {
        sections.push({ id: m[1].toLowerCase().replace(/\s+/g, "-"), line: i + 1 });
      }
    }
  }
  return sections;
}

function readSkillFile(skillName) {
  const path = join(SKILLS_DIR, skillName, "SKILL.md");
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

// ─── Retrieval Map ────────────────────────────────────────────────

const DEFAULT_MAP = {
  version: 1,
  updated: "2026-06-05",
  defaults: {
    always: ["task", "dependency-check", "first-principles", "workflow", "initialization", "not-for"],
    conditional: {
      "failure_class:skill-defect": ["gotchas", "quality-rubric"],
      "step:verification": ["quality-rubric", "output-artifacts"],
    },
    on_demand: ["output-style", "file-structure", "gotchas", "output-artifacts", "anti-rationalization-checklist"],
  },
  skills: {
    "product-spec-builder": {
      conditional: {
        "mode:0-to-1": ["workflow-0-to-1-mode", "startup-check", "requirements-dimension-checklist", "machine-gate-markers"],
        "mode:iteration": ["workflow-iteration-mode", "startup-check", "requirements-dimension-checklist", "machine-gate-markers"],
        "mode:quick": ["workflow-quick-mode", "startup-check"],
        "mode:light-grill": ["workflow-light-grill-mode", "startup-check", "requirements-dimension-checklist"],
        "failure_class:skill-defect": ["gotchas", "quality-rubric", "hard-gate"],
        "step:questioning": ["requirements-dimension-checklist"],
      },
      skill_defaults: ["shared-discipline", "hard-gate"],
    },
    "dev-builder": {
      conditional: {
        "step:planning": ["development-dimension-checklist"],
        "step:verification": ["phase-completion-assessment", "development-dimension-checklist"],
        "phase:completion": ["phase-completion-assessment", "quality-rubric", "output-artifacts"],
        "failure_class:skill-defect": ["gotchas", "quality-rubric", "anti-rationalization-checklist"],
      },
      skill_defaults: ["shared-discipline", "hard-gate", "output-style"],
    },
    "bug-fixer": {
      conditional: {
        "intent:compile-error": ["invocation-context"],
        "intent:runtime-error": ["debugging-rule-checklist"],
        "failure_class:skill-defect": ["gotchas", "quality-rubric", "debugging-rule-checklist"],
        "step:debugging": ["debugging-rule-checklist"],
        "step:verification": ["dimension-checklist", "quality-rubric"],
      },
      skill_defaults: ["shared-discipline", "output-style"],
    },
    "code-review": {
      conditional: {
        "failure_class:skill-defect": ["gotchas", "quality-rubric"],
      },
      skill_defaults: ["shared-discipline", "output-style"],
    },
    "change-manager": {
      conditional: {
        "failure_class:skill-defect": ["gotchas", "quality-rubric"],
      },
      skill_defaults: ["shared-discipline", "output-style"],
    },
    "evolution-engine": {
      conditional: {
        "failure_class:skill-defect": ["gotchas", "quality-rubric", "anti-rationalization-checklist"],
      },
      skill_defaults: [],
    },
    "feedback-writer": {
      conditional: {
        "failure_class:skill-defect": ["gotchas", "quality-rubric", "anti-rationalization-checklist"],
      },
      skill_defaults: [],
    },
  },
};

function loadMap() {
  if (existsSync(MAP_FILE)) {
    try {
      const raw = readFileSync(MAP_FILE, "utf-8");
      return JSON.parse(raw);
    } catch {
      // Corrupt file — use defaults
    }
  }
  return DEFAULT_MAP;
}

function saveMap(map) {
  mkdirSync(dirname(MAP_FILE), { recursive: true });
  map.updated = new Date().toISOString().slice(0, 10);
  writeFileSync(MAP_FILE, JSON.stringify(map, null, 2), "utf-8");
}

// ─── Plan Generation ─────────────────────────────────────────────

/**
 * Match a condition string like "phase:3" or "failure_class:skill-defect"
 * against the provided context.
 *
 * @param {string} condition - "dimension:value"
 * @param {object} context - { phase, mode, step, failure_class, intent }
 * @returns {boolean}
 */
export function matchesCondition(condition, context) {
  const [dim, val] = condition.split(":", 2);
  if (!dim || val === undefined) return false;

  const ctxVal = context[dim];
  if (ctxVal === undefined || ctxVal === null) return false;

  // "phase:completion" is a special keyword meaning any phase is complete
  if (dim === "phase" && val === "completion") {
    return ctxVal !== undefined && ctxVal !== null;
  }

  return String(ctxVal) === val;
}

/**
 * Build a retrieval plan for a skill given the execution context.
 *
 * @param {string} skillName
 * @param {object} context - { phase?, mode?, step?, failure_class?, intent? }
 * @param {object} [map] - optional map override (for testing)
 * @returns {{ mustRead: string[], onDemand: string[], skip: string[], contextSummary: string }}
 */
export function buildPlan(skillName, context = {}, map = null) {
  const skillContent = readSkillFile(skillName);
  if (skillContent === null) {
    return { mustRead: [], onDemand: [], skip: [], contextSummary: `Skill not found: ${skillName}` };
  }

  const allSections = parseSections(skillContent);
  const effectiveMap = map || loadMap();

  // Resolve skill-specific map, falling back to defaults
  const skillMap = effectiveMap.skills?.[skillName] || {};
  const defaults = effectiveMap.defaults || DEFAULT_MAP.defaults;

  const always = [...(defaults.always || [])];
  const conditional = { ...(defaults.conditional || {}), ...(skillMap.conditional || {}) };
  const onDemandDefault = [...(defaults.on_demand || [])];
  const skillDefaults = skillMap.skill_defaults || [];

  // Build mustRead set
  const mustRead = new Set(always);
  for (const skillDefault of skillDefaults) {
    mustRead.add(skillDefault);
  }
  for (const [condition, sectionList] of Object.entries(conditional)) {
    if (matchesCondition(condition, context)) {
      for (const s of sectionList) {
        mustRead.add(s);
      }
    }
  }

  // Build onDemand set (from defaults, minus anything already in mustRead)
  const onDemand = new Set();
  for (const s of onDemandDefault) {
    if (!mustRead.has(s)) onDemand.add(s);
  }

  // Everything else is skip
  const skip = allSections.filter(id => !mustRead.has(id) && !onDemand.has(id));

  // Filter to only sections that actually exist
  const mustReadFiltered = [...mustRead].filter(id => allSections.includes(id));
  const onDemandFiltered = [...onDemand].filter(id => allSections.includes(id));

  const contextParts = [`Skill: ${skillName}`];
  if (context.mode) contextParts.push(`Mode: ${context.mode}`);
  if (context.step) contextParts.push(`Step: ${context.step}`);
  if (context.failure_class) contextParts.push(`Failure: ${context.failure_class}`);
  contextParts.push(`mustRead: ${mustReadFiltered.length}/${allSections.length} sections`);

  return {
    mustRead: mustReadFiltered,
    onDemand: onDemandFiltered,
    skip,
    contextSummary: contextParts.join(" | "),
  };
}

// ─── Add Rule ─────────────────────────────────────────────────────

/**
 * Add a conditional rule to the retrieval map for a skill.
 *
 * @param {string} skillName
 * @param {string} when - "dimension:value" e.g. "failure_class:skill-defect"
 * @param {string[]} sections - section ids to add
 * @returns {{ added: boolean, skill: string, when: string, sections: string[] }}
 */
export function addRule(skillName, when, sections) {
  const map = loadMap();

  if (!map.skills) map.skills = {};
  if (!map.skills[skillName]) {
    map.skills[skillName] = { conditional: {}, skill_defaults: [] };
  }
  if (!map.skills[skillName].conditional) {
    map.skills[skillName].conditional = {};
  }

  const existing = map.skills[skillName].conditional[when] || [];
  const merged = [...new Set([...existing, ...sections])];
  map.skills[skillName].conditional[when] = merged;

  saveMap(map);
  return { added: true, skill: skillName, when, sections: merged };
}

// ─── CLI ──────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
forge-skill-retrieve — Skill dynamic retrieval engine

Usage:
  list <skill> [--refs]
    List all sections in the skill SKILL.md

  plan <skill> --context <json>
    Generate a retrieval plan based on context.
    Context: {"phase":3, "mode":"0-to-1", "step":"planning", "failure_class":"skill-defect"}

  add-rule <skill> --when <dim:val> --sections <a,b,c>
    Add a conditional rule to the retrieval map

Options:
  --root <dir>   Project root (default: repo root)
  --help, -h     Show this help
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const cmd = args[0];
  const skillName = args[1];

  if (!skillName && cmd !== "help") {
    console.error("Missing skill name");
    printHelp();
    process.exit(1);
  }

  const kv = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      const val = (args[i + 1] && !args[i + 1].startsWith("--")) ? args[++i] : "true";
      kv[key] = val;
    }
  }

  switch (cmd) {
    case "list": {
      const sections = listSections(skillName);
      if (sections.length === 0) {
        console.error(`Skill not found: ${skillName}`);
        process.exit(1);
      }
      console.log(`\n=== ${skillName} — ${sections.length} sections ===\n`);
      for (const s of sections) {
        console.log(`  ${s.id} (line ${s.line})`);
      }
      break;
    }
    case "plan": {
      const context = kv.context ? JSON.parse(kv.context) : {};
      const plan = buildPlan(skillName, context);
      if (plan.mustRead.length === 0 && plan.skip.length === 0) {
        console.error(`Skill not found: ${skillName}`);
        process.exit(1);
      }
      console.log(JSON.stringify(plan, null, 2));
      break;
    }
    case "add-rule": {
      const when = kv.when;
      const sections = kv.sections ? kv.sections.split(",").map(s => s.trim()) : [];
      if (!when || sections.length === 0) {
        console.error("Missing --when or --sections");
        process.exit(1);
      }
      const result = addRule(skillName, when, sections);
      console.log(`Added rule: ${result.skill} [${result.when}] → ${result.sections.join(", ")}`);
      break;
    }
    default:
      console.error(`Unknown command: ${cmd}`);
      printHelp();
      process.exit(1);
  }
}

if (process.argv[1] && (process.argv[1].endsWith("forge-skill-retrieve.mjs") || process.argv[1].endsWith("forge-skill-retrieve"))) {
  main();
}
