#!/usr/bin/env node
/**
 * forge-spec-blind-eval.mjs — 自动化盲评实验
 *
 * 严格验证 "critique gate 有用" 的低成本方案：
 * 1. 对同一份需求，用两个独立 LLM session 生成 spec
 *    - Session A: 常规 prompt（讨好模式）
 *    - Session B: 加 critique prompt（批判模式）
 * 2. 打乱顺序，让 LLM 盲评两份 spec
 * 3. 记录评分和偏好
 *
 * 用法:
 *   OPENAI_API_KEY=xxx node scripts/forge-spec-blind-eval.mjs
 *   ANTHROPIC_API_KEY=xxx node scripts/forge-spec-blind-eval.mjs --use-anthropic
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BRIEFS_DIR = join(ROOT, "forge-spec-experiment", "briefs");
const RESULTS_DIR = join(ROOT, "forge-spec-experiment", "blind-eval");

const useAnthropic = process.argv.includes("--use-anthropic");
const useDeepSeek = process.argv.includes("--use-deepseek") || (!process.argv.includes("--use-anthropic") && process.env.DEEPSEEK_API_KEY);
const API_KEY = useAnthropic
  ? (process.env.ANTHROPIC_API_KEY || "")
  : useDeepSeek
  ? (process.env.DEEPSEEK_API_KEY || "")
  : (process.env.OPENAI_API_KEY || "");

// ============================================================
// LLM 调用
// ============================================================

async function callOpenAI(system, user) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown");
    throw new Error(`OpenAI error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callAnthropic(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      system,
      messages: [{ role: "user", content: user }],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown");
    throw new Error(`Anthropic error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || "";
}

async function callDeepSeek(system, user) {
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown");
    throw new Error(`DeepSeek error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

function callLLM(system, user) {
  if (useAnthropic) return callAnthropic(system, user);
  if (useDeepSeek) return callDeepSeek(system, user);
  return callOpenAI(system, user);
}

// ============================================================
// Prompt 模板
// ============================================================

const SPEC_SYSTEM = "你是一个产品经理，负责根据用户需求生成 Product Spec。\n输出一份结构化的需求规格文档，包含：产品概述、目标用户、核心功能、用户流程、技术要求。\n用 Markdown 格式。";

const SPEC_USER = (brief) => "请根据以下需求描述，生成一份 Product Spec：\n\n" + brief;

const CRITIQUE_SYSTEM = "你是一个产品经理，负责根据用户需求生成 Product Spec。\n\n重要：你必须以批判性思维分析需求。对于每条需求：\n1. 检查是否有隐含假设没写出来\n2. 检查是否有不可行的部分，标注并给出替代方案\n3. 检查是否有模糊描述，要求明确化\n4. 做范围裁剪建议（v1/v2/不做）\n5. 列出风险矩阵\n\n输出一份结构化的需求规格文档，包含：产品概述、目标用户、核心功能（含风险标注和替代方案）、范围裁剪建议、风险矩阵、前提条件、用户流程、技术要求。\n用 Markdown 格式。";

const EVAL_SYSTEM = '你是一个资深产品经理和开发团队 leader，负责评审两份 Product Spec。\n\n两份 spec 来自不同的撰写方式，但你不知道哪份是哪种方式写的。\n请你作为评审者，从以下维度对每份 spec 打分（1-10），并选出你更愿意用来指导开发的那份：\n\n1. 完整性：是否覆盖了关键需求维度\n2. 风险可见性：是否暴露了潜在风险和假设\n3. 可执行性：开发团队拿到这份 spec 能否直接开始工作\n4. 范围清晰度：v1 范围是否明确，什么做什么不做\n5. 抗返工能力：按这份 spec 开发，返工的可能性有多大（10=几乎不会返工）\n\n输出格式（严格遵守，不要输出其他内容）：\n```json\n{\n  "spec_a": { "完整性": N, "风险可见性": N, "可执行性": N, "范围清晰度": N, "抗返工能力": N },\n  "spec_b": { "完整性": N, "风险可见性": N, "可执行性": N, "范围清晰度": N, "抗返工能力": N },\n  "preference": "A",\n  "reason": "一句话理由"\n}\n```';

const EVAL_USER = (specA, specB) => "## Spec A\n\n" + specA + "\n\n---\n\n## Spec B\n\n" + specB + "\n\n---\n\n请评审以上两份 spec，按指定格式输出评分和偏好。";

// ============================================================
// 实验流程
// ============================================================

async function runExperiment(briefFile) {
  const briefPath = join(BRIEFS_DIR, briefFile);
  if (!existsSync(briefPath)) {
    console.error("  需求文件不存在: " + briefPath);
    return null;
  }

  const brief = readFileSync(briefPath, "utf-8");
  const name = briefFile.replace(/\.md$/, "");
  console.log("\n" + "=".repeat(50));
  console.log("  实验: " + name);
  console.log("=".repeat(50));

  // Step 1: 生成两份 spec
  console.log("  [1/3] 生成对照组 spec...");
  const specControl = await callLLM(SPEC_SYSTEM, SPEC_USER(brief));

  console.log("  [2/3] 生成实验组 spec...");
  const specCritique = await callLLM(CRITIQUE_SYSTEM, SPEC_USER(brief));

  // Step 2: 打乱顺序
  const swap = Math.random() > 0.5;
  const specA = swap ? specCritique : specControl;
  const specB = swap ? specControl : specCritique;
  const labelA = swap ? "critique" : "control";
  const labelB = swap ? "control" : "critique";

  console.log("  [3/3] 盲评 (A=" + labelA + ", B=" + labelB + ")...");

  // Step 3: 盲评
  const evalResult = await callLLM(EVAL_SYSTEM, EVAL_USER(specA, specB));

  // 解析评分
  let scores;
  try {
    const jsonMatch = evalResult.match(/```json\s*([\s\S]*?)```/);
    scores = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(evalResult);
  } catch {
    scores = { raw: evalResult };
  }

  // 还原标签
  const preference = scores.preference
    ? scores.preference + " (= " + (scores.preference === "A" ? labelA : labelB) + ")"
    : "unknown";

  const result = {
    name,
    timestamp: new Date().toISOString(),
    provider: useAnthropic ? "anthropic" : useDeepSeek ? "deepseek" : "openai",
    assignment: { A: labelA, B: labelB },
    specLength: { control: specControl.length, critique: specCritique.length },
    evaluation: scores,
    preference,
    reason: scores.reason || "",
  };

  // 保存
  mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(join(RESULTS_DIR, name + ".json"), JSON.stringify(result, null, 2));
  mkdirSync(join(RESULTS_DIR, "specs"), { recursive: true });
  writeFileSync(join(RESULTS_DIR, "specs", name + "-control.md"), specControl);
  writeFileSync(join(RESULTS_DIR, "specs", name + "-critique.md"), specCritique);

  console.log("  完成 — 偏好: " + preference);
  return result;
}

// ============================================================
// Main
// ============================================================

async function main() {
  if (!API_KEY) {
    console.error("用法: DEEPSEEK_API_KEY=xxx node scripts/forge-spec-blind-eval.mjs");
    console.error("  或:  OPENAI_API_KEY=xxx node scripts/forge-spec-blind-eval.mjs");
    console.error("  或:  ANTHROPIC_API_KEY=xxx node scripts/forge-spec-blind-eval.mjs --use-anthropic");
    process.exit(1);
  }

  const briefFiles = readdirSync(BRIEFS_DIR).filter((f) => f.endsWith(".md")).sort();
  if (briefFiles.length === 0) {
    console.error("没有需求文件，请先在 forge-spec-experiment/briefs/ 中添加");
    process.exit(1);
  }

  console.log("找到 " + briefFiles.length + " 份需求文件");
  console.log("Provider: " + (useAnthropic ? "anthropic" : useDeepSeek ? "deepseek" : "openai"));

  const results = [];
  for (const f of briefFiles) {
    const r = await runExperiment(f);
    if (r) results.push(r);
  }

  // 汇总
  console.log("\n" + "=".repeat(50));
  console.log("  汇总");
  console.log("=".repeat(50));

  let controlWins = 0;
  let critiqueWins = 0;
  const dimSums = { control: {}, critique: {} };

  for (const r of results) {
    const winner = r.preference.includes("critique") ? "critique" : "control";
    if (winner === "critique") critiqueWins++;
    else controlWins++;
    console.log("  " + r.name + ": " + r.preference + " — " + r.reason);

    // 汇总维度分数
    const dims = ["完整性", "风险可见性", "可执行性", "范围清晰度", "抗返工能力"];
    for (const dim of dims) {
      const aLabel = r.assignment.A;
      const bLabel = r.assignment.B;
      const aScore = r.evaluation?.spec_a?.[dim] || 0;
      const bScore = r.evaluation?.spec_b?.[dim] || 0;
      dimSums[aLabel][dim] = (dimSums[aLabel][dim] || 0) + aScore;
      dimSums[bLabel][dim] = (dimSums[bLabel][dim] || 0) + bScore;
    }
  }

  console.log("\n  对照组胜: " + controlWins + " | 实验组胜: " + critiqueWins + " | 总计: " + results.length);

  // 维度均值
  console.log("\n  维度均值 (1-10):");
  const dims = ["完整性", "风险可见性", "可执行性", "范围清晰度", "抗返工能力"];
  for (const dim of dims) {
    const cAvg = ((dimSums.control[dim] || 0) / results.length).toFixed(1);
    const eAvg = ((dimSums.critique[dim] || 0) / results.length).toFixed(1);
    console.log("    " + dim + ": 对照=" + cAvg + " 批判=" + eAvg);
  }

  writeFileSync(
    join(RESULTS_DIR, "summary.json"),
    JSON.stringify({
      results,
      controlWins,
      critiqueWins,
      total: results.length,
      dimensionAverages: Object.fromEntries(
        dims.map((d) => [d, {
          control: +((dimSums.control[d] || 0) / results.length).toFixed(1),
          critique: +((dimSums.critique[d] || 0) / results.length).toFixed(1),
        }])
      ),
    }, null, 2)
  );
}

main().catch(console.error);
