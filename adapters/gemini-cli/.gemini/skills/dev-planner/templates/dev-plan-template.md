---
name: dev-plan-template
description: DEV-PLAN.md output template. After analyzing the Product Spec, fill in the content following this template's structure and output as DEV-PLAN.md for dev-builder to develop Phase by Phase.
---

# DEV-PLAN Output Template

This template is used to generate a phased development plan. dev-builder reads this document to implement code Phase by Phase.

---

## Template Structure

**File name**: DEV-PLAN.md

---

```markdown
# Development Plan — [Project Name]

> This file records the project's development Phase breakdown, current progress, and remaining work.
> A new session should read this file first to understand the project status before continuing development.

---

## MVP Scope

**In scope (this plan / MVP)**:
- [What we are building now — tie to Product-Spec core features]

**Out of scope (deliberate — not in this MVP)**:
- [Features explicitly deferred; resist zero-friction scope creep]

**Scope amendment criteria** (what user evidence justifies adding scope):
- [e.g. ≥3 independent users report the same blocker in feedback; retention fails activation criterion X]

---

## Phase 1: [Feature Name]

**Deliverables**:
- [Start with a verb, describe deliverable 1 — what the user can do / what the system does]
- [Deliverable 2]
- [Deliverable 3]

**Key Files**:
- `src/path/to/file1.tsx` — [Purpose description]
- `src/path/to/file2.ts` — [Purpose description]
- `src/path/to/file3.ts` — [Purpose description]

**Acceptance Criteria**:
- [Compiles, starts, XX effect can be seen]

**Primary metric** (one falsifiable line — unchanged for this Phase; autoresearch-style decision anchor):
- [e.g. `pnpm test` exit 0 for modules touched; or API p95 < 200ms on fixture X]

---

## Phase 2: [Feature Name]

**Deliverables**:
- [List of deliverables]

**Key Files**:
- [File path + purpose]

**Acceptance Criteria**:
- [Verification criteria]

**Primary metric** (one falsifiable line — unchanged for this Phase):
- [e.g. targeted test command exit 0]

---

<Dynamically add or remove Phases based on the actual number of features>

---

## Tech Stack

| Layer | Technology | Version | Context7 Library ID (optional) | Notes |
|------|------|------|-------------------------------|------|
| [Layer name] | [Technology name] | [Version number] | e.g. `/vercel/next.js` or — | [Rationale or purpose] |

## Database Tables (If Any)

| Table Name | Created In Phase | Purpose |
|------|-----------|------|
| `table_name` | Phase N | [Purpose description] |

## Development Rules

- Each Phase must complete the four-step verification: Code Review -> Test Completeness -> Compile Verify -> Functional Test
- All four steps must pass before committing
- Commit message format: `phase-N: brief description`
- Package manager: [pnpm/npm/yarn]
```

---

## Complete Example

Below is a DEV-PLAN fragment for the "Forge — Local AI Desktop Agent" project for reference:

```markdown
# Development Plan — Forge

> This file records the Forge project's development Phase breakdown, current progress, and remaining work.
> A new session should read this file first to understand the project status before continuing development.

---

## Phase 1: Electron + Next.js Skeleton

**Deliverables**:
- Electron main process + Next.js renderer basic framework
- Three-area layout: left sidebar (collapsible) + main content area + right sidebar (collapsible)
- Title bar component (window control buttons)
- Navigation icon bar (Chat / Management / IM / Schedule / Settings)
- Dark/Light/System theme switching (ThemeProvider)
- Tailwind CSS semantic color system

**Key Files**:
- `src/components/layout/app-layout.tsx` — Main layout
- `src/components/layout/left-sidebar.tsx` — Left sidebar
- `src/components/layout/right-sidebar.tsx` — Right sidebar
- `src/components/layout/title-bar.tsx` — Title bar
- `src/components/providers/theme-provider.tsx` — Theme
- `src/app/globals.css` — Color variable definitions

**Acceptance Criteria**:
- TypeScript compiles with no errors
- Electron window starts, displaying three-area layout
- Theme switching works correctly

---

## Phase 2: Chat Core + SQLite Persistence

**Deliverables**:
- SQLite database initialization (better-sqlite3, WAL mode)
- sessions and messages tables
- settings table (key-value global settings)
- Session CRUD API (/api/sessions)
- Chat API (/api/chat) — Claude API streaming + SSE output
- Frontend chat interface: user messages + Agent messages + streaming rendering
- Session list + new session + switch session

**Key Files**:
- `src/lib/db.ts` — Database initialization + table creation
- `src/app/api/chat/route.ts` — Chat API
- `src/hooks/use-chat.ts` — Chat state management
- `src/hooks/use-sessions.ts` — Session management
- `src/components/views/chat-view.tsx` — Chat view

**Acceptance Criteria**:
- Can create sessions, send messages, receive Claude streaming replies
- Sessions and messages persist after page refresh

---

## Tech Stack

| Layer | Technology | Version | Context7 Library ID (optional) | Notes |
|------|------|------|-------------------------------|------|
| Desktop Framework | Electron | 40.x | — | Cross-platform desktop shell |
| Frontend | Next.js + React | 15.x | `/vercel/next.js` | Full-stack framework |
| UI | Tailwind CSS | 4.x | — | Utility-first CSS |
| AI Engine | Claude API (@anthropic-ai/sdk) | latest | — | Core AI capability |
| Database | SQLite (better-sqlite3) | latest | — | Local persistence, WAL mode |
| Package Manager | pnpm | 10.x | — | Fast, disk-efficient |

## Database Tables

| Table Name | Created In Phase | Purpose |
|------|-----------|------|
| `sessions` | Phase 2 | Session metadata |
| `messages` | Phase 2 | Message content (JSON content blocks) |
| `settings` | Phase 2 | Global key-value settings |
| `skills` | Phase 3 | Skill definitions |
| `agents` | Phase 3 | Agent configurations |
| `mcp_servers` | Phase 3 | MCP server configurations |
| `im_channels` | Phase 4 | IM channel configurations |
| `cron_tasks` | Phase 4 | Scheduled task definitions |
| `api_providers` | Phase 5 | Multi-model API providers |
| `workspaces` | Phase 6 | Workspace definitions |

## Development Rules

- Each Phase must complete the four-step verification: Code Review -> Test Completeness -> Compile Verify -> Functional Test
- All four steps must pass before committing
- Commit message format: `phase-N: brief description`
- Package manager: pnpm
```

---

## Writing Guidelines

1. **Phase Naming**: Use feature names, not number sequences. "Chat Core + SQLite Persistence" is easier to understand than "Phase 2"
2. **Deliverables**:
   - Start each item with a verb (set up, implement, create, configure)
   - Each item describes a perceivable deliverable
   - Infrastructure Phases can write "XX table + CRUD API"
   - Business feature Phases should describe what the user can do
3. **Key Files**:
   - Use full relative paths within the project
   - Attach a purpose description to each file
   - Do not list test files and configuration files (unless they are core deliverables of the Phase)
4. **Acceptance Criteria**:
   - Minimum requirement: compiles + starts + new features work
   - Recommended: existing features are not broken
5. **Primary metric**:
   - Exactly **one** quantifiable line per Phase (e.g. test command exit 0, latency bound, coverage on new files)
   - dev-builder uses it as the keep/discard anchor for the Phase; do not change mid-Phase without user-approved replan
6. **Tech Stack Table**:
   - Include version numbers (latest stable version verified via WebSearch or Context7 when MCP is available)
   - **Context7 Library ID**: fill for major third-party libs dev-builder will call (`/org/project`); use `—` for internal or trivial deps
   - Notes column should include rationale or purpose
7. **Database Tables**:
   - Note which Phase creates each table
   - If a later Phase adds columns (migration), describe it in that Phase's deliverables
8. **Phase Order**:
   - Infrastructure (skeleton/database/routing) -> core features -> supplementary features -> finishing touches (i18n/packaging/deployment)
   - Must not violate dependency relationships
