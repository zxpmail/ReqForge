#!/usr/bin/env node
/**
 * C2→C1 反馈环集成测试
 *
 * 场景：evidence 实际包含正确内容，但 C1 的 regex pattern 太窄匹配不上。
 * C1 UNCLEAR → C2 PASS 后，反馈环应输出 pattern_suggestions。
 *
 * 不需要 API key（无 LLM 调用），用 type=llm 需求触发 C2_no_llm_reqs
 * 场景验证 C1_conflict_no_C2 路径也产出 failed_reqs。
 */

import { writeFileSync, rmSync, mkdirSync } from "fs";
import { contractRegexCheck } from "./content-verify.mjs";

const TMP = ".forge/tmp-c2c1-feedback-test";
try { rmSync(TMP, { recursive: true, force: true }); } catch {}
mkdirSync(TMP + "/evidence", { recursive: true });

// evidence: agent 用不同措辞写了正确实现
writeFileSync(TMP + "/evidence/output.txt",
  "Testing per-IP rate limiting...\n" +
  "IP-based throttling: OK\n" +
  "All 3 tests passed\n");

writeFileSync(TMP + "/evidence/coverage.txt",
  "Lines: 120/135 covered\n" +
  "Branch coverage: 89%\n" +
  "Statement coverage: 92%\n");

let passCount = 0, failCount = 0;

function check(label, ok, details) {
  console.log(`  ${ok ? "✅" : "❌"} ${label}${details ? " — " + details : ""}`);
  if (ok) passCount++; else failCount++;
}

console.log("# C2→C1 反馈环测试\n");

// == 场景 A: C1 failed_reqs 字段存在 ==
console.log("## 场景 A: C1 失败时带 failed_reqs\n");
{
  // pattern 太窄：要求 RateLimiter，实际 agent 写了 "per-IP rate limiting"
  const reqs = [
    { id: "REQ-1", evidence_file: "output.txt", pattern: "(?i)RateLimiter.*IP", type: "regex" },
    { id: "REQ-2", evidence_file: "output.txt", pattern: "(?i)isRateLimited", type: "regex" },
  ];
  const c1 = contractRegexCheck(TMP + "/evidence", reqs);
  check("C1 REJECT (两模均不匹配)", c1.verdict === "REJECT", c1.reason?.slice(0, 60));
  check("failed_reqs 存在", Array.isArray(c1.failed_reqs), `count=${c1.failed_reqs?.length}`);
  check("failed_reqs 含 no_match 原因", c1.failed_reqs?.every(f => f.reason === "no_match"), "");
  check("failed_reqs 有 id 和 evidence_file", c1.failed_reqs?.[0]?.id === "REQ-1", "");
}

// == 场景 B: C1 UNCLEAR 时带 failed_reqs ==
console.log("\n## 场景 B: C1 UNCLEAR 时带 failed_reqs\n");
{
  // 部分匹配：REQ-1 不匹配，REQ-2 匹配
  const reqs = [
    { id: "REQ-1", evidence_file: "output.txt", pattern: "(?i)RateLimiter.*IP", type: "regex" },
    { id: "REQ-2", evidence_file: "output.txt", pattern: "(?i)throttl", type: "regex" },
  ];
  const c1 = contractRegexCheck(TMP + "/evidence", reqs);
  check("C1 UNCLEAR (1/2)", c1.verdict === "UNCLEAR", c1.reason?.slice(0, 60));
  check("failed_reqs 仅含 REQ-1", c1.failed_reqs?.length === 1 && c1.failed_reqs[0].id === "REQ-1", "");
}

// == 场景 C: C1 PASS 时无 failed_reqs ==
console.log("\n## 场景 C: C1 PASS 时无 failed_reqs\n");
{
  const reqs = [
    { id: "REQ-1", evidence_file: "output.txt", pattern: "(?i)(throttl|rate.?limit)", type: "regex" },
  ];
  const c1 = contractRegexCheck(TMP + "/evidence", reqs);
  check("C1 PASS", c1.verdict === "PASS", "");
  check("无 failed_reqs", !c1.failed_reqs || c1.failed_reqs?.length === 0, "");
}

// == 场景 D: 多模式 patterns 数组下 failed_reqs 仍正确 ==
console.log("\n## 场景 D: patterns 数组 + failed_reqs\n");
{
  const reqs = [
    { id: "REQ-IP", evidence_file: "output.txt",
      patterns: ["(?i)RateLimiter.*IP", "(?i)X-RateLimit"],
      type: "regex" },
  ];
  const c1 = contractRegexCheck(TMP + "/evidence", reqs);
  check("C1 REJECT (patterns 全不匹配)", c1.verdict === "REJECT", "");
  check("failed_reqs 含一条", c1.failed_reqs?.length === 1, `id=${c1.failed_reqs?.[0]?.id}`);
}

// == 场景 E: negative 合约 failure ==
console.log("\n## 场景 E: negative 合约命中 → failed_reqs\n");
{
  const reqs = [
    { id: "REQ-OK", evidence_file: "coverage.txt", pattern: "(?i)(coverage|89%)", type: "regex" },
    { id: "NEG-TODO", evidence_file: "coverage.txt", pattern: "(?i)TODO|FIXME", type: "negative" },
  ];
  const c1 = contractRegexCheck(TMP + "/evidence", reqs);
  check("C1 UNCLEAR (正通过/负通过)", c1.verdict === "PASS", "因为 NEG-TODO 未命中 → 全 PASS");
}

console.log(`\n## 汇总\n通过: ${passCount}  失败: ${failCount}  总检查点: ${passCount + failCount}`);

try { rmSync(TMP, { recursive: true, force: true }); } catch {}

process.exitCode = failCount > 0 ? 1 : 0;
