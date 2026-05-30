<!-- forge: code-review v2.1 -->
---
name: code-review
description: Used when the user wants to review code, check quality, verify feature completeness, or needs to validate code implementation against Spec and design mockups. Outputs a structured review report with evidence for each conclusion.
version: 2.1.0
updated: 2026-05-30
requires: []
---

<!-- begin: task -->
[Task]
    Review code implementation completeness and quality against Product-Spec.md and design mockups.
    Output a structured review report. Fixes are executed by the main Agent using dev-builder or bug-fixer Skill after receiving the report.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Fixing bugs -> use /bug-fixer instead
    - Writing new features -> use /dev-builder instead
    - Requirements gathering -> use /product-spec-builder instead

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Automatically executed as the first step when the Skill starts:

    Required:
    - Product-Spec.md -> if missing, prompt to call /product-spec-builder first
    - Project code exists -> if no code, prompt to call /dev-builder first

    Optional (enhances review capability):
    - `.forge/security-guidance.md` -> if present, **must read** for moderate/complex reviews or when `code-reviewer-security` runs
    - DEV-PLAN.md -> if available, cross-reference Phase delivery checklist
    - Design-Brief.md -> if available, cross-reference visual specifications
    - Design tool MCP -> if available, extract design values and compare with code
    - Playwright plugin -> if available, automate UI interaction testing
    - git -> if available, use git diff to trace change scope

<!-- end: dependency-check -->
<!-- begin: shared-discipline -->
[Shared Discipline]
    Review 时重点查 Surgical Changes + Simplicity First → `../_shared/karpathy-discipline.md`

<!-- end: shared-discipline -->
<!-- begin: first-principles -->
[First Principles]
    **Review 前必读** `references/first-principles.md`

<!-- end: first-principles -->
<!-- begin: output-style -->
[Output Style]
    → `references/output-style.md`

<!-- end: output-style -->
<!-- begin: file-structure -->
[File Structure]
    ```
    code-review/
    ├── SKILL.md
    ├── commands/code-review.md
    └── references/
        ├── first-principles.md
        ├── output-style.md
        ├── judgment-spectrum.md
        ├── anti-rationalization.md
        ├── review-dimension-checklist.md
        ├── review-strategy.md
        ├── workflow.md                 # Step 1–5（必读）
        └── yolo-mode.md
    ../_shared/
    ```

<!-- end: file-structure -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **Review report** (screen output) — parallel agent review results with aggregated findings

<!-- end: output-artifacts -->
<!-- begin: judgment-spectrum -->
[Judgment Spectrum]
    → `references/judgment-spectrum.md`

<!-- end: judgment-spectrum -->
<!-- begin: review-dimension-checklist -->
[Review Dimension Checklist]
    Moderate/complex → 4 parallel specialized agents (see `workflow.md` Step 2). Simple → aggregator quick pass only.
    **按需读取** `references/review-dimension-checklist.md`

<!-- end: review-dimension-checklist -->
<!-- begin: gotchas -->
[Gotchas]
    **Surface-level review**: Every line traceable to Spec; drift flagged.
    **Evidence-less conclusions**: Every finding needs file:line.
    **Confidence inflation**: Honest uncertainty beats false 100%.
    **Regression blind spot**: Use `dep-graph affected <file>` if available.
    **Skipping compilation verification**: Run compile every time.

<!-- end: gotchas -->
<!-- begin: anti-rationalization-checklist -->
[Anti-Rationalization Checklist]
    → `references/anti-rationalization.md`

<!-- end: anti-rationalization-checklist -->
<!-- begin: review-strategy -->
[Review Strategy]
    **按需读取** `references/review-strategy.md`

<!-- end: review-strategy -->
<!-- begin: workflow -->
[Workflow]
    1. Run [Dependency Check]
    2. Read `references/first-principles.md`
    3. **必须先 Read `references/workflow.md`** — Step 1–5（baseline → dispatch → scan → aggregate → report）
    4. 维度与方法 → `review-dimension-checklist.md` + `review-strategy.md`
    5. `FORGE_MODE=yolo` → `references/yolo-mode.md`

<!-- end: workflow -->
<!-- begin: yolo-mode -->
[YOLO Mode]
    → `references/yolo-mode.md`

<!-- end: yolo-mode -->
<!-- begin: initialization -->
[Initialization]
    Execute [Workflow] — start at `references/workflow.md` Step 1

<!-- end: initialization -->
