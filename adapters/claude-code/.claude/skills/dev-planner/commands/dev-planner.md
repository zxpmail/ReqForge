---
description: Generate or update DEV-PLAN.md with phased development plan from Product-Spec.md
argument-hint: [scope: full|iteration]
---

# Command: /dev-planner

Entry: `/dev-planner` or `[scope: iteration]`. **Full workflow → `SKILL.md`** (generation vs iteration mode).

| Mode | SKILL.md | Output |
|------|----------|--------|
| Generation | Main workflow | `DEV-PLAN.md` |
| Iteration | `[Workflow (Iteration Mode)]` | Updated plan; `changes/.../tasks.md` only via change-manager apply |
