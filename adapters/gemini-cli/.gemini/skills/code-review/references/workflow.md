# Workflow

<!-- 从 SKILL.md 渐进披露拆分 -->

[Workflow]
    [Step 1: Load Comparison Baseline]
        Read Product-Spec.md -> extract all functional requirements within the review scope, list them with numbers
        Read DEV-PLAN.md -> read the delivery checklist and key files for the current Phase or Task
        If Design-Brief.md exists -> read the visual direction and page notes within the review scope
        If design tool MCP exists -> find the design pages corresponding to the review scope through the design tool, read the precise values of those pages and their components as the baseline for UI consistency comparison
        Determine the review scope:
        - Full review (/code-review) -> all Spec features
        - Phase review (triggered by dev-builder Phase completion verification) -> current Phase's delivery checklist
        - Task review (triggered by dev-builder per-Task review) -> current Task's delivery checklist

    [Step 2: Parallel Agent Dispatch] (for moderate/complex changes)
        **Default**: If `change_complexity` is omitted, treat as **simple** (quick aggregator pass only).
        Escalate to moderate/complex only when caller sets it, or change touches multiple modules / new APIs / security-sensitive code.
        For simple changes (typo fix, single-file rename, comment-only, default), skip to [Step 3].
        **Anonymous review packet** (moderate/complex): Remove implementer task description, session handoff, and "I just implemented…" narrative from inputs to specialized agents. Pass: Spec excerpts, DEV-PLAN checklist, affected files list, git diff or file contents, Design-Brief/MCP values. Do **not** pass author identity or prior assistant messages about the change.
        For moderate/complex changes, execute the **4-dimension multi-perspective review**. The decision (which dimensions, what each checks) is platform-agnostic; only the **dispatch mechanism** is platform-specific:
        - **design**: Spec compliance (Functional Completeness, UI Consistency, Spec Drift)
        - **bug**: Bug patterns, null pointers, race conditions, resource leaks
        - **security**: OWASP Top 10, credential leaks, injection, XSS
        - **types**: Type safety, nullability, any/ts-ignore, edge cases
        **How to execute** (concurrent isolated sub-agents on Claude Code vs. single-context sequential passes on Cursor/Gemini CLI) and the **finding contract** (`severity` / `impact` / `confidence 1–5` / `risk_rank` / `evidence`) — see [`references/multi-perspective-dispatch.md`](multi-perspective-dispatch.md). Each dimension returns that contract regardless of execution mode; aggregation in [Step 4] is mode-independent.

    [Step 3: Scan Code Implementation]
        Traverse the project code directory
        Identify: pages/routes, components, API endpoints, database tables, hooks, utility functions
        Build a code map (what features are in which files)

    [Step 4: Aggregation & Confidence Scoring]
        Collect findings from all specialized agents. Apply aggregation rules:

        **Risk ranking (primary sort key)**:
        - Recompute **risk_rank** = severity × impact × confidence (1–5) if any field missing
        - Sort confirmed findings by **risk_rank** descending

        **Confidence thresholding** (legacy 0.0–1.0 or 1–5):
        - confidence >= 0.6 OR confidence_5 >= 4 -> confirmed
        - confidence 0.3-0.6 OR confidence_5 == 3 -> suspected -> meta-review
        - confidence < 0.3 OR confidence_5 <= 2 -> suppress (security may override)

        **Deduplication**: same file + same line range + same category -> keep highest risk_rank

        **Cross-agent boost**: same file+line from >=2 agents at confirmed level -> risk_rank × 1.1 (cap 125)

        **Meta-review (suspected only)**: For each suspected finding, aggregator asks: (1) is there file:line evidence?, (2) does Spec require this?, (3) would a specialist agree? Promote to confirmed (>=0.6), keep suspected, or suppress (<0.3).

        **Compilation verification**: tsc --noEmit

        **Actionability buckets** (confirmed + promoted findings):
        - **Must-fix**: blocks Phase Primary metric, security, or Spec must-have
        - **Should-fix**: quality/maintainability before Phase sign-off
        - **Insight**: architecture/note; no immediate fix required

    [Step 5: Output Aggregated Review Report]
        Format:
        "**Code Review Report**

         **Reference Documents**: Product-Spec.md [+ DEV-PLAN.md Phase N]

         **Agent Coverage**: design [✅/❌] | bug [✅/❌] | security [✅/❌] | types [✅/❌]

         ---

         **Confirmed Issues (X)** — sorted by **risk_rank** (high → low)
         - [risk_rank] [category] [file:line] — description — S/I/C — [agent] — [Must-fix|Should-fix|Insight]

         **Suspected Issues (X)** (confidence 30-60%, flagged for manual review)
         - [category] [file:line] — description — uncertainty reason — [confidence%]

         **Fully Implemented (X items)**
         - [feature name]: [code location] — [verification method] — [100%]

         **Partially Implemented (X items)**
         - [feature name]: [what is missing] — Spec original text: '...' — [confidence%]

         **Not Implemented (X items)**
         - [feature name]: Spec original text: '...' — [100%]

         **Spec Drift (X items)**
         - [description]: code location — no corresponding requirement in Spec — [confidence%]

         **Code Quality**
         - Large files: [list files >300 lines]
         - Type issues: [usage of any/ts-ignore]
         - Compilation result: tsc --noEmit [output]

         ---

         **综合结论 (Chairman synthesis)**
         - Verdict: **可合并 / 先修再审 / 阻塞**
         - Primary metric (if DEV-PLAN Phase): [green / red + command evidence]
         - One paragraph: biggest risk + recommended next action

         **Must-fix (X)** | **Should-fix (X)** | **Insight (X)**
         - List confirmed/promoted items under buckets (file:line — one line each)

         **Priority Classification**
         High: [core functionality missing, security issues — >= 60% confidence]
         Medium: [auxiliary features, UI details, code quality — >= 60% confidence]
         Low: [enhancement suggestions, suspected issues < 60% confidence]"

    Note: This Skill's scope ends at outputting the report. Fixes are routed by the main Agent after receiving the report:
    - Confirmed missing features / non-compliant with Spec -> main Agent invokes dev-builder to fill the gap
    - Bug / security / type issues -> main Agent invokes bug-fixer to fix
    - After fixes are complete, the main Agent re-dispatches code-review starting from Step 1
