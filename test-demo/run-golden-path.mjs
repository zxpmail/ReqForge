#!/usr/bin/env node
/**
 * run-golden-path.mjs — test-demo 黄金路径守门
 *
 * 验证 Product-Spec → DEV-PLAN → todo-cli 可安装、可编译、单测通过、CLI 四命令可跑通。
 * 维护者：pnpm test-demo-golden-path（仓库根目录）
 */
import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_ROOT = __dirname;
const TODO_CLI = path.join(DEMO_ROOT, "todo-cli");
const ENTRY = path.join(TODO_CLI, "dist", "index.js");

const failures = [];

/** 记录失败信息 */
function fail(message) {
  failures.push(message);
}

/** 断言条件，失败则记录 */
function assert(condition, message) {
  if (!condition) failures.push(message);
}

/** 在指定目录执行命令，非零退出则失败 */
function run(cmd, args, opts = {}) {
  const isPnpm = cmd === "pnpm";
  const useShell = process.platform === "win32" && isPnpm;

  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    shell: useShell,
  });
  if (result.status !== 0) {
    fail(`command failed (${result.status ?? "spawn"}): ${cmd} ${args.join(" ")}`);
    return false;
  }
  return true;
}

console.log("test-demo golden path\n");

// --- 结构检查 ---
assert(fs.existsSync(path.join(DEMO_ROOT, "Product-Spec.md")), "missing Product-Spec.md");
assert(fs.existsSync(path.join(DEMO_ROOT, "DEV-PLAN.md")), "missing DEV-PLAN.md");
assert(fs.existsSync(path.join(DEMO_ROOT, "README.md")), "missing README.md");
assert(fs.existsSync(path.join(TODO_CLI, "package.json")), "missing todo-cli/package.json");

const spec = fs.readFileSync(path.join(DEMO_ROOT, "Product-Spec.md"), "utf-8");
assert(spec.includes("Todo CLI"), "Product-Spec.md: missing product title marker");

const plan = fs.readFileSync(path.join(DEMO_ROOT, "DEV-PLAN.md"), "utf-8");
assert(plan.includes("Acceptance Criteria"), "DEV-PLAN.md: missing Acceptance Criteria");

if (failures.length > 0) {
  reportAndExit();
}

// --- 构建与单测（快环）---
if (
  run("pnpm", ["install", "--frozen-lockfile"], { cwd: TODO_CLI }) &&
  run("pnpm", ["build"], { cwd: TODO_CLI }) &&
  run("pnpm", ["test"], { cwd: TODO_CLI })
) {
  // ok
}

if (failures.length > 0) {
  reportAndExit();
}

// --- CLI 端到端冒烟（满环片段，无需 AI Key）---
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "reqforge-golden-"));
const node = process.execPath;

try {
  assert(fs.existsSync(ENTRY), `missing ${ENTRY} after build`);

  if (fs.existsSync(ENTRY)) {
    const noAi = { AI_API_KEY: "" };

    if (run(node, [ENTRY, "add", "golden path smoke task"], { cwd: tmpDir, env: noAi })) {
      const todoJson = path.join(tmpDir, "todo.json");
      assert(fs.existsSync(todoJson), "todo.json not created after add");

      if (fs.existsSync(todoJson)) {
        const store = JSON.parse(fs.readFileSync(todoJson, "utf-8"));
        assert(Array.isArray(store.todos) && store.todos.length === 1, "expected 1 todo after add");
        assert(store.todos[0].description === "golden path smoke task", "todo description mismatch");
      }

      run(node, [ENTRY, "list"], { cwd: tmpDir, env: noAi });
      run(node, [ENTRY, "complete", "1"], { cwd: tmpDir, env: noAi });
      run(node, [ENTRY, "delete", "1"], { cwd: tmpDir, env: noAi });

      if (fs.existsSync(todoJson)) {
        const after = JSON.parse(fs.readFileSync(todoJson, "utf-8"));
        assert(after.todos.length === 0, "expected empty todos after delete");
      }
    }
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

reportAndExit();

/** 汇总结果并退出 */
function reportAndExit() {
  if (failures.length > 0) {
    console.error(`\n✗ test-demo golden path: ${failures.length} failure(s)`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log("\n✓ test-demo golden path: all checks passed");
  process.exit(0);
}
