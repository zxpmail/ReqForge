# Experience Routing Agentic（DeepSeek 混合）报告

> DeepSeek 仅用于冻结 worker rollout；本地 prompt 策略 θ 被更新。不得表述为「微调了 DeepSeek」。非大规模 agentic RL 实证。

- **模式:** mock
- **凭证:** mock
- **模型:** deepseek-v4-flash
- **裁决:** `weak_success_agentic`

## 汇总

| 指标 | A 被动池 | B 准入路由 |
|------|----------|------------|
| 平均成功率 | 1.0 | 1.0 |
| 危险进准入(累计) | 5 | 0 |
| 深读比平均下降 | — | 0.3836 |
| 信号 Spearman | — | 1.0 |

## 各 seed

| seed | succA | succB | Δ | deep↓ | hazB |
|-----:|------:|------:|--:|------:|-----:|
| 7 | 1.0 | 1.0 | 0.0 | 0.3836 | 0 |

## 预注册失败条件

- 可测条件：**未触发**

预算: `{}`

对应：`docs/drafts/experience-routing-position-paper-zh.md §7`