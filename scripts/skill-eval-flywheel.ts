/**
 * Skill-eval 质量飞轮：记录 run 快照、前后对比、失败归类。
 * 关联：scripts/skill-eval.ts（CLI 入口）、core/docs/skill-eval.md
 *
 * 吸收自 google/agents-cli 的 generate→grade→compare→analyze 闭环（本地静态/judge 版）。
 */

import * as fs from "fs";
import * as path from "path";
import type { EvalCheck, JudgeReport, SkillEvalResult } from "./skill-eval";

export const RUN_HISTORY_FILE = "run-history.json";
export const JUDGE_HISTORY_FILE = "judge-history.json";

/** 单次 skill-eval run 的可对比快照 */
export interface EvalRunSnapshot {
  version: 1;
  skill: string;
  recorded_at: string;
  passed: boolean;
  errorCount: number;
  warnCount: number;
  /** 未通过的检查（仅失败项，便于 diff） */
  failed: { id: string; severity: string; message: string }[];
}

export interface CompareResult {
  kind: "run" | "judge";
  earlierLabel: string;
  laterLabel: string;
  summary: string;
  newlyFailing: string[];
  newlyPassing: string[];
  stillFailing: string[];
  scoreDelta?: number;
  dimensionDeltas?: { id: string; before: number; after: number; delta: number }[];
}

export interface AnalyzeCluster {
  category: string;
  count: number;
  items: { id: string; message: string }[];
}

export interface AnalyzeResult {
  kind: "run" | "judge";
  label: string;
  clusters: AnalyzeCluster[];
  shortcutsReminder: string[];
}

/** 从 EvalCheck 列表提取失败项 */
export function failedFromChecks(checks: EvalCheck[]): EvalRunSnapshot["failed"] {
  return checks
    .filter((c) => !c.ok)
    .map((c) => ({ id: c.id, severity: c.severity, message: c.message }));
}

/** 将本次 run 结果追加到 run-history.json */
export function recordEvalRunSnapshot(
  evalDir: string,
  skillName: string,
  result: SkillEvalResult,
): string {
  const snapshot: EvalRunSnapshot = {
    version: 1,
    skill: skillName,
    recorded_at: new Date().toISOString(),
    passed: result.passed,
    errorCount: result.errorCount,
    warnCount: result.warnCount,
    failed: failedFromChecks(result.checks),
  };

  const historyPath = path.join(evalDir, RUN_HISTORY_FILE);
  let history: EvalRunSnapshot[] = [];
  if (fs.existsSync(historyPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
      if (Array.isArray(raw)) history = raw as EvalRunSnapshot[];
    } catch {
      /* 损坏则重建 */
    }
  }
  history.push(snapshot);
  fs.mkdirSync(evalDir, { recursive: true });
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2) + "\n", "utf-8");
  return historyPath;
}

/** 对比两次 run 快照 */
export function compareRunSnapshots(
  earlier: EvalRunSnapshot,
  later: EvalRunSnapshot,
): CompareResult {
  const earlierIds = new Set(earlier.failed.map((f) => f.id));
  const laterIds = new Set(later.failed.map((f) => f.id));

  const newlyFailing = [...laterIds].filter((id) => !earlierIds.has(id));
  const newlyPassing = [...earlierIds].filter((id) => !laterIds.has(id));
  const stillFailing = [...laterIds].filter((id) => earlierIds.has(id));

  const errDelta = later.errorCount - earlier.errorCount;
  const warnDelta = later.warnCount - earlier.warnCount;
  const trend =
    errDelta < 0 || (errDelta === 0 && newlyPassing.length > newlyFailing.length)
      ? "improved"
      : errDelta > 0 || newlyFailing.length > 0
        ? "regressed"
        : "unchanged";

  const summary = [
    `errors ${earlier.errorCount} → ${later.errorCount} (${errDelta >= 0 ? "+" : ""}${errDelta})`,
    `warns ${earlier.warnCount} → ${later.warnCount} (${warnDelta >= 0 ? "+" : ""}${warnDelta})`,
    `passed ${earlier.passed} → ${later.passed}`,
    `trend: ${trend}`,
  ].join("; ");

  return {
    kind: "run",
    earlierLabel: earlier.recorded_at,
    laterLabel: later.recorded_at,
    summary,
    newlyFailing,
    newlyPassing,
    stillFailing,
  };
}

/** 对比两次 judge report */
export function compareJudgeReports(earlier: JudgeReport, later: JudgeReport): CompareResult {
  const beforeMap = new Map(earlier.scores.map((s) => [s.dimension_id, s.score]));
  const afterMap = new Map(later.scores.map((s) => [s.dimension_id, s.score]));
  const allIds = new Set([...beforeMap.keys(), ...afterMap.keys()]);

  const dimensionDeltas: CompareResult["dimensionDeltas"] = [];
  for (const id of allIds) {
    const before = beforeMap.get(id) ?? 0;
    const after = afterMap.get(id) ?? 0;
    if (before !== after) {
      dimensionDeltas.push({ id, before, after, delta: after - before });
    }
  }
  dimensionDeltas.sort((a, b) => a.delta - b.delta);

  const scoreDelta = later.total_score - earlier.total_score;
  const newlyFailing = dimensionDeltas.filter((d) => d.delta < 0).map((d) => d.id);
  const newlyPassing = dimensionDeltas.filter((d) => d.delta > 0).map((d) => d.id);

  return {
    kind: "judge",
    earlierLabel: earlier.judged_at,
    laterLabel: later.judged_at,
    summary: `total_score ${earlier.total_score} → ${later.total_score} (${scoreDelta >= 0 ? "+" : ""}${scoreDelta})`,
    newlyFailing,
    newlyPassing,
    stillFailing: [],
    scoreDelta,
    dimensionDeltas,
  };
}

/** 检查 id 归类：triggers-xxx → triggers */
export function categoryOfCheckId(id: string): string {
  const m = id.match(/^([a-z]+(?:-[a-z]+)*)-/);
  if (m) {
    // triggers-should-count → triggers; ref-lint-L12 → ref-lint
    const parts = id.split("-");
    if (parts[0] === "ref" && parts[1] === "lint") return "ref-lint";
    if (parts[0] === "triggers") return "triggers";
    if (parts[0] === "cases") return "cases";
    if (parts[0] === "glob" || parts[0] === "file" || parts[0] === "max") return "assertions";
    return parts[0];
  }
  return "other";
}

/** 对最新 run 失败项聚类 */
export function analyzeRunFailures(snapshot: EvalRunSnapshot): AnalyzeResult {
  const map = new Map<string, { id: string; message: string }[]>();
  for (const f of snapshot.failed) {
    const cat = categoryOfCheckId(f.id);
    const list = map.get(cat) || [];
    list.push({ id: f.id, message: f.message });
    map.set(cat, list);
  }
  const clusters: AnalyzeCluster[] = [...map.entries()]
    .map(([category, items]) => ({ category, count: items.length, items }))
    .sort((a, b) => b.count - a.count);

  return {
    kind: "run",
    label: snapshot.recorded_at,
    clusters,
    shortcutsReminder: [
      "禁止调低断言/阈值来凑绿 — 修 Skill 或修产物",
      "禁止删掉「不稳定」用例 — 收紧指令或固定温度/写法",
      "禁止只改 expected 输出而不改 Skill — 行为问题先修实现",
    ],
  };
}

/** 对最新 judge 低分维度聚类（score < 7） */
export function analyzeJudgeFailures(report: JudgeReport, lowThreshold = 7): AnalyzeResult {
  const low = report.scores.filter((s) => s.score < lowThreshold);
  const clusters: AnalyzeCluster[] = low
    .sort((a, b) => a.score - b.score)
    .map((s) => ({
      category: s.dimension_id,
      count: 1,
      items: [{ id: `${s.dimension_id}:${s.score}`, message: s.evidence || "(no evidence)" }],
    }));

  return {
    kind: "judge",
    label: report.judged_at,
    clusters,
    shortcutsReminder: [
      "禁止调低 rubric 门槛来凑绿",
      "低分维度优先改 SKILL.md 工作流，而非改 judge 报告",
      "同一维度连续两轮不升 → 记入 rejected-edits，换思路",
    ],
  };
}

function loadJsonArray<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return Array.isArray(raw) ? (raw as T[]) : [];
  } catch {
    return [];
  }
}

/** CLI：对比 run-history 最近两次 */
export function compareLatestRuns(evalDir: string): CompareResult {
  const history = loadJsonArray<EvalRunSnapshot>(path.join(evalDir, RUN_HISTORY_FILE));
  if (history.length < 2) {
    throw new Error(
      `Need >= 2 entries in ${RUN_HISTORY_FILE} (have ${history.length}). Run: pnpm skill-eval <skill> at least twice.`,
    );
  }
  return compareRunSnapshots(history[history.length - 2], history[history.length - 1]);
}

/** CLI：对比 judge-history 最近两次 */
export function compareLatestJudges(evalDir: string): CompareResult {
  const history = loadJsonArray<JudgeReport>(path.join(evalDir, JUDGE_HISTORY_FILE));
  if (history.length < 2) {
    throw new Error(
      `Need >= 2 entries in ${JUDGE_HISTORY_FILE} (have ${history.length}). Record two judge reports first.`,
    );
  }
  return compareJudgeReports(history[history.length - 2], history[history.length - 1]);
}

/** CLI：分析最新 run 失败 */
export function analyzeLatestRun(evalDir: string): AnalyzeResult {
  const history = loadJsonArray<EvalRunSnapshot>(path.join(evalDir, RUN_HISTORY_FILE));
  if (history.length === 0) {
    throw new Error(`No ${RUN_HISTORY_FILE}. Run: pnpm skill-eval <skill> first.`);
  }
  return analyzeRunFailures(history[history.length - 1]);
}

/** CLI：分析最新 judge 低分 */
export function analyzeLatestJudge(evalDir: string): AnalyzeResult {
  const history = loadJsonArray<JudgeReport>(path.join(evalDir, JUDGE_HISTORY_FILE));
  if (history.length === 0) {
    throw new Error(`No ${JUDGE_HISTORY_FILE}. Record a judge report first.`);
  }
  return analyzeJudgeFailures(history[history.length - 1]);
}

export function formatCompareResult(result: CompareResult): string {
  const lines = [
    `=== skill-eval compare (${result.kind}) ===`,
    `Earlier: ${result.earlierLabel}`,
    `Later:   ${result.laterLabel}`,
    `Summary: ${result.summary}`,
    "",
  ];
  if (result.newlyPassing.length) {
    lines.push(`Newly passing (${result.newlyPassing.length}):`);
    for (const id of result.newlyPassing) lines.push(`  ✅ ${id}`);
    lines.push("");
  }
  if (result.newlyFailing.length) {
    lines.push(`Newly failing / worse (${result.newlyFailing.length}):`);
    for (const id of result.newlyFailing) lines.push(`  ❌ ${id}`);
    lines.push("");
  }
  if (result.stillFailing.length) {
    lines.push(`Still failing (${result.stillFailing.length}):`);
    for (const id of result.stillFailing) lines.push(`  • ${id}`);
    lines.push("");
  }
  if (result.dimensionDeltas?.length) {
    lines.push("Dimension deltas:");
    for (const d of result.dimensionDeltas) {
      const sign = d.delta >= 0 ? "+" : "";
      lines.push(`  ${d.id}: ${d.before} → ${d.after} (${sign}${d.delta})`);
    }
    lines.push("");
  }
  if (result.kind === "run" && result.newlyFailing.length > 0) {
    lines.push("⚠️ Regression detected — fix before claiming improvement.");
  }
  if (result.kind === "judge" && (result.scoreDelta ?? 0) < 0) {
    lines.push("⚠️ Judge total_score regressed — do not ship this Skill edit.");
  }
  return lines.join("\n");
}

export function formatAnalyzeResult(result: AnalyzeResult): string {
  const lines = [
    `=== skill-eval analyze (${result.kind}) ===`,
    `Snapshot: ${result.label}`,
    "",
  ];
  if (result.clusters.length === 0) {
    lines.push("No failures / low scores to cluster.");
  } else {
    lines.push("Failure clusters (fix highest-count / lowest-score first):");
    for (const c of result.clusters) {
      lines.push(`\n[${c.category}] ×${c.count}`);
      for (const item of c.items) {
        lines.push(`  - ${item.id}: ${item.message}`);
      }
    }
  }
  lines.push("\nShortcuts to resist:");
  for (const s of result.shortcutsReminder) {
    lines.push(`  ✗ ${s}`);
  }
  return lines.join("\n");
}
