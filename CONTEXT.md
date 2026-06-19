# CONTEXT

## 当前版本
- **v1.48.1**（`495cbed`，2026-06-19）— 跨平台 agent dispatch 全平台交付；已打 tag + 发布 GitHub Release

## 上次停在哪个位置
- v1.48.1 已发布；随后完成 release-audit 复核：
  - **P1 修复已提交**（`706568c`）：修复 references 断链（少一层 `../`）、DEV-PLAN Phase 计数（1–13 → 1–16）、Wiki 版本号（v1.44.0 → v1.48.1）、注册文档已记载但 package.json 缺失的脚本（`forge-scaffold` / `forge-coverage` / `forge-skill-retrieve`）
  - **P3 收尾**：`sync.test.ts` 补测 `adaptAgentContent` / `AGENT_DIR_SKIP`；`split-skill-references.mjs` 归档到 `scripts/archive/`；本文件重写

## 测试
- `pnpm test`（154 全过）· `pnpm forge-smoke`（13/13）· `pnpm preflight`
