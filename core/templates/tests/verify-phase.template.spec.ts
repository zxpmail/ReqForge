/**
 * Phase 验证测试模板 — forge-install 写入
 *
 * dev-builder Phase 完成后，在此文件中添加验证该 Phase 核心链路的 E2E 测试。
 * 测试与 forge-verify 互补：
 *   forge-verify 检查编译/单元测试/基线
 *   此文件检查真实浏览器中的用户交互流
 *
 * 用法：
 *   npx playwright test --project=chromium tests/verify-phase-<N>.spec.ts
 *
 * 模板变量（由 dev-builder 在创建时填充）：
 *   PHASE_N     — Phase 编号
 *   PHASE_NAME  — Phase 名称
 *   CORE_FLOWS  — 该 Phase 的核心用户流程列表（每行一条）
 */

import { test, expect } from "@playwright/test";

test.describe("Phase PHASE_N: PHASE_NAME", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // CORE_FLOWS
  // — 此处由 dev-builder 在 Phase 完成时填充具体的交互流测试

  test("应用正常加载", async ({ page }) => {
    await expect(page).toHaveTitle(/./);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("核心交互链路可用", async ({ page }) => {
    // 替换为当前 Phase 的关键用户操作
    // 示例：
    // await page.getByRole("button", { name: "新增" }).click();
    // await expect(page.getByText("创建成功")).toBeVisible();
  });
});
