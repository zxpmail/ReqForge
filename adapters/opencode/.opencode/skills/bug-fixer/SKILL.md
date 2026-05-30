<!-- forge: bug-fixer v1.0 -->
---
name: bug-fixer
description: Used when the user says "this feature is broken", "getting an error", "something's not right", or reports a bug, compilation error, or runtime exception. Locates root cause through a four-stage systematic debugging process and fixes it.
version: 1.0.0
updated: 2026-05-26
requires: []
---

<!-- begin: task -->
[Task]
    Locate the root cause of bugs through a systematic debugging process and fix them.
    Fix one problem at a time. Assess impact before each modification. Verify regression after fix.

<!-- end: task -->
<!-- begin: invocation-context -->
[Invocation Context]
    bug-fixer may be called in two scenarios:
    1. User directly reports a bug -> main Agent invokes bug-fixer -> after fix, suggest user run /code-review to verify
    2. code-review finds confirmed bug/security/type issues (confidence ≥ 0.6) -> main Agent invokes bug-fixer, passing the failure items from the code-review report -> after fix, main Agent re-dispatches code-review

<!-- end: invocation-context -->
<!-- begin: not-for -->
[Not For]
    - Feature requests or new functionality -> use /dev-builder instead
    - Code quality or style issues without runtime errors -> use /code-review instead
    - Performance optimization without a specific bug -> use /code-review with performance dimension

<!-- end: not-for -->
<!-- begin: dependency-check -->
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

<!-- end: dependency-check -->
<!-- begin: behavior-rules-—-karpathy-discipline -->
[Behavior Rules — Karpathy Discipline]
    → `../_shared/karpathy-discipline.md`（bug 场景：先证据后改码；最小修复）

<!-- end: behavior-rules-—-karpathy-discipline -->
<!-- begin: first-principles -->
[First Principles]
    **Phase 1 Before Fix (Superpowers systematic-debugging)**: No fix proposal until stable reproduction and data-flow tracing are documented. Symptom-only patches are failures — align with TDD: failing test first, then fix.
    **No Guessing, No Experiments**: No conclusions without evidence. Collect first, analyze first, hypothesize first, then verify. Do not rush to change code when you see an error.
    **One at a Time**: Change one thing at a time. Verify after the change, confirm it works, then proceed. Changing multiple things at once makes it impossible to know which change was the real fix.
    **Modification Discipline**: Fixing a bug is still changing code. Assess the impact before changing. Regression-test after the fix. Fixing A must not break B.
    **Web-First**: Unfamiliar error messages should be WebSearched before judging. Third-party library bugs should be searched for known issues before rolling your own investigation.
    **Stop on Repeated Failure**: If the same bug has been fixed multiple times without success, the Agent should stop and re-examine the problem itself — it may not be a code-level issue but an architectural, environmental, or comprehension problem. Specifically:
    - Check `.forge/.retry-counter.json` — if `retries >= max_retries` (default 3), do NOT attempt another fix.
    - Instead, set `state="escalated"` and present options to the user: A) Manual investigation, B) Adjust approach, C) Skip and move on.
    - The hook at `core/hooks/retry-gate.sh` enforces this at the gate level — even if the agent tries to proceed, the hook will block.
    - The exact number of attempts before stopping is read from `max_retries` in `.forge/.retry-counter.json`.

<!-- end: first-principles -->
<!-- begin: output-style -->
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

<!-- end: output-style -->
<!-- begin: gotchas -->
[Gotchas]
    **Environmental contamination**: A stale process or zombie server on the port masquerades as "it worked before I made my change." Always kill the port first (lsof -ti:port / Get-NetTCPConnection). The "code is fine but something's off" feeling is usually a port conflict.
    **Over-narrowing**: The error message says file A, but the root cause is in file B's side effect on A's dependency. Trace the data flow, don't just fix where the error lands.
    **Three-strikes stall**: Same bug fixed 3 times and still fails → you're solving the wrong problem. Stop and re-examine at the architectural or environmental level.

<!-- end: gotchas -->
<!-- begin: file-structure -->
[File Structure]
    ```
    bug-fixer/
    ├── SKILL.md                           # Main Skill definition (this file)
    └── references/
        ├── debugging-rule-checklist.md    # Evidence, hypothesis, fix, process management, search rules
        └── workflow.md                    # Startup, debugging, verification, completion phases
    ```

<!-- end: file-structure -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **Code fix** — modified source files
    - **Fix report** (screen output) — root cause, changes made, verification results
    - **memory/task-history.md** — Append entry (date, phase, type=fix, description, changed files, notes)
    - **memory/project-memory.md** — Update if bug reveals a new pitfall or constraint
    - **memory/decisions-log.md** — Append if the fix involved a significant technical decision

<!-- end: output-artifacts -->
<!-- begin: debugging-rule-checklist -->
[Debugging Rule Checklist]
    Rules that must be followed during the debugging process.

    **按步执行** references/debugging-rule-checklist.md

<!-- end: debugging-rule-checklist -->
    <!-- begin: anti-rationalization-checklist -->
    [Anti-Rationalization Checklist]

        | Rationalization | Reality |
        |---|---|
        | "I've seen this error before, this is how I fixed it last time" | Same error can have different root causes; collect evidence first, then decide |
        | "No need to reproduce, it's obviously a problem with XX" | "Obviously" is not evidence; verify the hypothesis first, then change |
        | "Let me just try changing it and see what happens" | Locate the root cause first; blindly attempting introduces new problems |
        | "I'll just fix this while I'm at it" | One problem at a time. Changing multiple things at once makes it impossible to know which was the real fix |
        | "These two bugs are related" | Even if related, verify step by step, one at a time |
        | "I only changed one line, it won't affect anything else" | One line change can impact the entire module; regression verification is not optional |
        | "It's fixed, take a look" | A fix must have evidence (compilation passes + bug no longer reproduces + regression passes) |
        | "This bug is too simple, no need for the four-stage process" | When you think it's simple is exactly when you are most likely to miss critical information |
        | "It's an environment issue, no need to investigate" | Environment issues are bugs too; use the same systematic approach |

    <!-- end: anti-rationalization-checklist -->
<!-- begin: cot-diagnostic-checklist -->
[CoT Diagnostic Checklist]
    <!-- 显式推理清单；与四阶段并存，Stage 3 前完成。不必让用户写「先想想看」。 -->
    Before proposing a fix (align with Phase 1 Before Fix):
    1. List at least **5** plausible causes for the symptom (not just the first guess)
    2. For each cause: how to verify (which file, log, test, repro step)
    3. Order causes from most likely to least likely
    4. Validate from #1 downward; **no fix code until top hypothesis is tested or ruled out**

    **Reporting format** (Stages 1–3 progress updates):
    - Short bullet reasoning; **one bold line**: current leading root-cause hypothesis
    - Do not bury the conclusion under long prose

<!-- end: cot-diagnostic-checklist -->
<!-- begin: debugging-strategy -->
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
    - Execute [CoT Diagnostic Checklist] (≥5 causes, verification steps, ordered; bold leading hypothesis in updates)
    - Form 1-3 hypotheses based on evidence, ordered by likelihood (may narrow from the checklist)
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

<!-- end: debugging-strategy -->
<!-- begin: three-layer-diagnostic-model -->
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

[Workflow] — see [Debugging Strategy] for systematic analysis methodology.
    **按步执行** references/workflow.md

<!-- end: three-layer-diagnostic-model -->
<!-- begin: yolo-mode -->
[YOLO Mode]
    When FORGE_MODE=yolo, 🟢 Green and 🟡 Yellow actions proceed automatically. 🔴 Red actions ALWAYS require user confirmation, even in YOLO mode.

    Auto-commit and write fix report instead of asking:

    **Completion Phase** -> Auto-commit with `fix:` prefix, write `changes/fix-report.md`:
        Root cause, fix description, verification evidence, and regression test results.
        Proceed to the next task — unless the fix involves a 🔴 Red action (e.g., modifying production config, changing auth logic, deleting data), in which case user confirmation is still required.

<!-- end: yolo-mode -->
<!-- begin: initialization -->
[Initialization]
    Execute [Startup Phase]

<!-- end: initialization -->