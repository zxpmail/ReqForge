# 关键假设识别与优先级

<!-- 框架来自 pm-skills `identify-assumptions-new` / `prioritize-assumptions`（MIT / phuryn/pm-skills） -->

## 用途

在 **Clarifying Questions** 或 **Requirements Refinement** 阶段，把 Socratic 挑战落到结构化假设表，写入 Spec **Key Assumptions & Validation**。

## 8 类风险（新产品）

| 类别 | 典型假设示例 |
|------|----------------|
| Value | 用户是否真需要？会持续用吗？ |
| Usability | 能否快速上手？认知负担是否过高？ |
| Viability | 能否变现/支撑成本？合规？ |
| Feasibility | 现有技术栈能否实现？集成是否可行？ |
| Ethics | 是否应该做？对用户有何风险？ |
| Go-to-Market | 能否触达用户？渠道与信息是否匹配？ |
| Strategy | 竞品是否易复制？宏观环境？ |
| Team | 能力与人手是否匹配？ |

## 三视角头脑风暴（各写 2–3 条）

- **PM**：需求、付费、竞争
- **设计**：首次体验、留存、 onboarding
- **工程**：构建成本、扩展、技术债

## 优先级（Impact × Risk）

| 象限 | 动作 |
|------|------|
| 高影响 + 高风险 | v1 前必须实验或砍 scope |
| 高影响 + 低风险 | 写入 Spec 为已接受前提 |
| 低影响 | 标 `[TBD]` 或 v2 |

## 写入 Spec 的表格

```markdown
## Key Assumptions & Validation

| ID | 假设 | 类别 | 置信度 | 验证方式 | 成功标准 | 未验证对 v1 的影响 |
|----|------|------|--------|----------|----------|-------------------|
| A1 | … | Value | 低 | 5 人访谈 | … | 阻塞 / 可延后 |
```

## 与 dev-planner 衔接

- **阻塞级**假设未验证 → 在 Spec 的 Out of Scope 或 Phase 1 注明「先实验再开发」
- 验证方式优先 **非代码**（访谈、落地页、Wizard of Oz）；避免用完整 dev-builder 做 pretotype
