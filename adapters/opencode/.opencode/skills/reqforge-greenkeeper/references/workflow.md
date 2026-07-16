# Workflow — reqforge-greenkeeper

## Step 1: Baseline

From ReqForge repo root:

```bash
git status --short
pnpm install          # if node_modules missing
pnpm sync:discover
pnpm test
pnpm forge-smoke
```

Record the **first** failing gate name and assertion text.

## Step 2: Classify

| Failure class | Likely locus | Fix pattern |
|---------------|--------------|-------------|
| Adapter drift (`sync:discover`) | Edited `core/` without sync | Fix core if needed → `pnpm sync` |
| `skill-fixtures` | Fixture YAML vs SKILL/references | Unquote search / include filenames; or add missing anchor in **core** Skill |
| `skills-complete` / `adapters-sync` count | New/removed Skill | Update expected count **only** with intentional Skill; ensure `SKILL.md` + `skill.json` + `commands/*.md` |
| `skill-bypass` | Slash command not in `CLAUDE.md` Dispatch | Add `/skill-name` line to CLAUDE.md stable zone |
| `loadouts-valid` | Loadout JSON refs missing skill/agent/hook | Update `core/loadouts/*.json` (greenkeeper → `full` only) |
| `validate-skill` / argument-hint | Bare YAML array or missing hint | Quote `argument-hint: "[...]"` or `""` |
| `machine-gates-doc` | CLAUDE Overstepping honesty | Procedural vs hook-level deferred both required |
| `test-demo-golden-path` / todo-cli | Shared `todo.json` / cwd races | Isolated cwd or `fileParallelism: false` |
| `package-integrity` | Dead script path in `package.json` | Point to real file or remove script |
| Compile / typecheck | `scripts/lib/compile-check.mjs` chain | Fix source or `dev-map` / package script |

## Step 3: Minimal fix

1. Prefer deterministic script fixes over weakening assertions.
2. Preserve hard gates and fixture expectations.
3. After any `core/skills|hooks|agents|templates|loadouts` or root `CLAUDE.md` change → `pnpm sync`.
4. If Skill count changes → update `skills-complete.mjs`, `adapters-sync.mjs`, `loadout-scenarios.md`, README/wiki/`llms.txt` Skill counts together.

## Step 4: Verify

```bash
pnpm sync:discover    # 0 drifted · 0 orphan · 0 missing
pnpm validate-skill core/skills
pnpm test
pnpm forge-smoke      # expect 15/15 (or current SMOKES length in lib.mjs)
git diff --stat       # no unrelated churn
```

## Step 5: Report

- Root cause by gate
- Files changed (core vs generated adapters)
- Pass counts
- Residual stderr that is expected (e.g. todo-cli corruption tests)
