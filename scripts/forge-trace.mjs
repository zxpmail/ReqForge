#!/usr/bin/env node
/**
 * forge-trace.mjs — 结构化探索图
 *
 * 记录 dev-builder Phase 中的决策、死胡同和证据绑定，
 * 供 future sessions 和 evolution-engine 使用。
 *
 * 用法：
 *   node scripts/forge-trace.mjs init <phase-num> [--root <dir>]
 *   node scripts/forge-trace.mjs decision <phase-num> --q "<question>" --c "<chosen>" --o "<opt1,opt2>" --r "<reason>" [--a "<abandoned>"] [--root <dir>]
 *   node scripts/forge-trace.mjs dead-end <phase-num> --approach "<name>" --failed-at "<step>" --mode "<reason>" --lesson "<takeaway>" [--root <dir>]
 *   node scripts/forge-trace.mjs evidence <phase-num> --claim "<id>" --files "<path1,path2>" [--root <dir>]
 *   node scripts/forge-trace.mjs summary <phase-num> [--root <dir>]
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function traceDir(root) {
  return join(root, ".forge", "trace");
}

function traceFile(root, phase) {
  return join(traceDir(root), `phase-${phase}.json`);
}

function loadTrace(root, phase) {
  const file = traceFile(root, phase);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf-8"));
}

function saveTrace(root, phase, data) {
  const dir = traceDir(root);
  mkdirSync(dir, { recursive: true });
  writeFileSync(traceFile(root, phase), JSON.stringify(data, null, 2));
}

// --- Commands ---

function cmdInit(root, phase) {
  const existing = loadTrace(root, phase);
  if (existing) {
    console.log(`Trace phase-${phase}.json already exists (${existing.decisions.length} decisions, ${existing.deadEnds.length} dead ends)`);
    return;
  }
  const data = {
    phase,
    createdAt: new Date().toISOString(),
    decisions: [],
    deadEnds: [],
    evidence: {},
    summary: null,
  };
  saveTrace(root, phase, data);
  console.log(`Created .forge/trace/phase-${phase}.json`);
}

function cmdDecision(root, phase, args) {
  let data = loadTrace(root, phase);
  if (!data) {
    console.error(`No trace for phase ${phase}. Run "init ${phase}" first.`);
    process.exit(1);
  }
  const entry = {
    question: args.q || "?",
    chosen: args.c || "",
    options: args.o ? args.o.split(",").map(s => s.trim()) : [],
    reason: args.r || "",
    abandoned: args.a ? args.a.split(",").map(s => s.trim()) : [],
    timestamp: new Date().toISOString(),
  };
  data.decisions.push(entry);
  saveTrace(root, phase, data);
  console.log(`Recorded decision: "${entry.question}" → ${entry.chosen}`);
}

function cmdDeadEnd(root, phase, args) {
  let data = loadTrace(root, phase);
  if (!data) {
    console.error(`No trace for phase ${phase}. Run "init ${phase}" first.`);
    process.exit(1);
  }
  const entry = {
    approach: args.approach || "?",
    failedAt: args["failed-at"] || "",
    failureMode: args.mode || "",
    lesson: args.lesson || "",
    timestamp: new Date().toISOString(),
  };
  data.deadEnds.push(entry);
  saveTrace(root, phase, data);
  console.log(`Recorded dead end: "${entry.approach}" — ${entry.lesson}`);
}

function cmdEvidence(root, phase, args) {
  let data = loadTrace(root, phase);
  if (!data) {
    console.error(`No trace for phase ${phase}. Run "init ${phase}" first.`);
    process.exit(1);
  }
  const files = args.files ? args.files.split(",").map(s => s.trim()) : [];
  data.evidence[args.claim || "?"] = files;
  saveTrace(root, phase, data);
  console.log(`Bound evidence for claim "${args.claim}": ${files.join(", ")}`);
}

function cmdSummary(root, phase, args) {
  let data = loadTrace(root, phase);
  if (!data) {
    // Read-only summary — show phase completion status
    const dir = traceDir(root);
    if (!existsSync(dir)) {
      console.log("No trace data found (.forge/trace/ is empty)");
      return;
    }
    const files = readdirSync(dir).filter(f => f.endsWith(".json"));
    if (files.length === 0) {
      console.log("No trace files found");
      return;
    }
    console.log(`Trace files: ${files.join(", ")}`);
    return;
  }
  console.log(`\n=== Phase ${phase} Trace ===`);
  console.log(`Decisions: ${data.decisions.length}`);
  for (const d of data.decisions) {
    console.log(`  [${d.chosen}] ${d.question}`);
    if (d.abandoned.length) console.log(`    Abandoned: ${d.abandoned.join(", ")}`);
  }
  console.log(`Dead ends: ${data.deadEnds.length}`);
  for (const d of data.deadEnds) {
    console.log(`  ✗ ${d.approach} → ${d.lesson}`);
  }
  console.log(`Claims with evidence: ${Object.keys(data.evidence).length}`);
  for (const [claim, files] of Object.entries(data.evidence)) {
    console.log(`  ${claim}: ${files.join(", ")}`);
  }
}

function printHelp() {
  console.log(`
forge-trace — 结构化探索图管理

Usage:
  node scripts/forge-trace.mjs init <phase> [--root <dir>]
  node scripts/forge-trace.mjs decision <phase> --q "<question>" --c "<chosen>" [--o "opt1,opt2"] --r "<reason>" [--a "abandoned1,abandoned2"]
  node scripts/forge-trace.mjs dead-end <phase> --approach "<name>" --failed-at "<step>" --mode "<reason>" --lesson "<takeaway>"
  node scripts/forge-trace.mjs evidence <phase> --claim "<id>" --files "<path1,path2>"
  node scripts/forge-trace.mjs summary [<phase>] [--root <dir>]

Options:
  --root <dir>     Project root (default: repo root)
  --help, -h       Show this help
`);
}

// --- CLI ---

function parse() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const cmd = args[0];
  const phase = args[1] ? parseInt(args[1], 10) : null;
  if (!phase && cmd !== "summary") {
    console.error("Missing phase number");
    printHelp();
    process.exit(1);
  }

  const kv = {};
  let root = ROOT;
  for (let i = 2; i < args.length; i++) {
    if (args[i] === "--root" && args[i + 1]) {
      root = args[++i];
      continue;
    }
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
      kv[key] = val;
    }
  }

  return { cmd, phase, kv, root };
}

function main() {
  const { cmd, phase, kv, root } = parse();

  switch (cmd) {
    case "init":
      cmdInit(root, phase);
      break;
    case "decision":
      cmdDecision(root, phase, kv);
      break;
    case "dead-end":
      cmdDeadEnd(root, phase, kv);
      break;
    case "evidence":
      cmdEvidence(root, phase, kv);
      break;
    case "summary":
      cmdSummary(root, phase, kv);
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      printHelp();
      process.exit(1);
  }
}

main();
