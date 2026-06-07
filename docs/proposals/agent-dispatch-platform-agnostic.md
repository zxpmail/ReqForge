## 问题

code-review 和 dev-builder 的 workflow.md 中，子代理分发（dispatch）写死了 Claude Code 的 agent 名字：

**code-review/workflow.md** Step 2（最硬）：
```
dispatch 4 specialized agents concurrently:
- code-reviewer-design
- code-reviewer-bug
- code-reviewer-security
- code-reviewer-types
```

**dev-builder/workflow.md** Step 7：
```
Dispatch implementer with isolated packet
```
Step 14：
```
Dispatch code-reviewer with affected_files
```

换成 OpenCode / Cursor 时，这些 agent 名字和 dispatch 机制不通用。

## 方案

把 dispatch 决策抽象成平台无关的 reference 文档，workflow.md 只引用不实现：

```
workflow.md: "执行多角度审查 → 见 parallel-review-strategy.md"
                                                ↓
parallel-review-strategy.md（平台无关）
  └─ 决策表：什么场景需要哪些审查维度
  └─ 输入/输出契约：审查需要什么，返回什么
  └─ 各平台 adapter 自行实现 dispatch 机制
```

这样 workflow.md 不再写死 `code-reviewer-bug` 这样的 Claude Code 特定 agent 名，只描述「需要做什么审查」。每个平台的 adapter 决定怎么执行。

## 不做
- 不重写已有 workflow.md——只抽离 dispatch 部分
- 不改变审查合约（输入/输出格式保持不变）
- 四个审查 agent 的定义留在 core/agents/，作为 Claude Code 的参考实现

## 状态

提议待评估。
