# Product Spec: Todo CLI

## Product Overview

A simple command-line todo list tool for developers, stores todos in a local JSON file in the current working directory. Supports adding, listing, marking as complete, and deleting todos, with AI automatic categorization.

**Target Users**: Developers who want a lightweight, per-directory todo list to track tasks while working on projects. They don't need complex cloud sync or team collaboration — just a simple tool that stays out of the way.

**Core Value**: Quick task tracking without leaving the terminal, per-directory isolation, optional AI categorization to help organize work items.

## Use Cases

- **Project Work Tracking**: Developer working on a feature adds todos for remaining subtasks, checks them off as they complete, keeps focused on incremental progress.
- **Learning Notes**: Student learning a new technology creates todos for concepts to understand, marks them complete as they go.
- **Bug Fixing**: Developer debugging an issue adds todos for investigation steps to avoid forgetting what's been checked.
- **Quick Capture**: Idea for a future improvement comes up while working on something else — quickly add it as a todo in the current project directory.

## Functional Requirements

**Core Features**
- `todo add <description>`: User inputs description on command line -> system adds a new todo with unique ID, creation timestamp, incomplete status, AI categorizes it -> outputs confirmation.
- `todo list`: User runs command -> system displays all todos grouped by category, shows ID, description, status (completed/incomplete) -> sorted by creation time newest first.
- `todo complete <id>`: User specifies todo ID -> system marks that todo as completed -> outputs confirmation.
- `todo delete <id>`: User specifies todo ID -> system removes that todo from storage -> outputs confirmation.

**AI Features**
- Automatic categorization: When user adds a todo, AI analyzes the description and assigns it to a category (e.g., `feature`, `bug`, `documentation`, `refactor`, `chore`).
- User can override the category manually if AI guesses wrong.

## UI Layout

This is a CLI tool, so UI is command-line output only:

### Overall Layout
- Single command per invocation (no interactive mode by default)
- Output is plain text, human-readable
- List output is formatted as a table or grouped list for easy scanning

### Command Output Format
- Success messages: Brief confirmation with the action taken
- Error messages: Clear description of what went wrong (file not found, invalid ID, etc.)
- List output: Grouped by category, each line shows: `[ID] [Status] Description`

## User Flow

### Add Todo
1. User runs `todo add "Implement authentication"`
2. System reads or creates `./todo.json`
3. AI categorizes the description into a category
4. System adds the new todo with unique ID
5. Outputs: `Added todo #1 (category: feature): Implement authentication`

### List Todos
1. User runs `todo list`
2. System reads `./todo.json`
3. Groups todos by category
4. Outputs the list with IDs and status

### Complete Todo
1. User runs `todo complete 1`
2. System finds todo by ID
3. Marks it as completed
4. Saves back to `todo.json`
5. Outputs: `Marked todo #1 as completed`

### Delete Todo
1. User runs `todo delete 1`
2. System finds todo by ID
3. Removes it from the list
4. Saves back to `todo.json`
5. Outputs: `Deleted todo #1`

## AI Capability Requirements

| Capability Type | Usage Description | Application Location |
|---------|---------|---------|
| Text Classification | Analyze todo description and assign to appropriate category (feature/bug/refactor/chore/docs) | When adding a new todo |

## Technical Direction

| Dimension | Choice | Rationale |
|------|------|------|
| Product Type | CLI | Developer tool, fits naturally into terminal workflow |
| Recommended Tech Stack | Node.js + TypeScript + Commander.js | Commander.js is de facto standard for Node.js CLI tools, TypeScript for type safety |
| Data Storage | Local JSON file in current working directory (`./todo.json`) | Per-directory todos, no cloud dependency, fully offline |
| Deployment | npm package | Easy install via `npm install -g`, standard distribution for Node CLI tools |

## Technical Notes

- **Offline-first**: All operations work offline, AI categorization is optional (calls user-configured OpenAI API or similar)
- **File format**: JSON is human-editable if needed
- **No dependencies except Commander.js**: Keep it lightweight

## Additional Notes

| Category | Possible Values | Description |
|------|--------|------|
| Default Categories | `feature`, `bug`, `refactor`, `chore`, `docs`, `test` | Standard Git commit categories work well for todos |

