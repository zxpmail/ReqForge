## 问题

code-review 和 dev-builder 的 workflow.md 中，子代理分发（dispatch）写死了 Claude Code 的 agent 名字：

**code-review/workflow.md** Step 2（最硬）：
```
dispatch 4 specialized agents concurrently:
- code-reviewer-design
- code-reviewer-bug
- code-reviewer-security
- code-reviewer-types
```

**dev-builder/workflow.md** Step 7：
```
Dispatch implementer with isolated packet
```
Step 14：
```
Dispatch code-reviewer with affected_files
```

换成 OpenCode / Cursor 时，这些 agent 名字和 dispatch 机制不通用。

## 方案

把 dispatch 决策抽象成平台无关的 reference 文档，workflow.md 只引用不实现：

```
workflow.md: "执行多角度审查 → 见 parallel-review-strategy.md"
                                                ↓
parallel-review-strategy.md（平台无关）
  └─ 决策表：什么场景需要哪些审查维度
  └─ 输入/输出契约：审查需要什么，返回什么
  └─ 各平台 adapter 自行实现 dispatch 机制
```

这样 workflow.md 不再写死 `code-reviewer-bug` 这样的 Claude Code 特定 agent 名，只描述「需要做什么审查」。每个平台的 adapter 决定怎么执行。

## 不做
- 不重写已有 workflow.md——只抽离 dispatch 部分
- 不改变审查合约（输入/输出格式保持不变）
- 四个审查 agent 的定义留在 core/agents/，作为 Claude Code 的参考实现

## 状态

**已实施（2026-06-19）。**

落地内容：
- 新增 `core/skills/code-review/references/multi-perspective-dispatch.md` — 平台无关的 4 维审查分发：决策表 + 不变合约 + Mode A/B 执行方式 + 平台映射
- `code-review/references/workflow.md` Step 2 — 不再写死 `dispatch 4 named agents concurrently`，改为引用 `multi-perspective-dispatch.md`
- `dev-builder/references/sub-agent-isolation.md` — 新增 `[Platform Execution Modes]`：implementer / code-reviewer 派发的 Mode A/B 差异（workflow.md Step 7/14 本就指向此文件）
- 4 个 adapter 经 `pnpm sync` 同步（1072 files, 0 drift）；`pnpm validate-skill` 通过；`pnpm sync:discover` 0 drift

设计要点：审查合约（`severity`/`impact`/`confidence 1–5`/`risk_rank`/`evidence` + 匿名包）是跨平台**不变量**；变的只是执行方式——「4 个隔离上下文并行」(Mode A: Claude Code / OpenCode) vs「单上下文顺序 4 遍」(Mode B: Cursor / Gemini CLI)。Mode B 是**已知让步、非等效**：审查维度仍被系统性覆盖，但失去上下文隔离，长 Task 污染风险更高。

**已核实（2026-06-19）：** 平台→模式映射已按各平台当前版本核实，结论变更——四个目标平台**全部为 Mode A**：Claude Code=A（`Task`/`Agent`）、OpenCode=A（`mode:subagent` + `@agent`，独立 session 上下文）、Gemini CLI=**A**（v0.38.1+，2026-04 发布 [Subagents](https://developers.googleblog.com/subagents-have-arrived-in-gemini-cli/)：独立上下文 + 并行 + 自定义命名 agent，adapter 已含 `.gemini/agents/code-reviewer-*.md`）、Cursor=**A**（[2.4+ Subagents](https://forum.cursor.com/t/cursor-2-4-subagents/149403)：parallel + own context + 可配置 custom prompts/tools/models）。原判断 Cursor/Gemini CLI=B 已过时（基于各自发布 subagents 之前的版本）。映射表已更新见 `code-review/references/multi-perspective-dispatch.md` 与 `dev-builder/references/sub-agent-isolation.md`。Mode B 保留为回退（旧版本 / subagents 禁用 / 并发可靠性偏好）。

**后续更新（2026-06-19 打包修正）：** Cursor 打包问题已修复——
1. `scripts/sync.ts`：`core/agents` 在 Cursor adapter 由 `.cursor/rules/agents` 改打到 `.cursor/agents/`（Cursor 2.4 subagent 位置；旧位置是 rules 上下文目录）。
2. 4 个 reviewer（`code-reviewer-{bug,design,security,types}.md`）加了跨平台 frontmatter：`name` / `description` / `skills: code-review` / **`model: inherit`**。`inherit` 在四平台均合法；Claude Code 上 `omit == inherit`，故无行为变化。code-review 4 维 Mode A 现跨平台交付。Gates：`sync:discover` 0 drift · `validate-skill` 297/0 · `forge-smoke` 13/13。

**残余项已全部解决（2026-06-19）：**
1. ✅ **primary agent `model: opus`**：`sync.ts` 新增 `adaptAgentContent()`——对非 Claude adapter，agent 文件的 `opus`/`sonnet`/`haiku` 自动规范为 `inherit`（四平台合法）；Claude Code adapter 保留原值（质量强制不变）。`syncDir` 与 `fileHash` 均感知此变换，故 `sync:discover` 仍 0 drift。
2. ✅ **`AGENTS.md` 索引**：新增 `AGENT_DIR_SKIP`，agents 目录同步时排除 `AGENTS.md`（非 sub-agent 定义），不再打入各平台 subagent 扫描目录。
3. ✅ `code-review/SKILL.md:99` 摘要行改为平台中立的 "4-dimension parallel review (Mode A dispatch)"。

Gates（全绿）：`sync:discover` 0 drift（1068 in sync）· `validate-skill` 297/0 · `forge-smoke` 13/13 · `pnpm test` 154/154。
