<!-- forge: dev-planner v1.1 -->
---
name: dev-planner
description: Used when Product-Spec.md is complete and needs to be planned into development phases. Also used to update existing development plans after Spec changes. Outputs DEV-PLAN.md.
version: 1.1.0
updated: 2026-05-26
requires: []
---

<!-- begin: task -->
[Task]
    **Generation Mode**: Read Product-Spec.md (and Design-Brief.md, if present), analyze feature dependency relationships, WebSearch to validate technology choices, output a phased development plan DEV-PLAN.md.

    **Iteration Mode**: When the Product Spec changes, analyze the scope of impact, update the Phase breakdown and file inventory in DEV-PLAN.md. Completed Phases (marked with [x]) remain untouched.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Writing actual code -> use /dev-builder instead
    - Gathering requirements -> use /product-spec-builder instead
    - Fixing bugs -> use /bug-fixer instead

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Executed automatically as the first step when the Skill starts:

    Required:
    - Product-Spec.md -> if missing, prompt user to call /product-spec-builder first
    - Product-Spec.md must include completed **§ Idea Stage Exit Criteria** (three questions) — if missing or `TBD`, route back to `/product-spec-builder` before generating DEV-PLAN

    Optional (degradation mode):
    - Design-Brief.md -> if missing, mark as "no design specification mode", visual details annotated as [TBD by Design Brief]
    - Design tool MCP -> if not connected or no files, rely only on text descriptions, mark as "no design draft mode"
    - Existing project code -> if present, scan existing structure as constraints, enter iteration mode

<!-- end: dependency-check -->
<!-- begin: first-principles -->
[First Principles]
    **Plan 前必读** `references/first-principles.md`

<!-- end: first-principles -->
<!-- begin: shared-discipline -->
[Shared Discipline]
    Karpathy 四原则 → `../_shared/karpathy-discipline.md`

<!-- end: shared-discipline -->
<!-- begin: hard-gate -->
[HARD-GATE]
    Until `DEV-PLAN.md` saved **and** user explicitly confirms → **MUST NOT** invoke `/dev-builder`. Chat "looks good" ≠ confirm.
    Prerequisites: `Product-Spec.md` must exist. Rationalizations → `references/plan-hard-gate-rationalization.md`

<!-- end: hard-gate -->
<!-- begin: file-structure -->
[File Structure]
    ```
    dev-planner/
    ├── SKILL.md
    ├── commands/dev-planner.md
    └── references/
        ├── first-principles.md
        ├── analysis-dimension-checklist.md
        ├── analysis-strategies.md
        ├── workflow.md
        ├── architecture-health-pass.md
        └── plan-hard-gate-rationalization.md
    ../_shared/
    ```

<!-- end: file-structure -->
<!-- begin: output-style -->
[Output Style]
    → `../_shared/output-style-concise.md`（Plan 额外要求：每 Phase 可独立编译运行；Task 列具体文件路径；禁止 TBD）
    → DEV-PLAN 完成必须附加 `../_shared/output-status-protocol.md`

<!-- end: output-style -->
<!-- begin: gotchas -->
[Gotchas]
    **Unrealistic Phasing**: Each Phase must produce compilable, runnable output — split if no visible outcome.
    **Missing dependency order**: infrastructure → data → API → UI.
    **Tech stack without WebSearch**: Confirm versions before writing DEV-PLAN.
    **Ignoring existing code**: Iteration mode — scan structure first.
    **Missing MVP Scope**: Fill `## MVP Scope` before Phase 1.

<!-- end: gotchas -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **DEV-PLAN.md** — Phased development plan (created in generation mode, updated in iteration mode)
    - **changes/\<change-name\>/tasks.md** — Task breakdown (filled when `/change-manager apply` invokes dev-planner for that change only — not by product-spec-builder iteration)

<!-- end: output-artifacts -->
<!-- begin: analysis-dimension-checklist -->
[Analysis Dimension Checklist]
    **Planning 前读取** `references/analysis-dimension-checklist.md`

<!-- end: analysis-dimension-checklist -->
<!-- begin: analysis-strategies -->
[Analysis Strategies]
    **按需读取** `references/analysis-strategies.md`

<!-- end: analysis-strategies -->
<!-- begin: information-sufficiency-criteria -->
[Information Sufficiency Criteria]
    Must satisfy before output: tech stack verified, Phase breakdown + key files + dependency order, all Spec features covered. Details in `references/analysis-dimension-checklist.md` §Information Sufficiency.

<!-- end: information-sufficiency-criteria -->
<!-- begin: workflow -->
[Workflow]
    1. Run [Dependency Check]
    2. Read `references/first-principles.md`
    3. **必须先 Read `references/workflow.md`** 对应模式章节（Generation / Iteration），再输出 DEV-PLAN
    4. Apply `references/analysis-dimension-checklist.md` + `references/analysis-strategies.md` during Analysis
    5. Optional: `references/architecture-health-pass.md` when user requests architecture health review

<!-- end: workflow -->
<!-- begin: architecture-health-pass -->
[Architecture Health Pass]
    Optional → `references/architecture-health-pass.md`

<!-- end: architecture-health-pass -->
<!-- begin: initialization -->
[Initialization]
    Generation Mode if no DEV-PLAN.md (or greenfield); Iteration Mode if DEV-PLAN exists + Spec changed. Route via [Workflow] step 3.

<!-- end: initialization -->
