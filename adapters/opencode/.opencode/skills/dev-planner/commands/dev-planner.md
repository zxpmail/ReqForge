---
description: Generate or update DEV-PLAN.md with phased development plan from Product-Spec.md
argument-hint: [scope: full|iteration]
---

# Command: /dev-planner

Development planning workflow. Full procedure in SKILL.md.

## Phase 1: Analysis
**Goal**: Understand spec scope and decompose into phases
- Read Product-Spec.md, extract functional requirements
- WebSearch to validate technology choices
- Identify file structure, data model, dependencies
- **Acceptance**: Tech stack confirmed, phase boundaries identified

## Phase 2: Plan Generation
**Goal**: Write DEV-PLAN.md with phase breakdown
- Each phase has deliverables, key files, and acceptance criteria
- Dependency chain: later phases depend on earlier ones
- For iterations: update existing plan, keep completed phases marked
- **Acceptance**: DEV-PLAN.md written, user approves plan
