# CONTEXT

## 当前正在做什么

- 无进行中任务

## 上次停在哪个位置

- 已 push：test-demo 黄金路径 + forge-smoke 第 10 项 + platform-compliance §1 修复

## 架构与 Harness（产品本身）

- 12 Skill + 10 Agent + 10 默认钩子 + Loadout 机制（Phase 1–13 已闭环，见 DEV-PLAN.md）
- 默认 10 个钩子；对照文档在 `core/docs/`，Skill 用 GitHub 绝对 URL
- Skill 进化：P0 文档已完成，P1/P2 仍暂缓

## 测试（框架仓库 · 非架构）

- **Vitest**：`pnpm test` — Phase 10 脚本单元测试（22 项）
- **forge-smoke**：`pnpm forge-smoke` — 10 项静态 smoke + test-demo 黄金路径；见 `scripts/forge-smoke/README.md`
- **test-demo**：`pnpm test-demo-golden-path` — Spec/Plan + todo-cli build/test/CLI 冒烟

## 维护者文档（非架构 · 非测试）

- [loadout-scenarios.md](core/docs/loadout-scenarios.md) — Loadout 选型指南
- [platform-compliance.md](core/docs/platform-compliance.md) — GitHub/OSS 政策说明
- [rtk-comparison.md](core/docs/rtk-comparison.md) — RTK 可选叠加（Shell 输出压缩，非依赖）
- [nanochat-comparison.md](core/docs/nanochat-comparison.md) — nanochat 方法论参照
- [test-demo/README.md](test-demo/README.md) — 黄金路径；`todo-cli/` 为 Spec+Plan 产物（无独立用途）
