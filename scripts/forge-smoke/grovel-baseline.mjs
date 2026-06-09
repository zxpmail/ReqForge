#!/usr/bin/env node
/**
 * grovel-baseline — Validate Grovel Index measurement framework integrity
 *
 * Does NOT call LLMs. Verifies:
 *   - All measurement scripts and config files exist
 *   - Baseline JSON files parse correctly and have expected schema
 *   - Baseline composite metrics are within expected value ranges
 */
import fs from "fs";
import path from "path";
import { ROOT, createRunner } from "./lib.mjs";

const r = createRunner("grovel-baseline");

const GROVEL_DIR = path.join(
  ROOT, ".forge", "skills", "product-spec-builder", "eval", "grovel",
);

// ── Required files exist ──

const REQUIRED_FILES = [
  "scenarios.json",
  "measure-config.json",
  "run-measurement.mjs",
  "run-catering-measurement.mjs",
  "run-catering-conversation.mjs",
  "baseline-2026-06-09.json",
  "catering-baseline-2026-06-09.json",
  "cct-v2-baseline-2026-06-09.json",
];

for (const f of REQUIRED_FILES) {
  const fp = path.join(GROVEL_DIR, f);
  r.assert(
    fs.existsSync(fp),
    `missing file: ${f}`,
  );
}

// ── JSON validity ──

const JSON_FILES = [
  "scenarios.json",
  "measure-config.json",
  "baseline-2026-06-09.json",
  "catering-baseline-2026-06-09.json",
  "cct-v2-baseline-2026-06-09.json",
];

for (const f of JSON_FILES) {
  const fp = path.join(GROVEL_DIR, f);
  try {
    const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
    r.assert(data !== null, `${f}: parsed OK`);
  } catch (e) {
    r.fail(`${f}: invalid JSON — ${e.message}`);
  }
}

// ── GI baseline structure ──

const giBaseline = JSON.parse(
  fs.readFileSync(path.join(GROVEL_DIR, "baseline-2026-06-09.json"), "utf-8"),
);

r.assert(
  typeof giBaseline.run_date === "string" && giBaseline.run_date.length > 0,
  "GI baseline: run_date missing",
);
r.assert(
  giBaseline.composite?.avg_grovel_index !== undefined,
  "GI baseline: composite.avg_grovel_index missing",
);
r.assert(
  giBaseline.composite.avg_grovel_index >= 0 && giBaseline.composite.avg_grovel_index <= 1,
  `GI baseline: avg_grovel_index=${giBaseline.composite.avg_grovel_index} out of [0,1]`,
);
r.assert(
  giBaseline.composite.scenario_count === 5,
  `GI baseline: expected 5 scenarios, got ${giBaseline.composite.scenario_count}`,
);

const scenarioIds = Object.keys(giBaseline.scenarios);
r.assert(
  scenarioIds.length === 5,
  `GI baseline: expected 5 scenario entries, got ${scenarioIds.length}`,
);
for (const id of ["todo-sync", "ecommerce-ai-chat", "migration-go", "open-api", "free-tier"]) {
  r.assert(
    scenarioIds.includes(id),
    `GI baseline: missing scenario "${id}"`,
  );
}

// ── CRM v1 baseline structure ──

const crmBaseline = JSON.parse(
  fs.readFileSync(path.join(GROVEL_DIR, "catering-baseline-2026-06-09.json"), "utf-8"),
);

r.assert(
  crmBaseline.composite?.avg_detection_rate?.T0 !== undefined,
  "CRM baseline: composite.avg_detection_rate.T0 missing",
);
r.assert(
  crmBaseline.composite.avg_detection_rate.T0 >= 0.5,
  `CRM baseline: expected T0 detection >= 0.5 (ceiling), got ${crmBaseline.composite.avg_detection_rate.T0}`,
);

// ── CCT v2 baseline structure ──

const cctBaseline = JSON.parse(
  fs.readFileSync(path.join(GROVEL_DIR, "cct-v2-baseline-2026-06-09.json"), "utf-8"),
);

r.assert(
  cctBaseline.composite?.avg_overall_sycophancy?.T0 !== undefined,
  "CCT baseline: composite.avg_overall_sycophancy.T0 missing",
);
r.assert(
  cctBaseline.composite.avg_overall_sycophancy.T1 === 0,
  `CCT baseline: expected T1 sycophancy=0, got ${cctBaseline.composite.avg_overall_sycophancy.T1}`,
);
r.assert(
  cctBaseline.composite.scenario_count === 5,
  `CCT baseline: expected 5 scenarios, got ${cctBaseline.composite.scenario_count}`,
);

// ── Script structure: measurement scripts have meta export ──

const SCRIPTS_TO_CHECK = [
  "run-measurement.mjs",
  "run-catering-measurement.mjs",
  "run-catering-conversation.mjs",
];

for (const s of SCRIPTS_TO_CHECK) {
  const content = fs.readFileSync(path.join(GROVEL_DIR, s), "utf-8");
  r.assert(
    content.includes("export const meta"),
    `${s}: missing "export const meta"`,
  );
  r.assert(
    content.includes("phase("),
    `${s}: missing phase() call`,
  );
  r.assert(
    content.includes("agent("),
    `${s}: missing agent() call`,
  );
}

r.finish();
