# 竞品与差异化（结构化简报）

<!-- 结构来自 pm-skills `competitor-analysis`（MIT / phuryn/pm-skills）；事实须 WebSearch，不得臆造 -->

## 用途

强化 [Requirements Exploration Phase] 的 WebSearch：从「随口提竞品」变为可写入 Spec 的 **Competitive Landscape** 小节。

## 步骤

1. **圈定市场**：品类、主要用户场景、成功要素
2. **识别 5 个直接竞品**（WebSearch + 用户补充）
3. 每竞品：**定位、核心功能、定价/商业模式、优劣势**
4. **差异化**：我方机会 gap、overlap、建议的 v1 聚焦点
5. **威胁**：跟随者、替代品（含「用户不用软件」的替代）

## 写入 Spec 的格式

```markdown
## Competitive Landscape

### Market overview
- …

### Competitors (top 5)

| 竞品 | 定位 | 优势 | 劣势 | 与我方关系 |
|------|------|------|------|------------|

### Differentiation
- 我们只做：…
- 我们明确不做（v1）：…

### Strategic note
- …
```

## 与 Forge 对齐

- 竞品功能 **不等于** 我方 Functional Requirements 清单——先映射到 **机会/问题**，再落功能
- 发现市场已红海 → 在对话中直接挑战（与 product-spec-builder 语气一致），必要时建议收窄细分或改 outcome
- 所有价格、功能声明需有 **搜索来源或用户确认**，否则标 `[待核实]`
