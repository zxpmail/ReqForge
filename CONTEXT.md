# CONTEXT

## 当前正在做什么

- **SkillOpt 批**（本地）：`skillopt-comparison.md` + `rejected-edits.json` 模板 + evolution bounded edits + train/held-out 文档 — 待 commit/push **v1.32.0**
- **security-guidance** 已 push：**v1.29.0**；远程 **v1.31.0**（skill-eval、preflight）

## 上次停在哪个位置

- **术哥无界 OpenSpec+Superpowers 对照**：`shuge-openspec-superpowers-comparison.md`；change-manager/dev-builder 衔接 + Delta/GWT 模板
- **Founder's Playbook 批**：Idea Gate + MVP Scope — 已 push `cc15f5c`
- **README / Wiki / llms / CHANGELOG** 已写入「Agent 执行纪律（8 条）」专节与导航
- **版本 v1.28.0**（2026-05-27）：dev-map 开发导航地图 + forge-verify 事后统一验证入口 + dev-builder 验证集成
- **版本 v1.27.0**（2026-05-27）：CLAUDE.md 分区 + hook 修复 + Skill 质量满分 + 反馈清理
- **版本 v1.26.0**（2026-05-27）：验证循环 + quickref + Idea Gate + MVP Scope + OpenSpec/Superpowers 衔接 + request-dispatcher
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

- **Vitest**：`pnpm test` — 22 项
- **forge-smoke**：`pnpm forge-smoke` — 12 项静态 smoke + test-demo 黄金路径
- **test-demo**：`pnpm test-demo-golden-path`

## 维护者文档（非架构 · 非测试）

- [superpowers-comparison.md](core/docs/superpowers-comparison.md) · [skill-evolution-comparison.md](core/docs/skill-evolution-comparison.md) · [skillopt-comparison.md](core/docs/skillopt-comparison.md)
- [loadout-scenarios.md](core/docs/loadout-scenarios.md) · [test-demo/README.md](test-demo/README.md)
