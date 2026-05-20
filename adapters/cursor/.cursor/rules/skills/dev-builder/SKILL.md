<!-- forge: dev-builder v1.0 -->
---
name: dev-builder
description: Used when DEV-PLAN.md is ready and the user says to start coding or continue developing the next Phase. Sets up the skeleton for new projects, implements features by Phase for existing projects.
---

[Task]
    **Initialization Mode**: No code + has DEV-PLAN.md -> set up project skeleton according to tech stack, install dependencies, configure development environment, complete Phase 1.

    **Continuous Development Mode**: Has code + has DEV-PLAN.md -> develop by Phase, **one Phase per /dev-builder invocation**. Each Phase: Plan Mode to plan implementation -> per-Task review + commit -> Phase four-step verification -> user confirmation -> **force stop**. User must call /dev-builder again for next Phase.

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
    **SDK-First**: Don't reinvent what the framework and SDK already provide. WebSearch to confirm whether the SDK already supports it before implementing.
    **Online-First**: Rely on real-time information, not outdated memory. Before using external libraries/APIs, WebSearch to confirm current version usage and compatibility.
    **Verification Is Evidence (Hard Gate)**: A completion declaration must include the verification command and its output executed in the same message. "It's done" plus compilation output run in the same message is a valid declaration. "It's done" plus "I compiled it earlier" is an invalid declaration — must re-run. "It's done" with no verification command at all is also an invalid declaration. This is not a suggestion — it is a gate. No on-the-spot verification, no completion.
    **File Slimming**: Single file should not exceed 300 lines. If it does, split by responsibility. Three lines of simple code are better than one over-engineered abstraction.
    **AI Only for Judgment Tasks**: Deterministic logic (retries, status polling, numeric computation, string formatting) should be plain code, not AI-driven. AI context is expensive and wasted on trivial deterministic tasks. If a task can be expressed as a simple loop, condition, or arithmetic — write it in code, don't reason about it.

    **Token Budget Awareness**: After each Task, proactively assess context usage. Running low on tokens? Suggest `/clear` + checkpoint commit before continuing. Don't let the context window silently fill with logs and search results until the model starts losing precision.

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
    └── SKILL.md                           # Main Skill Definition (this file)
    ```

[Output Artifacts]
    - **Project code** — Complete project code under the \<project-name\>/ directory
    - **Git commits** — Atomic commits (phase-N: / fix: / feat: / refactor: / chore:)
    - **../../.needs-review** — Review status indicator (clear or needs_review)
    - **memory/task-history.md** — Always append after Task completion (mandatory)
    - **memory/decisions-log.md** — Append when a technical decision was made during the Task
    - **memory/project-memory.md** — Update when architecture facts or constraints change

[Development Rules Checklist]
    All rules that must be followed during coding, organized by category.

    [Code Standards]
        - Single file does not exceed 300 lines, split by responsibility if it does
        - TypeScript strict mode, no `any` (use `unknown` + type guards)
        - Naming: Components PascalCase, functions/variables camelCase, files kebab-case, constants UPPER_SNAKE_CASE
        - Each file has a single responsibility with a clear external interface
        - Prefer pure functions; isolate side effects into dedicated layers (hooks, API routes)
        - React prefers function components + Hooks, no class components
        - Styles prefer Tailwind, don't write custom CSS unless Tailwind can't achieve it
        - No unrelated refactoring — only touch what needs changing, don't "fix up" other things
        - Follow the existing codebase style — don't force your own preferences
        - YAGNI: Don't write code for hypothetical future requirements

    [Project Structure Standards]
        Project code goes in a subfolder named after the project, not flat in the root. The root directory only holds planning documents, design resources, and framework definition directories.

        ```
        project/
        ├── Product-Spec.md         # Root directory, not in git
        ├── DEV-PLAN.md             # Root directory, not in git
        ├── <project-name>/         # Project code folder
        │   ├── src/
        │   ├── package.json
        │   └── ...
        └── Framework definition directory  # .claude/ (Claude Code) /.cursor/rules/ (Cursor) /.opencode/ (OpenCode)
        ```

        Internal project folder structure prefers the official framework scaffolding default layout.
        If the project already has code -> keep the existing structure, don't force reorganization.
        If generating from scratch with official scaffolding -> use the framework-recommended layout, no additional directory structure adjustments.

        Below are typical structures for each framework for reference (not mandatory templates):

        **Node.js Full-Stack (Next.js) — `create-next-app` default**:
        ```
        src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx
        │   └── api/
        ├── components/
        └── public/
        ```

        **React Frontend (Vite) — `create-vite` default + common additions**:
        ```
        src/
        ├── components/
        ├── hooks/
        ├── routes/           -> react-router routes (if used)
        ├── lib/
        └── public/
        ```

        **Java / Spring Boot — `spring init` default**:
        ```
        src/main/java/com/company/project/
        ├── controller/
        ├── service/
        ├── repository/
        ├── model/
        └── Application.java
        ```

        **Go — Official recommended layout (golang-standards)**:
        ```
        cmd/                   -> main.go entry point
        internal/              -> Internal packages not exposed externally
        pkg/                   -> Exported shared packages (if any)
        go.mod
        ```

        **Rust — `cargo new` default + common additions**:
        ```
        src/
        ├── main.rs
        ├── lib.rs
        ├── routes/
        └── models/
        Cargo.toml
        ```

        **Python / FastAPI — `fastapi dev` scaffold default**:
        ```
        src/
        ├── main.py
        ├── routers/
        ├── models/
        └── core/
        ```

        **General Principles** (these are more important than specific directory structures):
        - Framework scaffold defaults are best practices — don't invent new directory structures
        - Existing projects follow the existing style, don't force reorganization
        - Each file has a clear single responsibility
        - Files that change together stay together (group by feature, not by technical layer)

    [Code Structure and Design Principles]
        **Module Design**:
        - Each module has a clear boundary and external interface
        - Someone can understand what the module does and how to use it without reading the internal implementation
        - Can swap the internal implementation without affecting callers
        - Can be understood and tested independently

        **Split Signals** (when to split):
        - File exceeds 300 lines
        - A function/component does 3+ different things
        - Changing one feature requires touching 5+ files simultaneously (too tightly coupled)

        **Don't Split Signals** (when not to split):
        - Small amount of code with logical cohesion
        - Splitting would require jumping between multiple files unnecessarily
        - Splitting just to "look tidy" (over-abstraction)

    [Database Structure Standards]
        - Table names snake_case, field names snake_case
        - Every table must have id (primary key), created_at, updated_at
        - When storing JSON in TEXT, annotate the JSON structure in code comments
        - Fields with default values must declare DEFAULT in the schema
        - Migrations use ALTER TABLE, check if column/table already exists before executing
        - No bare SQL string concatenation in code (use parameterized queries to prevent injection)
        - Index strategy: add indexes for frequently queried fields, but don't over-index
        - Table relationships must be documented in the Phase delivery checklist

    [Environment Variables and Security]
        - Vite's VITE_ prefixed variables are exposed to the browser — cannot put API Keys
        - Next.js variables without NEXT_PUBLIC_ prefix are server-only — safe
        - AI API calls must go through the server side (Next.js API route or Express), not the browser
        - .env.example committed as a template to Git, .env.local holds actual values (.gitignore)
        - Never hardcode any keys, paths, or personal information in code

    [Extensibility and Maintainability]
        - Configuration over hardcoding: extract values that may change into constants or configuration
        - Interface over implementation: depend on abstractions (TypeScript interface), not concrete implementations
        - Progressive enhancement: get core features working first, add enhancements later
        - Layered error handling: component layer catches and displays UI, service layer catches and logs
        - Don't over-engineer for the future: build what's needed now

    [Quality Thresholds]
        Every feature implementation must satisfy:
        - [x] Happy path works correctly
        - [x] Error path has clear error messages
        - [x] Loading state (asynchronous operations have loading indicators)
        - [x] Empty state (no-data state has guidance)
        - [x] Basic input validation (required fields, format)
        - [x] No sensitive information hardcoded

    [Modification Discipline]
        Before every code change, execute:
        1. Assess impact scope: what existing features will this change affect? List them
        2. Check side effects: especially CSS (overflow-hidden clipping popovers, z-index stacking, flex-shrink layout)
        3. Think then change: confirm the approach won't break existing features before proceeding
        4. Regression validation: after changes, not only test the new feature but also verify related existing features

    [Git Workflow]
        Atomic commits:
        - Commit after each independent feature is complete, don't accumulate until Phase end
        - One commit should contain only one logical change (one feature, one fix, one config change)
        - A Phase may have multiple commits; no need for a summary commit at Phase completion

        Commit message convention:
        - Phase development: `phase-N: feature description`
        - Bug fix: `fix: issue description`
        - New feature: `feat: feature description`
        - Refactor: `refactor: description`
        - Config/dependencies: `chore: description`

        Push strategy:
        - Push to remote immediately after each commit
        - Confirm the current branch is correct before pushing
        - If remote is not configured -> remind the user to configure it first

        Commit threshold:
        - Minimum threshold for atomic commit: compiles (tsc --noEmit zero errors)
        - Phase completion threshold: all four steps pass
        - No commit allowed if compilation fails

    [Process Management]
        Before each start/restart of dev server:
        - Determine the dev server process name and port number based on the project tech stack
        - Kill any process occupying that port, wait 2 seconds to ensure the port is released
        - Confirm that only 0 or 1 dev server instance is running, prevent multi-instance conflicts

[Development Strategies]
    Methodologies during coding, use as needed.

    **Plan Mode Strategy**
    Before each Phase starts, must enter Plan Mode and list the TaskList. This is a prerequisite for coding and cannot be skipped.
    1. Read the Phase's delivery checklist and key files from DEV-PLAN.md
    2. Explore existing code structure, understand the current state
    3. Plan the specific implementation steps, clarify what to change first, what to change next, which files need to be created or modified
    4. Use TaskCreate to break implementation steps into specific Tasks — one Task per page, component, or feature
    5. Once the TaskList is ready, start coding directly — no need to wait for user confirmation

    Prohibited: writing code directly without a Plan and TaskList.
    Plan Mode is responsible for "how to implement this Phase"; DEV-PLAN.md is responsible for "which Phases to do".

    **Design Draft Reference Strategy**

    If design tool MCP is connected (e.g., Pencil, Figma, etc.), the following steps are **non-skippable**:

    **Before each feature development**:
    - Use the design tool API to read the exact values of all involved pages and variants (width, height, padding, gap, font size, font weight, color, border radius, shadow)
    - View the design draft visual effects
    - Reading once at Phase start is not enough — re-read before each Task, don't rely on memory

    **During coding**:
    - Implement component by component against the extracted values
    - When design draft conflicts with Design Brief, the design draft takes precedence

    **After each feature development**:
    - Read the actual values in code (Tailwind class / style), verify item by item against design values
    - View the design draft, confirm layout structure matches
    - Fix any deviations before committing
    - Ask the user to confirm the final visual result in the browser

    If no design tool (degraded mode):
    - Use Design-Brief.md as the primary reference
    - If no Design-Brief -> use Product-Spec.md text description as reference

    **Online Search Strategy**
    The following scenarios require WebSearch before coding:
    1. Using external libraries/APIs -> confirm current version usage and API signatures
    2. Whether SDK/framework has built-in functionality -> confirm before deciding whether to implement or use directly
    3. Encountering uncertain technical approaches -> search for best practices
    4. Unfamiliar error messages -> search for others' solutions

    **Tech Stack Selection Strategy** (used in initialization mode)
    Configure the project according to the DEV-PLAN.md tech stack table. If DEV-PLAN does not specify:
    - Web (frontend only) -> React + Vite + TypeScript + Tailwind
    - Web (full-stack) -> Next.js + TypeScript + Tailwind
    - Desktop -> Electron + Next.js + TypeScript + Tailwind
    - CLI -> Node.js + TypeScript + Commander
    - CLI Agent -> Node.js + TypeScript (refer to [CLI Agent Product] project structure)
    - Mobile -> React Native / Expo
    - Backend API -> FastAPI (Python) / Spring Boot (Java) / Gin (Go) / Actix (Rust)
    - Full-Stack (backend-focused) -> FastAPI + React / Spring Boot + React / Go + React
    After selection, WebSearch to verify framework versions and compatibility.

[Anti-Rationalization Checklist]
    Agents tend to use "reasonable" excuses to skip rules. Here are common rationalizations and the correct response.

    Skipping Plan Mode:
    - "This is simple, just write it directly" -> Plan Mode doesn't care about complexity, it's about discipline. Simple Phases also need Plan + TaskList
    - "Just changing one file" -> Even one file requires impact assessment before proceeding
    - "User is waiting, write first" -> 5 minutes of planning saves 30 minutes of rework

    Skipping verification:
    - "I just tested this" -> Every completion declaration requires fresh evidence run on the spot
    - "This change couldn't possibly break anything" -> Changes that can't break anything are the most likely to break something. Verify.
    - "Compilation passes, so it's fine" -> Compilation passing doesn't mean functionality works. Every step of the four-step process is needed.

    Skipping Code Review:
    - "Small change, no review needed" -> Every code change goes through review, regardless of size
    - "Just fixed a typo" -> Typo fixes also get committed, compilation verification still required before commit
    - **Complexity Gate**: For truly simple changes (typo fix, single-file rename, comment-only), set change_complexity="simple" when dispatching code-reviewer to skip Stage 1. This is NOT skipping review — it's matching the review depth to the change scope.

    Skipping Session Handoff:
    - "Context isn't that full yet" -> By the time it feels full, it's too late. Generate handoff early.
    - "I'll remember for next time" -> You won't. Next invocation is a fresh context with zero memory.
    - "The user didn't ask for it" -> Proactive handoff is part of Force Stop discipline. Generate it.

    Writing vague plans:
    - "Figure out details during implementation" -> Plan stage requires thinking it through, otherwise implementation will go off track
    - "Similar approach to Task 1" -> Write the specific approach, don't reference other Tasks
    - "Add necessary error handling" -> Specify which errors and what approach to use

    Skipping feedback recording:
    - "It's a small fix, no need to record feedback" -> Every fix, regardless of size, is a learning opportunity for the ratchet. Without recording, the same failure repeats.
    - "I'll record feedback later" -> You won't. You're in a fix loop. Record it now or forget it.

Soft completion declarations:
    - "Should be fine" -> "Fine" needs evidence — run the verification command
    - "Looks correct" -> "Correct" needs comparison between the Spec original text and code
    - "Likely passes" -> Probability is not evidence — run the test and get results

    Skipping Phase Boundaries:
    - "Just read the next Phase briefly" -> Do not read it. One Phase per invocation.
    - "Since all files are here, might as well do Phase N+1 too" -> No. User must call /dev-builder again.
    - "Saving time by continuing to the next Phase" -> This is not saving time, it's skipping process. Stop.
    - "User said continue, so I'll start Phase N+1" -> User said continue to confirm Phase N is complete. They did NOT say to start Phase N+1. Invoke /dev-builder is required.

[Phase Completion Assessment]
    When each Phase is complete, all of the following checks must pass. One pass is rarely enough — iterative checking until clean.

    **Four-Step Verification** (all must pass to confirm Phase completion):

    Step 1: Code Review
    - Cross-reference the DEV-PLAN.md Phase delivery checklist, confirm each item is implemented item by item
    - Check code quality: naming conventions, type safety, no `any`, no circular dependencies
    - Check for changes outside the Phase scope (scope creep)
    - Output evidence: delivery checklist cross-reference results

    Step 2: Test Completeness
    - All planned features for this Phase are implemented
    - No omissions, no half-baked work
    - Output evidence: feature checklist with checkmarks

    Step 3: Compilation Verification
    - TypeScript compilation zero errors (tsc --noEmit)
    - No missing dependencies
    - Output evidence: compilation command output

    Step 4: Functional Testing
    - Start dev server, confirm no error output
    - New features are usable
    - Existing features are not broken (regression)
    - If Playwright is available -> use browser automation to test core interaction flows
    - If Playwright is not available -> use curl to check API endpoint returns 200 + remind user to manually confirm UI rendering in browser
    - Output evidence: startup logs + API response + design value comparison results

    **Smoke Tests** (additional checks beyond the four steps):
    - Security scan: npm audit has no critical vulnerabilities
    - No exposed keys: grep to check for hardcoded API Keys, Tokens in code
    - Process health: only 1 dev server instance running

    **Iterative Check Loop**:
    - If any step finds issues (missing tasks, compilation errors, test failures), dispatch feedback-observer with trigger_reason="verification_fail", current_skill="dev-builder", ai_action=[what failed], failure_detail=[error output] -> then fix the issues
    - After fixing any issue, **restart the entire four-step verification from Step 1**
    - Fixing one issue can reveal other missed issues — one pass is never enough
    - Repeat until all four steps pass clean with no issues found

    **Verification Timeliness Rule**:
    Each verification command in the four steps must be executed in the same message as the report. "Already verified earlier" is not accepted. If any code modification occurs in between, all four steps must be re-run.

    **After All Pass**:
    - Report results to the user (with evidence)
    - Archive: scan the changes/ directory, check if any change artifacts related to this Phase's delivery checklist exist. If yes and all are fully implemented, move changes/<change-name>/ to changes/archive/<change-name>/
    - User confirms -> Phase complete
    - Phase completion cannot be confirmed without passing
    - If problems are found and fixed during verification, use `fix:` prefix for the fix commit (per-Task commits are already completed in Step 2)

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
            Read DEV-PLAN.md -> identify next Phase number. Read ONLY that Phase's delivery checklist and key files. Do NOT read other Phases — they are not your concern.
            Read Product-Spec.md -> use as feature reference
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

            Coding (TDD approach):
            6. **RED**: First write a test, describe the expected behavior. Confirm the test fails (proving the test is valid)
            7. **GREEN**: Write the minimal code to make the test pass
            8. Implement strictly following reference documents, code component by component against design values

            After development — cross-reference validation + Review loop:
            9. **REFACTOR**: Refactor and optimize code, run tests to confirm still green
            10. Read actual code values, verify item by item against design values, correct any deviations
            11. Cross-reference Product-Spec.md to confirm functional behavior matches description
            12. **Blast-radius scan**: If dep-graph is available, run `pnpm dep-graph affected <changed-files>` and `pnpm dep-graph risk <changed-files>`. Pass the affected files list to code-reviewer as `affected_files` so the review targets the right scope. Use the risk score to inform `change_complexity`:
                - risk score "low" → change_complexity="simple" (skip Stage 1)
                - risk score "medium" or "high" → change_complexity="moderate" or "complex"
            13. Dispatch code-reviewer with `affected_files` and `change_complexity` set. code-reviewer also cross-references Product-Spec.md, Design-Brief.md, DEV-PLAN.md, and design drafts.
            14. Stage 1 fails (missing functionality) -> dispatch feedback-observer with trigger_reason="review_stage1_fail", current_skill="dev-builder", ai_action=[what was missing] -> fill in the implementation -> re-dispatch code-reviewer
            15. Stage 2 fails (code quality) -> dispatch feedback-observer with trigger_reason="review_stage2_fail", current_skill="dev-builder", ai_action=[quality issue] -> call bug-fixer to fix -> re-dispatch code-reviewer
            16. Both stages pass -> TaskUpdate mark complete -> execute `echo clean > ../../.needs-review` to clear review status -> **update memory files** -> commit
            17. Proceed to the next Task

            **Memory Update Step** (mandatory after every Task completion):
            - Append to `memory/task-history.md`: date, phase, type (feat/fix/refactor), description, changed files, notes
            - If a technical decision was made: append ADR-N to `memory/decisions-log.md`
            - If architecture facts or constraints changed: update `memory/project-memory.md`
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
            3. Suggest `/clear` to the user after handoff is generated

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

[Initialization]
    Detect project state, route to the corresponding mode:
    - No code + has DEV-PLAN.md -> Initialization Mode
    - Has code + has DEV-PLAN.md -> Continuous Development Mode
    - No DEV-PLAN.md -> prompt to call /dev-planner first
    - No Product-Spec.md -> prompt to call /product-spec-builder first
