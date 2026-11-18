#!/usr/bin/env node
/**
 * forge-acceptance-readonly.mjs — 验收断言只读区（测试意图独立 / Non-Negotiable Layer）
 *
 * 契约测试/验收断言的「什么算正确」由人类拥有：模型只能实现到满足断言，
 * 不得修改断言本身。同一模型写实现 + 写验收 = 自我指涉验证（见
 * experiments/self-critique-sensor/RESULTS.md 与 spec-critique-gate technical report）。
 *
 * 配置：.forge/acceptance-readonly.json（人类创建；改动需提交才生效 —— 提交即批准）
 *   {
 *     "version": 1,
 *     "owner": "human",
 *     "description": "...",
 *     "paths": ["tests/acceptance/", "tests/contract/"]
 *   }
 *
 * 检查：git diff --name-only HEAD 中触碰 paths 或配置自身的文件 → FAIL。
 * 残差（与 scope-check 相同的信任域边界）：已提交的改动本检查不可见 ——
 * 防线在 stop-gate / pre-commit / branch protection，不在此脚本。
 *
 * 用法：
 *   node scripts/forge-acceptance-readonly.mjs check [--root <dir>] [--json]
 *   node scripts/forge-acceptance-readonly.mjs show  [--root <dir>]
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

export const CONFIG_REL = ".forge/acceptance-readonly.json";

/** 读取配置；文件不存在 → null；损坏 → throw（配置坏了不能静默跳过） */
export function loadConfig(root) {
  const file = join(root, CONFIG_REL);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch (e) {
    throw new Error(`${CONFIG_REL} unparseable: ${e.message}`);
  }
}

/**
 * 纯函数：判定改动是否触碰只读验收断言。
 * @param {object} cfg 配置对象（null/空 paths → skip）
 * @param {string[]} changedFiles 相对 root 的路径列表（git diff 输出）
 * @returns {{status: "skip"|"pass"|"fail", detail: string, violations: Array<{file: string, kind: "config"|"path"}>}}
 */
export function evaluateAcceptance(cfg, changedFiles) {
  if (!cfg || !Array.isArray(cfg.paths) || cfg.paths.length === 0) {
    return {
      status: "skip",
      detail: `skip (no ${CONFIG_REL} or empty paths)`,
      violations: [],
      paths: [],
    };
  }

  const paths = cfg.paths
    .filter((p) => typeof p === "string" && p.trim())
    .map((p) => p.trim().replace(/\\/g, "/").replace(/\/+$/, ""));

  const violations = [];
  for (const raw of changedFiles) {
    const file = String(raw).replace(/\\/g, "/");
    if (file.startsWith(".git/")) continue;
    // 配置自身：人类批准的改动 → 提交后生效；未提交的改动（含模型自改）→ FAIL
    if (file === CONFIG_REL) {
      violations.push({ file, kind: "config" });
      continue;
    }
    for (const p of paths) {
      if (file === p || file.startsWith(p + "/")) {
        violations.push({ file, kind: "path" });
        break;
      }
    }
  }

  if (violations.length > 0) {
    const cfgHit = violations.some((v) => v.kind === "config");
    return {
      status: "fail",
      detail:
        `${violations.length} file(s) touched human-owned acceptance assertions: ` +
        violations.map((v) => v.file).join(", ") +
        (cfgHit ? ` (${CONFIG_REL} itself — commit human-approved changes to activate)` : ""),
      violations,
      paths,
    };
  }

  return {
    status: "pass",
    detail: `acceptance assertions untouched (${paths.length} protected path(s))`,
    violations: [],
    paths,
  };
}

/** git diff --name-only HEAD；非 git 仓库 / diff 不可用 → null（调用方按 skip 处理） */
export function gitChangedFiles(root) {
  try {
    const out = execSync("git diff --name-only HEAD", {
      cwd: root,
      encoding: "utf-8",
      timeout: 15000,
      stdio: "pipe",
    }).trim();
    return out ? out.split("\n").filter(Boolean) : [];
  } catch {
    return null;
  }
}

/** 结果化检查（forge-loop / CLI 用） */
export function runCheck(root) {
  const cfg = loadConfig(root);
  if (!cfg) {
    return { status: "skip", detail: `skip (no ${CONFIG_REL})`, violations: [], paths: [] };
  }
  const changed = gitChangedFiles(root);
  if (changed === null) {
    return { status: "skip", detail: "skip (git diff unavailable)", violations: [], paths: [] };
  }
  return evaluateAcceptance(cfg, changed);
}

/** forge-verify 契约：违规 throw，否则返回 detail（"skip ..." → skip 状态） */
export function check(root) {
  const r = runCheck(root);
  if (r.status === "fail") throw new Error(r.detail);
  return r.detail;
}

// --- CLI ---
function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] === "show" ? "show" : "check";
  let root = process.cwd();
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--root" && args[i + 1]) root = args[++i];
  }

  if (cmd === "show") {
    const cfg = loadConfig(root);
    if (!cfg) {
      console.log(`No ${CONFIG_REL} — acceptance-readonly gate inactive.`);
      process.exit(0);
    }
    console.log(`\n=== Acceptance-Readonly (owner: ${cfg.owner || "human"}) ===`);
    console.log(cfg.description || "");
    for (const p of cfg.paths || []) console.log(`  🔒 ${p}`);
    console.log("");
    process.exit(0);
  }

  const r = runCheck(root);
  if (r.status === "fail") {
    console.error(`✗ acceptance-readonly: ${r.detail}`);
    console.error("  验收断言由人类拥有：revert 对上述文件的改动；要改判定标准 → 人类批准的变更（change-manager / PR）。");
    process.exit(1);
  }
  console.log(`✓ acceptance-readonly: ${r.detail}`);
  process.exit(0);
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) main();
