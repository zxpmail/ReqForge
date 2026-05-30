# CONTEXT

## 当前正在做什么

- **提示词瘦身 P3** 待 push：design-brief-builder + release-builder 索引化
- **提示词瘦身 P2** 已 push（`50867c2`）：product-spec-builder Quick 路径
- **v1.35.1** 已 push：跨客户端接力 + dev-builder P0 瘦身
- **Cross-Client Handoff** 已 push（`22d5c5b`）
- **Matt Pocock 吸收批** 已 push：**v1.34.0**（`6829402`）

## 上次停在哪个位置

- **v1.35.0**（2026-05-29）：`forge-trace` / `forge-scope` / `forge-verify` 扩展；dev-builder Phase 完成评估 + 进化提案（兌）；Playwright E2E 模板；`skill-eval judge`；[skill-authoring-patterns.md](core/docs/skill-authoring-patterns.md)
- **v1.34.0**：Matt Pocock 吸收（Light Grill、zoom-out、架构保健、GitHub slices）
- **v1.33.0**：腾讯 Harness 镜子 + `project-taste.md` + S1–S5
- GitHub Wiki 源稿 `docs/github-wiki/Home.md` 需维护者手动粘贴到 wiki

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

- **Vitest**：`pnpm test` — 40 项
- **forge-smoke**：`pnpm forge-smoke` — 12 项静态 smoke + test-demo 黄金路径
- **test-demo**：`pnpm test-demo-golden-path`

## 维护者文档（非架构 · 非测试）

- [superpowers-comparison.md](core/docs/superpowers-comparison.md) · [skill-evolution-comparison.md](core/docs/skill-evolution-comparison.md) · [skillopt-comparison.md](core/docs/skillopt-comparison.md) · [tencent-harness-mirror-comparison.md](core/docs/tencent-harness-mirror-comparison.md) · [mattpocock-skills-comparison.md](core/docs/mattpocock-skills-comparison.md) · [skill-authoring-patterns.md](core/docs/skill-authoring-patterns.md)
- [loadout-scenarios.md](core/docs/loadout-scenarios.md) · [test-demo/README.md](test-demo/README.md)
