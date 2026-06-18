# Progressive Disclosure Experiment Results

**Date**: 2026-06-18

## Metrics

| Metric | Group A (full disclosure) | Group B (SKILL.md only) | Delta |
|--------|--------------------------|-------------------------|-------|
| Total findings | 10 | 13 | B +3 |
| Evidence-backed findings | **10** | **0** | A +10 |
| Evidence markers | 27 | 32 | similar |
| Fake critique phrases | 0 | 0 | same |
| Verdict | blocked | clarify | A stricter |
| Critique-of-critique level | **rigorous** | **low-critique** | A higher |
| Quota met (3+ evidence-backed) | YES | NO | A passes, B fails |

## Key Finding

**The critical difference is in Evidence column formatting.**

- Group A produced Evidence in the exact schema format: `§架构决定: "..."` — matching the table format from critique-gate.md
- Group B produced Evidence as free-text descriptions: `架构决定："用户在前端输入 API Key → 直接调用 LLM API"；未解决假设 #1：...` — detailed but not in the `§section or "spec quote"` format

The `findingsWithEvidence` regex in forge-spec-critique.mjs looks for `§` in the finding row. Group B's evidence is substantive (arguably even more detailed) but doesn't use the `§` citation format because it was never told to use that format.

## Interpretation

### What the data actually shows:

1. **Finding count**: Group B produced MORE findings (13 vs 10). The SKILL.md summary alone was enough to trigger the right categories.
2. **Substance**: Group B's findings are arguably more detailed — CD5 (chapter-level granularity) and CA5 (non-linear writing) are insights Group A missed.
3. **Format compliance**: Group A followed the §-citation schema; Group B did not. This is a format difference, not a substance difference.
4. **Verdict severity**: Group A said "blocked"; Group B said "clarify". Group A was stricter, but this may reflect the blocked/clarify/blocked template in the full procedure rather than deeper analysis.

### What this means for progressive disclosure:

**The hypothesis is NOT confirmed.** SKILL.md-only produced more findings and equally substantive analysis. The difference is:
- **Format compliance**: Full procedure teaches the §-citation format. Without it, the model still provides evidence but in free-text.
- **Verdict calibration**: Full procedure gives clearer blocked/clarify thresholds. Without it, the model defaults to the less confrontational "clarify."

### Actionable conclusions:

1. **Format rules should be in SKILL.md, not references/**. The `§section or "spec quote"` format is a 1-line instruction that could be in SKILL.md instead of requiring the full critique-gate.md to be read.
2. **Verdict calibration needs the reference file**. The distinction between "blocked" and "clarify" requires understanding the stop rules, which are only in critique-gate.md.
3. **Substantive critique quality does NOT depend on reading references/**. The model can identify the right signals from the SKILL.md summary alone.

### Revised recommendation:

Move the following from references/ to SKILL.md inline:
- Evidence format rule (1 line): "Every finding must cite Evidence as §section or 'spec quote'"
- Verdict thresholds (3 lines): "0 findings → re-scan mandatory; <3 evidence-backed → re-scan once; ≥3 → proceed"

Keep the full procedure (signal tables, density check, stop rules) in references/ for when the critique gate phase is actually reached.
