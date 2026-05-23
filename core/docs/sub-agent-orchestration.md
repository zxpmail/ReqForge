# Sub-Agent Orchestration Rules

## Dispatchable Sub-Agents

| Agent | File | Skill Used | Responsibility |
|-------|------|------------|---------------|
| code-reviewer | .claude/agents/code-reviewer.md | code-review | Aggregate parallel review findings |
| code-reviewer-design | .claude/agents/code-reviewer-design.md | code-review | Spec compliance, architecture, drift |
| code-reviewer-bug | .claude/agents/code-reviewer-bug.md | code-review | Bug patterns, null pointers, race conditions |
| code-reviewer-security | .claude/agents/code-reviewer-security.md | code-review | OWASP Top 10, credential leaks, XSS |
| code-reviewer-types | .claude/agents/code-reviewer-types.md | code-review | Type safety, edge cases |
| implementer | .claude/agents/implementer.md | dev-builder | Code + compile verify + self-check |
| feedback-observer | .claude/agents/feedback-observer.md | feedback-writer | Record user feedback |
| evolution-runner | .claude/agents/evolution-runner.md | evolution-engine | Scan feedback + generate evolution proposals |
| planner | .claude/agents/planner.md | dev-planner | Architecture design + Phase splitting |
| test-writer | .claude/agents/test-writer.md | dev-builder | Generate Vitest tests for scripts/utilities |

Evolution proposals from evolution-runner must be presented to the user for individual confirmation/skip.

## Parallel Code Review Pattern

**Default**: If `change_complexity` is omitted, treat as **simple** — `code-reviewer` runs a quick aggregator pass only (no parallel specialists).

For moderate/complex changes, `code-reviewer` dispatches 4 specialized agents concurrently:

1. **code-reviewer-design** — Checks spec compliance, architecture consistency, pattern drift. Outputs `spec_gap`, `pattern_drift`, `architecture_violation`, `naming`, `duplication`, `complexity` findings.
2. **code-reviewer-bug** — Detects bug patterns: null pointer dereferences, race conditions, resource leaks, incorrect async handling. Each finding includes severity (critical/major/minor).
3. **code-reviewer-security** — Scans for OWASP Top 10: credential leaks, injection, XSS, path traversal, eval(), insecure deserialization.
4. **code-reviewer-types** — Checks type safety: `any` usage, `@ts-ignore`, type assertions, null safety, missing union variants, unhandled cases.

Each agent returns structured findings with confidence score (0.0-1.0). The aggregator (`code-reviewer`) applies:
- **Confidence >= 0.6** → confirmed finding
- **Confidence 0.3-0.6** → suspected finding (downgraded)
- **Confidence < 0.3** → suppressed (noise)
- Cross-agent boost: same file+line flagged by ≥2 agents at ≥0.6 → boost +0.1 (max 1.0)

## Sub-Agent Isolation Principle
- Each Task gets a fresh instance. Never reuse a previous Sub-Agent.
- Controller provides complete task context (Spec items, deliverables, files, project structure). Sub-Agent does NOT inherit session history.
- A Sub-Agent has no knowledge of previous Tasks. If context is needed, the Controller must explicitly provide it.
- This prevents Task A's false assumptions from contaminating Task B.

## Feedback vs Memory
- feedback is written to .claude/feedback/, scanned by evolution-engine to generate evolution proposals, used to improve Skills and rules
- memory is written to the user's memory/ directory, used to remember user preferences and project context across sessions
- When the user corrects AI behavior, must use the feedback flow (dispatch feedback-observer). Writing to memory alone is insufficient.