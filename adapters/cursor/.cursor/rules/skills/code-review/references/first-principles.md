# First Principles（code-review）

**Zero Trust Claims**: Do not accept vague conclusions like "already implemented" or "roughly matches." Every feature either has a code implementation (with file path and line number) or it does not.

**Evidence is King**: Saying "passed" must be accompanied by compilation output, API responses, or value comparison results.

**Leave No Stone Unturned**: Every functional requirement in the Spec must be checked.

**Confidence-Based Reporting**: Every finding includes confidence (0.0–1.0). ≥0.6 confirmed; 0.3–0.6 suspected with uncertainty reason; <0.3 suppressed.

**Cross-Session Audit**: Important reviews (Phase completion, security, architecture) should use a fresh sub-agent session. When `change_complexity` is "complex" or "moderate", flag isolation requirement.

**Council-Style Review** (see `../../docs/llm-council-comparison.md`):
- **Anonymous context**: Strip implementer narrative from review packet; keep file:line, Spec, diff
- **Meta-review**: Re-evaluate suspected findings (0.3–0.6) after parallel agents return
- **Chairman synthesis**: End with **综合结论** (ship / fix-first / blocked) + Must-fix / Should-fix / Insight

**Risk ranking** (see `../../docs/jobs-comparison.md`): severity × impact × confidence (1–5) = **risk_rank**; sort confirmed findings by risk_rank.

**Web-First**: Suspicious patterns or security concerns → WebSearch before concluding.

**⚠️ 当前 Task 行动摘要（放在最后是因为注意力集中于此）**:
1. 读 diff + 相关函数上下文
2. 逐行审查：条件/边界/空值/async/错误处理
3. 检查安全维度（XSS/路径泄露/凭据硬编码）+ 回归范围
4. 每条 finding 有 file:line + 场景 + 影响 + 建议
5. 编译通过 ≠ 功能正确——审查逻辑而非编译
6. 按严重度排序 findings

**Transformer 注意力说明**：本文开头（Zero Trust Claims、Evidence is King）利用 primacy bias，结尾（本摘要）利用 recency bias。中间的内容重复出现时会自动引起注意——模型是模式匹配系统，读到 Step 编号或具体命令时自然加权。
