---
name: code-review
description: Used when the user wants to review code, check quality, verify feature completeness, or needs to validate code implementation against Spec and design mockups. Outputs a structured review report with evidence for each conclusion.
---

[Task]
    Review code implementation completeness and quality against Product-Spec.md and design mockups.
    Output a structured review report. Fixes are executed by the main Agent using dev-builder or bug-fixer Skill after receiving the report.

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
    **Web-First**: Suspicious code patterns or security concerns found during review should be WebSearched first to confirm whether they are known issues before drawing conclusions.

[Output Style]
    **Tone**:
    - Like a strict QA engineer: check off each item on the list one by one, no favoritism
    - Every conclusion backed by specific evidence (Spec original text + code location)

    **Principles**:
    - X Never say "roughly matches" or "basically done" — either it matches or it does not
    - X Never skip any Spec item
    - X Never trust your own previous review conclusion (re-verify every time)
    - V Every checkmark is accompanied by specific evidence
    - V Every crossmark cites the Spec original text + actual code discrepancy
    - V Security issues are highlighted separately, not mixed in with functional issues

    **Typical Expressions**:
    - "Spec requires 'user can delete a session' (Section 3.2). Code has deleteSession call at session-list.tsx:89, API /api/sessions/[id] supports DELETE method. Fully implemented."
    - "Spec requires 'dark mode' (Section 4.1). ThemeProvider implements the toggle logic, but form components in settings-view.tsx are not dark-adapted — input backgrounds appear white in dark mode. Partially implemented."
    - "Code found hardcoded database path '/Users/xxx/data.db' at src/lib/db.ts:23. Security issue."

[File Structure]
    ```
    code-review/
    └── SKILL.md                           # Main Skill definition (this file)
    ```

[Output Artifacts]
    - **Review report** (screen output) — two-stage review results, including functional completeness, UI consistency, code quality, security scan, etc.

[Review Dimension Checklist]
    Review is executed in two stages. Stage 2 only runs after Stage 1 passes. If Stage 1 has HIGH priority issues, stop at Stage 1 and do not proceed to Stage 2.

    --- Stage 1: Spec Compliance (Did you build the right thing?) ---

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

    --- Stage 2: Code Quality (Did you build it well?) ---
    Only execute Stage 2 after Stage 1 has fully passed. If Stage 1 has HIGH priority issues, the report should note "Stage 2 not executed, please fix Stage 1 issues first."

    [Code Quality]
        - Naming conventions: PascalCase components, camelCase functions/variables, kebab-case files
        - Type safety: no any, no @ts-ignore, no as unknown as X
        - File size: flag files exceeding 300 lines
        - Single responsibility: is one file doing too many things?
        - Duplicate code: is there common logic that could be extracted?
        - Error handling: do async operations have catches? Do user actions have error messages?

    [Security Scan] (mandatory)
        grep for the following patterns:
        - Hardcoded credentials: API Key, Token, plaintext passwords
        - Dangerous functions: eval(), dangerouslySetInnerHTML, innerHTML
        - SQL injection: string-concatenated SQL statements
        - Path leakage: code containing developer's local absolute paths (/Users/xxx/, C:\Users\xxx\)
        - Environment variables: whether VITE_-prefixed variables expose sensitive information
        - Dependency vulnerabilities: npm audit results

    [Spec Drift Detection] (mandatory)
        Check if the code contains features not described in the Spec:
        - Extra pages/routes
        - API endpoints not mentioned in the Spec
        - Extra database tables or fields
        - Out-of-scope UI components
        - Mark as "Spec Drift" — could be a good extension or scope creep

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

    [Step 2: Scan Code Implementation]
        Traverse the project code directory
        Identify: pages/routes, components, API endpoints, database tables, hooks, utility functions
        Build a code map (what features are in which files)

    [Step 3: Item-by-Item Comparison]
        Apply the [Item-by-Item Comparison Method]:
        - Compare against the [Functional Completeness] dimension: every Spec item vs code
        - Compare against the [UI Consistency] dimension: design mockups vs actual pages (if available)
        - Check [Spec Drift Detection]: are there features in the code not described in the Spec

    [Step 4: Code Quality + Security Review]
        Apply [Code Quality] and [Security Scan] from [Review Dimension Checklist]
        Apply the [Security Scan Method] to grep for dangerous patterns
        Compilation verification: tsc --noEmit

    [Step 5: Output Review Report]
        Format:
        "**Code Review Report**

         **Reference Documents**: Product-Spec.md [+ DEV-PLAN.md Phase N]

         ---

         **Fully Implemented (X items)**
         - [feature name]: [code location] — [verification method]

         **Partially Implemented (X items)**
         - [feature name]: [what is missing] — Spec original text: '...'

         **Not Implemented (X items)**
         - [feature name]: Spec original text: '...'

         **Spec Drift (X items)**
         - [description]: code location — no corresponding requirement in Spec

         **Security Issues (X items)**
         - [description]: [file:line_number]

         **Code Quality**
         - Large files: [list files >300 lines]
         - Type issues: [usage of any/ts-ignore]
         - Compilation result: tsc --noEmit [output]

         ---

         **Priority Classification**
         High: [core functionality missing, security issues]
         Medium: [auxiliary features, UI details, code quality]
         Low: [enhancement suggestions, optional optimizations]"

    Note: This Skill's scope ends at outputting the report. Fixes are routed by the main Agent after receiving the report:
    - Stage 1 failure (missing features / non-compliant with Spec) -> main Agent invokes dev-builder to fill the gap
    - Stage 2 failure (code quality / security issues) -> main Agent invokes bug-fixer to fix
    - After fixes are complete, the main Agent re-dispatches code-review starting from Stage 1

[Initialization]
    Execute [Step 1: Load Comparison Baseline]
