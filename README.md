# Forge

**Product Development Framework** — From fuzzy ideas to shippable products, with full AI-assisted guidance.

A complete product development methodology for AI coding assistants: Claude Code, Cursor, OpenCode.

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

## Quick Start

> **YOLO mode is not recommended with Forge.** Forge's value is in its gating — every phase, review, and evolution proposal asks for your confirmation. YOLO mode auto-approves all of these, rendering the harness pointless. Run without YOLO to get the full benefit.
>
> If you do run YOLO, all gates switch to **async write mode** — review reports, fix logs, evolution proposals, and phase checkpoints are written to `changes/` and `.claude/.yolo-pending/` instead of blocking execution. The dev-builder also auto-advances to the next Phase without waiting for `/dev-builder` re-invocation. This preserves the data flow for the evolution engine and lets you review the full output after the run. Gates don't skip, they just don't block.
>
> **Enable via config files** (priority: project > global > env var):
> 1. **Project**: copy `.forge/config.example` to `.forge/config`, uncomment `FORGE_MODE=yolo`
> 2. **Global**: create `~/.forge/config` (Linux/Mac) or `%USERPROFILE%\.forge\config` (Windows) with `FORGE_MODE=yolo`
> 3. **Env var**: `export FORGE_MODE=yolo` (Linux/Mac) or `set FORGE_MODE=yolo` (Windows)

### Claude Code

Copy `adapters/claude-code/.claude/` to your project root and open Claude Code.

### Cursor

Copy `adapters/cursor/.cursor/` to your project root.

### OpenCode

Copy `adapters/opencode/.opencode/` to your project root.

**Note**: OpenCode uses `AGENTS.md` as its rules file (constraint-focused format with tech stack, behavior boundaries, and hard constraints).

### Hook Configuration by Platform

Hooks fire automatically at key events (commit, message, edit, startup). They require platform-specific settings:

| Platform | File to use as `settings.json` | Hook scripts | Requirement |
|----------|-------------------------------|--------------|-------------|
| Linux/Mac | `settings.json` (default) | `.sh` | `sh` (built-in) |
| Windows | `settings.windows.json` | `.bat` | None (cmd native) |

After copying the adapter directory, rename or copy the platform file:

```
# Windows — use .bat hooks (no Git Bash needed)
copy settings.windows.json settings.json

# Linux/Mac — .sh hooks work out of the box, no action needed
```

**OpenCode** doesn't use `settings.json` — its `.sh` (Linux/Mac) and `.bat`/`.ps1` (Windows) hooks work on each platform natively.

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
│  Sub-Agents × 6 (Context Firewall)                          │ ← Execution Layer
│  ├─ implementer        Code + compile verify + self-check   │
│  ├─ code-reviewer      Two-stage review + complexity gate   │
│  ├─ feedback-observer  Capture failures + user corrections  │
│  ├─ evolution-runner   Scan feedback accumulation           │
│  ├─ test-writer        Generate tests for tools/scripts     │
│  └─ planner            Analyze Spec, split phases, plan     │
├─────────────────────────────────────────────────────────────┤
│  Skills × 11 (Guides / Feedforward Control)                 │ ← Guidance Layer
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

Each Skill is an independent methodology module — composable, extensensible, pluggable:

| Skill                    | Responsibility                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **product-spec-builder** | Requirements gathering. AI interviews you through multi-round questioning to turn vague ideas into structured specs. Supports iterative mode.          |
| **design-brief-builder** | Design language. Quantifies vague descriptions ("dark theme, minimal") into concrete direction: color palette, interaction style, information density. |
| **design-maker**         | Design prototyping. Generates full page mockups through Pencil or Figma MCP.                                                                           |
| **dev-planner**          | Development planning. Analyzes dependency relationships, splits into phases, outputs phased development plan.                                          |
| **dev-builder**          | Implementation. Breaks work into Tasks — each Task goes through "code → review → fix → commit" loop.                                                   |
| **bug-fixer**            | Four-stage systematic debugging. Don't guess, don't try blindly: gather evidence → analyze patterns → hypothesize → fix.                               |
| **code-review**          | Two-stage review. Stage 1 checks Spec compliance, Stage 2 checks code quality. Stage 1 must pass before Stage 2.                                       |
| **release-builder**      | Build & deploy. Built-in privacy audit and smoke testing.                                                                                              |
| **feedback-writer**      | Records user corrections and feedback as structured files. Feeds the evolution engine with data.                                                       |
| **evolution-engine**     | Scans accumulated feedback, identifies patterns (3+ occurrences), generates proposals to upgrade rules or optimize skills.                             |
| **skill-builder**        | Creates new Skill definitions from scratch using project templates. Triggered by evolution proposals or manual invocation.                             |

### Execution Layer — Sub-Agent Isolation (Context Firewall)

Every Task gets a **fresh Sub-Agent instance**. No reuse, no inherited context. The orchestrator provides complete task context (spec items, deliverables, files, project structure) but NOT previous task history. This prevents error assumptions from cascading across tasks.

### Inspection Layer — Hook + Review Loop

Code isn't done until it's reviewed:

```
Feature complete → code-reviewer two-stage review
  ├─ Stage 1 pass → Stage 2
  ├─ Stage 1 fail → re-implement → re-review
  └─ Stage 2 pass → commit + push → Task done
  └─ Stage 2 fail → bug-fixer fix → re-review
```

Ten hook scripts fire automatically at critical nodes:

| Hook                   | Trigger            | Action                                  |
| ---------------------- | ------------------ | --------------------------------------- |
| pre-commit-check       | Before commit      | Block commit if compilation fails       |
| auto-push              | After commit       | Auto-push to remote                     |
| stop-gate              | Before agent stops | Block stop if code hasn't been reviewed |
| detect-feedback-signal | On user message    | Auto-detect correction signals          |
| mark-review-needed     | After file edit    | Mark changes as needing review          |
| check-evolution        | On session start   | Check feedback accumulation             |
| memory-check           | After file edit    | Remind to update memory if code changed |
| context-compaction     | After tool use     | Auto-archive old task-history entries beyond 30 to prevent context rot |
| check-sync             | After tool use     | Detect core/ vs adapters/ divergence and remind to run pnpm sync |
| check-handoff          | After tool use     | Suggest session handoff generation when context is running long |

### Evolution Layer — Steering Loop

A harness that doesn't learn from usage is static. Forge evolves:

1. **Level 0: Harness Foundation** — Context compaction, progressive disclosure, tool-call offloading, auto-scoring on failure — prerequisites for reliable evolution
2. **Experience accumulation** — Failures and corrections are auto-recorded with inferred Skill scores (Precision/Coverage/Efficiency/Satisfaction). Scored data is the fuel for Level 2+.
2. **Rule graduation** — Same feedback appears 3+ times → proposed as formal rule in Skill or control file
3. **Skill optimization** — Skill's feedback scores consistently low → proposed adjustment
4. **New Skill creation** — Repeated operation pattern without Skill coverage → proposed new Skill

All evolution proposals require your explicit confirmation. No automatic rule changes.

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
8. **Auto-review** — code-reviewer two-stage review
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
│   ├── agents/                # 6 Sub-agent definitions
│   ├── templates/             # Document templates
│   │   └── memory/            # Three-tier memory + session handoff templates
│   ├── hooks/                 # Hook scripts (.sh/.bat/.ps1)
│   ├── docs/                  # Detailed docs (behavior boundaries, memory system, etc.)
│   └── feedback/              # Feedback templates
├── adapters/
│   ├── claude-code/           # Claude Code adapter (.claude/)
│   ├── cursor/                # Cursor adapter (.cursor/rules/)
│   └── opencode/              # OpenCode adapter (.opencode/)
├── .forge/                    # Forge project config
│   └── config.example         #     config template (copy to config to activate)
├── .claude/                   # Forge's own control files (self-wired hooks via settings.json)
├── CLAUDE.md                  # Main control file
├── scripts/
│   └── sync.ts                # core → adapter sync script
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

## Model Recommendation

Forge covers the full product development pipeline, which demands more from the model than single-task setups. Opus or Sonnet-level models are recommended. Start with a small project to validate output quality and workflow smoothness before committing to a larger project.

---

## What's New

### v1.14 — 2026-05-19
- **Exact version pinning**: Every dependency pinned to `major.minor.patch` — no ranges, no `latest`
- **Dedicated AGENTS.md template**: OpenCode gets a constraint-focused format (tech stack, behavior boundaries, hard constraints), not a CLAUDE.md clone

### v1.13 — 2026-05-19
- **Planner sub-agent**: Dedicated agent for architecture design and Phase splitting, decoupled from implementer context
- **Session handoff**: `handoff-template.md` + `check-handoff` hook to generate session summaries before context reset, preventing lost progress
- **Complexity gate**: `code-reviewer` now skips Stage 1 for `change_complexity="simple"`, matching review depth to change scope
- **Model version tracking**: `feedback-observer` records model version with each feedback, enabling evolution to detect outdated rules

### v1.10–1.12 — 2026-05-19
- **test-writer sub-agent**: Vitest-based test generator for `sync.ts` and core utilities
- **check-sync hook**: Detects `core/` vs `adapters/` divergence after edits
- **Self-wired settings**: ReqForge's own `.claude/settings.json` with all 6 hooks, `settings.local.json` pruned 65→32 lines

### v1.9 — 2026-05-19
- **AI Only for Judgment Tasks**: Deterministic logic is plain code, not AI busywork
- **Fail Loudly**: Uncertainty must be stated explicitly, never hidden
- **Token Budget Awareness**: Check context headroom after each Task

See [CHANGELOG.md](./CHANGELOG.md) for the full version history.

---

## License

MIT


