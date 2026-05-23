# Forge

[![version](https://img.shields.io/badge/version-v1.19.1-blue)](CHANGELOG.md) [![license](https://img.shields.io/badge/license-MIT-green)](LICENSE) [![English](https://img.shields.io/badge/lang-en-blue)](README.md) [![中文](https://img.shields.io/badge/lang-zh--CN-red)](README.zh-CN.md)

**Product Development Framework** — From fuzzy ideas to shippable products, with full AI-assisted guidance.

A complete product development methodology for AI coding assistants: Claude Code, Cursor, OpenCode.

**No npm install required to use the framework** — copy adapter files into your project and open your AI client. Node.js + pnpm are only needed if you contribute to this repo or run `scripts/`.

| Section | Description |
|---------|-------------|
| [Installation & Usage](#installation--usage) | Clone, copy adapters, hooks, first run |
| [Workflow](#workflow) | Spec → Plan → Build → Release |
| [Framework Development](#framework-development) | Tests, sync, dependency graph (contributors) |

---

## What's New

### v1.19.1 — 2026-05-23
- **Hallucination Gate wired**: All adapter `settings.json` register `PreToolUse` → `hallucination-gate`; hook reads `tool_name` from stdin JSON; Windows `.bat` uses Node parsing.
- **Parallel review docs aligned**: code-review, dev-builder, bug-fixer SKILLs and README workflow unified to parallel 4-agent + aggregation; removed stale Stage 1/2 language; confidence thresholds ≥0.6 / 0.3.
- **Commands layer complete**: Added `commands/*.md` for design-brief-builder, design-maker, evolution-engine, feedback-writer (all 11 skills with slash commands now have command files).
- **Loadout cleanup**: Removed ReqForge-only `check-sync` from user-facing loadouts.
- **Cross-platform tooling**: `pnpm validate-skill` defaults to `scripts/validate-skill.mjs`; added `pnpm apply-loadout <name> <client>`.
- **Docs & version**: package.json, DEV-PLAN, Product-Spec, core/docs synced to v1.19.1; Sub-Agent count corrected to 10.

### v1.19 — 2026-05-23
- **Loadout mechanism**: Reusable bundles of skills, agents, hooks, and MCP servers for different project types. 4 built-in loadouts: `full`, `web-app`, `cli-tool`, `minimal`. Validated by `loadout.schema.json`. Synced to all adapters via `pnpm sync`.
- **loadout.schema.json**: JSON Schema v7 validation for loadout definitions (required fields: name, version, description, skills, agents, hooks).

### v1.18 — 2026-05-23
- **skill.json metadata**: All 11 skills now ship with machine-readable `skill.json` (name, version, triggers, prerequisites, agents, hooks). Validated by `validate-skill.sh` via Node/Python. JSON Schema at `core/skills/skill.schema.json`.
- **Commands layer**: All 11 skills with slash commands now have `commands/<name>.md` (v1.19.1 completed the remaining 4). YAML frontmatter + phased workflows. `pnpm validate-skill` uses cross-platform `validate-skill.mjs` by default.
- **Parallel agent code review**: 4 specialized review agents (design, bug, security, types) run concurrently, each returning structured findings with confidence scores (0.0-1.0). Aggregator applies thresholding (≥0.6 confirmed, 0.3-0.6 suspected, <0.3 suppressed) with cross-agent boost. Replaces the old serial two-stage review.
- **Hallucination Gate**: PreToolUse hook verifies Write/Edit target directories exist (v1.19.1: registered in all adapter settings).
- **Project state injection**: `check-evolution.sh` now detects Product-Spec/DEV-PLAN/Code presence on session start and injects routing guidance as `additionalContext`.
- **validate-skill.sh — skill.json validation**: Added existence check + required field validation (name, version, description, triggers.auto/manual/command).
- **sub-agent-orchestration.md**: Documented parallel review pattern with all 4 specialist agents and aggregation rules.
- Propagated to all 3 adapters (claude-code, cursor, opencode) via `pnpm sync`.

### v1.17 — 2026-05-22
- **Decidable Activation — [Not For] section**: All 11 skills now include a `[Not For]` section specifying when NOT to use the skill and what to use instead. Added as a required section in validate-skill.sh. Updated skill-template.md.
- **Three-Layer Diagnostic Model**: bug-fixer now goes beyond root cause to ask: Symptom → Design Flaw → Principle Violation. Every fix report includes all three layers to prevent recurrence, not just patch the symptom.
- **Numeric Quality Rubric**: skill-builder gets a 16-item, 32-point scoring system. Ship threshold ≥ 24 with no critical item at 0. Run `pnpm validate-skill:bash --score` to compute (bash script only).
- **create-skill.sh scaffold**: CLI tool to generate a new Skill directory from a name. Supports `--minimal` (required sections only) and `--full` (with recommended sections). Run `pnpm create-skill <name>`.

### v1.16 — 2026-05-21
- **Harness Engineering principles**: dev-builder upgraded with Tool AI-fication Priority (CLI > MCP > Skill > GUI), Substitute Don't Mock (real substitutes over mocks), Environment-First (project must run before features), Minimum Runnable Subset (each Phase delivers an end-to-end core path). Scripted Verification (complex Phases generate `verify-phase-N.sh`).
- **Machine Gates**: 3-level enforceable gates added to CLAUDE.md — Hallucination Gate (fails on wrong paths/missing deps), Sloppiness Gate (blocks completion without verification evidence), Overstepping Gate (rejects scope creep). Codification principle: gates that can be linted MUST be codified.
- **Iron Rules**: 8 baseline rules extracted as the Forge foundation (knowledge offloading, no prompt magic, real files, guardrails, etc.). Documented in Product-Spec.md and README.
- **llms.txt**: AI-searchable project summary at repo root for LLM discoverability.
- **Per-directory AGENTS.md**: Local operational boundaries for `core/skills/`, `core/agents/`, `core/hooks/`, `core/templates/`, `core/feedback/` — each directory gets MUST/MUST NOT/SHOULD rules.
- **validate-skill.sh**: Formal SKILL.md specification validator — checks frontmatter, required sections, kebab-case, Gotchas count, file size, placeholder markers. Runs via `pnpm validate-skill`.
- **Claude Code adapter rules migration**: Per-directory rules converted from AGENTS.md (which Claude Code doesn't read) to `.claude/rules/*.md` with path-scoped `globs` frontmatter. AGENTS.md retained for OpenCode adapter.
- **SKILL.md structural audit**: All 11 skills validated — 11 missing-section errors and 19 warnings fixed (added [Dependency Check], [File Structure], [Initialization], [Output Style], [Gotchas] sections across design-maker, evolution-engine, feedback-writer, bug-fixer, code-review, dev-builder, dev-planner).
- **Gotchas in every skill**: `[Gotchas]` section added to all 11 skills capturing domain-specific failure points (vague requirements, privacy leaks, premature evolution, duplicate feedback, etc.). Each skill accumulates hard-won lessons over time.
- **Skill template updated**: New skills automatically include a `[Gotchas]` section as a recommended component.
- **CLI best practices in CLAUDE.md**: `/model`, `/compact`, `/context`, `/sandbox` usage guidance encoded as General Rules. Key rules wrapped in `<important if="">` tags for better adherence.
- **Renamed `[Anti-Rationalization Checklist]` → `[Gotchas: Anti-Rationalization]`** in dev-builder, code-review, bug-fixer for naming consistency.
- **Glue Code First**: dev-builder's "SDK-First" upgraded to "Glue Code First" — priority chain: framework built-in → open-source library → AI prompt → custom logic only when necessary.
- **Generator/Optimizer recursion**: evolution-engine now has explicit First Principles — the engine that evolves rules should itself be evolvable through the same feedback loop.
- **Cross-session audit**: code-review added principle that complex reviews must run in isolated sub-agent sessions to prevent self-confirmation bias.
- **Prompt remediation**: feedback template now includes a `prompt_remediation` field — each failure can carry a reusable prompt fragment to prevent recurrence.

### v1.14.2 — 2026-05-20
- **forge-install**: `pnpm forge-install <client> --target <dir>` copies the adapter into your project; `install.sh` / `install.ps1` wrappers included
- **Safe upgrade**: `--force` merges without overwriting `feedback/` or `settings.local.json`

### v1.14.1 — 2026-05-20
- **Script unit tests**: `scripts/__tests__/` covers `sync.ts` and `dependency-graph.ts` (Vitest 4.1.6); run `pnpm test` to verify
- **Dependency graph fix**: Named imports (`import { x } from "./y"`) now resolve correctly for more accurate blast-radius
- **Engineering alignment**: `package.json` at `1.14.1` with exact patch-pinned devDependencies; `DEV-PLAN.md` progress table added

### v1.14 — 2026-05-19
- **Exact version pinning**: Every dependency pinned to `major.minor.patch` — no ranges, no `latest`
- **Dedicated AGENTS.md template**: OpenCode gets a constraint-focused format (tech stack, behavior boundaries, hard constraints), not a CLAUDE.md clone
- **Dependency graph**: `scripts/dependency-graph.ts` — file-level import graph for blast-radius analysis. `pnpm dep-graph build | affected | risk | stats`. Integrated into dev-builder review loop: code-reviewer receives `affected_files` for focused review

### v1.13 — 2026-05-19
- **Planner sub-agent**: Dedicated agent for architecture design and Phase splitting, decoupled from implementer context
- **Session handoff**: `handoff-template.md` + `check-handoff` hook to generate session summaries before context reset, preventing lost progress
- **Complexity gate**: `code-reviewer` now skips parallel specialist agents for `change_complexity="simple"`, matching review depth to change scope
- **Model version tracking**: `feedback-observer` records model version with each feedback, enabling evolution to detect outdated rules

### v1.10–1.12 — 2026-05-19
- **test-writer sub-agent**: Vitest-based test generator for tools/scripts (v1.14.1 ships the `sync` / `dependency-graph` test suite)
- **check-sync hook**: Detects `core/` vs `adapters/` divergence after edits
- **Self-wired settings**: ReqForge's own `.claude/settings.json` with hook events wired; `settings.local.json` pruned 65→32 lines

### v1.9 — 2026-05-19
- **AI Only for Judgment Tasks**: Deterministic logic is plain code, not AI busywork
- **Fail Loudly**: Uncertainty must be stated explicitly, never hidden
- **Token Budget Awareness**: Check context headroom after each Task

See [CHANGELOG.md](./CHANGELOG.md) for the full version history.

---

## Overview

If you've done Vibe Coding, you know the hard part isn't getting AI to write code — it's managing the entire product development process. You tell AI "build me a writing tool," and it starts coding. Halfway through, you realize the direction is wrong and start over. Features finally work, but the UI looks terrible — no design specs, so AI pieced together default styles from training data. Fix the UI, introduce bugs. Fix bugs, introduce more bugs. Context gets long, AI forgets earlier requirements, code starts drifting.

The root cause isn't that models aren't smart enough. It's that there's no **system** around the model.

Forge is an **Agent Harness** — not about optimizing how you talk to AI, but building a complete system of constraints, guidance, and feedback. The AI knows what to do before it starts, automatically verifies results afterward, self-corrects when things go wrong, and never makes the same mistake twice.

**Harness = Guides (feedforward) + Sensors (feedback) + Steering Loop (evolution)**

- **Guides** — Each Skill defines methodology, workflow, and acceptance criteria. Before the agent acts, it knows exactly "how to do it" and "what counts as done."
- **Sensors** — Hook scripts + Code Review check every critical node after the agent acts. No reliance on the model's self-awareness.
- **Steering Loop** — Every correction you give is recorded. When the same issue surfaces 3+ times, it's automatically promoted to a formal rule in the Skill.

---

## Installation & Usage

Forge is **copy-to-use**: no package publish, no `npm install` in your app project. You only need a supported AI coding assistant.

### Prerequisites

| Required | Notes |
|----------|-------|
| **AI client** (one of) | [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Cursor](https://cursor.com), or [OpenCode](https://opencode.ai) |
| **Git** | Clone this repo; optional for your own project |
| **Empty or existing project folder** | Forge files live at the project root alongside your code |

| Optional (contributors only) | Notes |
|------------------------------|-------|
| Node.js 22.x LTS + pnpm 10.x | Run `pnpm test`, `pnpm sync`, `pnpm dep-graph` — see [Framework Development](#framework-development) |

### Step 1 — Clone Forge

```bash
git clone https://github.com/zxpmail/ReqForge.git
cd ReqForge
```

Keep the clone path handy — you will copy files **from** `ReqForge/adapters/...` **into** your app project.

### Step 2 — Install into your project

**Option A — One-command install (recommended)**

From your Forge clone (requires Node.js for `ts-node`):

```bash
# Install into another project
pnpm forge-install claude-code --target /path/to/my-app

# Install into current directory
pnpm forge-install cursor .

# Merge upgrade (keeps your feedback/ and settings.local.json)
pnpm forge-install claude-code --target ../my-app --force
```

```powershell
# Windows — or use the PowerShell wrapper from the Forge repo root
.\scripts\install.ps1 claude-code C:\path\to\my-app
```

```bash
# macOS / Linux wrapper
./scripts/install.sh opencode /path/to/my-app
```

On Windows, `settings.windows.json` is applied automatically. Use `--windows` on other platforms if needed.

**Option B — Manual copy**

Create or open your app directory, then copy **only** the adapter folder for your AI client.

| Client | Copy from (inside Forge clone) | Into your project |
|--------|-------------------------------|-------------------|
| **Claude Code** | `adapters/claude-code/.claude/` | `<your-project>/.claude/` |
| **Cursor** | `adapters/cursor/.cursor/` | `<your-project>/.cursor/` |
| **OpenCode** | `adapters/opencode/.opencode/` | `<your-project>/.opencode/` |

**Examples** (replace paths with your actual locations):

```bash
# macOS / Linux — Claude Code
cp -R /path/to/ReqForge/adapters/claude-code/.claude /path/to/my-app/.claude

# macOS / Linux — Cursor
cp -R /path/to/ReqForge/adapters/cursor/.cursor /path/to/my-app/.cursor

# macOS / Linux — OpenCode
cp -R /path/to/ReqForge/adapters/opencode/.opencode /path/to/my-app/.opencode
```

```powershell
# Windows — Claude Code (PowerShell)
Copy-Item -Recurse -Force C:\path\to\ReqForge\adapters\claude-code\.claude C:\path\to\my-app\.claude

# Windows — Cursor
Copy-Item -Recurse -Force C:\path\to\ReqForge\adapters\cursor\.cursor C:\path\to\my-app\.cursor
```

> **OpenCode** uses `.opencode/AGENTS.md` as the control file (constraint format: tech stack, behavior boundaries, hard constraints) — not a copy of root `CLAUDE.md`.

### Step 3 — Enable hooks (Claude Code & Cursor)

Hooks run before tool use, on commit, edit, session start, etc. Default `settings.json` already registers all **10 hooks** (including `PreToolUse` → `hallucination-gate`). After copying `.claude/` or `.cursor/`:

| Platform | Action |
|----------|--------|
| **Windows** | In `.claude/` (or `.cursor/` inside rules): `copy settings.windows.json settings.json` |
| **Linux / Mac** | Default `settings.json` uses `.sh` hooks — no change needed |
| **OpenCode** | No `settings.json`; `.sh` / `.bat` hooks work per platform |

### Step 3b — Loadouts (optional)

Adapters ship **4 loadout bundles** under `loadouts/` (`full`, `web-app`, `cli-tool`, `minimal`). Each JSON lists recommended skills, agents, and hooks for a project type.

- **Default install** ≈ `full` loadout (all hooks in `settings.json`).
- **Trim hooks** (contributors, from Forge clone): `pnpm apply-loadout minimal claude-code` merges a lighter hook set into adapter `settings.json`. Add `--dry-run` to preview.
- Loadouts are **reference manifests** — skills/agents are already copied; use loadouts to understand what each bundle includes.

### Step 4 — First run in your AI client

1. Open **your project folder** (the one that now contains `.claude/`, `.cursor/`, or `.opencode/`) in the AI client.
2. Start a new chat. Forge detects progress from files present (`Product-Spec.md`, `DEV-PLAN.md`, code, `memory/`).
3. Describe your product idea in natural language, or invoke a Skill:

| Goal | Skill command (Claude Code / OpenCode style) | Output |
|------|-----------------------------------------------|--------|
| Requirements | `/product-spec-builder` | `Product-Spec.md` |
| Design brief (optional) | `/design-brief-builder` | `Design-Brief.md` |
| Dev plan | `/dev-planner` | `DEV-PLAN.md` |
| Implementation | `/dev-builder` | Code + `memory/` (auto-created) |
| Bug fix | Describe the bug (auto-triggers `/bug-fixer`) | Fix + review loop |
| Release | `/release-builder` | Build / deploy checklist |

**Cursor**: rules load from `.cursor/rules/` automatically; refer to skills in chat (e.g. “run product-spec-builder”) or use your client’s skill UI if configured.

**Quick Spec**: one sentence like *“A habit tracker with AI coaching”* — the agent can generate a minimal `Product-Spec.md` with `[待确认]` markers for you to refine.

### After installation — what appears in your project

```
my-app/
├── .claude/                    # or .cursor/ or .opencode/  ← adapter bundle
│   ├── CLAUDE.md               # control file (OpenCode: AGENTS.md)
│   ├── settings.json           # 10 hooks wired (incl. hallucination-gate)
│   ├── skills/                 # 11 Skill definitions + commands/
│   ├── agents/                 # 10 Sub-agent definitions
│   ├── hooks/                  # .sh + .bat hook scripts
│   ├── loadouts/               # full | web-app | cli-tool | minimal
│   ├── feedback/               # evolution fuel (lessons learned)
│   ├── EVOLUTION.md            # evolution engine levels
│   └── rules/                  # Claude Code: .claude/rules/*.md; Cursor: .cursor/rules/*.mdc
├── Product-Spec.md             # after /product-spec-builder
├── DEV-PLAN.md                 # after /dev-planner
├── Design-Brief.md             # optional
├── memory/                     # auto-created on first /dev-builder
│   ├── project-memory.md
│   ├── decisions-log.md
│   └── task-history.md
└── <project-name>/ ...         # your application code (not flat in root)
```

Forge does **not** modify your `package.json` unless you ask the agent to add dependencies during development.

### Updating Forge in an existing project

1. Pull the latest `ReqForge` clone (or download a new release).
2. Re-copy the adapter directory over your project’s `.claude/` / `.cursor/` / `.opencode/` (back up local `feedback/` if you customized it).
3. Re-apply Windows `settings.windows.json` → `settings.json` if needed.

### YOLO mode (not recommended)

> Forge’s value is **gating** — phases, reviews, and evolution proposals ask for confirmation. YOLO auto-approves them and weakens the harness.
>
> If enabled, gates switch to **async write mode** (artifacts under `changes/` and `.claude/.yolo-pending/`). 🔴 red-boundary actions still require explicit approval.
>
> Enable (priority: project > global > env):
> 1. Copy `.forge/config.example` → `.forge/config`, set `FORGE_MODE=yolo`
> 2. Or `~/.forge/config` / `%USERPROFILE%\.forge\config`
> 3. Or env `FORGE_MODE=yolo`

More detail: [core/docs/](core/docs/) (behavior boundaries, memory, sub-agents).

---

## Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Control File (CLAUDE.md / .cursor/rules/reqforge.mdc)      │ ← Orchestration Layer
│  <60 lines — dispatch map only, details in core/docs/       │
│  Project state detection, flow routing, Skill dispatch       │
├─────────────────────────────────────────────────────────────┤
│  Three-Tier Memory (Context Preservation)                    │ ← Memory Layer
│  ├─ project-memory.md  Long-term: architecture, constraints │
│  ├─ decisions-log.md   Mid-term: ADRs, technical decisions  │
│  └─ task-history.md    Short-term: recent task summaries     │
├─────────────────────────────────────────────────────────────┤
│  Sub-Agents × 10 (Context Firewall)                         │ ← Execution Layer
│  ├─ implementer        Code + compile verify + self-check   │
│  ├─ code-reviewer      Parallel dispatch + confidence aggregation   │
│  ├─ code-reviewer-*  4 specialists (design, bug, security, types)│
│  ├─ feedback-observer  Capture failures + user corrections  │
│  ├─ evolution-runner   Scan feedback accumulation           │
│  ├─ test-writer        Generate tests for tools/scripts     │
│  └─ planner            Analyze Spec, split phases, plan     │
├─────────────────────────────────────────────────────────────┤
│  Skills × 11 + Loadouts × 4 (Guides / Feedforward Control)  │ ← Guidance Layer
│  Inject methodology and standards BEFORE the agent acts     │
├─────────────────────────────────────────────────────────────┤
│  Hooks + Review Loop (Sensors / Feedback Control)           │ ← Inspection Layer
│  Check results AFTER the agent acts, deterministic          │
├─────────────────────────────────────────────────────────────┤
│  feedback/ + EVOLUTION.md (Steering Loop)                   │ ← Evolution Layer
│  Each correction improves the harness. Never repeat errors  │
└─────────────────────────────────────────────────────────────┘
```

### Memory Layer — Three-Tier Project Memory

AI amnesia is real. Every new session, the AI forgets what your project looks like, what decisions were made, and what was built last week. Forge solves this with three tiers of version-controlled memory:

| Tier | File | Retention | Content |
|------|------|-----------|---------|
| Long-term | `memory/project-memory.md` | Permanent | Architecture, tech stack, constraints, known pitfalls, dev environment |
| Mid-term | `memory/decisions-log.md` | Permanent | ADR-format decision records (context → options → decision → impact) |
| Short-term | `memory/task-history.md` | Last 30 entries | Task summaries (date, phase, type, changed files, notes) |

**How it works**:
- **Session start**: AI reads all three memory files before any task — mandatory context loading
- **Task completion**: AI appends to `task-history.md` (always), `decisions-log.md` (if a decision was made), `project-memory.md` (if architecture facts changed)
- **Initialization**: `memory/` directory is created automatically on first `/dev-builder` invocation, populated from templates using Product-Spec.md and DEV-PLAN.md info

Memory files are plain markdown committed to your project repo — shared across sessions, across team members, and across AI tools.

### Behavior Boundaries — Traffic Light System

Not all AI actions should have the same level of autonomy. Forge classifies every action into three levels:

| Level | Rule | Examples |
|-------|------|---------|
| 🟢 Green | Execute without confirmation | Variable naming, code style, tests, bug fixes (obvious), docs, dev deps |
| 🟡 Yellow | Confirm before proceeding | External deps, DB schema, core business logic, project config, new routes |
| 🔴 Red | Always require explicit approval | Deleting data, production config, force push, releases, auth changes |

**YOLO mode**: In YOLO mode, 🟢 and 🟡 actions proceed automatically. 🔴 Red actions **always** require confirmation, even in YOLO mode. There is no override for red boundaries.

### Quick Start Mode

Don't want the full interview? Just describe your project in one sentence:

```
You: "A habit tracker app with AI coaching"
Forge: ⚡ Quick Spec generated! Items marked [待确认] are my best guesses.
```

AI infers everything — product type, target users, core features, tech stack, layout. Uncertain items default to the simpler option and are marked for your review. Switch to deep-dive mode anytime with `/product-spec-builder`.

### Guidance Layer — 11 Skills

Each Skill is an independent methodology module — composable, extensensible, pluggable. Every skill includes a `[Gotchas]` section documenting common failure points and lessons learned:

| Skill                    | Responsibility                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **product-spec-builder** | Requirements gathering. AI interviews you through multi-round questioning to turn vague ideas into structured specs. Supports iterative mode.          |
| **design-brief-builder** | Design language. Quantifies vague descriptions ("dark theme, minimal") into concrete direction: color palette, interaction style, information density. |
| **design-maker**         | Design prototyping. Generates full page mockups through Pencil or Figma MCP.                                                                           |
| **dev-planner**          | Development planning. Analyzes dependency relationships, splits into phases, outputs phased development plan.                                          |
| **dev-builder**          | Implementation. Breaks work into Tasks — each Task goes through "code → review → fix → commit" loop.                                                   |
| **bug-fixer**            | Four-stage systematic debugging. Don't guess, don't try blindly: gather evidence → analyze patterns → hypothesize → fix.                               |
| **code-review**          | Parallel agent review — 4 specialists (design, bug, security, types) with confidence-scored aggregation (≥0.6 confirmed, 0.3-0.6 suspected).               |
| **release-builder**      | Build & deploy. Built-in privacy audit and smoke testing.                                                                                              |
| **feedback-writer**      | Records user corrections and feedback as structured files. Feeds the evolution engine with data.                                                       |
| **evolution-engine**     | Scans accumulated feedback, identifies patterns (3+ occurrences), generates proposals to upgrade rules or optimize skills.                             |
| **skill-builder**        | Creates new Skill definitions from scratch using project templates. Triggered by evolution proposals or manual invocation.                             |

### Execution Layer — Sub-Agent Isolation (Context Firewall)

Every Task gets a **fresh Sub-Agent instance**. No reuse, no inherited context. The orchestrator provides complete task context (spec items, deliverables, files, project structure) but NOT previous task history. This prevents error assumptions from cascading across tasks.

| Sub-Agent | Skill | Responsibility |
|-----------|-------|----------------|
| **planner** | dev-planner | Architecture design + Phase splitting |
| **implementer** | dev-builder | Code + compile verify + self-check |
| **code-reviewer** | code-review | Aggregate parallel review findings |
| **code-reviewer-design** | code-review | Spec compliance, UI consistency, drift |
| **code-reviewer-bug** | code-review | Bug patterns, races, resource leaks |
| **code-reviewer-security** | code-review | OWASP Top 10, credential leaks, XSS |
| **code-reviewer-types** | code-review | Type safety, nullability, edge cases |
| **feedback-observer** | feedback-writer | Record failures + user corrections |
| **evolution-runner** | evolution-engine | Scan feedback → evolution proposals |
| **test-writer** | dev-builder | Generate Vitest tests for scripts/utilities |

### Inspection Layer — Hook + Review Loop

Code isn't done until it's reviewed:

```
Feature complete → code-reviewer parallel review
  ├─ change_complexity="simple" → quick quality check
  ├─ moderate/complex → 4 agents in parallel (design, bug, security, types)
  ├─ confirmed spec gaps → re-implement → re-review
  └─ confirmed quality issues → bug-fixer fix → re-review
  └─ pass → commit + push → Task done
```

Ten hook scripts fire automatically at critical nodes (plus `check-sync` in the ReqForge repo only — see note below):

| Hook                   | Trigger            | Action                                  |
| ---------------------- | ------------------ | --------------------------------------- |
| hallucination-gate     | Before tool use    | Block Write/Edit to non-existent dirs   |
| pre-commit-check       | Before commit      | Block commit if compilation fails       |
| auto-push              | After commit       | Auto-push to remote                     |
| stop-gate              | Before agent stops | Block stop if code hasn't been reviewed |
| detect-feedback-signal | On user message    | Auto-detect correction signals          |
| mark-review-needed     | After file edit    | Mark changes as needing review          |
| check-evolution        | On session start   | Check feedback accumulation             |
| memory-check           | After file edit    | Remind to update memory if code changed |
| context-compaction     | After tool use     | Auto-archive old task-history entries beyond 30 to prevent context rot |
| check-handoff          | After tool use     | Suggest session handoff generation when context is running long |

> **Note**: `check-sync` (detects core/ vs adapters/ divergence) ships only in the ReqForge repo's `core/hooks/` — not in installed adapter bundles.

### Evolution Layer — Steering Loop

A harness that doesn't learn from usage is static. Forge evolves:

1. **Level 0: Harness Foundation** — Context compaction, progressive disclosure, tool-call offloading, auto-scoring on failure — prerequisites for reliable evolution
2. **Experience accumulation** — Failures and corrections are auto-recorded with inferred Skill scores (Precision/Coverage/Efficiency/Satisfaction). Scored data is the fuel for Level 2+.
3. **Rule graduation** — Same feedback appears 3+ times → proposed as formal rule in Skill or control file
4. **Skill optimization** — Skill's feedback scores consistently low → proposed adjustment
5. **New Skill creation** — Repeated operation pattern without Skill coverage → proposed new Skill

All evolution proposals require your explicit confirmation. No automatic rule changes.

### Iron Rules — Non-Negotiable Baseline

1. Define the problem before writing code
2. Plan before executing
3. Every step must be verifiable — "looks right" is not completion
4. Commit frequently — every progress point should be a rollback checkpoint
5. Keep docs updated — context loss is the silent killer
6. Trust only machine evidence (reproducible commands, test output, CI status) — not AI's verbal assurance
7. Codify rules — if it can be lint/test/schema/hook/CI, it MUST be; natural language alone is not enforcement
8. Non-compliant output must fail, not rely on humans remembering to check

---

## Control File Philosophy

CLAUDE.md is kept under 60 lines — a dispatch map, not a manual. Detailed procedures live in each Skill's SKILL.md (loaded only when that skill is active). Reference docs (behavior boundaries, memory system, sub-agent orchestration) live in `core/docs/`.

Every rule in CLAUDE.md must be traceable to a specific failure or feedback. Generic best-practice rules belong in SKILL.md, not the control file. This keeps the prompt lean and every rule earns its place.

## Design Priority

```
Design tool mockups (highest) → Design-Brief.md → Product-Spec.md (functional logic)
```

When design mockups exist, all UI must match the design. Conflicts are resolved in favor of the design tool.

---

## Workflow

1. **Describe your idea** — Tell AI what you want to build; product-spec-builder interviews you to clarify (or use Quick Mode for one-sentence start)
2. **Generate spec** — Outputs Product-Spec.md
3. **Design brief (optional)** — Invoke /design-brief-builder
4. **Design mockups (optional)** — Invoke /design-maker
5. **Development plan** — Invoke /dev-planner, outputs DEV-PLAN.md
6. **Build** — Invoke /dev-builder, works through each Task in each Phase
7. **Memory auto-update** — After each Task, project memory is updated automatically
8. **Auto-review** — code-reviewer parallel agent review + confidence aggregation
9. **Auto-fix** — Failed review triggers bug-fixer automatically
10. **Commit & push** — Review passes → auto commit + push
11. **Phase verification** — Cross-Task integration check + compile + functional test
12. **Iterate** — Request changes in conversation; auto-update Spec → Plan → code → review
13. **Release** — Invoke /release-builder

## Repository Structure

```
Forge/
├── core/                      # Shared core content
│   ├── skills/                # 11 skill definitions, each in its own directory
│   ├── agents/                # 10 Sub-agent definitions
│   ├── loadouts/              # Reusable skill/agent/hook bundles
│   ├── templates/             # Document templates
│   │   └── memory/            # Three-tier memory + session handoff templates
│   ├── hooks/                 # Hook scripts (.sh/.bat/.ps1)
│   ├── docs/                  # Detailed docs (behavior boundaries, memory system, etc.)
│   └── feedback/              # Feedback templates
├── adapters/
│   ├── claude-code/           # Claude Code adapter (.claude/ + .claude/rules/)
│   ├── cursor/                # Cursor adapter (.cursor/rules/)
│   └── opencode/              # OpenCode adapter (.opencode/)
├── .forge/                    # Forge project config
│   └── config.example         #     config template (copy to config to activate)
├── .claude/                   # Forge's own control files (self-wired hooks via settings.json)
├── CLAUDE.md                  # Main control file
├── llms.txt                   # AI-searchable project summary
├── scripts/
│   ├── sync.ts                # core → adapter sync script
│   ├── install.ts             # adapter → user project install
│   ├── install.sh / install.ps1 # install wrappers
│   ├── dependency-graph.ts    # File-level import graph + blast-radius
│   ├── validate-skill.mjs     # Cross-platform SKILL.md validator (default pnpm validate-skill)
│   ├── validate-skill.sh      # Full validator + --score rubric (pnpm validate-skill:bash)
│   ├── create-skill.sh        # Scaffold new Skill directory (pnpm create-skill)
│   ├── apply-loadout.ts       # Merge loadout hooks into adapter settings
│   └── __tests__/             # Vitest unit tests
├── vitest.config.ts           # Test runner config
├── changes/                   # Change artifacts (proposal/specs/design/tasks)
│   └── archive/               # Archived implemented changes
├── EVOLUTION.md               # Evolution engine definition
├── Product-Spec.md            # Forge's own Product Spec
├── Product-Spec-CHANGELOG.md  # Spec change log
├── DEV-PLAN.md                # Forge's own development plan
├── package.json               # Forge dev dependencies
├── tsconfig.json
├── LICENSE                    # MIT license
└── README.md                  # This file
```

---

## Framework Development

After editing `core/`, sync to adapters and run tests before committing.

**Requirements**: Node.js 22.x LTS, pnpm 10.x

```bash
pnpm install          # Dev dependencies (TypeScript, Vitest, etc.)
pnpm test             # Unit tests (22 cases)
pnpm build            # Compile scripts/ to dist/
pnpm sync             # Sync core/ → adapters/
pnpm validate-skill   # Validate core/skills/ (cross-platform .mjs; add --strict)
pnpm apply-loadout full claude-code  # Write loadout hooks to adapter settings
pnpm dep-graph build  # Build dependency graph → .forge/graph.json
pnpm dep-graph stats  # Print graph statistics
```

| Command | Description |
|---------|-------------|
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm validate-skill:bash` | Bash validate-skill.sh (requires WSL/Git Bash); add `--score` for 32-point rubric |
| `pnpm create-skill <name>` | Scaffold new Skill from name (`--minimal` or `--full`) |
| `pnpm apply-loadout <loadout> <client>` | Merge loadout (full/web-app/cli-tool/minimal) hooks into settings; `--dry-run` to preview |
| `pnpm dep-graph affected [files...]` | Blast-radius: list transitively affected files (git diff if no args) |
| `pnpm dep-graph risk [files...]` | Risk score for a set of changes |
| `pnpm forge-install <client> --target <dir>` | Install adapter into a user project |

Always run `pnpm sync` after changing `core/skills`, `core/agents`, `core/hooks`, etc. — otherwise the `check-sync` hook will warn about adapter drift.

---

## Model Recommendation

Forge covers the full product development pipeline, which demands more from the model than single-task setups. Opus or Sonnet-level models are recommended. Start with a small project to validate output quality and workflow smoothness before committing to a larger project.

## License

MIT


