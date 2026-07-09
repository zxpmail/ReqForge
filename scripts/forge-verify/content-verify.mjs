#!/usr/bin/env node
/**
 * forge-verify content-verify — 结构化内容验证管道
 *
 * 架构（实验 F + 通道对比 + 合约验证，见 blog 仓 agent-determinism-illusions）：
 *
 *   ┌─ 基础管道（所有文件）──────────────┐
 *   │  Layer 0  形状/存在性 （确定性）    │  零成本
 *   │  Layer 0e Re-Stat   （确定性）      │  零成本
 *   │  Layer 1  文件级合约 （确定性）      │  零成本
 *   └────────────────────────────────────┘
 *
 *   ┌─ 证据门管道（配置 evidence_gates 时）┐
 *   │  Evidence Gate - 证据存在检查（确定性）│  零成本
 *   │  Contract Regex  - 逐需求正则（确定性）│  零成本
 *   │  Per-Requirement LLM - 逐需求 LLM    │  有成本
 *   ├─ 后备管道（无 evidence_gates 时）─────┤
 *   │  Layer 2  LLM 语义 （自由文本）       │  有成本
 *   └──────────────────────────────────────┘
 *
 *   Layer 3  分歧检测（所有路径共享）        │  运维成本
 *
 * 每个阶段输出增加 failure_class 字段，映射到 feedback-observer 分类：
 *   execution-lapse — verifier 拒绝输出（内容不足、空、桩）
 *   skill-defect    — verifier 发现合约/证据不匹配（skill 未覆盖）
 *   unset           — 语义判据分歧（API 错误/LLM 不确定/无法归类）
 *
 * 每个阶段增加 evidence 字段追踪判据来源（chain-of-evidence）：
 *   - L0/L0e/L1: "file:<relative-path>"（inline 内容）
 *   - EG/C1/C2:   "evidence:<evidence-file>"（外部证据文件 + 修改时间）
 *   trace 数组在输出中完整保留，支持后续 STALE 检测
 *
 * 实验结论（2026-07-09）：
 *   - 自由文本 LLM（C0）检测率 20%：被 agent 话术说服
 *   - 合约正则（C1）  检测率 80%：数值约束近零误报，但存在"否定盲区"
 *   - 逐需求 LLM（C2）检测率 100%：唯一补 DPI 缺口的机制
 *   详见 blog 仓 channel-comparison-experiment.md + channel-comparison-experiment-phase2.md
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
 *         "minLen": 100,
 *         "keywords": ["login", "password"],
 *         "noKeywords": ["TODO", "FIXME"]
 *       }
 *     },
 *     "evidence_gates": {                          // 证据门管道（选填，推荐）
 *       "evidence_dir": ".skillgate/evidence",     // 证据文件目录
 *       "requirements": [
 *         {
 *           "id": "REQ-1",
 *           "desc": "IP 级别限流",
 *           "evidence_file": "test-output.txt",
 *           "pattern": "(?i)(RateLimiter.*IP|isRateLimited.*IP)",  // C1 正则
 *           "type": "regex"                        // 或 "llm"
 *         }
 *       ]
 *     },
 *     "layer3": {
 *       "divergence_threshold": 0.8,
 *       "uncertain_output": ".forge/verify-uncertain.json"
 *     }
 *   }
 *
 * 退出码：
 *   0 — 全部通过
 *   1 — 存在未通过的检查
 *   2 — 配置缺失
 */

import { readFileSync, writeFileSync, existsSync, statSync } from "fs";
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
             failure_class: "execution-lapse",
             reason: `内容极短 (${c.length} 字符)，无法构成有效输出` };
  }

  // 0b. 纯标点
  const punctRe = /[。，、！？；：\.\,\!\?\;\:\'\"\-\—　、。！，；]/g;
  const punctMatch = c.match(punctRe);
  const punctRatio = punctMatch ? punctMatch.length / c.length : 0;
  if (punctRatio > 0.5) {
    return { verdict: "REJECT", layer: "L0", check: "L0_punctuation_ratio",
             failure_class: "execution-lapse",
             reason: `标点占比 ${(punctRatio * 100).toFixed(0)}%，超过 50% 阈值` };
  }

  // 0c. 占位符关键词（仅短内容时杀）
  const cLower = c.toLowerCase();
  for (const ph of PLACEHOLDER_KEYWORDS) {
    if (cLower.includes(ph) && c.length < 30) {
      return { verdict: "REJECT", layer: "L0", check: "L0_placeholder",
               failure_class: "execution-lapse",
               reason: `包含占位符 "${ph}" 且长度极短 (${c.length} 字符)` };
    }
  }

  // 0d. 零测试用例
  if (/0\s+passed/.test(cLower) && /no\s+tests?\s+collected/.test(cLower)) {
    return { verdict: "REJECT", layer: "L0", check: "L0_zero_tests",
             failure_class: "execution-lapse",
             reason: "测试结果: 0 passed, no tests collected — 零用例通过" };
  }

  return { verdict: "PASS", layer: "L0", check: "L0_pass", reason: "" };
}

// ====== Layer 0e — Re-Stat 检查（nexus-lab-zen 设计） ======
// 检测 Agent 输出是否只是"复述任务"而非实际执行结果。
// 设计原则：zero-verified = RED。没有断言 = 没有验证 = 必须拒绝。
//
// 识别三类模式：
//   1. 未来/承诺时态密集 → 描述"将要做什么"而非"已经做了什么"
//   2. 桩/骨架 → 函数体为空、仅 TODO、或 throw-unimplemented
//   3. 元评论密集 → 描述性注释远多于实际实现代码
//
// 输出只包含"请查收/已修改"等社交表态而无实质内容 → REJECT
const RESTAT_FUTURE_MODALS = [
  "will", "shall", "would", "could", "should", "need to", "going to",
  "打算", "将会", "应该", "需要", "预计",
];
const RESTAT_META_VERBS = [
  "this function", "this method", "this class", "this module", "this file",
  "this code", "this script", "this program", "this component", "this section",
  "该函数", "该方法", "该类", "该模块", "该文件", "该代码",
];
const RESTAT_STUB_BODIES = [
  /throw\s+new\s+Error\s*\(\s*["'](?:not\s+implemented|unimplemented|未实现)/i,
  /\bpass\s*(?:#|\/\/|$)/m,                   // Python pass
  /\{\s*\/\/\s+TODO/i,                          // TS/JS { // TODO
  /\{\s*\n\s*\/\/\s+TODO/i,                      // { on L1, // TODO on L2
  /\{\s*\/\*\s+TODO\s+\*\/\s*\}/i,              // { /* TODO */ }
  /\.\.\.\s*,?\s*$/,                            // spread placeholder
];
const RESTAT_SOCIAL_PATTERNS = [
  /please\s+review/i, /^done$/mi, /^fixed$/mi,
  /(?:请查收|已完成|已修改|已处理)/,
];

function layer0RestatCheck(content, filename) {
  const c = content.trim();
  const lines = c.split("\n");
  const totalLines = lines.length;
  const isCode = /\.(ts|js|mjs|py|java|go|rs|c|h|tsx|jsx|kt|swift)$/i.test(filename || "");
  const reasons = [];

  // 社交表态检查：不依赖行数，对所有文件执行
  for (const pat of RESTAT_SOCIAL_PATTERNS) {
    if (pat.test(c.slice(0, 200))) {
      reasons.push(`含社交表态 ("${c.trim().slice(0, 40).replace(/\n/, " ")}")，无实质执行结果`);
      break;
    }
  }

  // 代码特定检查需要≥3 行；短文件跳过代码类指标
  if (totalLines < 3) {
    if (reasons.length > 0) {
      return { verdict: "UNCLEAR", layer: "L0e", check: "L0e_re_stat_social_unclear",
               failure_class: "unset",
               reason: reasons[0] };
    }
    return { verdict: "PASS", layer: "L0e", check: "L0e_re_stat_pass", reason: "" };
  }

  // ─── 1. 未来/承诺时态密度 ───
  const words = c.split(/\s+/);
  const totalWords = words.length;
  const cLower = c.toLowerCase();
  let futureCount = 0;
  for (const modal of RESTAT_FUTURE_MODALS) {
    const esc = modal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("\\b" + esc + "\\b", "gi");
    const matches = cLower.match(re);
    if (matches) futureCount += matches.length;
  }
  // "TODO"/"FIXME" 密度也计为未来承诺信号（表示"将要做"而非"已做完"）
  const todoMatches = cLower.match(/\btodo\b/g);
  if (todoMatches) futureCount += todoMatches.length;
  const futureRatio = totalWords > 0 ? futureCount / totalWords : 0;
  if (futureRatio > 0.06) {
    reasons.push(`未来/承诺时态词占 ${(futureRatio * 100).toFixed(1)}% (${futureCount}/${totalWords})`);
  }

  // ─── 2. 元评论密度（code only） ───
  if (isCode && totalLines > 5) {
    const commentLines = lines.filter(l => {
      const t = l.trim();
      return t.startsWith("//") || t.startsWith("#") || t.startsWith("/*") ||
             t.startsWith("*") || t.startsWith("/**") || t.startsWith("<!--") ||
             /^\s*\/\*/.test(t) || /^\s*\*/.test(t);
    }).length;
    const commentRatio = commentLines / totalLines;
    if (commentRatio > 0.65) {
      reasons.push(`注释行占 ${(commentRatio * 100).toFixed(0)}% (${commentLines}/${totalLines} 行)，实现极少`);
    }

    let metaCount = 0;
    for (const mv of RESTAT_META_VERBS) {
      const esc = mv.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(esc, "gi");
      const matches = cLower.match(re);
      if (matches) metaCount += matches.length;
    }
    if (metaCount > 3) {
      reasons.push(`元描述词 ${metaCount} 次 ("this function/该类")，疑似描述而非实现`);
    }
  }

  // ─── 4. 桩/骨架检测（code only） ───
  if (isCode && totalLines > 5) {
    let stubCount = 0;
    for (const pattern of RESTAT_STUB_BODIES) {
      if (pattern.test(c)) stubCount++;
    }
    const emptyBodyMatches = c.match(/\{\s*\}/g);
    stubCount += emptyBodyMatches ? emptyBodyMatches.length : 0;

    if (stubCount >= 2) {
      reasons.push(`检测到 ${stubCount} 处桩代码（空函数体/throw-unimplemented/pass/TODO）`);
    }
  }

  if (reasons.length === 0) {
    return { verdict: "PASS", layer: "L0e", check: "L0e_re_stat_pass", reason: "" };
  }

  // 桩代码 ≥3 时直接 REJECT（single-reason hard reject）
  const stubReason = reasons.find(r => r.includes("桩代码"));
  if (stubReason) {
    const stubMatch = stubReason.match(/\d+/);
    const stubCount = stubMatch ? parseInt(stubMatch[0], 10) : 0;
    if (stubCount >= 3) {
      return { verdict: "REJECT", layer: "L0e", check: "L0e_re_stat_stub_reject",
               failure_class: "execution-lapse",
               reason: stubReason };
    }
  }

  // ≥2 项指标 → REJECT；仅 1 项 → UNCLEAR（交 Layer 2 语义判断）
  if (reasons.length >= 2) {
    return { verdict: "REJECT", layer: "L0e", check: "L0e_re_stat_reject",
             failure_class: "execution-lapse",
             reason: reasons.join("; ") };
  }
  return { verdict: "UNCLEAR", layer: "L0e", check: "L0e_re_stat_unclear",
           failure_class: "unset",
           reason: reasons[0] };
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
    return { verdict: "REJECT", layer: "L1", check: "L1_reject",
             failure_class: "skill-defect",
             reason: failures.join("; ") };
  }

  return { verdict: "UNCLEAR", layer: "L1", check: "L1_unclear",
           failure_class: "unset",
           reason: failures.join("; ") };
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
                        failure_class: "unset",
                        reason: "无有效投票数据" };

  const passCnt = verdicts.filter(v => v === "PASS").length;
  const rejectCnt = verdicts.filter(v => v === "REJECT").length;
  const maxFrac = Math.max(passCnt, rejectCnt) / n;

  // 分歧度高于阈值 → 不做多数决，转 Layer 3
  if (maxFrac < divergenceThreshold) {
    return { verdict: "UNCLEAR", layer: "L3", check: "L3_divergence",
             failure_class: "unset",
             reason: `分歧: ${passCnt}PASS/${rejectCnt}REJ (maxFrac=${(maxFrac * 100).toFixed(0)}% < ${(divergenceThreshold * 100).toFixed(0)}% 阈值)` };
  }

  const finalVerdict = passCnt > rejectCnt ? "PASS" : "REJECT";
  return { verdict: finalVerdict, layer: "L3", check: "L3_majority",
           failure_class: "unset",
           reason: `${finalVerdict} (${Math.max(passCnt, rejectCnt)}/${n} 票)` };
}

// ====== Evidence Gate — 证据文件存在性检查 ======
// 纯函数：同一文件系统状态 → 同一结论。无模型，零成本。
// 对应实验 Phase 1 Channel B：文件存在且非空 → PASS
function evidenceGateCheck(evidenceDir, requirements) {
  if (!requirements || requirements.length === 0) {
    return { verdict: "PASS", layer: "EvidenceGate", check: "EG_no_reqs", reason: "" };
  }

  const missing = [];
  const empty = [];

  for (const req of requirements) {
    const filePath = join(evidenceDir, req.evidence_file);
    try {
      const stat = existsSync(filePath) ? null : "missing";
      if (stat === "missing") {
        missing.push(`${req.id}: ${req.evidence_file}`);
        continue;
      }
      const size = readFileSync(filePath).length;
      if (size === 0) {
        empty.push(`${req.id}: ${req.evidence_file}`);
      }
    } catch {
      missing.push(`${req.id}: ${req.evidence_file}`);
    }
  }

  if (missing.length > 0 && empty.length > 0) {
    return { verdict: "REJECT", layer: "EvidenceGate", check: "EG_missing_and_empty",
             failure_class: "execution-lapse",
             reason: `缺失: ${missing.join(", ")}; 空: ${empty.join(", ")}` };
  }
  if (missing.length > 0) {
    return { verdict: "REJECT", layer: "EvidenceGate", check: "EG_missing",
             failure_class: "execution-lapse",
             reason: `证据文件缺失: ${missing.join(", ")}` };
  }
  if (empty.length > 0) {
    return { verdict: "REJECT", layer: "EvidenceGate", check: "EG_empty",
             failure_class: "execution-lapse",
             reason: `证据文件为空: ${empty.join(", ")}` };
  }

  return { verdict: "PASS", layer: "EvidenceGate", check: "EG_pass",
           reason: `${requirements.length} 个证据文件全部存在且非空` };
}

// ====== C1 — 合约正则检查 ======
// 对每个需求读对应证据文件内容，regex 匹配。无模型，零成本。
// 对应实验 Phase 2 C1：逐需求正则匹配
function contractRegexCheck(evidenceDir, requirements) {
  if (!requirements || requirements.length === 0) {
    return { verdict: "PASS", layer: "C1", check: "C1_no_reqs", reason: "" };
  }

  // 只检查 type=regex 的需求
  const regexReqs = requirements.filter(r => r.type === "regex" && r.pattern);
  if (regexReqs.length === 0) {
    return { verdict: "PASS", layer: "C1", check: "C1_no_regex_reqs", reason: "" };
  }

  // 将 PCRE 风格 (?i) 转换为 JS RegExp flags
  function toJsRegex(pattern) {
    let flags = "";
    let p = pattern;
    while (/^\(\?([ims]+)\)/.test(p)) {
      const m = p.match(/^\(\?([ims]+)\)/);
      flags += m[1];
      p = p.slice(m[0].length);
    }
    // 去重、排序
    flags = [...new Set(flags.split(""))].sort().join("");
    return { pattern: p, flags };
  }

  const failures = [];
  const passes = [];

  for (const req of regexReqs) {
    const filePath = join(evidenceDir, req.evidence_file);
    let content;
    try {
      content = readFileSync(filePath, "utf-8");
    } catch {
      failures.push(`${req.id}: 证据文件 ${req.evidence_file} 不可读`);
      continue;
    }

    try {
      const { pattern, flags } = toJsRegex(req.pattern);
      const re = new RegExp(pattern, flags);
      if (re.test(content)) {
        passes.push(req.id);
      } else {
        failures.push(`${req.id}: 模式 /${pattern}/ 在 ${req.evidence_file} 中未匹配`);
      }
    } catch (e) {
      failures.push(`${req.id}: 正则错误 ${e.message}`);
    }
  }

  if (failures.length === 0) {
    return { verdict: "PASS", layer: "C1", check: "C1_pass",
             reason: `${passes.length}/${regexReqs.length} 合约正则通过` };
  }

  // 全部失败 → REJECT；部分失败 → UNCLEAR（传 C2）
  if (failures.length === regexReqs.length) {
    return { verdict: "REJECT", layer: "C1", check: "C1_all_fail",
             failure_class: "skill-defect",
             reason: `全部 ${regexReqs.length} 条合约正则未通过: ${failures.join("; ")}` };
  }

  return { verdict: "UNCLEAR", layer: "C1", check: "C1_partial",
           failure_class: "unset",
           reason: `${passes.length}/${regexReqs.length} 通过; 未通过: ${failures.join("; ")}` };
}

// ====== C2 — 逐需求 LLM 检查 ======
// 对每个需求逐条调用 LLM，判断证据内容是否满足该需求。
// 对应实验 Phase 2 C2：逐条判断防止被整体叙述说服
const C2_PROMPT = `You are a QA inspector checking ONE specific requirement.

Requirement: {req_desc}

Evidence file ({evidence_file}):
\`\`\`
{content}
\`\`\`

Does this evidence PROVE that the requirement is met? Do not accept claims like
"all tests passed" without specific test names. Look for concrete evidence.

Respond in JSON only:
{"pass": true/false, "reason": "one sentence"}`;

async function perRequirementLlmCheck(evidenceDir, requirements, model, nRuns, apiConfig) {
  if (!requirements || requirements.length === 0) {
    return { verdict: "PASS", layer: "C2", check: "C2_no_reqs", reason: "" };
  }

  // 只检查 type=llm 的需求（以及 regex 未覆盖的需求可选）
  const llmReqs = requirements.filter(r => r.type === "llm");
  if (llmReqs.length === 0) {
    return { verdict: "PASS", layer: "C2", check: "C2_no_llm_reqs", reason: "" };
  }

  const { baseUrl, token } = apiConfig;
  const results = [];

  for (const req of llmReqs) {
    const filePath = join(evidenceDir, req.evidence_file);
    let content;
    try {
      content = readFileSync(filePath, "utf-8").trim().slice(0, 2000);
    } catch {
      results.push({ req_id: req.id, pass: false, reason: "evidence file missing or unreadable" });
      continue;
    }

    if (content.length === 0) {
      results.push({ req_id: req.id, pass: false, reason: "evidence file empty" });
      continue;
    }

    const prompt = C2_PROMPT
      .replace("{req_desc}", req.desc)
      .replace("{evidence_file}", req.evidence_file)
      .replace("{content}", content);

    // N 次投票
    const votes = [];
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
            max_tokens: 128,
            temperature: 0.0,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const body = await resp.json();
        const text = (body?.choices?.[0]?.message?.content || "").trim();

        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          try { parsed = JSON.parse(cleaned); } catch { votes.push(false); continue; }
        }
        votes.push(parsed.pass === true);
      } catch {
        votes.push(false);
      }
    }

    const passCount = votes.filter(Boolean).length;
    const pass = passCount > nRuns / 2;
    results.push({
      req_id: req.id,
      pass,
      pass_count: passCount,
      nRuns,
      reason: pass ? "majority passes" : `majority rejects (${passCount}/${nRuns})`,
    });
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;

  if (failed === 0) {
    return { verdict: "PASS", layer: "C2", check: "C2_pass",
             reason: `全部 ${results.length} 条需求通过 LLM 判断` };
  }
  if (passed === 0) {
    return { verdict: "REJECT", layer: "C2", check: "C2_all_fail",
             failure_class: "execution-lapse",
             reason: `全部 ${results.length} 条需求未通过: ${results.filter(r => !r.pass).map(r => r.req_id).join(", ")}` };
  }
  return { verdict: "UNCLEAR", layer: "C2", check: "C2_partial",
           failure_class: "unset",
           reason: `${passed}/${results.length} 通过; 未通过: ${results.filter(r => !r.pass).map(r => r.req_id).join(", ")}` };
}

// ====== 完整管道 ======
async function layeredVerify(filePath, task, model, nRuns, divergenceThreshold, fileContract, apiConfig, evidenceGates) {
  // 读取文件
  let content;
  try {
    content = readFileSync(filePath, "utf-8").trim();
  } catch {
    return { file: filePath, verdict: "FILE_NOT_FOUND", layer: "L0", check: "L0_file_missing",
             failure_class: "execution-lapse",
             reason: "文件不存在或无法读取", stages: [], trace: { chain: [] } };
  }

  const filename = filePath.split(/[/\\]/).pop();  // 提取文件名用于 re-stat 检查
  const stages = [];
  const trace = [];  // chain-of-evidence

  // 获取证据文件 mtime（用于 trace staleness 检测）
  function evidenceFileMeta(filePath) {
    try {
      const s = statSync(filePath);
      return { path: filePath, size: s.size, mtime: s.mtimeMs };
    } catch {
      return { path: filePath, size: 0, mtime: 0 };
    }
  }

  // 相对路径用于 trace（优先 ROOT 相对路径）
  function relPath(absPath) {
    if (absPath && absPath.startsWith(ROOT)) return absPath.slice(ROOT.length + 1).replace(/\\/g, "/");
    return absPath || "unknown";
  }

  const fileEvidence = `file:${relPath(filePath)}`;

  // Layer 0 — 形状/存在性
  const l0 = layer0Check(content);
  stages.push({ layer: "L0", verdict: l0.verdict, check: l0.check, reason: l0.reason,
                failure_class: l0.failure_class || null,
                evidence: fileEvidence });
  if (l0.verdict === "REJECT") {
    return { file: filePath, verdict: "REJECT", layer: "L0", check: l0.check,
             failure_class: l0.failure_class,
             reason: l0.reason, stages, trace };
  }

  // Layer 0e — Re-Stat 检查（nexus-lab-zen: zero-verified = RED）
  const l0e = layer0RestatCheck(content, filename);
  stages.push({ layer: "L0e", verdict: l0e.verdict, check: l0e.check, reason: l0e.reason,
                failure_class: l0e.failure_class || null,
                evidence: fileEvidence });
  if (l0e.verdict === "REJECT") {
    return { file: filePath, verdict: "REJECT", layer: "L0e", check: l0e.check,
             failure_class: l0e.failure_class,
             reason: l0e.reason, stages, trace };
  }
  // UNCLEAR 传下去（Layer 1/2 可能挽回）

  // Layer 1 — 合约匹配
  const l1 = layer1Check(content, fileContract || null);
  stages.push({ layer: "L1", verdict: l1.verdict, check: l1.check, reason: l1.reason,
                failure_class: l1.failure_class || null,
                evidence: fileEvidence });
  if (l1.verdict === "REJECT") {
    return { file: filePath, verdict: "REJECT", layer: "L1", check: l1.check,
             failure_class: l1.failure_class,
             reason: l1.reason, stages, trace };
  }

  // ── 分流：证据门管道 vs 传统 LLM ──
  let verdictsForL3;
  let finalStage = null;

  if (evidenceGates && evidenceGates.requirements && evidenceGates.requirements.length > 0) {
    const evidenceDir = evidenceGates.evidence_dir
      ? (evidenceGates.evidence_dir.startsWith("/") || /^[A-Za-z]:[/\\]/.test(evidenceGates.evidence_dir)
          ? evidenceGates.evidence_dir
          : join(ROOT, evidenceGates.evidence_dir))
      : join(dirname(filePath), ".skillgate", "evidence");

    // Evidence Gate — 文件存在性检查
    const eg = evidenceGateCheck(evidenceDir, evidenceGates.requirements);
    const egEvidence = evidenceGates.requirements.map(r => `evidence:${r.evidence_file}`).join(",");
    stages.push({ layer: "EvidenceGate", verdict: eg.verdict, check: eg.check, reason: eg.reason,
                  failure_class: eg.failure_class || null, evidence: egEvidence });
    if (eg.verdict === "REJECT") {
      return { file: filePath, verdict: "REJECT", layer: "EvidenceGate", check: eg.check,
               failure_class: eg.failure_class,
               reason: eg.reason, stages, trace };
    }

    // C1 — 合约正则（确定性）
    const c1 = contractRegexCheck(evidenceDir, evidenceGates.requirements);
    const c1Reqs = evidenceGates.requirements.filter(r => r.type === "regex");
    const c1Evidence = c1Reqs.map(r => `evidence:${r.evidence_file}(${r.pattern})`).join(";");
    stages.push({ layer: "C1", verdict: c1.verdict, check: c1.check, reason: c1.reason,
                  failure_class: c1.failure_class || null, evidence: c1Evidence });
    if (c1.verdict === "REJECT") {
      return { file: filePath, verdict: "REJECT", layer: "C1", check: c1.check,
               failure_class: c1.failure_class,
               reason: c1.reason, stages, trace };
    }

    // C1 UNCLEAR（部分通过）或 C1 PASS 但有 type=llm 的需求 → 传 C2
    const llmReqs = evidenceGates.requirements.filter(r => r.type === "llm");
    const needC2 = (c1.verdict === "UNCLEAR" || llmReqs.length > 0);

    if (needC2) {
      const c2 = await perRequirementLlmCheck(evidenceDir, evidenceGates.requirements, model, nRuns, apiConfig);
      const c2Reqs = evidenceGates.requirements.filter(r => r.type === "llm");
      const c2Evidence = c2Reqs.map(r => `evidence:${r.evidence_file}(${r.id})`).join(";");
      stages.push({ layer: "C2", verdict: c2.verdict, check: c2.check, reason: c2.reason,
                    evidence: c2Evidence });
      finalStage = c2;
    } else {
      finalStage = { verdict: "PASS", layer: "C1_to_L3" };
    }

    // 构造 L3 兼容的 verdicts 数组
    if (finalStage.verdict === "PASS") {
      verdictsForL3 = ["PASS", "PASS", "PASS"];
    } else if (finalStage.verdict === "REJECT") {
      verdictsForL3 = ["REJECT", "REJECT", "REJECT"];
    } else {
      verdictsForL3 = ["UNCLEAR"];
    }
  } else {
    // 传统管道：Layer 2 — LLM 语义审查
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
      evidence: fileEvidence,
    });
    verdictsForL3 = l2.verdicts;
  }

  // Layer 3 — 分歧检测（所有路径共享）
  const l3 = layer3Check(verdictsForL3, divergenceThreshold);
  stages.push({ layer: "L3", verdict: l3.verdict, check: l3.check, reason: l3.reason,
                failure_class: l3.failure_class || null,
                evidence: fileEvidence });

  // failure_class: 取最终判定阶段的值，如果 L3 是 unset 则向上看哪个阶段决定性拒绝
  const decisiveStage = stages.filter(s => s.verdict === "REJECT" || s.verdict === "PASS").pop();
  const finalFailureClass = decisiveStage?.failure_class || l3.failure_class || "unset";

  // ── chain-of-evidence trace ──
  const checkedAt = Date.now();
  // 收集所有证据文件元数据用于 STALE 检测
  const evidenceFiles = {};
  if (evidenceGates && evidenceGates.requirements) {
    for (const req of evidenceGates.requirements) {
      const efPath = join(
        evidenceGates.evidence_dir
          ? (evidenceGates.evidence_dir.startsWith("/") || /^[A-Za-z]:[/\\]/.test(evidenceGates.evidence_dir)
              ? evidenceGates.evidence_dir
              : join(ROOT, evidenceGates.evidence_dir))
          : join(dirname(filePath), ".skillgate", "evidence"),
        req.evidence_file
      );
      evidenceFiles[req.evidence_file] = evidenceFileMeta(efPath);
    }
  }
  const trace = stages.map(s => ({
    stage: s.layer,
    verdict: s.verdict,
    check: s.check,
    evidence: s.evidence || null,
    failure_class: s.failure_class || null,
  }));

  return {
    file: filePath,
    verdict: l3.verdict,
    layer: l3.layer,
    check: l3.check,
    failure_class: finalFailureClass,
    reason: l3.reason,
    confidence: Math.round(Math.max(
      verdictsForL3.filter(v => v === "PASS").length,
      verdictsForL3.filter(v => v === "REJECT").length,
    ) / verdictsForL3.length * 100),
    votes: verdictsForL3,
    stages,
    trace: {
      chain: trace,
      evidence_files: Object.keys(evidenceFiles).length > 0 ? evidenceFiles : undefined,
      checked_at: checkedAt,
    },
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
  let evidenceGates = null;
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
    evidenceGates = cfg.evidence_gates || null;
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
      evidenceGates = cfg.evidence_gates || null;
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
  const resolvedFiles = files.map(f => {
    // 已是绝对路径（Unix / 或 Windows X:\ 或 C:/）
    if (f.startsWith("/") || /^[A-Za-z]:[/\\]/.test(f)) return f;
    return join(ROOT, f);
  });

  return { task, files: resolvedFiles, rawFiles: files, model: effectiveModel, runs,
           divergenceThreshold, uncertainOutput, contracts, evidenceGates,
           apiConfig: { baseUrl, token } };
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

  const hasEvidenceGates = cfg.evidenceGates && cfg.evidenceGates.requirements && cfg.evidenceGates.requirements.length > 0;
  const hasLlmReqs = hasEvidenceGates && cfg.evidenceGates.requirements.some(r => r.type === "llm");
  const hasRegexReqs = hasEvidenceGates && cfg.evidenceGates.requirements.some(r => r.type === "regex");

  console.log(`\n🔍 forge-verify: content-verify — ${hasEvidenceGates ? "证据门管道" : "结构化验证"}`);
  console.log(`  模型: ${cfg.model}`);
  console.log(`  任务: ${cfg.task.slice(0, 80)}${cfg.task.length > 80 ? "..." : ""}`);
  console.log(`  文件: ${cfg.rawFiles.length > 0 ? cfg.rawFiles.join(", ") : "(无)"}`);
  console.log(`  投票: ${cfg.runs} 次 | 分歧阈值: ${cfg.divergenceThreshold}`);
  if (hasEvidenceGates) {
    console.log(`  证据门合约: ${cfg.evidenceGates.requirements.length} 条需求`);
    console.log(`    - 正则检查: ${cfg.evidenceGates.requirements.filter(r => r.type === "regex").length} 条`);
    console.log(`    - LLM 检查: ${cfg.evidenceGates.requirements.filter(r => r.type === "llm").length} 条`);
  }
  console.log(`  ─管道─`);
  console.log(`    L0  形状检查   (空/标点/占位符/零用例) — 零成本`);
  console.log(`    L0e Re-Stat   (复述检测: 承诺时态/桩代码/元评论) — 零成本`);
  console.log(`    L1  合约匹配   (minLen/keywords/blacklist) — 零成本`);
  if (hasEvidenceGates) {
    console.log(`    EG  证据门      (文件存在且非空) — 零成本`);
    if (hasRegexReqs) console.log(`    C1  合约正则    (逐需求regex匹配证据内容) — 零成本`);
    if (hasLlmReqs)  console.log(`    C2  逐需求LLM   (逐条判断证据是否满足需求)`);
  } else {
    console.log(`    L2  LLM 语义   (瘦prompt, 只问残差)`);
  }
  console.log(`    L3  分歧检测   (maxFrac < ${cfg.divergenceThreshold} → UNCLEAR 转人工)`);
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
                                  cfg.divergenceThreshold, fileContract, cfg.apiConfig, cfg.evidenceGates);
    results.push(r);

    // 输出
    const icons = { PASS: "✅", REJECT: "❌", UNCLEAR: "❓", FILE_NOT_FOUND: "⚠️" };
    const icon = icons[r.verdict] || "❓";

    console.log(`  ${icon} ${r.verdict} @ ${r.layer || "?"}: ${(r.reason || "").slice(0, 120)}`);

    if (r.stages) {
      for (const s of r.stages) {
        if (s.verdict === "PASS" || s.check?.startsWith("L0_pass") || s.check?.startsWith("L1_pass") || s.check?.startsWith("L1_no_contract") || s.check?.startsWith("EG_pass")) continue;
        if (s.check?.startsWith("C1_pass") || s.check?.startsWith("C2_pass")) continue;
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
        failure_class: r.failure_class || "unset",
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
  const llmSaved = results.filter(r =>
    r.layer === "L0" || r.layer === "L0e" || r.layer === "L1" ||
    r.layer === "EvidenceGate" || r.layer === "C1"
  ).length;
  console.log(`  分层节省: 确定性层拦截 = ${llmSaved} 文件免于 LLM 调用`);

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
