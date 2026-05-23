---
description: Run parallel specialized review agents and produce aggregated quality report
argument-hint: "[scope: all|phase|task]"
---

# Command: /code-review

Entry: `/code-review`. **Full workflow → `SKILL.md`.**

| Step | SKILL.md | Note |
|------|----------|------|
| Baseline | [Step 1] | Spec + DEV-PLAN + design assets |
| Review | [Step 2–4] | **Default `change_complexity=simple`**; 4 agents only if moderate/complex |
| Report | Aggregation rules | ≥0.6 confirmed, 0.3–0.6 suspected |

Pass `change_complexity` explicitly to escalate parallel review.
