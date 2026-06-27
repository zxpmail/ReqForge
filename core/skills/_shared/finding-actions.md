# Finding Actions（共享指针）

> 每条 review finding 除 severity/impact/confidence/risk_rank 外，**额外**带 `action` 字段（谁来修）。各 Skill/Agent 不重复全文 → [`finding-actions.md`](../../docs/finding-actions.md)。

| action | 谁来修 | 判定 |
|--------|--------|------|
| `auto-fix` | bug-fixer / dev-builder（机器可定论） | 客观、机械、surgical；唯一正确改法 |
| `ask-user` | 人（立即 escalate，A/B/C，**永不自修**） | 挑战作者意图 / 产品行为 / 歧义 / S5 审美 / 预存死代码 |
| `no-op` | 不修（仅记录） | 信息性、Insight、无需 diff |

**判定一句话**：写不出「无需问作者就能落的一行 diff」→ `ask-user`；无需 diff → `no-op`；否则 `auto-fix`。

**正交**：action 回答「谁来修」，不替代 severity/risk_rank（多严重）、Must/Should/Insight（多重要）、Priority（多紧急）。

**向后兼容**：缺失该字段 → 路由按 `auto-fix` 处理（保持现状，fail-open）。

**复用先例**：`judgment-spectrum.md` S5（Human only, do not auto-fix）→ `ask-user`；`review-dimension-checklist.md` 预存死代码（mention only）→ `ask-user`/`no-op`；`workflow.md` Insight bucket → `no-op`。
