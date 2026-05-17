# Development Plan — Todo CLI

> This file records the development phase division, current progress, and remaining work.
> When a new session starts, read this file first to understand the project state before continuing.

---

## Tech Stack

| Component | Choice | Version | Rationale |
|-----------|--------|---------|-----------|
| Language | Node.js | 22.x LTS | Long-term support, stable for CLI development |
| Language extension | TypeScript | 5.9.x | Type safety reduces runtime bugs |
| CLI framework | Commander.js | 12.x | De facto standard for Node.js CLI tools, well-maintained |
| Package manager | pnpm | 10.x | Fast, disk space efficient |
| Data storage | JSON file | - | Native to Node.js, human-editable, no dependencies |

## Data Structure

**Storage file**: `./todo.json` in current working directory

Schema:
```json
{
  "todos": [
    {
      "id": "number (auto-increment)",
      "description": "string",
      "category": "string (feature/bug/refactor/chore/docs/test)",
      "completed": "boolean",
      "createdAt": "string (ISO date)"
    }
  ]
}
```

---

## Phase 1: Project Initialization

**Delivery Checklist**:
- Initialize npm project with TypeScript configuration
- Install Commander.js dependency
- Create project directory structure
- Create entry point `bin/todo` and `src/index.ts`
- Add `.gitignore` for node_modules

**Key Files**:
- `package.json` — project metadata and dependencies
- `tsconfig.json` — TypeScript configuration
- `src/index.ts` — main entry point (cli bootstrap)
- `src/types.ts` — TypeScript type definitions
- `src/storage.ts` — JSON file read/write operations
- `bin/todo` — executable shell script

**Acceptance Criteria**:
- `pnpm install` completes without errors
- `npx tsc --noEmit` compiles with zero errors
- `./bin/todo --help` outputs help information

---

## Phase 2: Core Storage Layer

**Delivery Checklist**:
- Define Todo data type interfaces
- Implement JSON file loading (create if doesn't exist)
- Implement JSON file saving
- Helper functions: get next ID, find todo by ID
- Basic error handling: file read/write errors

**Key Files**:
- `src/types.ts` — Todo and storage types
- `src/storage.ts` — storage operations

**Acceptance Criteria**:
- Compiles with zero errors
- Creates `todo.json` when it doesn't exist
- Reads existing `todo.json` correctly
- Saves changes back to disk correctly

---

## Phase 3: Basic Commands Implementation

**Delivery Checklist**:
- Implement `add` command: add new todo with AI categorization
- Implement `list` command: list all todos grouped by category
- Implement `complete` command: mark todo as completed
- Implement `delete` command: delete todo by ID

**Key Files**:
- `src/commands/add.ts` — add command implementation
- `src/commands/list.ts` — list command implementation
- `src/commands/complete.ts` — complete command implementation
- `src/commands/delete.ts` — delete command implementation
- `src/ai-categorize.ts` — AI categorization function

**Acceptance Criteria**:
- All four commands work end-to-end
- `add` correctly saves new todo with AI category
- `list` displays todos grouped by category
- `complete` toggles completion status
- `delete` removes the todo
- All file operations persist correctly

---

## Phase 4: Build & Package

**Delivery Checklist**:
- Configure build script in `package.json`
- Compile TypeScript to JavaScript
- Configure for global npm install
- Add README with usage instructions

**Key Files**:
- `README.md` — usage instructions
- `dist/` — compiled JavaScript output (generated at build time)

**Acceptance Criteria**:
- `pnpm build` compiles successfully
- Can be installed globally with `npm install -g`
- `todo --help` works after global install
- All commands work correctly after global install

---

## Development Rules

- Each Phase must pass the four-step verification (Code Review → Test Completeness → Compile Verify → Functional Test) before Phase can be confirmed complete
- Atomic commits: one commit per completed task
- Single file should not exceed 300 lines, split if needed
- Follow existing TypeScript and Node.js conventions
- No sensitive information hardcoded
- Keep dependencies minimal

---

**Total Phases**: 4
**Completed Phases**: 0
**Remaining Phases**: 4
