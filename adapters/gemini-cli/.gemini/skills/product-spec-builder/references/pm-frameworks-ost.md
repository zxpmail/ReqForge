# 机会方案树（OST，可选发现阶段）

<!-- 框架来自 pm-skills `opportunity-solution-tree`（MIT / Teresa Torres, Continuous Discovery Habits） -->

## 用途

**0-to-1 可选前置**：在深入 UI/功能细节前，防止「第一个想法即方案」。适合用户说「我想做一个 XX App」但尚未证明值得做。

## 四层结构

1. **Desired Outcome（顶）** — 一个可度量结果（如「7 日留存到 40%」），来自战略/OKR，不是功能列表
2. **Opportunities（机会）** — 客户痛点/需求，用客户语言（「我很难…」「我希望…」），**不是功能名**
3. **Solutions（方案）** — 每个机会至少 **3** 个方案（PM/设计/工程视角），避免第一个想法
4. **Experiments（实验）** — 对最有希望的方案设计便宜验证：假设、方法、指标、成功阈值

## 访谈步骤（约 15–30 分钟，可压缩）

1. 与用户确认 **单一** desired outcome
2. 从已有反馈/访谈/WebSearch 列出 3–7 个机会，按 **Opportunity Score** 粗排：Importance × (1 − Satisfaction)（0–1 归一化即可）
3. 只对 **前 2–3 个机会** 头脑风暴方案（每机会 ≥3 个）
4. 为 1–2 个方案写实验卡片（可 pretotype，非完整开发）

## 输出到 Spec

- 将选定 outcome 写入 **Success Metrics** 的 North Star
- 将优先机会映射到 **Use Cases** / **Functional Requirements**（注明来源机会）
- 将待验证实验写入 **Key Assumptions & Validation**（未验证前功能标 `[假设待验证]`）

## 树形展示（对话中给用户看）

```text
Outcome: …
├── Opportunity A
│   ├── Solution A1 → Experiment …
│   ├── Solution A2
│   └── Solution A3
└── Opportunity B
    └── …
```

## 注意

- OST **不替代** Product-Spec 的 UI Layout、AI 能力表、Integrations 等 Forge 必填项
- 用户拒绝发现阶段 → 直接进入 [Requirements Exploration Phase]，不纠缠
