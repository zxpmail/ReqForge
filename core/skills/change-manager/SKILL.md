<!-- forge: change-manager v1.0 -->
---
name: change-manager
description: Used when the user adds a feature or incrementally changes an existing project that already has Product-Spec.md. Runs the changes/ workflow (propose, apply, verify, archive), aligned with OpenSpec-style SDD while delegating implementation to dev-planner and dev-builder.
version: 1.0.0
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
    **Agree Before Build**: proposal + specs must be user-confirmed before apply. No coding on vague "add dark mode" without specs.md acceptance criteria.
    **One Change, One Folder**: Never mix two features in one `changes/<name>/`. Split if scope creeps.
    **Truth in Product-Spec**: `Product-Spec.md` is the long-lived source of truth; `changes/*/specs.md` is the delta until archive merges back.
    **Fresh Context for Apply**: Start apply in a new session when possible — planning context pollutes implementation.
    **Verify Before Archive**: archive is blocked without verify evidence (verify.md or equivalent checklist in tasks.md).
    **Two Plans, Two Jobs**: `changes/<name>/tasks.md` = **business task list** for this change; `DEV-PLAN.md` = **engineering Phases** for the whole product. Do not merge them into one file. `/dev-planner` fills tasks.md; `/dev-builder` executes Tasks — it does not replace `/change-manager apply`.

<!-- end: first-principles -->
<!-- begin: openspec-superpowers-handoff -->
[OpenSpec + Superpowers Handoff]
    Article reference: [shuge-openspec-superpowers-comparison.md](../../docs/shuge-openspec-superpowers-comparison.md) (术哥无界 OpenSpec + Superpowers 实战).

    | User intent | Forge command | Not |
    |-------------|---------------|-----|
    | Create change + delta specs | **propose** | dev-builder |
    | Implement scoped change from `changes/<name>/` | **apply** → dev-builder (Change-Scoped) | OpenSpec `/opsx:apply` alone |
    | Fill tasks / design for a change | **apply** Step 2 → dev-planner | product-spec-builder creating `changes/` |
    | 0→1 Phase backlog | dev-planner → dev-builder (Phase mode) | change-manager |

    **Explicit paths on apply** (do not rely on Agent to "discover" OpenSpec-style dirs):
    - `changes/<change-name>/proposal.md`
    - `changes/<change-name>/specs.md` (Delta + acceptance)
    - `changes/<change-name>/design.md`
    - `changes/<change-name>/tasks.md`
    - Optional: `DEV-PLAN.md` — add **one Phase entry** for this change only, not whole-repo backlog

    When invoking dev-builder from apply, pass **`change-name=<change-name>`** in the user message so Loading Phase reads the folder above.

<!-- end: openspec-superpowers-handoff -->
<!-- begin: output-style -->
[Output Style]
    **Tone**: Release train conductor — explicit phases, no skipping propose because "it's small."
    **Principles**:
    - X Never archive with open tasks in tasks.md
    - X Never apply without a populated tasks.md (run /dev-planner first)
    - V Every phase ends with a concrete artifact path
    - V Delegate coding to /dev-builder, planning to /dev-planner, deep Spec edits to /product-spec-builder when needed

<!-- end: output-style -->
<!-- begin: file-structure -->
[File Structure]
    ```
    change-manager/
    ├── SKILL.md
    ├── commands/change-manager.md
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
    Before entering a Phase, assess the change scope and determine the appropriate level of rigor:

    | Dimension | Must-Have | Recommended | Optional |
    |-----------|-----------|-------------|----------|
    | **Spec Impact** | specs.md updated | Product-Spec.md merged | Product-Spec-CHANGELOG.md updated |
    | **UI Change** | design.md filled | Design-Brief.md cross-ref | Design tool MCP for values |
    | **Scope Control** | single feature per folder | tasks.md with acceptance criteria | DEV-PLAN.md Phase entry |
    | **Review Depth** | /code-review on diff | regression on affected modules | full /code-review on whole project |
    | **Archive Readiness** | verify.md pass | user sign-off recorded | CHANGELOG updated |

    Reference: see [Output Artifacts] for expected files per level.

<!-- end: change-assessment-checklist -->
<!-- begin: workflow -->
[Workflow]
    Parse user intent for phase: **propose** | **apply** | **verify** | **archive** (default: propose if only a change name/description given). Execute the corresponding Phase steps below. Reference the [Change Assessment Checklist] to determine rigor for the current change.

<!-- end: workflow -->
    <!-- begin: phase:-propose -->
    [Phase: propose]
        Step 1: Normalize name
            Normalize `<change-name>` (kebab-case, e.g. add-dark-mode). See [Dependency Check] for prerequisites.
        Step 2: Scaffold directory
            Create `changes/<change-name>/` from templates/ (see [File Structure]).
        Step 3: Interview user
            Interview user until specs are testable; record in proposal.md + specs.md.
        Step 4: Resolve conflicts
            If conflicts with Product-Spec.md -> surface options; may invoke /product-spec-builder iteration for merge.
        Step 5: Stub remaining
            Stub design.md / tasks.md with "filled by dev-planner or design skills."
        Step 6: Confirm
            User confirms -> stop. Do not apply in same turn unless user explicitly asks.

    <!-- end: phase:-propose -->
    <!-- begin: phase:-apply -->
    [Phase: apply]
        Step 1: Load change context
            Read **all** artifacts under `changes/<change-name>/` (see [OpenSpec + Superpowers Handoff] paths). If folder missing -> propose first.
        Step 2: Plan tasks
            If tasks.md empty or placeholder -> invoke /dev-planner (change-scoped) to fill tasks.md; may add **one** DEV-PLAN.md Phase entry for this change only.
        Step 3: Implement
            Recommend new session; invoke /dev-builder with **Change-Scoped Mode** and explicit `change-name=<change-name>`. Scope = tasks.md checkboxes only — not full DEV-PLAN backlog.
        Step 4: Review
            After each Task: execute [Change Assessment Checklist] scope dimension; then /code-review as per dev-builder loop.
        Step 5: Track progress
            Mark tasks.md checkboxes as work completes.

    <!-- end: phase:-apply -->
    <!-- begin: phase:-verify -->
    [Phase: verify]
        Step 1: Compare against spec
            Re-read specs.md acceptance criteria vs implementation.
        Step 2: Run verification
            Run project verification commands; capture output in verify.md.
        Step 3: Assess results
            List any failed criteria; if fail -> apply phase again, do not archive.

    <!-- end: phase:-verify -->
        <!-- begin: goal-driven-verification-template -->
        [Goal-Driven Verification Template]
        For each acceptance criterion in specs.md:
        - "[Criterion]" → "[how to verify]" → "[pass/fail + command output]"

        Example:
        - "Dark mode toggle persists across page reload" → "toggle dark mode, reload, check body class" → "pass (body.dark present after reload)"
        - "Search returns results within 500ms" → "bench-search.js 10 iterations" → "fail (avg 1200ms, p95 2400ms)"

        Archive is blocked until all criteria pass or user explicitly waives (record in verify.md).

        <!-- end: goal-driven-verification-template -->
    <!-- begin: phase:-archive -->
    [Phase: archive]
        Step 1: Verify gate
            Require verify.md pass or explicit user waive (record in verify.md). See [Change Assessment Checklist] archive readiness dimension.
        Step 2: Update Spec
            Merge `specs.md` **Delta Spec** sections (ADDED/MODIFIED/REMOVED) into Product-Spec.md; confirm Product-Spec-CHANGELOG.md updated.
        Step 3: Move to archive
            `mv changes/<change-name>/ changes/archive/<change-name>/`
        Step 4: Report next steps
            Report next suggested change or return to normal dev-builder Phases.

    <!-- end: phase:-archive -->
<!-- begin: initialization -->
[Initialization]
    If user message matches propose pattern -> run [Phase: propose].
    If `changes/<name>/` exists and user says implement -> run [Phase: apply].
    Reference: `core/docs/openspec-comparison.md` for Forge vs OpenSpec positioning; `core/docs/shuge-openspec-superpowers-comparison.md` for apply vs dev-builder boundaries.

<!-- end: initialization -->