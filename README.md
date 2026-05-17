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
> If you do run YOLO, all gates switch to **async write mode** — review reports, fix logs, evolution proposals, and phase checkpoints are written to files instead of blocking execution. This preserves the data flow for the evolution engine and lets you review the full output after the run. Gates don't skip, they just don't block.

### Claude Code

Copy `adapters/claude-code/.claude/` to your project root and open Claude Code.

### Cursor

Copy `adapters/cursor/.cursor/` to your project root.

### OpenCode

Copy `adapters/opencode/.opencode/` to your project root.

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
│  Project state detection, flow routing, Skill dispatch       │
├─────────────────────────────────────────────────────────────┤
│  Sub-Agents × 4 (Context Firewall)                          │ ← Execution Layer
│  ├─ implementer        Code + compile verify + self-check   │
│  ├─ code-reviewer      Two-stage review                     │
│  ├─ feedback-observer  Capture user corrections             │
│  └─ evolution-runner   Scan feedback accumulation           │
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

Six hook scripts fire automatically at critical nodes:

| Hook                   | Trigger            | Action                                  |
| ---------------------- | ------------------ | --------------------------------------- |
| pre-commit-check       | Before commit      | Block commit if compilation fails       |
| auto-push              | After commit       | Auto-push to remote                     |
| stop-gate              | Before agent stops | Block stop if code hasn't been reviewed |
| detect-feedback-signal | On user message    | Auto-detect correction signals          |
| mark-review-needed     | After file edit    | Mark changes as needing review          |
| check-evolution        | On session start   | Check feedback accumulation             |

### Evolution Layer — Steering Loop

A harness that doesn't learn from usage is static. Forge evolves:

1. **Experience accumulation** — Corrections recorded silently, nearly invisible
2. **Rule graduation** — Same feedback appears 3+ times → proposed as formal rule in Skill or control file
3. **Skill optimization** — Skill's feedback scores consistently low → proposed adjustment
4. **New Skill creation** — Repeated operation pattern without Skill coverage → proposed new Skill

All evolution proposals require your explicit confirmation. No automatic rule changes.

---

## Design Priority

```
Design tool mockups (highest) → Design-Brief.md → Product-Spec.md (functional logic)
```

When design mockups exist, all UI must match the design. Conflicts are resolved in favor of the design tool.

---

## Workflow

1. **Describe your idea** — Tell AI what you want to build; product-spec-builder interviews you to clarify
2. **Generate spec** — Outputs Product-Spec.md
3. **Design brief (optional)** — Invoke /design-brief-builder
4. **Design mockups (optional)** — Invoke /design-maker
5. **Development plan** — Invoke /dev-planner, outputs DEV-PLAN.md
6. **Build** — Invoke /dev-builder, works through each Task in each Phase
7. **Auto-review** — code-reviewer two-stage review
8. **Auto-fix** — Failed review triggers bug-fixer automatically
9. **Commit & push** — Review passes → auto commit + push
10. **Phase verification** — Cross-Task integration check + compile + functional test
11. **Iterate** — Request changes in conversation; auto-update Spec → Plan → code → review
12. **Release** — Invoke /release-builder

## Repository Structure

```
Forge/
├── core/                      # Shared core content
│   ├── skills/                # 11 skill definitions, each in its own directory
│   ├── agents/                # 4 Sub-agent definitions
│   ├── templates/             # Document templates
│   ├── hooks/                 # Hook scripts (.sh/.bat/.ps1)
│   └── feedback/              # Feedback templates
├── adapters/
│   ├── claude-code/           # Claude Code adapter (.claude/)
│   ├── cursor/                # Cursor adapter (.cursor/rules/)
│   └── opencode/              # OpenCode adapter (.opencode/)
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

## License

MIT


