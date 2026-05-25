# Forge Session Iron Laws (Bootstrap)

**MANDATORY — not suggestions.** Injected on every session start via `check-evolution` hook.
Hook block messages are **hard stops** — do not negotiate around them.

## Iron Laws

1. **Skill before action** — Match the task to a Skill; open its `SKILL.md` Workflow before `Write`/`Edit`/Bash on project application code.
2. **Truth sources** — If `Product-Spec.md` / `DEV-PLAN.md` exist, read the relevant sections before implementation work.
3. **HARD-GATE — no spec, no code** — Until `Product-Spec.md` is saved **and** `.forge/spec-confirmed.json` exists (user confirmed), do **not** invoke `/dev-builder` or `/dev-planner`; do **not** create or edit application source under `src/`, `app/`, `lib/`, `packages/`.
4. **HARD-GATE — no plan, no build** — Until `DEV-PLAN.md` exists **and** `.forge/plan-confirmed.json` exists, do **not** invoke `/dev-builder`.
5. **Implementer gate** — Application code writes require `.forge/implementer-session.json` (only **implementer** sub-agent creates it per Task). Main session coordinates only.
6. **Bugs** — Use `/bug-fixer`; no fix without stable reproduction and a failing test (TDD).
7. **Hooks are law** — PreToolUse chain: Spec → Spec confirm → Plan → Plan confirm → implementer session; plus `phase-exit-guard`, `stop-gate`, `retry-gate`, `pre-commit-check`. Blocking output = stop and comply.
8. **Phase boundary** — One Phase per `/dev-builder` invocation; do not start the next Phase until the user invokes `/dev-builder` again.
9. **Think before you conclude (CoT)** — For tasks that need judgment (architecture, root cause, i18n/billing edge cases, scope trade-offs): write brief reasoning bullets first, then a **bold conclusion**; do not jump to code or final Spec text from a guess. Simple lookups and already-confirmed facts do not need long CoT. If analysis is not finished, do not start implementation in the same turn. Templates: `product-spec-builder/references/conversation-strategy.md` [Chain of Thought]; `bug-fixer` [CoT Diagnostic Checklist]; implementer step 0b.

## Task execution discipline（任务级 · 摘要）

Hooks cannot replace these — they apply to **how** you execute the current task (in addition to Iron Laws 1–9):

- **Plan then act** — Non-trivial work: list steps; wait for user approval before edits (trivial one-line fixes excepted).
- **Read before Write/Edit** — Target files and direct dependencies first.
- **Minimal diff, reuse abstractions** — No drive-by fixes; no re-implementing through full call stacks.
- **Ask if no precedent** — Do not invent requirements; scope change → new plan.
- **Report off-scope issues** — Mention only; do not fix without approval.
- **Before commit** — Show diff summary; user approves; run minimal lint/type/test for touched packages.

Full text: [session-execution-discipline.md](../docs/session-execution-discipline.md). User projects: copy from [agents-template.md](./agents-template.md) into `AGENTS.md` / project rules.

## Rationalization references

- Spec / planning gates: `product-spec-builder/references/hard-gate-rationalization.md`
- Build / verify / review: `dev-builder/references/anti-rationalization.md`
- "Just give me the answer" on complex tasks: shallow guesses cost rework — use CoT bullets + one conclusion (Iron Law 9)
