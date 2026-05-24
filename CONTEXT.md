# CONTEXT

## 当前正在做什么

- 无进行中任务（autoresearch 对照已落地，forge-smoke 10/10）

## 上次停在哪个位置

- autoresearch 对照落地完成：对照文档 + dev-planner Primary metric + dev-builder Spec/Plan 只读与 Task 微循环；`pnpm sync` + `pnpm forge-smoke` 10/10
- 已 push `b1774b7`：审查项（CHANGELOG、EVOLUTION 主控文件、changes/archive 跟踪、settings.local）
- **本地未 push**：autoresearch 本轮改动

## 架构与 Harness（产品本身）

- 12 Skill + 10 Agent + 10 默认钩子 + Loadout 机制（**Phase 1–13 已闭环**，见 DEV-PLAN.md）
- **路线图（未排期）**：Gemini CLI、模板市场、Dashboard、Skill 进化 P1/P2 —— 非 v1.23.0 欠账
- Skill 进化：P0 文档已完成，P1/P2 仍暂缓

## 框架仓库 vs 用户项目（勿混淆）

| 工件 | 用户项目 | ReqForge 框架仓库 |
|------|----------|-------------------|
| Product-Spec / DEV-PLAN | 应有 | 有（描述框架本身） |
| Design-Brief | 可选 | **通常不需要** |
| memory/ | dev-builder 后创建 | **通常不需要** |
| changes/ | brownfield 时用 | **通常为空** |

## 测试（框架仓库 · 非架构）

- **Vitest**：`pnpm test` — Phase 10 脚本单元测试（22 项）
- **forge-smoke**：`pnpm forge-smoke` — 10 项静态 smoke + test-demo 黄金路径
- **test-demo**：`pnpm test-demo-golden-path` — 验收已提交 demo（不重新生成）

## 维护者文档（非架构 · 非测试）

- [loadout-scenarios.md](core/docs/loadout-scenarios.md) · [platform-compliance.md](core/docs/platform-compliance.md)
- [rtk-comparison.md](core/docs/rtk-comparison.md) · [nanochat-comparison.md](core/docs/nanochat-comparison.md) · [autoresearch-comparison.md](core/docs/autoresearch-comparison.md)
- [test-demo/README.md](test-demo/README.md) — 黄金路径；`todo-cli/` 为 Spec+Plan 产物（无独立用途）
