# Review Dimension Checklist

<!-- 从 SKILL.md 渐进披露拆分 -->

[Review Dimension Checklist]

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

    [Test & Evidence Validity] (mandatory — six bans, definitions in `../_shared/acceptance-evidence.md`)
        For each acceptance claim (test, verify output, evidence file):
        - Where does the expected value come from? (Spec literal / Primary metric / evidence content — a number with no source = invented)
        - Is the result read back via an independent path (re-run, re-read, query), or only via the write call's own return value / the agent's self-report?
        Ban list — each hit invalidates the acceptance:
        1. Existence-only assertion posing as acceptance (compiles/200/file-exists as the only check)
        2. Mocking the domain under test
        3. Assertion mirroring the implementation instead of the Spec (expectations written after reading the code)
        4. Write-then-self-verify (no independent read-back)
        5. Expected value edited to fit the implementation (correct: red-line → fix implementation; same semantics different form → fix Spec; true gap → ask user)
        6. Irreversible action (S1) with no negative case (bad input → rejected, reason verbatim)
        Flag each hit as "Invalid Acceptance" with file:line — Must-fix.

    [UI Consistency] (only if the product has UI — DESIGN.md, design mockups, or Design-Brief)
        Skip entirely for no-UI / API-only / CLI-only surfaces.
        Check UI implementation against design baseline (priority: DESIGN.md > design tool MCP > Design-Brief.md):
        - If DESIGN.md exists -> compare Tailwind classes / CSS variables / inline styles against YAML `colors`, `typography`, and `components` tokens; flag ad-hoc hex/spacing not in token map
        - If design tool MCP exists -> extract design values, compare against code item by item
        - Visually inspect design mockup aesthetics as reference
        - Compare: layout, components, colors, spacing, interaction states
        - If Design-Brief.md exists and DESIGN.md absent -> cross-reference color direction, information density, interaction style

    [Spec Drift Detection] (mandatory)
        Check if the code contains features not described in the Spec:
        - Extra pages/routes, API endpoints, database tables or fields, out-of-scope UI components
        - Mark as "Spec Drift" — could be a good extension or scope creep

    [Surgical Changes Audit] (mandatory for diff review)
        Check every changed line against the original request scope:
        - Does each changed line trace directly to the user's request or a Spec item?
        - Are there formatting/comment/style changes unrelated to the request? (violation)
        - Are there "drive-by refactors" that clean up adjacent code? (violation)
        - Was pre-existing dead code removed? (violation — mention only, don't delete)
        - Only YOUR changes' orphans (unused imports/vars) are legitimately removed

        Track every violating line with file:line — flag as "Surgical Violation" in review report.

    [Simplicity First Audit] (mandatory for diff review)
        Check if the implementation is over-engineered for the actual requirement:
        - Speculative abstractions (Strategy/Factory/interface for single-use code)
        - Error handling for impossible scenarios (defensive checks for conditions that can't happen)
        - "Flexibility" / "configurability" that wasn't requested
        - Code that's 200+ lines when 50 would do

        Flag each instance with file:line + why it's over-engineering.

    --- code-reviewer-bug (Bug patterns + obvious performance) ---
        Null pointer dereferences, race conditions, resource leaks, incorrect async handling, unhandled promise rejections.
        Performance (lightweight, no separate agent): N+1 query loops, unbounded in-memory collections, sync I/O on hot paths, unnecessary full-list re-renders when identifiable from diff.

    --- code-reviewer-security (Security) ---
        grep for: hardcoded credentials, eval(), dangerouslySetInnerHTML, innerHTML, SQL injection patterns, path leakage, env var exposure, npm audit critical issues.
        Also consider CSRF on state-changing endpoints when web UI + cookie auth is in scope.

    --- code-reviewer-types (Type safety — language-aware) ---
        Read `.forge/dev-map.md` stack first.
        - **TS/JS**: `any`, `@ts-ignore`/`@ts-nocheck`, unsafe assertions, null safety gaps, missing union variants
        - **Python**: missing/incorrect type hints on public APIs, `Any` abuse, untyped dict sprawl
        - **Java/Kotlin**: raw types, ignored nullability (`@Nullable`/`Optional`), empty catch
        - **Go**: ignored errors, nil deref risk, overly broad interfaces
        - **Other**: apply `.forge/code-standards/<language>.md` if present; otherwise community null/error conventions

    --- Aggregator (code-reviewer) ---
        Merge all agent findings. Each finding MUST include severity, impact, confidence (each **1–5**) and **risk_rank = S×I×C**.
        Sort confirmed findings by risk_rank descending. Apply confidence thresholding (confidence_5 ≥ 4 confirmed; == 3 suspected; ≤ 2 suppress), deduplication, cross-agent risk_rank boost, meta-review on suspected, Must-fix/Should-fix/Insight buckets. Derive Priority from buckets. Run language-aware verify gate (see `workflow.md` Step 4) — not hardcoded `tsc`.
