---
description: Rules for editing Forge sub-agent definitions
globs:
  - "core/agents/**"
  - ".claude/agents/**"
---

# Agents Directory Rules

- File name MUST be kebab-case (e.g., `code-reviewer.md`, `feedback-observer.md`)
- Each agent MUST define: role, inputs, outputs, and handoff protocol
- Agent prompts MUST include context isolation instructions — no inherited state from previous tasks
- Do NOT make agents stateful across invocations — each dispatch is a fresh instance
- Do NOT allow agents to directly modify SKILL.md files — evolution proposals go through evolution-runner → user confirmation → skill-builder
- Do NOT create agents that depend on other agents' internal state — communication only through structured output files
- Keep agent definitions under 200 lines — agents are specialists, not generalists
- Include explicit "stop conditions" — when should the agent hand back to the orchestrator
- Specify what context the agent needs (spec items, deliverables, files, project structure) and what it does NOT need
