# Benchmark Results — Anchors vs Rules (express-export)

## Task

**express-export**: Add an async data export system (submit/get status/validate/filter/format as JSON & CSV) to an existing Express API. Task definition at `tasks/express-export/task-definition.md`. Extended test suite: 35 tests.

## Experiment Design

**Model**: xopglm51 (via XFYun MaaS), temperature 0.3
**Design**: three variants, n=10 each, using the same `benchmark/run.mjs` harness.

| Variant | Context | Label |
|---------|---------|-------|
| V1 | task-definition + 3 code anchor snippets (endpoint pattern, service pattern, error handling pattern) | Anchors only |
| V2 | task-definition + 6 generalized rules (no dead code, respect existing patterns, don't hallucinate, etc.) | Rules only |
| V3 | both anchors and rules concatenated | Anchors + Rules |

All 30 runs identical except context document. No API errors.

## Results

### Test Pass Rate (max 35)

| Variant | Mean ± SD | Perfect (35/35) | Worst score |
|---------|-----------|:----------------:|:-----------:|
| V1 (anchors) | 30.50 ± 1.58 | 1/10 | 30/35 |
| V2 (rules) | 33.90 ± 2.33 | 8/10 | 29/35 |
| V3 (both) | 34.00 ± 2.11 | 8/10 | 30/35 |

### Code Size

| Variant | Mean ± SD | vs V1 |
|---------|-----------|-------|
| V1 (anchors) | 155.2 ± 3.9 | — |
| V2 (rules) | 168.2 ± 14.5 | +13 lines (+8%) |
| V3 (both) | 165.6 ± 9.3 | +10 lines (+7%) |

### Compile Rate

All 30 runs compiled (`tsc --noEmit`). All 30 runs had 100% static metric coverage (all required functions present).

## Per-Run Detail

### V1 — Anchors only

```
Run 0  30/35  Run 1  30/35  Run 2  30/35  Run 3  30/35  Run 4  30/35
Run 5  30/35  Run 6  30/35  Run 7  30/35  Run 8  30/35  Run 9  35/35
```

### V2 — Rules only

```
Run 0  35/35  Run 1  35/35  Run 2  35/35  Run 3  35/35  Run 4  35/35
Run 5  35/35  Run 6  35/35  Run 7  35/35  Run 8  30/35  Run 9  29/35
```

### V3 — Anchors + Rules

```
Run 0  35/35  Run 1  35/35  Run 2  35/35  Run 3  30/35  Run 4  35/35
Run 5  35/35  Run 6  35/35  Run 7  30/35  Run 8  35/35  Run 9  35/35
```

## Summary

| Metric | V1 (anchors) | V2 (rules) | V3 (both) |
|--------|:------------:|:----------:|:---------:|
| Tests passed | 30.50 ± 1.58 | 33.90 ± 2.33 | 34.00 ± 2.11 |
| Code lines | 155.2 ± 3.9 | 168.2 ± 14.5 | 165.6 ± 9.3 |
| Compiles | 100% | 100% | 100% |
| Function coverage | 100% | 100% | 100% |

## Key Takeaways

1. **Rules outperformed anchors on test pass rate** on this model/task (+3.4pp mean). 8/10 rule-guided runs achieved perfect scores vs 1/10 anchor-guided.
2. **Anchor-guided code was shorter** on average (155 vs 168 lines), consistent with the earlier n=1 comparison. But shorter code didn't translate to higher test pass rate.
3. **Adding rules to anchors (V3) didn't improve over rules alone** — the V3 and V2 scores are essentially identical (34.00 vs 33.90).
4. **All variants had 100% compile rate and function coverage** — none of the conditions produced broken code for this model/task.

## Post-Mortem

The full post-mortem is at `docs/benchmark-lessons-learned.md`. Key issues identified:
- No bare baseline (task-definition only) — can't isolate format effect from presence of any extra context
- Model ceiling — xopglm51 passed 87-100% of tests regardless of variant, suggesting it compensates for prompt deficiencies
- Task difficulty ceiling — express-export may not have been hard enough to expose prompt strategy differences
- Single model, single task — results may not generalize

Raw data: `benchmark/results-express-export-*.json`
