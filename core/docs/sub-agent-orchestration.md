# Sub-Agent Orchestration Rules

## Dispatchable Sub-Agents

| Agent | File | Skill Used | Responsibility |
|-------|------|------------|---------------|
| code-reviewer | .claude/agents/code-reviewer.md | code-review | Review code + output report |
| implementer | .claude/agents/implementer.md | dev-builder | Code + compile verify + self-check |
| feedback-observer | .claude/agents/feedback-observer.md | feedback-writer | Record user feedback |
| evolution-runner | .claude/agents/evolution-runner.md | evolution-engine | Scan feedback + generate evolution proposals |

Evolution proposals from evolution-runner must be presented to the user for individual confirmation/skip.

## Sub-Agent Isolation Principle
- Each Task gets a fresh instance. Never reuse a previous Sub-Agent.
- Controller provides complete task context (Spec items, deliverables, files, project structure). Sub-Agent does NOT inherit session history.
- A Sub-Agent has no knowledge of previous Tasks. If context is needed, the Controller must explicitly provide it.
- This prevents Task A's false assumptions from contaminating Task B.

## Feedback vs Memory
- feedback is written to .claude/feedback/, scanned by evolution-engine to generate evolution proposals, used to improve Skills and rules
- memory is written to the user's memory/ directory, used to remember user preferences and project context across sessions
- When the user corrects AI behavior, must use the feedback flow (dispatch feedback-observer). Writing to memory alone is insufficient.