# agents/ — Forge Sub-Agent Definitions

## Purpose
Each `.md` file defines a Sub-Agent — a context-isolated worker that executes a single responsibility. Sub-agents are the Execution Layer of the Harness.

## Rules

### MUST
- File name MUST be kebab-case (e.g., `code-reviewer.md`, `feedback-observer.md`)
- Each agent MUST define: role, inputs, outputs, and handoff protocol
- Agent prompts MUST include context isolation instructions — no inherited state from previous tasks

### MUST NOT
- Do NOT make agents stateful across invocations — each dispatch is a fresh instance
- Do NOT allow agents to directly modify SKILL.md files — evolution proposals go through evolution-runner → user confirmation → skill-builder
- Do NOT create agents that depend on other agents' internal state — communication only through structured output files

### SHOULD
- Keep agent definitions under 200 lines — agents are specialists, not generalists
- Include explicit "stop conditions" — when should the agent hand back to the orchestrator
- Specify what context the agent needs (spec items, deliverables, files, project structure) and what it does NOT need
- Parallel review agents SHOULD return structured findings with severity/impact/confidence (**1–5 each**) and risk_rank
- Aggregation agents SHOULD filter by confidence_5 (>= 4 confirmed, == 3 suspected, <= 2 suppressed); legacy 0.0–1.0 maps via round(c×5)
- When used inside a Workflow `agent()` call, respect `budget.remaining()` — see [workflow-cookbook.md](../docs/workflow-cookbook.md)
