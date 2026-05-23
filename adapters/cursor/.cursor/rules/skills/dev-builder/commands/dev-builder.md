---
description: Build project code for the current DEV-PLAN phase
argument-hint: [phase-number]
---

# Command: /dev-builder

Entry: `/dev-builder` (one Phase per invocation). **Full workflow → `SKILL.md`.**

| Phase | SKILL.md | Acceptance |
|-------|----------|------------|
| Setup | First-phase scaffold | Project compiles |
| Tasks | TDD loop per Task | code-review → fix → commit |
| Verify | Phase assessment | Four-step verification + memory update |

**Review default**: dispatch code-reviewer with `change_complexity=simple` unless multi-module / API / security / high dep-graph risk.
