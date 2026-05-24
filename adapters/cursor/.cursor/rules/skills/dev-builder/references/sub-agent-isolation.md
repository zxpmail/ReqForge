# 子 Agent 隔离与 Worktree（dev-builder）

<!-- 从 SKILL.md 渐进披露；主流程见 ../SKILL.md -->

[Sub-Agent Isolation — MANDATORY per Task]

每个 DEV-PLAN Task 的实现阶段（RED / GREEN / REFACTOR，Workflow Step 2 第 7–10 步）：

1. **MUST dispatch `implementer` sub-agent** — 主 session 不得在主上下文内直接 `Write`/`Edit` 业务代码。
2. **隔离包** — 仅传递：`task_description`、`deliverables`、`files_to_modify`、`project_context`、`memory_context`（摘录）、`design_specs`（如有）。不得传递主 session 闲聊或上一 Task 失败叙述。
3. **主 session 职责** — TaskCreate、读 Spec/Plan、派发 implementer、收报告、dep-graph、派发 code-reviewer、memory、commit、worktree 清理。
4. **implementer 回报** — `DONE` | `DONE_WITH_CONCERNS` | `BLOCKED` | `NEEDS_CONTEXT`；主 session 在 review 通过后再 commit。

[Worktree — MANDATORY]

Step 2 第 6 步：

- **MUST** 在首次改代码前创建 worktree（`git worktree add .claude/worktrees/<task-slug> <base-branch>`），除非已在 worktree 内（`GIT_DIR != GIT_COMMON_DIR`）。
- 该 Task 全部实现与测试在 worktree 目录完成，合并后 Step 17 清理。

[Rationalizations]

| 借口 | 正确响应 |
|------|----------|
| 「这个 Task 太小，我直接写」 | 小 Task 也要 implementer + worktree；隔离不是可选项。 |
| 「implementer 太慢，主 Agent 更快」 | 快但污染上下文；长跑必漂移。 |
| 「我在主分支只改一行」 | 一行也在 worktree；避免与并行 Task 冲突。 |
| 「implementer 已经用过，这轮我接着写」 | 每个 Task 必须**新的** implementer 实例 + 新鲜包。 |
