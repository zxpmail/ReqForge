# Light Grill Mode（轻量对齐）

> 灵感来自 [mattpocock/skills `grill-me`](https://github.com/mattpocock/skills)；Forge 完整 Spec 见 0-to-1 / Quick Mode。  
> 对照：[mattpocock-skills-comparison.md](../../../docs/mattpocock-skills-comparison.md)

## 何时用

- 用户说 **grill me**、**stress-test**、**烤问**、**对齐计划**（尚未要求写 Product-Spec）
- 有一个变更/设计想法，要先 **决策树走通**，再决定是否进 Spec 或 change-manager

## 何时不用

- 用户已明确「写 Spec / 更新 Product-Spec」→ 0-to-1 或 Iteration Mode  
- 用户一句话要开干 → Quick Mode

## 流程

1. **一次只问一个问题**；每题附带 **你的推荐答案**（带理由）。  
2. 能读仓库回答的 → **先读代码/文档**，别问用户。  
3. 沿决策树走：范围 → 用户/场景 → 约束 → 风险 → 验收标准（口头即可）。  
4. **可选**：若发现术语混乱，提议更新 `CONTEXT.md` 或 `.forge/project-taste.md` 一条（S3），**不**自动改 Product-Spec。  
5. 结束时输出 **Grill Summary**（≤15 行）：已决 / 未决 / 建议下一步（Spec、change propose、或再烤一轮）。

## 与 grill-with-docs 的差异

| | Light Grill（Forge） | grill-with-docs（Matt） |
|--|----------------------|-------------------------|
| 产出 | 摘要 + 可选 taste/CONTEXT 一条 | CONTEXT + ADR 内联更新 |
| 门槛 | 无 Product-Spec 也可 | 假设已有 repo 与 docs/agents |

Grill 结束后用户说「写成 Spec」→ 切 **0-to-1** 或 **Quick Mode**，把 Summary 当输入。
