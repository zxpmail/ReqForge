# Three-Layer Diagnostic Model

After Stage 4 (fix implemented), apply three-layer depth to prevent recurrence:

**Layer 1: Symptom** — immediate error (exception, wrong output, missing feature)

**Layer 2: Design Flaw** — "What structural weakness allowed this bug?" (missing validation, implicit coupling, race window, etc.)

**Layer 3: Principle Violation** — which First Principle or process gap enabled the flaw

**Output format** (Completion Phase report):
- Symptom: [root cause fixed]
- Design Flaw: [structural weakness]
- Principle Violation: [rule/process skipped]

Example:
- Symptom: session.id undefined when session deleted
- Design Flaw: useSession holds stale reference — no cleanup on delete
- Principle Violation: "One at a Time" — delete didn't clean dependents first

**Escape check**: if the diagnosis reveals the defect should have been caught by an upstream gate (spec review, forge-verify, code-review) but wasn't, record it in the feedback entry's `escape` field (where it surfaced + which gate should have blocked it). Evolution-engine will propose a permanent check so the gap cannot recur.
