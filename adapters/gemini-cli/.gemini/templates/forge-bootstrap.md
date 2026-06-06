# Forge Session Iron Laws (Bootstrap)

**MANDATORY — not suggestions.** Injected on every session start via `check-evolution` hook.
Hook block messages are **hard stops** — do not negotiate around them.

**Project state routing** → `.forge/quickref.md` §项目状态路由（install 后）或 `core/templates/forge-quickref.md`。

## Iron Laws

1. **Skill before action** — Match task → Skill; open its `SKILL.md` Workflow before app code `Write`/`Edit`/Bash.
2. **Truth sources** — Read relevant `Product-Spec.md` / `DEV-PLAN.md` sections before implementation.
3. **HARD-GATE — no spec, no code** — Until Spec saved + `.forge/spec-confirmed.json`: no `/dev-planner`/`/dev-builder`; no app source edits.
4. **HARD-GATE — no plan, no build** — Until Plan saved + `.forge/plan-confirmed.json`: no `/dev-builder`.
5. **Implementer gate** — App writes need `.forge/implementer-session.json` (implementer sub-agent only).
6. **Bugs** — `/bug-fixer`; no fix without reproduction + failing test.
7. **Hooks are law** — PreToolUse chain + phase-exit/stop/retry/pre-commit. Blocking output = stop.
8. **Phase boundary** — One Phase per `/dev-builder`; user re-invokes for next Phase.
9. **CoT when judging** — Architecture/root cause/scope trade-offs: brief bullets → **bold conclusion** before code. Simple lookups skip long CoT.

## Task execution discipline

Hooks cannot replace task-level discipline. **Full text** → [session-execution-discipline.md](../docs/session-execution-discipline.md). **Human one-pager** → `.forge/quickref.md`. **User project** → [agents-template.md](./agents-template.md).

Summary: plan→approve→act; read before edit; minimal diff; ask if uncertain; diff before commit; **verify loop until green**.

## Skill Context Protocol

Skill invocation loads the full SKILL.md. To reduce context waste and improve precision, run the retrieval plan after the Skill tool returns:

```
node scripts/forge-skill-retrieve.mjs plan <skill-name> --context '<json>'
```

Context JSON assembles from available info:
```json
{"phase": 3, "mode": "0-to-1", "step": "planning", "failure_class": "skill-defect"}
```

Omit fields that are unknown — the script uses defaults.

The plan has three categories:

| Category | Meaning |
|----------|---------|
| `mustRead` | Primary instructions. Focus on these sections now. |
| `onDemand` | Available but not needed yet. Read when the workflow step directs you to. |
| `skip` | Not relevant to current context. Do not read. |

If the script fails (non-zero exit), read the full SKILL.md instead.

## Rationalization references

- Spec/plan gates: `product-spec-builder/references/hard-gate-rationalization.md`
- Build/verify: `dev-builder/references/anti-rationalization.md`
