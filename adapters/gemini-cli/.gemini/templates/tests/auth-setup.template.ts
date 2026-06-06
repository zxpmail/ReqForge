/**
 * 认证状态 setup — forge-install 写入
 *
 * 在运行其他测试前先执行一次登录，保存 cookie/localStorage，
 * 后续测试自动复用登录状态，无需每个测试都重复登录。
 *
 * 使用前：
 *   1. 修改 login URL、用户名/密码字段的选择器
 *   2. 运行 `npx playwright test --project=setup` 生成 auth 文件
 *   3. 之后运行 `npx playwright test` 所有测试自动携带登录态
 *
 * 安全：playwright/.auth/ 包含敏感 cookie，务必加入 .gitignore
 */

import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // 访问登录页
  await page.goto("/login");

  // 填写登录表单 — 根据实际项目修改选择器
  await page.getByLabel("用户名").fill("admin");
  await page.getByLabel("密码").fill("password123");

  // 点击登录按钮
  await page.getByRole("button", { name: /登录|login/i }).click();

  // 等待登录完成（跳转到仪表盘或首页）
  await page.waitForURL(/.*dashboard|.*\/$/);

  // 保存认证状态
  await page.context().storageState({ path: authFile });
});
