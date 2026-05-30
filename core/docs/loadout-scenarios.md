# Loadout Scenarios — Which Bundle When?

> **Scope**: User/maintainer **selection guide** — not Harness architecture. The loadout **mechanism** (JSON bundles, hooks) is Phase 11 / `core/loadouts/`.
> Files: `core/loadouts/{full,web-app,lite,cli-tool,minimal}.json` · install filtered bundle: `pnpm forge-install <client> --loadout <name>` · merge hooks only (maintainers): `pnpm apply-loadout <name> <client>`

**Loadouts are orthogonal bundles** — skills, agents, and hooks you can mix by copying files or switching hook sets. This doc maps **what you want to do** → **which built-in loadout** → **which Skills to invoke first**.

---

## Quick picker (30 seconds)

| You want to… | Use loadout | Start with |
|--------------|-------------|------------|
| Build a **new web app** end-to-end (spec → design → code → release) | **`web-app`** | `/product-spec-builder` → `/dev-planner` → `/dev-builder` |
| Add a **scoped feature** to an existing product (brownfield) | **`full`** or **`web-app`** | `/change-manager` propose → apply → verify |
| Build a **CLI or library** (no UI design skills) | **`cli-tool`** | `/product-spec-builder` → `/dev-planner` → `/dev-builder` |
| **Greenfield / brownfield dev, token-conscious** (no design/release) | **`lite`** | spec → plan → build → review; brownfield via change-manager |
| **Quick prototype** or small script (minimal process) | **`minimal`** | `/product-spec-builder` (Quick mode) → `/dev-builder` |
| **Fix a bug** only | Any (skills already copied) | `/bug-fixer` → `/code-review` |
| **Evolve Harness rules** from feedback | **`full`** or **`web-app`** | fix issue → feedback recorded → `/evolution-engine` |
| **Create a new Skill** for Forge | **`full`** | `/skill-builder` |
| **Trim hook overhead** on a tiny repo | **`minimal`** + `pnpm apply-loadout minimal <client>` | same Skills, fewer hooks |

Full scenario tables below.

---

## Built-in loadouts at a glance

| Loadout | Skills | Hooks | Best for |
|---------|--------|-------|----------|
| **`full`** | 12 (all) | 10 | Complete toolchain · brownfield · skill-builder · evolution |
| **`web-app`** | 11 (no skill-builder) | 10 | Web products with design + Context7/Figma/Playwright MCP hints |
| **`lite`** | 8 | 8 | Spec→Plan→Build→Review · change-manager · **no design/release/evolution/skill-builder** |
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
| **Standard app (no design skill install)** | `lite` | spec → plan → build → review | design-maker, release-builder, evolution |
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

Loadouts describe **recommended sets**, not hard limits.

- **Default** `pnpm forge-install` copies **all** skills/agents (≈ `full`).
- **`--loadout <name>`** copies **only** that loadout’s skills/agents (+ `_shared`); hooks merged from the same loadout. See `.forge/loadout-active.json` after install.

| Need | Start from | Add |
|------|------------|-----|
| CLI project + brownfield | `cli-tool --loadout` or full install | Copy `change-manager` from `core/skills/` **or** `pnpm forge-install … --loadout web-app` |
| Minimal hooks + change workflow | `minimal --loadout` | Manually copy `change-manager` skill or reinstall with `web-app` |
| Web app without design MCP noise | `web-app --loadout` | Ignore optional MCP block in JSON |
| Everything except design | `full` install | Simply don't invoke design-* skills |

**Principle:** Skills are **what you invoke**; loadouts are **what you enable by default** (especially hooks and documented intent).

---

## Hooks: why loadout matters

Default adapter install ≈ **`full` hooks (10)**. Lighter loadouts mainly differ by **hook count**:

| Loadout | Hooks | Omitted vs full |
|---------|-------|-----------------|
| `full` / `web-app` / `cli-tool` | 10 | — |
| `minimal` | 7 | `mark-review-needed`, `check-evolution`, `memory-guard` |

Run `pnpm apply-loadout minimal claude-code` (or `cursor` / `opencode`) to merge a lighter hook set into adapter `settings.json` (maintainers, from Forge clone).

**End users:** `pnpm forge-install <client> --loadout minimal --target <dir>` installs **only** that loadout’s skills/agents and applies its hooks in one step.

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
- [platform-compliance.md](./platform-compliance.md) — GitHub Actions policy (no cron)
- README **Step 3b — Loadouts** — install and `apply-loadout`
