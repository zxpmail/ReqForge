# CONTEXT

## 当前正在做什么

- 无进行中任务

## 上次停在哪个位置

- 本地 `9918bf1`：CONTEXT/DEV-PLAN 同步（待 push）；远程最新 `e7c1245`（v1.23.0 README/CHANGELOG）

## 架构与 Harness（产品本身）

- 12 Skill + 10 Agent + 10 默认钩子 + Loadout 机制（Phase 1–13 已闭环，见 DEV-PLAN.md）
- 默认 10 个钩子；对照文档在 `core/docs/`，Skill 用 GitHub 绝对 URL
- Skill 进化：P0 文档已完成，P1/P2 仍暂缓

## 维护者开发规范（v1.23.0 · 非架构）

> 以下属于**本仓库贡献/发版纪律**，与用户项目架构、Harness 七层无关。

- **发版守门**：`pnpm forge-smoke`（9 项 smoke + CI push/PR，禁止 cron）
- **Loadout 选型文档**：`core/docs/loadout-scenarios.md`（帮用户选 bundle，不是 Loadout 机制本身）
- **平台合规**：`core/docs/platform-compliance.md`（GitHub/OSS 策略，非产品设计）
