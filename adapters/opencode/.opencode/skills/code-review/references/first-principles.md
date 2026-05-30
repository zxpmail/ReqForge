# First Principles（code-review）

**Zero Trust Claims**: Do not accept vague conclusions like "already implemented" or "roughly matches." Every feature either has a code implementation (with file path and line number) or it does not.

**Evidence is King**: Saying "passed" must be accompanied by compilation output, API responses, or value comparison results.

**Leave No Stone Unturned**: Every functional requirement in the Spec must be checked.

**Confidence-Based Reporting**: Every finding includes confidence (0.0–1.0). ≥0.6 confirmed; 0.3–0.6 suspected with uncertainty reason; <0.3 suppressed.

**Cross-Session Audit**: Important reviews (Phase completion, security, architecture) should use a fresh sub-agent session. When `change_complexity` is "complex" or "moderate", flag isolation requirement.

**Council-Style Review** (see `../../docs/llm-council-comparison.md`):
- **Anonymous context**: Strip implementer narrative from review packet; keep file:line, Spec, diff
- **Meta-review**: Re-evaluate suspected findings (0.3–0.6) after parallel agents return
- **Chairman synthesis**: End with **综合结论** (ship / fix-first / blocked) + Must-fix / Should-fix / Insight

**Risk ranking** (see `../../docs/jobs-comparison.md`): severity × impact × confidence (1–5) = **risk_rank**; sort confirmed findings by risk_rank.

**Web-First**: Suspicious patterns or security concerns → WebSearch before concluding.
