# Distillation Mode（需求蒸馏）

> 反讨好的「需求阶段」analog：不记录用户「说的」，**推断**用户「真正需要的」。
> 灵感：女娲「蒸馏一个人的思维模式」——从行为中提取结构，而不是从回答中记录文本。GitHub Issue #7。
> 同类：[critique-gate.md](critique-gate.md)（spec 生成后）、[plan-critique-check.md](../../dev-planner/references/plan-critique-check.md)（计划阶段）——本模式补**需求阶段**。

## 何时用

- 用户说 **distill**、**蒸馏**、**infer what I need**、**我不确定我想要什么**、**一句话说不清**
- 用户开头很模糊/抽象（"做个跟 AI 相关的东西"）——0-to-1 问答只会把模糊记得更精确
- **关键词触发（opt-in）**：未带关键词的模糊一句话仍走 Quick Mode

## 何时不用

- 用户已明确范围/功能 → 0-to-1 或 Quick Mode
- 用户说 "grill me" / "烤问" → Light Grill（对齐，非推断）
- Product-Spec.md 已存在 → Iteration Mode

## 核心洞察

用户回答的是「他以为他需要的」，不是「他真正需要的」。**用户说不出他不知道的东西**。所以推断（不依赖用户回答）+ 交叉验证，比问更多问题更有效——这是需求阶段的反讨好。

## 流程

1. **Capture**：原样记录用户的一句话。仅当该句零推断信号时，问 **至多一个** 框定问题。
2. **四路并行推断**（核心：推断**不依赖**用户回答——AI 做功，不转嫁用户）：

| 路径 | 推断什么 | 数据源 |
|------|---------|--------|
| **§P1 Real Need** | 嘴上说的功能背后，真正的 job-to-be-done | 用户原话 + 常识 |
| **§P2 Competitor Approaches** | 同类问题的现有解法 + 各自取舍 | 优先读 `domain-map.md`/`competitor-analysis.md`（`## 核心矛盾`），否则轻量 WebSearch |
| **§P3 Domain Patterns** | 该品类的共性、常见坑、反模式 | 优先读 `domain-map.md` `## 已知盲区`，否则 WebSearch |
| **§P4 Tech Feasibility** | 推断方案的可行性维度、约束、风险 | 技术常识 + WebSearch（版本/兼容性） |

3. **交叉验证**：产出「用户说的 vs 推断的」delta 表；每条 `⚠️` 必须附依据（`§P2 + <URL>` 或 `§inference-path`）。
4. **蒸馏输出**：产出 Distillation Map（✅/⚠️/❓），执行下面的密度配额 + 停止规则。
5. **Handoff**：`❓` → 作为 0-to-1 / Quick Mode 的**第一批澄清问题**；`✅`/`⚠️` → 预填入 Spec。

## 标记约定（复用，不新造）

- `✅` = 已确认——用户说了且通过交叉验证（high）
- `⚠️` = 推断需求，用户**没说**（med，必附 `basis`；无来源标 `⚠️[来源不足]`）——这是反讨好的表面
- `❓` = 不确定 / 待确认——映射 `[TBD]` / `[待确认]` / domain-mapper `已知盲区`（low）
- 每行带置信轴：`low/med/high`

## 密度配额 & 停止规则

（同 [critique-gate.md](critique-gate.md) 的反假批判逻辑）
- **配额**：`⚠️`+`❓` 合计 **≥3 条**实质性发现。**无 `basis` 的 `⚠️` 不计入配额**（不可证伪的推断最容易造假）。
- **低于配额 → 重扫一次**（更严提示：「至少找出 3 条用户没说、但很可能需要的推断，每条附依据」）。
- **0 条 `⚠️` = 最高讨好风险** → 强制重扫（原话 rubber-stamp）。
- **硬上限：1 pass + 1 次密度重扫**。这是 checkpoint，不是迭代精修。

## Distillation Map 输出格式

````markdown
# Distillation Map — <产品>

> 输入: <用户原话 verbatim> · 生成: {{ISO_DATE}}

### §P1–§P4 推断摘要
| 路径 | 关键推断 | 来源 |
|------|---------|------|
| §P1 Real Need | … | §inference |
| §P2 Competitors | … | <URL> 或 domain-map §核心矛盾 |
| §P3 Domain Patterns | … | <URL> 或 domain-map §已知盲区 |
| §P4 Tech Feasibility | … | <URL> |

### 蒸馏输出（用户说的 vs 推断的）
| ID | 项目 | 用户说了？ | 推断需求 | 置信度 | 标记 | 依据 basis |
|----|------|-----------|---------|--------|------|-----------|
| D1 | … | 是 | (确认) | high | ✅ | 用户原话 |
| D2 | … | 否 | … | med | ⚠️ | §P2 + <URL> |
| D3 | … | 否 | … | med | ⚠️[来源不足] | §P1 only |
| D4 | … | ? | … | low | ❓ | domain-map §已知盲区 / [待确认] |

### Verdict
<proceed / clarify / blocked>

### ❓ 待用户确认（→ 0-to-1/Quick 首批澄清问题）
1. D4: …
````

ID 前缀 `D`（Distillation）对齐 `CA/CD/CS`、`PO/MS/TS` 约定——供 `pnpm forge-spec-distill` 校验器行匹配。

## 与 X 的差异

| | Distillation | 0-to-1 Q&A | Quick Mode | Light Grill |
|--|---|---|---|---|
| 补全方式 | 多路推断 + 交叉验证 | 问用户 | 单路推断 + 默认值 | 问用户（决策树） |
| 反讨好表面 | `⚠️`（用户没说但需要的） | 无 | 无（rubber-stamp 风险） | 无 |
| 产出 | Distillation Map（中间件） | Product-Spec.md | Product-Spec.md | Grill Summary |
| 用户负担 | 极低（AI 推断） | 高（~20 问） | 极低 | 中 |

## Handoff

Distillation Map 是**中间件**，不是终态。完成后：`❓` → 0-to-1 / Quick Mode 首批澄清问题；`✅`/`⚠️` → 预填 Spec。HARD-GATE 仍以最终 Product-Spec.md 确认为准（本模式**不**写 `.forge/spec-confirmed.json`）。

## What Distillation Does NOT Do

- **不**替代用户确认——`❓` 项仍需用户拍板。
- **不**验证实现可行性（超出 §P4 表面扫描；代码审查负责）。
- **不**增加用户负担——推断是 AI 的工作量。

## 谁读这个

- `references/startup-check.md` 路由命中 `distill`/`蒸馏` → 加载本文件
- 校验：`pnpm forge-spec-distill <Distillation-Map>`（检查四路径齐、`⚠️` 带依据、`❓` 非空、密度配额）
