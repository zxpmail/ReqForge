# Finding Actions —— 谁来修每条 review finding

> 共享指针：`core/skills/_shared/finding-actions.md`。本全文供 code-review（4 个 specialist + aggregator）、bug-fixer、dev-builder 共用。

## 为什么需要 `action`

ReqForge 的 review finding 已有两套主轴：severity/impact/confidence/risk_rank（**多严重**）、`Must-fix/Should-fix/Insight`（**多重要**）。`Priority HIGH/MED/LOW` **由 bucket 派生**（有 Must-fix→HIGH；仅 Should-fix→MEDIUM；否则 LOW），禁止独立矛盾打分。但没有一个轴回答"**这条该不该被 agent 自动改**"。

结果：code-review 出报告后，主 Agent 按散文把"bug/security/type"一股脑丢给 bug-fixer，bug-fixer 把喂进来的**全部**当 bug 修——包括那些触碰作者意图、本该问人的东西。

`action` 是第四条**正交**轴，回答"谁来修"，借自 no-mistakes 的 finding 三分法。

## 三种 action

### `auto-fix` —— agent 可定论
客观、机械、surgical。改法由 finding 本身唯一确定，不改产品行为、不触碰作者意图，换一个 reviewer 会给出同一处改动。

示例：缺 `await`/`async`；`==`→`===`（两侧类型确定时）；明确可空路径上缺 null guard；`any`→可从用法推断的具体类型；未关闭的 handle/connection；字面量 typo；意图明确的 off-by-one。

### `ask-user` —— 人来定（立即 escalate，永不自修）
挑战作者的**刻意意图**、改变产品行为、存在歧义、需要价值判断。**绝不被 agent 自动应用**。

归入条件：
- `judgment-spectrum.md` 的 **S5**（策略 / 价值观 / 纯审美）——"Human only, note disagreement, do not auto-fix"
- 预存死代码（`review-dimension-checklist.md`："mention only, don't delete"）
- 行为变更决策（throw vs return-null、sync vs async 语义、是否兼容旧接口）
- Spec 歧义——且 finding 本身就是"意图不清楚"
- 偏好 / 口味（S3）且 `.forge/project-taste.md` 未定义

### `no-op` —— 不修（仅记录）
信息性、观察性，当下无需 diff。

归入条件：纯 Insight/笔记；已确认正确、仅为提醒而标记的代码；"这样没问题，但留意"类评论。

## 判定一句话（specialist 必背）

> 我能否**不问作者**就写出修这条的一行 diff？
> - 不能（要问意图 / 有歧义 / 是价值判断）→ `ask-user`
> - 无需 diff → `no-op`
> - 否则 → `auto-fix`

## 谁赋值

- **specialist sub-agent 赋值**：它手上就有 category + evidence + 局部代码上下文，正是判定"机械 vs 意图"所需的全部输入。
- **aggregator（code-reviewer）只传递、不重判**：原样透传每条 finding 的 `action`；缺字段按 `auto-fix`（fail-open，向后兼容）；额外只算一个报告级 `actions: {auto-fix, ask-user, no-op}` 计数。

## 路由（dev-builder / 主 Agent）

- `auto-fix` → dev-builder 填补（spec-gap）或 bug-fixer 修复（bug/security/type）。**仅此子集**进入 `.retry-counter.json` 的重试预算。
- `ask-user` → **立即 escalate**：写 `state="escalated"`（**不**自增 `retries`），呈现 `[Retry Escalation]` A/B/C。既有 `retry-gate.sh` 已在 `escalated` 时硬阻塞，故无需改 hook。`ask-user` 不消耗重试轮次——它不是 agent 能修的东西。
- `no-op` → 仅记录在报告，不进路由。

## 正交性护栏

`action` 不替换任何既有轴：

| 轴 | 问题 | 与 action 的关系 |
|----|------|------------------|
| severity / risk_rank | 多严重？ | severity-5 的 null deref 可同时是 `auto-fix`（明显的 guard） |
| Must/Should/Insight | 多重要？ | Must-fix 可同时是 `ask-user`（阻塞 ship 且需人决策——最坏情况，立即 escalate） |
| Priority HIGH/MED/LOW | 多紧急？（派生） | 由 Must/Should/Insight 派生，不独立打分 |

判定时**先判 `action`，再读 severity/bucket/priority**，避免被"严重"误导成"可自动修"。
