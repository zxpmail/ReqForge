<!-- forge: skill-builder v1.0 -->
---
name: skill-builder
description: Used when the user wants to create a new Skill, or when an EVOLUTION.md proposal auto-generates a new Skill. Creates a structurally consistent new Skill following the framework's modular conventions.
version: 1.0.0
updated: 2026-05-26
requires: []
---

<!-- begin: task -->
[Task]
    Create a new Skill that conforms to framework conventions based on the user's described needs or an EVOLUTION.md fourth-layer proposal.
    Ensure the new Skill shares the same structure, unified style, and plug-and-play modularity as existing Skills.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Modifying existing Skills -> edit the SKILL.md directly instead
    - Evolving rules from feedback patterns -> use /evolution-engine instead
    - Recording feedback about a Skill -> use /feedback-writer instead

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Required: None (this Skill does not depend on external files)

    Optional:
    - Related records in ../../feedback/ -> if from an EVOLUTION.md proposal, read the original feedback to understand the need's background

<!-- end: dependency-check -->
<!-- begin: first-principles -->
[First Principles]
    **Template First**: Always read the templates/skill-template.md skeleton first, then fill in the structure. Never write from scratch.

    **Reference Existing**: Before creating, read 1-2 existing Skills as reference to keep style consistent. Do not invent new formats.

    **Minimum Necessary**: Only create the Sections that are needed. Never add empty content or irrelevant rules just to "look complete."

    **Web-First**: If the new Skill involves an unfamiliar domain, WebSearch the domain's best practices and common pitfalls first, then design the dimension checklist and strategy.

<!-- end: first-principles -->
<!-- begin: file-structure -->
[File Structure]
    ```
    skill-builder/
    ├── SKILL.md                           # Main Skill definition (this file)
    └── templates/
        └── skill-template.md              # Skeleton template for new Skills
    ```

<!-- end: file-structure -->
<!-- begin: gotchas -->
[Gotchas]
    **Skipping template**: "I know the structure well enough" — read the template anyway. Every time you skip, you'll miss something: a section heading, a required field, or the consistent format.
    **Not cross-referencing existing Skills**: Writing in a different style from the rest of the codebase. Always read 1-2 existing Skills before creating a new one. Consistency matters for maintainability.
    **Empty sections**: "To be filled later" is technical debt. If a section isn't needed, don't include it. If it IS needed, fill it now. Empty sections in a Skill cause confusion when the Skill is invoked.
    **Missing Gotchas**: You're building a Skill that WILL accumulate failure points. If you don't leave a [Gotchas] section, where will those lessons go? Nowhere — they'll be repeated.

<!-- end: gotchas -->
<!-- begin: quality-rubric -->
[Quality Rubric]
    16-item, 32-point scoring system. Ship threshold: **≥ 24** with no critical item scoring 0.

    | # | Dimension | Pts | Critical | Scoring |
    |---|-----------|-----|----------|---------|
    | 1 | Decidable triggers | 2 | YES | 2 = description specifies when to use AND when not to use; 1 = when-to-use only; 0 = vague ("helps with X") |
    | 2 | Principle depth | 2 | no | 2 = each principle has concrete implication; 1 = principles exist but some are trivial; 0 = fewer than 3 principles |
    | 3 | Gotchas from practice | 2 | no | 2 = ≥3 specific failure points with "what to do instead"; 1 = 1-2 gotchas; 0 = none |
    | 4 | Workflow executability | 2 | YES | 2 = each step specifies concrete action; 1 = steps exist but some are vague; 0 = no workflow |
    | 5 | Dependency completeness | 2 | no | 2 = required deps have failure guidance, optional have degraded mode; 1 = deps listed but no guidance; 0 = no dep check |
    | 6 | Output Style defined | 2 | no | 2 = tone + principles + typical expressions; 1 = partial; 0 = absent |
    | 7 | Domain dimensions | 2 | no | 2 = domain checklist with must-have/recommended/optional; 1 = checklist exists but flat; 0 = none |
    | 8 | Anti-rationalization | 2 | no | 2 = ≥3 rationalizations enumerated with correct response; 1 = 1-2; 0 = none |
    | 9 | No placeholders | 2 | YES | 2 = zero TBD/FIXME/template markers; 0 = any found |
    | 10 | Cross-reference consistency | 2 | no | 2 = Workflow refs Strategy, Strategy refs Checklist; 1 = partial refs; 0 = sections are isolated |
    | 11 | Boundary clarity | 2 | YES | 2 = [Not For] section with explicit exclusion conditions; 1 = boundaries mentioned in description; 0 = none |
    | 12 | Template alignment | 2 | no | 2 = follows skill-template.md structure; 1 = mostly aligned; 0 = diverges significantly |
    | 13 | File size discipline | 2 | no | 2 = ≤500 lines; 1 = 501-600 lines; 0 = >600 lines |
    | 14 | Naming convention | 2 | no | 2 = kebab-case dir + [Section] format; 1 = one violation; 0 = multiple violations |
    | 15 | Output artifacts listed | 2 | no | 2 = explicit artifact list; 1 = implicit; 0 = none |
    | 16 | Initialization wired | 2 | no | 2 = points to first Workflow step; 1 = present but vague; 0 = absent |

    **Scoring**: Run `pnpm validate-skill --score core/skills/<name>` to compute.

<!-- end: quality-rubric -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **skills/\<skill-name\>/SKILL.md** — new Skill definition file (relative to framework root)
    - **skills/\<skill-name\>/templates/** — template directory for the new Skill (if any, relative to framework root)

<!-- end: output-artifacts -->
<!-- begin: creation-standards -->
[Creation Standards]
<!-- end: creation-standards -->
    <!-- begin: three-layer-modularity -->
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

    <!-- end: three-layer-modularity -->
    <!-- begin: section-categories -->
    [Section Categories]
        **Required** (all Skills have these):
        - [Task] — one sentence describing what it does
        - [Dependency Check] — check prerequisites on startup
        - [First Principles] — 3-5 core principles
        - [File Structure] — Skill directory structure
        - [Initialization] — entry point

        **Recommended** (most Skills have these):
        - [Output Style] — tone + principles + typical expressions
        - [DOMAIN Dimension/Checklist] — domain-specific inspection dimensions (name tailored to domain)
        - [DOMAIN Strategy] — domain-specific methodology (name tailored to domain)

        **On-Demand** (specific Skill types need these):
        - [Information Sufficiency Check] — collection / analysis type Skills
        - [Rollback Strategy] — release / deployment type Skills
        - [Phase Completion Check] — development type Skills
        - Multi-mode workflow — Skills with multiple execution modes

    <!-- end: section-categories -->
    <!-- begin: naming-conventions -->
    [Naming Conventions]
        - Skill name: kebab-case (e.g., skill-builder, dev-planner)
        - Directory: skills/[skill-name]/ (relative to framework root, e.g., .claude/skills/, .cursor/rules/skills/, .opencode/skills/)
        - Main file: SKILL.md
        - Template files (if any): templates/ subdirectory

    <!-- end: naming-conventions -->
    <!-- begin: format-conventions -->
    [Format Conventions]
        - Section titles use [Title] format
        - Content indented by 4 spaces
        - Frontmatter only has name and description
        - Written in Chinese

    <!-- end: format-conventions -->
<!-- begin: workflow -->
[Workflow]
<!-- end: workflow -->
    <!-- begin: step-1:-requirements-gathering -->
    [Step 1: Requirements Gathering]
        Understand what new Skill the user wants:
        - What problem does this Skill solve?
        - When is it triggered? (auto-trigger conditions / manual invocation)
        - What are the inputs? (prerequisite files, user input, project state)
        - What are the outputs? (files, reports, code changes)
        - If from an EVOLUTION.md fourth-layer proposal -> read the original records in feedback/ to understand the need's background

    <!-- end: step-1:-requirements-gathering -->
    <!-- begin: step-2:-reference-existing -->
    [Step 2: Reference Existing]
        Based on interaction mode (not domain), find 1-2 closest existing Skills as reference:
        - **Dialogue Collection Type** (requires multi-turn conversation to collect info) -> reference product-spec-builder, design-brief-builder
        - **Autonomous Analysis Type** (reads input and autonomously produces output) -> reference dev-planner, code-review
        - **Execution Operation Type** (directly executes operations to produce results) -> reference dev-builder, release-builder
        - **Diagnosis & Fix Type** (diagnoses the problem first, then fixes) -> reference bug-fixer
        The new Skill could be for any domain — not necessarily software development. It could be content writing, data analysis, competitive research, etc.
        Match by interaction mode, not by domain.
        Understand the reference Skill's structure, dimension naming, strategy style, output format.

    <!-- end: step-2:-reference-existing -->
    <!-- begin: step-3:-determine-structure -->
    [Step 3: Determine Structure]
        Read the templates/skill-template.md skeleton
        Determine which Sections are needed:
        - Required 5 -> keep all
        - Recommended -> decide based on domain needs
        - On-Demand -> decide based on Skill type
        Determine domain-specific naming: what DOMAIN should be in [DOMAIN Dimension Checklist] and [DOMAIN Strategy]

    <!-- end: step-3:-determine-structure -->
    <!-- begin: step-4:-fill-content -->
    [Step 4: Fill Content]
        Fill each Section one by one:
        - [Task] — one sentence; if multiple modes, describe each
        - [Dependency Check] — list required and optional dependencies
        - [First Principles] — 3-5 items, the last one being web-first
        - [Dimension Checklist] — what needs attention in this domain? Split into must-have / recommended / optional
        - [Strategy] — how to do it in this domain? What methodology to use?
        - [Workflow] — in what order? Reference the dimension checklist and strategy
        If the domain is unfamiliar -> WebSearch best practices

    <!-- end: step-4:-fill-content -->
    <!-- begin: step-5:-create-files -->
    [Step 5: Create Files]
        Create SKILL.md under skills/[skill-name]/ (relative to framework root)
        If template files exist -> create templates/ subdirectory
        Self-check after writing:
        - Are all required Sections present?
        - Is the format consistent ([Title] + 4-space indent)?
        - Frontmatter only has name and description?
        - Is the style consistent with referenced existing Skills?

    <!-- end: step-5:-create-files -->
    <!-- begin: step-6:-register-in-main-control-file -->
    [Step 6: Register in Main Control File]
        The AI client will auto-discover new Skills under the skills/ directory.
        However, the main control file needs to be supplemented with:
        1. [Skill Invocation Rules] — add trigger conditions for the new Skill (auto / manual)
        2. [Available Skills] — add a line `/[skill-name] - [description]`
        3. [Workflow] — if the new Skill needs a corresponding phase in the main flow, add the phase definition

    <!-- end: step-6:-register-in-main-control-file -->
<!-- begin: initialization -->
[Initialization]
    Execute [Step 1: Requirements Gathering]

<!-- end: initialization -->