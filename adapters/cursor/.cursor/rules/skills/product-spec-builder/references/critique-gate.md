# Critique Gate

<!-- 从 workflow-0-to-1 引用 — Multi-Stakeholder Review Phase 完成后、Document Generation 前执行 -->

[Critique Gate Phase]
    Goal: Counteract LLM sycophancy bias by forcing a critical re-examination of the
    consensus spec before writing it. The Multi-Stakeholder Review asks "should we build this?"
    from different stakeholder perspectives; the Critique Gate asks "what are we getting wrong?"
    from an adversarial standpoint. It focuses on three structural signals validated by
    experiment: hidden assumptions, unchallenged decisions, and scope that should be cut.

    **Experimental basis**: Three-round experiment (manual A/B + dogfood + automated blind eval)
    showed critique-mode specs scored +5.2 on risk visibility and +4.2 on rework resistance
    vs control specs (5:0 blind preference). Critique gate prevents direction errors;
    it does NOT prevent implementation errors (code review covers that).

    **When to run**:
    - 0-to-1 Mode (full workflow): **default on** after Multi-Stakeholder Review, user may skip ("skip critique")
    - 0-to-1 w/ complete brief already written: skip
    - Quick Mode / Iteration Mode: **always skip**
    - Brownfield (`/change-manager`): skip (owner handles scope in change proposal)
    - If Multi-Stakeholder Review was skipped: **still run** (critique gate is independent)

    **Token note**: ~2× checkpoint context. If token budget is tight, user can say
    "skip critique" at prompt — no questions asked.

---

## Input

Multi-Stakeholder Review output (if it ran) + full Refinement phase consensus. Condensed form:

```
## Critique Gate Input
- **Problem**: <one-liner>
- **Target users**: <who, why>
- **MVP scope**: <core features, 2-3 lines>
- **Tech direction**: <platform, stack>
- **Key assumptions**: <2-4 items from Refinement>
- **Stakeholder review findings**: <if review ran; otherwise "not run">
```

---

## Three Structural Signals

The critique gate examines three signals proven to differentiate critical from uncritical specs.
Do NOT measure fuzzy word density or "fluff" — those signals are unreliable (validated by experiment).

### Signal 1: Hidden Assumptions

Find assumptions the spec treats as facts without evidence:

| Check | Signal | Example |
|-------|--------|---------|
| User behavior assumed | "Users will do X" without validation | "Users will complete onboarding" |
| Technical assumption stated as fact | Dependency taken for granted | "The API will be available 99.9%" |
| Market condition assumed | Competitive landscape not verified | "No competitor has this feature" |
| Implicit scope boundary | "v1" used but boundary undefined | "Basic version" with no definition |

For each assumption found, record: ID, assumption text, category (user/tech/market/scope), confidence (low/medium/high).

### Signal 2: Unchallenged Decisions

Find decisions that were accepted without considering alternatives:

| Check | Signal | Example |
|-------|--------|---------|
| Single option presented | No alternatives discussed | "We'll use React" with no comparison |
| User preference treated as requirement | "I want X" accepted without "why X?" | "Must have real-time sync" for a single-user tool |
| Feature assumed necessary | No "what if we cut this?" test | Including feature because "everyone has it" |
| Architecture choice untested | No trade-off analysis | "Microservices" for a 3-person team |

For each unchallenged decision, record: ID, decision, alternative considered (if any), risk if wrong.

### Signal 3: Scope That Should Be Cut

Find scope that doesn't survive honest scrutiny:

| Check | Signal | Example |
|-------|--------|---------|
| Feature for "completeness" | "Full CRUD" when only R is needed for v1 | Admin panel with edit/delete for MVP |
| Feature with high risk/low value | Risk outweighs user benefit | Social features with privacy complexity |
| Implicit v2 scope in v1 | "Nice to have" not explicitly cut | "And also export to PDF" |
| Feature requiring external dependency | Dependency not yet available or reliable | Payment integration with no provider chosen |

For each scope cut suggestion, record: ID, feature, reason to cut, v1 impact if cut, v2 path if kept.

---

## Output Format

```markdown
## Critique Gate Summary

### Hidden Assumptions
| ID | Assumption | Category | Confidence | Impact if wrong | Evidence |
|----|------------|----------|------------|-----------------|----------|
| CA1 | … | user/tech/market/scope | low/medium/high | … | §section or "spec quote" |

### Unchallenged Decisions
| ID | Decision | Alternative | Risk if wrong | Evidence |
|----|----------|-------------|---------------|----------|
| CD1 | … | … | … | §section or "spec quote" |

### Scope Cut Suggestions
| ID | Feature | Reason to cut | v1 impact | v2 path | Evidence |
|----|---------|---------------|-----------|---------|----------|
| CS1 | … | … | … | … | §section or "spec quote" |

### Verdict
<proceed / clarify / blocked>

### Items requiring resolution
1. <blocked item> → must resolve before Spec generation
2. <clarify item> → decide: resolve now or mark [TBD] in Spec
```

---

## Density Check (anti-sycophancy quota)

LLMs can "fake critique" — adopt adversarial tone without producing substantive findings. Before
accepting the verdict, verify density:

- **Quota**: at least 3 substantive findings total across all three signal tables (Hidden
  Assumptions + Unchallenged Decisions + Scope Cuts). A finding without an `Evidence` citation
  does not count toward the quota — unfalsifiable criticisms are the easiest to fake.
- **Below quota → re-scan once** with stricter prompt:
  > "Your previous critique was insufficient. Find at least 3 substantive issues. Vague
  > criticisms ('could be more detailed', 'needs more clarity') do not count — each finding
  > must cite a specific section or quote from the spec."
- **If still below quota after re-scan**: accept the verdict but mark output as `low-critique`.
  User is warned the gate may have been sycophantic and should personally verify.

`Verdict: proceed` with **0 findings** = highest sycophancy risk. Always triggers re-scan,
regardless of overall quota.

---

## Stop Rule

- **Density check first** (see above). If quota fails, re-scan once before applying the rest.
- **1 round of debate** — no multi-round iteration beyond the density re-scan.
- If verdict is **blocked**: present to user. User resolves, then proceed with resolution noted.
  No re-scan — the critique gate is a one-pass checkpoint, not an iterative review.
- If verdict is **clarify**: items go into Spec as `[TBD]` or `§ Key Assumptions`. No re-scan needed.
- If verdict is **proceed**: findings feed into Document Generation (assumptions → Key Assumptions,
  scope cuts → explicit v1/v2 boundary in Spec).
- **Hard cap: 1 pass + 1 density re-scan max.** This is intentional — the critique gate's value
  is in the forced perspective shift, not in iterative refinement.

---

## Relationship with Multi-Stakeholder Review and Step 7 Council

| | Multi-Stakeholder Review | Critique Gate | Step 7 Council |
|---|---|---|---|
| Timing | Before Critique Gate | After MS Review, before Doc Gen | After Spec written |
| Focus | "Should we build this?" | "What are we getting wrong?" | "Is the Spec sound?" |
| Method | Stakeholder perspectives | Adversarial signal scan | Quality dimensions |
| Output | Blocking check + assumptions | Assumptions + challenges + cuts | Quality confidence |
| Re-run | Max 1 re-scan on blocking | No re-scan (1 pass only) | N/A (one-time gate) |

The three gates are sequential and complementary:
1. **MS Review** catches stakeholder blind spots (who we forgot, what we assumed)
2. **Critique Gate** catches LLM sycophancy blind spots (what we agreed to without scrutiny)
3. **Step 7 Council** catches Spec quality issues (inconsistencies, gaps, feasibility)

---

## Template Insertion

When generating Product-Spec.md, insert the **Critique Gate Summary** under a
`## Critique Gate Summary` section (between Stakeholder Review Summary and Use Cases),
but only if the critique gate ran and produced findings. If no significant findings
(all signals empty or trivial), skip the section and proceed to Document Generation.

---

## What Critique Gate Does NOT Do

Based on experimental validation, the critique gate has a clear value boundary:

- **Prevents**: Direction errors (wrong architecture, uncut scope, unvalidated assumptions)
- **Does NOT prevent**: Implementation errors (state mutation bugs, wrong variable names,
  incorrect API calls, CSS issues)
- Implementation errors are caught by **code review** — the two mechanisms are complementary
  but non-overlapping. Do not expand the critique gate to try to catch implementation-level issues.
