#!/usr/bin/env node
/**
 * templates-present — 核心输出模板存在且含关键章节
 */
import fs from "fs";
import path from "path";
import { ROOT, createRunner } from "./lib.mjs";

const r = createRunner("templates-present");

const REQUIRED = [
  {
    rel: "core/templates/product-spec-template.md",
    markers: ["Product Overview", "Functional Requirements", "Technical Direction"],
  },
  {
    rel: "core/templates/dev-plan-template.md",
    markers: ["Acceptance Criteria", "Phase 1"],
  },
  {
    rel: "core/templates/design-brief-template.md",
    markers: ["Visual Direction Preset", "Typography Direction", "Design Direction"],
  },
  {
    rel: "core/templates/memory/project-memory-template.md",
    markers: ["Project Memory"],
  },
  {
    rel: "core/templates/forge-bootstrap.md",
    markers: ["Session Iron Laws", "HARD-GATE", "Skill before action"],
  },
  {
    rel: "core/templates/forge-markers/README.md",
    markers: ["spec-confirmed.json", "implementer-session.json"],
  },
  {
    rel: "core/feedback/templates/drift-map-template.md",
    markers: ["跑偏地图", "failure_class"],
  },
];

for (const { rel, markers } of REQUIRED) {
  const abs = path.join(ROOT, rel);
  r.assert(fs.existsSync(abs), `missing template: ${rel}`);
  const content = fs.readFileSync(abs, "utf-8");
  for (const marker of markers) {
    r.assert(content.includes(marker), `${rel}: missing marker '${marker}'`);
  }
}

r.finish();
