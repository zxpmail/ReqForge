---
type: feedback
description: dev-builder phase execution single pass often misses tasks, requiring 3+ verification iterations
created: 2026-05-17
updated: 2026-06-05
occurrences: 1
graduated: false
skipped: false
source_skill: dev-builder
failure_class: skill-defect
scores:
  precision: 2
  coverage: 2
  efficiency: 2
  satisfaction: 2
---

# dev-builder single pass verification insufficient

**Problem**: After dev-builder finishes executing a phase for the first time, it usually requires at least three or more verification passes to fully complete all tasks. A single pass through tasks frequently overlooks implementation details and misses incomplete tasks.

**Context**: During phase execution, the current workflow does one pass through tasks and considers the phase complete. However, users report that oversight means tasks are often missed, requiring multiple re-checks to catch everything.

**Lesson / Recommendation**: Add mandatory multi-pass verification (minimum 3 passes) or comprehensive checklist validation before marking a phase complete. Consider implementing a final "gap detection" pass that systematically verifies each task item against the DEV-PLAN checklist.
