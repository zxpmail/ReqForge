# CONTEXT

## 当前正在做什么

- **提示词瘦身 P5** 本地完成：`forge-install --loadout`（待 commit push）
- **P0–P4** 已 push（v1.35.1–v1.35.5）

## 上次停在哪个位置

- **P5**：`scripts/loadout.ts` + `install.ts --loadout/-l` + 测试 + 文档
- **v1.35.5**（`dbb8cd9`）：bug-fixer + code-review 索引化

## 架构与 Harness（产品本身）

- 12 Skill + 10 Agent + 10 默认钩子 + Loadout 机制（**Phase 1–13 已闭环**）
- **P5**：安装时可按 loadout 过滤 skills/agents，不再「全量复制 + 仅 hooks 参考」

## 框架仓库 vs 用户项目（勿混淆）

| 工件 | 用户项目 | ReqForge 框架仓库 |
|------|----------|-------------------|
| Product-Spec / DEV-PLAN | 应有 | 有（描述框架本身） |
| `.forge/loadout-active.json` | `--loadout` 安装后 | 无 |
| memory/ | dev-builder 后创建 | **通常不需要** |

## 测试（框架仓库 · 非架构）

- **Vitest**：`pnpm test`
- **forge-smoke**：`pnpm forge-smoke`

## 维护者文档

- [loadout-scenarios.md](core/docs/loadout-scenarios.md) — 含 `--loadout` 安装说明
