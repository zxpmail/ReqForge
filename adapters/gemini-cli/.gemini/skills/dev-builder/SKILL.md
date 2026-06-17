<!-- forge: dev-builder v1.1 -->
---
name: dev-builder
description: Used when DEV-PLAN.md is ready and the user says to start coding or continue developing the next Phase. Sets up the skeleton for new projects, implements features by Phase for existing projects.
version: 1.1.0
updated: 2026-05-26
requires: []
---

<!-- begin: task -->
[Task]
    **Initialization Mode (0-to-1)**: No code + has DEV-PLAN.md -> set up project skeleton according to tech stack, install dependencies, configure development environment, complete Phase 1.
    **Phase 1 的核心不是"写功能"，是"放骨架"**:
      - 先写领域模型、核心类型定义、数据流接口
      - 再写 Validator 模式、错误处理公约、中间件链
      - 这些就是项目独有的"天理"——牛的骨节结构
      - 后续所有 Phase 的代码都是从这些骨架生长出来的
      - 所以 Phase 1 宁可慢一点把骨架放稳，也不要为了"快点看到功能"而跳过
      - 骨架放好后，后续 Phase 的代码模型自然续写——因为"这个项目的代码长什么样"已经定了

    **Continuous Development Mode**: Has code + has DEV-PLAN.md -> develop by Phase, **one Phase per /dev-builder invocation**. Each Phase: Plan Mode to plan implementation -> per-Task review + commit -> Phase four-step verification -> user confirmation -> **force stop**. User must call /dev-builder again for next Phase.

    **Change-Scoped Mode**: Invoked from `/change-manager apply` with `change-name=<name>` -> read `changes/<name>/` (specs, design, tasks), execute **only** unchecked items in `changes/<name>/tasks.md`. Do not pull unrelated DEV-PLAN Phases. Still uses implementer + TDD + two-tier review per Task.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Fixing bugs in existing code -> use /bug-fixer instead
    - Reviewing code quality -> use /code-review instead
    - Planning development phases -> use /dev-planner instead
    - Gathering requirements -> use /product-spec-builder instead

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Executed automatically as the first step when the Skill starts.

    Required:
    - Product-Spec.md -> if missing, prompt user to call /product-spec-builder first
    - DEV-PLAN.md -> if missing, prompt user to call /dev-planner first
    - All system tools and runtime environments listed in the DEV-PLAN tech stack table

    Optional:
    - Design-Brief.md -> if missing, mark as "no design specification mode"
    - Design tool MCP -> if missing, mark as "no design draft mode"
    - gh CLI -> if available, can automatically create GitHub repo and push
    - playwright -> if available, can do UI automated testing
    - **Dependency Graph** (`dep-graph`) -> if available, enables blast-radius analysis for impact assessment and risk-scored complexity gating

    Installation Strategy:
    - When required dependencies are missing or version requirements not met, the Agent autonomously determines the installation method and installs directly — no manual user operation needed
    - If user permissions or interaction is needed, prompt the user to act
    - When optional dependencies are missing, mark as degraded mode and continue working — do not block the workflow

<!-- end: dependency-check -->
<!-- begin: first-principles -->
[First Principles]
    **编码前必读** `references/first-principles.md`。TDD、implementer 隔离、验证即证据 — 非协商。

<!-- end: first-principles -->
<!-- begin: shared-discipline -->
[Shared Discipline]
    Karpathy 四原则 → `../_shared/karpathy-discipline.md`（全文 `core/docs/behavior-rules.md`）

<!-- end: shared-discipline -->
<!-- begin: hard-gate -->
[HARD-GATE]
    主 Session **MUST NOT** 直接 Write/Edit 业务代码；每 Task dispatch implementer 并创建 `.forge/implementer-session.json`；首次改代码前 **MUST** git worktree。
    机器门与 Session 生命周期 → `../_shared/hard-gate-summary.md`（Hook 拦截为准）

<!-- end: hard-gate -->
<!-- begin: output-style -->
[Output Style]
    → `../_shared/output-style-concise.md`
    → Phase 完成必须附加 `../_shared/output-status-protocol.md`（Status: DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT）

<!-- end: output-style -->
<!-- begin: file-structure -->
[File Structure]
    ```
    dev-builder/
    ├── SKILL.md                    # 入口（本文件）
    ├── commands/dev-builder.md     # 命令摘要
    └── references/
        ├── first-principles.md     # 编码原则（必读）
        ├── workflow.md             # 完整 Workflow（按需）
        ├── development-rules-checklist.md
        ├── development-strategies.md
        ├── anti-rationalization.md
        ├── anti-ai-slop-checklist.md
        ├── sub-agent-isolation.md
        ├── phase-completion-assessment.md
        └── zoom-out-pass.md
    ../_shared/                     # 跨 Skill 共享指针
    ```

<!-- end: file-structure -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **Project code** — Complete project code under the \<project-name\>/ directory
    - **Git commits** — Atomic commits (phase-N: / fix: / feat: / refactor: / chore:)
    - **../../.needs-review** — Review status indicator (clear or needs_review)
    - **memory/task-history.md** — Always append after Task completion (mandatory)
    - **memory/decisions-log.md** — Append when a technical decision was made during the Task
    - **memory/project-memory.md** — Update when architecture facts or constraints change

<!-- end: output-artifacts -->
<!-- begin: development-rules-checklist -->
[Development Rules Checklist]
    **执行前读取** `references/development-rules-checklist.md`

<!-- end: development-rules-checklist -->
<!-- begin: development-strategies -->
[Development Strategies]
    **按需读取** `references/development-strategies.md`

<!-- end: development-strategies -->
<!-- begin: gotchas -->
[Gotchas]
    **Plan-not-loaded**: Starting implementation without reading the current DEV-PLAN.md Phase → building the wrong thing. Always read DEV-PLAN.md first, confirm the Phase and Task, then code.
    **Skipping Environment-First**: Jumping into feature code before the project skeleton compiles and runs. No code on a broken foundation. The first task of any Phase should be making things runnable.
    **Phase scope creep**: "I'll just add this small improvement while I'm coding" → that's how Phases inflate and never finish. One Phase, one goal. Additional improvements go to the feedback channel or next Phase. Before adding scope, check DEV-PLAN **Scope amendment criteria** — no qualifying user evidence, no build.
    **Editing Spec/Plan during build**: Patching Product-Spec.md or DEV-PLAN.md to excuse implementation drift violates the prepare.py boundary. Route scope changes through change-manager or replan.
    **Missing verification**: Completing a Task without compile/func/regression verification. Every Task must have its own mini-verification before Phase Assessment.
    **Difficulty-blind execution**: Every Phase has a **Difficulty** level. 🔴 高 = 怵然为戒，每段代码追加自我评审，动刀甚微；🟢 低 = 快速通过，标准流程即可。不按难度调整行为，就像庖丁遇到筋骨交错还一刀砍过去。执行前先读 Phase 的 Difficulty 字段。
    **Skipping 善刀而藏之**: 做完一个 Phase 不收刀——不在 Spec 追加新发现的难点、不记决策日志、不清理上下文。下一个 Phase 会在上一轮的噪声上启动。杀完牛不等于结束，收刀才是。

<!-- end: gotchas -->
<!-- begin: anti-rationalization-checklist -->
[Anti-Rationalization Checklist]
    **遇阻力时读取** `references/anti-rationalization.md`

<!-- end: anti-rationalization-checklist -->
<!-- begin: phase-completion-assessment -->
[Phase Completion Assessment]
    **Phase 结束 Step 3 必须按此文执行** `references/phase-completion-assessment.md`

<!-- end: phase-completion-assessment -->
<!-- begin: development-dimension-checklist -->
[Dimension Checklist]
    See [references/development-dimension-checklist.md](references/development-dimension-checklist.md) for the full dimension checklist.

    Must-have dimensions:
    - **Code Structure & Modularity**: consistent module layout, clear layer separation
    - **Type Safety**: strict static typing, boundary validation
    - **Error Handling**: categorized errors, async handlers, readable user-facing messages
    - **Testing Coverage**: unit + integration + e2e covering all branches
    - **Security Basics**: input validation, auth, CSRF/XSS protection
    - **API Design Consistency**: uniform endpoints, correct status codes, versioning

<!-- end: development-dimension-checklist -->
<!-- begin: quality-rubric -->
[Quality Rubric]
    10-item, 20-point scoring system. Ship threshold: **≥ 16** with no critical item scoring 0.

    | # | Dimension | Pts | Critical | Scoring |
    |---|-----------|-----|----------|---------|
    | 1 | Spec alignment | 2 | YES | 2 = All implemented behavior matches Product-Spec.md; 1 = Minor deviation in non-core path; 0 = Implementation contradicts spec |
    | 2 | Test coverage | 2 | YES | 2 = Unit + integration + e2e covering all branches and edge cases; 1 = Core paths covered but gaps in error/edge paths; 0 = No tests or critical paths untested |
    | 3 | Code structure | 2 | — | 2 = Modular, clear layer separation, consistent file organization; 1 = Some tangling or inconsistent naming; 0 = Monolithic or chaotic structure |
    | 4 | Type safety | 2 | — | 2 = Strict typing throughout, no `any`, no unsafe casts; 1 = Occasional `any` or loose types in non-critical areas; 0 = Widespread `any` or type errors |
    | 5 | Error handling | 2 | — | 2 = Proper error boundaries, categorized errors, clear user-facing messages; 1 = Async errors caught but no boundary/category; 0 = Uncaught rejections or silent failures |
    | 6 | State management | 2 | — | 2 = Correct data flow, immutable patterns, predictable mutation; 1 = Minor anti-patterns but functional; 0 = Mutations cause stale/incorrect state |
    | 7 | Performance awareness | 2 | — | 2 = Query optimized, bundle size managed, render efficiency considered; 1 = Some inefficiencies but not blocking; 0 = N+1 queries, no memo, large bundles |
    | 8 | Security basics | 2 | YES | 2 = Input validation, auth checks, XSS/CSRF prevention in place; 1 = Validation present but incomplete; 0 = No security measures, injection vectors open |
    | 9 | Git discipline | 2 | — | 2 = Frequent atomic commits, meaningful messages, logical grouping; 1 = Commits bundled or vague messages; 0 = Single mega-commit or no versioned intermediate state |
    | 10 | Phase completion completeness | 2 | YES | 2 = All checklist items addressed, no TODO/FIXME left; 1 = Minor items skipped but documented; 0 = Key deliverables missing or incomplete |
    | 11 | Code minimality | 2 | — | 2 = No dead code, no speculative abstraction, no unused imports/deps, prefers well-maintained small packages over reinventing wheels, avoids pulling heavy deps for trivial use; 1 = Minor over-engineering (< 10% reducible); 0 = Unnecessary abstraction layers, bloated deps, dead code left behind |

    **Scoring**: Run `pnpm validate-skill --score core/skills/dev-builder` to compute.
<!-- end: quality-rubric -->
<!-- begin: workflow -->
[Workflow]
    1. Run [Dependency Check]
    2. Read `references/first-principles.md`
    3. Route via [Initialization] → **必须先 Read `references/workflow.md` 对应章节**，再进入 Phase Execution（未读禁止写业务代码）
       - **Initialization Mode** — greenfield scaffold + Phase 1
       - **Continuous Development Mode** — Loading → Phase Execution → Verification → Force Stop
       - **Change-Scoped Mode** — same Continuous flow; tasks from `changes/<name>/tasks.md` only
    4. Phase 交付前执行 `references/anti-ai-slop-checklist.md` 自检
    5. Optional read-only: `references/zoom-out-pass.md` when user asks zoom out
    6. YOLO (`FORGE_MODE=yolo`) overrides → see `references/workflow.md` § YOLO Mode

<!-- end: workflow -->
<!-- begin: initialization -->
[Initialization]
    Detect project state, route to the corresponding mode:
    - No code + has DEV-PLAN.md -> Initialization Mode
    - Has code + has DEV-PLAN.md -> Continuous Development Mode
    - No DEV-PLAN.md -> prompt to call /dev-planner first
    - No Product-Spec.md -> prompt to call /product-spec-builder first

<!-- end: initialization -->
