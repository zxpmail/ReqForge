# Product Spec: Todo CLI

## Product Overview

A simple command-line todo list tool for developers. Stores todos in a local JSON file in the current working directory, keeping each project's tasks isolated. Supports adding, listing, completing, and deleting todos, with AI-powered automatic categorization.

**Target Users**: Developers who need lightweight, per-project task tracking without leaving the terminal. They don't need cloud sync, team collaboration, or a web dashboard — just a tool that stays out of their way and keeps their tasks organized.

**Core Value**: Zero-friction task tracking in the terminal, per-directory isolation for project context, and automatic categorization so users don't waste time tagging.

## Use Cases

- **Feature Development**: Developer working on a feature adds subtasks as they go ("refactor auth module", "add input validation"), checks them off as completed, keeps focused on incremental progress.
- **Bug Investigation**: Developer debugging a production issue adds investigation steps as todos ("check error logs", "reproduce in staging", "review recent deployments"), ensuring nothing is missed.
- **Learning & Exploration**: Developer exploring a new library adds concepts to learn, marks them off to track learning progress.
- **Quick Capture**: Developer gets an idea mid-task ("need to fix that memory leak too"), quickly adds it as a todo in the current project directory without switching context.

## Functional Requirements

**Core Features**
- `todo add <description>`: User provides a task description on the command line -> system creates a new todo with a unique auto-increment ID, sets status to incomplete, records creation timestamp -> AI automatically assigns a category (feature/bug/refactor/chore/docs/test) -> outputs confirmation with the assigned category.
- `todo list`: User runs the command -> system displays all todos grouped by category, each showing ID, description, and completion status. Incomplete items marked with ○, completed with ✓. Sorted newest first within each category.
- `todo complete <id>`: User specifies a todo ID -> system marks that todo as completed with a timestamp -> outputs confirmation.
- `todo delete <id>`: User specifies a todo ID -> system removes that todo from storage -> outputs confirmation.

**Supplementary Features**
- Category override: If AI assigns the wrong category, user can re-add with the correct one. No separate "re-categorize" command at MVP.
- Color output: Category group headers are colored for quick visual scanning.

## UI Layout

CLI application — no graphical UI. All interaction is through terminal commands and text output.

**Output format** for `todo list`:
```
FEATURE
  ○ #3 Add input validation
  ✓ #1 Refactor auth module

BUG
  ○ #2 Fix login timeout
```

- Color scheme: category headers in bold white, completed items in green, incomplete in red/amber.
- Error messages: red text, clear what went wrong and what the user should do.
- Confirmation messages: green on success, yellow on warning.

## User Flow

### Adding a Todo
1. User types `todo add "describe task"`
2. System generates ID, saves with "incomplete" status
3. System calls AI to categorize the description
4. System stores the assigned category
5. System outputs: `Added todo #3 (category: feature): describe task`

### Listing Todos
1. User types `todo list`
2. System reads todo.json from current directory
3. System groups todos by category
4. System outputs grouped list with colored formatting

### Completing a Todo
1. User types `todo complete 3`
2. System marks todo #3 as completed, records completion time
3. System outputs: `Marked todo #3 as completed`

### Deleting a Todo
1. User types `todo delete 3`
2. System removes todo #3 from storage
3. System outputs: `Deleted todo #3`

## AI Capability Requirements

| Capability Type | Usage Description | Application Location |
|---------|---------|---------|
| Text Classification | Analyze todo description and assign to one of: feature, bug, refactor, chore, docs, test | When running `todo add` |

## Technical Direction

| Dimension | Choice | Rationale |
|------|------|------|
| Product Type | CLI | Developer tool, terminal-native, no UI framework needed |
| Recommended Tech Stack | Node.js 22.x + TypeScript 5.x + Commander.js 12.x | TypeScript for type safety, Commander.js is the de facto CLI framework for Node.js |
| Data Storage | Local JSON file (todo.json in CWD) | Zero setup, per-directory isolation, human-readable |
| Package Management | pnpm | Fast, disk efficient |

## Technical Notes

- **AI Categorization**: Calls LLM API (configurable via `AI_API_KEY` env var or `--ai-key` flag, endpoint defaults to OpenAI-compatible API). Must handle API failures gracefully — if AI is unreachable or key not configured, default to "feature" category and notify user.
- **Storage**: Reads/writes `./todo.json` in the user's current working directory. Create file if not exists.
