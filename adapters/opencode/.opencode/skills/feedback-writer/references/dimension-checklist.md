# Feedback Observation Dimension Checklist

[Dimension Checklist]

## Signal Types

Only record when a signal is actually observed. Better to miss than to over-record.

| # | Signal Type | Trigger | Action |
|---|-------------|---------|--------|
| 1 | **User Correction** | User corrects AI behavior ("that's not right", "don't do that") | Tag the corrected Skill and specific behavior |
| 2 | **Uncovered Scenario** | Skill encounters situation its guidance doesn't cover; AI improvises or skips steps | Tag which Skill is missing what |
| 3 | **Repetitive Operation** | >3 consecutive same-type requests with no Skill support | Tag the operation pattern |
| 4 | **Quality Issues** | Same code quality problem appears across multiple Phases | Tag problem type and frequency |
| 5 | **Skill Capability Assessment** | After Skill execution completes, score across 4 dimensions | See scoring criteria below |

## Scoring Criteria (Precision / Coverage / Efficiency / Satisfaction)

| Score | Precision | Coverage | Efficiency | Satisfaction |
|------|-----------|----------|------------|--------------|
| 5 | Zero corrections | Followed guidance completely | Passed first try | Expressed satisfaction unprompted |
| 4 | 1-2 minor tweaks | 1 case improvised | 1 clarification | No negative feedback |
| 3 | 3+ corrections | 2-3 on-the-spot decisions | 2-3 rounds back-and-forth | Requested changes |
| 2 | Redo direction | Heavy improvisation | Many rounds | Demanded major rework |
| 1 | User gave up | Severe mismatch | Deadlocked | Rejected output entirely |

**Anti-inflation rule**: Had corrections → Precision ≤ 3. Improvised → Coverage ≤ 3. 2+ rounds → Efficiency ≤ 3. Change requests → Satisfaction ≤ 3.

## Record Quality Checklist

| Tier | Criteria |
|------|----------|
| **Must-Have** | All 4 scores filled (Precision/Coverage/Efficiency/Satisfaction); score-less feedback can't trigger evolution |
| **Must-Have** | FEEDBACK-INDEX.md checked before writing; merge with existing topic if same failure |
| **Must-Have** | Context captured: what AI did + what correct behavior is + which Skill was in use |
| **Recommended** | `failure_class` set (skill-defect / execution-lapse / unset) with one-sentence justification |
| **Recommended** | RED observation included in body for evolution-engine consumption |
| **Optional** | Screenshot or error log attached for debugging context |
