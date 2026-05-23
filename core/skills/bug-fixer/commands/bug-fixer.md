---
description: Diagnose root cause and fix bugs through systematic debugging
argument-hint: [bug description]
---

# Command: /bug-fixer

Systematic debugging workflow. Full procedure in SKILL.md.

## Phase 1: Evidence Collection
**Goal**: Gather all information about the bug
- Reproduce the issue, capture error logs and stack traces
- Review recent code changes via git diff
- **Acceptance**: Clear understanding of symptoms and reproduction steps

## Phase 2: Root Cause Analysis
**Goal**: Generate and test hypotheses (max 3, ordered by likelihood)
- Formulate hypotheses based on evidence
- Test each hypothesis with minimal experiment
- **Acceptance**: Root cause identified with evidence

## Phase 3: Fix & Verify
**Goal**: Implement fix and confirm regression-free
- Fix one issue at a time
- Run existing tests, verify no regressions
- Dispatch code-reviewer if significant change
- **Acceptance**: Bug fixed, all tests pass, regression verified
