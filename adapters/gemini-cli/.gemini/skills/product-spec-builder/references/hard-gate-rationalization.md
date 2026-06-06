# HARD-GATE 借口反制表

<!-- 从 SKILL.md 渐进披露；主流程见 ../SKILL.md [HARD-GATE] -->

[HARD-GATE Rationalizations]

在 **Product-Spec.md 已保存且用户明确确认之前**，禁止进入 `/dev-planner`、`/dev-builder`，禁止创建或修改 `src/`、`app/`、`lib/`、`packages/` 下的业务代码。

| 借口 | 正确响应 |
|------|----------|
| 「需求很清楚，直接写代码」 | 清楚不等于已写入 Spec。先完成访谈并保存 `Product-Spec.md`，用户确认后再开发。 |
| 「先做个 MVP 原型给用户看」 | 原型也必须在 Spec 边界内。无确认 Spec 的代码会跑偏且无法验收。 |
| 「只改一个文件 / 加个小功能」 | 迭代模式也要更新 Spec 并确认；小改动走 Iteration Mode，不是跳过 Spec。 |
| 「用户很急，边做边补文档」 | 急更要先对齐范围。5 分钟确认 Spec 比 30 分钟返工便宜。 |
| 「Spec 以后再写，先搭架子」 | 架子会固化错误假设。HARD-GATE 不允许「先代码后 Spec」。 |
| 「用 /dev-builder 快速试一下」 | `/dev-builder` 依赖 DEV-PLAN；无 Spec 时只能 `/product-spec-builder`。 |
| 「在 examples/ 或 test-demo/ 里试不算业务代码」 | 用户项目业务目录仍受 HARD-GATE 约束；试验性代码也须 Spec 或 change 提案覆盖。 |
