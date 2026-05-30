# Debugging Strategy（四阶段）

No stage-skipping allowed. CoT checklist → `cot-diagnostic-checklist.md`.

## Stage 1: Collect Evidence

- Read the full error message and stack trace
- Reproduce the bug (consistent vs intermittent)
- Check recent code changes (`git log --oneline -10`, `git diff`)
- Multi-component systems → identify layer (frontend / API / database / third party)
- Trace data flow from trigger to error point

## Stage 2: Analyze Patterns

- Find a similar feature that works; compare with broken one
- Understand dependencies (modules/data/state)
- If Product-Spec.md exists → confirm expected behavior

## Stage 3: Hypothesis Verification

- Execute `cot-diagnostic-checklist.md`
- Form 1–3 hypotheses ordered by likelihood
- Validate with minimal changes (logs, breakpoints)
- Validated → Stage 4; refuted → next hypothesis; all refuted → Stage 1
- If stuck → WebSearch

## Stage 4: Implement Fix

- Single fix (one logical point at a time)
- Compile verification (`tsc --noEmit` zero errors)
- Function verification (bug no longer reproduces)
- Regression verification (related features work)
- Fix fails → roll back, Stage 3; 3 consecutive failures → stop, re-examine architecture
