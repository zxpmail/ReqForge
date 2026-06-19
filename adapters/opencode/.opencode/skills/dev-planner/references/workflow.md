# dev-planner Workflow

> invoke 后 Read 对应模式章节。

[Workflow (Generation Mode)] — Apply [Analysis Strategy] methodology across all Phases below.
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
            Apply the "WebSearch Validation" strategy from [Analysis Strategy]
            Verify framework versions, key dependency compatibility, known issues

        Step 3: Confirm tech stack
            If multiple reasonable options exist -> present 2-3 options with pros/cons comparison to the user, let them choose
            If the Spec's technical direction is clear and validated -> confirm directly, no need to ask the user
            Output the confirmed tech stack table

        Step 4: Write tech stack to dev-map
            Write the confirmed Language / Build / Test / Lint / Source values into `.forge/dev-map.md` 技术栈节
            If dev-map.md 不存在 -> 创建并写入
            If 已存在 -> 更新技术栈节，保留其他节不变

    [Analysis Phase]
        Goal: Analyze feature dependency relationships, break down into Phases

        Step 1: Feature decomposition
            List the Spec's functional requirements one by one
            If design drafts exist -> use the design draft page structure as reference, confirm features and components for each page. The number of pages and component composition in the design drafts directly determines the Phase's file inventory
            If no design drafts -> derive page structure from Spec and Design Brief text descriptions
            For each feature, annotate: type, dependencies on other features, data tables involved, pages and components involved

        Step 2: Dependency graph construction
            Apply the "Dependency Graph Construction" strategy from [Analysis Strategy]
            Build the feature dependency graph, identify ordering

        Step 3: Phase breakdown
            Apply the "Onion Peeling Method" and "Risk-First Method" from [Analysis Strategy]
            Group features into Phases by dependency order and priority
            Apply "Granularity Calibration" to check each Phase's granularity

        Step 4: Sufficiency check
            Cross-reference [Information Sufficiency Criteria]
            "Must Satisfy" all met -> proceed to Plan Critique Check
            If questions remain -> confirm with the user before continuing

    [Plan Critique Check] (Generation Mode only — skip in Iteration Mode)
        Goal: Counteract LLM sycophancy in planning. After building a Phase structure,
        the model naturally rationalizes its own ordering and scope. This check forces
        adversarial scrutiny before writing DEV-PLAN.md.

        When to skip: Iteration Mode, user says "skip plan critique"

        Step 1: Run plan critique
            Execute `references/plan-critique-check.md`
            Challenge three planning signals: Phase Order, MVP Scope, Tech Stack

        Step 2: Apply density check
            At least 2 evidence-backed findings required. Below quota -> re-scan once.
            Still below -> mark `low-critique`, proceed with warning.

        Step 3: Resolve verdict
            - **proceed**: note findings, move to Output Phase
            - **adjust**: apply listed adjustments, then move to Output Phase (no second critique)
            - **blocked**: present to user, resolve, then proceed

    [Output Phase]
        Goal: Generate the DEV-PLAN.md file

        Step 1: Load template
            Read templates/dev-plan-template.md

        Step 2: Load Known Difficult Spots (NEW)
            If Product-Spec.md has a `## Known Difficult Spots` section, read it now.
            For each Phase, check if its feature maps to any listed difficulty spot.
            If yes -> propagate the difficulty level (🔴/🟡/🟢) and the "预计缝在哪" strategy into the Phase's Difficulty field.
            If a Phase covers features not listed in Known Difficult Spots -> default to 🟡 中.

        Step 3: Fill content
            Fill according to template structure:
            - **MVP Scope** (in scope, **out of scope**, scope amendment criteria — Founder's Playbook anti-creep)
            - Phase list (number + feature name + difficulty level + delivery checklist + key files + acceptance criteria + behavior)
            - Tech stack table
            - Database table summary (if applicable)
            - Development rules

        Step 3: Self-check
            Apply the "Granularity Calibration" from [Analysis Strategy] to check again
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

        Step 6 (optional): GitHub issue slices
            If user uses GitHub Issues and asks to split the plan after confirm:
            Read [github-issues-slices-template.md](../../../templates/github-issues-slices-template.md)
            Propose vertical-slice issues linked to Phases — **DEV-PLAN.md remains source of truth**

    [Architecture Health Pass] (optional — periodic; not a replacement for /code-review)
    When user requests architecture health, deepening, or "ball of mud" review:
    Execute references/architecture-health-pass.md — output Health Notes only; replan only on user confirm.

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
