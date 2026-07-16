# Skill Taxonomy: Three-Tier Classification

<!-- forge: v1.0 | purpose: define and govern the Workflow / Interactive / Component tier system for all Forge Skills -->

## Why

Skills serve different roles in the product-delivery pipeline. Some orchestrate multi-phase processes that produce code; others guide the user through a discovery conversation; still others generate a single artifact or run a focused audit.

A flat list obscures these differences. A three-tier taxonomy makes it immediately clear what each skill does, when to use it, and what output to expect — for both the human user and the dispatch system.

## The Three Tiers

```
┌───────────────────────────────────────────────────┐
│  Workflow                                          │
│  Multi-phase pipeline                              │
│  Orchestrates sub-processes                        │
│  Produces code, project structure, or deliverables │
│  Human time: hours–days                           │
├───────────────────────────────────────────────────┤
│  Interactive                                       │
│  Guided multi-turn conversation                    │
│  Asks questions → analyzes context → recommends    │
│  Produces decisions, briefs, or structured plans   │
│  Human time: minutes–hours                        │
├───────────────────────────────────────────────────┤
│  Component                                         │
│  Single discrete pass                              │
│  One artifact, template, or audit                  │
│  Usually deterministic or low-Latency              │
│  Human time: seconds–minutes                      │
└───────────────────────────────────────────────────┘
```

## Criteria

| Dimension | Workflow | Interactive | Component |
|-----------|----------|-------------|-----------|
| **Phases** | 2+ sequential phases with state | Variable turns, state light | 1 pass, stateless |
| **Orchestrates** | Sub-skills or sub-agents | Questions → analysis | Nothing (self-contained) |
| **Output** | Code, files, project structure | Document, decision, brief | Single artifact or report |
| **User involvement** | Low after kickoff (runs autonomously) | High (answers questions) | Minimal (one-shot request) |
| **Side effects** | File writes, DB changes, scaffolding | None (document-only) | None or single file |
| **Example** | dev-builder: 1→N build phases | product-spec-builder: Q&A → spec | feedback-writer: capture → file |

## Classification Table

| Skill | Tier | Rationale |
|-------|------|-----------|
| dev-builder | workflow | Multi-phase code generation pipeline; orchestrates implementer/test-writer sub-agents; produces full project structure |
| change-manager | workflow | Propose → Apply → Verify → Archive four-phase pipeline; produces code changes under `changes/` |
| release-builder | workflow | Build → Audit → Publish; produces deployable artifacts across channels |
| evolution-engine | workflow | Triages feedback → proposes → auto-generates Skills; Forge's self-evolution pipeline |
| reqforge-greenkeeper | workflow | Multi-step restore of ReqForge framework gates (discover → classify → fix → sync → verify) |
| product-spec-builder | interactive | Guided Socratic Q&A to elicit and refine requirements; produces Product-Spec.md as structured output |
| dev-planner | interactive | Transforms Spec → phased DEV-PLAN through analysis conversation; bridges requirements to execution |
| design-brief-builder | interactive | Interview on visual constraints and brand context to produce Design-Brief.md |
| domain-mapper | interactive | Guided multi-step research pipeline: scattershot domain info → structured Markdown database (domain-map.md); pauses at each step for user direction |
| bug-fixer | interactive | Systematic diagnostic conversation to identify root cause; then applies targeted fix |
| request-dispatcher | interactive | Analyzes ambiguous request + project state → recommends target Skill through conversational routing |
| skill-builder | interactive | Guided conversation to scaffold a new Skill; validates structure and fills compliance gaps |
| design-maker | component | Takes structured Design-Brief → generates mockups via external tool; single artifact pass |
| feedback-writer | component | Captures user correction → writes structured feedback entry; single deterministic write |
| code-review | component | Launches parallel specialized review agents; single audit pass producing a findings report |

## Deciding Tier for a New Skill

When creating a new Skill, ask:

1. **How many phases?** If 2+ distinct stages with sequential state → **workflow**. If one pass → **component**. If variable turns determined by user answers → **interactive**.

2. **What's the output?** Code/scaffolding → **workflow**. Decision/document → **interactive**. Single artifact → **component**.

3. **Who drives?** System orchestrates autonomously → **workflow**. System asks, user answers → **interactive**. User makes one request, system responds → **component**.

4. **Can it run unattended?** Yes (after kickoff) → **workflow**. No (needs user answers) → **interactive**. N/A (instant completion) → **component**.

## Enforcement

The `tier` field in `skill.json` is checked by `scripts/validate-skill.mjs`:

```
node scripts/validate-skill.mjs core/skills/<skill-name>
```

Valid values: `"workflow"`, `"interactive"`, `"component"`.

Invalid or missing tier → **ERROR** in validation (exit code 1).

## Related

- [skill-authoring-patterns.md](skill-authoring-patterns.md) — structural conventions for writing Skills
- [harness-maturity-checklist.md](harness-maturity-checklist.md) — broader maturity levels across the entire Forge harness
- [behavior-rules.md](behavior-rules.md) — Karpathy four principles that govern Skill execution
