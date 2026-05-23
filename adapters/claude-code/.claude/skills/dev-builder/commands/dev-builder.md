---
description: Build project code for the current DEV-PLAN phase
argument-hint: [phase-number]
---

# Command: /dev-builder

Phase-by-phase code implementation workflow. Full procedure in SKILL.md.

## Phase 1: Setup
**Goal**: Initialize project skeleton if first phase
- Scaffold project structure per DEV-PLAN
- Install dependencies, configure tooling
- **Acceptance**: Project compiles and runs (hello-world level)

## Phase 2: Implementation
**Goal**: Implement each task in the phase via TDD (RED-GREEN-REFACTOR)
- For each task: plan → implement → test → review → commit
- Use implementer sub-agent for coding, test-writer for tests
- **Acceptance**: All tasks in phase complete, code compiles

## Phase 3: Verification
**Goal**: Verify phase deliverables against acceptance criteria
- Four-step check: Code Review → Test Completeness → Compile Verify → Functional Test
- Update memory files (task-history.md, decisions-log.md)
- **Acceptance**: All four steps pass, user confirms phase complete
