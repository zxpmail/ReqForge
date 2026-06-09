<!-- forge: reqforge-greenkeeper v1.0 -->
---
name: reqforge-greenkeeper
description: Used when maintaining the ReqForge repository itself and its release gates fail: pnpm test, pnpm forge-smoke, pnpm sync:discover, adapter drift, skill fixture failures, loadout validation, or test-demo golden path failures. Restores the repo to a green, synced state with minimal changes.
version: 1.0.0
updated: 2026-06-09
requires: []
---

[Task]
    Restore the ReqForge repository to a green maintenance state. Diagnose failing release gates, apply minimal fixes, sync adapters when core assets change, and verify `pnpm test`, `pnpm forge-smoke`, and `pnpm sync:discover`.

[Not For]
    - Bugs in a user app built with ReqForge -> use `/bug-fixer`.
    - Planning or implementing product features -> use `/product-spec-builder`, `/dev-planner`, or `/dev-builder`.
    - Publishing a product artifact -> use `/release-builder`.
    - Redesigning ReqForge methodology without a failing gate -> use the relevant skill plus user confirmation.

[Dependency Check]
    Required:
    - Run from the ReqForge repository root.
    - Node.js and pnpm available.
    - `package.json`, `core/skills/`, `adapters/`, and `scripts/forge-smoke/` exist.

    Optional:
    - Git available for `git status`, `git diff`, and adapter drift review.
    - Fresh dependency install with `pnpm install` if `node_modules/` is missing.

[First Principles]
    Treat gate failures as evidence, not as paperwork. Fix the broken invariant, not just the symptom string.
    Keep changes narrow: test parser fixes belong in test scripts, missing policy anchors belong in Skill files, adapter drift belongs to `pnpm sync`.
    Do not edit generated adapter copies by hand when the corresponding core file exists.

[File Structure]
    ```text
    reqforge-greenkeeper/
    ├── SKILL.md
    └── commands/reqforge-greenkeeper.md
    ```

[Workflow]
    1. Baseline:
       - `git status --short`
       - `pnpm install` if dependencies are missing
       - `pnpm sync:discover`
       - `pnpm test`
       - `pnpm forge-smoke`

    2. Classify the failure:
       - Adapter drift -> change core source, then run `pnpm sync`.
       - `skill-fixtures` failure -> inspect fixture expectations, the target `SKILL.md`, and references. If the fixture parser is wrong, fix the parser. If a real anchor is missing, add the smallest anchor to the source Skill.
       - `skills-complete` failure after adding/removing a Skill -> update the expected count and ensure every Skill has `SKILL.md`, `skill.json`, and command metadata when `triggers.command` is set.
       - `test-demo-golden-path` or `todo-cli` storage failure -> check shared filesystem state, `process.cwd()`, Vitest file parallelism, and test cleanup.
       - Loadout failure -> update `core/loadouts/*.json` only when the referenced skill/agent/hook should actually be installable.

    3. Apply the minimal fix:
       - Prefer fixing deterministic scripts over weakening assertions.
       - Preserve hard gates; do not delete fixture expectations to make smoke pass.
       - After core skill/template/hook changes, run `pnpm sync` to propagate adapters.

    4. Verify:
       - `pnpm sync:discover` must report `0 drifted · 0 orphan · 0 missing`.
       - `pnpm test` must pass.
       - `pnpm forge-smoke` must pass.
       - Check `git diff --stat` and ensure no unrelated churn remains.

[Initialization]
    Start by stating the failing command and exact failing gate. If no failure log is provided, run the baseline commands above.

[Output Style]
    Report:
    - Root cause by gate.
    - Files changed.
    - Final verification commands and pass counts.
    - Any residual warnings that are expected test output.

[Gotchas]
    **Fixture parser vs. Skill content**: If YAML-like fixtures contain quoted strings, make sure the parser searches for the unquoted value.
    **Reference filename expectations**: If a fixture expects a reference filename, the collector must include filenames, not only file bodies.
    **Adapter drift**: Editing `core/skills/*` without `pnpm sync` leaves Claude Code, Cursor, OpenCode, and Gemini CLI copies stale.
    **Demo test contamination**: `test-demo/todo-cli` stores `todo.json` under `process.cwd()`. Parallel test files can collide unless each file gets an isolated cwd or file parallelism is disabled.
    **Count gates**: `skills-complete` intentionally catches unregistered Skill additions. Update the count only when the new Skill is intentional and valid.

[Output Artifacts]
    - Code/docs patch in the ReqForge repository.
    - Verification summary with `pnpm sync:discover`, `pnpm test`, and `pnpm forge-smoke`.
