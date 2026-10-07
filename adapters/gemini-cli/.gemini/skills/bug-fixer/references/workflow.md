# Workflow

<!-- 从 SKILL.md 渐进披露拆分 -->

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
        Execute four-stage process from `references/debugging-strategy.md`:
        Stage 1 -> Stage 2 -> Stage 3 -> Stage 4
        During Stage 1, diagnose by problem type:
        - Compile/type errors -> `forge-bug-fix diagnose --scenario compile`
        - Env/config issues -> `forge-bug-fix diagnose --scenario config`
        - Data/IO inconsistency -> `forge-bug-fix diagnose --scenario data`

        Report progress to the user after each stage:
        - After Stage 1: "Evidence collected: ... Initial assessment: the problem is in XX"
        - After Stage 3: "Hypothesis: XX, verification method: XX, result: XX"
        - After Stage 4: "Fixed. Modified XX. Compilation passed, function verification passed, regression verification passed"

    [Self-Review Phase]
        After the fix is generated, before external verification, perform a **single self-review pass** on the fix.
        Since the fix was just written, attention is still hot — issues are easier to spot now than after switching context.

        **自审指令**:
        ```
        请评审你刚才生成的修复，重点关注：
        1. 根因追踪了还是只修了症状？
        2. 是否有硬编码值或幻觉 API（不存在的函数/参数）？
        3. 错误处理是否完整（不是空 catch 或只 console.error）？
        4. 是否添加了能捕获此 bug 的回归测试？
        5. 同类型模式在代码中已 grep 检查？
        ```

        **处理结果**：
        - 发现可自修问题 → 在当前回合直接修复
        - 发现需要重构的问题 → 记录，交给后续验证处理
        - 无问题 → 继续下一步

        **注意**：自审不是验证的替代品。它的目的是用热上下文修复那些浅层问题（幻觉参数、空 catch、漏了回归测试）。

    [Verification Phase]
        Must execute after the self-review:
        1. Compile verification: language-aware (`pnpm forge-verify` / `.forge/dev-map.md` compile command; TS/JS fallback `tsc --noEmit`)
        2. Function verification: follow reproduction steps, bug no longer appears
        3. Regression verification: related features (list specific feature names) still work normally
        4. If Playwright is available -> automate core interaction flow testing
        Output evidence (compilation output, verification screenshots/results)

        **Recurrence Check** (before reporting fixed or starting another fix round):
        If this is the 2nd failed fix for the SAME symptom (count your own fix rounds this session + `.forge/.retry-counter.json` — use its `task` field as the symptom identity, `history[]` for rounds), do NOT start a 3rd fix attempt. The bug is probably in the requirements layer, not the code. Instead:
        1. Re-read the Product-Spec.md section covering this feature and ask: is the spec's expected behavior itself wrong, ambiguous, or missing a case? (conflict arbitration per `../_shared/acceptance-evidence.md` 原则五)
        2. Dispatch feedback-observer with `trigger_reason="recurrence_escalation"` and the diagnosed failure_class
        3. Present the user: A) Spec is wrong -> amend the spec first (Known Difficult Spots), then re-fix against the corrected spec; B) Spec is right -> architectural/environmental problem, escalate with all evidence from both attempts; C) Defer
        A 3rd failure -> existing retry-gate escalation (state="escalated", hard stop) applies unchanged.

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
         - Compilation: language-aware verify clean
         - Function: [reproduction steps] no longer trigger the bug
         - Regression: [list of related features] verified normal

         **Three-Layer Diagnosis**:
         - Symptom: [what broke]
         - Design Flaw: [structural weakness that allowed the bug]
         - Principle Violation: [which rule/process was skipped]

         [Goal-Driven Verification]
         Verify each against the original request:
         - User reported: "[original symptom]" → not reproducible, test passes
         - Impact scope: [list of affected features] → regression verified
         - Acceptance: [verifiable criterion] → command output attached

         Shall I commit? (commit message: fix: [problem description])
         Or are there other issues to fix?"
