#!/usr/bin/env node
/**
 * forge-spec-distill.mjs — Distillation Map 校验器
 *
 * 校验 product-spec-builder Distillation Mode 的产出（Distillation Map）：
 *   1. §P1–§P4 四条推断路径齐全
 *   2. D 前缀 finding 行
 *   3. ⚠️ 行带 basis（§P\d 或 URL）；⚠️[来源不足] 计出现但不计配额
 *   4. ❓ 待确认 section 非空
 *   5. 0 条 ⚠️ = sycophantic（原话 rubber-stamp）
 *   6. <3 条 sourced 发现 = low-distillation
 *
 * 用法:
 *   node scripts/forge-spec-distill.mjs <Distillation-Map.md> [--json]
 *
 * 注册:
 *   pnpm forge-spec-distill
 *
 * 原语复用自 forge-spec-critique.mjs（countWords / ID-row 匹配 / 密度配额）。
 * 退出码: sycophantic / malformed → 非 0（可被 CI/smoke 门禁）。
 */

import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ============================================================
// 原语（复用自 forge-spec-critique.mjs）
// ============================================================

function countWords(text, wordList) {
  let count = 0;
  for (const w of wordList) {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const matches = text.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

// 不确定/假设类语言（辅助信号：是否用语言表达了不确定性）
const UNCERTAINTY_MARKERS = [
  "待确认", "待核实", "不确定", "[TBD]", "[待确认]",
  "assumption", "prerequisite", "需要确认",
];

// ============================================================
// 分析引擎
// ============================================================

function analyzeDistillation(text) {
  // 1. 四路径齐全
  const paths = [1, 2, 3, 4].map(n => ({
    n,
    present: new RegExp(`§P${n}`).test(text),
  }));
  const pathsPresent = paths.every(p => p.present);
  const missingPaths = paths.filter(p => !p.present).map(p => `§P${p.n}`);

  // 2. D 前缀 finding 行
  const findingRows = text.match(/^\|\s*D\d+\s*\|.*$/gm) || [];

  // 3. 逐行判定标记 + basis
  let warningSourced = 0;   // ⚠️ 带 §P\d 或 URL basis（非 [来源不足]）
  let warningUnsourced = 0; // ⚠️[来源不足] 或 ⚠️ 无 basis
  let questionCount = 0;    // ❓
  let confirmCount = 0;     // ✅
  for (const row of findingRows) {
    const hasBasis = /§P\d/.test(row) || /https?:\/\//.test(row);
    const isUnsourced = /\[来源不足\]/.test(row);
    if (/⚠️/.test(row)) {
      if (hasBasis && !isUnsourced) warningSourced++;
      else warningUnsourced++;
    } else if (/❓/.test(row)) {
      questionCount++;
    } else if (/✅/.test(row)) {
      confirmCount++;
    }
  }
  const warningRows = warningSourced + warningUnsourced;

  // 4. ❓ 待确认 section 非空（符号行 或 编号条目）
  const questionSectionMatch = text.match(/❓[\s\S]*?(?:\n#{1,3}\s|\n```|$)/);
  const questionSectionItems = questionSectionMatch
    ? (questionSectionMatch[0].match(/^\s*\d+\.\s+/gm) || []).length
    : 0;
  const questionSectionNonEmpty = questionCount > 0 || questionSectionItems > 0;

  // 辅助：不确定语言密度
  const uncertaintyMarkers = countWords(text, UNCERTAINTY_MARKERS);

  // 5 & 6. 判级
  const substantiveSourced = warningSourced + questionCount; // ❓ 计入配额
  let level;
  if (!pathsPresent) level = "malformed";
  else if (warningRows === 0) level = "sycophantic";
  else if (substantiveSourced < 3) level = "low-distillation";
  else if (warningUnsourced > warningSourced) level = "shallow";
  else if (!questionSectionNonEmpty) level = "adequate";
  else level = "rigorous";

  const quotaMet = substantiveSourced >= 3;

  return {
    paths: { pathsPresent, missing: missingPaths },
    findings: {
      total: findingRows.length,
      confirm: confirmCount,
      warningSourced,
      warningUnsourced,
      question: questionCount,
    },
    quota: { substantiveSourced, quotaMet },
    questionSection: { nonEmpty: questionSectionNonEmpty, items: questionSectionItems },
    uncertaintyMarkers,
    level,
    recommendation:
      level === "malformed" ? `Missing inference paths: ${missingPaths.join(", ")}` :
      level === "sycophantic" ? "0 ⚠️ inferred needs — rubber-stamp of user's words; re-scan mandatory" :
      level === "low-distillation" ? `Only ${substantiveSourced} sourced findings — below quota of 3` :
      level === "shallow" ? "High unsourced ⚠️ ratio — findings lack §P/URL basis" :
      level === "adequate" ? "Quota met but no ❓ section — surface uncertainties" :
                             "Distillation density adequate",
  };
}

// ============================================================
// 输出
// ============================================================

const LEVEL_BADGE = {
  rigorous: "✅ 严实", adequate: "👌 及格",
  shallow: "⚠️  偏浅", "low-distillation": "⚠️  不足",
  sycophantic: "❌ 敷衍", malformed: "❌ 缺路径",
};

function printReport(filePath, data) {
  console.log("=".repeat(52));
  console.log("  Distillation Map 校验  ".padEnd(50, "═"));
  console.log("=".repeat(52));
  console.log(`  文件: ${filePath}`);
  console.log("=".repeat(52));

  console.log(`\n🧭 推断路径`);
  console.log(`  四路径齐全: ${data.paths.pathsPresent ? "YES" : "NO"}`);
  if (data.paths.missing.length) console.log(`  缺失: ${data.paths.missing.join(", ")}`);

  console.log(`\n📋 Findings (D 行)`);
  console.log(`  Total:           ${data.findings.total}`);
  console.log(`  ✅ 已确认:       ${data.findings.confirm}`);
  console.log(`  ⚠️  带依据:       ${data.findings.warningSourced}`);
  console.log(`  ⚠️[来源不足]:    ${data.findings.warningUnsourced}`);
  console.log(`  ❓ 待确认:       ${data.findings.question}`);

  console.log(`\n✅ 配额检查`);
  console.log(`  Sourced (⚠️带依据 + ❓): ${data.quota.substantiveSourced}  (配额 ≥3: ${data.quota.quotaMet ? "YES" : "NO"})`);
  console.log(`  ❓ section 非空:          ${data.questionSection.nonEmpty ? "YES" : "NO"}`);
  console.log(`  不确定语言标记:           ${data.uncertaintyMarkers}`);

  console.log(`\n📊 Verdict: ${LEVEL_BADGE[data.level] || data.level}`);
  console.log(`  ${data.recommendation}`);
  console.log("-".repeat(52));
}

// ============================================================
// Main
// ============================================================

const args = process.argv.slice(2);
const filePath = args[0];
const jsonMode = args.includes("--json");

if (!filePath) {
  console.error("用法: node scripts/forge-spec-distill.mjs <Distillation-Map.md> [--json]");
  console.error("  --json  输出 JSON 格式供管道使用");
  process.exit(1);
}

const resolved = filePath.startsWith("/") || filePath.match(/^[A-Z]:/i) ? filePath : join(ROOT, filePath);
if (!existsSync(resolved)) {
  console.error(`文件不存在: ${resolved}`);
  process.exit(1);
}

const text = readFileSync(resolved, "utf-8");
const result = analyzeDistillation(text);

if (jsonMode) {
  console.log(JSON.stringify({ file: resolved, ...result }, null, 2));
} else {
  printReport(resolved, result);
}

// 门禁: sycophantic / malformed → 非 0 退出
if (result.level === "sycophantic" || result.level === "malformed") {
  process.exit(2);
}
