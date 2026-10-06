#!/usr/bin/env node
/**
 * strength 字段透传 + L1-only 验收拒绝 单元测试
 *
 * 覆盖（吸收自 SDD 标准库强度分级，_shared/acceptance-evidence.md）：
 *   - generate-contracts.mjs: strength 透传（显式 pattern 路径 + desc 生成路径）
 *   - content-verify.mjs strengthL1OnlyCheck: 全 L1 拒绝 / 混合通过 / 未标注跳过
 *
 * 独立 node runner（与 test-generate-contracts.mjs 同款）。
 *
 * 用法：
 *   node scripts/forge-verify/test-strength-check.mjs
 */

import { spawnSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { strengthL1OnlyCheck } from "./content-verify.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEN = join(__dirname, "generate-contracts.mjs");

let passCount = 0, failCount = 0;

function check(label, ok, detail) {
  console.log(`  ${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`);
  if (ok) passCount++; else failCount++;
}

function runGen(requirements) {
  const res = spawnSync(process.execPath, [GEN], {
    input: JSON.stringify({ task: "t", files: [], requirements }),
    encoding: "utf-8",
  });
  if (res.status !== 0) return null;
  return JSON.parse(res.stdout);
}

console.log("# strength 透传 + L1-only 拒绝 单元测试\n");

// ============================================================
// 1. generate-contracts — strength 透传
// ============================================================
console.log("## 1. generate-contracts strength 透传\n");

{
  const out = runGen([
    { id: "R1", desc: "不得使用 TTL 替代 write-invalidation", evidence_file: "e.txt", strength: "L3" },
    { id: "R2", desc: "Coverage ≥ 85%", evidence_file: "c.txt", strength: "L2" },
  ]);
  check("两条 requirement 都生成", out?.evidence_gates?.requirements?.length === 2, "");
  check("显式 pattern 路径透传 strength=L3",
    out?.evidence_gates?.requirements?.[0]?.strength === "L3",
    JSON.stringify(out?.evidence_gates?.requirements?.[0]?.strength));
  check("desc 生成路径透传 strength=L2",
    out?.evidence_gates?.requirements?.[1]?.strength === "L2",
    JSON.stringify(out?.evidence_gates?.requirements?.[1]?.strength));
}

{
  const out = runGen([{ id: "R1", desc: "IP 级别限流", evidence_file: "e.txt" }]);
  const entry = out?.evidence_gates?.requirements?.[0];
  check("无 strength 字段 → 输出不含该键（存量配置零影响）",
    entry && !("strength" in entry), JSON.stringify(Object.keys(entry || {})));
}

// ============================================================
// 2. strengthL1OnlyCheck — L1-only 拒绝
// ============================================================
console.log("\n## 2. strengthL1OnlyCheck — L1-only 拒绝\n");

{
  const r = strengthL1OnlyCheck([
    { id: "R1", strength: "L1" },
    { id: "R2", strength: "L1" },
  ]);
  check("全 L1 → REJECT", r.verdict === "REJECT", r.check);
  check("check 名 = L1_only_acceptance", r.check === "L1_only_acceptance", r.check);
  check("failure_class = skill-defect", r.failure_class === "skill-defect", r.failure_class);
}

{
  const r = strengthL1OnlyCheck([{ id: "R1", strength: "l1" }]);
  check("小写 l1 同样拒绝", r.verdict === "REJECT", r.check);
}

{
  const r = strengthL1OnlyCheck([
    { id: "R1", strength: "L1" },
    { id: "R2", strength: "L2" },
  ]);
  check("L1+L2 混合 → PASS", r.verdict === "PASS", r.reason);
}

{
  const r = strengthL1OnlyCheck([
    { id: "R1", strength: "L3" },
    { id: "R2", strength: "L4" },
  ]);
  check("L3/L4 → PASS", r.verdict === "PASS", r.check);
}

{
  const r = strengthL1OnlyCheck([{ id: "R1" }, { id: "R2", strength: "L1" }]);
  check("部分未标注 → 跳过（向后兼容）",
    r.verdict === "PASS" && r.check === "S_skip_unannotated", r.check);
}

{
  const r = strengthL1OnlyCheck([]);
  check("空 requirements → PASS", r.verdict === "PASS", r.check);
  const r2 = strengthL1OnlyCheck(null);
  check("null requirements → PASS", r2.verdict === "PASS", r2.check);
}

// ============================================================
console.log(`\n## 汇总\n通过: ${passCount}  失败: ${failCount}  总检查点: ${passCount + failCount}`);
process.exitCode = failCount > 0 ? 1 : 0;
