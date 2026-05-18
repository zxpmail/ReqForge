<!-- forge: skill-builder v1.0 -->
---
name: skill-builder
description: Used when the user wants to create a new Skill, or when an EVOLUTION.md proposal auto-generates a new Skill. Creates a structurally consistent new Skill following the framework's modular conventions.
---

[Task]
    Create a new Skill that conforms to framework conventions based on the user's described needs or an EVOLUTION.md fourth-layer proposal.
    Ensure the new Skill shares the same structure, unified style, and plug-and-play modularity as existing Skills.

[Dependency Check]
    Required: None (this Skill does not depend on external files)

    Optional:
    - Related records in ../../feedback/ -> if from an EVOLUTION.md proposal, read the original feedback to understand the need's background

[First Principles]
    **Template First**: Always read the templates/skill-template.md skeleton first, then fill in the structure. Never write from scratch.

    **Reference Existing**: Before creating, read 1-2 existing Skills as reference to keep style consistent. Do not invent new formats.

    **Minimum Necessary**: Only create the Sections that are needed. Never add empty content or irrelevant rules just to "look complete."

    **Web-First**: If the new Skill involves an unfamiliar domain, WebSearch the domain's best practices and common pitfalls first, then design the dimension checklist and strategy.

[File Structure]
    ```
    skill-builder/
    ├── SKILL.md                           # Main Skill definition (this file)
    └── templates/
        └── skill-template.md              # Skeleton template for new Skills
    ```

[Output Artifacts]
    - **skills/\<skill-name\>/SKILL.md** — new Skill definition file (relative to framework root)
    - **skills/\<skill-name\>/templates/** — template directory for the new Skill (if any, relative to framework root)

[Creation Standards]
    [Three-Layer Modularity]
        The framework's three-layer architecture — each layer is independent and decoupled:

        **Layer 1: Atomic Capabilities (Sections)**
        Each Skill consists of multiple independent Sections, each being an atomic capability module:
        - [Dimension Checklist] — defines "what to check / collect"
        - [Strategy] — defines "how to do it"
        - [Workflow] — defines "in what order"
        - [Dependency Check] — defines "what prerequisites are needed"
        These are building blocks — the same patterns can be reused across different Skills.
        Changing one Section does not affect other Sections.

        **Layer 2: Skill (SKILL.md)**
        A Skill = combination of multiple atomic capabilities, solving a complete domain problem.
        Changing one Skill does not affect other Skills.

        **Layer 3: Workflow (Main Control File)**
        The main control file orchestrates the execution order and trigger conditions of multiple Skills.
        Changing the workflow does not require changing Skill content.

    [Section Categories]
        **Required** (all Skills have these):
        - [Task] — one sentence describing what it does
        - [Dependency Check] — check prerequisites on startup
        - [First Principles] — 3-5 core principles
        - [File Structure] — Skill directory structure
        - [Initialization] — entry point

        **Recommended** (most Skills have these):
        - [Output Style] — tone + principles + typical expressions
        - [XXX Dimension/Checklist] — domain-specific inspection dimensions (name tailored to domain)
        - [XXX Strategy] — domain-specific methodology (name tailored to domain)

        **On-Demand** (specific Skill types need these):
        - [Information Sufficiency Check] — collection / analysis type Skills
        - [Rollback Strategy] — release / deployment type Skills
        - [Phase Completion Check] — development type Skills
        - Multi-mode workflow — Skills with multiple execution modes

    [Naming Conventions]
        - Skill name: kebab-case (e.g., skill-builder, dev-planner)
        - Directory: skills/[skill-name]/ (relative to framework root, e.g., .claude/skills/, .cursor/rules/skills/, .opencode/skills/)
        - Main file: SKILL.md
        - Template files (if any): templates/ subdirectory

    [Format Conventions]
        - Section titles use [Title] format
        - Content indented by 4 spaces
        - Frontmatter only has name and description
        - Written in Chinese

[Workflow]
    [Step 1: Requirements Gathering]
        Understand what new Skill the user wants:
        - What problem does this Skill solve?
        - When is it triggered? (auto-trigger conditions / manual invocation)
        - What are the inputs? (prerequisite files, user input, project state)
        - What are the outputs? (files, reports, code changes)
        - If from an EVOLUTION.md fourth-layer proposal -> read the original records in feedback/ to understand the need's background

    [Step 2: Reference Existing]
        Based on interaction mode (not domain), find 1-2 closest existing Skills as reference:
        - **Dialogue Collection Type** (requires multi-turn conversation to collect info) -> reference product-spec-builder, design-brief-builder
        - **Autonomous Analysis Type** (reads input and autonomously produces output) -> reference dev-planner, code-review
        - **Execution Operation Type** (directly executes operations to produce results) -> reference dev-builder, release-builder
        - **Diagnosis & Fix Type** (diagnoses the problem first, then fixes) -> reference bug-fixer
        The new Skill could be for any domain — not necessarily software development. It could be content writing, data analysis, competitive research, etc.
        Match by interaction mode, not by domain.
        Understand the reference Skill's structure, dimension naming, strategy style, output format.

    [Step 3: Determine Structure]
        Read the templates/skill-template.md skeleton
        Determine which Sections are needed:
        - Required 5 -> keep all
        - Recommended -> decide based on domain needs
        - On-Demand -> decide based on Skill type
        Determine domain-specific naming: what XXX should be in [XXX Dimension Checklist] and [XXX Strategy]

    [Step 4: Fill Content]
        Fill each Section one by one:
        - [Task] — one sentence; if multiple modes, describe each
        - [Dependency Check] — list required and optional dependencies
        - [First Principles] — 3-5 items, the last one being web-first
        - [Dimension Checklist] — what needs attention in this domain? Split into must-have / recommended / optional
        - [Strategy] — how to do it in this domain? What methodology to use?
        - [Workflow] — in what order? Reference the dimension checklist and strategy
        If the domain is unfamiliar -> WebSearch best practices

    [Step 5: Create Files]
        Create SKILL.md under skills/[skill-name]/ (relative to framework root)
        If template files exist -> create templates/ subdirectory
        Self-check after writing:
        - Are all required Sections present?
        - Is the format consistent ([Title] + 4-space indent)?
        - Frontmatter only has name and description?
        - Is the style consistent with referenced existing Skills?

    [Step 6: Register in Main Control File]
        The AI client will auto-discover new Skills under the skills/ directory.
        However, the main control file needs to be supplemented with:
        1. [Skill Invocation Rules] — add trigger conditions for the new Skill (auto / manual)
        2. [Available Skills] — add a line `/[skill-name] - [description]`
        3. [Workflow] — if the new Skill needs a corresponding phase in the main flow, add the phase definition

[Initialization]
    Execute [Step 1: Requirements Gathering]
