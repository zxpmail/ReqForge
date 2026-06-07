# Workflow Cookbook

> Workflow（`agent()`/`parallel()`/`pipeline()`）是 Claude Code 内置的编排工具。
> 本文是它的菜谱集——每道菜解决一个问题，直接抄。

## 平台兼容性

| 能力 | Claude Code | OpenCode | Cursor | Gemini CLI |
|------|:-----------:|:--------:|:------:|:----------:|
| agent() 编排 | ✅ 原生 | ✅ 支持 | ⚠️ 不直接等价 | ❌ 不支持 |
| agents/*.md 子代理 | ✅ 原生 | ✅ 支持 | ❌ 规则系统 | ⚠️ 待确认 |
| budget API | ✅ 内置 | ❌ 未知 | ❌ 未知 | ❌ 未知 |

**本文档主要为 Claude Code 编写。** 适配其他平台时酌情转换。

---

## 厨具（Budget API）

每道菜都用到的通用工具：

```javascript
budget.total        // token 上限（未设则为 null）
budget.spent()      // 已消耗的 output token
budget.remaining()  // 剩余，无上限时 Infinity
```

---

## 菜谱

### 1. 跑不完就停（熔断循环）

**场景**：你不确定要找多少东西，但不想跑死。

```
while (budget.total && budget.remaining() > 50_000) {
  const batch = await agent("继续找...", { schema: ITEMS })
  if (!batch.length) break
  results.push(...batch.items)
}
```

**变体 – 连续跑空即停**（不用 budget）：
```
let dry = 0
while (dry < 3) {
  const batch = await agent("继续找...", { schema: ITEMS })
  if (!batch.length) { dry++; continue }
  dry = 0; results.push(...batch.items)
}
```

---

### 2. 分头扫，再汇总（Multi-Modal Sweep）

**场景**：同一个问题从不同角度查，覆盖更全。

```
const results = await parallel(
  ["安全漏洞", "性能问题", "代码异味"].map(lens => () =>
    agent(`从 ${lens} 角度审查`, { schema: FINDINGS })
  )
)
const all = results.filter(Boolean).flatMap(r => r.findings)
```

---

### 3. 找到的东西找人验证（Adversarial Verify）

**场景**：AI 容易编造证据，让另一个 AI 反驳它。

```
const votes = await parallel(
  Array.from({length: 3}, () => () =>
    agent(`反驳这个发现: "${claim}". 不确定就默认反驳成立。`, { schema: VERDICT })
  )
)
const survived = votes.filter(Boolean).filter(v => !v.refuted).length >= 2
```

---

### 4. 多个方案比一比（Judge Panel）

**场景**：一个问题有多种解法，跑几个方案再打分。

```
const solutions = await parallel(
  ["MVP 优先", "安全优先", "性能优先"].map(lens => () =>
    agent(`以 ${lens} 角度设计方案`, { schema: SOLUTION })
  )
)
const scores = await parallel(
  solutions.map(s => () =>
    agent(`给这个方案打分（0-10）`, { schema: SCORE })
  )
)
// scores.sort(...) 取最优
```

---

### 5. 逐项处理流水线（Pipeline）

**场景**：多个项目，每项都要经过相同的步骤链。

```
await pipeline(
  items,
  item => agent(`审核 ${item}`, { schema: REVIEW }),          // 第一阶段
  review => agent(`修复 ${review.issues}`, { schema: FIX }),   // 第二阶段
)
// 每项独立走完所有阶段，A 在阶段 3 时 B 可能在阶段 1
```

---

### 6. 最后检查有没有漏（Completeness Critic）

**场景**：一轮扫完了，但不确定有没有盲区。

```
const gaps = await agent(
  "检查完整性: 什么没覆盖？什么声明未验证？什么来源没读？",
  { schema: GAPS }
)
if (gaps.length) {
  // 把 gaps 当新 item 再跑一轮
}
```

---

### 7. 重试不超过 N 次（Retry Guard）

**场景**：单个 agent 有时会挂，但不想无限重试。

```
for (let i = 0; i < 3; i++) {
  try {
    result = await agent(prompt, { schema })
    break
  } catch (e) {
    if (i === 2) log(`跳过: ${label}`)
  }
}
```

---

## 和 Forge 代理的搭配

| 你想用的 Agent | 适合的菜谱 |
|---------------|-----------|
| `code-reviewer-*.md`（多角度审查）| 菜谱 2（分头扫）|
| `implementer.md`（分派执行）| 菜谱 5（流水线）|
| `planner.md`（架构规划）| 单次调用即可 |
| `feedback-observer.md`（反馈分析）| 单次调用即可 |
| `evolution-runner.md`（进化执行）| 顺序执行即可 |

## 安全提示

- **不要没有上限的 `while(true)`** —— 用 budget 或硬编码次数兜底
- **`filter(Boolean)` 是标配** —— 某个 agent 挂了返回 null，下游要扛得住
- **用 `schema` 参数** —— 结构化输出比自由文本可靠
- **并行不是免费** —— 默认 ~10 并发够用了，不需要开更多

---

## 组装示例

三道完整的菜，从 agent 定义到 workflow 脚本，看看它们怎么串起来。

---

### 示例 A：代码审查 → 自动修复

**用到的零件**：
- Agents：`code-reviewer-bug.md` / `code-reviewer-security.md` / `code-reviewer-types.md`
- Skill：`code-review`
- 菜谱：菜谱 2（分头扫）+ 菜谱 7（重试 Guard）

**完整的 Workflow 脚本**：

```javascript
export const meta = {
  name: 'review-and-fix',
  description: 'Parallel code review → verified fixes',
  phases: [
    { title: 'Review', detail: 'multi-angle scan' },
    { title: 'Fix', detail: 'apply confirmed fixes' },
    { title: 'Verify', detail: 'check nothing broke' },
  ],
}

// == Phase 1: 分头扫 ==
phase('Review')
const DIMENSIONS = [
  { key: 'bug',     prompt: '审 pr #42 的 diff，找 bug',     agent: 'code-reviewer-bug' },
  { key: 'security', prompt: '审安全漏洞',                     agent: 'code-reviewer-security' },
  { key: 'types',   prompt: '审类型安全',                      agent: 'code-reviewer-types' },
]
const reviews = await parallel(
  DIMENSIONS.map(d => () =>
    agent(d.prompt, { label: `review:${d.key}`, schema: FINDINGS })
  )
)
const all = reviews.filter(Boolean).flatMap(r => r.findings)
log(`找到 ${all.length} 个发现`)

// == Phase 2: 对抗验证后修复 ==
phase('Fix')
const confirmed = await pipeline(
  all,
  f => agent(`反驳: "${f.summary}"`, { label: `verify:${f.file}`, schema: VERDICT }),
  v => v.confirmed
    ? agent(`修复 ${v.file}:${v.line}`, { label: `fix:${v.file}`, schema: FIX })
    : null
)

// == Phase 3: 验证 ==
phase('Verify')
const results = await parallel(
  confirmed.filter(Boolean).map(fix => () =>
    agent(`验证修复没搞坏别的东西`, { label: `check:${fix.file}`, schema: CHECK })
  )
)
return { fixes: confirmed.length, verified: results.filter(Boolean).length }
```

---

### 示例 B：需求 → 计划 → 按 phase 开发

**用到的零件**：
- Agents：`planner.md`、`implementer.md`
- Skills：`product-spec-builder`、`dev-planner`、`dev-builder`
- 菜谱：菜谱 5（Pipeline）+ 熔断循环

**完整的 Workflow 脚本**：

```javascript
export const meta = {
  name: 'spec-to-ship',
  description: 'Full spec → plan → implement pipeline',
  phases: [
    { title: 'Plan', detail: 'spec + architecture' },
    { title: 'Build', detail: 'implement phases in order' },
    { title: 'Ship', detail: 'final review + release' },
  ],
}

const spec = 'Product-Spec.md'

// == Phase 1: 规划 ==
phase('Plan')
const plan = await agent(
  `读 ${spec} → 生成 DEV-PLAN.md`,
  { label: 'planner', schema: DEV_PLAN }
)
log(`拆分出 ${plan.phases.length} 个 Phase`)

// == Phase 2: 按 phase 依次执行 ==
phase('Build')
const built = await pipeline(
  plan.phases.filter(p => !p.completed),
  p => agent(`执行 Phase: ${p.name}`, { label: `build:${p.name}`, schema: DELIVERABLES }),
  d => agent(`验证并清理: ${d.files.join(', ')}`, { label: `verify:${d.phase}`, schema: VERIFY })
)

// == Phase 3: 收尾 ==
phase('Ship')
const result = await agent('运行 release-builder', { label: 'release', schema: RELEASE })
return { phases: plan.phases.length, built: built.filter(Boolean).length, version: result.version }
```

---

### 示例 C：反馈驱动进化

**用到的零件**：
- Agents：`feedback-observer.md`、`evolution-runner.md`
- Skills：`evolution-engine`
- 菜谱：菜谱 6（完整性审查）+ 熔断循环

**完整的 Workflow 脚本**：

```javascript
export const meta = {
  name: 'evolve-from-feedback',
  description: 'Analyze feedback → propose → apply evolution',
  phases: [
    { title: 'Analyze', detail: 'scan feedback dir' },
    { title: 'Evolve', detail: 'propose + apply changes' },
  ],
}

// == Phase 1: 分析所有反馈 ==
phase('Analyze')
const allFeedback = await agent(
  '扫 feedback/ 目录，按类型归类',
  { label: 'feedback-observer', schema: FEEDBACK_REPORT }
)
log(`${allFeedback.categories.length} 类反馈，共 ${allFeedback.total} 条`)

// == Phase 2: 逐类进化 ==
phase('Evolve')
const results = await pipeline(
  allFeedback.categories.filter(c => c.count >= 3),
  cat => agent(
    `分析 "${cat.name}" 类反馈，生成进化提案`,
    { label: `evolve:${cat.name}`, schema: PROPOSAL }
  ),
  prop => prop.approved
    ? agent(`应用进化: ${prop.action}`, { label: `apply:${prop.target}`, schema: RESULT })
    : null
)
return { evolved: results.filter(Boolean).length }
```
