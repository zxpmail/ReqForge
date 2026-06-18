#!/usr/bin/env node
/**
 * forge-size-detect.mjs — Product size detection from Product-Spec.md
 *
 * Detects product scope from a completed spec and recommends a gate level.
 * Small products (CLI, 3-4 features, no auth, no DB) → "light"
 * Large products (full-stack, 6+ features, auth, DB) → "full"
 * Medium → "full" but user may reasonably downgrade
 *
 * Usage:
 *   node scripts/forge-size-detect.mjs <Product-Spec.md> [--json]
 *   node scripts/forge-size-detect.mjs <Product-Spec.md> --write-gate-config
 *
 * Registers as:
 *   pnpm forge-size-detect
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ============================================================
// Signal extraction
// ============================================================

function countFeatures(text) {
  // Match table rows under 核心功能 / Core Features / v1 section
  const coreSection = text.match(/#{1,3}\s+(?:核心功能|Core Features|v1[（(][^)）]+)?:?\s*\n[\s\S]*?(?=#{1,3}\s|$)/i);
  if (!coreSection) {
    // Fallback: count | P0 | rows anywhere
    const p0Rows = text.match(/^\|\s*[^|]+\|\s*[^|]*\|\s*[^|]*P0[^|]*\|/gm) || [];
    return p0Rows.length || countP0Inline(text);
  }
  const block = coreSection[0];
  // Count table data rows (not header/separator)
  const rows = block.match(/^\|\s*[^|]+\|\s*[^|]+\|/gm) || [];
  const dataRows = rows.filter(r => !r.match(/^\|\s*[-:]+/) && !r.match(/^\|\s*(功能|Feature|ID)/i));
  return dataRows.length || rows.length || countP0Inline(text);
}

function countP0Inline(text) {
  // Count P0 items in list or table format
  const p0Items = text.match(/P0/gi) || [];
  return p0Items.length;
}

function detectProductType(text) {
  const lower = text.toLowerCase();
  // Strip "不做/明确不做/not doing" sections to avoid false positives
  const withoutExclusions = lower.replace(/明确不做[\s\S]*?(?=#{1,3}\s|$)/gi, "")
    .replace(/not\s+(?:doing|planned|in\s+scope)[\s\S]*?(?=#{1,3}\s|$)/gi, "");

  if (/cli|command.?line|终端工具|命令行/.test(lower)) return "cli";
  if (/\bmobile\b|react.?native|expo|\bios\b|\bandroid\b|移动端|手机端|手机app/.test(withoutExclusions)) return "mobile";
  if (/desktop|electron|桌面应用|桌面端/.test(lower)) return "desktop";
  if (/full.?stack|next\.js.*api|前后端|服务端.*前端|backend.*frontend/.test(lower)) return "fullstack-web";
  if (/\bweb\b|\bspa\b|react.*vite|vue.*vite|svelte|浏览器|网页应用|web端/.test(lower)) return "web";
  return "unknown";
}

function hasAuth(text) {
  return /认证|auth|登录|login|oauth|jwt|session|注册|sign.?up|用户验证|身份/.test(text);
}

function hasDatabaseOrServer(text) {
  return /数据库|database|mysql|postgres|mongodb|redis|sql|服务端|backend|server|api.*route|rest.?api|graphql/i.test(text);
}

function hasMultipleRoles(text) {
  return /多角色|multi.?tenant|admin|管理员|权限|role|rbac|不同角色|用户类型/.test(text) &&
    !/单用户|single.?user|个人使用|一个人/.test(text);
}

// ============================================================
// Size classification
// ============================================================

function classifySize(signals) {
  const { featureCount, productType, auth, database, multipleRoles } = signals;

  // SMALL: all conditions must be true
  const isSmall = featureCount <= 4
    && (productType === "cli" || productType === "unknown")
    && !auth
    && !database
    && !multipleRoles;

  // LARGE: any condition triggers
  const isLarge = featureCount >= 6
    || productType === "fullstack-web"
    || productType === "mobile"
    || auth
    || database
    || multipleRoles;

  if (isSmall) return { size: "small", recommendedLevel: "light" };
  if (isLarge) return { size: "large", recommendedLevel: "full" };
  return { size: "medium", recommendedLevel: "full" };
}

// ============================================================
// Main analysis
// ============================================================

function analyzeSpec(text) {
  const featureCount = countFeatures(text);
  const productType = detectProductType(text);
  const auth = hasAuth(text);
  const database = hasDatabaseOrServer(text);
  const multipleRoles = hasMultipleRoles(text);

  const signals = { featureCount, productType, auth, database, multipleRoles };
  const { size, recommendedLevel } = classifySize(signals);

  return { signals, size, recommendedLevel };
}

// ============================================================
// Output
// ============================================================

function printReport(filePath, result) {
  const { signals, size, recommendedLevel } = result;
  const sizeLabel = { small: "🟢 小产品", medium: "🟡 中等产品", large: "🔴 大产品" };

  console.log("=".repeat(52));
  console.log("  Product Size Detection  ".padEnd(50, "═"));
  console.log("=".repeat(52));
  console.log(`  文件: ${filePath}`);
  console.log("=".repeat(52));

  console.log(`\n📊 Signals`);
  console.log(`  Features:         ${signals.featureCount}`);
  console.log(`  Product type:     ${signals.productType}`);
  console.log(`  Auth required:    ${signals.auth ? "YES" : "no"}`);
  console.log(`  DB/Server:        ${signals.database ? "YES" : "no"}`);
  console.log(`  Multiple roles:   ${signals.multipleRoles ? "YES" : "no"}`);

  console.log(`\n📐 Classification: ${sizeLabel[size] || size}`);
  console.log(`  Recommended gate: ${recommendedLevel}`);

  if (recommendedLevel === "light") {
    console.log(`\n💡 Small product detected. Light gate level recommended:`);
    console.log(`   - Product-Spec.md must exist (enforced)`);
    console.log(`   - Idea Stage Exit Criteria, DEV-PLAN, plan-confirmed: skipped`);
    console.log(`   - Full gate available if preferred (set "full" in gate-config.json)`);
  } else {
    console.log(`\n💡 Full gate level recommended for this scope.`);
    if (size === "medium") {
      console.log(`   - Medium scope: light level may work but full is safer`);
    }
  }
  console.log("-".repeat(52));
}

function writeGateConfig(specDir, recommendedLevel) {
  const forgeDir = join(specDir, ".forge");
  const configPath = join(forgeDir, "gate-config.json");

  if (!existsSync(forgeDir)) {
    mkdirSync(forgeDir, { recursive: true });
  }

  const config = { level: recommendedLevel, _source: "forge-size-detect (auto-recommended — override freely)" };
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  console.log(`\n📝 Written ${configPath}: { "level": "${recommendedLevel}" }`);
}

// ============================================================
// CLI
// ============================================================

const args = process.argv.slice(2);
const filePath = args.find(a => !a.startsWith("--"));
const jsonMode = args.includes("--json");
const writeConfig = args.includes("--write-gate-config");

if (!filePath) {
  console.error("用法: node scripts/forge-size-detect.mjs <Product-Spec.md> [--json] [--write-gate-config]");
  process.exit(1);
}

const resolved = filePath.startsWith("/") || filePath.match(/^[A-Z]:/i) ? filePath : join(ROOT, filePath);
if (!existsSync(resolved)) {
  console.error(`文件不存在: ${resolved}`);
  process.exit(1);
}

const text = readFileSync(resolved, "utf-8");
const result = analyzeSpec(text);

if (jsonMode) {
  console.log(JSON.stringify({ file: resolved, ...result }, null, 2));
} else {
  printReport(resolved, result);
}

if (writeConfig) {
  const specDir = dirname(resolved);
  writeGateConfig(specDir, result.recommendedLevel);
}
