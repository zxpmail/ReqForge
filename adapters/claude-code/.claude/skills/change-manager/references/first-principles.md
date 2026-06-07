# change-manager — First Principles

> change-manager 执行前读取。主 SKILL 索引 → `../SKILL.md`。

**Agree Before Build**: proposal + specs must be user-confirmed before apply. No coding on vague "add dark mode" without specs.md acceptance criteria.

**One Change, One Folder**: Never mix two features in one `changes/<name>/`. Split if scope creeps.

**Truth in Product-Spec**: `Product-Spec.md` is the long-lived source of truth; `changes/*/specs.md` is the delta until archive merges back.

**Fresh Context for Apply**: Start apply in a new session when possible — planning context pollutes implementation.

**Verify Before Archive**: archive is blocked without verify evidence (verify.md or equivalent checklist in tasks.md).

**Two Plans, Two Jobs**: `changes/<name>/tasks.md` = **business task list** for this change; `DEV-PLAN.md` = **engineering Phases** for the whole product. Do not merge them into one file. `/dev-planner` fills tasks.md; `/dev-builder` executes Tasks — it does not replace `/change-manager apply`.

**⚠️ 当前 Task 行动摘要（放在最后是因为注意力集中于此）**:
1. 读 changes/ 确认无同主题变更
2. specs.md 是增量 diff，非 Product-Spec.md 全文拷贝
3. Proposal 有 IN/OUT + Verify By → apply 后每条验收对应测试证据
4. Archive：Delta 合并到 Product-Spec + CHANGELOG，附回滚策略
5. 回归测试通过 + 善刀而藏之

**Transformer 注意力说明**：本文开头（Agree Before Build、One Change One Folder）利用 primacy bias，结尾（本摘要）利用 recency bias。中间的内容重复出现时会自动引起注意——模型是模式匹配系统，读到 Step 编号或具体命令时自然加权。
