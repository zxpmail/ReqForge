---
description: Run parallel specialized review agents and produce aggregated quality report
argument-hint: "[scope: all|phase|task]"
---

# Command: /code-review

Parallel multi-agent code review workflow. Full procedure in SKILL.md.

## Phase 1: Scope & Baseline
**Goal**: Determine review scope and load baselines
- Read Product-Spec.md for feature requirements
- Read DEV-PLAN.md for deliverable checklist
- Determine scope: all features / current phase / current task
- **Acceptance**: Scope defined, baseline documents loaded

## Phase 2: Parallel Agent Review
**Goal**: Run 4 specialized agents concurrently
- **code-reviewer-design**: Spec compliance, architecture consistency, pattern drift
- **code-reviewer-bug**: Bug patterns, null pointers, race conditions, resource leaks
- **code-reviewer-security**: OWASP Top 10, credential leaks, injection, XSS
- **code-reviewer-types**: Type safety, nullability, `any`/`@ts-ignore`, edge cases
- **Acceptance**: All agents return structured findings with confidence scores

## Phase 3: Aggregation & Report
**Goal**: Merge findings, filter by confidence, produce unified report
- Confidence ≥ 0.6 → include as confirmed finding
- Confidence 0.3–0.6 → downgrade to "suspected"
- Confidence < 0.3 → suppress
- Deduplicate overlapping findings (same file + line range)
- **Acceptance**: Unified review report delivered with per-agent attribution
