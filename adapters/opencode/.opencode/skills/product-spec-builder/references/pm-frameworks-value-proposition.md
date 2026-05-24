# 价值主张（6 段 JTBD）

<!-- 框架来自 pm-skills `value-proposition`（MIT / phuryn/pm-skills） -->

## 用途

在 **Requirements Exploration** 或 **Document Generation** 阶段，把「产品概述」从一段话升级为可检验的价值主张，写入 Spec 的 **Value Proposition (JTBD)** 小节。

## 六段模板（访谈时逐段追问）

| # | 段落 | 要问清的问题 |
|---|------|----------------|
| 1 | **Who** | 为谁？细分用户特征与约束（非泛泛「用户」） |
| 2 | **Why（问题）** | 核心 Job to Be Done？期望结果是什么？ |
| 3 | **What Before** | 今天怎么凑合解决？现有工具/习惯？ |
| 4 | **How（你的产品）** | 你怎么帮他们完成工作？关键能力一句说清 |
| 5 | **What After** | 用完后状态有何不同？可观察的变化？ |
| 6 | **Alternatives** | 若不选你，他们会选谁？为什么仍可能输？ |

## 写入 Spec 的格式

```markdown
## Value Proposition (JTBD)

| 段落 | 内容 |
|------|------|
| Who | … |
| Why | … |
| What Before | … |
| How | … |
| What After | … |
| Alternatives | … |
```

## 与 Forge 原则对齐

- **AI-First**：在 How 段标明哪些步骤可由 AI 代劳或增强
- **Simplicity-First**：Alternatives 段用于砍 v1  scope——「竞品已满足的部分我们不做」
- 信息不足标 `[TBD]`，不得编造调研结论；竞品事实须 **WebSearch** 验证
