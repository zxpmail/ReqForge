---
description: Generate or update DEV-PLAN.md with phased development plan from Product-Spec.md
argument-hint: [scope: full|iteration]
---

# Command: /dev-planner

Entry: `/dev-planner` or `[scope: iteration]`. **必须先 Read `references/workflow.md`** 对应模式章节。

| Mode | SKILL.md | Output |
|------|----------|--------|
| Generation | Main workflow | `DEV-PLAN.md` |
| Iteration | `[Workflow (Iteration Mode)]` | Updated plan; `changes/.../tasks.md` only via change-manager apply |
