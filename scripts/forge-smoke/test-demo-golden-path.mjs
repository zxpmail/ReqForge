#!/usr/bin/env node
/**
 * test-demo-golden-path — 框架仓库黄金路径 demo 可跑通
 *
 * 委托 test-demo/run-golden-path.mjs（结构 + build + test + CLI 冒烟）
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { ROOT, createRunner } from "./lib.mjs";

const r = createRunner("test-demo-golden-path");

const demoReadme = path.join(ROOT, "test-demo", "README.md");
const runner = path.join(ROOT, "test-demo", "run-golden-path.mjs");

r.assert(fs.existsSync(demoReadme), "missing test-demo/README.md");
r.assert(fs.existsSync(runner), "missing test-demo/run-golden-path.mjs");

const readme = fs.readFileSync(demoReadme, "utf-8");
r.assert(readme.includes("黄金路径"), "test-demo/README.md: missing 黄金路径 section");
r.assert(readme.includes("run-golden-path.mjs"), "test-demo/README.md: missing runner reference");

if (process.env.SKIP_TEST_DEMO_GOLDEN === "1") {
  console.log("✓ test-demo-golden-path: skipped (SKIP_TEST_DEMO_GOLDEN=1)");
  process.exit(0);
}

const result = spawnSync(process.execPath, [runner], {
  stdio: "inherit",
  cwd: ROOT,
  env: process.env,
});

r.assert(result.status === 0, "test-demo/run-golden-path.mjs exited non-zero");
r.finish();
