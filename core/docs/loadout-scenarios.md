# Loadout Scenarios — Which Bundle When?

> **Loadouts are orthogonal bundles** — skills, agents, and hooks you can mix by copying files or switching hook sets. This doc maps **what you want to do** → **which built-in loadout** → **which Skills to invoke first**.
>
> Files: `core/loadouts/{full,web-app,cli-tool,minimal}.json` · apply hooks: `pnpm apply-loadout <name> <client>`

---

## Quick picker (30 seconds)

| You want to… | Use loadout | Start with |
|--------------|-------------|------------|
| Build a **new web app** end-to-end (spec → design → code → release) | **`web-app`** | `/product-spec-builder` → `/dev-planner` → `/dev-builder` |
| Add a **scoped feature** to an existing product (brownfield) | **`full`** or **`web-app`** | `/change-manager` propose → apply → verify |
| Build a **CLI or library** (no UI design skills) | **`cli-tool`** | `/product-spec-builder` → `/dev-planner` → `/dev-builder` |
| **Quick prototype** or small script (minimal process) | **`minimal`** | `/product-spec-builder` (Quick mode) → `/dev-builder` |
| **Fix a bug** only | Any (skills already copied) | `/bug-fixer` → `/code-review` |
| **Evolve Harness rules** from feedback | **`full`** (or any with evolution hooks) | fix issue → feedback recorded → `/evolution-engine` |
| **Create a new Skill** for Forge | **`full`** | `/skill-builder` |
| **Trim hook overhead** on a tiny repo | **`minimal`** + `pnpm apply-loadout minimal <client>` | same Skills, fewer hooks |

Full scenario tables below.

---

## Built-in loadouts at a glance

| Loadout | Skills | Hooks | Best for |
|---------|--------|-------|----------|
| **`full`** | 12 (all) | 10 | Complete toolchain · brownfield · skill-builder · evolution |
| **`web-app`** | 11 (no skill-builder) | 10 | Web products with design + Context7/Figma/Playwright MCP hints |
| **`cli-tool`** | 8 (no design*, no change-manager) | 10 | CLIs, libraries, backend tools |
| **`minimal`** | 5 | 7 | Spikes, scripts, learning Forge |

\*Design skills omitted in `cli-tool`; add `design-brief-builder` manually if needed.

---

## Scenario matrix

### Greenfield (0 → 1)

| Scenario | Loadout | Skill path | Skip |
|----------|---------|------------|------|
| New **web** product | `web-app` | spec → design-brief → design-maker (optional) → plan → build → review → release | — |
| New **CLI / API / lib** | `cli-tool` | spec → plan → build → review → release | design-maker |
| **Hackathon / spike** | `minimal` | spec (Quick) → build → review | plan, change-manager, release (optional) |
| **Full control** (incl. skill-builder) | `full` | same as web-app + skill-builder available | — |

### Brownfield (existing code)

| Scenario | Loadout | Skill path | Note |
|----------|---------|------------|------|
| **One new feature** in existing app | `full` or `web-app` | `/change-manager` → dev-builder Phase | **`cli-tool` and `minimal` omit change-manager** — copy skill or switch loadout |
| **Major spec rewrite** | `full` | edit `Product-Spec.md` directly or re-run product-spec-builder (iteration mode) | Do not use `changes/` for whole-spec edits |
| **Bug in production** | any | `/bug-fixer` | loadout choice irrelevant |

### Operations & meta

| Scenario | Loadout | Skill path |
|----------|---------|------------|
| **Ship** v1 | `web-app` / `cli-tool` / `full` | `/release-builder` |
| **Code review** before merge | any | `/code-review` (simple default; parallel when complex) |
| **Feedback → rule upgrade** | `full` or `web-app` | failure/correction → feedback-observer → `/evolution-engine` |
| **New Forge Skill** | `full` only | `/skill-builder` |

---

## Orthogonal composition (mix without a new loadout)

Loadouts describe **recommended sets**, not hard limits. All 12 skills are copied into adapters by default (`full`-equivalent install).

| Need | Start from | Add |
|------|------------|-----|
| CLI project + brownfield | `cli-tool` hooks | Copy `change-manager` from `core/skills/` **or** `pnpm apply-loadout web-app` for hooks only |
| Minimal hooks + change workflow | `minimal` hooks | Manually copy `change-manager` skill |
| Web app without design MCP noise | `web-app` | Ignore optional MCP block in JSON |
| Everything except design | `full` | Simply don't invoke design-* skills |

**Principle:** Skills are **what you invoke**; loadouts are **what you enable by default** (especially hooks and documented intent).

---

## Hooks: why loadout matters

Default adapter install ≈ **`full` hooks (10)**. Lighter loadouts mainly differ by **hook count**:

| Loadout | Hooks | Omitted vs full |
|---------|-------|-----------------|
| `full` / `web-app` / `cli-tool` | 10 | — |
| `minimal` | 7 | `mark-review-needed`, `check-evolution`, `memory-guard` |

Run `pnpm apply-loadout minimal claude-code` (or `cursor` / `opencode`) to merge a lighter hook set into `settings.json`. Skills remain on disk regardless.

---

## Decision flow

```text
Existing Product-Spec + adding one feature?
  yes → full or web-app → /change-manager
  no  ↓
Need UI design skills (Design-Brief / mockups)?
  yes → web-app
  no  ↓
Need dev-planner + release + evolution?
  yes → cli-tool (CLI) or full (everything)
  no  → minimal (spike / script)
```

---

## Related

- [file-structure.md](./file-structure.md) — `core/loadouts/` layout
- [harness-maturity-checklist.md](./harness-maturity-checklist.md) — P0 validation including `pnpm forge-smoke`
- README **Step 3b — Loadouts** — install and `apply-loadout`
