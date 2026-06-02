# Output Status Protocol

<!-- forge: v1.0 | purpose: standard completion footer for all Forge Skills — guarantees consistent output clarity across product-spec, plan, debug, change, and build phases -->

Every Phase, stage, or significant conversation turn must end with a structured footer:

---

```text
[Decision]
    <concrete decision made — what was chosen, agreed, or committed>
    • Example: "Phase 2: user-auth API contract accepted (JWT + refresh token, 7-day expiry)"
    • Example: "Feature not feasible within current schema constraint — deferred to v2"

[Assumption]
    <what is taken to be true without proof right now — label explicitly>
    • Example: "Assumes PostgreSQL 15+ with native UUID type available"
    • Example: "Assumes third-party migration API rate limit is 1000 req/min (undocumented — needs verification)"

[Next]
    <single recommended next action — who does what>
    • Example: "Run `pnpm test:api` to confirm auth flow, then proceed to Phase 3"
    • Example: "Confirm with stakeholder whether legacy user rows can be null-d at migration time"

[Status]
    <one-of>
    DONE                  — delivered. Artifact produced or task finished.
    DONE_WITH_CONCERNS    — delivered but known risk remains. Named in [Assumption] or explicit note.
    BLOCKED               — cannot proceed. Cause stated in [Assumption] or explicit note.
    NEEDS_CONTEXT         — not enough information to complete. Required input named in [Next].
```

---

## When to Apply

| Skill / Phase | Mandatory? |
|---------------|-----------|
| product-spec-builder — each interview turn | ✅ recommended (user-facing clarity) |
| product-spec-builder — Spec output | ✅ required |
| dev-planner — DEV-PLAN output | ✅ required |
| bug-fixer — each debug stage | ✅ recommended |
| bug-fixer — fix report | ✅ required |
| change-manager — each phase (propose/apply/verify/archive) | ✅ required |
| dev-builder — each Phase Completion | ✅ required (see phase-completion-assessment.md) |
| code-review — findings output | recommended |

## Why

A structured footer forces the Skill to declare what it decided, what it assumed, what comes next, and whether it actually finished. This makes every output inspectable and actionable — no more reading paragraphs to figure out whether the agent is done or stuck.

Inspired by Digidai/product-manager-skills output contract pattern.
