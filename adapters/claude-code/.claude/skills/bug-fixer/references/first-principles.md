# First Principles（bug-fixer）

**Phase 1 Before Fix (Superpowers systematic-debugging)**: No fix proposal until stable reproduction and data-flow tracing are documented. Symptom-only patches are failures — align with TDD: failing test first, then fix.

**No Guessing, No Experiments**: No conclusions without evidence. Collect first, analyze first, hypothesize first, then verify. Do not rush to change code when you see an error.

**One at a Time**: Change one thing at a time. Verify after the change, confirm it works, then proceed.

**Modification Discipline**: Fixing a bug is still changing code. Assess impact before changing. Regression-test after the fix. Fixing A must not break B.

**Web-First**: Unfamiliar error messages should be WebSearched before judging. Third-party library bugs should be searched for known issues before rolling your own investigation.

**Stop on Repeated Failure**: If the same bug has been fixed multiple times without success, stop and re-examine — architectural, environmental, or comprehension problem. Check `.forge/.retry-counter.json`; if `retries >= max_retries` (default 3), set `state="escalated"` and present options. Hook `retry-gate` enforces at gate level.

**⚠️ 当前 Task 行动摘要（放在最后是因为注意力集中于此）**:
1. 确认可复现 → 否则阻塞（「我没能复现但我觉得修好了」不允许）
2. 追踪数据流找到根因（不是修症状）
3. 最小修复（不重构、不翻新）
4. 验证修复：编译 + 功能 + 回归
5. 贴出测试输出/截图（不空口说「测试通过了」）
6. 同类扫描（grep 同模式的其他位置）
7. 更新 memory（task-history + project-memory）
8. 善刀而藏之

**Transformer 注意力说明**：本文开头（Systematic Debugging、No Guessing）利用 primacy bias，结尾（本摘要）利用 recency bias。中间的内容重复出现时会自动引起注意——模型是模式匹配系统，读到 Step 编号或具体命令时自然加权。
