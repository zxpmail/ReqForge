# Bug-Fixer Dimension Checklist

Systematically inspect each dimension below before converging on a root cause.
Check off each item; note findings in the fix report.

## Must-Have

- **Error classification**: categorize the bug — compile error, runtime exception, logic error, UI rendering issue, or data inconsistency. The fix strategy differs radically per category.
- **Reproduction steps**: can the bug be reproduced deterministically? If not, note the flakiness rate and any heuristics (e.g., "3/10 runs"). Fix nothing without a reliable repro.
- **Stack trace reading**: read the full stack trace from bottom (root call) to top (crash site). Identify the first line of user code, not framework code. Extract the exact exception type and message.
- **Error message analysis**: treat error messages as primary evidence. Search the exact message in logs, code, and issue trackers. Do not dismiss known benign warnings.
- **Regression scope**: did this ever work? Use `git bisect`, `git log --oneline <file>`, or `git blame` to locate the introducing commit. Triage by blast radius.
- **Environment factors**: compare the failing environment (OS, runtime version, env vars, locale, network, container) against a known-working environment. Pin version mismatches.
- **Input validation**: trace the exact input that triggers the bug. Check for boundary values, null/undefined, malformed payloads, type coercion, and encoding mismatches.
- **State management**: inspect the state before and after the failing operation. Check for stale cache, uninitialized variables, incorrect reducer logic, and mutation of shared state.

## Recommended

- **Data integrity**: verify that persisted data (DB, files, localStorage) matches the expected schema. Look for partial writes, corrupted records, migration gaps, or character encoding issues.
- **Concurrency**: if the bug is intermittent, suspect race conditions, deadlocks, or unsafe async access. Check locks, transaction isolation levels, async/await chains, and shared-mutable-state patterns.
- **Logging / observability**: add targeted log statements or increase log level if existing logs are insufficient. Use structured logging (timestamps, correlation IDs) to reconstruct the event timeline.
- **Dependency version drift**: compare `package.json`, `requirements.txt`, `go.mod`, etc., against a known-good lockfile. A transitive dep update can introduce breakage without a direct code change.

## Optional

- **Performance / timeout**: rule out throttling, API timeouts, or resource exhaustion that masquerade as logic bugs. Check rate limits and memory profiles.
- **Third-party API / service**: if the bug involves an external service, inspect request/response payloads, HTTP status codes, and retry behavior. Account for API deprecation or version changes.
- **A/B experiments / feature flags**: if the system uses toggles, verify the active flag combination. An experiment branch may contain unmerged bugs.
- **Browser / device matrix**: for UI bugs, test across browsers (Chrome, Firefox, Safari, Edge), viewport sizes, and device types. CSS specificity, vendor prefixes, and polyfill gaps are common culprits.
- **Accessibility (a11y) interactions**: screen readers, keyboard navigation, and high-contrast mode can surface hidden state or event-handling bugs not visible in mouse-driven testing.
