#!/usr/bin/env node
/**
 * baseline.mjs — 基线存取逻辑
 *
 * .forge/verify-baseline.json 格式：
 * { <checkName>: { status: "pass"|"fail"|"skip", detail: "..." }, ... }
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const BASELINE_FILE = ".forge/verify-baseline.json";

export function baselinePath(cwd = process.cwd()) {
  return join(cwd, BASELINE_FILE);
}

export function loadBaseline(cwd = process.cwd()) {
  const p = baselinePath(cwd);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

export function saveBaseline(results, cwd = process.cwd()) {
  const p = baselinePath(cwd);
  const dir = join(cwd, ".forge");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(p, JSON.stringify(results, null, 2) + "\n", "utf-8");
}

/**
 * Compare current results against saved baseline.
 * Returns { added: [...newly failed], removed: [...newly passed], unchanged: [...] }
 */
export function compareBaseline(current, baseline) {
  if (!baseline) {
    return { added: [], removed: [], unchanged: [], firstRun: true };
  }

  const added = [];
  const removed = [];
  const unchanged = [];

  for (const [name, cur] of Object.entries(current)) {
    const prev = baseline[name];
    if (!prev) {
      if (cur.status === "fail") added.push(name);
      continue;
    }
    if (prev.status === "pass" && cur.status === "fail") {
      added.push(name);
    } else if (prev.status === "fail" && cur.status === "pass") {
      removed.push(name);
    } else {
      unchanged.push(name);
    }
  }

  return { added, removed, unchanged, firstRun: false };
}
