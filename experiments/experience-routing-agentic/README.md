# Experience Routing Agentic（DeepSeek 混合架构）

对应立场文 §7。DeepSeek 只做 **冻结 worker rollout**；可训练的是本地 prompt 策略 θ。

## 边界（必读）

| 是 | 不是 |
|----|------|
| DeepSeek 多步工具调用采集轨迹 | 微调 / 更新 DeepSeek 权重 |
| 同一本地优化器上 A/B 准入对照 | 大规模 agentic RL 实证 |
| 可用 CC Switch 里的 DeepSeek 凭证 | 可写成「我们微调了 DeepSeek」 |

## 凭证

优先级：

1. 环境变量 `DEEPSEEK_API_KEY` 或 `ANTHROPIC_AUTH_TOKEN`
2. **CC Switch** `~/.cc-switch/cc-switch.db` 中名为 `DeepSeek` 的 provider

默认走 OpenAI 兼容：`https://api.deepseek.com/chat/completions`，模型 `deepseek-v4-flash`。

## 怎么跑

```bash
# 真跑（读 CC Switch / 环境变量）
python experiments/experience-routing-agentic/train_ab.py

# 单 seed
python experiments/experience-routing-agentic/train_ab.py --seed 7

# 结构自检（不调 API，非实证）
python experiments/experience-routing-agentic/train_ab.py --mock
```

报告：`out/report-live.md` / `out/report-mock.md`。

## Arms

- **A** 被动池：轨迹几乎全进本地 θ 更新  
- **B** 准入：隔离危险工具 / hazard 题，再按 route_score 取安全子集更新  

## 与 Stub / Small 的关系

Stub（合成）→ Small（GridWorld）→ **本目录（DeepSeek 工具智能体 + 本地 θ）**。
