---
type: feedback
description: [One-line summary — for quick index scanning]
created: YYYY-MM-DD
updated: YYYY-MM-DD
occurrences: 1
graduated: false
source_skill: [skill-name or N/A]
failure_class: [skill-defect | execution-lapse | unset]   # Required when recording — routes evolution (see feedback-writer)
scores:                        # Optional — only fill after Skill execution
  accuracy: [1-5]
  coverage: [1-5]
  efficiency: [1-5]
  satisfaction: [1-5]
  evidence: "[One-sentence rationale per score]"
prompt_remediation: "[Optional — reusable prompt fragment to prevent this issue next time]"
---

# [Issue Title]

**Problem**: [What happened]

**Context**: [Under what circumstances it occurred]

**Lesson / Recommendation**: [What was learned, what to do differently]

**RED (for Skill TDD / evolution)**: [Without rule X, Agent did Y — one sentence]

**Prompt Remediation**: [Optional — a ready-to-use prompt or constraint that, when included in the Skill's invocation prompt, prevents this failure from recurring. E.g., "Before selecting a database, explicitly confirm: does the data need to survive a server restart?"]
