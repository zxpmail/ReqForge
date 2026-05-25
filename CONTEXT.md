# CONTEXT

## 当前正在做什么

- 无进行中任务

## 上次停在哪个位置

- **Harness 硬化已闭环**（本地提交 `3068927` `582f29a` `2590a1e` `86e8e0e`；标记文件链、P2 skill-bypass、文档已提交）
- PreToolUse 五段链：Spec → spec-confirmed → DEV-PLAN → plan-confirmed → implementer-session
- forge-smoke **12** 项；中英文 README + DEV-PLAN 已对齐
- **product-spec-builder**：pm-frameworks + CoT（1–4）；`9b0d9c8` 去重 CoT 段 + CHANGELOG Unreleased
- **版本 v1.25.0**；**任务级八条纪律**：`core/docs/session-execution-discipline.md` + bootstrap 摘要 + `agents-template` + implementer

## 架构与 Harness（产品本身）

- 12 Skill + 10 Agent + 10 默认钩子 + Loadout 机制（**Phase 1–13 已闭环**，见 DEV-PLAN.md）
- **路线图（未排期）**：Gemini CLI、模板市场、Dashboard
- Skill 进化：**P1-lite** 已做（`failure_class` 启发式）；**P1-full** 自动轨迹归因、**P2** 运行时 bypass 扫描仍暂缓

## 框架仓库 vs 用户项目（勿混淆）

| 工件 | 用户项目 | ReqForge 框架仓库 |
|------|----------|-------------------|
| Product-Spec / DEV-PLAN | 应有 | 有（描述框架本身） |
| `.forge/*-confirmed.json` | 确认后生成 | 通常 gitignore |
| memory/ | dev-builder 后创建 | **通常不需要** |

## 测试（框架仓库 · 非架构）

- **Vitest**：`pnpm test` — 22 项
- **forge-smoke**：`pnpm forge-smoke` — 12 项静态 smoke + test-demo 黄金路径
- **test-demo**：`pnpm test-demo-golden-path`

## 维护者文档（非架构 · 非测试）

- [superpowers-comparison.md](core/docs/superpowers-comparison.md) · [skill-evolution-comparison.md](core/docs/skill-evolution-comparison.md)
- [loadout-scenarios.md](core/docs/loadout-scenarios.md) · [test-demo/README.md](test-demo/README.md)
