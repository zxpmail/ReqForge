# Phase Completion Assessment

<!-- 从 SKILL.md 渐进披露拆分；主流程见 ../SKILL.md -->

[Phase Completion Assessment]
    When each Phase is complete, all of the following checks must pass. One pass is rarely enough — iterative checking until clean.

    **Four-Step Verification** (all must pass to confirm Phase completion):

    Step 1: Code Review
    - Cross-reference the DEV-PLAN.md Phase delivery checklist, confirm each item is implemented item by item
    - Check code quality: naming conventions, type safety, no `any`, no circular dependencies
    - Check for changes outside the Phase scope (scope creep)
    - Output evidence: delivery checklist cross-reference results

    Step 2: Test Completeness
    - All planned features for this Phase are implemented
    - No omissions, no half-baked work
    - Output evidence: feature checklist with checkmarks

    Step 3: Compilation Verification
    - TypeScript compilation zero errors (tsc --noEmit)
    - No missing dependencies
    - Output evidence: compilation command output

    Step 4: Functional Testing
    - Start dev server, confirm no error output
    - New features are usable
    - Existing features are not broken (regression)
    - If Playwright is available and `.forge/tests/` exists:
      - Open `.forge/tests/verify-phase.template.spec.ts` for reference
      - Write a quick E2E test for the Phase's core user flow (search → act → verify)
      - Run: `npx playwright test --project=chromium`
      - If tests fail, use `npx playwright show-trace` to debug (trace.zip auto-recorded on retry)
    - If Playwright is not available -> use curl to check API endpoint returns 200 + remind user to manually confirm UI rendering in browser
    - Output evidence: startup logs + API response + test results + design value comparison results

    **Smoke Tests** (additional checks beyond the four steps):
    - Security scan: npm audit has no critical vulnerabilities
    - No exposed keys: grep to check for hardcoded API Keys, Tokens in code
    - Process health: only 1 dev server instance running

    **Scripted Verification** (recommended for complex Phases):
    For Phases with 5+ tasks or multi-service integration, generate a `scripts/verify-phase-N.sh` (or `.bat`) verification script that the AI can run directly. The script should cover: (1) compile check, (2) unit test run, (3) dev server health check, (4) core API smoke test. Scripts are AI's hands — a checklist is for humans, a script is for AI.

    **Iterative Check Loop**:
    - If any step finds issues (missing tasks, compilation errors, test failures), dispatch feedback-observer with trigger_reason="verification_fail", current_skill="dev-builder", ai_action=[what failed], failure_detail=[error output] -> then fix the issues
    - After fixing any issue, **restart the entire four-step verification from Step 1**
    - Fixing one issue can reveal other missed issues — one pass is never enough
    - Subject to [Verification Retry Limit] below — max 3 cycles, then escalate

    **Verification Retry Limit**:
    - Track verification retries in `.forge/.retry-counter.json` using existing fields: set `task="phase_verify"`, `phase=[current Phase number]`
    - Max **3 verification retry cycles**. After 3 failed attempts:
      1. Set state="escalated" in `.forge/.retry-counter.json`
      2. Report to the user with all failure evidence from all 3 attempts
      3. Present options: A) User adjusts spec/approach, resets counter, retries B) Phase deferred, move on
    - On successful pass: reset retry counter to `{"state":"resolved","retries":0}`

    **Verification Timeliness Rule**:
    Each verification command in the four steps must be executed in the same message as the report. "Already verified earlier" is not accepted. If any code modification occurs in between, all four steps must be re-run.

    **Phase exit guard (Ralph-style soft stop)**:
    - If four-step verification is **not** complete, or DEV-PLAN acceptance items for this Phase remain open: write one line to `.forge/phase-exit-block` (UTF-8) describing what is missing. The `phase-exit-guard` hook will block agent stop until resolved.
    - Do **not** write this file once all four steps pass — only use it when the agent would otherwise stop early.
    - After user confirms Phase complete: `rm -f .forge/phase-exit-block` (or `del` on Windows).

    **After All Pass**:
    - Run `pnpm forge-verify --baseline compare` — if new failures vs baseline, must fix before proceeding
    - Update `.forge/dev-map.md` — add/modify rows for modules touched this Phase (who changes code updates the map)
    - Record structured trace: capture key decisions (tradeoffs, chosen approach, abandoned alternatives), dead ends (approaches tried but failed, lessons learned), and evidence-file bindings for each claim. Append to `.forge/trace/phase-<N>.json`:
      - `node scripts/forge-trace.mjs decision <N> --q "<question>" --c "<chosen>" -r "<reason>" -a "<abandoned>"` (if exists)
    - **Scope compliance (巽 — Filter)**: Run `node scripts/forge-scope.mjs check` to verify no files outside the declared scope were modified. If violations found, must revert or update scope declaration before proceeding. (Skip if script doesn't exist.)
    - **Evolution proposals (兌 — Exchange)**: After all checks pass, run evolution-engine to scan feedback data for actionable patterns. If proposals found, present to user as Y/N choices:
      - "I noticed [pattern] from the last Phase. Suggest [change]. Apply? (Y/N)"
      - Only proceed after user responds; if user says no, log to `.forge/evolution-proposals.md` for later review.
    - Report results to the user (with evidence)
    - Remove `.forge/phase-exit-block` if present
    - **PROJECT-HEALTH.md** (user projects only): Create or update at project root from `core/templates/PROJECT-HEALTH-template.md` (via adapter templates path). Fill: date, Phase N, Primary metric result, Spec coverage X/Y, last test command output summary, top 3 risk_rank items from last review if any, last 5 rows from `memory/task-history.md`, next Phase name. Skip for ReqForge framework repo itself.
    - Archive: scan the changes/ directory, check if any change artifacts related to this Phase's delivery checklist exist. If yes and all are fully implemented, move changes/<change-name>/ to changes/archive/<change-name>/
    - User confirms -> Phase complete
    - Phase completion cannot be confirmed without passing
    - If problems are found and fixed during verification, use `fix:` prefix for the fix commit (per-Task commits are already completed in Step 2)

    **Phase Summary Generation** (auto-generated after all passes):
    Generate a structured phase summary appended to the Phase completion report:

    ```
    📋 Phase N Summary

    **Completed**: X/Y delivery checklist items
    **Key files created/modified**: [list]

    **Architecture decisions**: [any ADRs made this phase]
    **Known limitations**: [unresolved issues, deferred items]
    **Verification evidence**: [compilation: pass | tests: X passed | lint: pass]

    **Next step**: Phase N+1 — [Phase name from DEV-PLAN]
    ```

    This summary serves as a quick-reference handoff point for the next session or next Phase invocation.

    **善刀而藏之** (强制关闭仪式 — 每次 Phase 完成后必须执行):
    
    庖丁杀完牛后，提刀而立 → 为之四顾 → 为之踌躇满志 → 善刀而藏之。
    Phase 完成后也一样——不只是"完成了"，要收刀、归神、清场。
    
    **Step 1: 提刀而立** — 回顾完成的交付物，确认一切妥当。
    已完成。Phase Summary 已经生成。
    
    **Step 2: 为之四顾，为之踌躇满志** — 显式享受完成。
    输出一段话（给用户看）：
    ```
    🎉 Phase N 完成

    这把刀用了 [X] 次，刀刃如新。
    这一段游刃有余的过程本身，就是养生的目的。

    和庖丁一样，做完就收刀——不把上一头牛的气带到下一头牛。
    ```
    
    **Step 3: 追加隐藏难点到 Spec** — 把 Phase 执行中新发现的困难写回 Product-Spec.md。
    
    一个 Phase 走完，一定有预期之外的「筋骨交错」被发现。让下一个 Phase 站在更新过的地图上。
    
    - 扫描当前 Phase 中遇到的非预期困难、踩过的坑、需要特殊处理的边界条件
    - 格式为标准 Known Difficult Spots 条目：
      ```markdown
      | <模块> | 🟡 中 | <具体难点> | <处理策略> |
      ```
    - 追加到 Product-Spec.md 的 `## Known Difficult Spots` 表格
    - 如果该模块已有条目 → 合并或更新，不重复
    - 如果 Product-Spec.md 还没有这个章节 → 在 Technical Notes 前插入
    
    **Step 4: 记入决策日志** — 把 Phase 中的关键决策写入 memory/。
    写三条就够了：
    - `memory/decisions-log.md` — 追加：`| Phase N | <决策> | <理由> | <备选> |`
    - `memory/task-history.md` — 追加：`| Phase N | <已完成的 Task 摘要> | <关键文件> |`
    
    **Step 5: 藏刀** — 关闭上下文，让下一把刀干净。
    至此，当前 Phase 的所有产出都已经被"收好"了：
    - 代码已提交 ✅
    - Spec 已被新发现更新 ✅
    - 决策已写入记忆 ✅
    - 总结已报告 ✅
    
    接下来的 Phase N+1 将在一个干净的上下文上开始——不带着上一轮的噪声和临时推理。
    
    > **善刀而藏之，是养生主最关键的五个字。**
    > 会杀牛不算本事，杀完知道收刀才算。
