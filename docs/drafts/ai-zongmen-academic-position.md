# Experience Routing for Agentic RL: A Position on Dataflow between Exploration and the Base Policy

**中文题：** 智能体强化学习中的经验路由：关于「探索—本体」数据流的立场文

**体裁：** Technical Position / Perspective（非方法论文；本文不报告新实验）

**状态：** Draft for academic-style technical viewpoint · 2026-07-18

---

## Abstract

Agentic reinforcement learning (RL) for large language model (LLM) agents has recently advanced along two visible axes: **optimizer design** for long-horizon asynchronous training (e.g., single-rollout asynchronous methods), and **collaboration surfaces** that share context across multiple agents at interaction time. We argue that a third axis remains under-specified: **how experience is admitted to the base policy**—who may read a trajectory, at what granularity, and under what quarantine rules—after rollouts are produced.

This position paper (i) frames the gap as an *experience-routing* problem orthogonal to the choice of policy optimizer; (ii) states layered claims (diagnosis / architectural hypothesis / design choices); (iii) sketches a formal interface between an optimizer \(\mathcal{A}\) and a router \(r(\cdot)\); (iv) relates the proposal to prioritized replay, asynchronous actor–learner systems, hierarchical RL, offline RL, curiosity, distillation, and safety shields; and (v) specifies a minimal falsification protocol. We do **not** claim empirical superiority; numbers appearing in secondary expositions must not be treated as established design parameters until independently measured.

**Thesis.** The next bottleneck for multi-agent / multi-worker agentic systems may be less “making more models see each other” than **letting experience reach the base policy in a layered, quarantined, and low-frequency manner**.

---

## 1. Contributions

1. **Problem reframing.** We separate *training stability under asynchrony* from *admission control of experience* into the base policy, and argue the latter is a first-class systems problem for long-horizon agentic RL.
2. **Composable interface.** We propose that experience routing should be stated as a dataflow layer that can sit **above** optimizers such as GRPO-style group methods or single-rollout asynchronous optimizers, rather than as a competing loss.
3. **Falsifiable position.** We give a minimal A/B protocol and pre-registered failure conditions under which the proposed dataflow organization should be rejected—without requiring a full production stack.

Non-claims: we do not provide a trainable algorithm with proven regret bounds; we do not evaluate Tutti-like products as RL baselines; we do not assert calibrated compute savings.

---

## 2. Problem and Claim Taxonomy

### 2.1 Motivating phenomena (layer-separated)

**Training layer.** Synchronous, group-wise RL for LLMs is poorly matched to long-horizon agentic rollouts with heavy-tailed lengths: stragglers idle accelerators. Asynchronous pipelines improve throughput but intensify off-policy / policy-lag issues. GRPO-style group-relative methods [Shao et al., 2024] are widely used; **SAO** (*Single-Rollout Asynchronous Optimization for Agentic Reinforcement Learning*, arXiv:2607.07508) argues that group-wise sampling fits asynchronous agentic training poorly, replaces it with single-rollout updates plus value-model / token-level clipping recipes, and reports—in *their* training curves—that vanilla GRPO suffers performance collapse at approximately 160 steps while SAO trains stably toward ~1000 steps on agentic coding/reasoning suites, with deployment in the GLM-5.2 agentic RL pipeline [SAO2026]. We treat that collapse horizon as **evidence from a primary paper’s setting**, not a universal constant pending independent replication.

**Collaboration layer.** Tools that give multiple coding / tool agents a shared workspace (context inheritance, cross-agent file visibility—“blackboard-like” surfaces) reduce handoff friction for human–AI workflows. At scale they postpone, rather than dissolve, **context-window pressure and write conflicts**. Critically, this layer optimizes *interactive coordination*, not *offline admission of training trajectories* into a base policy. Conflating the two layers is a category error.

**Missing layer.** After workers emit trajectories, systems still need an explicit answer to: *who reads what, how deeply, and when may parameters of the base policy move?* Passive replay and “share everything” collaboration leave this underspecified for expensive, long, heterogeneous agentic traces.

### 2.2 Claims

| ID | Type | Statement |
|----|------|-----------|
| **C1** | Diagnostic | For long-horizon agentic RL with heterogeneous workers, **passive full-trajectory ingestion** and **global shared contexts** create structural tensions (noise overwhelm / credit opacity / conflict delay) that optimizer tweaks alone do not dissolve. |
| **C2** | Architectural hypothesis | An **experience-routing dataflow**—fingerprint → tiered buffers → selective deep read → gated low-frequency base updates—can improve the trade-off between exploration breadth and base-policy stability **when stacked with** (not replacing) asynchronous optimizers. |
| **C3** | Design choices | Concrete thresholds (fingerprint width, entropy cutoffs, promotion rules) are **tunable design parameters**, not scientific results, until calibrated by the protocol in §7. |

C1 is supported by literature tension + systems observation. C2 is the position to test. C3 must never be smuggled into C1/C2.

---

## 3. Related Work and Tension

We organize prior work by *what it optimizes*, then state the residual gap.

### 3.1 Experience prioritization and replay

**Prioritized Experience Replay (PER)** [Schaul et al., 2016] samples transitions by TD-error magnitude, addressing passive uniform replay. **Hindsight Experience Replay** [Andrychowicz et al., 2017] relabels goals to densify signal. **Go-Explore** [Ecoffet et al., 2021] separates return-to-state from explore-from-state for hard exploration.

*Tension with this position:* these methods primarily decide **which transitions enter the learner’s SGD batch**. We focus on a coarser, systems-level question for LLM agents: which **trajectory windows** are worth materializing and deeply reading at all, and which must be **quarantined from weight updates** while remaining analyzable. PER-like scores can implement our warm-tier ranking; they do not by themselves define quarantine semantics.

### 3.2 Asynchronous actor–learner systems

**IMPALA** [Espeholt et al., 2018] and related actor–learner designs decouple acting from learning with V-trace-style corrections. LLM agentic stacks now replay that tension at tokenizer/tool granularity; **SAO** [SAO2026] attacks stability under single-rollout asynchrony with token-level clipping and value-model recipes.

*Tension:* async systems optimize **when gradients are applied relative to data arrival**. Experience routing optimizes **which data may approach the base policy’s update set**. The two compose: SAO can remain \(\mathcal{A}\) while routing restricts the support of trajectories visible to \(\mathcal{A}\).

### 3.3 Hierarchical RL

Option-Critic and HRL [Bacon et al., 2017; Sutton et al., 1999] abstract **action** over time.

*Tension:* we abstract **experience admission**, not temporal action options. Hierarchy lives on the data plane.

### 3.4 Offline / conservative RL

CQL, IQL, TD3+BC [Kumar et al., 2020; Kostrikov et al., 2022; Fujimoto & Gu, 2021] conserve via **losses** that penalize OOD actions.

*Tension:* we conserve via **physical buffer isolation and multi-stage promotion**. Complementary, not equivalent: a system could route into an offline-conservative updater.

### 3.5 Curiosity and uncertainty

ICM / RND / RE3 [Pathak et al., 2017; Burda et al., 2019; …] turn prediction error or state entropy into **intrinsic reward**.

*Tension:* we use uncertainty-like signals for **scheduling** (archive vs deep-read), not necessarily for reward shaping. Mis-calibrated entropy⇒value correlation is a primary threat (§8).

### 3.6 Distillation and teacher–student

Classical distillation transfers from teacher to student [Hinton et al., 2015].

*Tension:* our “tour agent” is an inverted use: a frozen/partial copy **gates** what the teacher (base) may see—closer to cascade/filtering than capability transfer.

### 3.7 Safety shields and constrained RL

Shielding [Alshiekh et al., 2018] and Safe RL often **block** unsafe actions.

*Tension:* our router **does not destroy** anomalous trajectories; it quarantines them for offline analysis (`hot-hazard` vs `hot-promising`). Analysis value is first-class.

### 3.8 Agent memory and collaboration systems

Persistent memory, trajectory stores, and shared workspaces (including emerging multi-agent IDE-like tools) address **interaction-time** continuity.

*Tension:* sharing files in a session ≠ admitting gradients into a 70B+ base. Cross-layer analogies are illustrative only.

**Gap statement.** Across these lines, we still lack a crisp, optimizer-agnostic account of **experience admission control** for expensive LLM-agent trajectories with safety quarantine and selective deep read. That is the niche this position occupies.

---

## 4. Formal Sketch

### 4.1 Objects

- Workers \(\{w_i\}\) generate trajectories \(\tau = (o_t, a_t)_{t=1}^{L}\).
- Base policy \(\pi_\theta\) (infrequently updated).
- Optimizer \(\mathcal{A}\) (e.g., GRPO-style or SAO) consumes a dataset \(D_{\mathrm{adm}}\) and emits \(\Delta\theta\).
- Router state includes a fingerprint map and tier buffers.

**Assumption (white-box).** Workers expose either hidden states \(h_t\) or action distributions \(\pi_t(\cdot\mid o_t)\). Black-box APIs require a degraded text/tool-log router (out of scope for the strong form).

### 4.2 Fingerprint and signals (design surface)

At window boundaries (length \(k\), a design choice), compute:

\[
s_t = \mathrm{sign}(P h_t),\quad
u_t = \frac{H(\pi_t)}{H_{\max}},\quad
\delta_t = \mathrm{JS}(\pi_{t-1},\pi_t)
\]

with fixed random \(P\) (Johnson–Lindenstrauss-style sketch; width is a design choice). The router reads \((s_t,u_t,\delta_t)\), not full \(\tau\), until promotion.

### 4.3 Routing

\[
r(u_t,\delta_t) \in \{\mathrm{archive},\ \mathrm{warm},\ \mathrm{hot}\}
\]

Hot trajectories carry labels \(\{\texttt{hot-promising},\ \texttt{hot-hazard}\}\) assigned when terminal return / safety monitors are known (labeling may lag isolation—see §8).

### 4.4 Admission set

Only the **restricted** tier (after multi-stage validation) may enter \(D_{\mathrm{adm}}\):

\[
\mathrm{support}(\nabla_\theta \mathcal{L}_{\mathcal{A}}) \subseteq D_{\mathrm{adm}} \subseteq \mathrm{RestrictedTier}.
\]

Warm tier may be deep-read by a **tour agent** \(g_\phi\) (partial freeze of \(\pi_\theta\)) that emits summaries \(z\in\mathbb{R}^{d_z}\), not full chain-of-thought dumps into \(\theta\).

### 4.5 Implicit objective (informal)

Under constraints on task return and safety events, prefer dataflows that reduce **wasted deep-read tokens** while preserving return—e.g., minimize deep-read tokens per unit return subject to no safety leakage of `hot-hazard` into \(\theta\). Exact scalarization is left to implementers; the point is that the position implies an **information-budget** view, not only a reward view.

### 4.6 Composition with \(\mathcal{A}\)

\[
\tau \xrightarrow{\text{workers}} \mathrm{Buffer} \xrightarrow{r} \{\mathrm{arch},\mathrm{warm},\mathrm{hot}\} \xrightarrow{\text{gate}} D_{\mathrm{adm}} \xrightarrow{\mathcal{A}} \theta.
\]

SAO/GRPO occupy the rightmost arrow. Experience routing occupies the middle arrows.

---

## 5. Architectural Position (Mechanism Judgments Only)

We summarize the proposed organization without treating hyperparameters as results.

1. **Active patrol over passive pools.** Prefer fingerprint + tiering + selective deep read over ingesting all rollouts into the base learner’s context/batch construction.
2. **Greyscale buffers.** Separate *unfamiliar* from *unsafe*: warm = under observation; hot = isolated from \(\theta\) but retained; restricted = sole path to base updates.
3. **Anomaly handling.** Core: adversarial hardening of the fingerprint discriminator; cluster alarms to reward-model offline review; optional conservative “mirror” rollouts for boundary visualization. **Counterfactual causal dissection of high-return anomalies is Future Work**, not a core mechanism.
4. **Tour agent.** A read-mostly gate, not a second base: narrow view, uncertainty escalation to \(\pi_\theta\), shared control period \(T\) with projection refresh and rare base updates.

Optional mnemonic (footnote-level): a “sect” metaphor (base / tour / workers / shield / greyscale / forge) may aid pedagogy; it is not a technical primitive.

---

## 6. Evidence Policy

**This draft reports no new measurements.** Therefore:

- Media or secondary claims (e.g., particular collapse step counts) must be traced to primary papers and treated as **context**, not universal laws.
- Any compute-saving percentages are **forbidden as conclusions** until §7 is run.
- Acceptable evidence *for a position paper*: (a) logical tension with prior work; (b) systems category separation; (c) pre-registered falsifiers.

If authors later add experiments, promote this document from Position to Empirical Systems Note and move C3 parameters from appendix into calibrated tables.

---

## 7. Minimal Falsification Protocol

**Shared:** environments, worker policy class, optimizer \(\mathcal{A}\) (GRPO-like or SAO). **Differ:** experience dataflow only.

| Arm | Dataflow |
|-----|----------|
| A | Passive replay / near-full deep availability to learner |
| B | Fingerprint routing + warm deep-read; hot excluded from \(\theta\); restricted-only updates |

**Metrics:** effective deep-read ratio; idle accelerator fraction (if async); task return; safety events (red-line hits; forbidden hot→\(\theta\) leaks).

**Pre-registered failures (any ⇒ reject B in that setting):**

1. Warm tier chronically fails to filter (e.g., almost-all mass in warm across ≥5 control periods).
2. End-to-end wall-clock or token cost not meaningfully better than A after including tour-agent overhead.
3. Restricted promotions followed by sustained return regression on a held-out eval suite.
4. Any `hot-hazard` mass enters \(\theta\) updates.

**Weak success (only licenses larger trials):** deep-read ratio ↓ vs A, return ≱ worse, no failures above.

---

## 8. Limitations and Counterarguments

1. **Entropy–value decoupling.** If \(u_t,\delta_t\) correlate poorly with learnable structure, routing systematically archives the wrong traces. *Mitigation:* treat signals as features for a learned ranker; keep §7.
2. **Label lag on hot tiers.** Terminal return / hazard labels arrive late; isolation-before-label costs memory. *Mitigation:* provisional isolation + deferred labeling; accept systems complexity.
3. **Fingerprint causality blindness.** Sketches cannot separate careful derivation from lucky last steps. Windowed sketches help weakly; they do not restore full credit assignment.
4. **White-box hard requirement.** Strong form needs \(h_t\) or \(\pi_t\). Black-box text routers are a different method with weaker guarantees.
5. **Cross-layer analogy risk.** Collaboration blackboards ≠ training admission control. Tutti-like systems are motivational parallels, not experimental baselines unless re-implemented as trajectory stores.
6. **SAO collapse narratives.** Independent replication of any specific GRPO failure horizon remains open; our C1 does not depend on a single step index.
7. **No theory.** We provide no convergence proof; conservation is organizational, not Lyapunov.

---

## 9. Scope: Suitable / Unsuitable

**Suitable hypotheses to test:** costly environment steps; long horizons; heterogeneous task mixture; need to retain hazardous traces for analysis; white-box workers.

**Unsuitable:** dirt-cheap simulators with tiny \(L\); hard real-time loops; opaque API-only workers without a degraded design; settings where full-batch replay is already cheap.

---

## 10. Conclusion

Optimizer research (including single-rollout asynchronous methods) and collaboration UX (shared agent workspaces) address real pains. Between them sits an under-named problem: **experience admission**. We position layered, quarantined, low-frequency admission—experience routing—as a composable dataflow layer, state what would falsify it, and refuse to dress design knobs as results.

Whether this organization beats passive pools is an empirical question for §7—not a metaphorical one.

---

## References (selected)

1. **[SAO2026]** Hou, Z., Li, Y., Tang, J., Dong, Y. *Single-Rollout Asynchronous Optimization for Agentic Reinforcement Learning*. arXiv:2607.07508, 2026. https://arxiv.org/abs/2607.07508  
2. Schaul, T., et al. *Prioritized Experience Replay*. ICLR, 2016.  
3. Andrychowicz, M., et al. *Hindsight Experience Replay*. NeurIPS, 2017.  
4. Ecoffet, A., et al. *First Return, Then Explore* (Go-Explore). Nature, 2021.  
5. Espeholt, L., et al. *IMPALA: Scalable Distributed Deep-RL with Importance Weighted Actor-Learner Architectures*. ICML, 2018.  
6. Bacon, P.-L., Harb, J., Precup, D. *The Option-Critic Architecture*. AAAI, 2017.  
7. Sutton, R., Precup, D., Singh, S. *Between MDPs and semi-MDPs*. Artificial Intelligence, 1999.  
8. Kumar, A., et al. *Conservative Q-Learning for Offline RL*. NeurIPS, 2020.  
9. Kostrikov, I., Nair, A., Levine, S. *Offline RL with Implicit Q-Learning*. ICLR, 2022.  
10. Fujimoto, S., Gu, S. *A Minimalist Approach to Offline RL* (TD3+BC). NeurIPS, 2021.  
11. Pathak, D., et al. *Curiosity-driven Exploration by Self-supervised Prediction*. ICML, 2017.  
12. Burda, Y., et al. *Exploration by Random Network Distillation*. ICLR, 2019.  
13. Hinton, G., Vinyals, O., Dean, J. *Distilling the Knowledge in a Neural Network*. arXiv:1503.02531, 2015.  
14. Alshiekh, M., et al. *Safe Reinforcement Learning via Shielding*. AAAI, 2018.  
15. Shao, Z., et al. DeepSeekMath / GRPO line (group-relative policy optimization for LLM RL). 2024.  
16. Johnson, W., Lindenstrauss, L. *Extensions of Lipschitz mappings into a Hilbert space*. Contemporary Mathematics, 1984. (projection sketch motivation)

*Note:* Expand author lists and venues to camera-ready BibTeX before any arXiv upload. Secondary WeChat/blog expositions are excluded from the reference list on purpose.

---

## Appendix A: Design-Choice Placeholders (Not Results)

| Item | Placeholder role |
|------|------------------|
| Fingerprint width | JL sketch dimensionality |
| Window \(k\) | Temporal contour vs cost |
| Entropy / JS cutoffs | Implement \(r\) |
| Control period \(T\) | Align tour / rare \(\theta\) update / \(P\) refresh |
| Promotion consistency | Restricted-tier gate |

Do not cite these as measured optima.

---

## Appendix B: Mapping from Pedagogical Metaphor (Optional)

| Metaphor | Technical term |
|----------|----------------|
| Base / abbot | \(\pi_\theta\), rare updates |
| Tour senior | Tour agent \(g_\phi\) |
| Outer disciples | Workers \(w_i\) |
| Mountain shield | Fingerprint router |
| Greyscale courts | Tiered buffers |
| Forge hall | Offline anomaly analytics |

---

## Appendix C: Changelog vs Popular Drafts

Relative to the Zhihu/popular drafts derived from the same ideation log (`agent.md`):

- Added claim taxonomy C1–C3, formal interface, evidence policy, threats.  
- Expanded Related Work beyond five-name tables (PER, HER, Go-Explore, IMPALA, …).  
- Demoted causal dissection to Future Work.  
- Removed compute-saving percentages from the argumentative spine.  
- Kept falsification protocol as the empirical spine of the position.

---

*End of academic-position draft.*
