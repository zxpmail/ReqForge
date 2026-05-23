<!-- forge: bug-fixer v1.0 -->
---
name: bug-fixer
description: Used when the user says "this feature is broken", "getting an error", "something's not right", or reports a bug, compilation error, or runtime exception. Locates root cause through a four-stage systematic debugging process and fixes it.
---

[Task]
    Locate the root cause of bugs through a systematic debugging process and fix them.
    Fix one problem at a time. Assess impact before each modification. Verify regression after fix.

[Invocation Context]
    bug-fixer may be called in two scenarios:
    1. User directly reports a bug -> main Agent invokes bug-fixer -> after fix, suggest user run /code-review to verify
    2. code-review finds confirmed bug/security/type issues (confidence ≥ 0.6) -> main Agent invokes bug-fixer, passing the failure items from the code-review report -> after fix, main Agent re-dispatches code-review

[Not For]
    - Feature requests or new functionality -> use /dev-builder instead
    - Code quality or style issues without runtime errors -> use /code-review instead
    - Performance optimization without a specific bug -> use /code-review with performance dimension

[Dependency Check]
    Automatically executed as the first step when the Skill starts:

    Required:
    - Project code exists -> if no code, prompt to call /dev-builder first
    - Bug description -> user-provided symptoms, or failure item descriptions from a code-review report

    Optional (enhances debugging capability):
    - Product-Spec.md -> if available, cross-reference expected behavior to determine if it is a bug or a feature
    - DEV-PLAN.md -> if available, locate the relevant Phase and files
    - Design tool MCP (Pencil / Figma, etc.) -> if available, cross-reference design to check if UI is correct
    - Playwright plugin -> if available, automate reproduction and verification
    - git -> if available, use git log/diff/blame to trace changes
    - **Dependency Graph** (`dep-graph`) -> if available, run `pnpm dep-graph affected <file>` to scope the blast radius before debugging

[First Principles]
    **No Guessing, No Experiments**: No conclusions without evidence. Collect first, analyze first, hypothesize first, then verify. Do not rush to change code when you see an error.
    **One at a Time**: Change one thing at a time. Verify after the change, confirm it works, then proceed. Changing multiple things at once makes it impossible to know which change was the real fix.
    **Modification Discipline**: Fixing a bug is still changing code. Assess the impact before changing. Regression-test after the fix. Fixing A must not break B.
    **Web-First**: Unfamiliar error messages should be WebSearched before judging. Third-party library bugs should be searched for known issues before rolling your own investigation.
    **Stop on Repeated Failure**: If the same bug has been fixed multiple times without success, the Agent should stop and re-examine the problem itself — it may not be a code-level issue but an architectural, environmental, or comprehension problem. Specifically:
    - Check `.forge/.retry-counter.json` — if `retries >= max_retries` (default 3), do NOT attempt another fix.
    - Instead, set `state="escalated"` and present options to the user: A) Manual investigation, B) Adjust approach, C) Skip and move on.
    - The hook at `core/hooks/retry-gate.sh` enforces this at the gate level — even if the agent tries to proceed, the hook will block.
    - The exact number of attempts before stopping is read from `max_retries` in `.forge/.retry-counter.json`.

[Output Style]
    **Tone**:
    - Like a doctor diagnosing: ask about symptoms first, then check signs, then diagnose, then prescribe
    - Every step has evidence backing it. Do not say "it might be." Say "based on evidence X, the conclusion is Y"

    **Principles**:
    - X Never say "let me try changing it and see" — locate the root cause first, then change
    - X Never change multiple things at once (impossible to know which was the real fix)
    - X Never skip regression verification
    - V Every fix includes evidence (compilation output, run results, before/after comparison)
    - V Explain the reasoning process when locating the root cause
    - V After the fix, explicitly state "related features X, Y have been regression-verified and are normal"

    **Typical Expressions**:
    - "Error message is TypeError: Cannot read property 'id' of undefined, appearing at chat-view.tsx:45. Tracing the call chain reveals the session object is null. Root cause is that the useSession hook does not clean up its reference after session deletion."
    - "Fix: add cleanup logic in deleteSession inside useSession.ts. Impact scope: all components using useSession. Regression verified: create/switch/delete session all working normally."
    - "This bug has been fixed 3 times and still reproduces. I'm stopping to re-examine — the issue may not be at the component layer, but rather a race condition in the database WAL mode under concurrent writes."

[Gotchas]
    **Environmental contamination**: A stale process or zombie server on the port masquerades as "it worked before I made my change." Always kill the port first (lsof -ti:port / Get-NetTCPConnection). The "code is fine but something's off" feeling is usually a port conflict.
    **Over-narrowing**: The error message says file A, but the root cause is in file B's side effect on A's dependency. Trace the data flow, don't just fix where the error lands.
    **Three-strikes stall**: Same bug fixed 3 times and still fails → you're solving the wrong problem. Stop and re-examine at the architectural or environmental level.

[File Structure]
    ```
    bug-fixer/
    └── SKILL.md                           # Main Skill definition (this file)
    ```

[Output Artifacts]
    - **Code fix** — modified source files
    - **Fix report** (screen output) — root cause, changes made, verification results
    - **memory/task-history.md** — Append entry (date, phase, type=fix, description, changed files, notes)
    - **memory/project-memory.md** — Update if bug reveals a new pitfall or constraint
    - **memory/decisions-log.md** — Append if the fix involved a significant technical decision

[Debugging Rule Checklist]
    Rules that must be followed during the debugging process.

    [Evidence Collection Rules]
        - Full error message (do not truncate or omit stack trace)
        - Reproduction steps (user operation path, or trigger conditions)
        - Environment information (Node version, browser, OS — where relevant)
        - Recent code changes (git log, git diff — which commits may have introduced the problem)
        - Relevant logs (console output, network requests, database queries)
        - **Blast-radius** (if dep-graph is available): run `pnpm dep-graph affected <bug-file>` to find all files that depend on the buggy module — these are also at risk

    [Hypothesis Rules]
        - Maximum 3 hypotheses at a time, sorted by likelihood
        - Each hypothesis must have a corresponding verification method
        - Validate the most likely hypothesis first
        - Record the reason when a hypothesis is refuted; do not re-validate the same hypothesis

    [Fix Rules]
        - Change only one file / one logical point at a time
        - Assess impact scope before changing: if dep-graph is available, run `pnpm dep-graph affected <file>` and `pnpm dep-graph risk <file>` for data-driven impact assessment
        - Compile-verify after change (tsc --noEmit)
        - Function-verify after change (reproduction steps no longer trigger the bug)
        - Regression-verify after change (related existing functionality still works normally)

    [Process Management Rules]
        If the bug involves a running service (server, port occupation), first ensure the process environment is clean.
        Multiple instances are the root cause of many spooky bugs. Eliminate this possibility first, then debug.

        **Core Principle: Kill by port, not by process name**
        Regardless of language (Node / Java / Python / Go / C / Rust / .NET), kill whoever occupies the port.
        First determine the dev server port number based on project type (default 3000), then:

        **macOS / Linux**:
        ```bash
        kill -9 $(lsof -ti:3000) 2>/dev/null; sleep 2
        ```

        **Windows**:
        ```bash
        powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process \$_.OwningProcess -Force }" 2>/dev/null; sleep 2
        ```

        **Fallback when port kill fails**:
        If killing by port fails (port is free or `lsof`/`Get-NetTCPConnection` is unavailable), fall back to killing by process name based on project type:

        - Node.js project -> `taskkill /F /IM node.exe` / `pkill -f "node"`
        - Java project -> `taskkill /F /IM java.exe` / `pkill -f "java"`
        - Python project -> `taskkill /F /IM python.exe` / `pkill -f "python"`
        - Go project -> `taskkill /F /IM "go"` / `pkill -f "go"`
        - Hard to determine -> use `ps` / `tasklist` to list suspicious processes, ask user to confirm

    [Search Rules]
        The following scenarios require WebSearch:
        - Unfamiliar error message -> search the error message + framework name
        - Suspected third-party library bug -> search library name + version + known issues
        - Suspected framework version compatibility -> search framework + version + breaking changes
        - Fixed 3 times and still not working -> search with broader keywords; someone may have encountered the same pitfall

    [Anti-Rationalization Checklist]
        Agents tend to skip rules using "reasonable" justifications. Here are common rationalizations and the correct response.

        Skipping evidence collection and going straight to code changes:
        - "I've seen this error before, this is how I fixed it last time" -> the same error can have different root causes; collect evidence first, then decide
        - "No need to reproduce, it's obviously a problem with XX" -> "obviously" is not evidence; verify the hypothesis first, then change
        - "Let me just try changing it and see what happens" -> locate the root cause first, blindly attempting introduces new problems

        Changing multiple things at once:
        - "I'll just fix this while I'm at it" -> one problem at a time. Changing multiple things at once makes it impossible to know which was the real fix
        - "These two bugs are related" -> even if related, verify step by step, one at a time

        Skipping regression verification:
        - "I only changed one line, it won't affect anything else" -> one line change can impact the entire module; regression verification is not optional
        - "It's fixed, take a look" -> a fix must have evidence (compilation passes + bug no longer reproduces + regression passes)

        Abandoning systematic debugging:
        - "This bug is too simple, no need for the four-stage process" -> when you think it's simple is exactly when you are most likely to miss critical information
        - "It's an environment issue, no need to investigate" -> environment issues are bugs too; use the same systematic approach

[Debugging Strategy]
    Four-stage systematic debugging method. No stage-skipping allowed.

    **Stage 1: Collect Evidence**
    - Read the full error message and stack trace
    - Reproduce the bug (confirm whether it is consistently reproducible or intermittent)
    - Check recent code changes (git log --oneline -10, git diff)
    - For multi-component systems -> identify which layer the problem is in (frontend / API / database / third party)
    - Trace the data flow: from trigger point to error point, what functions/components were involved

    **Stage 2: Analyze Patterns**
    - Find a similar feature that works correctly, and compare it with the broken one
    - Compare differences, identify suspicious areas
    - Understand dependencies (what modules/data/state does this feature depend on)
    - If Product-Spec.md is available -> confirm what the expected behavior is

    **Stage 3: Hypothesis Verification**
    - Form 1-3 hypotheses based on evidence, ordered by likelihood
    - Validate the most likely hypothesis with minimal changes (console.log, breakpoints, temporary comments)
    - Hypothesis validated -> proceed to Stage 4
    - Hypothesis refuted -> record the reason, validate the next hypothesis
    - All 3 hypotheses refuted -> return to Stage 1 to re-collect evidence
    - If stuck -> WebSearch for related issues

    **Stage 4: Implement Fix**
    - Apply a single fix (one logical point at a time)
    - Compile verification (tsc --noEmit zero errors)
    - Function verification (bug no longer reproduces)
    - Regression verification (related features work normally)
    - If fix fails -> roll back, return to Stage 3
    - 3 consecutive fix failures -> stop and re-examine whether it is an architectural issue or comprehension error

[Three-Layer Diagnostic Model]
    After Stage 4 (fix implemented), apply three-layer diagnostic depth to prevent recurrence:

    **Layer 1: Symptom** (what broke)
    - The immediate error: exception, wrong output, missing feature
    - This is the bug you just fixed — surface level

    **Layer 2: Design Flaw** (why the bug was possible)
    - Ask: "What structural weakness allowed this bug to exist?"
    - Common design flaws: missing validation layer, implicit state coupling, absent error boundary, race condition window, missing type constraint
    - This layer answers: "Why wasn't this caught before it shipped?"

    **Layer 3: Principle Violation** (what rule was broken that enabled the flaw)
    - Map the design flaw to a violated First Principle from the relevant Skill
    - Common violations: skipping Dependency Check, ignoring Anti-Rationalization, bypassing Output Style, no regression test
    - This layer answers: "What process gap allowed the design flaw to exist?"

    **Output format** (included in Completion Phase report):
    - Symptom: [root cause you just fixed]
    - Design Flaw: [structural weakness that allowed the bug]
    - Principle Violation: [which rule/process was skipped or inadequate]

    Example:
    - Symptom: session.id is undefined when session is deleted
    - Design Flaw: useSession hook holds a stale reference after session deletion — no cleanup logic
    - Principle Violation: "One at a Time" — the delete operation didn't ensure dependent references were cleaned before completing

[Workflow]
    [Startup Phase]
        Step 1: Dependency Check
            Execute [Dependency Check]

        Step 2: Collect Bug Information
            Extract from user description:
            - Error message / abnormal behavior
            - Reproduction steps
            - Expected behavior vs actual behavior
            If information is insufficient -> ask the user for more details

        Step 3: Load Context
            If Product-Spec.md exists -> read expected behavior of the relevant feature
            If DEV-PLAN.md exists -> locate relevant Phase and files
            If design tool MCP exists -> cross-reference UI expectations
            If memory/ exists -> read project-memory.md (known pitfalls), decisions-log.md (past decisions), task-history.md (recent changes that may have introduced the bug)
            Scan project code -> understand relevant module structure

    [Debugging Phase]
        Execute the four-stage process from [Debugging Strategy]:
        Stage 1 -> Stage 2 -> Stage 3 -> Stage 4

        Report progress to the user after each stage:
        - After Stage 1: "Evidence collected: ... Initial assessment: the problem is in XX"
        - After Stage 3: "Hypothesis: XX, verification method: XX, result: XX"
        - After Stage 4: "Fixed. Modified XX. Compilation passed, function verification passed, regression verification passed"

    [Verification Phase]
        Must execute after the fix is complete:
        1. Compile verification: tsc --noEmit zero errors
        2. Function verification: follow reproduction steps, bug no longer appears
        3. Regression verification: related features (list specific feature names) still work normally
        4. If Playwright is available -> automate core interaction flow testing
        Output evidence (compilation output, verification screenshots/results)

    [Completion Phase]
        Update memory files:
        - Append to memory/task-history.md: date, phase, type=fix, description, changed files, root cause as notes
        - If bug reveals a new pitfall -> add to memory/project-memory.md Known Pitfalls section
        - If fix involved a significant decision -> append ADR to memory/decisions-log.md

        Report to the user:
        "**Bug Fixed**

         **Root Cause**: [one-sentence root cause explanation]
         **Fix**: [which files were modified, what changes were made]
         **Verification**:
         - Compilation: tsc --noEmit zero errors
         - Function: [reproduction steps] no longer trigger the bug
         - Regression: [list of related features] verified normal

         **Three-Layer Diagnosis**:
         - Symptom: [what broke]
         - Design Flaw: [structural weakness that allowed the bug]
         - Principle Violation: [which rule/process was skipped]

         Shall I commit? (commit message: fix: [problem description])
         Or are there other issues to fix?"

[YOLO Mode]
    When FORGE_MODE=yolo, 🟢 Green and 🟡 Yellow actions proceed automatically. 🔴 Red actions ALWAYS require user confirmation, even in YOLO mode.

    Auto-commit and write fix report instead of asking:

    **Completion Phase** -> Auto-commit with `fix:` prefix, write `changes/fix-report.md`:
        Root cause, fix description, verification evidence, and regression test results.
        Proceed to the next task — unless the fix involves a 🔴 Red action (e.g., modifying production config, changing auth logic, deleting data), in which case user confirmation is still required.

[Initialization]
    Execute [Startup Phase]
