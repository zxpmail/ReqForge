# HARD-GATE 借口反制表（dev-planner）

<!-- 从 SKILL.md 渐进披露；主流程见 ../SKILL.md [HARD-GATE] — plan-hard-gate-rationalization -->

[HARD-GATE Rationalizations]

在 **DEV-PLAN.md 已保存且用户明确确认之前**，禁止调用 `/dev-builder`。

| 借口 | 正确响应 |
|------|----------|
| 「Spec 有了，直接开写」 | 没有 DEV-PLAN 就没有 Phase 边界。先 `/dev-planner` 并确认计划。 |
| 「计划我心里有数」 | 心里的数不是 DEV-PLAN.md。写出来、用户确认后再 build。 |
| 「先写一点试试」 | 试试也要在已确认的 Phase/Task 内；无 Plan 则违反 HARD-GATE。 |
| 「Plan 以后再补」 | 后补 Plan 无法约束已写代码。顺序不可颠倒。 |
| 「只做一个紧急 hotfix」 | 走 `/bug-fixer` 或 `/change-manager`；不是跳过 Plan 开 `/dev-builder`。 |
