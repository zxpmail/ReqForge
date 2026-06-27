# 子 Agent 隔离与 Worktree（dev-builder）

<!-- 从 SKILL.md 渐进披露；主流程见 ../SKILL.md -->

[Sub-Agent Isolation — CONDITIONAL per Phase Nature]

每个 DEV-PLAN Task 的隔离决策**取决于当前 Phase 的 Nature 字段**（详见 `workflow.md` § Nature Gate）：

| Phase Size | Phase Nature | Implementer? | Worktree? | 说明 |
|-----------|-------------|-------------|-----------|------|
| **Small** | any | ❌ 跳过 | ❌ 跳过 | ≤3 key files + ≤5 deliverables — 主 session 直接写（Dogfood #3 验证） |
| **Standard** | **Backend** | ✅ 强制 dispatch | ✅ 强制 | 服务端逻辑、API、DB — 安全隔离 |
| **Standard** | **Data** | ✅ 强制 dispatch | ✅ 强制 | Schema、迁移、数据管道 |
| **Standard** | **UI** | ❌ 跳过 | ❌ 跳过 | 主 session 直接写（更快，Dogfood #2 验证） |
| **Standard** | **Integration** | ❌ 跳过 | ❌ 跳过 | Glue 代码、配置、简单接线 |
| (未指定) | *(无 Nature 字段)* | ✅ 默认 dispatch | ✅ 默认 | 向后兼容 |

**Size** 由 `workflow.md` § Nature Gate Step 1.5 定义：读取当前 Phase 的 Key Files 和 Deliverables 条数，≤3 key files **且** ≤5 deliverables 为 Small，否则 Standard。

当 Size = Standard 且 Nature = Backend/Data 时，以下规则适用（原 MANDATORY 规则）：

1. **MUST dispatch `implementer` sub-agent** — 主 session 不得在主上下文内直接 `Write`/`Edit` 业务代码。
2. **隔离包** — 仅传递：`task_description`、`deliverables`、`files_to_modify`、`project_context`、`memory_context`（摘录）、`design_specs`（如有）。不得传递主 session 闲聊或上一 Task 失败叙述。
3. **主 session 职责** — TaskCreate、读 Spec/Plan、派发 implementer、收报告、dep-graph、派发 code-reviewer、memory、commit、worktree 清理。
4. **implementer 回报** — `DONE` | `DONE_WITH_CONCERNS` | `BLOCKED` | `NEEDS_CONTEXT`；主 session 在 review 通过后再 commit。

[Worktree — CONDITIONAL per Phase Nature]

Step 2 第 6 步：

- 当 Phase Nature = Backend/Data 时：**MUST** 在首次改代码前创建 worktree（`git worktree add .claude/worktrees/<task-slug> <base-branch>`），除非已在 worktree 内（`GIT_DIR != GIT_COMMON_DIR`）。该 Task 全部实现与测试在 worktree 目录完成，合并后 Step 17 清理。
- 当 Phase Nature = UI/Integration 时：**跳过 worktree**。主 session 直接在项目目录写代码。

[Rationalizations]

| 借口 | 正确响应 |
|------|----------|
| 「这个 Task 太小，我直接写」 | 看 Phase Nature。UI/Integration → 可以，直接写。Backend/Data → 不行，dispatch implementer。 |
| 「implementer 太慢，主 Agent 更快」 | 看 Phase Nature。UI → 确实，所以 UI Phase 跳过 implementer。Backend → 必须隔离，长跑必漂移。 |
| 「我在主分支只改一行」 | 一行也要 worktree（Backend/Data Phase）。UI Phase 没有 worktree 要求。 |
| 「implementer 已经用过，这轮我接着写」 | 每个 Task 必须**新的** implementer 实例 + 新鲜包（Backend/Data Phase 适用）。 |

[Platform Execution Modes]

「Dispatch `implementer` / `code-reviewer` sub-agent」假设平台支持**隔离子 agent**（Mode A）。各平台能力不同，按 `code-review/references/multi-perspective-dispatch.md` §执行方式 的两模式理解：

- **Mode A（原生隔离子 agent）** — Claude Code（`Task`/`Agent` + `agents/*.md`）、OpenCode（`mode: subagent` + `@agent`）、Gemini CLI（Subagents，v0.38.1+，`.gemini/agents/*.md`）、Cursor（Subagents，2.4+，adapter 打到 `.cursor/agents/`）。**截至 2026-06，四个目标平台均默认 Mode A（能力）。** 隔离保证成立：主 session 不碰业务代码，implementer 在独立上下文跑。
  - ✅ **打包已跨平台**：primary agent（`implementer` 等）在 core 保留 `model: opus`（Claude Code 质量强制）；`sync.ts` 的 `adaptAgentContent()` 对非 Claude adapter 自动把 `opus`/`sonnet`/`haiku` 规范为 `inherit`（四平台合法），故隔离保证在所有平台成立。
- **Mode B（单上下文，无隔离子 agent）** — **回退场景**：旧版本（subagents 发布前）、subagents 被禁用（如 Gemini CLI `experimental.enableAgents:false`）、或主动选单上下文以规避并发可靠性问题。此时没有独立子 agent 上下文，"主 session 不得 Write/Edit 业务代码"这条**无法强制**。退化为：implementer/code-reviewer 阶段作为主上下文里一段**自包含、有明确起止的 pass**，保留「隔离包」契约（只传规定字段、不传闲聊/失败叙述），但放弃进程级隔离。

> ⚠️ Mode B 是已知让步的回退路径，不是等效。隔离强度低于 Mode A——长 Task 上下文污染风险更高。adapter 维护者按平台当前版本核实能力映射（详见 `code-review/references/multi-perspective-dispatch.md`）。
