---
description: Diagnose and fix ReqForge repository release gate failures
argument-hint: "[failing command or gate]"
---

# Command: /reqforge-greenkeeper

**Framework-repo only** (ReqForge itself — not a user product built with Forge).

| Phase | Commands | Acceptance |
|-------|----------|------------|
| Baseline | `pnpm sync:discover`, `pnpm test`, `pnpm forge-smoke` | Failing gate identified |
| Fix | Minimal edit to core source, smoke script, or test | Invariant restored without weakening gates |
| Sync | `pnpm sync` after core asset edits | Adapters match core |
| Verify | `pnpm sync:discover`, `pnpm validate-skill core/skills`, `pnpm test`, `pnpm forge-smoke` | All green |

**Full workflow → `SKILL.md` + `references/workflow.md`.**
