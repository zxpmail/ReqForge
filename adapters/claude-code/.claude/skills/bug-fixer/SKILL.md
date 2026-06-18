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
    - **forge-bug-fix** (`pnpm forge-bug-fix`) -> if available, use diagnose/trace/verify to automate preflight checks, capture debug snapshots, and run post-fix verification

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
        ├── anti-ai-slop-checklist.md      # 交付前自检：防敷衍式修 bug
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
<!-- begin: dimension-checklist -->
[Dimension Checklist]
    See [references/dimension-checklist.md](references/dimension-checklist.md) for the full dimension checklist.

    Must-have dimensions:
    - **Error classification**: categorize bug type (compile/runtime/logic/UI/data)
    - **Reproduction steps**: deterministic repro required before any fix
    - **Stack trace reading**: extract root-frame user code, exception type, message
    - **Error message analysis**: treat error messages as primary evidence
    - **Regression scope**: git bisect/blame to find introducing commit
    - **Environment factors**: compare failing vs. known-working environment
    - **Input validation**: trace triggering input, check boundaries and encoding
    - **State management**: inspect state before/after, check caches and mutation

<!-- end: dimension-checklist -->
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
<!-- begin: quality-rubric -->
[Quality Rubric]
    8-item, 16-point scoring system. Ship threshold: **≥ 12** with no critical item scoring 0.

    | # | Dimension | Pts | Critical | Scoring |
    |---|-----------|-----|----------|---------|
    | 1 | Root cause accuracy | 2 | YES | 2 = Identified actual root cause (not symptom), traced through data/control flow; 1 = Found proximate cause but not root; 0 = Fixed symptom only |
    | 2 | Fix correctness | 2 | YES | 2 = Fix resolves the issue, all existing tests pass, no new bugs introduced; 1 = Fix works for reported case but may fail edge cases; 0 = Fix is incorrect or breaks other functionality |
    | 3 | Regression prevention | 2 | — | 2 = Added test(s) covering the fix, verified they fail before and pass after; 1 = Manual verification only, no automated guard; 0 = No regression protection added |
    | 4 | Diagnostic thoroughness | 2 | — | 2 = Checked logs, stack traces, reproduction steps, environment factors; 1 = Used some evidence but missed available signals; 0 = Guessed without evidence |
    | 5 | Scope awareness | 2 | — | 2 = Understood blast radius, checked callers and dependents before fixing; 1 = Considered scope but missed some affected areas; 0 = Changed code without impact analysis |
    | 6 | Fix minimality | 2 | — | 2 = Surgical change, only what's needed, no unnecessary refactoring; 1 = Some extra changes mixed in; 0 = Large rewrite or scope creep in fix |
    | 7 | Verification evidence | 2 | YES | 2 = Demonstrated fix works (test output, error gone, manual repro passes); 1 = Claims fix works but no demonstration; 0 = No verification attempted |
    | 8 | Documentation | 2 | — | 2 = Updated relevant docs, added comments for non-obvious fix, logged in task-history; 1 = Code-only fix without comments/docs; 0 = No documentation or logging |

    **Scoring**: Run `pnpm validate-skill --score core/skills/bug-fixer` to compute.
<!-- end: quality-rubric -->
<!-- begin: workflow -->
[Workflow]
    1. Run [Dependency Check]
    2. Read `references/first-principles.md`
    3. **必须先 Read `references/workflow.md`** — Startup → Debugging → Self-Review → Verification → Completion（Debugging 含子阶段：观察 → 假设 → 验证 → 修复，见 `references/debugging-strategy.md`）
    4. Debugging 阶段执行 `references/debugging-strategy.md` + `cot-diagnostic-checklist.md`
    5. **forge-bug-fix 辅助**：
       - Stage 1 启动后 → `pnpm forge-bug-fix diagnose` 跑 preflight + 环境检查；按问题类型加 `--scenario compile|config|data` 专项诊断
       - 调试中捕获关键现场 → `pnpm forge-bug-fix trace <bug-name>` 存快照
       - 定位回归引入者 → `pnpm forge-bug-fix bisect <good-commit> [bad-commit]` 自动 git bisect
       - 错误分类诊断 → `pnpm forge-bug-fix classify [trace-name]` 识别错误类别 + 建议修复方向
       - 修复后验证 → `pnpm forge-bug-fix verify` 确认编译 + 测试通过
    6. 交付前执行 `references/anti-ai-slop-checklist.md` 自检
    7. `FORGE_MODE=yolo` → `references/yolo-mode.md`

<!-- end: workflow -->
<!-- begin: yolo-mode -->
[YOLO Mode]
    → `references/yolo-mode.md`

<!-- end: yolo-mode -->
<!-- begin: initialization -->
[Initialization]
    Execute [Workflow]

<!-- end: initialization -->
