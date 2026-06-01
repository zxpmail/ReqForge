<!-- forge: bug-fixer v1.1 -->
---
name: bug-fixer
description: Used when the user says "this feature is broken", "getting an error", "something's not right", or reports a bug, compilation error, or runtime exception. Locates root cause through a four-stage systematic debugging process and fixes it.
version: 1.1.0
updated: 2026-05-30
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
<!-- begin: shared-discipline -->
[Shared Discipline]
    Karpathy 四原则 → `../_shared/karpathy-discipline.md`（bug 场景：先证据后改码；最小修复）

<!-- end: shared-discipline -->
<!-- begin: first-principles -->
[First Principles]
    **Debug 前必读** `references/first-principles.md`

<!-- end: first-principles -->
<!-- begin: output-style -->
[Output Style]
    → `references/output-style.md`
    → Bug 报告 / 修复完成必须附加 `../_shared/output-status-protocol.md`（Status: BLOCKED 或 NEEDS_CONTEXT 时必须说明原因）

<!-- end: output-style -->
<!-- begin: file-structure -->
[File Structure]
    ```
    bug-fixer/
    ├── SKILL.md
    ├── commands/bug-fixer.md
    └── references/
        ├── first-principles.md
        ├── output-style.md
        ├── debugging-strategy.md          # 四阶段（Stage 1–4）
        ├── cot-diagnostic-checklist.md
        ├── three-layer-diagnostic-model.md
        ├── debugging-rule-checklist.md
        ├── anti-rationalization.md
        ├── workflow.md                    # Startup → Debug → Verify → Complete
        └── yolo-mode.md
    ../_shared/
    ```

<!-- end: file-structure -->
<!-- begin: gotchas -->
[Gotchas]
    **Environmental contamination**: Kill stale port processes before blaming code changes.
    **Over-narrowing**: Trace data flow; don't fix only where the error lands.
    **Three-strikes stall**: Same bug fixed 3× still fails → wrong problem level; check retry-gate.

<!-- end: gotchas -->
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
    **调试中读取** `references/debugging-rule-checklist.md`

[Anti-Rationalization Checklist]
    → `references/anti-rationalization.md`

[CoT Diagnostic Checklist]
    **Stage 3 前读取** `references/cot-diagnostic-checklist.md`

[Debugging Strategy]
    **四阶段方法论** `references/debugging-strategy.md`

[Three-Layer Diagnostic Model]
    **Completion 阶段读取** `references/three-layer-diagnostic-model.md`

<!-- end: debugging-rule-checklist -->
<!-- begin: workflow -->
[Workflow]
    1. Run [Dependency Check]
    2. Read `references/first-principles.md`
    3. **必须先 Read `references/workflow.md`** — Startup → Debugging（四阶段）→ Verification → Completion
    4. Debugging 阶段执行 `references/debugging-strategy.md` + `cot-diagnostic-checklist.md`
    5. `FORGE_MODE=yolo` → `references/yolo-mode.md`

<!-- end: workflow -->
<!-- begin: yolo-mode -->
[YOLO Mode]
    → `references/yolo-mode.md`

<!-- end: yolo-mode -->
<!-- begin: initialization -->
[Initialization]
    Execute [Workflow]

<!-- end: initialization -->
