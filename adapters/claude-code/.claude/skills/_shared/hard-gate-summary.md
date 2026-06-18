# HARD-GATE 摘要（共享）

> Hook 已 enforce 的链路由 `spec-before-code-gate.mjs` 拦截；本文供 Skill 内快速对齐。Session 启动全文 → `templates/forge-bootstrap.md`。

## 应用代码写入链（PreToolUse）

按序满足后才可 `Write`/`Edit` `src/`、`app/`、`lib/`、`packages/`。严格度由 `.forge/gate-config.json` 控制：

| Level | 检查项 | 适用场景 |
|-------|--------|----------|
| `full` (默认) | 全部 5 道门 | 成熟产品 / 正式项目 |
| `light` | 仅 `Product-Spec.md` 存在 | 小产品 / 原型 / 实验 |
| `none` | 跳过所有门 | 临时调试 / 非产品开发 |

### full（默认，完整链）

1. `Product-Spec.md` + § Idea Stage Exit Criteria
2. `.forge/spec-confirmed.json`
3. `DEV-PLAN.md`
4. `.forge/plan-confirmed.json`
5. `.forge/implementer-session.json`（**仅 implementer** 子 Agent 可创建；主 Session 禁止）

## Skill 级门

| Skill | 额外门 |
|-------|--------|
| product-spec-builder | Spec 书面确认前禁止 dev-planner/dev-builder |
| dev-planner | Plan 书面确认前禁止 dev-builder |
| dev-builder | Spec/Plan **只读**；漂移 → change-manager 或 replan |

## Session 生命周期（dev-builder）

- **Start**：读 `AGENTS.md`、DEV-PLAN 当前 Phase、`memory/decisions-log.md`
- **During**：遵守 MVP Scope；无 amendment 证据不扩 scope
- **End**：更新 `memory/decisions-log.md`；架构变化则更新 `project-memory.md`

## 大输出 offload

工具返回 2000+ 行 → 写临时文件，上下文只留头尾 + 路径。
