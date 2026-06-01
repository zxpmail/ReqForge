#!/usr/bin/env node
/**
 * forge-ui-check.mjs — Phase UI 自动化验证
 *
 * 用法：
 *   node scripts/forge-ui-check.mjs <N>                    # 静态检查 UI 文件
 *   node scripts/forge-ui-check.mjs <N> --url http://...   # 动态检查 + Playwright
 *   pnpm forge-ui-check <N> [--url http://...]
 *
 * 功能：
 *   解析 DEV-PLAN.md Phase N，提取 UI 相关清单项，
 *   生成 Playwright 测试脚本并执行，输出 pass/fail 报告。
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TEST_DIR = join(ROOT, ".forge", "ui-test");

// --- Parse args ---
const args = process.argv.slice(2);
let phaseNum = null;
let baseUrl = null;
let clean = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--url" && args[i + 1]) {
    baseUrl = args[++i].replace(/\/+$/, "");
    continue;
  }
  if (args[i] === "--clean") {
    clean = true;
    continue;
  }
  if (/^\d+$/.test(args[i])) {
    phaseNum = parseInt(args[i], 10);
  }
}

if (!phaseNum) {
  console.error("Usage: node scripts/forge-ui-check.mjs <N> [--url <url>] [--clean]");
  console.error("  <N>       Phase number (e.g. 3 for Phase 3)");
  console.error("  --url     Dev server URL for dynamic Playwright checks (e.g. http://localhost:5173)");
  console.error("  --clean   Remove generated test files after run");
  process.exit(1);
}

// --- Helpers ---
function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

// --- 1. Parse DEV-PLAN.md ---
const planPath = join(ROOT, "DEV-PLAN.md");
if (!existsSync(planPath)) {
  console.error("DEV-PLAN.md not found");
  process.exit(1);
}

const plan = readFileSync(planPath, "utf-8");
const lines = plan.split("\n");

let phaseStart = -1;
let phaseEnd = lines.length;
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^## Phase (\d+):/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (phaseStart === -1 && n === phaseNum) phaseStart = i;
    else if (phaseStart !== -1 && n !== phaseNum && n > 0) { phaseEnd = i; break; }
  }
}
if (phaseStart === -1) { console.error(`Phase ${phaseNum} not found`); process.exit(1); }

const phaseLines = lines.slice(phaseStart, phaseEnd);

// --- 2. Extract UI-related items ---
const UI_KEYWORDS = [
  "ui", "UI", "页面", "page", "Page",
  "组件", "component", "Component",
  "按钮", "button", "Button",
  "表单", "form", "Form",
  "输入", "input", "Input",
  "导航", "nav", "Nav", "menu", "Menu",
  "弹窗", "modal", "Modal", "dialog", "Dialog",
  "列表", "list", "List", "table", "Table",
  "卡片", "card", "Card",
  "图标", "icon", "Icon",
  "样式", "style", "Style", "css", "CSS",
  "布局", "layout", "Layout",
  "路由", "route", "Route", "router", "Router",
  "登录", "login", "Login",
  "注册", "register", "Register",
  "仪表盘", "dashboard", "Dashboard",
];

function isUiItem(text) {
  return UI_KEYWORDS.some(kw => text.includes(kw));
}

function extractItems(lines) {
  const items = [];
  let currentSection = null;
  for (const line of lines) {
    if (line.match(/^## Phase \d+:/)) continue;
    if (line.includes("**交付内容**")) { currentSection = "deliverables"; continue; }
    if (line.includes("**关键文件**")) { currentSection = "keyfiles"; continue; }
    if (line.includes("**验收标准**")) { currentSection = "acceptance"; continue; }
    if (line.match(/^## /)) break;
    const match = line.match(/^[-*]\s+(.+)/);
    if (match && currentSection) {
      const text = match[1].trim();
      if (isUiItem(text)) {
        items.push({ section: currentSection, text });
      }
    }
  }
  return items;
}

const uiItems = extractItems(phaseLines);

if (uiItems.length === 0) {
  console.log(`Phase ${phaseNum} 无 UI 相关清单项。`);
  process.exit(0);
}

// --- 3. Static check: UI file existence ---
function extractFilePaths(text) {
  return (text.match(/`[^`]+`/g) || []).map(f => f.replace(/`/g, ""));
}

function runStaticCheck(items) {
  const results = [];
  for (const item of items) {
    const files = extractFilePaths(item.text);
    if (files.length === 0) {
      results.push({ item, status: "skipped", reason: "无目标文件路径", files: [] });
      continue;
    }
    const existing = files.filter(f => existsSync(join(ROOT, f)));
    const missing = files.filter(f => !existsSync(join(ROOT, f)));
    results.push({
      item,
      status: missing.length > 0 ? "fail" : "pass",
      reason: missing.length > 0 ? `文件缺失: ${missing.join(", ")}` : undefined,
      files: existing,
      missing,
    });
  }
  return results;
}

const staticResults = runStaticCheck(uiItems);

// --- 4. Generate Playwright spec ---
function genTestId(text) {
  return text
    .replace(/`[^`]+`/g, "")
    .replace(/[^a-zA-Z0-9一-鿿_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);
}

function inferRoute(text) {
  const fileRoute = extractFilePaths(text).find(f => f.includes("pages") || f.includes("views") || f.includes("routes"));
  if (fileRoute) return fileRoute.replace(/.*pages[/\\]/, "/").replace(/\.[^.]+$/, "").toLowerCase();
  const routeMap = {
    "登录": "/login", "login": "/login",
    "注册": "/register", "register": "/register",
    "首页": "/", "home": "/", "dashboard": "/dashboard",
    "设置": "/settings", "settings": "/settings",
    "个人": "/profile", "profile": "/profile",
    "管理": "/admin", "admin": "/admin",
  };
  for (const [key, route] of Object.entries(routeMap)) {
    if (text.includes(key)) return route;
  }
  return "/";
}

function inferAssertions(text) {
  const assertions = [];
  if (/登录|login/i.test(text)) {
    assertions.push({ type: "heading", value: /登录|login|sign.?in/i });
  }
  if (/注册|register/i.test(text)) {
    assertions.push({ type: "heading", value: /注册|register|sign.?up/i });
  }
  if (/表单|form/i.test(text) || /输入|input/i.test(text)) {
    assertions.push({ type: "element", selector: "form" });
  }
  if (/按钮|button/i.test(text) || /提交|submit/i.test(text)) {
    assertions.push({ type: "element", selector: 'button[type="submit"], button:has-text("提交"), button:has-text("确定")' });
  }
  if (/输入.*用户|用户名.*输入|user.*input|input.*user/i.test(text)) {
    assertions.push({ type: "element", selector: 'input[type="text"], input[name*="user"], input[placeholder*="用户"]' });
  }
  if (/输入.*密码|密码.*输入|pass.*input|input.*pass/i.test(text)) {
    assertions.push({ type: "element", selector: 'input[type="password"]' });
  }
  if (/导航|nav|menu|菜单/i.test(text)) {
    assertions.push({ type: "element", selector: "nav" });
  }
  if (/列表|list|table/i.test(text)) {
    assertions.push({ type: "element", selector: 'ul, ol, table, [role="list"]' });
  }
  return assertions;
}

let specContent = `// Auto-generated by forge-ui-check — Phase ${phaseNum}
import { test, expect } from '@playwright/test';

const BASE = process.env.UI_TEST_URL || '${baseUrl || "http://localhost:5173"}';

`;

let testCount = 0;
for (const item of uiItems) {
  const route = inferRoute(item.text);
  const assertions = inferAssertions(item.text);
  const tid = genTestId(item.text);

  if (assertions.length > 0 && baseUrl) {
    testCount++;
    specContent += `test('${item.text.replace(/`/g, "").replace(/'/g, "\\'")}', async ({ page }) => {\n`;
    specContent += `  test.setTimeout(15000);\n`;
    specContent += `  await page.goto(\`\${BASE}${route}\`, { waitUntil: 'networkidle' });\n`;
    specContent += `  await expect(page).not.toHaveURL(/404/);\n\n`;

    for (const a of assertions) {
      if (a.type === "heading") {
        specContent += `  await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 5000 });\n`;
      } else if (a.type === "element") {
        specContent += `  await expect(page.locator('${a.selector}').first()).toBeVisible({ timeout: 5000 });\n`;
      }
    }
    specContent += `});\n\n`;
  } else if (assertions.length === 0 && baseUrl) {
    // Generic page load test
    testCount++;
    specContent += `test('${item.text.replace(/`/g, "").replace(/'/g, "\\'")} — 页面加载', async ({ page }) => {\n`;
    specContent += `  test.setTimeout(15000);\n`;
    specContent += `  await page.goto(\`\${BASE}${route}\`, { waitUntil: 'networkidle' });\n`;
    specContent += `  await expect(page).not.toHaveURL(/404/);\n`;
    specContent += `});\n\n`;
  }
}

if (baseUrl && testCount === 0) {
  // Fallback: one generic test
  specContent += `test('Phase ${phaseNum} UI — 页面可访问', async ({ page }) => {\n`;
  specContent += `  test.setTimeout(15000);\n`;
  specContent += `  await page.goto(BASE, { waitUntil: 'networkidle' });\n`;
  specContent += `  await expect(page).not.toHaveURL(/404/);\n`;
  specContent += `});\n\n`;
}

const specPath = join(TEST_DIR, `phase-${phaseNum}.spec.ts`);
if (baseUrl) {
  ensureDir(TEST_DIR);
  writeFileSync(specPath, specContent);
}

// --- 5. Run Playwright tests ---
function runPlaywright() {
  try {
    const out = execSync(
      `npx playwright test "${specPath}" --reporter=list 2>&1`,
      { cwd: ROOT, encoding: "utf-8", timeout: 120000, stdio: "pipe" }
    );
    return { exitCode: 0, output: out };
  } catch (e) {
    return { exitCode: e.status || 1, output: e.stdout || "", error: e.stderr || "" };
  }
}

// --- 6. Report ---
function formatReport() {
  const lines = [];
  lines.push(`# Phase ${phaseNum} UI 检查报告`);
  lines.push(`> UI 清单项: ${uiItems.length} 项`);
  lines.push("");

  // Static check results
  lines.push("## 静态文件检查");
  let staticPass = 0, staticFail = 0, staticSkip = 0;
  for (const r of staticResults) {
    if (r.status === "pass") { staticPass++; lines.push(`  ✅ ${r.item.text} — ${r.files.join(", ")}`); }
    else if (r.status === "fail") { staticFail++; lines.push(`  ❌ ${r.item.text} — ${r.reason}`); }
    else { staticSkip++; }
  }
  if (staticSkip > 0) lines.push(`  ⏭️ ${staticSkip} 项跳过（无文件路径可检查）`);
  lines.push(`  静态: ${staticPass} 通过 / ${staticFail} 失败 / ${staticSkip} 跳过`);
  lines.push("");

  // Dynamic (Playwright) results
  if (baseUrl) {
    lines.push("## Playwright 动态测试");
    lines.push(`> 目标: ${baseUrl}`);
    lines.push(`> 测试文件: ${specPath}`);
    lines.push("");

    const pwResult = runPlaywright();
    // Extract test results from output
    const passMatches = pwResult.output.match(/(\d+) passed/g);
    const failMatches = pwResult.output.match(/(\d+) failed/g);
    const totalTests = testCount;
    const passed = passMatches ? parseInt(passMatches[0]) || 0 : 0;
    const failed = failMatches ? parseInt(failMatches[0]) || 0 : 0;

    lines.push(pwResult.output.split("\n").filter(l => l.includes("✔") || l.includes("✘") || l.includes("✅") || l.includes("❌") || l.includes("passed") || l.includes("failed")).join("\n") || "  (无结构化输出)");
    lines.push("");
    lines.push(`  Playwright: ${passed} 通过 / ${failed} 失败 / ${totalTests} 总用例`);
    lines.push("");

    if (staticFail > 0 || failed > 0) {
      lines.push("**结论**: UI 验证未通过，需修复后再完成 Phase。");
    } else {
      lines.push("**结论**: UI 验证通过。");
    }
  } else {
    lines.push("## Playwright 动态测试");
    lines.push("> 跳过（未指定 --url）。启动 dev server 后使用 --url 参数运行。");
    lines.push("");

    if (staticFail > 0) {
      lines.push("**结论**: 静态检查未通过，需修复缺失文件。");
    } else {
      lines.push("**结论**: 静态检查通过。");
    }
  }

  // --- Generate fix brief if failures exist ---
  const fails = staticResults.filter(r => r.status === "fail");
  if ((fails.length > 0 || (baseUrl && testCount > 0)) && baseUrl) {
    const briefDir = join(ROOT, ".forge", "ui-loop");
    ensureDir(briefDir);
    const brief = ["# Phase " + phaseNum + " UI Fix Brief"];
    brief.push("");
    brief.push("依以下指令修复 UI 问题：");
    brief.push("");

    for (const r of fails) {
      brief.push("## " + r.item.text);
      brief.push("**操作**: 创建缺失的文件");
      for (const f of r.missing) {
        brief.push("- `" + f + "` — 不存在，需要创建");
      }
      brief.push("");
    }

    if (baseUrl) {
      brief.push("## Playwright 测试未通过项");
      brief.push("检查生成的 Playwright 测试了解具体失败原因：");
      brief.push("```bash");
      brief.push("npx playwright test " + specPath + " --reporter=list");
      brief.push("```");
      brief.push("");
    }

    brief.push("---");
    brief.push("修复后运行：");
    brief.push("```bash");
    brief.push("pnpm forge-ui-check " + phaseNum + " --url " + baseUrl);
    brief.push("```");

    writeFileSync(join(briefDir, "fix-brief.md"), brief.join("\n"));
    lines.push("");
    lines.push("Fix brief: " + join(briefDir, "fix-brief.md"));
  }

  // Cleanup
  if (clean && baseUrl) {
    rmSync(specPath, { force: true });
  }

  return lines.join("\n");
}

console.log(formatReport());

const totalFails = staticResults.filter(r => r.status === "fail").length;
process.exit(totalFails > 0 ? 1 : 0);
