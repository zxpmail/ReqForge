#!/usr/bin/env node
/**
 * forge-verify evidence gate 管道测试 — EG → C1 → C2
 *
 * 直接 import 生产 content-verify.mjs 的管道函数（不再维护内联副本），
 * 验证：
 *   1. failure_class 在 EG、C1 阶段是否正确
 *   2. 短路行为（EG REJECT 后不执行 C1）
 *   3. C2 在真实 env 下的协议自适应（Anthropic / OpenAI）与诚实降级
 */

import { writeFileSync, rmSync, mkdirSync } from "fs";
import { evidenceGateCheck, contractRegexCheck, perRequirementLlmCheck } from "./content-verify.mjs";

// ====== 测试证据目录和文件准备 ======
const TMP = ".forge/tmp-evidence-gate-test";
try { rmSync(TMP, { recursive: true, force: true }); } catch {}
mkdirSync(TMP + "/evidence", { recursive: true });

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

console.log("# Evidence Gate 管道测试 — EG → C1 → C2（import 生产函数）\n");
console.log(`证据目录: ${TMP}/evidence/\n`);

// ====== 运行测试 ======
const hasApi = !!(process.env.ANTHROPIC_AUTH_TOKEN || process.env.VERIFY_API_KEY);
// baseUrl 不剥 /anthropic：生产 llmComplete 依据 base 是否含 /anthropic 分发协议
const apiConfig = {
  baseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.deepseek.com",
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

// --- C2 场景（生产 perRequirementLlmCheck，nRuns=1 省钱）---
console.log("\n## 场景 G: C2 LLM 检查 — 清晰满足的需求绝不应被误判 REJECT\n");
if (hasApi) {
  const llmReqs = [
    { id: "REQ-JSON", desc: "响应 JSON 包含 userId、rateLimited、status 字段", evidence_file: "json-output.txt", type: "llm" },
  ];
  const eg = evidenceGateCheck(TMP + "/evidence", llmReqs);
  check("EG PASS (文件存在)", eg, "PASS", null);
  console.log("  (调用 LLM API 中...)");
  try {
    const c2 = await perRequirementLlmCheck(TMP + "/evidence", llmReqs, apiConfig.model, 1, apiConfig);
    // 不变量：证据明确含三字段，C2 永不应 REJECT。
    //   API 可用（含协议自适应走通）→ PASS；API 错误 → UNCLEAR (C2_api_errors)。
    const ok = c2.verdict !== "REJECT";
    console.log(`  ${ok ? "✅" : "❌"} C2 不误判 REJECT (实际: ${c2.verdict}${c2.failure_class ? ", fc=" + c2.failure_class : ""})`);
    if (!ok) {
      console.log(`     ❗ reason: ${(c2.reason || "").slice(0, 100)}`);
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
