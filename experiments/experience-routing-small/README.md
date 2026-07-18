# Experience Routing 小任务真训

对应立场文 §7。在 **同一 REINFORCE 优化器** 上只改经验准入，比较干净评测成功率与深读负担。

## 这是什么 / 不是什么

| 是 | 不是 |
|----|------|
| 真实参数更新 + held-out 成功率 | LLM / agentic RL |
| 可测失败条件 2/3/4/5（含条件 3） | 对大规模智能体 C2 的实证 |
| 白盒危险标签为主设定 | 可外推的算力结论 |

任务：5×5 GridWorld 导航。语料中混入 **回报污染** 的 hazard 轨迹（鼓励踩陷阱）；评测始终在干净环境。

## 怎么跑

```bash
# 主设定：白盒危险传感器（与立场文强形式范围一致）
node experiments/experience-routing-small/train.mjs

# 消融：10% 传感器噪声（常触发失败条件 4）
node experiments/experience-routing-small/train.mjs --sensor-noise=0.1
```

报告：`out/report-whitebox.md`（及 `report.md`）、`out/report-noise-10.md`。

## Arms

- **A** 被动池：全部轨迹进入梯度更新（含 hazard）
- **B** 准入：隔离高危险传感器样本，再按 routeScore 取安全集的一部分更新

## 与 Stub 的关系

| | Stub | 本小任务 |
|--|------|----------|
| 训练 | 无 | REINFORCE |
| 失败条件 3 | n/a | **可测** |
| 证据强度 | 协议演示 | 玩具 MDP 上的弱成功 |
