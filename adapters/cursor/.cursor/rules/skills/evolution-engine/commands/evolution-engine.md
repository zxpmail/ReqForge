---
description: Scan feedback and generate evolution proposals for rule/skill upgrades
argument-hint: ""
---

# Command: /evolution-engine

Evolution scanning workflow. Full procedure in SKILL.md. Typically dispatched via evolution-runner sub-agent.

## Phase 1: Feedback Scan
**Goal**: Load and analyze accumulated feedback
- Read feedback/FEEDBACK-INDEX.md and topic files
- Cross-reference memory/ for repeated pitfalls (optional)
- **Acceptance**: All unscanned feedback entries processed

## Phase 2: Signal Detection
**Goal**: Identify evolution signals
- Rule graduation: same issue 3+ occurrences
- Skill optimization: consistently low Skill scores
- New Skill proposal: recurring pattern without Skill coverage
- **Acceptance**: Signals categorized with evidence counts

## Phase 3: Proposal Generation
**Goal**: Present evolution proposals to user
- Generate structured proposals per EVOLUTION.md levels
- User confirms/skips each proposal individually — no auto-apply
- **Acceptance**: Proposals delivered or "no evolution suggestions" returned
