# Benchmark Report: Anchors vs Rules on xopglm51

*Executed June 2026. Model: xopglm51 via XFYun, temperature 0.3. All tasks are TypeScript projects using vitest.*

---

## Experiment Design

Two prompt strategies for LLM code generation:

- **V1 (anchors)**: task-definition.md + 3-5 code snippets from existing project files
- **V2 (rules)**: task-definition.md + 9 generalized prohibition rules ("don't over-abstract", "don't hallucinate APIs", etc.)
- **V3**: both anchors and rules concatenated

Metric: percentage of extended test suite passed.

## Results

### Round 1 — Original 5 tasks (invalidated)

| Task | V1 | V2 | V3 | Status |
|------|----|----|----|--------|
| todo-cli search | — | — | — | No V1/V2 split available |
| express-api-stats | 1.8/20 | — | — | Integration tests broke existing routes |
| react-sortable-table | 21/24 | — | — | Ceiling effect, no V2 comparison |
| python-input-validator | 0/0 | — | — | Extended tests never executed |
| java-validator | 0/0 | — | — | Extended tests never executed |

Three of five tasks had infrastructure problems that made test results unreadable. React was the only working task but ran only one variant.

### Round 2 — express-export (n=10)

| Variant | Tests passed | Lines | Compiles |
|---------|:-----------:|:-----:|:--------:|
| V1 (anchors) | 30.5 ± 1.58 | 155 | 100% |
| V2 (rules) | 33.9 ± 2.33 | 168 | 100% |
| V3 (both) | 34.0 ± 2.11 | 166 | 100% |

V1 lagged V2 by 3.4pp on average. Standard deviations overlap (1.58-2.33 range). V3 did not outperform V2.

### Round 3 — Three probes (n=3 each)

| Task | Dimension | V1 (anchors) | V2 (rules) | Gap |
|------|-----------|:-----------:|:---------:|:---:|
| schema-validator | Recursive logic | 12/12 (103 ln) | 12/12 (116 ln) | 0pp |
| event-scheduler | State coordination | 12/12 (81 ln) | 12/12 (98 ln) | 0pp |
| shipping-calculator | Business rules | 13/13 (100 ln) | 13/13 (131 ln) | 0pp |

All tests passed for both variants across all three tasks. Zero gap in test pass rate.

## Identified Problems

### No bare baseline

All runs gave the model extra context beyond the task definition. There was no condition where the model received only `task-definition.md` with no anchors or rules. Without this, it's not possible to attribute differences to the anchor/rule format rather than to the presence of any extra context.

### Test pass rate is a coarse metric

Anchors and rules produced code with different characteristics (line count, UUID strategy, naming patterns), but both passed equivalent tests. Test pass rate did not capture these differences. Structural metrics (abstraction depth, naming consistency, edge-case coverage) were added late and not systematically applied.

### Model capability ceiling

xopglm51 passed 87-100% of tests regardless of prompt strategy across all tasks except express-export. The model appears capable enough to compensate for prompt deficiencies — filling in omitted details when anchors are incomplete, and filtering redundant instructions when rules over-specify.

### Task difficulty ceiling

Six of seven tasks showed zero or near-zero gap between V1 and V2. The only exception was express-export where V1 scored 30.5 vs V2 33.9 — a 3.4pp gap with overlapping standard deviations. This suggests most tasks were not difficult enough for this particular model to expose prompt strategy differences.

### Insufficient sample size

n=3 probes had zero variance in most conditions, providing no signal. n=10 for express-export showed 3.4pp difference but with overlapping standard deviations. The minimum sample size needed for reliable measurement was not determined before running.

## What the Data Actually Shows

- Anchors and rules produce measurably different code. Rule-guided code is longer on average across all tasks. Anchor-guided code is shorter and structurally closer to existing project patterns.
- The difference in test pass rate between anchors and rules is small (0-3.4pp) and not statistically reliable given the sample sizes.
- Adding rules on top of anchors (V3) did not improve test pass rate over rules alone (V2) on the one task where all three were compared.
- The format of extra context (code examples vs text rules) may matter less than the presence of any relevant context, but this was not tested directly.

## Limitations

- One model only (xopglm51). Results may not generalize to other models.
- TypeScript/vitest only. No conclusion about other languages or test frameworks.
- Three probe tasks at n=3 produce near-zero variance, meaning the number is as close to uninformative as a run can be.
- The anchor context files contained different information from the rule context files. They differed in content, not just format. True isolation of format from content would require controlled content-matched conditions.
