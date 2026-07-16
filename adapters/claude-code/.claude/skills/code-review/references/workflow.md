# Workflow

<!-- 从 SKILL.md 渐进披露拆分 — 本文件为 Step 唯一源；agents 不得另写并行 Workflow -->

[Workflow]
    [Step 1: Load Comparison Baseline]
        Read Product-Spec.md -> extract all functional requirements within the review scope, list them with numbers
        Read DEV-PLAN.md -> read the delivery checklist and key files for the current Phase or Task
        Read `.forge/dev-map.md` (if present) -> tech stack + preferred verify/compile commands
        If `.forge/code-standards/<language>.md` exists for the stack language(s) -> load for dimension checks
        If DESIGN.md exists -> read frozen tokens (`colors`, `typography`, `components`) and Do's and Don'ts as the primary UI value baseline
        If Design-Brief.md exists -> read the visual direction and page notes within the review scope (direction when DESIGN.md absent)
        If design tool MCP exists -> find the design pages corresponding to the review scope through the design tool, read the precise values of those pages and their components (supplements DESIGN.md when both exist)
        **No-UI projects**: skip DESIGN.md / Design-Brief / design MCP / UI Consistency checks (see surface-routing); still review Spec + code quality dimensions
        Determine the review scope:
        - Full review (/code-review) -> all Spec features
        - Phase review (triggered by dev-builder Phase completion verification) -> current Phase's delivery checklist
        - Task review (triggered by dev-builder per-Task review) -> current Task's delivery checklist

    [Step 2: Parallel Agent Dispatch] (for moderate/complex changes)
        **Default**: If `change_complexity` is omitted, treat as **simple** (skip this Step's multi-perspective dispatch; still run Step 3 → Step 4 quick pass).
        Escalate to moderate/complex only when caller sets it, or change touches multiple modules / new APIs / security-sensitive code.
        For simple changes (typo fix, single-file rename, comment-only, default), **skip Step 2** and continue at [Step 3].
        **Anonymous review packet** (moderate/complex): Remove implementer task description, session handoff, and "I just implemented…" narrative from inputs to specialized agents. Pass: Spec excerpts, DEV-PLAN checklist, affected files list, git diff or file contents, DESIGN.md tokens (if present), Design-Brief/MCP values. Do **not** pass author identity or prior assistant messages about the change.
        For moderate/complex changes, execute the **4-dimension multi-perspective review**. The decision (which dimensions, what each checks) is platform-agnostic; only the **dispatch mechanism** is platform-specific:
        - **design**: Spec compliance (Functional Completeness, UI Consistency when UI exists, Spec Drift)
        - **bug**: Bug patterns, null pointers, race conditions, resource leaks, obvious performance (N+1, unbounded loops)
        - **security**: OWASP Top 10, credential leaks, injection, XSS
        - **types**: Type safety / nullability / edge cases (language-aware — see types agent)
        **How to execute** (Mode A parallel isolated sub-agents by default on target platforms; Mode B sequential fallback) and the **finding contract** (`severity` / `impact` / `confidence` each **1–5** / `risk_rank` / `evidence`) — see [`multi-perspective-dispatch.md`](multi-perspective-dispatch.md). Aggregation in [Step 4] is mode-independent.

    [Step 3: Scan Code Implementation]
        Traverse the project code directory (or affected_files when scoped)
        Identify: pages/routes, components, API endpoints, database tables, hooks, utility functions
        Build a code map (what features are in which files)
        Simple reviews: aggregator performs a quick quality pass here (no specialist agents)

    [Step 4: Aggregation & Confidence Scoring]
        Collect findings from specialized agents (or from Step 3 quick pass). Apply aggregation rules:

        **Canonical scoring**: every finding uses **severity / impact / confidence on 1–5**. `risk_rank` = S × I × C (max 125).
        Do **not** invent parallel labels (`critical/major/minor`, free-text HIGH) on findings — map those to 1–5 if an older source emits them (5/3/1).

        **Risk ranking (primary sort key)**:
        - Recompute **risk_rank** = severity × impact × confidence (1–5) if any field missing
        - Sort confirmed findings by **risk_rank** descending

        **Confidence thresholding** (canonical = 1–5; legacy 0.0–1.0 only if specialist omitted 1–5):
        - confidence_5 >= 4 (or legacy >= 0.6) -> confirmed
        - confidence_5 == 3 (or legacy 0.3–0.6) -> suspected -> meta-review
        - confidence_5 <= 2 (or legacy < 0.3) -> suppress (security may override)

        **Deduplication**: same file + same line range + same category -> keep highest risk_rank

        **Cross-agent boost**: same file+line from >=2 agents at confirmed level -> risk_rank × 1.1 (cap 125)

        **Meta-review (suspected only)**: For each suspected finding, aggregator asks: (1) is there file:line evidence?, (2) does Spec require this?, (3) would a specialist agree? Promote to confirmed (confidence_5 >= 4), keep suspected, or suppress (confidence_5 <= 2).

        **Compilation / verify gate** (language-aware — never assume TypeScript):
        1. Prefer `pnpm forge-verify` (or project equivalent) when available
        2. Else use compile/typecheck command from `.forge/dev-map.md` tech stack
        3. Fallbacks by stack: TS/JS → `tsc --noEmit` / `pnpm exec tsc --noEmit`; Python → `python -m compileall` or project lint; Java → `mvn -q compile` / `gradle compileJava`; Go → `go build ./...`; other → document "verify skipped: no command known"

        **Actionability buckets** (confirmed + promoted findings):
        - **Must-fix**: blocks Phase Primary metric, security, or Spec must-have
        - **Should-fix**: quality/maintainability before Phase sign-off
        - **Insight**: architecture/note; no immediate fix required

        **`action` orthogonality** — each finding also carries `action` (`auto-fix|ask-user|no-op`, orthogonal to the buckets above: buckets = *how important*, `action` = *who fixes*). Assign per [`../../_shared/finding-actions.md`](../../_shared/finding-actions.md). A Must-fix can be `ask-user` (blocks ship AND needs a human decision).

        **Priority (derived — do not score independently)**:
        - **HIGH** if any confirmed Must-fix
        - **MEDIUM** if any confirmed Should-fix and no Must-fix
        - **LOW** otherwise (Insight-only or clean)

    [Step 5: Output Aggregated Review Report]
        Format:
        "**Code Review Report**

         **Reference Documents**: Product-Spec.md [+ DEV-PLAN.md Phase N]

         **Agent Coverage**: design [✅/❌/skipped-simple] | bug […] | security […] | types […]

         ---

         **Confirmed Issues (X)** — sorted by **risk_rank** (high → low)
         - [risk_rank] [category] [file:line] — description — S/I/C (1–5) — [agent] — [Must-fix|Should-fix|Insight] — [action: auto-fix|ask-user|no-op]

         **Suspected Issues (X)** (confidence_5 == 3, flagged for manual review)
         - [category] [file:line] — description — uncertainty reason — [confidence_5]

         **Fully Implemented (X items)**
         - [feature name]: [code location] — [verification method]

         **Partially Implemented (X items)**
         - [feature name]: [what is missing] — Spec original text: '...'

         **Not Implemented (X items)**
         - [feature name]: Spec original text: '...'

         **Spec Drift (X items)**
         - [description]: code location — no corresponding requirement in Spec

         **Code Quality**
         - Large files: [list files >300 lines]
         - Type / null-safety issues: [summary]
         - Verify result: [command used] [output]

         ---

         **综合结论 (Chairman synthesis)**
         - Verdict: **可合并 / 先修再审 / 阻塞**
         - Primary metric (if DEV-PLAN Phase): [green / red + command evidence]
         - One paragraph: biggest risk + recommended next action

         **Must-fix (X)** | **Should-fix (X)** | **Insight (X)**
         - List confirmed/promoted items under buckets (file:line — one line each)

         **Priority** (derived from buckets above): HIGH | MEDIUM | LOW"

    Note: This Skill's scope ends at outputting the report. Fixes are routed by the main Agent after receiving the report, **filtered by each finding's `action`** ([`../../_shared/finding-actions.md`](../../_shared/finding-actions.md)):
    - `auto-fix` only — Confirmed missing features / non-compliant with Spec -> main Agent invokes dev-builder to fill the gap; Bug / security / type issues -> main Agent invokes bug-fixer to fix
    - `ask-user` -> escalate to the human immediately (**never auto-fixed**); dev-builder sets `.forge/.retry-counter.json` `state=escalated` and surfaces the A/B/C options without consuming a retry round
    - `no-op` -> informational only; logged in the report, not routed
    - After `auto-fix` fixes are complete, the main Agent re-dispatches code-review starting from Step 1
