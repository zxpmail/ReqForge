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
    → `references/first-principles.md`
    核心：Template First / Reference Existing / Minimum Necessary / Web-First。

<!-- end: first-principles -->
<!-- begin: output-style -->
[Output Style]
    → `references/output-style.md`
    Tone: Architect explaining a blueprint — structured, precise, prescriptive.

<!-- end: output-style -->
<!-- begin: file-structure -->
[File Structure]
    ```
    skill-builder/
    ├── SKILL.md                           # Main Skill definition (this file)
    ├── templates/
    │   └── skill-template.md              # Skeleton template for new Skills
    └── references/
        ├── first-principles.md
        ├── output-style.md
        ├── workflow.md
        ├── dimension-checklist.md
        └── anti-rationalization.md
    ```

<!-- end: file-structure -->
<!-- begin: dimension-checklist -->
[Dimension Checklist]
    See [references/dimension-checklist.md](references/dimension-checklist.md) for the full dimension checklist.

    Must-have dimensions:
    - **Decidable Triggers**: description specifies when to use AND when not
    - **Workflow Executability**: each step specifies concrete action
    - **Gotchas from Practice**: ≥3 specific failure points with guidance
    - **Boundary Clarity**: [Not For] section with explicit exclusions
    - **Dependency Check**: required deps have failure guidance

<!-- end: dimension-checklist -->
<!-- begin: anti-rationalization-checklist -->
[Anti-Rationalization Checklist]
    → `references/anti-rationalization.md`
    遇 skipping template / skipping reference / TBD placeholders 时读取。

<!-- end: anti-rationalization-checklist -->
<!-- begin: gotchas -->
[Gotchas]
    **Skipping template**: "I know the structure well enough" — read the template anyway. Every time you skip, you'll miss something: a section heading, a required field, or the consistent format.
    **Not cross-referencing existing Skills**: Writing in a different style from the rest of the codebase. Always read 1-2 existing Skills before creating a new one. Consistency matters for maintainability.
    **Empty sections**: "To be filled later" is technical debt. If a section isn't needed, don't include it. If it IS needed, fill it now. Empty sections in a Skill cause confusion when the Skill is invoked.
    **Missing Gotchas**: You're building a Skill that WILL accumulate failure points. If you don't leave a [Gotchas] section, where will those lessons go? Nowhere — they'll be repeated.
    **Skipping Skill eval**: Shipping without `triggers.json` / `cases.json` — you won't know if description misfires or outputs regress. Run `pnpm skill-eval` after every meaningful SKILL.md change.

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
    - **`.forge/skills/<skill-name>/eval/`** — Skill eval pack (`triggers.json` + `cases.json`); run `pnpm skill-eval init <skill-name>` then `pnpm skill-eval <skill-name>` (see [skill-eval.md](../../docs/skill-eval.md))

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
        - Workflow — defines "in what order"
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
[Review Strategy]
    Reference [Quality Rubric] for scoring criteria and the Workflow section below for the creation sequence.

<!-- begin: workflow -->
[Workflow]
    → `references/workflow.md`
    6 步流程：Requirements → Reference → Structure → Fill → Create → Register。
<!-- end: workflow -->
<!-- begin: initialization -->
[Initialization]
    Execute [Step 1: Requirements Gathering]

<!-- end: initialization -->