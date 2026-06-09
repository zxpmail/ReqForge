#!/usr/bin/env node
/**
 * run-all.mjs — ReqForge 框架仓库静态 smoke 测试总入口
 *
 * 性质：本仓库测试套件（非 Harness 架构、非用户项目 TDD）
 * 分工：pnpm test = Vitest 单元测试；pnpm forge-smoke = 结构/同步/文档/CI 守门
 *
 * 用法: node scripts/forge-smoke/run-all.mjs
 *       pnpm forge-smoke
 *
 * 详表: scripts/forge-smoke/README.md
 * 每项 smoke 在独立子进程运行，互不污染。（共 12 项，含 test-demo 黄金路径）
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 由轻至重排列 */
const SMOKES = [
  "workflows-compliance",
  "platform-compliance-doc",
  "machine-gates-doc",
  "templates-present",
  "agents-complete",
  "hooks-wired",
  "skill-fixtures",
  "skill-bypass",
  "loadouts-valid",
  "adapters-sync",
  "skills-complete",
  "test-demo-golden-path",
  "grovel-baseline",
];

let failed = 0;

console.log("forge-smoke — ReqForge release gate\n");

for (const name of SMOKES) {
  const script = path.join(__dirname, `${name}.mjs`);
  const started = Date.now();
  const result = spawnSync(process.execPath, [script], {
    stdio: "inherit",
    env: process.env,
  });
  const secs = ((Date.now() - started) / 1000).toFixed(1);

  if (result.status !== 0) {
    failed++;
    console.error(`  (${secs}s)\n`);
  } else {
    console.log(`  (${secs}s)\n`);
  }
}

const passed = SMOKES.length - failed;
console.log(`=== forge-smoke: ${passed}/${SMOKES.length} passed ===`);

if (failed > 0) process.exit(1);
