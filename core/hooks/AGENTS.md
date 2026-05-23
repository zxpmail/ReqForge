# hooks/ — Forge Hook Scripts

## Purpose
Hook scripts are the Inspection Layer — they fire automatically at critical nodes to enforce rules without relying on AI self-awareness. Every hook must have both `.sh` (macOS/Linux) and `.bat` (Windows) versions.

## Rules

### MUST
- Every hook MUST have both `.sh` and `.bat` versions with identical logic
- Hook scripts MUST exit with code 0 on success, non-zero on failure
- Hook scripts MUST produce structured output (plain text, one line per item)
- Hook names MUST be kebab-case (e.g., `pre-commit-check.sh`)

### MUST NOT
- Do NOT make hooks interactive — they run automatically and cannot prompt for user input
- Do NOT modify project code from hooks — hooks inspect and report, they do not change files
- Do NOT hardcode absolute paths — use relative paths from the project root
- Do NOT create long-running hooks — they block the AI agent's workflow

### SHOULD
- Include a comment header explaining: trigger, purpose, and expected output format
- Keep hooks under 100 lines — complex logic belongs in `scripts/` at repo root
- Return actionable messages — "Compilation failed: src/utils.ts:12 — Type 'string' is not assignable to 'number'" not just "failed"
- Prefer composite hooks (`memory-guard`) in loadouts when multiple scripts share the same trigger — delegate to legacy scripts inside the composite

### Stop / phase hooks
| Name | Trigger | Purpose |
|------|---------|---------|
| `phase-exit-guard` | BeforeCommand | Block stop while `.forge/phase-exit-block` exists (Ralph-style Phase completion) |
| `stop-gate` | BeforeCommand | Block stop when code changed but not reviewed |
| `retry-gate` | BeforeCommand | Block proceed when `.forge/.retry-counter.json` is `escalated` (max retries exceeded) |

### Composite hooks
| Name | Trigger | Delegates to |
|------|---------|----------------|
| `memory-guard` | PostToolUse | `context-compaction`, `check-handoff` |
