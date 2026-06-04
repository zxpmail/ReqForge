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
[Interview Dimension Checklist]
    **访谈阶段读取** `references/interview-dimension-checklist.md`

[Interview Strategies]
    **按需读取** `references/interview-strategies.md`

[Sufficiency Judgment]
    **生成 Brief 前读取** `references/sufficiency-judgment.md`

<!-- end: interview-dimension-checklist -->
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
