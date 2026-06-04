# Workflow（skill-builder）

<!-- 从 SKILL.md 渐进披露拆分 -->

[Workflow] — See [Review Strategy] for quality assessment and [Quality Rubric] for scoring.

**Step 1: Requirements Gathering**
    Understand what new Skill the user wants:
    - What problem does this Skill solve?
    - When is it triggered? (auto-trigger conditions / manual invocation)
    - What are the inputs? (prerequisite files, user input, project state)
    - What are the outputs? (files, reports, code changes)
    - If from an EVOLUTION.md fourth-layer proposal -> read the original records in feedback/ to understand the need's background

**Step 2: Reference Existing**
    Based on interaction mode (not domain), find 1-2 closest existing Skills as reference:
    - **Dialogue Collection Type** (requires multi-turn conversation to collect info) -> reference product-spec-builder, design-brief-builder
    - **Autonomous Analysis Type** (reads input and autonomously produces output) -> reference dev-planner, code-review
    - **Execution Operation Type** (directly executes operations to produce results) -> reference dev-builder, release-builder
    - **Diagnosis & Fix Type** (diagnoses the problem first, then fixes) -> reference bug-fixer
    Match by interaction mode, not by domain.
    Understand the reference Skill's structure, dimension naming, strategy style, output format.

**Step 3: Determine Structure**
    Read the templates/skill-template.md skeleton
    Determine which Sections are needed:
    - Required 5 -> keep all
    - Recommended -> decide based on domain needs
    - On-Demand -> decide based on Skill type
    Determine domain-specific naming: what DOMAIN should be in [DOMAIN Dimension Checklist] and [DOMAIN Strategy]

**Step 4: Fill Content**
    Fill each Section one by one:
    - [Task] — one sentence; if multiple modes, describe each
    - [Dependency Check] — list required and optional dependencies
    - [First Principles] — 3-5 items, the last one being web-first
    - [Dimension Checklist] — what needs attention in this domain? Split into must-have / recommended / optional
    - [Strategy] — how to do it in this domain? What methodology to use?
    - [Workflow] — in what order? Reference the dimension checklist and strategy
    If the domain is unfamiliar -> WebSearch best practices

**Step 5: Create Files**
    Create SKILL.md under skills/[skill-name]/ (relative to framework root)
    If template files exist -> create templates/ subdirectory
    Self-check after writing:
    - Are all required Sections present?
    - Is the format consistent ([Title] + 4-space indent)?
    - Frontmatter only has name and description?
    - Is the style consistent with referenced existing Skills?

**Step 5b: Skill Eval Pack**
    For user-project custom Skills:
    1. Run `pnpm skill-eval init <skill-name>` → `.forge/skills/<skill-name>/eval/`
    2. Edit **triggers.json**: ≥2 `should_trigger: true`, ≥2 `false`; negative cases must be near-miss
    3. Edit **cases.json**: ≥1 output case with `fileExists` / `regexChecks`
    4. Run `pnpm skill-eval <skill-name>` — static check must pass

**Step 6: Register in Main Control File**
    1. [Skill Dispatch] — add trigger line for the new Skill
    2. [Workflow] — if the new Skill needs a corresponding phase, add phase definition
