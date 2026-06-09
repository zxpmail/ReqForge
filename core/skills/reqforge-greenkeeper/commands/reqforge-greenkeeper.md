---
description: Diagnose and fix ReqForge repository release gate failures
argument-hint: [failing command or gate]
---

# Command: /reqforge-greenkeeper

Use this only inside the ReqForge repository.

| Phase | Commands | Acceptance |
|-------|----------|------------|
| Baseline | `pnpm sync:discover`, `pnpm test`, `pnpm forge-smoke` | Failing gate identified |
| Fix | Minimal edit to source, tests, or smoke script | Invariant restored without weakening gates |
| Sync | `pnpm sync` after core asset edits | Adapters match core |
| Verify | `pnpm sync:discover`, `pnpm test`, `pnpm forge-smoke` | All green |
