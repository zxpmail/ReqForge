# 多角度审查分发策略 (Parallel Review Strategy)

> **平台无关的决策表。** 本文件只描述「需要做什么审查」（平台无关），不写死「怎么派 agent」（平台特定）。各平台 adapter 按自身能力执行，参见 [§执行方式](#执行方式按平台能力分两种模式)。
> 同类范式：`dev-builder/references/gc-audit-routing.md`（决策表 vs 执行方式分离）。

## 问题

`code-review/references/workflow.md` Step 2 原本写死了 Claude Code 的执行细节：

```
dispatch 4 specialized agents concurrently:
- code-reviewer-design / -bug / -security / -types
```

「按名字并发派 4 个隔离子 agent」是 Claude Code 的 `Task`/`Agent` 原语。换到没有「命名并发子 agent」原语的平台（Cursor / Gemini CLI 等），这条指令**执行不了**——宿主 AI 只能忽略或在主上下文里草草模拟一遍，4 维审查形同虚设。

根因：**审查决策**（要哪几个维度、各自查什么、返回什么）与**执行机制**（怎么派 agent）耦合在一句指令里。

## 决策表（平台无关）

何时做多角度审查，由 `change_complexity` 决定（复杂度判定见 `workflow.md` Step 2）：

| `change_complexity` | 审查方式 |
|---|---|
| `simple`（typo、单文件改名、仅注释、默认值） | 跳过多角度，直接 Step 3 聚合快检 |
| `moderate` / `complex`（多模块、新公共 API、auth/payments/数据迁移、dep-graph risk 中高） | **4 维多角度审查**（下表） |

4 个维度（平台无关，每个维度查什么）：

| 维度 | 检查焦点 |
|---|---|
| **design** | Spec 合规：功能完整性、UI 一致性、Spec Drift |
| **bug** | Bug 模式：空指针、竞态、资源泄漏 |
| **security** | OWASP Top 10、凭证泄漏、注入、XSS |
| **types** | 类型安全：可空性、`any`/`ts-ignore`、边界 |

## 审查合约（平台无关 — 不变量）

无论用哪种执行方式，每个维度都必须返回**同一份结构化结果**——这是跨平台不变量，聚合（`workflow.md` Step 4）只消费这份合约，不关心它怎么产出：

- 每条 finding 带：`severity` / `impact` / `confidence (1–5)` / `risk_rank` / `evidence (file:line)`
- **匿名审查包**：不传 implementer 任务叙述、session 往来、作者身份——只传 Spec 摘录、checklist、diff、文件内容、Design-Brief/MCP 取值
- 聚合、置信度阈值、去重、cross-agent boost 规则一律见 `workflow.md` Step 4（此处不重复）

## 执行方式（按平台能力分两种模式）

合约不变，变的只是「4 个维度是 4 个隔离上下文并行，还是 1 个上下文顺序跑 4 遍」。

### Mode A — 原生隔离子 agent（并行）

平台支持按名字派发**隔离的**子 agent 并发执行。每个维度跑在独立上下文里，互不污染，结果真正独立。

- 每个维度对应 `core/agents/code-reviewer-{design,bug,security,types}.md`（这些 .md 是 **Claude Code 参考实现**，定义角色/输入/输出/置信度规则）
- 平台用自身的子 agent 原语派发（Claude Code = `Task`/`Agent` 工具）

### Mode B — 单上下文顺序遍历

平台**没有**「命名并发隔离子 agent」原语。宿主 agent 在**同一上下文**里按 4 个维度**顺序**跑 4 遍，每遍只采纳对应维度的检查清单，输出**同一份结构化合约**。

- Mode B 的让步：4 个维度不再上下文隔离，维度间独立性弱于 Mode A
- Mode B 仍必须：匿名审查包、同一 finding schema、照 Step 4 聚合
- `agents/code-reviewer-*.md` 此时作为**各维度的检查清单**读入上下文（而非派发为独立 agent）

### 平台 → 模式映射（2026-06 核实 + 打包修正）

| 平台 | 模式 | 说明 |
|---|---|---|
| Claude Code | **A** | `Task`/`Agent` + `agents/*.md`，原生并发隔离子 agent |
| OpenCode | **A** | `mode: subagent` + `@agent`，每个 subagent 独立 session/上下文隔离。并发派发原语存在（高并发有已知可靠性 bug，见 opencode #29638 / #18378） |
| Gemini CLI | **A**（v0.38.1+，2026-04） | Subagents（`.gemini/agents/*.md` + `@agent`）：独立上下文 + 并行 + 自定义命名 agent。4 个 reviewer 已加 frontmatter（`name`/`description`/`model:inherit`）→ 有效 subagent |
| Cursor | **A**（2.4+，已交付） | 2.4 Subagents：parallel + own context + 可配置。adapter 已修正打到 `.cursor/agents/`（原 `.cursor/rules/agents/` 为 rules 旧位置）；4 个 reviewer 已加 frontmatter → Mode A 已交付 |

> ✅ **截至 2026-06，四个目标平台均默认 Mode A（能力），且 code-review + dev-builder 派发均已跨平台交付**：reviewer 用 `model:inherit`；primary agent（implementer 等）在 core 保留 `model:opus`（Claude Code 质量强制），`sync.ts` 对非 Claude adapter 自动把 `opus`/`sonnet`/`haiku` 规范为 `inherit`（四平台合法）。Cursor adapter 路径已修正为 `.cursor/agents/`；`AGENTS.md` 索引不再打入 subagent 目录。
> Mode B 保留为**回退**：旧版本、subagents 被禁用（如 Gemini CLI `experimental.enableAgents:false`）、或主动选单上下文顺序遍历以规避并发可靠性问题。
> 关键不变：无论 A 还是 B，审查合约不变，Step 4 聚合照常工作。adapter 维护者按各平台当前版本核实并更新此表。

## 为什么这样切

- **合约是不变量**，执行方式是变量。把不变量钉死、把变量参数化 = 跨平台可移植，且不牺牲审查质量。
- Mode B 是**已知让步的回退路径**，不是降级放弃——它把「执行不了的指令」（旧版本无子 agent 原语、或 subagents 被禁用）变成「能跑的顺序审查」，4 个维度仍被系统性覆盖，只是失去上下文隔离。当前四个目标平台均已有 Mode A，此路径仅在回退场景触发。
- 与 `gc-audit-routing.md` 同构：决策表写在 reference（平台无关），workflow.md 只引用、不实现执行细节。

## 谁读这个

- `code-review/references/workflow.md` Step 2 引用本文件（不再写死 agent 名 + 并发派发）
- `core/agents/code-reviewer-*.md` 保留为 Claude Code 参考实现（Mode A 派发目标 / Mode B 检查清单）
- 相关：[[workflow-as-plugin]]（dispatch 是插件层能力，非框架核心）、`dev-builder/references/sub-agent-isolation.md`（单 agent 隔离派发的平台差异）
