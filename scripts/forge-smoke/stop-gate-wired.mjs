#!/usr/bin/env node
/**
 * stop-gate-wired — claude-code adapter 的 stop-time gate 接在 Stop 生命周期（非 PreToolUse）
 *
 * 防回归：dogfood #5 (2026-07-02) 发现 phase-exit-guard/stop-gate/retry-gate 被错误接在
 * PreToolUse，导致 stop-time gate 从不触发（YOLO .yolo-pending 永不写入）。
 * 本 smoke 断言 claude-code 的 settings.json + settings.windows.json：
 *   - 存在顶层 Stop key
 *   - phase-exit-guard / stop-gate / retry-gate 在 Stop 下（不在 PreToolUse 下）
 *   - detect-feedback-signal 仍在 PreToolUse 下（它是注入 hook，非 stop gate）
 *
 * 注：仅校验 claude-code。opencode/cursor/gemini 无真正 Stop 生命周期（见 .forge/deferred-ideas.md），
 *     为它们写假接线 = 重蹈本 bug，故不校验。
 */
import fs from "fs";
import path from "path";
import { ROOT, createRunner } from "./lib.mjs";

const r = createRunner("stop-gate-wired");

const STOP_GATES = ["phase-exit-guard", "stop-gate", "retry-gate"];
const PRETOOLUSE_ONLY = ["detect-feedback-signal"];

/** 从 settings.hooks.<event> 提取所有 hook 命令里的 hook 名（最后一段 .sh/.bat 前的 basename） */
function hookNamesUnder(hooks, event) {
  if (!Array.isArray(hooks[event])) return [];
  return hooks[event].flatMap((group) =>
    (group.hooks || [])
      .map((h) => (h.command || "").match(/([a-z-]+)\.(?:sh|bat)$/)?.[1])
      .filter(Boolean)
  );
}

for (const rel of [
  "adapters/claude-code/.claude/settings.json",
  "adapters/claude-code/.claude/settings.windows.json",
]) {
  const file = path.join(ROOT, rel);
  const json = JSON.parse(fs.readFileSync(file, "utf-8"));
  const hooks = json.hooks || {};
  const stopHooks = hookNamesUnder(hooks, "Stop");
  const pretooluseHooks = hookNamesUnder(hooks, "PreToolUse");

  r.assert(Array.isArray(hooks.Stop) && hooks.Stop.length > 0, `${rel}: must have a non-empty top-level "Stop" hook array`);

  for (const gate of STOP_GATES) {
    r.assert(
      stopHooks.includes(gate),
      `${rel}: "${gate}" must be wired under Stop (got Stop=[${stopHooks.join(",")}])`
    );
    r.assert(
      !pretooluseHooks.includes(gate),
      `${rel}: "${gate}" must NOT remain under PreToolUse (regression of dogfood #5)`
    );
  }

  for (const hook of PRETOOLUSE_ONLY) {
    r.assert(
      pretooluseHooks.includes(hook),
      `${rel}: "${hook}" must remain under PreToolUse (it is an injection hook, not a stop gate)`
    );
  }
}

r.finish();
