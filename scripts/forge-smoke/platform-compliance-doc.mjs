#!/usr/bin/env node
/**
 * platform-compliance-doc — 平台合规文档关键章节齐全
 * （文档存在性由 workflows-compliance 一并检查，此处只验内容）
 */
import fs from "fs";
import path from "path";
import { ROOT, createRunner } from "./lib.mjs";

const r = createRunner("platform-compliance-doc");
const doc = path.join(ROOT, "core", "docs", "platform-compliance.md");

r.assert(fs.existsSync(doc), "core/docs/platform-compliance.md missing");

const content = fs.readFileSync(doc, "utf-8");

const markers = [
  "GitHub Actions policy",
  "Forbidden without maintainer review",
  "What ReqForge does **not** do",
  "If this repo or account is flagged",
  "forge-smoke.yml",
];

for (const marker of markers) {
  r.assert(content.includes(marker), `platform-compliance.md missing section: ${marker}`);
}

r.finish();
