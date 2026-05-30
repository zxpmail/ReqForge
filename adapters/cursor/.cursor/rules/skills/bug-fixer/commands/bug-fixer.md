---
description: Diagnose root cause and fix bugs through systematic debugging
argument-hint: [bug description]
---

# Command: /bug-fixer

Entry: describe the bug or pass code-review findings. **Full workflow → `references/workflow.md`**.

| Phase | Reference | Acceptance |
|-------|-----------|------------|
| Evidence | debugging-strategy § Stage 1 | Repro steps + logs clear |
| Root cause | cot-diagnostic + Stage 3 | Cause confirmed with evidence |
| Fix | workflow § Verification | Tests pass; re-review with `change_complexity=simple` unless large change |
