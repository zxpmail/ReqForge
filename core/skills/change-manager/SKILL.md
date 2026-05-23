<!-- forge: change-manager v1.0 -->
---
name: change-manager
description: Used when the user adds a feature or incrementally changes an existing project that already has Product-Spec.md. Runs the changes/ workflow (propose, apply, verify, archive), aligned with OpenSpec-style SDD while delegating implementation to dev-planner and dev-builder.
---

[Task]
    Orchestrate **one named change** under `changes/<change-name>/` from proposal through archive.
    Do not replace product-spec-builder for greenfield projects or wholesale Spec rewrites — use this Skill for **brownfield, scoped deltas**.

[Not For]
    - First-time Product-Spec from scratch -> use /product-spec-builder instead
    - Whole Spec rewrite without a change folder -> use /product-spec-builder iteration mode
    - Bug fixes only -> use /bug-fixer instead
    - Release packaging -> use /release-builder instead

[Dependency Check]
    Required:
    - Product-Spec.md -> if missing, prompt to call /product-spec-builder first
    - Project has or will have `changes/` directory (create on first propose if absent)

    Optional:
    - DEV-PLAN.md -> apply phase may update or add Phases scoped to this change
    - Design-Brief.md / design MCP -> fill design.md when UI is involved
    - Existing `changes/<other>/` -> warn if another change folder is in progress without archive

[First Principles]
    **Agree Before Build**: proposal + specs must be user-confirmed before apply. No coding on vague "add dark mode" without specs.md acceptance criteria.
    **One Change, One Folder**: Never mix two features in one `changes/<name>/`. Split if scope creeps.
    **Truth in Product-Spec**: `Product-Spec.md` is the long-lived source of truth; `changes/*/specs.md` is the delta until archive merges back.
    **Fresh Context for Apply**: Start apply in a new session when possible — planning context pollutes implementation.
    **Verify Before Archive**: archive is blocked without verify evidence (verify.md or equivalent checklist in tasks.md).

[Output Style]
    **Tone**: Release train conductor — explicit phases, no skipping propose because "it's small."
    **Principles**:
    - X Never archive with open tasks in tasks.md
    - X Never apply without a populated tasks.md (run /dev-planner first)
    - V Every phase ends with a concrete artifact path
    - V Delegate coding to /dev-builder, planning to /dev-planner, deep Spec edits to /product-spec-builder when needed

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

[Gotchas]
    **Skipping propose**: "Just code it" -> still create minimal proposal.md + specs.md so archive and review have a baseline.
    **Orphan changes/**: Folders left un-archived for weeks -> list active changes on session start; nag to verify or archive.
    **Spec drift**: Merging specs.md into Product-Spec.md twice or not at all -> archive checklist must include CHANGELOG + Spec section update.
    **Whole-repo dev-builder**: apply must pass change scope (files/tasks from changes/<name>/ only), not entire DEV-PLAN backlog.

[Output Artifacts]
    - `changes/<change-name>/proposal.md`
    - `changes/<change-name>/specs.md`
    - `changes/<change-name>/design.md`
    - `changes/<change-name>/tasks.md`
    - `changes/<change-name>/verify.md` (after verify phase)
    - `changes/archive/<change-name>/` (after archive)

[Workflow]
    Parse user intent for phase: **propose** | **apply** | **verify** | **archive** (default: propose if only a change name/description given).

    [Phase: propose]
        1. Normalize `<change-name>` (kebab-case, e.g. add-dark-mode).
        2. Create `changes/<change-name>/` from templates/.
        3. Interview user until specs are testable; record in proposal.md + specs.md.
        4. If conflicts with Product-Spec.md -> surface options; may invoke /product-spec-builder iteration for merge.
        5. Stub design.md / tasks.md with "filled by dev-planner or design skills."
        6. User confirms -> stop. Do not apply in same turn unless user explicitly asks.

    [Phase: apply]
        1. Load all files under `changes/<change-name>/`.
        2. If tasks.md empty or placeholder -> invoke /dev-planner (iteration mode) to fill tasks.md and update DEV-PLAN.md for this change only.
        3. Recommend new session; then invoke /dev-builder for scoped Tasks only.
        4. After each Task: /code-review as per dev-builder loop.
        5. Mark tasks.md checkboxes as work completes.

    [Phase: verify]
        1. Re-read specs.md acceptance criteria vs implementation.
        2. Run project verification commands; capture output in verify.md.
        3. List any failed criteria; if fail -> apply phase again, do not archive.

    [Phase: archive]
        1. Require verify.md pass or explicit user waive (record in verify.md).
        2. Confirm Product-Spec.md + Product-Spec-CHANGELOG.md updated.
        3. `mv changes/<change-name>/ changes/archive/<change-name>/`
        4. Report next suggested change or return to normal dev-builder Phases.

[Initialization]
    If user message matches propose pattern -> run [Phase: propose].
    If `changes/<name>/` exists and user says implement -> run [Phase: apply].
    Reference: `core/docs/openspec-comparison.md` for Forge vs OpenSpec positioning.
