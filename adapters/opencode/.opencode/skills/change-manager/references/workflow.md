# change-manager — Workflow

> **必读**。主 SKILL 解析 phase 后按本节逐步执行。

Parse user intent for phase: **propose** | **apply** | **verify** | **archive** (default: propose if only a change name/description given). Reference [change-assessment-checklist.md](./change-assessment-checklist.md) for rigor.

---

## Phase: propose

1. **Normalize name** — kebab-case (e.g. `add-dark-mode`). Prerequisites → main SKILL [Dependency Check].
2. **Scaffold directory** — Create `changes/<change-name>/` from `templates/`.
3. **Interview user** — Until specs are testable; record in `proposal.md` + `specs.md`.
4. **Resolve conflicts** — If conflicts with `Product-Spec.md` → surface options; may invoke `/product-spec-builder` iteration for merge.
5. **Stub remaining** — Stub `design.md` / `tasks.md` with "filled by dev-planner or design skills."
6. **Confirm** — User confirms → stop. Do not apply in same turn unless user explicitly asks.

---

## Phase: apply

1. **Load change context** — Read **all** artifacts under `changes/<change-name>/` (paths → [openspec-handoff.md](./openspec-handoff.md)). If folder missing → propose first.
2. **Snapshot pre-change files** — Before any file modification, save copies of all files that will be changed into `changes/<change-name>/_snapshot/`. Run `pnpm forge-change snapshot <change-name>` to auto-generate the snapshot from `tasks.md` and `specs.md`. This enables automatic rollback if verify fails.
3. **Plan tasks** — If `tasks.md` empty or placeholder → invoke `/dev-planner` (change-scoped) to fill `tasks.md`; may add **one** `DEV-PLAN.md` Phase entry for this change only.
4. **Implement** — Recommend new session; invoke `/dev-builder` with **Change-Scoped Mode** and explicit `change-name=<change-name>`. Scope = `tasks.md` checkboxes only — not full DEV-PLAN backlog.
5. **Review** — After each Task: run change-assessment scope dimension; then `/code-review` as per dev-builder loop.
6. **Track progress** — Mark `tasks.md` checkboxes as work completes.

---

## Phase: verify

1. **Compare against spec** — Re-read `specs.md` acceptance criteria vs implementation.
2. **Run verification** — Run project verification commands; capture output in `verify.md`.
3. **Assess results** — List any failed criteria.
4. **Auto-restore on failure** — If any criterion fails AND a snapshot exists at `changes/<change-name>/_snapshot/`, run `pnpm forge-change restore <change-name>` BEFORE declaring failure. This reverts all changed files to their pre-apply state. Record the restoration in `verify.md`:
   ```
   ❌ Verification failed — auto-restored from _snapshot/
   Failed criteria: [list]
   ```
   After restore, the change is in its pre-apply state. Do not proceed to archive. The user may fix criteria and re-run apply, or abandon the change.

### Goal-Driven Verification Template

For each acceptance criterion in `specs.md`:

- "[Criterion]" → "[how to verify]" → "[pass/fail + command output]"

Example:

- "Dark mode toggle persists across page reload" → "toggle dark mode, reload, check body class" → "pass (body.dark present after reload)"
- "Search returns results within 500ms" → "bench-search.js 10 iterations" → "fail (avg 1200ms, p95 2400ms)"

Archive is blocked until all criteria pass or user explicitly waives (record in `verify.md`).

---

## Phase: archive

1. **Verify gate** — Require `verify.md` pass or explicit user waive (record in `verify.md`). See change-assessment archive readiness dimension.
2. **Update Spec** — Merge `specs.md` **Delta Spec** sections (ADDED/MODIFIED/REMOVED) into `Product-Spec.md`; confirm `Product-Spec-CHANGELOG.md` updated.
3. **Move to archive** — `mv changes/<change-name>/ changes/archive/<change-name>/`
4. **Report next steps** — Report next suggested change or return to normal dev-builder Phases.
