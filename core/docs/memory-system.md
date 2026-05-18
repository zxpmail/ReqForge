# Three-Tier Memory System

Project memory is version-controlled markdown in the `memory/` directory, shared across sessions and team members.

## Loading (mandatory at session start)
- `memory/project-memory.md` — Architecture facts, constraints, known pitfalls (permanent)
- `memory/decisions-log.md` — ADR-format decision records (permanent)
- `memory/task-history.md` — Recent task summaries, max 30 entries (rolling)

## Writing (after every completed Task)
- `task-history.md` — ALWAYS append after Task completion (date, phase, type, description, changed files, notes)
- `decisions-log.md` — Append when a significant technical decision was made during the Task
- `project-memory.md` — Update when architecture facts, constraints, or pitfalls change

## Initialization
When `memory/` directory does not exist, create it from templates during first `/dev-builder` invocation. Fill `project-memory.md` from Product-Spec.md and DEV-PLAN.md tech stack info. Record initial setup as ADR-000 in `decisions-log.md`.

## Memory vs Feedback
- Memory (`memory/`) = "what we know and decided" — context preservation across sessions
- Feedback (`.claude/feedback/`) = "what went wrong and how to improve" — evolution fuel for Skills