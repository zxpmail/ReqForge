# Agent Harness Maturity Checklist

> Self-assessment for projects using ReqForge (or any agent harness). Inspired by industry “production harness” frameworks (orchestration, memory, guardrails, validation).  
> ReqForge maps each item to built-in skills, hooks, or docs — use this before claiming “harness-ready” for a release.

---

## How to use

1. Score each row: **Yes** / **Partial** / **No** / **N/A**
2. Any **No** on P0 rows → fix before shipping
3. **Partial** → document in `Product-Spec.md` or `memory/decisions-log.md` with owner and follow-up

---

## P0 — Must have for shippable software

| # | Component | What “good” looks like | ReqForge built-in |
|---|-----------|------------------------|-------------------|
| 1 | **Orchestration loop** | Clear phases: spec → plan → build → review; no random skipping | `CLAUDE.md` mission, 12 skills workflow |
| 2 | **Tool / path guardrails** | Agent cannot write to non-existent dirs; destructive ops gated | `hallucination-gate`, `pre-commit-check` hooks |
| 3 | **Context management** | Long sessions compact or hand off without silent loss | `memory-guard`, `memory/` 3-tier, `context-compaction` |
| 4 | **State persistence** | Decisions and task progress survive sessions | `memory/project-memory.md`, `task-history.md`, `decisions-log.md` |
| 5 | **Validation loop** | Tests, lint, or typecheck before “done” | `dev-builder` TDD, `pre-commit-check`, Sloppiness Gate in `CLAUDE.md` |
| 6 | **Error → rule** | Same mistake not repeated blindly | `feedback/` + `evolution-engine` (proposals include predicted effect + verify-by), `detect-feedback-signal` |
| 6b | **Phase exit guard** | Agent cannot stop while Phase acceptance open | `phase-exit-guard` + `.forge/phase-exit-block` — see [agent-harness-seven-layer-map.md](./agent-harness-seven-layer-map.md) |

---

## P1 — Strong harness (recommended)

| # | Component | What “good” looks like | ReqForge built-in |
|---|-----------|------------------------|-------------------|
| 7 | **Requirements artifact** | Single source of truth for scope | `Product-Spec.md` via `product-spec-builder` |
| 8 | **Scoped change path** | Brownfield features don’t corrupt full spec | `/change-manager` + `changes/<name>/` |
| 9 | **Code review harness** | Review proportional to risk | `code-review` (simple default; parallel 4-agent when complex) |
| 10 | **Sub-agent isolation** | Heavy work in fresh context | `implementer`, `planner`, specialist reviewers |
| 11 | **Integrations & ops in spec** | Webhooks, notifications, jobs declared upfront | `Product-Spec` § Integrations, Operations & Scheduling |
| 12 | **Release boundary** | Deploy/build steps explicit | `release-builder` skill |

---

## P2 — Optional / product-dependent

| # | Component | What “good” looks like | ReqForge / you |
|---|-----------|------------------------|----------------|
| 13 | **Human approval gates** | Sensitive tool calls need confirm | Custom hooks or client settings; not default |
| 14 | **Scheduled / background work** | Jobs run after chat ends | **Not in ReqForge** — document in Spec; implement in app (cron, queue) |
| 15 | **Multi-channel inbox** | Slack / email as agent entry | **Not in ReqForge** — use OpenClaw-class products for that |
| 16 | **Live execution UI** | Progress bar, screen replay | **Not in ReqForge** — use CI logs, `changes/*/verify` checklist |

---

## ReqForge positioning (vs consumer harness products)

| Dimension | Consumer harness (e.g. scheduled life automation) | ReqForge |
|-----------|---------------------------------------------------|----------|
| Primary output | Recurring tasks, messages, integrations | **Shippable product**: spec, code, release |
| Runs after chat closes | Core value | Out of scope; app/runtime owns schedules |
| User | Non-technical “one sentence” | Founders, PMs, indie devs (Quick Mode lowers entry) |
| Moat | Integrations + scheduling + UX | Skills + hooks + memory + evolution + verifiable delivery |

**Analogy**: Model = CPU; context = RAM; **Harness = OS**. ReqForge is an OS for **building software**, not for replacing your calendar or inbox.

---

## Quick scorecard

| Tier | Rule of thumb |
|------|----------------|
| **L1 — Chat wrapper** | Only prompts; no Spec, no tests, no hooks |
| **L2 — ReqForge baseline** | P0 all Yes; Product-Spec + DEV-PLAN exist |
| **L3 — Production-minded** | P0 + P1 Yes; change-manager for brownfield |
| **L4 — Custom harness** | P2 items designed in Spec and implemented in app code |

---

## Related docs

- [openspec-comparison.md](./openspec-comparison.md) — scoped changes
- [superpowers-comparison.md](./superpowers-comparison.md) — engineering discipline
- [context7-comparison.md](./context7-comparison.md) — library docs injection (optional MCP partner)
- [agent-harness-seven-layer-map.md](./agent-harness-seven-layer-map.md) — AGENT魔方七层 ↔ ReqForge
- [skill-evolution-comparison.md](./skill-evolution-comparison.md) — EmbodiSkill / SkillEvolver ↔ ReqForge（P1/P2 暂缓）
- [memory-system.md](./memory-system.md) — three-tier memory
- [behavior-boundaries.md](./behavior-boundaries.md) — what Forge must not do
