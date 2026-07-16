# Anti-Rationalization — reqforge-greenkeeper

| Rationalization | Reality |
|---|---|
| "Delete the fixture expectation — smoke will pass" | Fixtures encode policy. Fix Skill/parser, not the test. |
| "Bump the skill count without adding a Skill" | `skills-complete` / `adapters-sync` catch silent drift. Count follows real directories. |
| "Edit adapters only — sync is slow" | Hand-edited adapters re-drift on next sync. Always fix `core/` then sync. |
| "Skip `pnpm forge-smoke` — unit tests passed" | Vitest only checks smoke **registry**; execution is `run-all.mjs`. Both required. |
| "Weaken HARD-GATE / machine-gates wording to pass CI" | Honesty gates exist so prose matches enforcement. Align prose to reality or add enforcement. |
