#!/usr/bin/env node
/**
 * layeredVerify 管道集成测试 — STALE 检测 + trace 结构 + 反馈环
 *
 * 测试内容：
 *   1. evidence_gates 管道走通后 trace 包含 evidence_files
 *   2. evidence_files 含 path/size/mtime 字段（stale 非必现）
 *   3. 无需 LLM 调用（使用纯 regex + negative 类型 requirements）
 */

import { writeFileSync, rmSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { layeredVerify, contractRegexCheck, evidenceGateCheck, LAYER2_PROMPT } from "./content-verify.mjs";

const TMP = ".forge/tmp-verify-integration";
const EVD = join(TMP, "evidence");
const apiConfig = {
  baseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.deepseek.com",
  token: process.env.ANTHROPIC_AUTH_TOKEN || process.env.VERIFY_API_KEY || "",
  model: process.env.ANTHROPIC_MODEL || "deepseek-v4-flash",
};

let passCount = 0, failCount = 0;

function check(label, ok, detail) {
  console.log(`  ${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`);
  if (ok) passCount++; else failCount++;
}

// 清理 + 创建
try { rmSync(TMP, { recursive: true, force: true }); } catch {}
mkdirSync(EVD, { recursive: true });

// 证据文件：C1 能匹配的
writeFileSync(join(EVD, "output.txt"),
  "RateLimiter-IP: 192.168.1.100 isRateLimited=true\n" +
  "Per-IP throttling applied\n");

// 测试文件：L0/L0e/L1 都通过
writeFileSync(join(TMP, "test-output.txt"),
  "Test run completed: all rate limiting checks passed.\n" +
  "Rate limit rules applied correctly.\n");

const evidenceGates = {
  evidence_dir: EVD,
  requirements: [
    { id: "REQ-1", desc: "IP rate limiting", evidence_file: "output.txt",
      type: "regex", patterns: ["(?i)RateLimiter.*IP"] },
  ],
};

console.log("# 管道集成测试 — trace STALE + 反馈环\n");

// ============================================================
// 1. trace 结构 — evidence_gates 管道走通后含 evidence_files
// ============================================================
console.log("## 1. trace.evidence_files 结构\n");

const r = await layeredVerify(
  join(TMP, "test-output.txt"),
  "Integration test",
  apiConfig.model,
  1,  // runs=1 (no LLM needed)
  0.8,
  null,  // no file contract
  apiConfig,
  evidenceGates
);

check("verdict 存在", !!r.verdict, `verdict=${r.verdict}`);
check("trace 存在", !!r.trace, "");
check("trace.evidence_files 存在", !!r.trace.evidence_files, "");
check("trace.evidence_files 含 output.txt",
  !!r.trace.evidence_files?.["output.txt"], "");

const ef = r.trace.evidence_files?.["output.txt"];
check("evidence_file 含 path", !!ef?.path, ef?.path || "");
check("evidence_file 含 size", typeof ef?.size === "number", `size=${ef?.size}`);
check("evidence_file 含 mtime", typeof ef?.mtime === "number", `mtime=${ef?.mtime}`);
check("trace 含 checked_at", typeof r.trace.checked_at === "number", "");

// 同运行期未被修改 → stale undefined
check("trace.stale 为 undefined（同运行期无修改）",
  r.trace.stale === undefined || r.trace.stale === false, `stale=${r.trace.stale}`);

// ============================================================
// 2. FILE_NOT_FOUND 路径 — trace 是 { chain: [] }
// ============================================================
console.log("\n## 2. FILE_NOT_FOUND 路径\n");

const rMissing = await layeredVerify(
  join(TMP, "nonexistent.txt"),
  "", "", 0, 0.8, null, apiConfig, null
);
check("FILE_NOT_FOUND verdict",
  rMissing.verdict === "FILE_NOT_FOUND", "");
check("FILE_NOT_FOUND trace 存在",
  !!rMissing.trace, "");
check("FILE_NOT_FOUND trace 是对象",
  typeof rMissing.trace === "object", "");

// ============================================================
// 3. 无 evidence_gates 路径 — trace.evidence_files 不存在
// ============================================================
console.log("\n## 3. 无 evidence_gates（传统 L2 路径）\n");

const rNoEg = await layeredVerify(
  join(TMP, "test-output.txt"),
  "test", apiConfig.model, 1, 0.8, null, apiConfig, null
);
check("非 evidence_gates 路径 trace.evidence_files 为 undefined",
  rNoEg.trace.evidence_files === undefined, "");

// ============================================================
// 4. L2 prompt structural 检查 — 防止 multi-file 语义错配回归
// ============================================================
console.log("\n## 4. LAYER2_PROMPT structural 检查（防 multi-file 错配回归）\n");

check("LAYER2_PROMPT 已 export",
  typeof LAYER2_PROMPT === "string" && LAYER2_PROMPT.length > 0, "");
check("LAYER2_PROMPT 含 multi-file handling 段落",
  /multi-file task/i.test(LAYER2_PROMPT), "防单文件被误判为遗漏其他组件");
check("LAYER2_PROMPT 含 {task} 占位符",
  LAYER2_PROMPT.includes("{task}"), "");
check("LAYER2_PROMPT 含 {content} 占位符",
  LAYER2_PROMPT.includes("{content}"), "");
check("LAYER2_PROMPT 要求 JSON 响应含 reason",
  /"reason"/.test(LAYER2_PROMPT), "L2 投票必须输出 reason");

// ============================================================
console.log(`\n## 汇总\n通过: ${passCount}  失败: ${failCount}  总检查点: ${passCount + failCount}`);

// 清理
try { rmSync(TMP, { recursive: true, force: true }); } catch {}

process.exitCode = failCount > 0 ? 1 : 0;
