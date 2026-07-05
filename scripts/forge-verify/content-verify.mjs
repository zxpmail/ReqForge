#!/usr/bin/env node
/**
 * forge-verify content-verify — 跨模型语义内容验证
 *
 * 验证当前 Phase 产出的文件内容是否满足任务要求。
 * 模仿实验 E 的 Harness 验证层，使用 DeepSeek（或配置的 LLM）做评判。
 *
 * 用法：
 *   node scripts/forge-verify/content-verify.mjs [--task "任务描述"] [--files file1 file2 ...] [--runs 3]
 *   node scripts/forge-verify/content-verify.mjs --from-config  # 从 .forge/content-verify.json 读配置
 *
 * 实验 E 背景（见 blog 仓 agent-determinism-illusions）：
 *   跨模型质检本质是 precision-recall 权衡，不是完美解。
 *   qwen3:0.5b: 假阳 25% / 误杀 50% — 弱模型漏垃圾但少误杀
 *   gemma3:4.3b: 假阳 25% / 误杀 50% — 更稳但假阳率相同
 *   GLM-5.2:    假阳 0%  / 误杀 75% — 不放过垃圾但大量误杀合法
 *   没有免费午餐。选择什么级别的模型取决于工程上更能接受
 *   漏垃圾（假阳）还是误杀合法（误杀）。
 *
 * 配置（环境变量）：
 *   ANTHROPIC_BASE_URL         — 兼容 API 地址（默认 https://api.deepseek.com/anthropic）
 *   ANTHROPIC_AUTH_TOKEN       — API token
 *   ANTHROPIC_MODEL            — 模型名（默认 deepseek-v4-flash）
 *   VERIFY_TASK                — 任务描述（或用 --task 传入）
 *   VERIFY_FILES               — 待检查文件名（逗号分隔，或用 --files 传入）
 *
 * 退出码：
 *   0 — 全部通过
 *   1 — 存在未通过的检查
 *   2 — 配置缺失
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

// ====== 配置 ======
const CONFIG_PATH = join(ROOT, ".forge", "content-verify.json");
const VERIFY_PROMPT = `You are a quality inspector. Determine if the FILE CONTENT below actually satisfies the TASK REQUIREMENT.

TASK: {task}
FILE CONTENT: {content}

Does the file content actually fulfill the task requirements?
Answer EXACTLY one line:
YES — <brief reason>    OR    NO — <what's missing/wrong>
Then a blank line, then a brief explanation.`;

// ====== CLI 参数解析 ======
const args = process.argv.slice(2);
const taskIdx = args.indexOf("--task");
const filesIdx = args.indexOf("--files");
const fromConfig = args.includes("--from-config");
const runsIdx = args.indexOf("--runs");

let task = "";
let files = [];
let modelOveride = "";
let runs = 3;  // 默认每文件跑 3 次取多数票（抗温度0发散）

if (fromConfig || (!task && !files && existsSync(CONFIG_PATH))) {
  // 从 .forge/config 读取
  const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  task = cfg.task || "";
  files = cfg.files || [];
  modelOveride = cfg.model || "";
} else {
  if (taskIdx >= 0 && taskIdx + 1 < args.length) task = args[taskIdx + 1];
  if (filesIdx >= 0 && filesIdx + 1 < args.length) {
    files = args[filesIdx + 1].split(",").map(f => f.trim());
  }
  if (runsIdx >= 0 && runsIdx + 1 < args.length) {
    runs = parseInt(args[runsIdx + 1], 10) || 3;
  }
}

// 环境变量后备
if (!task) task = process.env.VERIFY_TASK || "";
if (files.length === 0) {
  const envFiles = process.env.VERIFY_FILES || "";
  files = envFiles.split(",").map(f => f.trim()).filter(f => f);
}

// API 配置
const BASE_URL = (process.env.ANTHROPIC_BASE_URL || "https://api.deepseek.com").replace("/anthropic", "");
const TOKEN = process.env.ANTHROPIC_AUTH_TOKEN || "";
const MODEL = modelOveride || process.env.ANTHROPIC_MODEL || "deepseek-v4-flash";

// ====== 校验 ======
if (!TOKEN) {
  console.error("❌ 缺少 ANTHROPIC_AUTH_TOKEN（环境变量）");
  process.exit(2);
}
if (!task) {
  console.error("❌ 缺少任务描述（--task 或 VERIFY_TASK 或 .forge/content-verify.json）");
  process.exit(2);
}

// ====== 调用 LLM ======
async function verifyFile(filePath, taskDesc, nRuns = 1) {
  // 读取文件
  let content;
  try {
    content = readFileSync(filePath, "utf-8").trim();
  } catch {
    return { file: filePath, verdict: "FILE_NOT_FOUND", reason: "文件不存在或无法读取" };
  }
  if (!content) {
    return { file: filePath, verdict: "REJECT", reason: "文件内容为空" };
  }

  const prompt = VERIFY_PROMPT.replace("{task}", taskDesc).replace("{content}", content.slice(0, 4000));

  // N 次投票，取多数（抗温度 0 发散，见实验 A）
  const verdicts = [];
  for (let i = 0; i < nRuns; i++) {
    try {
      const apiUrl = BASE_URL.replace("/anthropic", "");
      const resp = await fetch(`${apiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 256,
          temperature: 0.0,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const body = await resp.json();
      const text = body?.choices?.[0]?.message?.content?.trim() || "<empty>";
      const firstLine = text.split("\n")[0].toUpperCase().trim();

      let v = "UNCLEAR";
      if (firstLine.startsWith("NO")) v = "REJECT";
      else if (firstLine.startsWith("YES")) v = "PASS";
      verdicts.push(v);
    } catch (err) {
      verdicts.push("API_ERROR");
    }
  }

  // 多数票
  const passCnt = verdicts.filter(v => v === "PASS").length;
  const rejectCnt = verdicts.filter(v => v === "REJECT").length;
  const majority = passCnt > rejectCnt ? "PASS" : rejectCnt > passCnt ? "REJECT" : "UNCLEAR";
  const confidence = Math.max(passCnt, rejectCnt) / nRuns;

  return {
    file: filePath,
    verdict: majority,
    confidence: Math.round(passCnt / nRuns * 100),
    votes: verdicts,
    reason: `${majority} (${passCnt}/${nRuns} 票通过)`,
  };
}

// ====== 主函数 ======
async function main() {
  console.log("\n🔍 forge-verify: content-verify — 跨模型语义验证");
  console.log(`  模型: ${MODEL}`);
  console.log(`  任务: ${task.slice(0, 80)}${task.length > 80 ? "..." : ""}`);
  console.log(`  文件: ${files.length > 0 ? files.join(", ") : "(无文件, 跳过)"}`);

  if (files.length === 0) {
    console.log("\n  ⏭️  跳过 — 未指定待检查文件");
    console.log("  提示: 在 .forge/content-verify.json 中配置 files 字段");
    process.exit(0);
  }

  console.log(`  投票: ${runs} 次多数决 (抗温度 0 发散)`);

  const results = [];
  for (const f of files) {
    // 支持绝对路径和相对根目录的路径
    const fullPath = f.startsWith("/") ? f : join(ROOT, f);
    console.log(`\n  📄 ${f}`);
    const r = await verifyFile(fullPath, task, runs);
    results.push(r);

    const icon = r.verdict === "PASS" ? "✅" : r.verdict === "REJECT" ? "❌" : "❓";
    const voteStr = r.votes ? ` (${r.votes.join("/")})` : "";
    console.log(`  ${icon} ${r.verdict}${voteStr}: ${r.reason.slice(0, 120)}`);
  }

  // 汇总
  const passed = results.filter(r => r.verdict === "PASS").length;
  const rejected = results.filter(r => r.verdict === "REJECT").length;
  const errors = results.filter(r => r.verdict !== "PASS" && r.verdict !== "REJECT").length;

  console.log(`\n  ─── 结果 ───`);
  console.log(`  通过: ${passed}  拒绝: ${rejected}  异常: ${errors}`);
  console.log(`  判定: ${rejected === 0 ? "✅ 全部通过" : "❌ 存在未通过的检查"}`);

  process.exit(rejected > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(3);
});
