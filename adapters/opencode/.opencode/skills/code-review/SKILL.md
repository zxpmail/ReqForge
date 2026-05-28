<!-- forge: code-review v1.0 -->
---
name: code-review
description: Used when the user wants to review code, check quality, verify feature completeness, or needs to validate code implementation against Spec and design mockups. Outputs a structured review report with evidence for each conclusion.
version: 1.0.0
updated: 2026-05-26
requires: []
---

<!-- begin: task -->
[Task]
    Review code implementation completeness and quality against Product-Spec.md and design mockups.
    Output a structured review report. Fixes are executed by the main Agent using dev-builder or bug-fixer Skill after receiving the report.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Fixing bugs -> use /bug-fixer instead
    - Writing new features -> use /dev-builder instead
    - Requirements gathering -> use /product-spec-builder instead

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Automatically executed as the first step when the Skill starts:

    Required:
    - Product-Spec.md -> if missing, prompt to call /product-spec-builder first
    - Project code exists -> if no code, prompt to call /dev-builder first

    Optional (enhances review capability):
    - `.forge/security-guidance.md` -> if present, **must read** for moderate/complex reviews or when `code-reviewer-security` runs; team rules override generic OWASP guesses
    - DEV-PLAN.md -> if available, cross-reference Phase delivery checklist
    - Design-Brief.md -> if available, cross-reference visual specifications
    - Design tool MCP (Pencil / Figma, etc.) -> if available, extract design values and compare with code
    - Playwright plugin -> if available, automate UI interaction testing
    - git -> if available, use git diff to trace change scope

<!-- end: dependency-check -->
<!-- begin: behavior-rules-—-karpathy-discipline -->
[Behavior Rules — Karpathy Discipline]
    Review 期间须检查以下两条 Karpathy 原则的执行情况：
    **Surgical Changes** — 每行改动是否直接追溯到用户请求或 Spec 条目？存在"顺手改动"吗？
    **Simplicity First** — 实现是否过度工程？存在不需要的抽象/配置/灵活度吗？

    完整说明 + ❌→✅ 示例 → `core/docs/behavior-rules.md`

<!-- end: behavior-rules-—-karpathy-discipline -->
<!-- begin: first-principles -->
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

    **Risk ranking (jobs-style rubric)**: See [jobs-comparison.md](../../docs/jobs-comparison.md). Each finding uses **severity / impact / confidence** (1–5) and **risk_rank = S×I×C**. Aggregator sorts confirmed findings by risk_rank; Top items drive Must-fix vs Should-fix.

    **Web-First**: Suspicious code patterns or security concerns found during review should be WebSearched first to confirm whether they are known issues before drawing conclusions.

<!-- end: first-principles -->
<!-- begin: output-style -->
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

<!-- end: output-style -->
<!-- begin: file-structure -->
[File Structure]
    ```
    code-review/
    ├── SKILL.md                           # Main Skill definition (this file)
    └── references/
        ├── review-dimension-checklist.md  # Design/bug/security/types review dimensions
        ├── review-strategy.md             # Item-by-item, design value, Playwright, security scan methods
        └── workflow.md                    # Load baseline, dispatch, scan, aggregate, output report
    ```

<!-- end: file-structure -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **Review report** (screen output) — parallel agent review results with aggregated findings: functional completeness, UI consistency, code quality, security scan, etc.

<!-- end: output-artifacts -->
<!-- begin: judgment-spectrum -->
[Judgment Spectrum] (Tencent Harness mirror — see [tencent-harness-mirror-comparison.md](../../docs/tencent-harness-mirror-comparison.md))
    Route each finding to the right tier — do not collapse "good" into a single score:

    | Tier | What | Forge artifact |
    |------|------|----------------|
    | S1 | Machine-checkable | `forge-verify`, tests, linters |
    | S2 | Spec acceptance clauses | `Product-Spec.md`, Phase checklist |
    | S3 | Team taste / preferences | `.forge/project-taste.md` |
    | S4 | Contextual tradeoffs | This review + `memory/decisions-log.md` |
    | S5 | Strategy, values, pure aesthetics | Human only — note disagreement, do not auto-fix |

    **Adversarial review (石碑②):** implementer context ≠ reviewer context — specialized sub-agents must challenge, not rubber-stamp.
    If `.forge/project-taste.md` exists, cite taste violations as S3 (preference drift), not S1 failures.

<!-- end: judgment-spectrum -->
<!-- begin: review-dimension-checklist -->
[Review Dimension Checklist]
    For moderate/complex changes, review runs via 4 parallel specialized agents (see [Workflow] Step 2). Each agent owns a dimension set below. For simple changes (`change_complexity="simple"`), the aggregator runs a quick quality pass only.

    **按步执行** references/review-dimension-checklist.md

<!-- end: review-dimension-checklist -->
<!-- begin: gotchas -->
[Gotchas]
    **Surface-level review**: Reading code without cross-referencing the Spec. Every line of code must be traceable to a Spec item. If it's not in the Spec, flag it as drift.
    **Evidence-less conclusions**: Saying "looks good" without file:line evidence. Every finding needs a concrete location. "Looks good" is not a review finding — it's a skipped step.
    **Confidence inflation**: Defaulting to 100% on every finding defeats the purpose. Be honest about uncertainty — if you only scanned the file briefly or the code path is complex, lower the confidence accordingly. A finding at 70% with clear uncertainty documentation is more useful than a finding falsely claimed at 100%.
    **Regression blind spot**: Only reviewing changed files without checking what depends on them. Use `dep-graph affected <file>` if available to scope impact.
    **Skipping compilation verification**: "It's just a style change" → style files can break. Run compilation verification every time.

<!-- end: gotchas -->
<!-- begin: anti-rationalization-checklist -->
[Anti-Rationalization Checklist]

    | Rationalization | Reality |
    |---|---|
    | "The change is small, just a quick glance" | Review is not based on change size; item-by-item comparison is the minimum bar |
    | "I already reviewed this before" | Re-verify every time, do not trust previous conclusions. Code may have changed |
    | "This feature was not modified, no need to review" | Unmodified code can still be broken by changes in its context |
    | "Everything looks normal" | "Normal" is not evidence; every conclusion needs file_path:line_number |
    | "Other features should not be affected" | "Should" equals not verified; regression test scope must be explicit |
    | "This code is standard" | Standard or not depends on whether it deviates from the Spec |
    | "This project is small, there won't be security issues" | Small projects are more prone to security vulnerabilities |
    | "I didn't write any SQL" | Security issues are not just SQL injection (XSS, path leakage, hardcoded credentials) |
    | "I only changed styles, no need to compile" | Style files can also cause compilation errors (Tailwind config, CSS Modules references) |
    | "The change is small, compilation will definitely pass" | Compilation is a gate; run it every time |

<!-- end: anti-rationalization-checklist -->
<!-- begin: review-strategy -->
[Review Strategy]
    Methodology during the review process.

    **按步执行** references/review-strategy.md

[Workflow] — see [Review Strategy] for review methodology.
    **按步执行** references/workflow.md

<!-- end: review-strategy -->
<!-- begin: yolo-mode -->
[YOLO Mode]
    When FORGE_MODE=yolo, the review report is written to file instead of blocking:

    **Step 5 (Output Review Report)** -> Write `changes/review-report.md`:
        Same structured report format. Append to existing file if one exists.
        The main Agent proceeds to fixes automatically without waiting for user confirmation.

<!-- end: yolo-mode -->
<!-- begin: initialization -->
[Initialization]
    Execute [Step 1: Load Comparison Baseline]

<!-- end: initialization -->