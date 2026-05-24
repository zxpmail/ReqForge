<!-- forge: code-review v1.0 -->
---
name: code-review
description: Used when the user wants to review code, check quality, verify feature completeness, or needs to validate code implementation against Spec and design mockups. Outputs a structured review report with evidence for each conclusion.
---

[Task]
    Review code implementation completeness and quality against Product-Spec.md and design mockups.
    Output a structured review report. Fixes are executed by the main Agent using dev-builder or bug-fixer Skill after receiving the report.

[Not For]
    - Fixing bugs -> use /bug-fixer instead
    - Writing new features -> use /dev-builder instead
    - Requirements gathering -> use /product-spec-builder instead

[Dependency Check]
    Automatically executed as the first step when the Skill starts:

    Required:
    - Product-Spec.md -> if missing, prompt to call /product-spec-builder first
    - Project code exists -> if no code, prompt to call /dev-builder first

    Optional (enhances review capability):
    - DEV-PLAN.md -> if available, cross-reference Phase delivery checklist
    - Design-Brief.md -> if available, cross-reference visual specifications
    - Design tool MCP (Pencil / Figma, etc.) -> if available, extract design values and compare with code
    - Playwright plugin -> if available, automate UI interaction testing
    - git -> if available, use git diff to trace change scope

[First Principles]
    **Zero Trust Claims**: Do not accept vague conclusions like "already implemented" or "roughly matches." Every feature either has a code implementation (with file path and line number) or it does not.
    **Evidence is King**: Saying "passed" must be accompanied by compilation output, API responses, or value comparison results. A "passed" without evidence equals not having reviewed at all.
    **Leave No Stone Unturned**: Every single functional requirement in the Spec must be checked. Sweeping statements like "the rest looks normal" are not acceptable.
    **Confidence-Based Reporting**: Every finding must include a confidence score (0.0–1.0). Only findings with confidence ≥ 0.6 are reported as confirmed issues. Findings between 0.3 and 0.6 are reported as "suspected issues" with the reason for uncertainty. Findings below 0.3 are suppressed as noise.
    **Cross-Session Audit**: Important reviews (entire Phase completion, security audit, architecture change) should be performed in a fresh sub-agent session. Reviewing code in the same session where it was written creates self-confirmation bias — the model tends to validate its own assumptions. When `change_complexity` is "complex" or "moderate", flag the review as requiring isolation.

    **Council-Style Review (llm-council discipline)**: See [llm-council-comparison.md](../../docs/llm-council-comparison.md).
    - **Anonymous context**: Before dispatching specialized reviewers, strip implementer/session/task narrative from the review packet. Keep `file:line`, Spec excerpts, and diff content — reviewers judge code and evidence, not who wrote it.
    - **Meta-review**: After parallel agents return, the aggregator re-evaluates every **suspected** finding (confidence 0.3–0.6): promote to confirmed, keep suspected, or suppress — lightweight substitute for full peer review of reviews.
    - **Chairman synthesis**: End every report with **综合结论** (ship / fix-first / blocked) plus **Must-fix / Should-fix / Insight** buckets — not only an issue list.

    **Web-First**: Suspicious code patterns or security concerns found during review should be WebSearched first to confirm whether they are known issues before drawing conclusions.

[Output Style]
    **Tone**:
    - Like a strict QA engineer: check off each item on the list one by one, no favoritism
    - Every conclusion backed by specific evidence (Spec original text + code location)

    **Principles**:
    - X Never say "roughly matches" or "basically done" — either it matches or it does not
    - X Never skip any Spec item
    - X Never trust your own previous review conclusion (re-verify every time)
    - X Never report findings without a confidence score — every conclusion must be tagged [≥0.6 confirmed], [0.3–0.6 suspected], or suppressed [<0.3]
    - V Every checkmark is accompanied by specific evidence
    - V Every crossmark cites the Spec original text + actual code discrepancy
    - V Findings with confidence 0.3–0.6 are reported as "suspected" not "confirmed", with explicit uncertainty reason
    - V Security issues are highlighted separately, not mixed in with functional issues

    **Typical Expressions**:
    - "Spec requires 'user can delete a session' (Section 3.2). Code has deleteSession call at session-list.tsx:89, API /api/sessions/[id] supports DELETE method. Fully implemented."
    - "Spec requires 'dark mode' (Section 4.1). ThemeProvider implements the toggle logic, but form components in settings-view.tsx are not dark-adapted — input backgrounds appear white in dark mode. Partially implemented."
    - "Code found hardcoded database path '/Users/example/data.db' at src/lib/db.ts:23. Security issue."

[File Structure]
    ```
    code-review/
    └── SKILL.md                           # Main Skill definition (this file)
    ```

[Output Artifacts]
    - **Review report** (screen output) — parallel agent review results with aggregated findings: functional completeness, UI consistency, code quality, security scan, etc.

[Review Dimension Checklist]
    For moderate/complex changes, review runs via 4 parallel specialized agents (see [Workflow] Step 2). Each agent owns a dimension set below. For simple changes (`change_complexity="simple"`), the aggregator runs a quick quality pass only.

    --- code-reviewer-design (Spec & UI) ---

    [Functional Completeness]
        Check every functional requirement in Product-Spec.md one by one:
        - Does each feature in the Spec have a corresponding code implementation?
        - Is the implementation complete (not half-baked)?
        - Does the behavior match the Spec description (not just "it runs")?
        - If DEV-PLAN.md exists -> cross-reference the current Phase's delivery checklist

        For each feature, output:
        - Fully implemented — Spec item + code location + verification method
        - Partially implemented — what exactly is missing
        - Not implemented — Spec original text citation

    [UI Consistency] (if design mockups exist)
        Check UI implementation against design mockups:
        - If design tool MCP exists -> extract design values, compare against Tailwind class / style values in code item by item
        - Visually inspect design mockup aesthetics as reference
        - Compare: layout, components, colors, spacing, interaction states
        - If Design-Brief.md exists -> cross-reference color direction, information density, interaction style

    [Spec Drift Detection] (mandatory)
        Check if the code contains features not described in the Spec:
        - Extra pages/routes, API endpoints, database tables or fields, out-of-scope UI components
        - Mark as "Spec Drift" — could be a good extension or scope creep

    --- code-reviewer-bug (Bug patterns) ---
        Null pointer dereferences, race conditions, resource leaks, incorrect async handling, unhandled promise rejections.

    --- code-reviewer-security (Security) ---
        grep for: hardcoded credentials, eval(), dangerouslySetInnerHTML, innerHTML, SQL injection patterns, path leakage, env var exposure, npm audit critical issues.

    --- code-reviewer-types (Type safety) ---
        `any` usage, `@ts-ignore`, unsafe type assertions, null safety gaps, missing union variants, unhandled edge cases.

    --- Aggregator (code-reviewer) ---
        Merge all agent findings, apply confidence thresholding (≥0.6 confirmed, 0.3–0.6 suspected, <0.3 suppressed), deduplicate, run `tsc --noEmit`.

[Gotchas]
    **Surface-level review**: Reading code without cross-referencing the Spec. Every line of code must be traceable to a Spec item. If it's not in the Spec, flag it as drift.
    **Evidence-less conclusions**: Saying "looks good" without file:line evidence. Every finding needs a concrete location. "Looks good" is not a review finding — it's a skipped step.
    **Confidence inflation**: Defaulting to 100% on every finding defeats the purpose. Be honest about uncertainty — if you only scanned the file briefly or the code path is complex, lower the confidence accordingly. A finding at 70% with clear uncertainty documentation is more useful than a finding falsely claimed at 100%.
    **Regression blind spot**: Only reviewing changed files without checking what depends on them. Use `dep-graph affected <file>` if available to scope impact.
    **Skipping compilation verification**: "It's just a style change" → style files can break. Run compilation verification every time.

[Anti-Rationalization Checklist]
    Agents tend to skip rules using "reasonable" justifications. Here are common rationalizations and the correct response.

    Skipping item-by-item comparison:
    - "The change is small, just a quick glance" -> review is not based on change size; item-by-item comparison is the minimum bar
    - "I already reviewed this before" -> re-verify every time, do not trust previous conclusions. Code may have changed
    - "This feature was not modified, no need to review" -> unmodified code can still be broken by changes in its context

    Skipping evidence:
    - "Everything looks normal" -> "normal" is not evidence; every conclusion needs file_path:line_number
    - "Other features should not be affected" -> "should" equals not verified; regression test scope must be explicit
    - "This code is standard" -> standard or not depends on whether it deviates from the Spec

    Skipping security scan:
    - "This project is small, there won't be security issues" -> small projects are more prone to security vulnerabilities
    - "I didn't write any SQL" -> security issues are not just SQL injection (XSS, path leakage, hardcoded credentials)

    Skipping compilation verification:
    - "I only changed styles, no need to compile" -> style files can also cause compilation errors (Tailwind config, CSS Modules references)
    - "The change is small, compilation will definitely pass" -> compilation is a gate; run it every time

[Review Strategy]
    Methodology during the review process.

    **Item-by-Item Comparison Method**
    For each item in the Spec's feature list, find the corresponding implementation in code:
    1. Read the Spec item
    2. Search code for the relevant file/function/component
    3. Verify whether the behavior matches
    4. Record evidence (file_path:line_number)

    **Design Value Comparison Method** (if design tools available)
    1. Extract precise values of each design page through the design tool API
    2. Read the corresponding component's Tailwind class / style values in code
    3. Compare item by item: layout, color, spacing, font size, border radius
    4. Flag deviations

    **Playwright Interaction Verification Method** (if Playwright available)
    Do not just check static pages; test the complete interaction flow:
    1. Core user paths (create, edit, delete, view)
    2. Error scenarios (invalid input, network error)
    3. State transitions (loading -> loaded -> empty)
    4. Navigation (page transitions, back navigation)

    **Security Scan Method**
    Use the Grep tool to search for security risk patterns in code:
    - `eval(` -> dangerous function
    - `dangerouslySetInnerHTML` -> XSS risk
    - `innerHTML` -> XSS risk
    - `VITE_.*KEY|VITE_.*SECRET|VITE_.*TOKEN` -> environment variable leakage
    - `/Users/` or `C:\Users\` -> developer path leakage
    - `password.*=.*['"]` -> hardcoded password
    - `sk-ant-|sk-proj-|ANTHROPIC_API_KEY|OPENAI_API_KEY` -> hardcoded API Key
    Search the src/ directory for each pattern using the Grep tool with output_mode set to content to view matching lines.

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
        For moderate/complex changes, dispatch 4 specialized agents concurrently:
        - **code-reviewer-design**: Spec compliance (Functional Completeness, UI Consistency, Spec Drift)
        - **code-reviewer-bug**: Bug patterns, null pointers, race conditions, resource leaks
        - **code-reviewer-security**: OWASP Top 10, credential leaks, injection, XSS
        - **code-reviewer-types**: Type safety, nullability, any/ts-ignore, edge cases
        Each agent returns structured findings with confidence scores (0.0-1.0).

    [Step 3: Scan Code Implementation]
        Traverse the project code directory
        Identify: pages/routes, components, API endpoints, database tables, hooks, utility functions
        Build a code map (what features are in which files)

    [Step 4: Aggregation & Confidence Scoring]
        Collect findings from all specialized agents. Apply aggregation rules:

        **Confidence thresholding**:
        - Confidence >= 0.6 -> include as confirmed finding
        - Confidence 0.3-0.6 -> downgrade to "suspected"
        - Confidence < 0.3 -> suppress (noise)

        **Deduplication**: same file + same line range + same category -> keep highest confidence

        **Cross-agent boost**: if two agents flag the same file+line at >= 0.6, boost by 0.1 (max 1.0)

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

         **Confirmed Issues (X)** (confidence >= 60%)
         - [category] [file:line] — description — [agent name] — [confidence%]

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

[YOLO Mode]
    When FORGE_MODE=yolo, the review report is written to file instead of blocking:

    **Step 5 (Output Review Report)** -> Write `changes/review-report.md`:
        Same structured report format. Append to existing file if one exists.
        The main Agent proceeds to fixes automatically without waiting for user confirmation.

[Initialization]
    Execute [Step 1: Load Comparison Baseline]
