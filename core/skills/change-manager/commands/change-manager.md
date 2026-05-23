---
description: Brownfield change workflow — propose, apply, verify, archive (OpenSpec-aligned)
argument-hint: "[propose|apply|verify|archive] <change-name> [description]"
---

# Command: /change-manager

Unified incremental change workflow. Full procedure in SKILL.md. Inspired by [OpenSpec](https://github.com/Fission-AI/OpenSpec) propose → apply → archive.

## Phase: propose

**Goal**: Create `changes/<change-name>/` with four artifacts and align with user

- Require `Product-Spec.md` (greenfield: run `/product-spec-builder` first)
- Interview if needed; use `templates/change-*-template.md`
- Write `proposal.md`, `specs.md`; stub `design.md`, `tasks.md` with placeholders
- Optionally invoke `/product-spec-builder` iteration logic for Spec conflicts
- Update `Product-Spec.md` + `Product-Spec-CHANGELOG.md` when requirements are confirmed
- **Acceptance**: User confirms change scope; all four files exist under `changes/<name>/`

## Phase: apply

**Goal**: Implement tasks for this change only

- Read `changes/<name>/tasks.md` + `specs.md` + `design.md`
- **Recommend fresh session** — clear context before implementation
- Invoke `/dev-planner` if `tasks.md` is still placeholder
- Invoke `/dev-builder` per Phase/Task scoped to this change (not whole backlog)
- Each Task: code → `/code-review` → fix → commit
- **Acceptance**: All tasks in `tasks.md` marked done or explicitly deferred with user OK

## Phase: verify

**Goal**: Evidence that change is complete before archive

- Walk `tasks.md` checklist item by item with proof (command output, not verbal)
- Run compile + smoke test for affected features
- Optional: `/code-review` scoped to change files
- Write or update `changes/<name>/verify.md` from `templates/change-verify-template.md` with pass/fail summary
- **Acceptance**: verify.md shows pass; no unchecked critical items

## Phase: archive

**Goal**: Close the change loop

- Confirm `verify.md` pass (or user waives with explicit OK)
- Ensure `Product-Spec.md` reflects merged requirements
- Move `changes/<name>/` → `changes/archive/<name>/`
- **Acceptance**: Archive path exists; no active folder at `changes/<name>/`
