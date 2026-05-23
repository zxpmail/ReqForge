# Forge 与 OpenSpec 对照

> 参考：[Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)（Spec-Driven Development for AI coding assistants）  
> 本文说明两者定位差异、ReqForge 已吸收的能力，以及 `/change-manager` 如何补齐「单次变更」体验。

---

## 一句话定位

| 项目 | 擅长 |
|------|------|
| **OpenSpec** | 在**已有项目**里，用 `changes/` 工件 + slash 命令，把「这次改什么」说清楚再写代码 |
| **Forge (ReqForge)** | 从**模糊想法到可交付产品**的全流程 Harness：Spec、计划、TDD 实现、审查、发布、进化、多客户端 |

两者可叠加：**Forge 管全流程与工程纪律；变更子流程对齐 OpenSpec 的 propose → apply → archive。**

---

## 哲学对照

OpenSpec 公开原则：

```
fluid not rigid · iterative not waterfall · easy not complex
brownfield not just greenfield · personal to enterprise
```

Forge 对齐项：

- **fluid / iterative** — Product-Spec 迭代模式、`changes/` 增量工件、非瀑布 Phase
- **brownfield** — 迭代模式扫描现有代码与 Spec，不假设从零开始
- **easy** — 复制适配层即用；变更流由 `/change-manager` 统一入口

Forge 额外强调（OpenSpec 较薄）：

- Sub-Agent 隔离、并行 code-review、hooks 机器门、evolution 反馈闭环
- 三层 `memory/`、TDD、依赖图 blast-radius、Design-Brief / design-maker

---

## 工件结构对照

### OpenSpec（v1.3+ 工作流）

```
openspec/changes/<change-name>/
├── proposal.md    # 为什么改、改什么
├── specs/         # 需求与场景
├── design.md      # 技术方案
└── tasks.md       # 实现清单
```

归档：`openspec/changes/archive/<date>-<change-name>/`，并回写主 Spec。

### Forge

```
changes/<change-name>/
├── proposal.md    # 变更动机与目标（change-manager propose）
├── specs.md       # 本变更的需求细节（propose，可协同 product-spec-builder）
├── design.md      # 技术/UI 方案（propose 占位 → dev-planner / design 技能填充）
└── tasks.md       # 实现步骤（dev-planner 填充 → dev-builder 执行）

Product-Spec.md              # 全局产品真相（归档前需回写）
Product-Spec-CHANGELOG.md    # 需求变更记录
```

归档：`changes/archive/<change-name>/`（由 `/change-manager archive` 或 dev-builder Phase 完成后触发）。

---

## 命令对照

| OpenSpec | Forge | 说明 |
|----------|-------|------|
| `/opsx:propose "idea"` | `/change-manager propose <name>` | 创建 `changes/<name>/` 四类工件 |
| `/opsx:apply` | `/change-manager apply <name>` | 按 tasks.md 调度 dev-builder / bug-fixer |
| `/opsx:verify` | `/change-manager verify <name>` | tasks 勾选 + 编译/测试证据 |
| `/opsx:archive` | `/change-manager archive <name>` | 回写 Spec、移入 archive |
| `openspec init` | `pnpm forge-install` + 可选创建 `changes/` | Forge 用户项目零 npm；框架仓用 `pnpm sync` |
| `openspec update` | 重新 `forge-install --force`（保留 feedback） | 刷新适配层指令 |

---

## 何时用哪条路径

```mermaid
flowchart TD
  A[有新想法] --> B{项目是否已有 Product-Spec?}
  B -->|否| C[/product-spec-builder 全流程]
  B -->|是| D{本次是局部功能/改动?}
  D -->|是| E[/change-manager propose]
  D -->|否| F[/product-spec-builder 迭代模式]
  E --> G[/change-manager apply]
  G --> H[/change-manager verify]
  H --> I[/change-manager archive]
  C --> J[/dev-planner → /dev-builder ...]
  F --> E
```

- **0→1**：Product-Spec → DEV-PLAN → dev-builder（不必先建 change 目录）
- **1→N 功能**：优先 `change-manager`，保持 `changes/` 可追溯
- **大改 Spec**：仍可用 product-spec-builder 迭代模式；完成后用 change-manager archive 收口

---

## 建议不照搬 OpenSpec 的部分

| OpenSpec 做法 | Forge 选择 | 原因 |
|---------------|------------|------|
| 用户项目必须 `npm i -g` | 复制适配层，业务项目零 npm | 独立开发者、离线、可控 |
| 25+ 工具单一 CLI 维护 | core + adapters 同步 | 深度 Harness 与 hooks 需仓库级维护 |
| 规格层为主 | Spec + Plan + 审查 + 发布 + 进化 | 目标是一站式产品开发，不是仅 SDD |

---

## 相关文件

- Skill：`core/skills/change-manager/SKILL.md`
- 命令：`core/skills/change-manager/commands/change-manager.md`
- 模板：`core/skills/change-manager/templates/`
- 需求迭代细节：`core/skills/product-spec-builder/SKILL.md`（迭代模式 Document Update Phase）
- 主流程：`CLAUDE.md` [Skill Dispatch]
