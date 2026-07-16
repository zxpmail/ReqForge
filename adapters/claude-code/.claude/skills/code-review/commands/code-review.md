---
description: Run parallel specialized review agents and produce aggregated quality report
argument-hint: "[scope: all|phase|task]"
---

# Command: /code-review

Entry: `/code-review`. **Full workflow → `references/workflow.md` (Step 1–5, sole source).**

| Step | Reference | Note |
|------|-----------|------|
| 1 Baseline | workflow Step 1 | Spec + DEV-PLAN + dev-map/code-standards + DESIGN (if UI) |
| 2–4 Review | workflow Step 2–4 | **Default `change_complexity=simple`** → skip Step 2; still Scan→Aggregate. Mode A dispatch if moderate/complex |
| 5 Report | workflow Step 5 | confidence **1–5** (≥4 confirmed, =3 suspected); Priority derived from Must/Should/Insight |

Pass `change_complexity` explicitly to escalate parallel review.
