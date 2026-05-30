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
    **Initialization Mode**: No code + has DEV-PLAN.md -> set up project skeleton according to tech stack, install dependencies, configure development environment, complete Phase 1.

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
    机器门与 Session 生命周期 → `../_shared/hard-gate-summary.md`（Hook 拦截为准）

<!-- end: hard-gate -->
<!-- begin: output-style -->
[Output Style]
    → `../_shared/output-style-concise.md`

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

<!-- end: gotchas -->
<!-- begin: anti-rationalization-checklist -->
[Anti-Rationalization Checklist]
    **遇阻力时读取** `references/anti-rationalization.md`

<!-- end: anti-rationalization-checklist -->
<!-- begin: phase-completion-assessment -->
[Phase Completion Assessment]
    **Phase 结束 Step 3 必须按此文执行** `references/phase-completion-assessment.md`

<!-- end: phase-completion-assessment -->
<!-- begin: workflow -->
[Workflow]
    1. Run [Dependency Check]
    2. Read `references/first-principles.md`
    3. Route via [Initialization] → **必须先 Read `references/workflow.md` 对应章节**，再进入 Phase Execution（未读禁止写业务代码）
       - **Initialization Mode** — greenfield scaffold + Phase 1
       - **Continuous Development Mode** — Loading → Phase Execution → Verification → Force Stop
       - **Change-Scoped Mode** — same Continuous flow; tasks from `changes/<name>/tasks.md` only
    4. Optional read-only: `references/zoom-out-pass.md` when user asks zoom out
    5. YOLO (`FORGE_MODE=yolo`) overrides → see `references/workflow.md` § YOLO Mode

<!-- end: workflow -->
<!-- begin: initialization -->
[Initialization]
    Detect project state, route to the corresponding mode:
    - No code + has DEV-PLAN.md -> Initialization Mode
    - Has code + has DEV-PLAN.md -> Continuous Development Mode
    - No DEV-PLAN.md -> prompt to call /dev-planner first
    - No Product-Spec.md -> prompt to call /product-spec-builder first

<!-- end: initialization -->
