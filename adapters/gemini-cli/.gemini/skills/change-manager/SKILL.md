<!-- forge: change-manager v1.1 -->
---
name: change-manager
description: Used when the user adds a feature or incrementally changes an existing project that already has Product-Spec.md. Runs the changes/ workflow (propose, apply, verify, archive), aligned with OpenSpec-style SDD while delegating implementation to dev-planner and dev-builder.
version: 1.1.0
updated: 2026-05-26
requires: []
---

<!-- begin: task -->
[Task]
    Orchestrate **one named change** under `changes/<change-name>/` from proposal through archive.
    Do not replace product-spec-builder for greenfield projects or wholesale Spec rewrites — use this Skill for **brownfield, scoped deltas**.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - First-time Product-Spec from scratch -> use /product-spec-builder instead
    - Whole Spec rewrite (major iteration, no single feature scope) -> use /product-spec-builder iteration mode on Product-Spec.md directly
    - Bug fixes only -> use /bug-fixer instead
    - Release packaging -> use /release-builder instead

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Required:
    - Product-Spec.md -> if missing, prompt to call /product-spec-builder first
    - Project has or will have `changes/` directory (create on first propose if absent)

    Optional:
    - DEV-PLAN.md -> apply phase may update or add Phases scoped to this change
    - Design-Brief.md / design MCP -> fill design.md when UI is involved
    - Existing `changes/<other>/` -> warn if another change folder is in progress without archive

<!-- end: dependency-check -->
<!-- begin: first-principles -->
[First Principles]
    → `references/first-principles.md`

<!-- end: first-principles -->
<!-- begin: openspec-superpowers-handoff -->
[OpenSpec + Superpowers Handoff]
    → `references/openspec-handoff.md`

<!-- end: openspec-superpowers-handoff -->
<!-- begin: output-style -->
[Output Style]
    → `references/output-style.md`
    → 每 Phase（propose/apply/verify/archive）完成后必须附加 `../_shared/output-status-protocol.md`

<!-- end: output-style -->
<!-- begin: file-structure -->
[File Structure]
    ```
    change-manager/
    ├── SKILL.md
    ├── commands/change-manager.md
    ├── references/
    │   ├── first-principles.md
    │   ├── openspec-handoff.md
    │   ├── output-style.md
    │   ├── change-assessment-checklist.md
    │   ├── anti-rationalization.md
    │   ├── anti-ai-slop-checklist.md
    │   └── workflow.md              # propose → apply → verify → archive
    └── templates/
        ├── change-proposal-template.md
        ├── change-specs-template.md
        ├── change-design-template.md
        ├── change-tasks-template.md
        └── change-verify-template.md
    ```

<!-- end: file-structure -->
<!-- begin: gotchas -->
[Gotchas]
    **Skipping propose**: "Just code it" -> still create minimal proposal.md + specs.md so archive and review have a baseline.
    **product-spec-builder overlap**: Do not let product-spec-builder create `changes/` — only this skill creates that folder. It may still edit Product-Spec.md during propose when merging requirements.
    **Orphan changes/**: Folders left un-archived for weeks -> list active changes on session start; nag to verify or archive.
    **Spec drift**: Merging specs.md into Product-Spec.md twice or not at all -> archive checklist must include CHANGELOG + Spec section update.
    **Whole-repo dev-builder**: apply must pass change scope (files/tasks from changes/<name>/ only), not entire DEV-PLAN backlog.

<!-- end: gotchas -->
<!-- begin: anti-rationalization-checklist -->
[Anti-Rationalization Checklist]
    → `references/anti-rationalization.md`
    迭代过程中遇阻力时读取：识别跳过 propose/verify/archive 环节的常见借口。

<!-- end: anti-rationalization-checklist -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - `changes/<change-name>/proposal.md`
    - `changes/<change-name>/specs.md`
    - `changes/<change-name>/design.md`
    - `changes/<change-name>/tasks.md`
    - `changes/<change-name>/verify.md` (after verify phase)
    - `changes/archive/<change-name>/` (after archive)

<!-- end: output-artifacts -->
<!-- begin: change-assessment-checklist -->
[Change Assessment Checklist]
    → `references/change-assessment-checklist.md`

<!-- end: change-assessment-checklist -->
<!-- begin: dimension-checklist -->
[Dimension Checklist]
    See [references/dimension-checklist.md](references/dimension-checklist.md) for the full dimension checklist.

    Must-have dimensions:
    - **Change scope boundaries**: explicit IN/OUT statement to prevent creep
    - **Backward compatibility**: check API, schema, serialization for breaking changes
    - **Testing coverage**: every changed file needs a test update
    - **Rollback plan**: define minutes-to-execute undo strategy
    - **Dependency impact**: trace ripple effect via dep-graph

<!-- end: dimension-checklist -->
<!-- begin: quality-rubric -->
[Quality Rubric]
    8-item, 16-point scoring system. Ship threshold: **≥ 12** with no critical item scoring 0.

    | # | Dimension | Pts | Critical | Scoring |
    |---|-----------|-----|----------|---------|
    | 1 | Scope boundary clarity | 2 | YES | 2 = Explicit IN/OUT statement, no scope creep during apply; 1 = IN defined but OUT vague; 0 = No scope boundary specified |
    | 2 | Proposal completeness | 2 | YES | 2 = RED observation + GREEN change + Verify-by all present; 1 = Missing one element; 0 = Incomplete proposal |
    | 3 | Backward compatibility | 2 | — | 2 = API/schema/serialization checked for breaking changes; 1 = Checked but missed some; 0 = Not assessed |
    | 4 | Apply fidelity | 2 | — | 2 = Only change-scoped files modified, no DEV-PLAN backlog creep; 1 = Minor scope creep; 0 = Full backlog changes mixed in |
    | 5 | Testing coverage | 2 | YES | 2 = Every changed file has a test update, tests pass; 1 = Tests added but gaps; 0 = No test updates |
    | 6 | Rollback readiness | 2 | — | 2 = Minutes-to-execute undo strategy defined; 1 = Rollback considered but not scripted; 0 = No rollback plan |
    | 7 | Archive completeness | 2 | — | 2 = CHANGELOG + Spec merged, files moved to archive/; 1 = Archived but missing doc updates; 0 = Orphan folder left |
    | 8 | Verification evidence | 2 | YES | 2 = Demonstrated before/after, tests pass, no regression; 1 = Claims done without demonstration; 0 = No verification |

    **Scoring**: Run `pnpm validate-skill --score core/skills/change-manager` to compute.
<!-- end: quality-rubric -->
<!-- begin: workflow -->
[Workflow]
    Parse user intent: **propose** | **apply** | **verify** | **archive** (default: propose if only a change name/description given).
    1. Run [Dependency Check]
    2. Read `references/first-principles.md`
    3. **必须先 Read `references/workflow.md`** — propose → apply → verify → archive
    4. Phase rigor → `references/change-assessment-checklist.md`
    5. 交付前执行 `references/anti-ai-slop-checklist.md` 自检
    6. apply / dev-builder 边界 → `references/openspec-handoff.md`

<!-- end: workflow -->
<!-- begin: initialization -->
[Initialization]
    If user message matches propose pattern -> run [Phase: propose] per `references/workflow.md`.
    If `changes/<name>/` exists and user says implement -> run [Phase: apply] per `references/workflow.md`.
    Execute [Workflow]

<!-- end: initialization -->
