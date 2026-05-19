<!-- forge: AGENTS.md template v1.0 -->
# Project Rules

> This file defines how AI agents behave in this project. It is a constraint file, not a prompt collection.

## Tech Stack

Pin all versions to exact patch. AI must use these versions — no guessing, no `latest`, no ranges.

```
<!-- Fill in your project's actual versions -->
Runtime: <language> <exact-version>
Framework: <framework> <exact-version>
Package Manager: <manager> <exact-version>
Database: <database> <exact-version>
```

## Behavior Boundaries

### Green (execute without confirmation)
- Variable naming, code style, tests, obvious bug fixes
- Documentation updates, dev dependency changes

### Yellow (confirm before proceeding)
- External dependencies, database schema changes
- Core business logic, new routes, API changes

### Red (always require explicit approval)
- Deleting data, force push, production configuration
- Authentication/authorization changes

## Project Structure

```
<!-- Fill in your project structure -->
```

Rule: AI-generated code must follow the above structure. Do not place files outside these directories without asking.

## Hard Constraints

- Never delete code without asking
- Never restore deleted content without asking
- Never run force push
- Never hardcode secrets, API keys, or tokens in code
- Always use the specified package manager
- Always confirm the current branch before committing

## Context Preservation

Three memory files are maintained in `memory/`:
- `project-memory.md` — Architecture, constraints, known pitfalls
- `decisions-log.md` — ADR-format architectural decisions
- `task-history.md` — Recent task summaries (last 30)

Read all three at session start. Update after each task.

## Cross-Platform Hooks

This project may include platform-specific hook scripts:
- `.sh` — Linux/Mac
- `.bat` — Windows cmd
- `.ps1` — Windows PowerShell

Hooks fire automatically at key events (commit, edit, startup).
