---
name: sot-registry-template
description: SoT 注册表（Non-Negotiable Layer）。每个业务概念的权威实现位置与语义契约。模型生成新函数前必须查询；新增/修改条目 = 人类批准的 PR。dev-builder 强制读取，forge-sot-check 校验，forge-loop 启动时强制加载。
---

# SoT 注册表（Source of Truth）

> 不可协商层条目 — 独立于规格、独立于 Loop 迭代。
>
> **规则（本层对模型只读）：**
> 1. 生成任何新函数前先查本表：已有实现 → **复用**；认为不满足 → 在 Task 中显式写「为什么现有实现不满足」交人类批准，**不得直接重写**。
> 2. 新增 / 修改条目 = 人类批准的 PR（模型只能提议）。
> 3. `lastVerified` 超过 180 天 → `forge-sot-check` 判陈旧，需人类重新核验。
> 4. 允许的重复实现 → 人类批准后登记 `.forge/sot-exceptions.json`（必须带 `approvedBy` 字段，缺省无效）。
>
> 工具：`pnpm forge-sot-check`（check / list）· `pnpm forge-verify` 的 `sot-check` · forge-loop 每次启动强制加载本表。

## 条目格式

<!-- [example] 模板示例 — 检查器跳过注释内容。使用时删除本注释并按此格式填入项目真实条目。
### SOT-001 · 货币舍入
- **canonical**: `src/domain/money/round.ts`
- **contract**: 四舍五入到货币最小单位；JPY 无小数位；银行家舍入仅用于 ledger 结算
- **signal**: `roundHalfUp|toFixed\(2\)`
- **lastVerified**: YYYY-MM-DD
- **status**: active
-->

字段说明：

| 字段 | 含义 |
|------|------|
| `canonical` | 权威实现的文件/目录路径 — **必须真实存在**，否则检查失败（注册表不得撒谎） |
| `contract` | 语义契约（≥10 字符）：写清楚「什么算正确」，不是标签 |
| `signal` | 实现指纹正则：源码中出现它 = 疑似重复实现（canonical 自身除外）；多个备选用 `\|` 连接 |
| `lastVerified` | 人类最后核验日期（YYYY-MM-DD；陈旧阈值 180 天） |
| `status` | `active` / `superseded` / `deprecated`（仅 active 参与重复检测与陈旧检查） |

## 条目

<!-- [example] 在此追加条目：### SOT-NNN · 概念名 + 上表五个字段。id 顺序编号，不复用。 -->
