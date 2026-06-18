# Plan Critique Check

<!-- 从 workflow.md Generation Mode Analysis Phase Step 4 后、Output Phase 前执行 -->

[Plan Critique Check]
    Goal: Counteract LLM sycophancy bias in dev planning. After the model has built a Phase
    structure, it naturally rationalizes its own choices — Phase order feels right because it
    built it, tech stack feels right because it picked it. This check forces adversarial
    scrutiny of planning decisions before writing DEV-PLAN.md.

    **When to run**:
    - Generation Mode: after Analysis Phase Step 4 (sufficiency check), before Output Phase
    - Iteration Mode: skip (incremental changes don't need full critique)
    - User may skip: "skip plan critique"

    **Token note**: adds ~1 checkpoint pass. Lightweight — three focused questions, not a
    full spec-style critique gate.

---

## Three Planning Signals

### Signal 1: Phase Order Challenges

Question the dependency ordering — is the proposed sequence actually necessary or just convenient?

| Check | Signal | Example |
|-------|--------|---------|
| Phantom dependency | Phase B depends on Phase A, but B could start with a mock/stub | "Must build DB schema before API" — API can use in-memory store first |
| Risk-delayed | High-risk items pushed to later Phases instead of front-loaded | Auth deferred to Phase 3 despite every Phase needing it |
| Cosmetic ordering | Phases ordered by "cleanliness" not dependency | "Setup → UI → API" when API has no dependency on UI |
| Hidden coupling | Two Phases share implicit state not captured in dependency graph | Phase 1 and 3 both write to same DB table |

### Signal 2: MVP Scope Challenges

Question whether Phase 1 is truly minimal — LLMs tend to over-scope MVP to please the user.

| Check | Signal | Example |
|-------|--------|---------|
| Feature creep in Phase 1 | Phase 1 includes non-essential features | "Phase 1: Core CRUD + search + export" — export is v2 |
| Premature optimization | Infrastructure for scale that isn't needed yet | "Set up Redis caching" for a tool with <100 users |
| Admin included by default | Admin UI in MVP when manual DB ops suffice | "Admin dashboard" in Phase 1 of an internal tool |
| Missing smoke test | No clear "does it work?" milestone in Phase 1 | Phase 1 ends with "project setup complete" |

### Signal 3: Tech Stack Challenges

Question whether the chosen stack is validated or just default/comfortable.

| Check | Signal | Example |
|-------|--------|---------|
| Default without justification | Stack chosen because "it's standard" not because it fits | React for a static landing page |
| Version unverified | Framework version assumed compatible without WebSearch confirmation | "Next.js 14" when 15 is stable and 14 has known issue |
| Over-tooling | Dependencies added for hypothetical future needs | GraphQL for a 2-endpoint API |
| Ignored alternatives | Better option exists but wasn't compared | Svelte for a lightweight widget — never considered |

---

## Output Format

```markdown
## Plan Critique Summary

### Phase Order Challenges
| ID | Challenge | Current Order | Proposed Alternative | Risk if unchanged | Evidence |
|----|-----------|---------------|---------------------|-------------------|----------|
| PO1 | … | Phase A→B | Phase B→A with stub | … | §Phase or spec §section |

### MVP Scope Challenges
| ID | Challenge | Current Scope | Proposed Trim | v1 Impact | Evidence |
|----|-----------|---------------|---------------|-----------|----------|
| MS1 | … | … | … | … | §Phase or spec §section |

### Tech Stack Challenges
| ID | Challenge | Current Choice | Alternative | Risk if unchanged | Evidence |
|----|-----------|----------------|-------------|-------------------|----------|
| TS1 | … | … | … | … | §Phase or dev-map |

### Verdict
<proceed / adjust / blocked>

### Adjustments (if verdict = adjust)
1. <specific change to make before writing DEV-PLAN.md>
```

---

## Density Check

Same anti-sycophancy quota as spec critique gate:

- **Quota**: at least 2 substantive findings total. A finding without `Evidence` does not count.
- **Below quota → re-scan once** with:
  > "Your plan critique was insufficient. Challenge at least 2 specific planning decisions.
  > Each must cite which Phase or tech stack choice it targets and why the alternative is viable."
- **Still below quota**: mark `low-critique`, proceed with warning.

---

## Stop Rule

- **Density check first**. If quota fails, re-scan once.
- **1 pass + 1 density re-scan max.**
- **Verdict adjust**: apply the listed adjustments, then proceed to Output Phase. No second critique.
- **Verdict blocked**: present to user. Resolve, then proceed. No re-scan.
- **Verdict proceed**: note findings in DEV-PLAN.md `## Plan Critique Notes` section (optional — only if findings are substantive).

---

## What Plan Critique Does NOT Do

- Does NOT re-validate the Spec (that's the spec critique gate's job)
- Does NOT review code quality (that's /code-review)
- Does NOT replace user confirmation (plan-confirmed.json still required)
