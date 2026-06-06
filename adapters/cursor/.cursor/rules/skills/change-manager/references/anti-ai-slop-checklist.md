# 反 AI 味清单（change-manager）

<!-- 提交 change 前自检，避免走过场式变更管理。 -->

[Anti–AI-Slop Checklist]

勾选通过后再 archive；任一项为「是」须回退到对应阶段补充。

| 检查项 | 通过标准 |
|--------|----------|
| 跳过 propose | 非「直接改代码」——proposal.md 有明确的 IN/OUT 边界 |
| 边界蠕变 | 变更范围未超出 proposal 定义的 IN 范围 |
| 验收敷衍 | verify.md 非「看起来正常」——有具体测试输出 |
| 遗漏回滚 | archive 前未定义回滚步骤——出事只能现场想 |
| 伪造 specs | specs.md 抄 Product-Spec.md 原文而非增量 diff |
| 悬空 archive | 归档后 Product-Spec.md / CHANGELOG 未同步更新 |
| 重复劳动 | 未检查 changes/ 是否有同主题进行中的变更——应 merge 而非重复 |
