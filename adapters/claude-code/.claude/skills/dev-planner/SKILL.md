<!-- forge: dev-planner v1.0 -->
---
name: dev-planner
description: Used when Product-Spec.md is complete and needs to be planned into development phases. Also used to update existing development plans after Spec changes. Outputs DEV-PLAN.md.
---

[Task]
    **Generation Mode**: Read Product-Spec.md (and Design-Brief.md, if present), analyze feature dependency relationships, WebSearch to validate technology choices, output a phased development plan DEV-PLAN.md.

    **Iteration Mode**: When the Product Spec changes, analyze the scope of impact, update the Phase breakdown and file inventory in DEV-PLAN.md. Completed Phases (marked with [x]) remain untouched.

[Not For]
    - Writing actual code -> use /dev-builder instead
    - Gathering requirements -> use /product-spec-builder instead
    - Fixing bugs -> use /bug-fixer instead

[Dependency Check]
    Executed automatically as the first step when the Skill starts:

    Required:
    - Product-Spec.md -> if missing, prompt user to call /product-spec-builder first

    Optional (degradation mode):
    - Design-Brief.md -> if missing, mark as "no design specification mode", visual details annotated as [TBD by Design Brief]
    - Design tool MCP -> if not connected or no files, rely only on text descriptions, mark as "no design draft mode"
    - Existing project code -> if present, scan existing structure as constraints, enter iteration mode

[First Principles]
    **Verifiable Principle**: Each Phase must be compilable, runnable, and show results upon completion. No "write a bunch of code but nothing runs" Phases allowed. Each Phase should deliver a **minimum runnable subset** — a core path that works end-to-end, even if features are incomplete. It's better to have 3 features that run than 10 features that don't.

    **Dependency Order Principle**: Foundation first, building later. Infrastructure (project skeleton, database, routing) always comes before business features. When features have dependencies, the depended-upon item is built first.

    **Online-First Principle**: Rely on real-time information, not outdated memory.
    - Tech stack selection -> WebSearch to confirm framework latest stable version, known issues, recommended pairings
    - Critical dependencies -> WebSearch to confirm API compatibility, version numbers, breaking changes
    - Uncertain technical solutions -> search before deciding, don't make architectural decisions based on outdated memory

    **Appropriate Granularity Principle**: Phases that are too large can't be completed, too small have high management overhead. One Phase should correspond to one independently verifiable functional unit, typically 1-3 core deliverables.

    **Task Time Budget Principle**: Each Task within a Phase should be completable in ≤15 minutes of coding. If a Task would take longer, split it into smaller Tasks. Guidelines:
    - One page/component/feature per Task — do not group unrelated changes
    - Each Task has a single clear deliverable (a working test, a single API endpoint, one UI component)
    - Large Tasks accumulate risk: harder to review, harder to roll back, easier to drift from spec
    - When in doubt, split — small Tasks compose into complete Phases; oversized Tasks fragment into incomplete work

    **Explicit File Path Principle**: Each Phase must list the specific file paths to be created or modified. "Implement chat feature" is not a plan — "create src/components/views/chat-view.tsx and src/hooks/use-chat.ts" is a plan.

    **Primary Metric Principle** (autoresearch-style): Each Phase must declare exactly **one** falsifiable **Primary metric** line (e.g. `pnpm test --filter X` exit 0). dev-builder treats it as the Phase keep/discard anchor — do not change mid-Phase without user-approved replan. Acceptance Criteria may list multiple checks; Primary metric is the single decision number.

    **No Placeholder Principle**: Every word in the Plan must be specific enough that anyone picking up this Plan can start working immediately.
    - Not allowed: TBD, "to be filled", "to be determined", "implement later"
    - Not allowed: "similar to Task N" — repeat the specific content, don't reference
    - Not allowed: "add appropriate error handling" — specify what errors and how to handle them
    - Not allowed: "implement related features" — list specific feature names and behaviors
    - Each Task description must be complete enough for an engineer without project context to read and execute

[HARD-GATE]
    **Until `DEV-PLAN.md` is saved AND the user explicitly confirms the plan**:

    - **MUST NOT** invoke `/dev-builder`
    - Chat agreement ("looks good") without reviewing the written DEV-PLAN does **not** lift this gate

    **Prerequisites**: `Product-Spec.md` must exist — if missing, stop and route to `/product-spec-builder`.

    Rationalizations → `references/plan-hard-gate-rationalization.md`

[File Structure]
    ```
    dev-planner/
    ├── SKILL.md                           # Main Skill Definition (this file)
    ├── references/
    │   └── plan-hard-gate-rationalization.md
    └── templates/
        └── dev-plan-template.md           # DEV-PLAN.md Output Template
    ```

[Output Style]
    **Tone**: Architect communicating a build plan — structured, explicit, dependency-aware. Every Phase has a clear user-visible outcome.
    **Principles**:
    - V Every Phase compiles and runs independently
    - V Phase boundaries follow dependency order (infra → features)
    - V Every Task lists specific file paths, not "implement X"
    - X No TBD or placeholder items — every word must be executable
    - X No "implement related features" — list specific feature names

[Gotchas]
    **Unrealistic Phasing**: "Do everything in Phase 1" is the most common failure. Each Phase must produce compilable, runnable, demonstrable output. If a Phase has no visible outcome, it's too broad — split it.
    **Missing dependency order**: Building feature B before feature A when B depends on A. Always trace the dependency chain: infrastructure → data → API → UI. Violating this order means stubs and tech debt.
    **Tech stack without WebSearch**: "I'll use the latest version of X" → no, confirm. Versions change, breaking changes happen, compatibility issues exist. WebSearch every tech stack choice before writing it down.
    **Ignoring existing code**: In iteration mode, assuming the project is greenfield. Always scan existing code structure first — the plan must respect what's already there, not redesign from scratch.

[Output Artifacts]
    - **DEV-PLAN.md** — Phased development plan (created in generation mode, updated in iteration mode)
    - **changes/\<change-name\>/tasks.md** — Task breakdown (filled when `/change-manager apply` invokes dev-planner for that change only — not by product-spec-builder iteration)

[Analysis Dimension Checklist]
    When analyzing the Product Spec, the following dimensions must be covered (not necessarily in order, adjust flexibly based on project characteristics):

    **Must Analyze** (without these, DEV-PLAN is a castle in the air):

    - Technology stack determination: Extract the recommended tech stack from the Spec's Technical Direction section, WebSearch to verify framework versions, compatibility, and known issues. If the Spec only indicates a direction (e.g., "Web application") without a specific stack, recommend based on project type and confirm.
      - Confirm items: Framework + version number, UI solution, database solution, package manager, deployment target
      - WebSearch focus: Framework latest stable version, key dependency compatibility, community-recommended pairings
      - If multiple reasonable options exist -> present 2-3 options with pros/cons comparison, let the user choose

    - Phase breakdown: Decompose the Spec's functional requirements into an ordered sequence of Phases based on dependency relationships and complexity. Each Phase is an independently verifiable functional unit.
      - Breakdown basis: Feature dependency relationships (A depends on B -> B first), technical infrastructure first, core features before auxiliary features
      - Granularity standard: One Phase typically contains 1-3 core deliverables

    - Each Phase's delivery checklist: Each Phase must clearly define what is being delivered. Start with verbs, describe user-perceptible features.
      - Format: "User can do X -> System does Y" or "Complete X infrastructure setup"

    - Each Phase's key files: Each Phase must list the specific file paths to be created or modified.
      - For new projects: Infer directory structure from tech stack conventions (e.g., Next.js's src/app/api/, src/components/, etc.)
      - For existing projects: Scan existing code structure as the foundation

    - Feature dependency graph: Identify dependency relationships between features, ensure Phase ordering does not violate dependencies.
      - E.g.: Chat UI depends on message database -> database must come before chat UI
      - E.g.: IM Bridge depends on Agent engine -> Agent engine must come before IM

    **Try to Analyze** (with these, the Plan is more grounded):

    - Database design: If the project requires a database, list all data tables, their owning Phase, and purpose.
      - Format: Table name + Phase of first creation + purpose description

    - Each Phase's acceptance criteria: How to verify when each Phase is complete.
      - Minimum standard: Compiles, starts up, new features are usable
      - Recommended standard: Compiles + starts up + new features usable + existing features not broken

    - Known risks and limitations: Annotate expected technical risks or known limitations in specific Phases.
      - E.g.: "Phase 4 only implements the UI configuration interface; the actual IM connection engine is in Phase 10"

    **No Need to Analyze** (left for dev-builder to decide):
    - Specific code implementation details (function signatures, class interfaces)
    - Specific CSS styling approach
    - Test case design
    - Git branch strategy

[Analysis Strategies]
    **Dependency Graph Construction**
    Starting from the Spec's feature list, build dependency relationships between features:
    1. List all feature points
    2. For each feature ask: can it run independently? What other features or infrastructure does it depend on?
    3. Build a directed acyclic graph (DAG)
    4. Topological sort to get Phase order
    Infrastructure (project skeleton, database initialization, routing framework) is always the root node of the DAG.

    **Onion Peeling Method (Inside Out)**
    If features have no strong dependency relationships, sort by "user-perceived value":
    1. Core features (product would not exist without it) -> build first
    2. Important features (makes it good to have) -> build in the middle
    3. Auxiliary features (icing on the cake) -> build last
    4. Finishing touches (i18n, packaging, deployment) -> build last

    **Granularity Calibration**
    Check whether each Phase's granularity is reasonable:
    - Too large signals: delivery checklist exceeds 5 items, key files exceed 10, involves 3+ unrelated features
    - Too small signals: delivery checklist has only 1 very simple item, key files are only 1-2
    - Appropriate signals: delivery checklist 2-4 items, key files 3-8, features have internal cohesion
    - **Task time test**: Estimate the coding time for the largest single Task in this Phase. If it exceeds 15 minutes, the Phase is too coarse — split the oversized Task into its own Phase or break it into smaller Tasks

    **Risk-First Method**
    Identify the highest technical risk parts of the project (new frameworks, complex integrations, uncertain APIs), schedule them in early Phases:
    - Unused framework -> validate in the skeleton Phase
    - Critical third-party API -> do integration validation in early Phase
    - Performance-sensitive features -> consider during implementation, don't leave optimization for last

    **WebSearch Validation**
    For each key decision in technology selection, perform a search validation:
    1. Framework + "latest stable version" + year
    2. Framework A + Framework B + "compatibility" or "integration"
    3. Specific package name + "known issues" or "breaking changes"
    4. Project type + "recommended stack" + year
    Validation results affect the tech stack table and Phase arrangement.

    **Context7 Library IDs** (when user has Context7 MCP or `ctx7` CLI):
    - For each major third-party dependency in the Tech Stack table, resolve and record **Context7 Library ID** (`/org/project`) in DEV-PLAN.md
    - Use `resolve-library-id` with the planned version in the query when version-specific docs matter
    - If Context7 is unavailable, leave ID as `—` and rely on WebSearch; see [context7-comparison](https://github.com/zxpmail/ReqForge/blob/main/core/docs/context7-comparison.md)

    **Confirmation Strategy**
    dev-planner does not require extensive conversation like product-spec-builder. Only confirm with the user in the following situations:
    - When there are multiple reasonable tech stack options -> present 2-3 options for the user to choose
    - Phase granularity preference -> "Do you prefer coarse-grained (6-8 Phases) or fine-grained (10-15 Phases)?"
    - When feature priority is ambiguous -> "Should we do A first or B first?"
    - Beyond these cases, the Spec is clear enough — no need to keep questioning the user

    **Parallel Codebase Exploration** (when existing code is present):
    When scanning existing code in iteration mode or when the project already has code, use parallel exploration for efficiency:

    1. **Split exploration scope** into independent dimensions:
       - Routes/Pages: map all pages and API routes
       - Data layer: schemas, models, migrations, storage
       - Components: UI component tree, shared components
       - Services: external API integrations, business logic modules
       - Configuration: project config, dependency versions, build setup

    2. **Dispatch parallel sub-agents** (one per dimension) each with:
       - A focused prompt: "Explore [dimension] in [project]. List all files, their responsibilities, and key patterns."
       - A strict output format: file path → responsibility → key exports/interfaces

    3. **Merge results**: Combine all exploration outputs into a unified code map
    4. **Annotate constraints**: Flag patterns that the plan must respect (existing conventions, architectural decisions)

    This avoids the slow sequential "read one file at a time" approach and provides a comprehensive codebase picture in a single parallel pass.

[Information Sufficiency Criteria]
    DEV-PLAN.md can be generated when the following conditions are met:

    **Must Satisfy** (without these, the Plan is worthless):
    - [x] Tech stack is determined (framework + version + key dependencies, verified by WebSearch)
    - [x] Phase breakdown is complete (each Phase has a clear delivery checklist)
    - [x] Dependency order is reasonable (no Phase depends on an unfinished prerequisite Phase)
    - [x] Each Phase has a key files list (specific paths, not vague descriptions)
    - [x] All core features in the Spec are covered (no omissions)

    **Try to Satisfy** (with these, the Plan is more practical):
    - [x] Database table organization is complete (if database is needed)
    - [x] Each Phase has acceptance criteria
    - [x] Known risks and limitations are annotated

    If "Must Satisfy" conditions are not met, continue analyzing — don't generate a half-baked product.
    If "Try to Satisfy" conditions are not met, write the minimum acceptance criteria in the corresponding Phase's verification section — compiles, starts up, new features usable — without using placeholders.

[Workflow (Generation Mode)]
    [Loading Phase]
        Goal: Read all input documents, establish the analysis foundation

        Step 1: Dependency Check
            Execute [Dependency Check]

        Step 2: Load Product Spec
            Read Product-Spec.md
            Extract: product type, core feature list, auxiliary feature list, AI capability requirements, technical direction, UI layout structure, data storage method
            Check if Product-Spec.md contains [TBD] markers. If so, list the affected items and prompt the user to either fill them in or confirm they can be skipped

        Step 3: Load Design Brief (if present)
            Read Design-Brief.md
            Extract: core page list, visual direction (affects component breakdown granularity)

        Step 4: Load design drafts (if present)
            Check if design tool MCP is connected
            If yes -> use the design tool to read design drafts, extract:
            - Complete inventory of all pages and variants
            - Component composition and layout structure of each page
            - Specific interaction elements and state variants
            - Navigation relationships between pages
            - List of reusable components
            When design drafts exist, Phase breakdown and key file planning must be based on the actual page structure of the design drafts. The number of pages and components in the design drafts directly determines Phase workload and file inventory, not just the Spec's text description.
            If not -> skip, rely only on Spec and Design Brief text descriptions

        Step 5: Scan existing code (if present)
            If the project directory already has code -> scan directory structure, identify tech stack and implemented features
            Mark as existing code constraints to avoid Plan conflicting with existing structure
            For codebases with more than 20 files, use [Parallel Codebase Exploration] strategy to dispatch parallel sub-agents for efficient comprehensive scanning

        Step 6: Load memory (if present)
            If memory/ exists -> read project-memory.md (architecture constraints, known pitfalls), decisions-log.md (past decisions to respect), task-history.md (what has been implemented)
            Use memory constraints when planning Phase dependencies and file paths

    [Technical Validation Phase]
        Goal: Determine and validate the tech stack

        Step 1: Extract technical direction
            Extract the recommended tech stack from the Spec's Technical Direction section
            If the Spec has no explicit tech stack -> recommend based on project type:
            - Web (frontend only) -> React + Vite + TypeScript + Tailwind
            - Web (full-stack) -> Next.js + TypeScript + Tailwind
            - Desktop -> Electron + Next.js + TypeScript + Tailwind
            - CLI -> Node.js + TypeScript + Commander
            - Mobile -> React Native / Expo

        Step 2: WebSearch validation
            Cross-reference the "Technology stack determination" dimension in [Analysis Dimension Checklist]
            Apply the "WebSearch Validation" strategy from [Analysis Strategies]
            Verify framework versions, key dependency compatibility, known issues

        Step 3: Confirm tech stack
            If multiple reasonable options exist -> present 2-3 options with pros/cons comparison to the user, let them choose
            If the Spec's technical direction is clear and validated -> confirm directly, no need to ask the user
            Output the confirmed tech stack table

    [Analysis Phase]
        Goal: Analyze feature dependency relationships, break down into Phases

        Step 1: Feature decomposition
            List the Spec's functional requirements one by one
            If design drafts exist -> use the design draft page structure as reference, confirm features and components for each page. The number of pages and component composition in the design drafts directly determines the Phase's file inventory
            If no design drafts -> derive page structure from Spec and Design Brief text descriptions
            For each feature, annotate: type, dependencies on other features, data tables involved, pages and components involved

        Step 2: Dependency graph construction
            Apply the "Dependency Graph Construction" strategy from [Analysis Strategies]
            Build the feature dependency graph, identify ordering

        Step 3: Phase breakdown
            Apply the "Onion Peeling Method" and "Risk-First Method" from [Analysis Strategies]
            Group features into Phases by dependency order and priority
            Apply "Granularity Calibration" to check each Phase's granularity

        Step 4: Sufficiency check
            Cross-reference [Information Sufficiency Criteria]
            "Must Satisfy" all met -> proceed to output phase
            If questions remain -> confirm with the user before continuing

    [Output Phase]
        Goal: Generate the DEV-PLAN.md file

        Step 1: Load template
            Read templates/dev-plan-template.md

        Step 2: Fill content
            Fill according to template structure:
            - Phase list (number + feature name + delivery checklist + key files + acceptance criteria)
            - Tech stack table
            - Database table summary (if applicable)
            - Development rules

        Step 3: Self-check
            Apply the "Granularity Calibration" from [Analysis Strategies] to check again
            Confirm every core feature in the Spec has a corresponding Phase
            Confirm Phase order does not violate dependency relationships
            No-placeholder check: scan output for placeholders like TBD, "to be filled", "to be determined", "similar to Phase/Task N" — replace with specific content if found

        Step 4: Output file
            Save as DEV-PLAN.md
            Present plan summary and ask user to **explicitly confirm** the written DEV-PLAN.md.
            **Machine gate marker (MANDATORY on confirm)**: Write `.forge/plan-confirmed.json` (`confirmed_at` ISO-8601, `plan_path`: `DEV-PLAN.md`). Template: `core/templates/forge-markers/plan-confirmed.template.json`.
            **HARD-GATE**: Only after explicit confirm may you mention `/dev-builder` as the next step.

        Step 5: Guide next steps
            "[x] DEV-PLAN.md has been generated!

             File: DEV-PLAN.md
             Total N Phases, covering all X features in the Spec.

             Next steps (after you confirm the plan above):
             - Call /dev-builder to start development by Phase
             - Or call /design-brief-builder first to determine visual direction (if not done yet)
             - Want to adjust Phase granularity or order? Just tell me."

[Workflow (Iteration Mode)]
    Trigger conditions:
    - DEV-PLAN.md already exists and Product Spec has changed
    - User proactively requests Phase adjustments

    [Change Analysis Phase]
        Step 1: Load existing files
            Read existing DEV-PLAN.md
            Read the updated Product-Spec.md
            If Product-Spec-CHANGELOG.md exists -> read the most recent changelog entries to quickly locate the change scope
            If Design-Brief.md exists -> read it, check if visual direction has also changed
            If design tool MCP is connected -> read the latest design drafts, compare pages affected by the change
            If memory/ exists -> read project-memory.md (constraints to respect), decisions-log.md (past decisions), task-history.md (recent work context)

        Step 2: Identify change impact
            Compare Spec changes against the existing Plan:
            - New feature -> needs a new Phase or insertion into an existing Phase
            - Feature modification -> needs to update the corresponding Phase's delivery checklist and key files
            - Feature removal -> needs to remove or simplify the corresponding Phase
            - Tech stack change -> may need to reorder multiple Phases

        Step 3: Explain impact to the user
            "The Spec changes will affect the following Phases in the Plan:
             - Phase N: [Impact description]
             - Phase M: [Impact description]
             Should I update it directly?"

    [Update Phase]
        Step 1: Update Phase
            Modify the existing DEV-PLAN.md directly
            Keep completed Phases unchanged (marked with [x] are not touched)
            Only modify affected Phases that are still pending

        Step 2: Re-validate dependencies
            Confirm the updated Phase order does not violate dependency relationships

        Step 3: Save file
            Save the updated DEV-PLAN.md

[Initialization]
    Execute [Loading Phase]
