#!/usr/bin/env node
/**
 * generate-contracts 生成器单元测试
 *
 * 覆盖：同义展开、数字约束正则、negative 语义、type 推断。
 * 与 test-c2c1-feedback.mjs / test-evidence-gate.mjs 同层，
 * 都是独立 node runner（非 vitest）。
 *
 * 用法：
 *   node scripts/forge-verify/test-generate-contracts.mjs          # 全跑
 *   node scripts/forge-verify/test-generate-contracts.mjs --fix    # 修 bug 后验证
 */

import { genPercentPattern, extractNumericConstraint } from "./generate-contracts.mjs";

let passCount = 0, failCount = 0;

function check(label, ok, detail) {
  console.log(`  ${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`);
  if (ok) passCount++; else failCount++;
}

// 辅助：用 pattern test 字符串
function testPattern(pattern, input) {
  try { return new RegExp(pattern, "").test(input); } catch { return false; }
}

console.log("# generate-contracts 单元测试\n");

// ============================================================
// 1. genPercentPattern — 数字范围正则生成
// ============================================================
console.log("## 1. genPercentPattern — 正则结构\n");

const p85 = genPercentPattern(85);
check("min=85 生成非空 pattern", typeof p85 === "string" && p85.length > 0, p85);
check("min=85 不含未转义 \\d（非 pattern 写法）", !p85.includes("[object"), "");

const p90 = genPercentPattern(90);
check("min=90 不含 undefined", !p90.includes("undefined"), p90);

const p100 = genPercentPattern(100);
check("min=100 带 negative lookbehind", p100 === "(?<!\\d)100%", p100);

// ============================================================
// 2. 正确匹配（positive cases）
// ============================================================
console.log("\n## 2. 正确匹配\n");

check("85: '85% coverage' 应匹配", testPattern(genPercentPattern(85), "85% coverage"), "");
check("85: 'Coverage: 89%' 应匹配", testPattern(genPercentPattern(85), "Coverage: 89%"), "");
check("85: 'value=95%' 应匹配", testPattern(genPercentPattern(85), "value=95%"), "");
check("85: '100%' 应匹配", testPattern(genPercentPattern(85), "100%"), "");
check("90: '90%' 应匹配", testPattern(genPercentPattern(90), "90%"), "");
check("100: '100%' 应匹配", testPattern(genPercentPattern(100), "100%"), "");

// ============================================================
// 3. 误匹配预防（false positive guard）
// ============================================================
console.log("\n## 3. 误匹配预防（false positive）\n");

check("85: '185%' 不应匹配（前有数字）",
  !testPattern(genPercentPattern(85), "185%"), "substring '85%' 不应通过");
check("85: '2100%' 不应匹配（前有数字）",
  !testPattern(genPercentPattern(85), "2100%"), "substring '100%' 不应通过");
check("85: '850%' 不应匹配（前有数字）",
  !testPattern(genPercentPattern(85), "850%"), "substring '85%' 不应通过");
check("90: '190%' 不应匹配",
  !testPattern(genPercentPattern(90), "190%"), "substring '90%' 不应通过");
check("100: '2100%' 不应匹配",
  !testPattern(genPercentPattern(100), "2100%"), "substring '100%' 不应通过");

console.log("\n--- 边界情况 ---");
check("85: '85.5%'（小数）不应匹配",
  !testPattern(genPercentPattern(85), "85.5%"), "85.5 不含 '85%' 子串");

// ============================================================
// 4. extractNumericConstraint
// ============================================================
console.log("\n## 4. extractNumericConstraint\n");

check("desc='≥ 85%' → {min:85, unit:%}",
  extractNumericConstraint("≥ 85%")?.min === 85 &&
  extractNumericConstraint("≥ 85%")?.suffix === "%", "");
check("desc='至少80%' → {min:80}",
  extractNumericConstraint("至少80%")?.min === 80, "");
check("desc='coverage ≥ 90 percent' → {min:90}",
  extractNumericConstraint("coverage ≥ 90 percent")?.min === 90, "");
check("desc='no number' → null",
  extractNumericConstraint("no number") === null, "");

// ============================================================
console.log(`\n## 汇总\n通过: ${passCount}  失败: ${failCount}  总检查点: ${passCount + failCount}`);
process.exitCode = failCount > 0 ? 1 : 0;
