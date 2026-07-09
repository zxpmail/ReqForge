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

### PreToolUse hooks
| Name | Trigger | Purpose |
|------|---------|---------|
| `hallucination-gate` | PreToolUse | **Spec-Before-Code** (`scripts/hooks/spec-before-code-gate.mjs`): app `Write`/`Edit` requires (1) `Product-Spec.md` (2) **§ Idea Stage Exit Criteria** filled (3) `.forge/spec-confirmed.json` (4) `DEV-PLAN.md` with **MVP Scope** (5) `.forge/plan-confirmed.json` (6) `.forge/implementer-session.json` for implementer only; then **Hallucination** path/parent-dir + package-ref checks. (Sloppiness/Overstepping are *not* in this chain — Sloppiness is enforced stop-time via `phase-exit-guard` + `forge-verify`; Overstepping is declared-but-not-enforced, see CLAUDE.md.) |

### SessionStart hooks
| Name | Trigger | Purpose |
|------|---------|---------|
| `check-evolution` | SessionStart | **Part 0**: inject `forge-bootstrap.md` iron laws. **Part 1**: if `feedback/FEEDBACK-INDEX.md` has entries → mandatory evolution-runner. **Part 2**: Product-Spec / DEV-PLAN / code state + routing (incl. HARD-GATE hints). Resolves bootstrap + feedback paths for Claude, Cursor, OpenCode, and `core/` framework repo. |

### Stop / phase hooks
> **Wired to the Claude Code `Stop` lifecycle event.** These gates emit `{"decision":"block"}` (exit 0) to prevent the agent from stopping. **Claude-Code-only for now:** opencode has no native `Stop` hook (open feature request), cursor's real schema is `hooks.json`/`onStop` (adapter rewrite needed), gemini-cli has no hooks. Do NOT add fake `Stop`/`BeforeCommand` wiring for those clients — see `.forge/deferred-ideas.md`.

| Name | Trigger | Purpose |
|------|---------|---------|
| `phase-exit-guard` | Stop | Block stop while `.forge/phase-exit-block` or `.forge/.verify-block` exists (Ralph-style Phase completion + forge-verify failures) |
| `stop-gate` | Stop | Block stop when code changed but not reviewed (reads `.claude/.needs-review`) |
| `retry-gate` | Stop | Block proceed when `.forge/.retry-counter.json` is `escalated` (max retries exceeded) |

### Composite hooks
| Name | Trigger | Delegates to |
|------|---------|----------------|
| `memory-guard` | PostToolUse | `context-compaction`, `check-handoff` |
