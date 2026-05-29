/**
 * Playwright 配置模板 — forge-install 写入用户项目根目录
 *
 * 使用前：
 *   1. `npm init playwright@latest` 安装 Playwright（或 `pnpm add -D @playwright/test`）
 *   2. 复制此文件为 `playwright.config.ts`
 *   3. 修改 baseURL 为你的开发服务器地址
 *   4. 运行 `npx playwright test`
 *
 * 集成到 Forge：
 *   dev-builder Phase 完成时自动运行 `npx playwright test --project=chromium`
 *   失败时自动录制 Trace，可用 `npx playwright show-trace` 回放调试
 *
 * 更多：https://playwright.dev/docs/intro
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // 测试文件目录
  testDir: "./tests",

  // 全局并行（CI 上更稳定）
  fullyParallel: true,

  // CI 环境禁止 test.only（防止忘记去掉 .only 导致 CI 跳过其他测试）
  forbidOnly: !!process.env.CI,

  // CI 重试 2 次，本地不重试
  retries: process.env.CI ? 2 : 0,

  // CI 限制 worker 数节约资源，本地全开
  workers: process.env.CI ? 2 : undefined,

  // 单个测试超时 30 秒
  timeout: 30000,

  // 断言超时 5 秒
  expect: { timeout: 5000 },

  // HTML 报告 + 控制台输出
  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],

  // 共享配置
  use: {
    // 基础 URL — 测试中可用相对路径（如 page.goto("/login")）
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // 操作超时 10 秒
    actionTimeout: 10000,

    // 失败时截图
    screenshot: "only-on-failure",

    // 失败时录制 Trace（首次重试时）
    trace: "on-first-retry",

    // 视口大小
    viewport: { width: 1280, height: 720 },
  },

  // 多浏览器项目
  projects: [
    // 认证 setup（可选 — 如有登录流程先跑这个）
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // 复用登录状态（运行 auth.setup.ts 后自动生成）
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },

    // 可选：取消注释以启用 Firefox / Safari
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],

  // 自动启动本地开发服务器
  webServer: {
    command: process.env.CI ? "npm run dev" : "npm run dev",
    url: process.env.BASE_URL || "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
