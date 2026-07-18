# Experience Routing Stub（合成对照）

对应立场文 [`docs/drafts/experience-routing-position-paper-zh.md`](../../docs/drafts/experience-routing-position-paper-zh.md) **§7 最小可证伪协议**。

## 这是什么 / 不是什么

| 是 | 不是 |
|----|------|
| 可执行的 A/B + 预注册失败条件 | 真实 agentic RL 训练 |
| 用合成轨迹检验「协议能否被否掉」 | 对 C2 的经验证实 |
| 可复现（固定 seed） | 可转述的算力/回报结论 |

## 怎么跑

```bash
# 默认：廉价信号与可学习性相关（协议演示）
node experiments/experience-routing-stub/run-stub.mjs

# 故意失相关：应触发失败条件 5（证明判负器可用）
node experiments/experience-routing-stub/run-stub.mjs --mode=decorrelated
```

报告写入 `out/report-<mode>.md` 与 `.json`。

## Arms

- **A** 被动池：约 95% 深读，几乎全进准入集（含危险）
- **B** 准入路由：指纹分档 → 仅 warm 选择性深读 → 危险隔离不进 \(D_{adm}\)

## Stub 可测的失败条件

| 条件 | Stub |
|------|------|
| 1 灰度失效 | 可测 |
| 2 无预算改善 | 可测（深读比） |
| 3 更新集回撤 | **n/a**（需真训） |
| 4 危险穿透 | 可测 |
| 5 信号失相关 | 可测（`--mode=decorrelated` 应触发） |
