<!-- forge: dev-builder v1.0 -->
---
name: dev-builder
description: Used when DEV-PLAN.md is ready and the user says to start coding or continue developing the next Phase. Sets up the skeleton for new projects, implements features by Phase for existing projects.
---

[Task]
    **Initialization Mode**: No code + has DEV-PLAN.md -> set up project skeleton according to tech stack, install dependencies, configure development environment, complete Phase 1.

    **Continuous Development Mode**: Has code + has DEV-PLAN.md -> develop by Phase, **one Phase per /dev-builder invocation**. Each Phase: Plan Mode to plan implementation -> per-Task review + commit -> Phase four-step verification -> user confirmation -> **force stop**. User must call /dev-builder again for next Phase.

[Not For]
    - Fixing bugs in existing code -> use /bug-fixer instead
    - Reviewing code quality -> use /code-review instead
    - Planning development phases -> use /dev-planner instead
    - Gathering requirements -> use /product-spec-builder instead

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

[First Principles]
    **TDD First (RED-GREEN-REFACTOR)**: Tests must be written before functional code. No code without tests is allowed to be committed. This is the quality baseline.
    - **RED**: First write a test that will fail, describing the expected behavior
    - **GREEN**: Write the minimal code to make the test pass
    - **REFACTOR**: After passing, refactor and optimize while keeping the test green
    - This rule is non-negotiable. Any rationalization like "write code first, add tests later" is a violation.

    **Modification Discipline**: Before every code change, assess the impact scope. Think before changing, regression-validate after changing. Don't rush, don't break existing functionality.
    **Blast-Radar**: If the project has a dependency graph (`.forge/graph.json`), run `pnpm dep-graph affected <file>` before changing any file to see what depends on it. Run `pnpm dep-graph risk <file>` to get a data-driven complexity score. Pass the affected files to code-reviewer as `affected_files` so the review focuses on what matters.
    **Glue Code First**: Don't reinvent what already works. Prioritize mature capabilities in order: (1) framework/ SDK built-in, (2) well-maintained open-source library, (3) AI-generated boilerplate via prompt. Only write custom code for business logic, orchestration, and integration glue. If you're implementing something that has an industry-standard solution, you're doing it wrong. WebSearch to confirm availability before deciding to implement yourself.
    **Tool AI-fication Priority**: When selecting tools for AI Agent to use, follow this priority: (1) CLI — AI can directly execute and parse output, (2) MCP Server — protocol-adapted access, (3) Skill/Tool — custom wrapper, (4) GUI — AI cannot use. If a team's ops tool only has a GUI, write a CLI wrapper script before the next development step. Scripts are AI's hands — without them, AI is crippled.
    **Substitute, Don't Mock**: When local environment needs replacements for cloud services (database, queue, storage), use real substitute implementations (H2 for MySQL, in-memory queue for Kafka, local filesystem for S3), not mocks that return hardcoded data. Mocks pass locally but fail in production; real substitutes surface real issues.
    **Online-First**: Rely on real-time information, not outdated memory. Before using external libraries/APIs, prefer **Context7** (`query-docs` / `resolve-library-id`) when installed, then WebSearch; see [development-strategies.md](references/development-strategies.md) Library Docs Strategy and [context7-comparison](https://github.com/zxpmail/ReqForge/blob/main/core/docs/context7-comparison.md).
    **Verification Is Evidence (Hard Gate)**: A completion declaration must include the verification command and its output executed in the same message. "It's done" plus compilation output run in the same message is a valid declaration. "It's done" plus "I compiled it earlier" is an invalid declaration — must re-run. "It's done" with no verification command at all is also an invalid declaration. This is not a suggestion — it is a gate. No on-the-spot verification, no completion.

    **Spec/Plan Read-Only (prepare.py boundary)**: During /dev-builder, treat **Product-Spec.md** and **DEV-PLAN.md** as read-only constraints — like autoresearch's locked `prepare.py`. Do **not** edit them to match implementation drift. Requirement or scope changes → stop and route to `/change-manager` (brownfield) or user-approved `/product-spec-builder` + `/dev-planner` (greenfield). See [autoresearch-comparison.md](../../docs/autoresearch-comparison.md).

    **Task Micro-Cycle (≤10 min)**: After each Task's RED/GREEN/REFACTOR, run a **targeted** verification command within **10 minutes** of the code change and record **command + pass/fail** in the same message before code-reviewer. Aligns with autoresearch's fixed-budget loop and Superpowers TDD — Phase four-step verification remains the outer gate.

    **File Slimming**: Single file should not exceed 300 lines. If it does, split by responsibility. Three lines of simple code are better than one over-engineered abstraction.
    **AI Only for Judgment Tasks**: Deterministic logic (retries, status polling, numeric computation, string formatting) should be plain code, not AI-driven. AI context is expensive and wasted on trivial deterministic tasks. If a task can be expressed as a simple loop, condition, or arithmetic — write it in code, don't reason about it.

    **Token Budget Awareness**: After each Task, proactively assess context usage. Running low on tokens? Suggest `/clear` + checkpoint commit before continuing. Don't let the context window silently fill with logs and search results until the model starts losing precision.

    **Sub-Agent Isolation (MANDATORY)**: Per Task, RED/GREEN/REFACTOR implementation MUST run in a fresh `implementer` sub-agent — main session MUST NOT `Write`/`Edit` under `src/`, `app/`, `lib/`, `packages/`. Main session coordinates, reviews, commits. Details → `references/sub-agent-isolation.md`.

[HARD-GATE]
    Application code edits require the full machine gate chain (enforced by PreToolUse → `spec-before-code-gate.mjs`):
    `Product-Spec.md` + `.forge/spec-confirmed.json` + `DEV-PLAN.md` + `.forge/plan-confirmed.json` + `.forge/implementer-session.json` (written by **implementer** at Task start, removed at Task end).
    Main session MUST NOT create `implementer-session.json` — only the implementer sub-agent may.

    **Tool-Call Offloading**: When a tool call returns large output (2,000+ lines of logs, full-file reads, extensive search results), store the output to a temporary file and keep only essential headers/footers in context. Reference the file path for later use rather than embedding the full content. This prevents context window waste and keeps responses actionable.

[Output Style]
    **Tone**:
    - Like a senior engineer reporting progress: concise, accurate, data-driven
    - Done is done, problems are problems, no ambiguity

    **Principles**:
    - X Never say "should be fine" — either verified and say "passes", or unverified and say "not verified"
    - X Never declare completion without verification
    - X **Fail Loudly** — when uncertain about requirements, API behavior, or impact scope, say "I don't know" explicitly. Never pretend to understand. Ambiguity stated early is fixable; ambiguity hidden is a bug waiting to ship.
    - X Never use soft language to replace verification: "should be fine", "likely passes", "looks correct", "tested earlier" are not evidence
    - X Never cite a verification result from a previous message — each declaration needs fresh evidence run on the spot
    - X Never use external libraries based on outdated memory (search before confirming)
    - [x] Output verification evidence when each Phase completes (compilation output, test results)
    - [x] When blocked, clearly explain the reason and what help is needed
    - [x] Before code changes, state the impact scope; after changes, state regression test results

    **Typical Expressions**:
    - "Phase 3 delivery checklist: all 5 items implemented. tsc --noEmit zero errors. Dev server starts normally."
    - "This change will affect left-sidebar.tsx and app-layout.tsx. Assessing before proceeding."
    - "This feature is already built into the SDK (confirmed via WebSearch), no need to implement it ourselves."
    - "Compilation passes but API returns 500. Need to investigate the migration logic in db.ts."

[File Structure]
    ```
    dev-builder/
    ├── SKILL.md                           # 主流程（本文件）
    └── references/                        # 渐进披露：规范、策略、验证清单
        ├── development-rules-checklist.md
        ├── development-strategies.md
        ├── anti-rationalization.md
        ├── sub-agent-isolation.md
        └── phase-completion-assessment.md
    ```

[Output Artifacts]
    - **Project code** — Complete project code under the \<project-name\>/ directory
    - **Git commits** — Atomic commits (phase-N: / fix: / feat: / refactor: / chore:)
    - **../../.needs-review** — Review status indicator (clear or needs_review)
    - **memory/task-history.md** — Always append after Task completion (mandatory)
    - **memory/decisions-log.md** — Append when a technical decision was made during the Task
    - **memory/project-memory.md** — Update when architecture facts or constraints change

[Development Rules Checklist]
    编码期必须遵守的规范（代码标准、目录结构、数据库、Git、进程管理等）。
    **执行前读取** references/development-rules-checklist.md；Continuous Development Mode Step 2 引用此清单。


[Development Strategies]
    Plan Mode、设计稿对照、在线搜索、技术栈选择等策略。
    **按需读取** references/development-strategies.md。


[Gotchas]
    **Plan-not-loaded**: Starting implementation without reading the current DEV-PLAN.md Phase → building the wrong thing. Always read DEV-PLAN.md first, confirm the Phase and Task, then code.
    **Skipping Environment-First**: Jumping into feature code before the project skeleton compiles and runs. No code on a broken foundation. The first task of any Phase should be making things runnable.
    **Phase scope creep**: "I'll just add this small improvement while I'm coding" → that's how Phases inflate and never finish. One Phase, one goal. Additional improvements go to the feedback channel or next Phase.
    **Editing Spec/Plan during build**: Patching Product-Spec.md or DEV-PLAN.md to excuse implementation drift violates the prepare.py boundary. Route scope changes through change-manager or replan.
    **Missing verification**: Completing a Task without compile/func/regression verification. Every Task must have its own mini-verification before Phase Assessment.

[Anti-Rationalization Checklist]
    常见「合理借口」与正确回应。
    **遇阻力时读取** references/anti-rationalization.md。


[Phase Completion Assessment]
    Phase 结束四步验证 + 迭代循环 + Phase Summary 模板。
    **Step 3 必须按此文执行** references/phase-completion-assessment.md。


[Workflow (Initialization Mode)]
    Trigger condition: Has DEV-PLAN.md, no project code

    [Startup Phase]
        Step 1: Dependency Check
            Execute [Dependency Check]

        Step 2: Load documents
            Read Product-Spec.md -> extract product overview, core features
            Read DEV-PLAN.md -> extract tech stack table, Phase 1 content, database tables (if any)
            If Design-Brief.md exists -> read color direction, information density (for configuring Tailwind theme)
            If design tool MCP exists -> read design data for Phase 1 related pages

    [Technical Solution Phase]
        Apply [Tech Stack Selection Strategy]
        Confirm the plan according to the DEV-PLAN.md tech stack table
        WebSearch to verify framework versions and key dependency compatibility
        If multiple reasonable options exist -> present 2-3 options for the user to choose

    [Project Setup Phase]
        Initialize the project in the <project-name>/ subfolder, not in the root directory.

        **Environment-First**: Priority is making the project runnable locally before adding features. A project that compiles and starts with zero features is more valuable than one with 10 features that can't run. The local-run loop is AI's verification loop — without it, every change requires human manual deployment to verify, and AI is effectively blind.

        Memory initialization (before project setup):
        1. Create `memory/` directory at project root
        2. Create `memory/project-memory.md` from template, fill with tech stack info from DEV-PLAN.md
        3. Create `memory/decisions-log.md` from template, record ADR-000 for tech stack choice
        4. Create `memory/task-history.md` from template (empty table)
        Naming: lowercase letters + numbers + hyphens.
        Execute initialization based on tech stack:
        - TypeScript project -> configure strict mode, install dependencies, configure Tailwind, configure environment variables
        - Java project -> use Spring Initializr or Gradle/Maven to initialize skeleton
        - Go project -> go mod init, create directories according to Go project structure
        - Rust project -> cargo init, create directories according to Rust project structure
        - Python project -> use framework CLI to initialize (fastapi dev / django-admin startproject), create pyproject.toml or requirements.txt

        Git preparation:
        1. Root directory git init + create .gitignore (exclude planning documents, design resources, environment variables, build artifacts)
        2. Ensure gh CLI is available and authenticated (install if not installed, guide user through `gh auth login` if not authenticated)
        3. Create GitHub **private** repo and link remote
        4. First commit + push

    [Phase 1 Development]
        Enter the Phase execution workflow in [Continuous Development Mode], starting from Phase 1
        After Phase 1 is verified and completed, apply the same Force Stop rule:
        Agent MUST stop, user must call /dev-builder again for Phase 2.

[Workflow (Continuous Development Mode)]
    Trigger condition: Has DEV-PLAN.md + has project code

    [Loading Phase]
        Step 1: Dependency Check
            Execute [Dependency Check]

        Step 2: Load documents and code state
            Read DEV-PLAN.md -> identify next Phase number. Read ONLY that Phase's delivery checklist, **Primary metric**, and key files. Do NOT read other Phases — they are not your concern.
            Read Product-Spec.md -> use as feature reference (**read-only** — do not edit during /dev-builder)
            If Design-Brief.md exists -> read visual direction
            If design tool MCP exists -> prepare to read
            Read memory/ files -> project-memory.md (architecture context), decisions-log.md (past decisions), task-history.md (recent work)
            Scan existing code structure -> understand current project state

        Step 3: Determine current Phase
            Display Phase list and completion status
            Identify the next Phase to develop
            If the user specifies a particular Phase -> use that one

    [Phase Execution Flow]
        Step 1: Plan + TaskList
            This step is a prerequisite for coding, cannot be skipped, does not require user confirmation. No code can be written without a Plan and TaskList.
            1. Read the Phase's delivery checklist and key files
            2. If design tool MCP is connected, view the pages involved in this Phase, read exact values. If no design tool, use Design-Brief.md or Product-Spec.md as reference
            3. Explore existing code, understand the current structure
            4. Plan implementation steps, clarify what to do first, what to do next
            5. Use TaskCreate to list specific task inventory — one Task per page, component, or feature
            6. Once TaskList is ready, proceed directly to Step 2 — no need to wait for user confirmation

        Step 2: Per-Task Implementation + Single Task Review Loop

            For each Task, execute the following loop:

            Before development — load reference documents:
            1. Read the delivery checklist and key files corresponding to this Task from DEV-PLAN.md
            2. Read the feature description for this Task from Product-Spec.md
            3. Read the visual direction and page notes for this Task from Design-Brief.md
            4. If design tool MCP is connected, find the design page corresponding to this Task through the design tool, read the exact values for that page and its components. Re-read for each Task, don't rely on memory
            5. Clarify the delivery goal for this Task: what functionality to implement, what visual result to achieve

            Worktree isolation (before coding):
            6. **Worktree (MANDATORY)**: Before any code changes, create an isolated worktree unless already inside one:
               - `git worktree add .claude/worktrees/<task-name> <base-branch>`
               - All implementation for this Task happens in the worktree — not on main checkout
               - If `GIT_DIR != GIT_COMMON_DIR` → already in a worktree; skip create
               - No git repo → document in task report; still MUST use implementer (no main-session app edits)

            Sub-agent implementation (TDD — steps 7–9 MUST NOT run in main session):
            7. **Dispatch implementer** with isolated packet (see `references/sub-agent-isolation.md`). Implementer MUST create `.forge/implementer-session.json` before any app `Write`/`Edit` and remove it when the Task ends. Implementer runs:
               - **RED**: failing test first
               - **GREEN**: minimal pass
               - **REFACTOR**: keep green
            8. Main session: receive implementer report; if `BLOCKED` or `NEEDS_CONTEXT` → resolve before review
            9. Main session MUST NOT `Write`/`Edit` application source for this Task (steps 7–9 belong to implementer only)

            After implementer returns — cross-reference validation + Review loop:
            10. **Micro-cycle verify (≤10 min)**: Run the Task's targeted test/lint command; paste **command + pass/fail** in the same message. If the Phase has a **Primary metric**, note whether this Task moves it toward green. No micro-cycle evidence → Task not ready for review.
            11. Read actual code values, verify item by item against design values, correct any deviations (main session may fix only via re-dispatch implementer if code changes needed)
            12. Cross-reference Product-Spec.md to confirm functional behavior matches description
            13. **Blast-radius scan**: If dep-graph is available, run `pnpm dep-graph affected <changed-files>` and `pnpm dep-graph risk <changed-files>`. Pass the affected files list to code-reviewer as `affected_files` so the review targets the right scope. Use the risk score to inform `change_complexity`:
                - risk score "low" → change_complexity="simple" (skip parallel agents, quick check only)
                - risk score "medium" or "high" → change_complexity="moderate" or "complex"
            14. Dispatch code-reviewer with `affected_files` and `change_complexity` set.
                **Anonymous review packet**: Do not pass implementer task narrative or session messages — only Spec excerpts, checklist, diffs, and file contents.
                **Default `change_complexity`**: `simple` unless the Task touches multiple modules, new public APIs, auth/payments/data migration, or dep-graph risk is medium/high — then use `moderate` or `complex`.
                code-reviewer also cross-references Product-Spec.md, Design-Brief.md, DEV-PLAN.md, and design drafts.

            14.5 **Retry gate check** (before processing review results):
               - Read `.forge/.retry-counter.json` (create with `{"state":"resolved","retries":0}` if absent)
               - If `state == "escalated"` -> STOP loop immediately. Present escalation options to user per [Retry Escalation]. Do NOT auto-retry.
               - If `state == "active"` and `retries >= max_retries` -> set `state="escalated"`, then escalate per [Retry Escalation]. Do NOT continue the auto-fix loop.
               - Otherwise -> proceed to process review results normally.

            14. Confirmed spec/completeness issues (design agent, confidence >= 0.6):
               a. Increment retry counter: read `.forge/.retry-counter.json`, set `retries += 1`, record the failure in `history[]` with `trigger="review_spec_fail"`, set `state="active"`
               b. dispatch feedback-observer with trigger_reason="review_spec_fail", current_skill="dev-builder", ai_action=[what was missing]
               c. fill in the implementation
               d. If retry_count < max_retries -> re-dispatch code-reviewer (go back to step 14)
               e. If retry_count >= max_retries -> set state="escalated", escalate to user per [Retry Escalation]

            15. Confirmed bug/security/type issues:
               a. Increment retry counter: read `.forge/.retry-counter.json`, set `retries += 1`, record the failure in `history[]` with `trigger="review_quality_fail"`, set `state="active"`
               b. dispatch feedback-observer with trigger_reason="review_quality_fail", current_skill="dev-builder", ai_action=[quality issue]
               c. call bug-fixer to fix
               d. If retry_count < max_retries -> re-dispatch code-reviewer (go back to step 14)
               e. If retry_count >= max_retries -> set state="escalated", escalate to user per [Retry Escalation]

            16. Review passes (no confirmed HIGH issues):
               a. Clear retry counter: write `{"state":"resolved","retries":0,"task":null,"phase":null,"last_failure":null,"last_error":null,"history":[],"max_retries":3}` to `.forge/.retry-counter.json`
               b. TaskUpdate mark complete
               c. execute `echo clean > ../../.needs-review` to clear review status
               d. update memory files
               e. commit
            17. **Cleanup worktree**: If a worktree was created in step 6, remove it after merge:
                - `git worktree remove .claude/worktrees/<task-name>`
                - If the worktree directory was created outside git (no `git worktree add` was used), just `rm -rf` it
            18. Proceed to the next Task

            **[Retry Escalation]**
            When retry_count reaches max_retries (default: 3), or state is "escalated", the auto-fix loop stops and escalates to the user:

              Present exactly three options — do NOT auto-continue:
              A) **Manual fix** -> user fixes the issue themselves, then re-dispatches code-reviewer. After user confirms fix, reset counter: write {"state":"resolved","retries":0} to `.forge/.retry-counter.json`, then re-dispatch code-reviewer.
              B) **Skip task** -> mark task as deferred in `memory/task-history.md`, reset retry counter, move to next Task. Do not leave the session stuck.
              C) **Adjust approach** -> user provides new guidance (different implementation strategy, different tech, etc.). Reset retry counter, restart the Task loop from the beginning.

              State remains "escalated" until user picks an option.
              Do NOT auto-retry while in "escalated" state — the `.forge/.retry-counter.json` state file and the retry-gate hook enforce this.

            **Task Time Limit**: Each Task should take ≤15 minutes of coding. If a Task exceeds this, it's too large — split it into smaller Tasks. Large Tasks accumulate risk and make rollback expensive.

            **Memory Update Step** (mandatory after every Task completion):
            - Append to `memory/task-history.md`: date, phase, type (feat/fix/refactor), description, changed files, notes
            - If a technical decision was made: append ADR-N to `memory/decisions-log.md`
            - If architecture facts or constraints changed: update `memory/project-memory.md`
            - **Query filing (LLM Wiki discipline)**: trade-off discussions, rejected alternatives, or non-obvious rationale from this Task → must land in ADR or `project-memory.md`, not only in chat
            - This step is NOT optional. A Task is not complete until memory is updated.

            Always follow during coding:
            - All rules in [Development Rules Checklist]
            - [Modification Discipline]: assess impact before every change
            - [Online Search Strategy]: confirm API before using external libraries
            - When blocked, state clearly — don't force through

        Step 3: Phase Completion Verification
            After all Tasks are complete, execute the four-step verification in [Phase Completion Assessment]
            This is the final confirmation, ensuring all Task code together compiles, runs, and functions completely
            Before verification, rebuild the dependency graph: `pnpm dep-graph build` (if available)
            Attach evidence for each step
            If not passed, fix the issues found → **restart the entire four-step verification from Step 1**
            One pass is rarely enough — repeat until all four steps pass clean with no issues found

        Step 4: User Confirmation
            Report Phase completion status to the user, with evidence
            User confirms OK -> Phase complete
            User has revision requests -> make changes and re-run Step 3

        Step 5: Session Handoff
            Phase complete. Before stopping, check if a session handoff would be useful:

            1. Count messages in this session or estimate context usage. If near token limits or the session has been long, generate `memory/handoff.md` using the handoff template at `core/templates/memory/handoff-template.md`
            2. The handoff document must include: current Phase completed, next Phase name, key decisions (ADRs), known issues, changed files
            3. Update **PROJECT-HEALTH.md** at project root (user projects only — see [Phase Completion Assessment] PROJECT-HEALTH step). One-screen status for the next session.
            4. Suggest `/clear` to the user after handoff is generated

            This preserves progress and prevents the "lost memory" problem when context resets.

        Step 6: Force Stop — One Phase Per Invocation
            Phase complete. Output to user:
            "✅ **Phase N verified and complete.**
             Next up: Phase N+1. Invoke **/dev-builder** to continue."

            **Hard rules**:
            - Agent MUST stop here. Do NOT start the next Phase.
            - Do NOT read the next Phase's content or pre-plan.
            - Do NOT write any code for the next Phase.
            - The user must call `/dev-builder` again to enter the next Phase.
            - These rules apply even if the user says "continue" or "go ahead".
            - One Phase per invocation — this is not negotiable.

[YOLO Mode]
    When FORGE_MODE=yolo, 🟢 Green and 🟡 Yellow actions proceed automatically. 🔴 Red actions ALWAYS require user confirmation, even in YOLO mode.

    All user confirmation gates switch to async write mode for 🟢/🟡 actions:
        Report the four-step verification results to the file, mark Phase as complete.

    **Step 5 (Force Stop)** -> Write `changes/<phase>/checkpoint.md`:
        Record current Phase status, artifact paths, and next Phase name.
        Continue to the next Phase automatically.
        The async files serve as a run log for later review and feed the evolution engine.

    **Phase delivery checklist** -> Write `changes/<phase>/delivery-checklist.md`:
        Cross-reference each item, mark pass/fail, attach evidence.

    **[Retry Escalation] in YOLO mode** -> 🔴 Red action. Even in YOLO mode, escalation requires user confirmation:
        The auto-fix loop exhausted its retries — this is not a routine pass-through gate but a failure requiring human judgment.
        Present the same three options (A/B/C) and wait for the user to choose.
        Do NOT auto-select "Skip" or any other option.

[Initialization]
    Detect project state, route to the corresponding mode:
    - No code + has DEV-PLAN.md -> Initialization Mode
    - Has code + has DEV-PLAN.md -> Continuous Development Mode
    - No DEV-PLAN.md -> prompt to call /dev-planner first
    - No Product-Spec.md -> prompt to call /product-spec-builder first
