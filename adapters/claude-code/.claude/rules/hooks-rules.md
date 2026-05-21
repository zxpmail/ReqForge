---
description: Rules for editing Forge hook scripts
globs:
  - "core/hooks/**"
  - ".claude/hooks/**"
---

# Hooks Directory Rules

- Every hook MUST have both `.sh` and `.bat` versions with identical logic
- Hook scripts MUST exit with code 0 on success, non-zero on failure
- Hook scripts MUST produce structured output (plain text, one line per item)
- Hook names MUST be kebab-case (e.g., `pre-commit-check.sh`)
- Do NOT make hooks interactive — they run automatically and cannot prompt for user input
- Do NOT modify project code from hooks — hooks inspect and report, they do not change files
- Do NOT hardcode absolute paths — use relative paths from the project root
- Do NOT create long-running hooks — they block the AI agent's workflow
- Include a comment header explaining: trigger, purpose, and expected output format
- Keep hooks under 100 lines — complex logic belongs in `scripts/` at repo root
- Return actionable messages — "Compilation failed: src/utils.ts:12 — Type 'string' is not assignable to 'number'" not just "failed"
