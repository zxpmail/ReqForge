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
    **Tech Stack**: 规划前读 `.forge/dev-map.md` 的技术栈节，确保 DEV-PLAN.md 的技术栈与 dev-map 一致。

<!-- end: first-principles -->
<!-- begin: shared-discipline -->
[Shared Discipline]
    Karpathy 四原则 → `../_shared/karpathy-discipline.md`

<!-- end: shared-discipline -->
<!-- begin: hard-gate -->
[HARD-GATE]
    Until `DEV-PLAN.md` saved **and** user explicitly confirms → write `.forge/plan-confirmed.json` → **MUST NOT** invoke `/dev-builder`. Chat "looks good" ≠ confirm.
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
[Dimension Checklist]
    See [references/analysis-dimension-checklist.md](references/analysis-dimension-checklist.md) for the full analysis dimension checklist.

    Must-have dimensions:
    - **Technology Stack**: framework + version + key deps confirmed
    - **Phase Breakdown**: ordered sequence based on dependency relationships
    - **Delivery Checklist**: each Phase has verifiable deliverables
    - **Key Files**: each Phase lists specific file paths
    - **Dependency Graph**: Phase ordering respects feature dependencies

[Anti-Rationalization Checklist]
    → `references/plan-hard-gate-rationalization.md`
    在 DEV-PLAN.md 确认前禁止调用 /dev-builder。

[Plan Critique Check]
    → `references/plan-critique-check.md`
    Generation Mode: Analysis Phase 后、Output Phase 前执行。挑战 Phase 顺序、MVP 范围、技术栈选择。
    Iteration Mode / 用户说 "skip plan critique" → 跳过。

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
<!-- begin: quality-rubric -->
[Quality Rubric]
    10-item, 20 point scoring system. Ship threshold: **>= 16** with no critical item scoring 0.

    | # | Dimension | Pts | Critical | Scoring |
    |---|-----------|-----|----------|---------|
    | 1 | Phase independence | 2 | YES | 2 = Each Phase produces compilable, runnable, testable output; 1 = Most Phases deliverable but one depends on future phases; 0 = Phases are just task groupings with no runnable milestone |
    | 2 | Dependency ordering | 2 | YES | 2 = Phases follow correct technical order: infra -> data -> API -> UI; 1 = Minor ordering issues but non-blocking; 0 = Backend phase scheduled after frontend that depends on it |
    | 3 | MVP clarity | 2 | YES | 2 = Phase 1 is a true MVP with working core functionality, not just setup; 1 = Phase 1 is mostly boilerplate with minimal functionality; 0 = Phase 1 is pure project init with no user-visible output |
    | 4 | Task granularity | 2 | -- | 2 = Tasks small enough for one session (2-4 hours); concrete deliverables; 1 = Some tasks reasonable, others too large; 0 = Tasks are vague epics with no clear completion point |
    | 5 | Key file completeness | 2 | -- | 2 = Every Phase lists concrete files to create/modify with paths; 1 = Most Phases have file lists but some missing; 0 = No file-level detail, just "implement X" |
    | 6 | Acceptance criteria | 2 | YES | 2 = Each Phase has verifiable completion criteria (testable); 1 = Criteria present but some vague or untestable; 0 = No acceptance criteria beyond "works correctly" |
    | 7 | Risk awareness | 2 | -- | 2 = Identifies risky items (third-party deps, complex algorithms, perf) with mitigation; 1 = Some risks mentioned but no mitigation; 0 = No risk assessment |
    | 8 | Technical stack alignment | 2 | -- | 2 = Plan respects chosen stack constraints; versions verified via WebSearch; 1 = Mostly aligned but some tasks assume unavailable APIs; 0 = Plan contradicts chosen tech stack |
    | 9 | Estimability | 2 | -- | 2 = Each Phase has rough time estimate; cross-phase dependencies explicit; 1 = Estimates present but not tied to task complexity; 0 = No estimates or dependency mapping |
    | 10 | Iteration responsiveness | 2 | -- | 2 = Plan cleanly accommodates Spec changes without invalidating completed Phases; 1 = Minor disruption from changes but manageable; 0 = Single Spec change forces full replan |

    **Scoring**: Run `pnpm validate-skill --score core/skills/dev-planner` to compute.

<!-- end: quality-rubric -->
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
