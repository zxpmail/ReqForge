# Development Rules Checklist

<!-- 从 SKILL.md 渐进披露拆分；主流程见 ../SKILL.md -->

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
