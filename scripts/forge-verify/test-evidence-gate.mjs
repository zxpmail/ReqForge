#!/usr/bin/env node
/**
 * forge-verify evidence gate 管道测试 — EG → C1 → C2
 *
 * 直接调用管道函数（与 content-verify.mjs 实现一致），验证：
 *   1. failure_class 在 EG、C1 阶段是否正确
 *   2. 短路行为（EG REJECT 后不执行 C1）
 *   3. UNCLEAR + failure_class=unset 输出
 */

import { writeFileSync, existsSync, readFileSync } from "fs";

// ====== 测试证据目录和文件准备 ======
const TMP = ".forge/tmp-evidence-gate-test";
// 清理残留
import { rmSync } from "fs";
try { rmSync(TMP, { recursive: true, force: true }); } catch {}
import { mkdirSync } from "fs";
mkdirSync(TMP + "/evidence", { recursive: true });

// 写证据文件
writeFileSync(TMP + "/evidence/pass-output.txt",
  "[PASS] RateLimiter-IP: 192.168.1.100 isRateLimited=true\n" +
  "2 tests passed, 0 failed\n");

writeFileSync(TMP + "/evidence/empty-output.txt", "", "utf-8");

writeFileSync(TMP + "/evidence/no-match-output.txt",
  "[PASS] Database connection ok\n" +
  "No rate limit tests found\n");

writeFileSync(TMP + "/evidence/partial-output.txt",
  "[PASS] RateLimiter-IP: 192.168.1.100 isRateLimited=true\n" +
  "1 test passed\n");

writeFileSync(TMP + "/evidence/json-output.txt",
  '{"userId":"abc","rateLimited":true,"status":"blocked"}\n');

console.log("# Evidence Gate 管道测试 — EG → C1 → C2\n");
console.log(`证据目录: ${TMP}/evidence/\n`);

// ====== EG — 证据文件存在性检查 ======
// 同 content-verify.mjs 实现
function evidenceGateCheck(evidenceDir, requirements) {
  if (!requirements || requirements.length === 0)
    return { verdict: "PASS", layer: "EvidenceGate", check: "EG_no_reqs", reason: "" };

  const missing = [];
  const empty = [];

  for (const req of requirements) {
    const fp = evidenceDir + "/" + req.evidence_file;
    try {
      const s = existsSync(fp) ? null : "missing";
      if (s === "missing") { missing.push(req.id + ": " + req.evidence_file); continue; }
      const sz = readFileSync(fp).length;
      if (sz === 0) empty.push(req.id + ": " + req.evidence_file);
    } catch { missing.push(req.id + ": " + req.evidence_file); }
  }

  if (missing.length > 0 && empty.length > 0)
    return { verdict: "REJECT", layer: "EvidenceGate", check: "EG_missing_and_empty", failure_class: "execution-lapse",
             reason: "缺失: " + missing.join(", ") + "; 空: " + empty.join(", ") };
  if (missing.length > 0)
    return { verdict: "REJECT", layer: "EvidenceGate", check: "EG_missing", failure_class: "execution-lapse",
             reason: "证据文件缺失: " + missing.join(", ") };
  if (empty.length > 0)
    return { verdict: "REJECT", layer: "EvidenceGate", check: "EG_empty", failure_class: "execution-lapse",
             reason: "证据文件为空: " + empty.join(", ") };

  return { verdict: "PASS", layer: "EvidenceGate", check: "EG_pass",
           reason: requirements.length + " 个证据文件全部存在且非空" };
}

// ====== C1 — 合约正则检查 ======
// 同 content-verify.mjs 实现（含 PCRE (?i) 转换）
function toJsRegex(pattern) {
  let flags = "", p = pattern;
  while (/^\(\?([ims]+)\)/.test(p)) {
    const m = p.match(/^\(\?([ims]+)\)/);
    flags += m[1];
    p = p.slice(m[0].length);
  }
  flags = [...new Set(flags.split(""))].sort().join("");
  return { pattern: p, flags };
}

function contractRegexCheck(evidenceDir, requirements) {
  if (!requirements || requirements.length === 0)
    return { verdict: "PASS", layer: "C1", check: "C1_no_reqs", reason: "" };

  const regexReqs = requirements.filter(r => r.type === "regex" && r.pattern);
  if (regexReqs.length === 0) return { verdict: "PASS", layer: "C1", check: "C1_no_regex_reqs", reason: "" };

  const failures = [], passes = [];

  for (const req of regexReqs) {
    const fp = evidenceDir + "/" + req.evidence_file;
    let content;
    try { content = readFileSync(fp, "utf-8"); } catch {
      failures.push(req.id + ": 证据文件 " + req.evidence_file + " 不可读"); continue;
    }
    try {
      const { pattern, flags } = toJsRegex(req.pattern);
      const re = new RegExp(pattern, flags);
      if (re.test(content)) passes.push(req.id);
      else failures.push(req.id + ": 模式 /" + pattern + "/ 在 " + req.evidence_file + " 中未匹配");
    } catch (e) { failures.push(req.id + ": 正则错误 " + e.message); }
  }

  if (failures.length === 0)
    return { verdict: "PASS", layer: "C1", check: "C1_pass",
             reason: passes.length + "/" + regexReqs.length + " 合约正则通过" };

  if (failures.length === regexReqs.length)
    return { verdict: "REJECT", layer: "C1", check: "C1_all_fail", failure_class: "skill-defect",
             reason: "全部 " + regexReqs.length + " 条合约正则未通过: " + failures.join("; ") };

  return { verdict: "UNCLEAR", layer: "C1", check: "C1_partial", failure_class: "unset",
           reason: passes.length + "/" + regexReqs.length + " 通过; 未通过: " + failures.join("; ") };
}

// ====== C2 — 逐需求 LLM 检查 ======
// 同 content-verify.mjs 实现（调用 LLM API）
const C2_PROMPT = `You are a QA inspector checking ONE specific requirement.

Requirement: {req_desc}

Evidence file ({evidence_file}):
\`\`\`
{content}
\`\`\`

Does this evidence PROVE that the requirement is met?

Respond in JSON only:
{"pass": true/false, "reason": "one sentence"}`;

async function perRequirementLlmCheck(evidenceDir, requirements, apiConfig) {
  if (!requirements || requirements.length === 0)
    return { verdict: "PASS", layer: "C2", check: "C2_no_reqs", reason: "" };

  const llmReqs = requirements.filter(r => r.type === "llm");
  if (llmReqs.length === 0)
    return { verdict: "PASS", layer: "C2", check: "C2_no_llm_reqs", reason: "" };

  const { baseUrl, token } = apiConfig;
  const results = [];

  for (const req of llmReqs) {
    const fp = evidenceDir + "/" + req.evidence_file;
    let content;
    try { content = readFileSync(fp, "utf-8").trim().slice(0, 2000); } catch {
      results.push({ req_id: req.id, pass: false }); continue;
    }
    if (!content) { results.push({ req_id: req.id, pass: false }); continue; }

    const prompt = C2_PROMPT.replace("{req_desc}", req.desc)
      .replace("{evidence_file}", req.evidence_file)
      .replace("{content}", content);

    // vote: true=通过, false=真实未通过, null=API/解析错误（绝不计入 fail，与 production C2 一致）
    let vote = null;
    let errDetail = "";
    try {
      const resp = await fetch(baseUrl + "/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          model: apiConfig.model || "deepseek-v4-flash",
          max_tokens: 128, temperature: 0.0,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!resp.ok) {
        let detail = "HTTP " + resp.status;
        try { const eb = await resp.json(); if (eb?.error?.message) detail += ": " + eb.error.message; } catch {}
        errDetail = detail;
      } else {
        const body = await resp.json();
        const text = (body?.choices?.[0]?.message?.content || "").trim();
        let parsed;
        try { parsed = JSON.parse(text); } catch {
          const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          try { parsed = JSON.parse(cleaned); } catch { errDetail = "JSON parse failed: " + text.slice(0, 80); }
        }
        if (parsed) vote = parsed.pass === true;
      }
    } catch (e) { errDetail = "API call failed: " + (e.message?.slice(0, 60) || ""); }
    results.push({ req_id: req.id, pass: vote, reason: vote === null ? errDetail : "" });
  }

  const passed = results.filter(r => r.pass === true).length;
  const failed = results.filter(r => r.pass === false).length;
  const errored = results.filter(r => r.pass === null).length;

  if (failed === 0 && errored === 0)
    return { verdict: "PASS", layer: "C2", check: "C2_pass",
             reason: "全部 " + results.length + " 条需求通过 LLM 判断" };
  if (failed === 0 && errored > 0)
    return { verdict: "UNCLEAR", layer: "C2", check: "C2_api_errors", failure_class: "unset",
             reason: errored + "/" + results.length + " 条需求 API 调用失败: " + results.filter(r => r.pass === null).map(r => r.req_id + "(" + r.reason + ")").join(", ") };
  if (passed === 0)
    return { verdict: "REJECT", layer: "C2", check: "C2_all_fail", failure_class: "execution-lapse",
             reason: "全部 " + results.length + " 条需求未通过" };
  return { verdict: "UNCLEAR", layer: "C2", check: "C2_partial", failure_class: "unset",
           reason: passed + "/" + results.length + " 通过" };
}

// ====== 运行测试 ======
const hasApi = !!(process.env.ANTHROPIC_AUTH_TOKEN || process.env.VERIFY_API_KEY);
const apiConfig = {
  baseUrl: (process.env.ANTHROPIC_BASE_URL || "https://api.deepseek.com").replace(/\/anthropic\/?$/i, ""),
  token: process.env.ANTHROPIC_AUTH_TOKEN || process.env.VERIFY_API_KEY || "",
  model: process.env.ANTHROPIC_MODEL || "deepseek-v4-flash",
};

let passCount = 0, failCount = 0;

function check(label, verdict, expectedVerdict, expectedFc) {
  const vMatch = verdict.verdict === expectedVerdict;
  const fcMatch = !expectedFc || verdict.failure_class === expectedFc;
  const ok = vMatch && fcMatch;
  const details = "(" + verdict.verdict + (verdict.failure_class ? ", fc=" + verdict.failure_class : "") + ")";
  console.log(`  ${ok ? "✅" : "❌"} ${label} ${details}`);
  if (!ok) {
    if (!vMatch) console.log(`     预期 verdict: ${expectedVerdict}, 实际: ${verdict.verdict}`);
    if (!fcMatch) console.log(`     预期 failure_class: ${expectedFc}, 实际: ${verdict.failure_class}`);
  }
  if (ok) passCount++; else failCount++;
}

console.log("## 场景 A: 证据存在 + 正则匹配 → 全 PASS\n");
{
  const reqs = [
    { id: "REQ-1", evidence_file: "pass-output.txt", pattern: "(?i)(RateLimiter.*IP|isRateLimited)", type: "regex" },
    { id: "REQ-2", evidence_file: "pass-output.txt", pattern: "(?i)passed", type: "regex" },
  ];
  const eg = evidenceGateCheck(TMP + "/evidence", reqs);
  check("EG PASS + fc=none", eg, "PASS", null);
  const c1 = contractRegexCheck(TMP + "/evidence", reqs);
  check("C1 PASS + fc=none", c1, "PASS", null);
}

console.log("\n## 场景 B: 证据文件缺失 → EG REJECT (execution-lapse)\n");
{
  const reqs = [
    { id: "REQ-MISS", evidence_file: "nonexistent.txt", pattern: "(?i).*", type: "regex" },
  ];
  const eg = evidenceGateCheck(TMP + "/evidence", reqs);
  check("EG REJECT + fc=execution-lapse", eg, "REJECT", "execution-lapse");
}

console.log("\n## 场景 C: 证据文件为空 → EG REJECT (execution-lapse)\n");
{
  const reqs = [
    { id: "REQ-EMPTY", evidence_file: "empty-output.txt", pattern: "(?i).*", type: "regex" },
  ];
  const eg = evidenceGateCheck(TMP + "/evidence", reqs);
  check("EG REJECT + fc=execution-lapse", eg, "REJECT", "execution-lapse");
}

console.log("\n## 场景 D: 证据存在但正则不匹配 → C1 REJECT (skill-defect)\n");
{
  const reqs = [
    { id: "REQ-NO-IP", evidence_file: "no-match-output.txt", pattern: "(?i)(RateLimiter.*IP|isRateLimited)", type: "regex" },
  ];
  const eg = evidenceGateCheck(TMP + "/evidence", reqs);
  check("EG PASS (文件存在)", eg, "PASS", null);
  const c1 = contractRegexCheck(TMP + "/evidence", reqs);
  check("C1 REJECT + fc=skill-defect", c1, "REJECT", "skill-defect");
}

console.log("\n## 场景 E: 部分通过/部分不通过 → C1 UNCLEAR (unset)\n");
{
  const reqs = [
    { id: "REQ-PASS", evidence_file: "partial-output.txt", pattern: "(?i)(RateLimiter|isRateLimited)", type: "regex" },
    { id: "REQ-FAIL", evidence_file: "partial-output.txt", pattern: "(?i)(mock|simulate)", type: "regex" },
    { id: "REQ-ALSO-FAIL", evidence_file: "partial-output.txt", pattern: "(?i)(unimplemented|TODO)", type: "regex" },
  ];
  const eg = evidenceGateCheck(TMP + "/evidence", reqs);
  check("EG PASS (文件存在)", eg, "PASS", null);
  const c1 = contractRegexCheck(TMP + "/evidence", reqs);
  check("C1 UNCLEAR + fc=unset", c1, "UNCLEAR", "unset");
}

console.log("\n## 场景 F: 全部不通过 → C1 REJECT (skill-defect)\n");
{
  const reqs = [
    { id: "REQ-ALL-FAIL-1", evidence_file: "pass-output.txt", pattern: "(?i)(nothingmatches)", type: "regex" },
    { id: "REQ-ALL-FAIL-2", evidence_file: "pass-output.txt", pattern: "(?i)(alsonot)", type: "regex" },
  ];
  const eg = evidenceGateCheck(TMP + "/evidence", reqs);
  check("EG PASS (文件存在)", eg, "PASS", null);
  const c1 = contractRegexCheck(TMP + "/evidence", reqs);
  check("C1 REJECT + fc=skill-defect", c1, "REJECT", "skill-defect");
}

// --- C2 场景 ---
console.log("\n## 场景 G: C2 LLM 检查 — 清晰满足的需求绝不应被误判 REJECT\n");
if (hasApi) {
  const llmReqs = [
    { id: "REQ-JSON", desc: "响应 JSON 包含 userId、rateLimited、status 字段", evidence_file: "json-output.txt", type: "llm" },
  ];
  const eg = evidenceGateCheck(TMP + "/evidence", llmReqs);
  check("EG PASS (文件存在)", eg, "PASS", null);
  console.log("  (调用 LLM API 中...)");
  try {
    const c2 = await perRequirementLlmCheck(TMP + "/evidence", llmReqs, apiConfig);
    // 不变量：证据明确含三字段，C2 永不应 REJECT。
    //   API 可用 → PASS；API 错误（403/网络/解析）→ UNCLEAR (C2_api_errors)。
    //   修复前：API 错误被吞成 false 票 → 误判 REJECT (execution-lapse)。
    const ok = c2.verdict !== "REJECT";
    console.log(`  ${ok ? "✅" : "❌"} C2 不误判 REJECT (实际: ${c2.verdict}${c2.failure_class ? ", fc=" + c2.failure_class : ""})`);
    if (!ok) {
      console.log(`     ❗ 修复目标：API 错误应为 UNCLEAR，而非 REJECT。reason: ${(c2.reason || "").slice(0, 100)}`);
      failCount++;
    } else {
      passCount++;
      console.log(`     reason: ${(c2.reason || "").slice(0, 100)}`);
    }
  } catch (e) {
    console.log(`  ❌ C2 抛异常: ${e.message?.slice(0, 80)}`);
    failCount++;
  }
} else {
  console.log("  ⏭️  跳过 (无 ANTHROPIC_AUTH_TOKEN)");
}

console.log(`\n## 汇总`);
console.log(`通过: ${passCount}  失败: ${failCount}  总检查点: ${passCount + failCount}`);
console.log(``);

// 清理
try { rmSync(TMP, { recursive: true, force: true }); } catch {}

// 用 exitCode + 短暂宽限替代强制 process.exit：C2 的 fetch 在线程池/keepalive
// 套接字上留有 async handle，强制退出会触发 Windows libuv 的
// UV_HANDLE_CLOSING 断言（src/win/async.c）。宽限让 handle 自然收尾。
process.exitCode = failCount > 0 ? 1 : 0;
setTimeout(() => process.exit(process.exitCode), 200);
