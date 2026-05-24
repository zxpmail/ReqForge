#!/usr/bin/env node
/**
 * workflows-compliance — GitHub Actions 符合 platform-compliance 策略
 * 禁止未文档化的 schedule/cron；允许 push / pull_request / workflow_dispatch
 */
import fs from "fs";
import path from "path";
import { ROOT, createRunner } from "./lib.mjs";

const r = createRunner("workflows-compliance");
const workflowsDir = path.join(ROOT, ".github", "workflows");

if (!fs.existsSync(workflowsDir)) {
  r.fail("missing .github/workflows/");
  r.finish();
}

const files = fs.readdirSync(workflowsDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
r.assert(files.length > 0, "expected at least one workflow under .github/workflows/");

const complianceDoc = path.join(ROOT, "core", "docs", "platform-compliance.md");
r.assert(fs.existsSync(complianceDoc), "core/docs/platform-compliance.md must exist");

for (const file of files) {
  const content = fs.readFileSync(path.join(workflowsDir, file), "utf-8");

  // 禁止 cron 定时 — 见 platform-compliance.md §3
  if (/^\s*schedule\s*:/m.test(content) || /cron\s*:/i.test(content)) {
    r.fail(`${file}: schedule/cron forbidden — document exception in platform-compliance.md first`);
  }

  // 至少应有一种合规触发器
  const hasPush = /\bon:\s*[\s\S]*?\bpush\b/m.test(content) || /\bpush\s*:/m.test(content);
  const hasPr = /\bpull_request\b/m.test(content);
  const hasDispatch = /\bworkflow_dispatch\b/m.test(content);

  r.assert(
    hasPush || hasPr || hasDispatch,
    `${file}: must declare push, pull_request, or workflow_dispatch trigger`,
  );
}

r.finish();
