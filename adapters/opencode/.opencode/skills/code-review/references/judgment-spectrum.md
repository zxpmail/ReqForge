# Judgment Spectrum（code-review）

(Tencent Harness mirror — see `../../docs/tencent-harness-mirror-comparison.md`)

Route each finding to the right tier — do not collapse "good" into a single score:

| Tier | What | Forge artifact |
|------|------|----------------|
| S1 | Machine-checkable | `forge-verify`, tests, linters |
| S2 | Spec acceptance clauses | `Product-Spec.md`, Phase checklist |
| S3 | Team taste / preferences | `.forge/project-taste.md` |
| S4 | Contextual tradeoffs | This review + `memory/decisions-log.md` |
| S5 | Strategy, values, pure aesthetics | Human only — note disagreement, do not auto-fix |

**Adversarial review (石碑②):** implementer context ≠ reviewer context — specialized sub-agents must challenge, not rubber-stamp.

If `.forge/project-taste.md` exists, cite taste violations as S3 (preference drift), not S1 failures.
