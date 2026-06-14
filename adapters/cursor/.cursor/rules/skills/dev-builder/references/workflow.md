# dev-builder Workflow（完整步骤）

> **按需读取**：invoke /dev-builder 后，根据 [Initialization] 路由到对应章节再执行。主 SKILL.md 不重复本文。

[Workflow (Initialization Mode)] — Apply [Tech Stack Selection Strategy] and [Online Search Strategy] during implementation.
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

        **Auto-Scaffold** (fast path):
            If `forge-scaffold.mjs` is available, run:
            ```
            node scripts/forge-scaffold.mjs generate <project-dir> --spec Product-Spec.md
            ```
            Exit 0 → project skeleton created (package.json, tsconfig, src/, tests, .gitignore).
            Run `postCommands` (e.g. `pnpm install`), then skip to Git preparation below.
            Exit 1 (unknown stack) → fall through to manual setup below.

        **Manual Setup** (fallback):
        **Environment-First**: Priority is making the project runnable locally before adding features. A project that compiles and starts with zero features is more valuable than one with 10 features that can't run. The local-run loop is AI's verification loop — without it, every change requires human manual deployment to verify, and AI is effectively blind.

        Memory initialization (before project setup):
        1. Create `memory/` directory at project root
        2. Create `memory/project-memory.md` from template, fill with tech stack info from DEV-PLAN.md
        3. Create `memory/decisions-log.md` from template, record ADR-000 for tech stack choice
        4. Create `memory/task-history.md` from template (empty table)
        Naming: lowercase letters + numbers + hyphens.
        **Dev-map sync**: After memory init, read `.forge/dev-map.md`. If its 技术栈节 is empty, fill
        Language / Build / Test / Lint / Source from the confirmed DEV-PLAN.md tech stack table.
        If dev-map.md doesn't exist, create it from template first.
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

    [Catalyst Phase — 放下骨架]
        Phase 1 不是"开始写功能"——它是给整个项目放骨架。

        Step 1: 从 Spec 提取领域骨架
            读 Product-Spec.md，提取：
            - 核心实体 / 领域模型
            - 数据流接口（输入/输出/存储）
            - 核心操作 / Use Case
            - 业务规则和约束

        Step 2: 生成结构锚点（催化剂）
            根据技术栈 + 领域模型，生成 10-15 行的结构锚点。
            锚点 = 一段"能体现本项目代码风格"的核心文件开头。
            比如一个典型的 Entity 定义、一个核心 Use Case 的骨架、一个数据流接口的签名。
            锚点不是完整代码——是告诉模型"这个项目的代码长这样"的 You Are Here 标记。

        Step 3: 放下骨架（写在正式代码之前）
            骨架 = 领域模型 + 核心类型 + Validator 公约 + 错误处理模式 + 中间件链。
            **Phase 1 宁可慢一点把骨架放稳，也不要为了"快点看到功能"而跳过。**
            骨架放好之后，后续所有 Phase 的代码都是自然续写——不需要再重新规划"这个项目的代码该长什么样"。

        Step 4: 进入 Phase 1 开发
            以下一步 Phase 1 的实现就是在这个骨架上生长。
            先写骨架，再写功能。

    [Phase 1 Development]
        Enter the Phase execution workflow in [Continuous Development Mode], starting from Phase 1
        After Phase 1 is verified and completed, apply the same Force Stop rule:
        Agent MUST stop, user must call /dev-builder again for Phase 2.

    [Workflow (Continuous Development Mode)]
    Trigger condition: Has DEV-PLAN.md + has project code

[Zoom-Out Pass] (optional — read-only; Matt Pocock `zoom-out` inspired)
    When user asks to **zoom out**, explain unfamiliar code, or understand module context **before** Phase work:
    Execute references/zoom-out-pass.md — **no code changes** in this pass unless user then invokes normal Phase flow.

[Loading Phase]
        Step 1: Dependency Check
            Execute [Dependency Check]

        Step 2: Load documents and code state
            Read DEV-PLAN.md -> identify next Phase number. Read **MVP Scope** (in scope / out of scope / amendment criteria). Read ONLY current Phase's delivery checklist, **Primary metric**, and key files. Do NOT read other Phases — they are not your concern.
            **Change-Scoped Mode** (when user message or change-manager handoff includes `change-name=<name>`):
            - Read `changes/<name>/proposal.md`, `specs.md`, `design.md`, `tasks.md` — **mandatory**; do not assume Agent will find OpenSpec-style paths without this step
            - Task list source = unchecked boxes in `tasks.md` only
            - Spec compliance source = `specs.md` Delta + Scenarios (G/W/T), then Product-Spec.md for global context
            Read Product-Spec.md -> use as feature reference (**read-only** — do not edit during /dev-builder)
            If Design-Brief.md exists -> read visual direction
            If design tool MCP exists -> prepare to read
            Read memory/ files -> project-memory.md (architecture context), decisions-log.md (past decisions), task-history.md (recent work)
            If `.forge/security-guidance.md` exists -> read before auth/payment/upload/API-boundary Tasks; implement and review against team rules
            If `.forge/project-taste.md` exists -> read for naming/structure/style preferences (soft — S3; not a substitute for Spec acceptance)
            Scan existing code structure -> understand current project state

        Step 3: Determine current Phase
            Display Phase list and completion status
            Identify the next Phase to develop

        Step 4: Baseline snapshot
            Run `pnpm forge-verify --baseline save` to capture current verification state before any code changes. This enables post-Phase baseline comparison.
            If the user specifies a particular Phase -> use that one

        Step 5: Trace init
            Initialize exploration trace for this Phase:
            `node scripts/forge-trace.mjs init <phase-N>`
            This creates `.forge/trace/phase-<N>.json` to record decisions, dead ends, and evidence bindings during development.
            If the script/forge-trace.mjs doesn't exist in the project, skip this step.

        Step 6: Scope declaration (巽 — Filter)
            Declare the Phase's file scope to prevent scope creep:
            `node scripts/forge-scope.mjs init <phase-N> --modify "<files-to-edit>" --readonly "<files-to-read>"`

            Follow the DEV-PLAN.md Phase delivery checklist to determine scope:
            - **--modify**: files/directories this Phase will create or edit (e.g. "src/components/,src/pages/login.tsx")
            - **--readonly**: files/directories this Phase needs to read but NOT edit (e.g. "src/lib/,src/types/")

            If the script/forge-scope.mjs doesn't exist in the project, skip this step.
            Scope is enforced by `forge-verify scope-check` after Phase completion.

        **Loading Phase 结束，进入执行前最后一件事**（注意力放在结尾）:
        - 当前 Phase 编号 + 难度等级（🔴🟡🟢）已确认
        - 交付清单、Primary metric 已加载
        - 关键文件已确认
        - Baseline 已保存
        - Scope 已声明
        - 下一步 → [Phase Execution Flow] Step 0: 感知天理

    [Phase Execution Flow]
        Step 0: 感知天理 — 从已有代码提取本项目代码风格（Phase 2+ 必做）
            Phase 1 的骨架已经在这个项目里了。现在读它。
            扫描 Phase 0 之前已存在的关键文件（领域模型、核心类型、Validator、错误处理），
            理解这个项目的"代码长什么样"：命名风格、错误处理模式、数据流方式、组件组织方式。
            读完之后不用做任何事——只是让模型的注意力激活这些模式。
            这样进入 Step 1 时，模型已经站在"这个项目的代码风格"的上下文里了。
            模型看到后续 Task 时，它会自然续写出符合本项目风格的代码。

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
            0. **Change-Scoped**: If `change-name` set -> re-read `changes/<name>/specs.md` + `design.md` for **this Task** only
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

            9.5 **自审回合（Self-review）**:
                After implementer returns, before any external verification, the main session performs a **single self-review pass** on the generated code.
                Since the code was just written, attention is still hot — issues are easier to spot now than after switching context.

                **自审指令**（追加在同一上下文，不开启新会话）:
                ```
                请评审你刚才生成的代码，重点关注：
                1. 是否有硬编码值或幻觉 API（不存在的函数/参数）？
                2. 错误处理是否完整（不是空 catch 或只 console.error）？
                3. 测试是否覆盖了边界场景（不只有 happy path）？
                4. 代码风格是否与项目现有代码一致？
                ```

                **处理结果**：
                - 发现可自修问题 → 在当前回合直接修复（不需重新 dispatch implementer）
                - 发现需要重构的问题 → 记录，交给下一步 code-review 处理
                - 无问题 → 继续下一步

                **注意**：自审不是 code-review 的替代品。它的目的是用热上下文修复那些"外面 reviewer 也能发现，但修起来更绕路"的浅层问题。深层问题留给 code-review。
            10. **Micro-cycle verify (≤10 min)**: Run the Task's targeted test/lint command; paste **command + pass/fail** in the same message. If the Phase has a **Primary metric**, note whether this Task moves it toward green. No micro-cycle evidence → Task not ready for review.
            11. Read actual code values, verify item by item against design values, correct any deviations (main session may fix only via re-dispatch implementer if code changes needed)
            12. **Spec compliance (tier 1)**: Cross-reference `changes/<name>/specs.md` acceptance + G/W/T when Change-Scoped; else DEV-PLAN Task + Product-Spec.md. Fail -> fix via implementer before tier 2.
            13. **Blast-radius scan**: If dep-graph is available, run `pnpm dep-graph affected <changed-files>` and `pnpm dep-graph risk <changed-files>`. Pass the affected files list to code-reviewer as `affected_files` so the review targets the right scope. Use the risk score to inform `change_complexity`:
                - risk score "low" → change_complexity="simple" (skip parallel agents, quick check only)
                - risk score "medium" or "high" → change_complexity="moderate" or "complex"
            14. **Code quality (tier 2)**: Dispatch code-reviewer with `affected_files` and `change_complexity` set.
                **Anonymous review packet**: Do not pass implementer task narrative or session messages — only Spec excerpts (include `changes/.../specs.md` when Change-Scoped), checklist, diffs, and file contents.
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
