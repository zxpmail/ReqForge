<!-- forge: reqforge-greenkeeper v1.0 -->
---
name: reqforge-greenkeeper
description: Used when maintaining the ReqForge repository itself and its release gates fail — pnpm test, pnpm forge-smoke, pnpm sync:discover, adapter drift, skill fixtures, loadouts, or test-demo golden path. Restores a green, synced state with minimal changes. Not for bugs in user apps built with Forge.
version: 1.0.0
updated: 2026-07-16
requires: []
---

<!-- begin: task -->
[Task]
    Restore the ReqForge **framework repository** to a green maintenance state. Diagnose failing release gates, apply minimal invariant-preserving fixes, sync adapters when core assets change, and verify `pnpm sync:discover`, `pnpm validate-skill`, `pnpm test`, and `pnpm forge-smoke`.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Bugs in a **user product** built with ReqForge → `/bug-fixer`
    - Product features / Spec / Plan / Phase implementation → `/product-spec-builder`, `/dev-planner`, `/dev-builder`
    - Shipping a user product artifact → `/release-builder`
    - Creating a new Skill from scratch (no gate failure) → `/skill-builder`
    - Evolving methodology from feedback without a red gate → `/evolution-engine`

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Required:
    - Working directory = ReqForge repo root (`package.json` name `reqforge`, `core/skills/`, `adapters/`, `scripts/forge-smoke/` present)
    - Node.js + pnpm available

    Optional:
    - Git for `git status` / `git diff`
    - `pnpm install` if `node_modules/` missing

    If not the ReqForge framework repo → stop and route to `/bug-fixer` or `/request-dispatcher`.

<!-- end: dependency-check -->
<!-- begin: first-principles -->
[First Principles]
    → `references/first-principles.md`
    核心：Evidence First / Fix the invariant / Core→Sync / Surgical Changes。

<!-- end: first-principles -->
<!-- begin: output-style -->
[Output Style]
    Tone: SRE restoring a green build — evidence, root cause, minimal diff, verify counts.
    Report: failing gate → cause → files → `sync:discover` / test / forge-smoke results.

<!-- end: output-style -->
<!-- begin: file-structure -->
[File Structure]
    ```
    reqforge-greenkeeper/
    ├── SKILL.md
    ├── skill.json
    ├── commands/reqforge-greenkeeper.md
    └── references/
        ├── first-principles.md
        ├── anti-rationalization.md
        └── workflow.md
    ```

<!-- end: file-structure -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - Patches under `core/`, `scripts/`, or tests (adapters only via `pnpm sync`)
    - Verification summary: sync discover + validate-skill + test + forge-smoke

<!-- end: output-artifacts -->
<!-- begin: anti-rationalization-checklist -->
[Anti-Rationalization Checklist]
    → `references/anti-rationalization.md`

<!-- end: anti-rationalization-checklist -->
<!-- begin: workflow -->
[Workflow]
    → `references/workflow.md`

    1. **Baseline** — `sync:discover` + `test` + `forge-smoke`; name the failing gate
    2. **Classify** — adapter drift / fixtures / skill count / loadout / demo / verify docs
    3. **Minimal fix** — preserve gates; core then `pnpm sync`
    4. **Verify** — discover 0 drift, validate-skill clean, test + forge-smoke green
    5. **Report** — cause, files, pass counts

<!-- end: workflow -->
<!-- begin: gotchas -->
[Gotchas]
    **Fixture parser vs Skill content**: Quoted YAML values need unquoted search; reference expectations may need filenames, not only bodies.
    **Adapter drift**: Editing `core/skills/*` without `pnpm sync` leaves four adapters stale — smoke will fail or users see old copy.
    **Vitest ≠ forge-smoke execution**: `pnpm test` only checks smoke registry; `pnpm forge-smoke` runs the 15 scripts.
    **Demo contamination**: `test-demo/todo-cli` writes `todo.json` under cwd — parallel files need isolation or `fileParallelism: false`.
    **Count gates**: Bump `skills-complete` / `adapters-sync` expected count only when a real Skill directory is intentional and valid.
    **argument-hint**: Bare `argument-hint: [foo]` is a YAML array — Copilot CLI drops the skill. Always quote.

<!-- end: gotchas -->
<!-- begin: initialization -->
[Initialization]
    State the failing command and exact gate assertion. If no log is provided, run Baseline (`sync:discover` → `test` → `forge-smoke`) and start from the first failure.

<!-- end: initialization -->
