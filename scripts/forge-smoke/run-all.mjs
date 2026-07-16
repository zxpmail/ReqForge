#!/usr/bin/env node
/**
 * run-all.mjs — ReqForge 框架仓库静态 smoke 测试总入口
 *
 * 性质：本仓库测试套件（非 Harness 架构、非用户项目 TDD）
 * 分工：pnpm test = Vitest（含 smoke registry）；pnpm forge-smoke = 实际执行守门
 *
 * 用法: node scripts/forge-smoke/run-all.mjs
 *       pnpm forge-smoke
 *
 * 详表: scripts/forge-smoke/README.md
 * SMOKES 单源: scripts/forge-smoke/lib.mjs
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { SMOKES } from "./lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
