# Three-Tier Memory System

Project memory is version-controlled markdown in the `memory/` directory, shared across sessions and team members.

## Loading (mandatory at session start)
- `memory/project-memory.md` — Architecture facts, constraints, known pitfalls (permanent)
- `memory/decisions-log.md` — ADR-format decision records (permanent)
- `memory/task-history.md` — Recent task summaries, max 30 entries (rolling)

## Writing (after every completed Task)
- `task-history.md` — ALWAYS append after Task completion (date, phase, type, description, changed files, notes)
- `decisions-log.md` — Append when a significant technical decision was made during the Task
- `project-memory.md` — Update when architecture facts, constraints, or pitfalls change

## Non-Negotiable Layer (human-owned, model read-only)
- `memory/sot-registry.md` — SoT registry: authoritative implementation (`canonical`) + semantic contract (`contract`) + fingerprint (`signal`) per business concept. Force-loaded at every forge-loop start; query it before writing any new function — reuse the canonical implementation or write down "why it doesn't satisfy" for the human. Entries change only via human-approved PR (the model may only propose). Validated by `pnpm forge-sot-check`: entry shape, canonical existence, 180-day staleness, duplicate-implementation scan (human-approved exceptions live in `.forge/sot-exceptions.json` with `approvedBy`). Template: `core/templates/memory/sot-registry-template.md`.
- `.forge/acceptance-readonly.json` (project root, not memory/) — paths of human-owned acceptance/contract assertions. The model implements to satisfy them and never edits them; `forge-verify acceptance-readonly` + the forge-loop non-negotiable check enforce it. Template: `core/templates/acceptance-readonly.template.json`.

Both are independent of any single Spec revision or Loop iteration: they outlive iterations, and only a human changes them.

## Initialization
When `memory/` directory does not exist, create it from templates during first `/dev-builder` invocation. Fill `project-memory.md` from Product-Spec.md and DEV-PLAN.md tech stack info. Record initial setup as ADR-000 in `decisions-log.md`.

## Memory vs Feedback
- Memory (`memory/`) = "what we know and decided" — context preservation across sessions
- Feedback (`.claude/feedback/`) = "what went wrong and how to improve" — evolution fuel for Skills

## Optional external memory backends

Forge defaults to project-scoped Markdown in `memory/`. Some teams also use a **cross-tool personal memory** layer (e.g. [OpenHuman](https://github.com/tinyhumansai/openhuman) Memory Tree, or [agentmemory](https://github.com/rohitg00/agentmemory) as documented by OpenHuman).

| Layer | Typical store | Authority |
|-------|---------------|-----------|
| Product truth | `Product-Spec.md`, `changes/*/specs.md` | Requirements and acceptance criteria |
| Project memory | `memory/*.md` | Architecture, ADRs, recent tasks |
| Personal / cross-project (optional) | agentmemory, OpenHuman vault, etc. | Preferences, long-lived context |

**Rules when combining:**

1. **Spec wins** — external memory must not override acceptance criteria in Product-Spec or active `changes/`.
2. **Write boundaries** — dev-builder updates `memory/` after Tasks; do not mirror full Spec into external stores.
3. **No secret leakage** — credentials and tokens stay in env/config, never in memory files or external backends.
4. **Compression** — if summarizing tool output before it enters the model (OpenHuman-style TokenJuice or optional [RTK](https://github.com/rtk-ai/rtk)), preserve paths, stack traces, and requirement IDs. See [openhuman-comparison.md](./openhuman-comparison.md), [rtk-comparison.md](./rtk-comparison.md).

Forge does not ship SQLite, Obsidian sync, or OAuth auto-fetch — document integration in your Product-Spec or `changes/<name>/design.md` if the product needs them.

## LLM Wiki pattern (gist) ↔ Forge memory

Karpathy's [LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) describes **raw → compiled wiki → schema** with **ingest / query / lint**. Forge maps this to product delivery with **harder Spec authority**:

| Wiki layer | Forge |
|------------|-------|
| raw (immutable) | `feedback/`, git history, user-provided sources |
| wiki (LLM-maintained) | `memory/*.md`, `PROJECT-HEALTH.md` — **not** auto-rewritten Product-Spec |
| schema | `CLAUDE.md` / `AGENTS.md`, Skills, hooks |

**Query filing rule:** Important explorations (trade-offs, comparisons, lint findings) → append **ADR** to `memory/decisions-log.md` or update `project-memory.md`. Do **not** rely on chat history alone. Spec changes → `/change-manager` or user-approved `/product-spec-builder`, not dev-builder wiki-style edits.

Full mapping: [llm-wiki-comparison.md](./llm-wiki-comparison.md).