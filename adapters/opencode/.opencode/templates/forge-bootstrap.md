# Forge Session Iron Laws (Bootstrap)

**MANDATORY — not suggestions.** Injected on every session start via `check-evolution` hook.
Hook block messages are **hard stops** — do not negotiate around them.

## Iron Laws

1. **Skill before action** — Match the task to a Skill; open its `SKILL.md` Workflow before `Write`/`Edit`/Bash on project application code.
2. **Truth sources** — If `Product-Spec.md` / `DEV-PLAN.md` exist, read the relevant sections before implementation work.
3. **HARD-GATE — no spec, no code** — Until `Product-Spec.md` is saved **and** the user explicitly confirms it, do **not** invoke `/dev-builder` or `/dev-planner`; do **not** create or edit application source under `src/`, `app/`, `lib/`, `packages/`.
4. **HARD-GATE — no plan, no build** — Until `DEV-PLAN.md` exists and the current Phase is identified, do **not** invoke `/dev-builder`.
5. **Bugs** — Use `/bug-fixer`; no fix without stable reproduction and a failing test (TDD).
6. **Hooks are law** — `phase-exit-guard`, `stop-gate`, `retry-gate`, `hallucination-gate` (includes **Spec-Before-Code** when no `Product-Spec.md`), `pre-commit-check`: blocking output means stop and comply.
7. **Phase boundary** — One Phase per `/dev-builder` invocation; do not start the next Phase until the user invokes `/dev-builder` again.

## Rationalization references

- Spec / planning gates: `product-spec-builder/references/hard-gate-rationalization.md`
- Build / verify / review: `dev-builder/references/anti-rationalization.md`
