# Spec Critique Gate: Counteracting LLM Sycophancy Bias in Product Specification

**Technical Report — ReqForge v1.44.0**
**Date: 2026-06-09**
**Author: ReqForge Project**

---

## Abstract

LLM-based product specification agents exhibit sycophancy bias — a tendency to validate user ideas rather than challenge them. We introduce a Critique Gate that forces adversarial re-examination of consensus specifications through three structural signals: hidden assumptions, unchallenged decisions, and scope that should be cut. Three rounds of evaluation — manual A/B comparison, dogfood development, and automated blind evaluation — demonstrate that critique-mode specifications score significantly higher on risk visibility (+5.2 on a 10-point scale) and rework resistance (+4.2), with a 5:0 blind preference over control specifications. However, critique gates prevent direction errors only; 62% of critical implementation bugs were not foreseeable at the spec level. We discuss the value boundary, methodology limitations, and integration into a production spec workflow.

---

## 1. Problem

RLHF/alignment training incentivizes LLMs to agree with users rather than challenge their assumptions. In product specification — where the goal is to identify risks, cut scope, and expose hidden assumptions before development — this bias is harmful. Control specifications consistently validate user ideas without scrutiny, producing specs that look complete but fail to surface risks that cause rework during development.

We call this the **"2.5-layer" problem**: the alignment layer (layer 2.5) sits between the model's base capabilities (layer 1) and the user's intent (layer 3), and it systematically biases output toward user affirmation. This is beneficial in execution phases (the model should follow instructions) but detrimental in specification phases (the model should challenge assumptions).

---

## 2. Intervention: Critique Gate

The Critique Gate is a structured adversarial checkpoint inserted after stakeholder review and before document generation in the 0-to-1 spec workflow. It examines three structural signals validated by our experiment:

| Signal | What it detects | Example |
|--------|----------------|---------|
| **Hidden Assumptions** | Assumptions treated as facts without evidence | "Users will complete onboarding" |
| **Unchallenged Decisions** | Decisions accepted without considering alternatives | "We'll use React" with no comparison |
| **Scope That Should Be Cut** | Features that don't survive honest scrutiny | "Full CRUD" when only Read is needed for v1 |

Each signal produces structured output: ID, finding, impact assessment, and resolution recommendation.

**Key design choice**: The gate is a **one-pass checkpoint**, not an iterative review. Its value is in the forced perspective shift, not in refinement loops. This is intentional — iterating on critique risks the same sycophancy drift the gate is designed to prevent.

---

## 3. Experiment Design

### 3.1 Hypothesis

H1: LLM sycophancy bias causes control specifications to under-report risks, assumptions, and scope boundaries.
H2: A critique gate intervention produces specifications that are measurably better on risk visibility, scope clarity, and rework resistance.

### 3.2 Three Rounds

| Round | Method | Purpose | Date |
|-------|--------|---------|------|
| 1 | Manual A/B spec + `forge-spec-critique` scoring | Initial direction validation | 2026-06-09 |
| 2 | Dogfood development (novel-writing tool) + code audit | Downstream impact validation | 2026-06-09 |
| 3 | Automated blind evaluation (`forge-spec-blind-eval`) | Bias elimination | 2026-06-09 |

### 3.3 Stimuli

Five requirement briefs covering different product domains:

| Brief | Domain | Core challenge |
|-------|--------|----------------|
| 01 | Enterprise knowledge base | RAG accuracy + access control |
| 02 | E-commerce mini-program | Payment integration + logistics |
| 03 | AI interview assistant | LLM hallucination + fairness |
| 04 | Fitness tracker | Wearable integration + data reliability |
| 05 | Contract review | Legal accuracy + jurisdiction |

Each brief was 200-400 words describing product intent, target users, and core features.

---

## 4. Round 1: Manual A/B + Automated Scoring

### 4.1 Method

For each brief, two specifications were manually generated:
- **Control**: Standard product-spec-builder prompt ("generate a Product Spec")
- **Critique**: Modified prompt requiring assumption exposure, alternative consideration, scope trimming, and risk matrices

Both were scored by `forge-spec-critique`, measuring assumption count, challenge count, scope decision count, and fluff word density.

### 4.2 Results

| Brief | Control Score | Critique Score | Difference |
|-------|--------------|----------------|------------|
| 01 | 4/40 (uncritical) | 18/40 (shallow) | +14 |
| 02 | 8/40 (uncritical) | 19/40 (shallow) | +11 |
| 03 | 4/40 (uncritical) | 20/40 (adequate) | +16 |
| 04 | 9/40 (uncritical) | 20/40 (adequate) | +11 |
| 05 | 9/40 (uncritical) | 20/40 (adequate) | +11 |

All control specs scored in the "uncritical" band; all critique specs scored at least "shallow" or "adequate."

### 4.3 Methodology Issues

- **Double bias**: The experimenter was also the LLM generating the specs, knowing the "correct" answer structure.
- **Circular scoring**: `forge-spec-critique` defined its own scoring criteria and then applied them — self-referential validation.
- **No blinding**: The scorer knew which spec was control vs. critique.

---

## 5. Round 2: Dogfood Development + Code Audit

### 5.1 Method

The critique-mode specification for a novel-writing application was used to develop a working web application (React + Vite + TypeScript + IndexedDB + D3.js). After development, a code audit identified 35 issues (13 critical). Each issue was cross-referenced against the spec to determine whether the critique gate had flagged the underlying risk.

### 5.2 Risk Hits

Three core risks flagged in the critique spec all materialized during development:

| Spec-flagged risk | Actual outcome |
|-------------------|---------------|
| AI writing requires API key — contradicts "pure local" | Users must provide their own API key |
| Relationship graph visualization interaction complexity | D3 force graph crash (node not found) |
| Browser storage unreliable for structured data | Import validation, filename sanitization, data loss hazards |

### 5.3 Coverage Analysis

Of 13 critical implementation issues:

| Coverage | Count | Percentage | Example |
|----------|-------|------------|---------|
| Covered by critique spec | 3 | 23% | D3 crash, API key, data loss |
| Partially related | 2 | 15% | CRUD missing delete confirmation |
| Not covered (implementation bugs) | 8 | 62% | React state mutation, wrong model ID |

### 5.4 Value Boundary Finding

**The critique gate prevents direction errors (architecture, scope, risk) but does not prevent implementation errors (state mutation, variable names, API calls).** This is not a limitation — it is a clean boundary. Code review prevents implementation errors; critique gates prevent specification errors. The two mechanisms are complementary but non-overlapping.

---

## 6. Round 3: Automated Blind Evaluation

### 6.1 Method

`forge-spec-blind-eval` automated the following pipeline for each brief:

1. Two independent LLM sessions generate specs (control prompt vs. critique prompt)
2. A/B order is **randomly shuffled** — the evaluator does not know which is which
3. An independent LLM session evaluates both specs on 5 dimensions (1-10 scale) and selects a preference
4. Labels are restored post-evaluation for analysis

**Biases eliminated**:

| Previous problem | Resolution |
|-----------------|------------|
| Experimenter = LLM (double bias) | Two independent API sessions generate specs |
| Scorer knows the "correct" answer | Random A/B order shuffle |
| Scoring criteria circular with generation | Evaluation dimensions independent of critique metrics |

### 6.2 Results

**Preference: Critique 5 — Control 0 (5:0)**

| Brief | Blind preference | Restored label | Reason |
|-------|-----------------|---------------|--------|
| Enterprise KB | B | critique | Exposed risks and assumptions; control overly idealized |
| E-commerce | A | critique | Comprehensive risk exposure with alternatives; control lacked depth |
| AI interview | B | critique | Risk matrix + degradation strategy reduce rework probability |
| Fitness tracker | B | critique | Flagged wearable feasibility issues |
| Contract review | B | critique | Every feature annotated with risk and alternatives |

### 6.3 Dimension Averages (1-10 scale)

| Dimension | Control | Critique | Difference |
|-----------|---------|----------|------------|
| Completeness | 7.8 | 9.0 | +1.2 |
| Risk visibility | 3.8 | 9.0 | **+5.2** |
| Executability | 6.8 | 8.0 | +1.2 |
| Scope clarity | 5.6 | 9.0 | **+3.4** |
| Rework resistance | 4.6 | 8.8 | **+4.2** |

The largest gaps are in risk visibility (+5.2) and rework resistance (+4.2). Completeness shows the smallest gap (+1.2) — control specs translate requirements adequately; they fail to challenge them.

---

## 7. Verification Status

| Claim | Round 1 | Round 2 | Round 3 | Final |
|-------|---------|---------|---------|-------|
| LLM sycophancy bias exists in spec phase | Surface | Confirmed | Confirmed | **Confirmed** |
| Critique gate produces better specs | Subjective | Risk hits | 5:0 blind | **Confirmed** |
| `forge-spec-critique` measures sycophancy | Circular | — | — | **Not confirmed** (circular scoring) |
| Critique specs reduce development rework | — | Partial | Proxy (8.8 vs 4.6) | **High confidence, not directly proven** |

---

## 8. Limitations

1. **Sample size**: 5 briefs is insufficient for statistical significance. A 5:0 result is suggestive but not conclusive at p < 0.05.
2. **LLM evaluator**: All evaluators were LLM sessions (DeepSeek), not human developers. LLM preferences may not correlate with developer preferences.
3. **Single provider**: Only DeepSeek was tested. Results may differ with Claude, GPT-4, or other models.
4. **No rework tracking**: Rework resistance was measured as a proxy score (4.6 vs 8.8), not as actual development iteration count. A true A/B development comparison was not conducted.
5. **Experimenter bias in Round 1-2**: The same person designed the experiment, wrote the specs, and audited the code. Round 3 eliminated this through automation.
6. **`forge-spec-critique` circularity**: The scoring tool defines its own success criteria and then measures against them. This is not independent validation.

---

## 9. Design Decisions

### 9.1 Why three structural signals, not fuzzy word density?

Early versions of `forge-spec-critique` used fuzzy word density (counts of "可能", "也许", "应该") as the primary metric. This proved unreliable — vague language can indicate either sycophancy or honest uncertainty, and the distinction requires semantic judgment that rule-based counting cannot provide. The three structural signals (assumptions, challenges, scope cuts) are **binary and structural**: an assumption is either exposed or hidden; a decision either has alternatives or doesn't; a feature is either marked for cutting or included without scrutiny.

### 9.2 Why one-pass, not iterative?

Iterating the critique gate would subject it to the same sycophancy drift it is designed to prevent. The second pass would tend to "agree with the first pass's findings" rather than challenge them. One forced perspective shift is the mechanism; refinement is not.

### 9.3 Why after Multi-Stakeholder Review, not before?

Multi-Stakeholder Review asks "should we build this?" from stakeholder perspectives (business, technical, experience, scope/risk). Critique Gate asks "what are we getting wrong?" from an adversarial perspective. Running critique first would premature — there is no consensus to challenge. Running it after ensures the gate challenges a formed consensus, which is where sycophancy bias is strongest.

### 9.4 Relationship to Step 7 Council

The 0-to-1 workflow now has three sequential quality gates:

| Gate | Timing | Question | Method |
|------|--------|----------|--------|
| Multi-Stakeholder Review | Before Doc Gen | "Should we build this?" | 4 stakeholder perspectives |
| Critique Gate | Before Doc Gen (after MS Review) | "What are we getting wrong?" | 3 adversarial signals |
| Step 7 Council | After Spec written | "Is the Spec sound?" | 4 quality dimensions |

---

## 10. Integration

The Critique Gate has been integrated into ReqForge's `product-spec-builder` as an optional phase in the 0-to-1 workflow, positioned after Multi-Stakeholder Review and before Document Generation. Configuration:

- **0-to-1 mode**: Default on; user may say "skip critique"
- **Quick mode / Iteration mode**: Always skip
- **Brownfield (`/change-manager`)**: Skip (owner handles scope in change proposal)
- **If MS Review was skipped**: Critique Gate still runs (independent gate)

Output is inserted into `Product-Spec.md` as a `## Critique Gate Summary` section (between Stakeholder Review Summary and Use Cases), only if the gate ran and produced findings.

---

## 11. Open Questions

1. **Human validation**: Do developer preferences align with LLM evaluator preferences? This requires recruiting 3-5 developers for blind evaluation.
2. **Cross-provider replication**: Does the 5:0 result hold with Claude, GPT-4, or Gemini as the spec generator and/or evaluator?
3. **Rework measurement**: Can we instrument actual development to track iteration count and compare specs with vs. without critique gate?
4. **Signal reliability**: Are the three structural signals (assumptions, challenges, scope cuts) sufficient, or do other signals exist that we haven't identified?
5. **Over-critique risk**: Does forcing adversarial review sometimes produce specs that are too conservative — cutting features that should stay in v1?

---

## 12. Reproducibility

All experiment materials are available in the ReqForge repository:

| Asset | Location |
|-------|----------|
| Requirement briefs | `forge-spec-experiment/briefs/` |
| Control specs (Round 1) | `forge-spec-experiment/control/` |
| Critique specs (Round 1) | `forge-spec-experiment/experimental/` |
| Blind eval results + generated specs | `forge-spec-experiment/blind-eval/` |
| Blind eval summary data | `forge-spec-experiment/blind-eval/summary.json` |
| Dogfood spec (novel app) | `forge-spec-experiment/control/novel-app.md` + `experimental/novel-app.md` |
| Critique scoring tool | `scripts/forge-spec-critique.mjs` |
| Blind evaluation tool | `scripts/forge-spec-blind-eval.mjs` |
| Full experiment report | `forge-spec-experiment/result.md` |

To reproduce the blind evaluation:

```bash
DEEPSEEK_API_KEY=xxx pnpm forge-spec-blind-eval
# or: OPENAI_API_KEY=xxx pnpm forge-spec-blind-eval
# or: ANTHROPIC_API_KEY=xxx pnpm forge-spec-blind-eval --use-anthropic
```

---

## References

- ReqForge project: https://github.com/zxpmail/ReqForge
- LLM Council comparison: `core/docs/llm-council-comparison.md`
- Product spec builder workflow: `core/skills/product-spec-builder/references/workflow-0-to-1.md`
- Critique gate reference: `core/skills/product-spec-builder/references/critique-gate.md`