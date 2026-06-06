---
description: Run parallel specialized review agents and produce aggregated quality report
argument-hint: "[scope: all|phase|task]"
---

# Command: /code-review

Entry: `/code-review`. **Full workflow → `references/workflow.md`.**

| Step | Reference | Note |
|------|-----------|------|
| Baseline | workflow Step 1 | Spec + DEV-PLAN + design assets |
| Review | workflow Step 2–4 | **Default `change_complexity=simple`**; 4 agents only if moderate/complex |
| Report | first-principles + workflow | ≥0.6 confirmed, 0.3–0.6 suspected |

Pass `change_complexity` explicitly to escalate parallel review.
