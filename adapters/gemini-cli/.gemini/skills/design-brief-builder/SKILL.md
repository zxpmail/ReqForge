<!-- forge: design-brief-builder v1.1 -->
---
name: design-brief-builder
description: Used when the user wants to define a design style or visual direction, or says something vague like 'I want a premium/sleek/modern look'. Guides the user through a design interview to clarify visual preferences and outputs Design-Brief.md.
version: 1.1.0
updated: 2026-05-30
requires: []
---

<!-- begin: task -->
[Task]
    Through a designer-interviews-client approach, guide the user to define the product's visual direction and output a well-structured Design-Brief.md that can be used both by design tools and by dev-builder for coding.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Generating actual mockups or design files -> use /design-maker instead
    - Writing code -> use /dev-builder instead
    - Defining product features -> use /product-spec-builder instead

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Automatically executed as the first step when the Skill starts:

    Required:
    - Product-Spec.md → If missing, prompt the user to call /product-spec-builder first

    Optional (fallback mode):
    - Design tool MCP → If not connected, mark as "manual design mode". The Design Brief is still generated, and the user feeds it to the design tool on their own.

<!-- end: dependency-check -->
<!-- begin: first-principles -->
[First Principles]
    **Brief 前必读** `references/first-principles.md`

<!-- end: first-principles -->
<!-- begin: shared-discipline -->
[Shared Discipline]
    Karpathy 四原则 → `../_shared/karpathy-discipline.md`（Web-First / 不猜）

<!-- end: shared-discipline -->
<!-- begin: output-style -->
[Output Style]
    → `references/output-style.md`（设计师访谈人格）

<!-- end: output-style -->
<!-- begin: file-structure -->
[File Structure]
    ```
    design-brief-builder/
    ├── SKILL.md
    ├── commands/design-brief-builder.md
    ├── templates/design-brief-template.md
    └── references/
        ├── first-principles.md
        ├── output-style.md
        ├── workflow.md                    # 四阶段完整流程（必读）
        ├── interview-dimension-checklist.md
        ├── interview-strategies.md
        ├── sufficiency-judgment.md
        ├── design-discovery-questionnaire.md
        ├── visual-direction-presets.md
        ├── anti-ai-slop-checklist.md
        └── anti-rationalization.md
    ../_shared/
    ```

<!-- end: file-structure -->
<!-- begin: gotchas -->
[Gotchas]
    **Open-ended questions instead of choices**: Always give concrete options (Linear or Notion? Dark or light?).
    **Relying on memory for design trends**: WebSearch before recommending.
    **Skipping accessibility**: Contrast, hierarchy, touch targets belong in Brief.
    **Copying without thinking**: Adapt reference products; don't clone blindly.
    **Missing refinement preference**: Ask whether the user wants a single delivery or graduated tiers (layout → interaction → edge cases). Gradual refinement catches structural issues early when they're cheap to fix.

<!-- end: gotchas -->
<!-- begin: anti-rationalization-checklist -->
[Anti-Rationalization Checklist]
    → `references/anti-rationalization.md`
    遇 skipping interview / skipping WebSearch 等场景时读取。

<!-- end: anti-rationalization-checklist -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **Design-Brief.md** — Design specification document containing mood direction, color direction, information density, interaction style, etc.

<!-- end: output-artifacts -->
<!-- begin: interview-dimension-checklist -->
[Dimension Checklist]
    See [references/interview-dimension-checklist.md](references/interview-dimension-checklist.md) for the full interview dimension checklist.

    Must-have dimensions:
    - **Mood Direction**: 3 keywords + ≥1 reference product
    - **Color Direction**: cool/warm/neutral + dark/light + brand color
    - **Information Density**: feature count matched to layout density
    - **Core Feature Visuals**: every Spec UI feature gets visual direction
    - **Accessibility**: contrast, hierarchy, touch targets

[Interview Dimension Checklist]
    **访谈阶段读取** `references/interview-dimension-checklist.md`

[Interview Strategies]
    **按需读取** `references/interview-strategies.md`

[Sufficiency Judgment]
    **生成 Brief 前读取** `references/sufficiency-judgment.md`

<!-- end: interview-dimension-checklist -->
<!-- begin: quality-rubric -->
[Quality Rubric]
    8-item, 16-point scoring system. Ship threshold: **≥ 12** with no critical item scoring 0.

    | # | Dimension | Pts | Critical | Scoring |
    |---|-----------|-----|----------|---------|
    | 1 | Interview thoroughness | 2 | YES | 2 = All 5+ design dimensions covered (color, typography, density, interaction, mood); 1 = 3-4 dimensions; 0 = <3 dimensions |
    | 2 | Concreteness | 2 | — | 2 = Options over open-ended questions for every preference; 1 = Mixed open/closed; 0 = Open-ended questions throughout |
    | 3 | Visual direction specificity | 2 | YES | 2 = Colors, typography, spacing, density, interaction all defined; 1 = Partial direction; 0 = Vague ("modern") |
    | 4 | Reference grounding | 2 | — | 2 = WebSearch for trends + reference products named and analyzed; 1 = Search done but not applied; 0 = No external research |
    | 5 | Accessibility consideration | 2 | — | 2 = Contrast ratios, hierarchy, touch targets discussed in Brief; 1 = Mentioned but not specified; 0 = Absent |
    | 6 | Spec alignment | 2 | — | 2 = Visual direction supports all Product-Spec.md user flows; 1 = Minor misalignment; 0 = Contradicts Spec |
    | 7 | Sufficiency judgment | 2 | YES | 2 = Executed `references/sufficiency-judgment.md` and passed; 1 = Executed but gaps found; 0 = Skipped |
    | 8 | Anti-ai-slop executed | 2 | — | 2 = `references/anti-ai-slop-checklist.md` completed before output; 1 = Partial check; 0 = Skipped |

    **Scoring**: Run `pnpm validate-skill --score core/skills/design-brief-builder` to compute.
<!-- end: quality-rubric -->
<!-- begin: workflow -->
[Workflow]
    1. Run [Dependency Check]
    2. Read `references/first-principles.md`
    3. **必须先 Read `references/workflow.md`**，按 Startup → Interview → Translation → Output 执行
    4. 访谈中按需读 dimension-checklist / strategies / sufficiency-judgment
    5. 定稿前执行 `references/anti-ai-slop-checklist.md`

<!-- end: workflow -->
<!-- begin: initialization -->
[Initialization]
    Execute [Workflow]

<!-- end: initialization -->
