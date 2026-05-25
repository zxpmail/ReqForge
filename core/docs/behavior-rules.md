# Behavior Rules

Karpathy 四原则的 ReqForge 落地版。每个 Skill 执行时须遵守。

---

## 何时可简化

**原则不是教条**。以下场景可以跳过或简化严谨流程，用判断力替代：

| 可简化场景 | 示例 | 可以跳过什么 |
|-----------|------|------------|
| 琐碎变更 | typo 修正、重命名、单行改动、注释更新 | Think Before Coding 的完整假设列举；无需走 Goal-Driven 测试优先 |
| 纯配置 | 修改颜色值、环境变量、依赖版本 | Simplicity First 的重写评估 |
| 紧急修复 | production 中断，需要立即止血 | Goal-Driven 的测试优先（但仍需修复后验证）|
| 纯文档 | README 更新、注释修正 | Surgical Changes 可放宽（但不要顺手改代码）|
| 机械化操作 | 批量重命名、格式化、lint 修复 | 全部原则均可简化——执行工具命令即可 |

**关键判断**：如果改动 >3 个文件、涉及业务逻辑、或影响用户可见行为，走完整流程。
**原则**：在 trivial 任务上过度谨慎和在有风险的任务上过于草率一样糟糕。使用判断力。

---

## 1. Think Before Coding

**不猜假设。不隐藏困惑。摆出 tradeoff。**

| 场景 | ❌ 错误做法 | ✅ 正确做法 |
|------|-----------|-----------|
| 需求模糊时 | 默认一种理解并直接开干 | 列出 2-3 种可能的理解，逐一标注证据支撑程度，让用户确认 |
| 有更简单方案时 | 闷头按复杂方案实现 | "有一个更简单的方法：XXX。缺点是 YYY。是否采用？" |
| 不确定 API 行为时 | 凭记忆写代码 | WebSearch 确认文档，或者在 REPL 里先跑一下验证 |
| 实现与 Spec 冲突时 | 默默按自己的想法改 | 停下，说明冲突点，"Spec 说 X，但我觉得 Y 更合理，你的意见？" |

**规则**：在收到用户确认之前，不得进入任何实际编码步骤。

---

## 2. Simplicity First

**最少代码解决问题。不写投机性代码。**

| 场景 | ❌ 错误做法 | ✅ 正确做法 |
|------|-----------|-----------|
| 写一个函数 | Strategy Pattern + 抽象工厂 + dataclass + 配置系统 | 一个纯函数，不超过 20 行 |
| 用户说"加个折扣" | 设计完整的促销引擎、优惠券系统、过期策略 | 一个 `calculate_discount(amount, percent)` 函数 |
| 做输入验证 | 引入 zod/yup + 构建验证中间件 + 统一错误处理架构 | 在入口处写 3 行 if-return |
| 写数据库查询 | ORM + Repository Pattern + Unit of Work + 查询对象 | 一把参数化 SQL 或 ORM 的 `find()` |

**检验标准**：一个资深工程师会说"这过度设计了吗？"如果是，简化。

**例外**：只有当需求中明确列出了多种策略/可配置项时，才引入抽象。

---

## 3. Surgical Changes

**只改必须改的。只清理自己制造的混乱。**

| 场景 | ❌ 错误做法 | ✅ 正确做法 |
|------|-----------|-----------|
| 修一个空指针 bug | 顺手加了类型注解、改了引用风格、重构了相邻方法 | 只改那 1-2 行 |
| 改 CSS | 顺手格式化了整个文件、改了组件结构 | 只改颜色值/间距 |
| 发现无关的死代码 | 顺手删掉 | 口头提一下，不改 |
| 新增一个功能 | 顺手"优化"了周围的代码风格 | 不碰任何没要求的代码 |

**检验标准**：每一个变更行都应直接追溯到用户请求或 Spec 条目。

**必须清理**：仅限你自己的改动引入了无用 import/变量/函数。

---

## 4. Goal-Driven Execution

**定义可验证的成功标准。循环直到验证通过。**

| 模糊指令 | → | 可验证目标 |
|---------|---|-----------|
| "加个验证" | → | "先写测试验证非法输入会报错，然后让测试通过" |
| "修这个 bug" | → | "先写复现测试，然后让测试通过" |
| "重构 X" | → | "确保重构前后测试都通过" |
| "优化性能" | → | "当前耗时 500ms，优化后 <100ms，用 bench 脚本验证" |

多步骤任务必须写简短 plan：

```
1. [步骤] → 验证: [检查方式]
2. [步骤] → 验证: [检查方式]
3. [步骤] → 验证: [检查方式]
```

**强成功标准**：可以独立循环（"让测试通过"）。
**弱成功标准**：需要不断向用户确认（"这样可以吗？"）。

---

## 违反信号

| 信号 | 触发了哪条原则 | 案例（feedback / 教训） |
|------|--------------|------------------------|
| diff 里有格式/注释变更 | Surgical Changes | — |
| diff 比预期大很多 | Simplicity First / Surgical Changes | — |
| 编码前没有问澄清问题 | Think Before Coding | — |
| 实现偏离了用户说的范围 | Think Before Coding | — |
| 提交信息写"还顺便修了 XX" | Surgical Changes | — |
| 代码里有"也许以后会用"的部分 | Simplicity First | — |
| 完成声明没有附验证命令输出 | Goal-Driven Execution | — |
| 单次验证后仍标 DONE（未循环重跑） | Goal-Driven Execution | `dev-builder-single-pass-verification-insufficient.md` |
| Phase/Spec 一轮校验仍漏项 | Goal-Driven Execution | `product-spec-builder-final-validation-single-pass-insufficient.md` |

> **案例编号约定**：`feedback/<slug>.md` 为 ReqForge 仓库内 case ID；升格进规则或 EVOLUTION 时保留 `source_feedback` 链接。进化引擎扫描 `feedback/` 时应优先补全上表「案例」列。

---

## 参考

- [Karpathy 原始推文](https://x.com/karpathy/status/2015883857489522876)
- [andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) — CLAUDE.md 和 EXAMPLES.md
