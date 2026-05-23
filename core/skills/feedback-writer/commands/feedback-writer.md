---
description: Record user corrections and execution failures as structured feedback
argument-hint: ""
---

# Command: /feedback-writer

Feedback recording workflow. Full procedure in SKILL.md. Invoked by feedback-observer sub-agent only.

## Phase 1: Signal Analysis
**Goal**: Determine if feedback is worth recording
- Receive context from feedback-observer (correction, failure, or assessment)
- Filter out general conversation unrelated to AI behavior
- **Acceptance**: Record/skip decision made with rationale

## Phase 2: Structured Write
**Goal**: Write feedback topic file and update index
- Use feedback-topic-template.md format with frontmatter
- Include prompt_remediation when a reusable prevention fragment exists
- Increment occurrences if topic already exists
- **Acceptance**: feedback/<topic>.md written, FEEDBACK-INDEX.md updated

## Phase 3: Skill Scoring (when applicable)
**Goal**: Attach capability scores for evolution fuel
- Score dimensions: accuracy, coverage, efficiency, satisfaction (when Skill execution related)
- **Acceptance**: Scores recorded or N/A noted
