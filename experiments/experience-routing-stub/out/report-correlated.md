# Experience Routing Stub 报告

> 合成轨迹 Stub：验证协议可执行性，不构成对 C2 的经验证实。不得转述为真实算力/回报结论。

- **模式:** correlated
- **种子:** 42
- **语料哈希:** af1b482ccf75e0a6
- **train / held-out:** 300 / 100
- **裁决:** `weak_success_stub`

## Arm 对照

| 指标 | A 被动池 | B 准入路由 |
|------|----------|------------|
| 深读比 | 99.0% | 4.0% |
| 准入条数 | 300 | 8 |
| 隔离条数 | 0 | 40 |
| 危险进准入 | 21 | 0 |
| 代理回报(准入可学习率) | 0.3533 | 0.75 |
| 相对成本 | 165481.04 | 9829.04 |

深读比下降: **0.9497**

## 信号相关（失败条件 5）

- Spearman(routeScore, learnability) = **0.6856**
- 路由 top-15 命中率 = 0.8667
- 随机 top-15 命中率 = 0.2667
- 相对随机增益 = **0.6**

## 预注册失败条件

- 可测条件 1/2/4/5：**未触发**
- 失败条件 3: 需真实训练，Stub 跳过

## Bins（仅 B）

```
{
  "cold": 155,
  "warm": 105,
  "hotPromising": 19,
  "hotHazard": 21
}
```

对应立场文：`docs/drafts/experience-routing-position-paper-zh.md §7`