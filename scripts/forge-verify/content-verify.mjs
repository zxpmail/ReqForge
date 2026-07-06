#!/usr/bin/env node
/**
 * forge-verify content-verify — 四层结构化内容验证
 *
 * 架构（实验 F，见 blog 仓 agent-determinism-illusions）：
 *
 *   Layer 0  形状/存在性 → 确定性代码（正则、长度、关键字黑名单）  零成本
 *   Layer 1  期望匹配   → 文件级合约（minLen, keywords, noKeywords）  零成本
 *   Layer 2  语义充分性 → LLM 瘦 prompt（只处理残差）              有成本
 *   Layer 3  分歧/残差  → 分歧度检测 → 转人工队列                  运维成本
 *
 * 用法：
 *   node scripts/forge-verify/content-verify.mjs [--task "..."] [--files f1,f2] [--runs 3]
 *   node scripts/forge-verify/content-verify.mjs --from-config
 *
 * 配置 .forge/content-verify.json:
 *   {
 *     "task": "任务描述",
 *     "files": ["src/auth.ts"],                    // 待检查文件（必填）
 *     "model": "",                                 // 模型覆盖（选填）
 *     "contracts": {                                // Layer 1 合约（选填）
 *       "src/auth.ts": {
 *         "minLen": 100,                           // 最小字符数
 *         "keywords": ["login", "password"],       // 需含关键词
 *         "noKeywords": ["TODO", "FIXME"]          // 禁止关键词
 *       }
 *     },
 *     "layer3": {                                  // Layer 3 分歧处理（选填）
 *       "divergence_threshold": 0.8,               // 分歧阈值，低于此→UNCLEAR
 *       "uncertain_output": ".forge/verify-uncertain.json"
 *     }
 *   }
 *
 * 实验 F 背景：
 *   分层架构验证（8 场景 + 30 样本）：
 *   - P1 8 场景: LLM 调用节省 50%, 垃圾 100% Layer 0/1 拦截
 *   - P4 30 样本: LLM 调用节省 33%, 垃圾 80% 零成本拦截
 *   详见 blog 仓 agent-determinism-illusions/scripts/forge-verify-layered-prototype.py
 *
 * 退出码：
 *   0 — 全部通过
 *   1 — 存在未通过的检查
 *   2 — 配置缺失
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

// ====== 默认参数 ======
const DEFAULT_DIVERGENCE_THRESHOLD = 0.8;  // 低于此 → UNCLEAR（不做多数决）
const DEFAULT_UNCERTAIN_OUTPUT = ".forge/verify-uncertain.json";
const DEFAULT_RUNS = 3;

// ====== Layer 0 — 确定性形状/存在性检查 ======
// 不依赖配置，对所有文件统一执行
const PLACEHOLDER_KEYWORDS = ["todo", "fixme", "tbd", "xxx", "待填写", "这里填写"];

function layer0Check(content) {
  const c = content.trim();

  // 0a. 空或极短
  if (c.length < 5) {
    return { verdict: "REJECT", layer: "L0", check: "L0_min_length",
             reason: `内容极短 (${c.length} 字符)，无法构成有效输出` };
  }

  // 0b. 纯标点
  const punctRe = /[。，、！？；：\.\,\!\?\;\:\'\"\-\—　、。！，；]/g;
  const punctMatch = c.match(punctRe);
  const punctRatio = punctMatch ? punctMatch.length / c.length : 0;
  if (punctRatio > 0.5) {
    return { verdict: "REJECT", layer: "L0", check: "L0_punctuation_ratio",
             reason: `标点占比 ${(punctRatio * 100).toFixed(0)}%，超过 50% 阈值` };
  }

  // 0c. 占位符关键词（仅短内容时杀）
  const cLower = c.toLowerCase();
  for (const ph of PLACEHOLDER_KEYWORDS) {
    if (cLower.includes(ph) && c.length < 30) {
      return { verdict: "REJECT", layer: "L0", check: "L0_placeholder",
               reason: `包含占位符 "${ph}" 且长度极短 (${c.length} 字符)` };
    }
  }

  // 0d. 零测试用例
  if (/0\s+passed/.test(cLower) && /no\s+tests?\s+collected/.test(cLower)) {
    return { verdict: "REJECT", layer: "L0", check: "L0_zero_tests",
             reason: "测试结果: 0 passed, no tests collected — 零用例通过" };
  }

  return { verdict: "PASS", layer: "L0", check: "L0_pass", reason: "" };
}

// ====== Layer 1 — 文件级合约匹配 ======
// 从 content-verify.json 的 contracts 字段读取
function layer1Check(content, fileContract) {
  if (!fileContract || Object.keys(fileContract).length === 0) {
    return { verdict: "PASS", layer: "L1", check: "L1_no_contract", reason: "" };
  }

  const c = content.trim();
  const failures = [];

  // 1a. 最小长度
  if (fileContract.minLen != null && c.length < fileContract.minLen) {
    failures.push(`长度不足: ${c.length} < ${fileContract.minLen}`);
  }

  // 1b. 需含关键词（至少匹配 1/3）
  if (fileContract.keywords && fileContract.keywords.length > 0) {
    const kws = Array.isArray(fileContract.keywords) ? fileContract.keywords : [fileContract.keywords];
    const matched = kws.filter(kw => c.toLowerCase().includes(kw.toLowerCase()));
    const required = Math.max(1, Math.ceil(kws.length / 3));
    if (matched.length < required) {
      failures.push(`关键词不足: 命中 ${matched.length}/${kws.length} (${matched.join(", ") || "无"})，需 ≥${required}`);
    }
  }

  // 1c. 禁止关键词
  if (fileContract.noKeywords && fileContract.noKeywords.length > 0) {
    const nkws = Array.isArray(fileContract.noKeywords) ? fileContract.noKeywords : [fileContract.noKeywords];
    const hits = nkws.filter(kw => c.toLowerCase().includes(kw.toLowerCase()));
    if (hits.length > 0) {
      failures.push(`含禁用关键词: ${hits.join(", ")}`);
    }
  }

  if (failures.length === 0) {
    return { verdict: "PASS", layer: "L1", check: "L1_pass", reason: "" };
  }

  // ≥2 项失败 → REJECT；1 项 → UNCLEAR（交 Layer 2 语义判断）
  if (failures.length >= 2) {
    return { verdict: "REJECT", layer: "L1", check: "L1_reject", reason: failures.join("; ") };
  }

  return { verdict: "UNCLEAR", layer: "L1", check: "L1_unclear", reason: failures.join("; ") };
}

// ====== Layer 2 — 瘦 LLM 语义审查 ======
const LAYER2_PROMPT = `You are a quality inspector.

The output below has already passed basic format checks:
- Not empty, not pure punctuation, not a placeholder keyword
- Meets minimum length and keyword expectations
- Passes blacklist checks

Your job is ONLY to judge the SEMANTIC dimension:
Does this output substantively satisfy the CORE requirements of the task?

DO NOT reject for missing keywords, short length, or formatting issues.
Only reject if the output fundamentally misses the INTENT or is semantically insufficient.

TASK: {task}

OUTPUT:
\`\`\`
{content}
\`\`\`

Respond in JSON only:
{"pass": true/false, "reason": "one sentence on semantic sufficiency"}`;

async function layer2Check(content, task, model, nRuns, apiConfig) {
  const { baseUrl, token } = apiConfig;
  const prompt = LAYER2_PROMPT.replace("{task}", task).replace("{content}", content.slice(0, 4000));

  const verdicts = [];
  const reasons = [];

  for (let i = 0; i < nRuns; i++) {
    try {
      const resp = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 256,
          temperature: 0.0,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const body = await resp.json();
      const text = (body?.choices?.[0]?.message?.content || "").trim();

      // Try JSON parse first
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Fallback: strip markdown and retry
        const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          verdicts.push("API_PARSE_ERROR");
          reasons.push(`JSON parse failed: ${text.slice(0, 80)}`);
          continue;
        }
      }

      if (parsed.pass === true) {
        verdicts.push("PASS");
      } else if (parsed.pass === false) {
        verdicts.push("REJECT");
      } else {
        verdicts.push("UNCLEAR");
      }
      reasons.push(typeof parsed.reason === "string" ? parsed.reason : "");
    } catch (err) {
      verdicts.push("API_ERROR");
      reasons.push(`API call failed: ${err.message?.slice(0, 60)}`);
    }
  }

  return { verdicts, reasons };
}

// ====== Layer 3 — 分歧检测与转人工 ======
function layer3Check(verdicts, divergenceThreshold) {
  const n = verdicts.length;
  if (n === 0) return { verdict: "UNCLEAR", layer: "L3", check: "L3_no_data",
                        reason: "无有效投票数据" };

  const passCnt = verdicts.filter(v => v === "PASS").length;
  const rejectCnt = verdicts.filter(v => v === "REJECT").length;
  const maxFrac = Math.max(passCnt, rejectCnt) / n;

  // 分歧度高于阈值 → 不做多数决，转 Layer 3
  if (maxFrac < divergenceThreshold) {
    return { verdict: "UNCLEAR", layer: "L3", check: "L3_divergence",
             reason: `分歧: ${passCnt}PASS/${rejectCnt}REJ (maxFrac=${(maxFrac * 100).toFixed(0)}% < ${(divergenceThreshold * 100).toFixed(0)}% 阈值)` };
  }

  const finalVerdict = passCnt > rejectCnt ? "PASS" : "REJECT";
  return { verdict: finalVerdict, layer: "L3", check: "L3_majority",
           reason: `${finalVerdict} (${Math.max(passCnt, rejectCnt)}/${n} 票)` };
}

// ====== 完整管道 ======
async function layeredVerify(filePath, task, model, nRuns, divergenceThreshold, fileContract, apiConfig) {
  // 读取文件
  let content;
  try {
    content = readFileSync(filePath, "utf-8").trim();
  } catch {
    return { file: filePath, verdict: "FILE_NOT_FOUND", layer: "L0", check: "L0_file_missing",
             reason: "文件不存在或无法读取", stages: [] };
  }

  const stages = [];

  // Layer 0 — 形状/存在性
  const l0 = layer0Check(content);
  stages.push({ layer: "L0", verdict: l0.verdict, check: l0.check, reason: l0.reason });
  if (l0.verdict === "REJECT") {
    return { file: filePath, verdict: "REJECT", layer: "L0", check: l0.check,
             reason: l0.reason, stages };
  }

  // Layer 1 — 合约匹配
  const l1 = layer1Check(content, fileContract || null);
  stages.push({ layer: "L1", verdict: l1.verdict, check: l1.check, reason: l1.reason });
  if (l1.verdict === "REJECT") {
    return { file: filePath, verdict: "REJECT", layer: "L1", check: l1.check,
             reason: l1.reason, stages };
  }

  // Layer 2 — LLM 语义审查
  const l2 = await layer2Check(content, task, model, nRuns, apiConfig);
  const passCnt = l2.verdicts.filter(v => v === "PASS").length;
  const rejectCnt = l2.verdicts.filter(v => v === "REJECT").length;
  stages.push({
    layer: "L2",
    verdicts: l2.verdicts,
    passCnt,
    rejectCnt,
    nRuns: l2.verdicts.length,
    reasons: l2.reasons,
  });

  // Layer 3 — 分歧检测
  const l3 = layer3Check(l2.verdicts, divergenceThreshold);
  stages.push({ layer: "L3", verdict: l3.verdict, check: l3.check, reason: l3.reason });

  return {
    file: filePath,
    verdict: l3.verdict,
    layer: l3.layer,
    check: l3.check,
    reason: l3.reason,
    confidence: Math.round(Math.max(passCnt, rejectCnt) / l2.verdicts.length * 100),
    votes: l2.verdicts,
    stages,
  };
}

// ====== 配置解析 ======
function parseConfig() {
  const args = process.argv.slice(2);
  const taskIdx = args.indexOf("--task");
  const filesIdx = args.indexOf("--files");
  const fromConfig = args.includes("--from-config");
  const runsIdx = args.indexOf("--runs");

  let task = "";
  let files = [];
  let model = "";
  let runs = DEFAULT_RUNS;
  let contracts = {};
  let divergenceThreshold = DEFAULT_DIVERGENCE_THRESHOLD;
  let uncertainOutput = DEFAULT_UNCERTAIN_OUTPUT;

  if (fromConfig) {
    const cfgPath = join(ROOT, ".forge", "content-verify.json");
    if (!existsSync(cfgPath)) {
      console.error("❌ --from-config 但 .forge/content-verify.json 不存在");
      process.exit(2);
    }
    const cfg = JSON.parse(readFileSync(cfgPath, "utf-8"));
    task = cfg.task || "";
    files = cfg.files || [];
    model = cfg.model || "";
    contracts = cfg.contracts || {};
    if (cfg.layer3) {
      if (cfg.layer3.divergence_threshold != null) divergenceThreshold = cfg.layer3.divergence_threshold;
      if (cfg.layer3.uncertain_output) uncertainOutput = cfg.layer3.uncertain_output;
    }
  } else {
    // 自动检测配置文件（向后兼容）
    const cfgPath = join(ROOT, ".forge", "content-verify.json");
    if (existsSync(cfgPath)) {
      const cfg = JSON.parse(readFileSync(cfgPath, "utf-8"));
      task = cfg.task || "";
      files = cfg.files || [];
      model = cfg.model || "";
      contracts = cfg.contracts || {};
      if (cfg.layer3) {
        if (cfg.layer3.divergence_threshold != null) divergenceThreshold = cfg.layer3.divergence_threshold;
        if (cfg.layer3.uncertain_output) uncertainOutput = cfg.layer3.uncertain_output;
      }
    }

    // CLI 覆盖
    if (taskIdx >= 0 && taskIdx + 1 < args.length) task = args[taskIdx + 1];
    if (filesIdx >= 0 && filesIdx + 1 < args.length) {
      files = args[filesIdx + 1].split(",").map(f => f.trim());
    }
    if (runsIdx >= 0 && runsIdx + 1 < args.length) {
      runs = parseInt(args[runsIdx + 1], 10) || DEFAULT_RUNS;
    }
  }

  // 环境变量后备
  if (!task) task = process.env.VERIFY_TASK || "";
  if (files.length === 0) {
    files = (process.env.VERIFY_FILES || "").split(",").map(f => f.trim()).filter(f => f);
  }

  // API 配置
  // 注意：DeepSeek Anthropic 兼容端地址是 https://api.deepseek.com/anthropic
  // 打开 AI 兼容端需要剥离 /anthropic 后缀
  const rawUrl = process.env.ANTHROPIC_BASE_URL || "https://api.deepseek.com";
  const baseUrl = rawUrl.replace(/\/anthropic\/?$/i, "");
  const token = process.env.ANTHROPIC_AUTH_TOKEN || "";
  const effectiveModel = model || process.env.ANTHROPIC_MODEL || "deepseek-v4-flash";

  // 确保 files 是绝对路径
  const resolvedFiles = files.map(f => (f.startsWith("/") ? join(ROOT, f.replace(/^\//, "")) : join(ROOT, f)));

  return { task, files: resolvedFiles, rawFiles: files, model: effectiveModel, runs,
           divergenceThreshold, uncertainOutput, contracts, apiConfig: { baseUrl, token } };
}

// ====== 主函数 ======
async function main() {
  const cfg = parseConfig();

  if (!cfg.apiConfig.token) {
    console.error("❌ 缺少 ANTHROPIC_AUTH_TOKEN（环境变量）");
    process.exit(2);
  }
  if (!cfg.task) {
    console.error("❌ 缺少任务描述（--task 或 VERIFY_TASK 或 .forge/content-verify.json）");
    process.exit(2);
  }

  console.log(`\n🔍 forge-verify: content-verify — 四层结构化验证`);
  console.log(`  模型: ${cfg.model}`);
  console.log(`  任务: ${cfg.task.slice(0, 80)}${cfg.task.length > 80 ? "..." : ""}`);
  console.log(`  文件: ${cfg.rawFiles.length > 0 ? cfg.rawFiles.join(", ") : "(无)"}`);
  console.log(`  投票: ${cfg.runs} 次 | 分歧阈值: ${cfg.divergenceThreshold}`);
  console.log(`  ─管道─`);
  console.log(`    L0 形状检查    (空/标点/占位符/零用例) — 零成本`);
  console.log(`    L1 合约匹配    (minLen/keywords/blacklist) — 零成本`);
  console.log(`    L2 LLM 语义    (瘦prompt, 只问残差)`);
  console.log(`    L3 分歧检测    (maxFrac < ${cfg.divergenceThreshold} → UNCLEAR 转人工)`);
  console.log(`  ──────`);

  if (cfg.files.length === 0) {
    console.log("\n  ⏭️  跳过 — 未指定待检查文件");
    console.log("  提示: 在 .forge/content-verify.json 中配置 files 字段");
    process.exit(0);
  }

  const uncertainResults = [];
  const results = [];

  for (const [idx, fullPath] of cfg.files.entries()) {
    const relativePath = cfg.rawFiles[idx] || fullPath;
    const fileContract = cfg.contracts[cfg.rawFiles[idx]] || cfg.contracts[fullPath] || null;

    console.log(`\n  📄 ${relativePath}`);

    const r = await layeredVerify(fullPath, cfg.task, cfg.model, cfg.runs,
                                  cfg.divergenceThreshold, fileContract, cfg.apiConfig);
    results.push(r);

    // 输出
    const icons = { PASS: "✅", REJECT: "❌", UNCLEAR: "❓", FILE_NOT_FOUND: "⚠️" };
    const icon = icons[r.verdict] || "❓";

    console.log(`  ${icon} ${r.verdict} @ ${r.layer || "?"}: ${(r.reason || "").slice(0, 120)}`);

    if (r.stages) {
      for (const s of r.stages) {
        if (s.verdict === "PASS" || s.check?.startsWith("L0_pass") || s.check?.startsWith("L1_pass") || s.check?.startsWith("L1_no_contract")) continue;
        if (s.verdicts) {
          // L2 阶段
          const vStr = s.verdicts.join("/");
          console.log(`    └ L2: [${vStr}] PASS=${s.passCnt} REJ=${s.rejectCnt}`);
        } else {
          console.log(`    └ ${s.layer}: ${s.verdict} — ${(s.reason || "").slice(0, 80)}`);
        }
      }
    }

    if (r.verdict === "UNCLEAR") {
      uncertainResults.push({
        file: relativePath,
        verdict: r.verdict,
        confidence: r.confidence,
        votes: r.votes,
        reason: r.reason,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 汇总
  const passed = results.filter(r => r.verdict === "PASS").length;
  const rejected = results.filter(r => r.verdict === "REJECT").length;
  const uncertain = results.filter(r => r.verdict === "UNCLEAR" || r.verdict === "FILE_NOT_FOUND").length;

  console.log(`\n  ─── 结果 ───`);
  console.log(`  通过: ${passed}  拒绝: ${rejected}  不确定: ${uncertain}`);
  console.log(`  分层节省: L0+L1 拦截 = ${results.filter(r => r.layer === "L0" || r.layer === "L1").length} 文件免于 LLM 调用`);

  // 输出 UNCLEAR 报告
  if (uncertainResults.length > 0) {
    const outputPath = join(ROOT, cfg.uncertainOutput);
    writeFileSync(outputPath, JSON.stringify(uncertainResults, null, 2), "utf-8");
    console.log(`  不确定结果已写入 ${cfg.uncertainOutput}（${uncertainResults.length} 条）`);
  }

  const hasErrors = rejected > 0 || uncertain > 0;
  console.log(`  判定: ${hasErrors ? "❌ 存在未通过的检查" : "✅ 全部通过"}`);

  process.exit(rejected > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(3);
});
