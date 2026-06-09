# Multi-Stakeholder Review

<!-- 从 workflow-0-to-1 引用 — Requirements Refinement Phase sufficiency check 通过后执行 -->

[Multi-Stakeholder Review Phase]
    Goal: Before writing Product-Spec.md, run a structured one-pass scan across four stakeholder
    perspectives to surface assumptions, risks, and blind spots. The output feeds into Document
    Generation — it is not a replacement for Step 7 Spec Quality Council.

    **When to run**:
    - 0-to-1 Mode (full workflow): **default on**, user may skip on request ("skip review")
    - 0-to-1 w/ complete brief already written: skip
    - Quick Mode / Iteration Mode: **always skip**
    - Brownfield (`/change-manager`): skip (owner handles scope in change proposal)

    **Token note**: ~4× checkpoint context per review. If token budget is tight, user can say
    "skip review" at prompt — no questions asked.

---

## Input

Refinement phase consensus summary. Not raw conversation — a condensed form:

```
## Review Input
- **Problem**: <one-liner>
- **Target users**: <who, why>
- **MVP scope**: <core features, 2-3 lines>
- **Tech direction**: <platform, stack>
- **Key assumptions**: <2-4 items from Refinement>
```

---

## Four Perspectives

Each perspective runs independently (same session, sequential prompts — no parallel Agents).
Return a blocked / needs-clarification / ok verdict per perspective.

### 1. Business Lens

| Question | Signal | Verdict if concerning |
|----------|--------|----------------------|
| Who pays / who uses? | Payer ≠ user gap | needs-clarification |
| Freq & context of use | "once a month" for a habit product | needs-clarification |
| What do they do today? | Unclear substitution | needs-clarification |
| Why now? | "Been thinking for years" | needs-clarification |
| What alternatives exist? | User hasn't named any | needs-clarification |
| Can v1 test demand? | v1 too big to test | needs-clarification |

### 2. Technical Lens

| Question | Signal | Verdict if concerning |
|----------|--------|----------------------|
| Can MVP be shipped with stated stack? | Unproven dependency | needs-clarification |
| Hidden cost? | API pricing, infra, compliance | needs-clarification |
| What breaks at 10× scale? | Architecture choice limits growth | needs-clarification |
| External dependency risk? | Single vendor lock-in | needs-clarification |

### 3. Experience Lens

| Question | Signal | Verdict if concerning |
|----------|--------|----------------------|
| Who is target user? | "Everyone" | needs-clarification |
| Empty state / first-run? | Not discussed | needs-clarification |
| Error / offline fallback? | Not discussed | needs-clarification |
| Core flow has 3+ steps? | Could be simpler | needs-clarification |

### 4. Scope / Risk Lens

| Question | Signal | Verdict if concerning |
|----------|--------|----------------------|
| v1 scope clearly bounded? | "We'll see" | needs-clarification |
| Compliance / regulatory? | Data residency, privacy | blocking |
| What is explicitly cut? | Nothing cut | needs-clarification |
| Ops burden known? | Ongoing manual work | needs-clarification |

---

## Output Format

After all four perspectives complete, synthesize into:

```markdown
## Stakeholder Review Summary

| Perspective | Verdict | Key finding |
|-------------|---------|-------------|
| Business | ok / clarify / blocked | <1-liner> |
| Technical | ok / clarify / blocked | <1-liner> |
| Experience | ok / clarify / blocked | <1-liner> |
| Scope / Risk | ok / clarify / blocked | <1-liner> |

### Items requiring resolution
1. <blocked item> → must resolve before Spec generation
2. <clarify item> → decide: resolve now or mark [TBD] in Spec

### Recommended action
<Chairman recommendation: proceed / clarify first / reconsider scope>
```

---

## Stop Rule

- **1 round scan only** — no multi-round PK
- If any perspective returns **blocked**: must present to user. User resolves, then either:
  - Proceed (Critique Gate follows, then Spec generation)
  - Or authorise **1 re-scan** of the affected perspective(s) only (not full 4)
- If only **needs-clarification**: summary goes into Spec as `§ Stakeholder Review Summary` or feeds into § Key Assumptions & Validation. No re-scan needed.
- Hard cap: **max 2 scans total** (initial + at most 1 re-scan).

---

## Template Insertion

When generating Product-Spec.md, insert the **Stakeholder Review Summary** table
under a `## Stakeholder Review Summary` section (between Key Assumptions and Use Cases),
but only if the review was run and produced non-trivial findings. If all verdicts were
"ok" with no notable findings, skip the section.

## Relationship with Step 7 Council

| | Multi-Stakeholder Review | Step 7 Council |
|---|---|---|
| Timing | Before Document Generation | After Spec written |
| Focus | "Should we build this?" | "Is the Spec sound?" |
| Output | Blocking check + assumptions | Quality confidence + findings |
| Re-run | Max 1 re-scan on blocking only | N/A (one-time gate) |
