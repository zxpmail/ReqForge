# Development Plan — Todo CLI

> This file records the development phase division, current progress, and remaining work.
> When a new session starts, read this file first to understand the project state before continuing.

---

## MVP Scope

**In scope (this plan / MVP)**:
- CLI: add, list, complete, delete todos in `./todo.json`
- AI auto-categorization on add (feature/bug/refactor/chore/docs/test)
- Colored list grouped by category

**Out of scope (deliberate — not in this MVP)**:
- Cloud sync, multi-user, web UI, due dates, recurring tasks, plugins

**Scope amendment criteria** (what user evidence justifies adding scope):
- ≥3 independent user reports the same missing capability in feedback, or golden-path regression requires it

---

## Phase 1: Project Skeleton + Types + Storage

**Deliverables**:
- Initialize Node.js + TypeScript project with pnpm, configure tsconfig.json
- Define Todo data type (id, description, category, completed, timestamps)
- Implement JSON file storage layer (read/write `./todo.json`, auto-create if missing)
- Set up bin entry point for `todo` command

**Key Files**:
- `package.json` — Project config, dependencies, bin entry
- `tsconfig.json` — TypeScript compilation config
- `src/types.ts` — Todo interface and type definitions
- `src/storage.ts` — JSON file read/write with locking
- `src/index.ts` — CLI entry point, Commander setup

**Acceptance Criteria**:
- TypeScript compiles with no errors (`tsc --noEmit` passes)
- `node dist/index.js` runs without crashing
- Storage creates `todo.json` automatically on first write

---

## Phase 2: Core Commands + AI Categorization

**Deliverables**:
- `todo add <description>`: Create todo, call AI for category, save, output confirmation
- `todo list`: Display all todos grouped by category, colored output
- `todo complete <id>`: Mark todo as completed with timestamp
- `todo delete <id>`: Remove todo from storage
- AI categorization module: call LLM API to classify descriptions into feature/bug/refactor/chore/docs/test
- Graceful degradation: if AI API is unreachable, default to "feature" category

**Key Files**:
- `src/commands/add.ts` — Add command handler
- `src/commands/list.ts` — List command handler with grouping + colors
- `src/commands/complete.ts` — Complete command handler
- `src/commands/delete.ts` — Delete command handler
- `src/ai-categorize.ts` — AI categorization module (LLM API call)

**Acceptance Criteria**:
- All four commands work correctly end-to-end
- AI categorizes todo descriptions automatically on add
- List output is grouped by category with colored headers
- Complete and delete update storage correctly
- If AI API key is not configured, add still works with "feature" default

---

## Phase 3: Polish + Packaging

**Deliverables**:
- Error handling: graceful messages for missing args, invalid IDs, storage corruption
- Help text: clear usage instructions via Commander.js built-in help
- README with installation and usage examples
- .gitignore for project

**Key Files**:
- `README.md` — Usage documentation
- `.gitignore` — Ignore dist/ and node_modules/
- `src/index.ts` — Updated error handling and help text

**Acceptance Criteria**:
- `todo --help` outputs clear usage instructions
- Invalid commands show helpful error messages
- README covers install, configure, and usage

---

## Tech Stack

| Layer | Technology | Version | Notes |
|------|------|------|------|
| Runtime | Node.js | 22.x LTS | Long-term support, stable for CLI development |
| Language | TypeScript | 5.x | Type safety reduces runtime bugs |
| CLI Framework | Commander.js | 14.x | De facto standard for Node.js CLI tools |
| Package Manager | pnpm | 10.x | Fast, disk efficient |
| Data Storage | JSON file | - | Native to Node.js, no dependencies |

## Development Rules

- Each Phase must complete the four-step verification: Code Review -> Test Completeness -> Compile Verify -> Functional Test
- All four steps must pass before committing
- Commit message format: `phase-N: brief description`
- Package manager: pnpm
