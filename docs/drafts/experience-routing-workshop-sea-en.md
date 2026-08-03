# Experience Admission for White-Box Agentic RL: A Position on Dataflow between Exploration and the Base Policy

**Venue target:** NeurIPS 2026 Workshop — *Scaling Environments for Agents* (SEA)  
**Track:** Short paper (≤4 pages excl. references; position) · non-archival · OpenReview  
**Deadline (tentative):** 2026-08-29 · Notification: 2026-09-29  
**Status:** Workshop draft v0.14 · 2026-07-25 · **no arXiv preprint**  
**Anonymization:** ready for double-blind (no author block)  
**Scope:** **strong form = white-box / instrumented workers only**; black-box APIs are **out of claim** (degraded post-hoc filtering only)  
**Alignment:** P1–P4 match Chinese draft `experience-routing-position-paper-zh.md` (**v0.19**)

> **One-line claim (hypothesis-level):** under *observable* multi-worker RL, the bottleneck is often not making more models see each other, but letting experience reach the base policy in a *layered, isolated, low-frequency* way.

> **Testable commitment (layered):** fix \(\mathcal{A}\); vary only the data plane (A/B/P). If failures 4–5 do not fire, materialization cost falls vs A, and the task is not in persistent regression, meet the **scale-up gate** only (not validation; does **not** alone entail “must ship as a first-class module”). After scale-up still passes, *then* recommend a first-class pipeline module—not default passive pool/PER. Else withdraw that configuration’s strong form.

---

## Abstract

In **white-box instrumented-worker** multi-worker RL, a layer is often missing between optimizers and collaboration: after trajectories are produced, **who may materialize, at what depth, and when may \(\theta\) update**. Black-box APIs are out of strong-form claim.

We call this **experience admission**. Novelty is **P1–P4** (a *proposed admission policy*) plus preregistered failures—not a new score or proven discovery. Hypothesis-level claim: the bottleneck is often how experience enters the base update path in a layered, isolated, low-frequency way.

**Layered test:** fix \(\mathcal{A}\); A/B/P on the data plane. Failures 4–5 unmet, materialization cost \(\downarrow\), no persistent regression → **§4 scale-up gate** (allows larger runs; ≠ validation; ≠ must-ship). After scale-up still passes → recommend a first-class pipeline module; else withdraw that configuration’s strong form (naming may stop).

**Keywords:** experience admission, proposed admission policy, white-box multi-worker RL, dataflow, falsification

---

## 1. Motivation (scoped)

Three layers are often mixed: **optimizer** (when/how to update; e.g. group-relative methods [2]; single-rollout async optimization [1]), **collaboration** (shared context at interaction time), **admission** (who may *materialize*, how deeply, when \(\theta\) may be touched). Stability \(\neq\) admission: the former asks whether updates diverge on a visible set; the latter asks which trajectories may enter that set and whether/how they are materialized first. IMPALA [5] can still treat “delivered \(\Rightarrow\) learnable.” Shielding [6] constrains actions; CQL [7] constrains offline values—not online materialization/update budgets.

**C1.** With \(\tau^+\) and high-TD-error hazard \(\tau^\ddagger\) in one buffer, PER [3] *allows* \(\tau^\ddagger\) to enter the learner above uniform rate when high-priority (power-law sampling: high quantile does not guarantee a draw, but the mechanism does not exclude hazard uplift)—action shields do not remove it from the train-visible set; delete filters discard analysis value. Gap triad: **P1 budget semantics absent** (pool-default learnable; no default-off materialization), plus P2·P4 / P3 violations. If hazard has *low* TD-error, PER may ignore it—that is “unnoticed,” not policy-level quarantine-with-retention (P2). Sampling weights \(\neq\) admission policy.

**C2/C3.** Stack admission on fixed \(\mathcal{A}\); fingerprints/thresholds are knobs, not results.

---

## 2. Proposed admission policy (not “irreducible discovery”)

**Terms.** *Materialization* = persist a trajectory from a streaming state into an inspectable object; *deep read* = costly analysis on (usually) materialized trajectories (full unrolling, replay, value estimates). They often share an admission-cost budget but are logically separable. For brevity we say *materialization cost* in budget/metrics; when split, materialization is storage-side and deep read is compute-side. \(D_{\mathrm{read}}\) is the set eligible for materialize/deep-read, not the admit-to-update set.

Use the name only if all four are *enforced*; else revert terms. P1–P4 are a **proposed admission policy**, not an established scientific finding.

| | Meaning | vs PER / delete-filter |
|--|---------|------------------------|
| **P1** | Full materialization off by default (explicit quota) | Usually absent |
| **P2** | Quarantine \(\neq\) delete | Usually absent |
| **P3** | Full materialization \(\neq\) admission | Sampled \(\Rightarrow\) learned |
| **P4** | \(D_{\mathrm{adm}}\subsetneq D_{\mathrm{all}}\) when hot nonempty | Reweight-all / action-only |

**Logical interdependence (design-level, not ablation).** Drop P1 → materialization budget vanishes; warm/hot become post-hoc labels \(\approx\) unbudgeted PER + tags (near passive pool)—so P2–P4 alone cannot carry the claimed difference. Drop P2 → delete-or-learn (no analysis track). Drop P3 → \(D_{\mathrm{read}}\equiv D_{\mathrm{adm}}\) \(\approx\) PER/passive pool. Drop P4 → P1–P3 may remain, but when hot is nonempty \(D_{\mathrm{adm}}\subsetneq D_{\mathrm{all}}\) is no longer forced: a hybrid cache with budgets/quarantine/observe–update split, **still distinct from PER**, yet incomplete as a *visible-set* policy. Together they block four distinct collapses; **joint proposal** is warranted. This does **not** replace causal ablations (§5).

LLM curation (filtering / RLAIF / RAFT [9–11]) optimizes pre-batch quality; kept \(\Rightarrow\) update \(\theta\). **High reward \(\neq\) low risk.** Multi-phase exploration (e.g., First Return, Then Explore [4]) targets exploration schedules and coverage, not materialization budgets, quarantine tracks, or enforced \(D_{\mathrm{adm}}\subsetneq D_{\mathrm{all}}\)—orthogonal to this admission policy, not a substitute. Parts, not the same object.

**Honest empirical gap:** no causal ablation of which constraint drives gains vs PER. **H3** (measurable quarantine *utility*) is **exploratory** for the scale-up gate; P2 *execution integrity* (nonempty quarantine must be read/used) is enforced by failure 4(b).

**H\(\leftrightarrow\)P (protocol role):** H1→P1 (**primary**); H2→P2+P4 (**primary**); H3→P2 value magnitude (**exploratory**); H4 (contact frequency / visible-set size, not SGD step size)→P3+P4 (**primary**).

---

## 3. Interface, predicate, contract

Not a full formal system—an interface plus minimal predicates:

\[
\tau \in D_{\mathrm{adm}} \iff \mathrm{Validated}(\tau) \land \lnot\mathrm{HotHazard}(\tau) \land \mathrm{InBudget}(\tau)
\]

with \(\mathrm{HotHazard} \iff (r=\mathrm{hot}\land \ell=\texttt{hazard})\). Interaction: every optimizer batch \(B_t\subseteq D_{\mathrm{adm}}\) (\(\mathcal{A}\) need not “know” admission—only consume a constrained set). \(B_t\not\subseteq D_{\mathrm{adm}}\) is a **contract breach**; if the batch contains hot-hazard, failure 4 also fires.

**Contract:** (1) no hot-hazard in update batches; (2) materialization \(\neq\) write \(\theta\); (3) promotion validated independently of routing score; (4) archive closed by default; warm budgeted; (5) optional curator cannot enlarge allowed sets. Strong form forbids admit-without-materialization as default.

---

## 4. Preregistered falsification

**Arms:** A passive (default materializable / replay); B admission (P1–P4+§3); P optional PER (weights \(\neq\) admission).

**Metrics:** materialization ratio; wall-clock/FLOPs; return; hazard penetration; **materialization gain** = probe return lift or loss drop after materialization (pick one; fixed in plan)—**subset mean/median or preregistered smoothing allowed** to reduce single-trajectory noise; Spearman \(\rho\) vs (aggregated) gain for failure-5 labels only.

**Failures** (\(K\geq 3\) segments; any one rejects the setting):

1. **Warm-mass collapse** — warm **mass** (routing count) \(\geq 90\%\) (or archive+hot \(<10\%\)) **and** materialization improvement vs A \(<5\%\) (conjunction; high mass with clear cost drop does **not** fire).  
2. **No budget gain** — materialization improvement \(<10\%\) **and** wall-clock/FLOPs improvement \(<5\%\) (default **AND**). *Grey zone:* mat. gain in \([5\%,10\%)\) (or \(<5\%\) without firing 1) with wall-clock \(\geq 5\%\) fires neither 1–2 nor meets the scale-up gate (needs \(\geq 10\%\))—no scale-up claim; alternative joint criteria require preregistration.  
3. Persistent regression vs A (preregistered \(\alpha\)/MID).  
4. **Hard (P2 integrity):** (a) any hot-hazard enters \(D_{\mathrm{adm}}\) and updates \(\theta\); **or** (b) quarantine/hot nonempty in-window but never read/deep-read and unused for any preregistered peripheral analysis (“quarantine-to-forget”). (b) N/A if hot empty.  
5. **Hard proxy–gain test** (three clauses; current proxy family only; **any clause firing fails condition 5**—run all three, do not report only passing clauses):  
   - **Correlation:** one-sided Spearman of \(\rho>0\) at preregistered \(\alpha\) (e.g. \(0.05\)); nonsignificant → fires.  
   - **Random baseline:** archive F1/accuracy within preregistered \(\delta\) of a **matched-marginal** i.i.d. random archive labeling → fires.  
   - **Family boundary:** “new family” = *architectural* score change (e.g. entropy→prediction error); retuning thresholds/windows inside the same function = same instance (must retest; cannot rename away a reject). After fail: at most weak post-hoc filtering; no strong-form mix; new family requires fresh preregistration.

**Scale-up gate (≠ validation):** materialization \(\downarrow\geq 10\%\) vs A; failure 3 unmet; failures 4–5 unmet (incl. 4(b)). Allows larger experiments only—does **not** alone entail a first-class module. After scale-up still passes: *then* recommend first-class pipeline module. H3 *value magnitude* still exploratory.

---

## 5. Limitations

No theory; no causal minimality claim; no black-box strong form; no LoRA/GRPO main results; no appendix-as-proof. **Scope boundary:** long-horizon, costly materialization/deep-read, heterogeneous workers; short trajectories / single worker / negligible cost may favor passive pool or PER—even after a pass, designers may decline to ship. Future: ablations; open-weight multi-seed; learnable routers; H3 value metrics beyond 4(b); separate paper for black-box weak form.

---

## 6. Conclusion

Deliverables: name the (white-box) layer; propose **P1–P4** with logical interdependence; give a falsifiable protocol. Scale-up gate ≠ validation and ≠ must-ship; after scale-up still passes, *then* recommend a first-class pipeline module. Whether the hypothesis holds at scale remains open—outside any “already proven” claim.

---

## References

1. Hou et al. *Single-Rollout Asynchronous Optimization for Agentic RL*. arXiv:2607.07508, 2026.  
2. Shao et al. *DeepSeekMath* (GRPO). arXiv:2402.03300, 2024.  
3. Schaul et al. *Prioritized Experience Replay*. ICLR, 2016.  
4. Ecoffet et al. *First Return, Then Explore*. Nature, 2021.  
5. Espeholt et al. *IMPALA*. ICML, 2018.  
6. Alshiekh et al. *Safe RL via Shielding*. AAAI, 2018.  
7. Kumar et al. *Conservative Q-Learning*. NeurIPS, 2020.  
8. Pathak et al. *ICM*. ICML, 2017; Burda et al. *RND*. ICLR, 2019.  
9. Hu et al. Preference data / filtering. arXiv:2406.16486, 2024.  
10. Lee et al. *RLAIF vs. RLHF*. arXiv:2309.00267, 2023.  
11. Dong et al. *RAFT*. TMLR, 2023.  
12. Shen et al. LLM alignment survey. arXiv:2407.16216, 2024.

---

## Submission checklist (authors only; strip before PDF)

- [ ] OpenReview early; NeurIPS 2026 style; ≤4 pages body  
- [ ] Anonymize; disclose LLM writing assistance if required  
- [ ] Primary: SEA — https://sea-workshop.github.io/  
- [ ] **Do not** upload arXiv (author constraint)  
- [x] Page-count check after v0.19 sync — PDF total 4pp; References start p.4; body <4pp (2026-08-03)
