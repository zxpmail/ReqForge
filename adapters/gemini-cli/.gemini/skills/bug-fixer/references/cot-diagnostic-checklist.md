# CoT Diagnostic Checklist

Before proposing a fix (align with Phase 1 Before Fix):

1. List at least **5** plausible causes for the symptom (not just the first guess)
2. For each cause: how to verify (which file, log, test, repro step)
3. Order causes from most likely to least likely
4. Validate from #1 downward; **no fix code until top hypothesis is tested or ruled out**

**Reporting format** (Stages 1–3 progress updates):
- Short bullet reasoning; **one bold line**: current leading root-cause hypothesis
- Do not bury the conclusion under long prose
