# feedback/ — Forge Feedback Records

## Purpose
Feedback files are the fuel for the Evolution Layer. They record failures, corrections, and improvement suggestions in structured format. The evolution-engine scans these files to detect patterns (3+ occurrences) and propose rule upgrades.

## Rules

### MUST
- Index file `FEEDBACK-INDEX.md` MUST list all feedback topics with occurrence counts
- Each feedback topic MUST use the `feedback-topic-template.md` format with frontmatter
- File names MUST be kebab-case describing the issue (e.g., `skip-verification-declaration.md`)
- `occurrences` field MUST be incremented when the same issue recurs

### MUST NOT
- Do NOT delete feedback files — they are the historical record for evolution
- Do NOT modify `graduated: false` to `true` manually — graduation is done by evolution-engine after proposing a rule upgrade
- Do NOT store debug logs or stack traces in feedback files — summarize the lesson, not the raw output
- Do NOT create feedback entries for user preferences — only for failures, corrections, and violations

### SHOULD
- Include `prompt_remediation` in frontmatter when a reusable prompt fragment can prevent recurrence
- Include `scores` when the feedback relates to a Skill execution (accuracy, coverage, efficiency, satisfaction)
- Archive graduated feedback to `feedback/archive/` after the evolution proposal is implemented
