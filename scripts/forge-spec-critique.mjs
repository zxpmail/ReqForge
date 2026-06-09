#!/usr/bin/env node
/**
 * forge-spec-critique.mjs — Spec 批判性回溯分析工具
 *
 * 基于 A/B 实验验证的指标设计。
 * 实验结论: 模糊词密度不是可靠指标（诚实讨论也需要不确定性语言），
 *            假设显性化 + 挑战计数才是核心信号。
 *
 * 用法:
 *   node scripts/forge-spec-critique.mjs <Product-Spec.md> [--json]
 *
 * 注册:
 *   pnpm forge-spec-critique
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ============================================================
// 词表（基于实验数据校准）
// ============================================================

// --- 讨好型空话 (Fluff): 卖方语言、空洞承诺 ---
// 这些词出现在 spec 中意味着"客户说什么就写什么"，
// 没有经过工程化思考就做出的承诺。
const FLUFF_WORDS = [
  // 中文卖方语言
  "良好", "高质量的", "高质量", "可靠的", "高可用",
  "高性能", "可扩展", "可维护", "高并发",
  "灵活的", "强大的", "智能的", "完整的",
  "全面的", "优秀的", "卓越的", "极致的",
  "无缝的", "丝滑的", "流畅的",
  "用户体验好", "易于使用", "界面美观",
  // 英文卖方语言
  "high-quality", "high quality", "enterprise-grade", "enterprise grade",
  "best-in-class", "world-class", "robust", "seamless",
  "scalable", "high-performance", "high performance",
];

// --- 假设标识 ---
const ASSUMPTION_MARKERS = [
  "假设", "前提", "依赖",
  "假设条件", "前置条件",
  "未说明", "需要确认",
  "assumption", "prerequisite", "dependency",
  "前提条件", "待确认",
];

// --- 挑战/批判性词 ---
// 实验组和控制组差异最大的指标
const CRITIQUE_WORDS = [
  "不建议", "存在风险", "不可行",
  "替代方案", "风险", "限制", "局限",
  "不可行（", "矛盾", "模糊需求",
  "需注意", "但需明确", "但需确认",
  "not recommended", "risky", "infeasible",
  "alternative", "caveat", "limitation",
  "trade-off", "tradeoff",
];

// --- 裁剪方案标识 ---
const SCOPE_WORDS = [
  "v1", "v2", "v3",
  "不做", "建议砍掉", "放到v2", "放到v3",
  "超出范围", "范围外", "范围裁剪",
  "建议不做",
];

// --- 客户原话驱动 ---
const CLIENT_SAID_WORDS = [
  "客户说", "客户认为", "客户希望", "客户要求",
  "客户提出", "客户的原话",
  "stakeholder said", "client wants",
  "according to the client",
];

// ============================================================
// 分析引擎
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

function analyzeSpec(text) {
  const totalChars = text.length;

  // 核心指标
  const fluffCount = countWords(text, FLUFF_WORDS);
  const assumptionCount = countWords(text, ASSUMPTION_MARKERS);
  const critiqueCount = countWords(text, CRITIQUE_WORDS);
  const scopeCount = countWords(text, SCOPE_WORDS);
  const clientSaidCount = countWords(text, CLIENT_SAID_WORDS);

  // 规格深度
  const lines = text.split("\n");
  const nonEmptyLines = lines.filter(l => l.trim().length > 0).length;
  const sections = text.match(/^#{1,3}\s+.+/gm) || [];
  const listItems = text.match(/^[-*]\s+.*$/gm) || [];
  const riskEntries = text.match(/\|.*风险.*\|.*\|.*\|/g) || [];

  // 归一化密度 (per 1k chars)
  const scale = totalChars > 0 ? 1000 / totalChars : 0;

  return {
    stats: {
      totalChars,
      lines: lines.length,
      nonEmptyLines,
      sections: sections.length,
      listItems: listItems.length,
      riskEntries: riskEntries.length,
    },
    signals: {
      // Positive signals (higher = better)
      assumptionCount,
      assumptionDensity: +(assumptionCount * scale).toFixed(2),
      critiqueCount,
      critiqueDensity: +(critiqueCount * scale).toFixed(2),
      scopeDecisions: scopeCount,
      scopeDensity: +(scopeCount * scale).toFixed(2),
      riskMatrixEntries: riskEntries.length,
      // Negative signals (higher = worse)
      fluffCount,
      fluffDensity: +(fluffCount * scale).toFixed(2),
      clientSaidCount,
      clientSaidDensity: +(clientSaidCount * scale).toFixed(2),
    },
    score: computeScore({
      assumptionCount,
      critiqueCount,
      scopeCount,
      fluffCount,
      riskEntries: riskEntries.length,
      totalChars,
      nonEmptyLines,
    }),
  };
}

function computeScore(input) {
  // 基于实验数据的评分公式:
  // 假设显性化: 每条 +1 分, 上限 10
  // 批判性: 每条 +0.8 分, 上限 10
  // 范围裁剪: 每条 +1.5 分, 上限 10
  // 风险矩阵: 每个矩阵行 +2 分, 上限 10
  // 空话惩罚: 每个空话 -1 分, 不设下限
  // 深度检查: 如果内容太短(<30行)且无明显批判性, -5

  const criticalThinking = Math.min(10, Math.round(
    input.assumptionCount * 1.0 +
    input.critiqueCount * 0.8 +
    input.scopeCount * 1.5 +
    input.riskEntries * 2.0
  ));

  const fluffPenalty = input.fluffCount;

  let depth = Math.min(10, Math.round(input.totalChars / 150));
  if (input.nonEmptyLines < 30 && input.critiqueCount < 3) {
    depth = Math.max(0, depth - 5);
  }

  const total = Math.max(0, Math.min(40,
    criticalThinking - fluffPenalty + depth
  ));

  const level =
    total >= 30 ? "rigorous" :
    total >= 20 ? "adequate" :
    total >= 10 ? "shallow" :
                  "uncritical";

  return {
    criticalThinking: Math.min(30, criticalThinking),
    fluffPenalty,
    specDepth: depth,
    total: Math.min(40, total),
    level,
  };
}

// ============================================================
// 输出
// ============================================================

function badge(level) {
  const map = {
    rigorous:  "✅ 优秀",
    adequate:  "👌 及格",
    shallow:   "⚠️  偏浅",
    uncritical:"❌ 未经批判",
  };
  return map[level] || level;
}

function printReport(filePath, data) {
  const { stats, signals, score } = data;

  console.log("=".repeat(52));
  console.log("  Spec 批判分析  ".padEnd(50, "═"));
  console.log("=".repeat(52));
  console.log(`  文件: ${filePath}`);
  console.log("=".repeat(52));

  console.log(`\n📐 规格`);
  console.log(`  ${stats.totalChars} chars · ${stats.lines} 行 · ${stats.nonEmptyLines} 非空行`);
  console.log(`  ${stats.sections} 章节 · ${stats.listItems} 条目`);
  if (stats.riskEntries > 0) console.log(`  ${stats.riskEntries} 风险矩阵行`);

  console.log(`\n🛡️  批判性信号 (越高越好)`);
  const pct = (v) => v > 0 ? "+" + v : v;
  console.log(`  显式假设:       ${pct(signals.assumptionCount)} 处    (${signals.assumptionDensity}/1k)`);
  console.log(`  质疑/否定:      ${pct(signals.critiqueCount)} 处    (${signals.critiqueDensity}/1k)`);
  console.log(`  范围决策:       ${pct(signals.scopeDecisions)} 处    (${signals.scopeDensity}/1k)`);

  console.log(`\n🔍 讨好信号 (越低越好)`);
  console.log(`  空话承诺:       ${signals.fluffCount} 处    (${signals.fluffDensity}/1k)`);
  console.log(`  客户原话引用:   ${signals.clientSaidCount} 处    (${signals.clientSaidDensity}/1k)`);

  console.log(`\n📊 综合评分 (0-40)`);
  console.log(`  批判性思维:     ${score.criticalThinking}/30`);
  console.log(`  空话惩罚:       -${score.fluffPenalty}`);
  console.log(`  Spec 深度:      ${score.specDepth}/10`);
  console.log(`  ─────────────────────`);
  console.log(`  总分:           ${score.total}/40  →  ${badge(score.level)}`);
  console.log("-".repeat(52));
}

function jsonReport(filePath, data) {
  console.log(JSON.stringify({ file: filePath, ...data }, null, 2));
}

// ============================================================
// Main
// ============================================================

const args = process.argv.slice(2);
const filePath = args[0];
const jsonMode = args.includes("--json");

if (!filePath) {
  console.error("用法: node scripts/forge-spec-critique.mjs <Product-Spec.md> [--json]");
  console.error("  --json  输出 JSON 格式供管道使用");
  process.exit(1);
}

const resolved = filePath.startsWith("/") || filePath.match(/^[A-Z]:/i) ? filePath : join(ROOT, filePath);
if (!existsSync(resolved)) {
  console.error(`文件不存在: ${resolved}`);
  process.exit(1);
}

const text = readFileSync(resolved, "utf-8");
const result = analyzeSpec(text);

if (jsonMode) {
  jsonReport(resolved, result);
} else {
  printReport(resolved, result);
}
