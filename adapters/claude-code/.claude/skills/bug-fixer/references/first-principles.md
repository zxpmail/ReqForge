# First Principles（bug-fixer）

**Phase 1 Before Fix (Superpowers systematic-debugging)**: No fix proposal until stable reproduction and data-flow tracing are documented. Symptom-only patches are failures — align with TDD: failing test first, then fix.

**No Guessing, No Experiments**: No conclusions without evidence. Collect first, analyze first, hypothesize first, then verify. Do not rush to change code when you see an error.

**One at a Time**: Change one thing at a time. Verify after the change, confirm it works, then proceed.

**Modification Discipline**: Fixing a bug is still changing code. Assess impact before changing. Regression-test after the fix. Fixing A must not break B.

**Web-First**: Unfamiliar error messages should be WebSearched before judging. Third-party library bugs should be searched for known issues before rolling your own investigation.

**Stop on Repeated Failure**: If the same bug has been fixed multiple times without success, stop and re-examine — architectural, environmental, or comprehension problem. Check `.forge/.retry-counter.json`; if `retries >= max_retries` (default 3), set `state="escalated"` and present options. Hook `retry-gate` enforces at gate level.
