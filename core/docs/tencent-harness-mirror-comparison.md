# ReqForge 与腾讯「Harness 镜子」对照

> 参考：[Harness 的尽头不是缰绳，是镜子：AI 时代最沉默的那场革命](https://mp.weixin.qq.com/s/ooTYAzFvxC4PCQ5H82dRhQ)（腾讯技术工程）  
> 与 [agent-harness-seven-layer-map.md](./agent-harness-seven-layer-map.md)、[harness-maturity-checklist.md](./harness-maturity-checklist.md) 互补。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **腾讯此文** | 哲学 + 组织：**Harness 是镜子**（显形 tacit 知识），三层穿透（意图 / 执行 / 判断），三块石碑 + 不可能三角 |
| **ReqForge** | 工程落地：**Spec → Plan → Build → Review → Release**，把可显形部分写进 Git + gate，保留人工判断与品味层 |

文章回答「为什么必须显形、代价是什么」；Forge 回答「在用户项目里怎么写、怎么验、怎么不刷指标」。

---

## 中心命题 ↔ Forge

| 文章命题 | ReqForge 落点 |
|----------|---------------|
| 缰绳另一头系着自己 | `Product-Spec` / `DEV-PLAN` 写的过程 = 团队自我澄清 |
| 第三次「显形」对准自己 | `memory/`、`feedback/`、`evolution-engine` 把隐性判断沉淀为文本 |
| AI = 永不疲倦、不懂潜台词的读者 | Spec 须可验证条款；模糊需求在 spec-builder 被追问 |
| 写文档 ROI 变正 | 每行 Spec/验收条款对应 Phase gate、`forge-verify` 后果 |

---

## 三层显形 ↔ Forge 主路径

| 层 | 文章 | Forge |
|----|------|-------|
| **意图** | 要什么被迫写成可执行文本 | `/product-spec-builder` → `Product-Spec.md` + 确认门 |
| **执行** | 怎么做进 Agent 工作流 | `DEV-PLAN.md` + `/dev-builder` Phase + hooks |
| **判断** | 什么叫「好」必须显形，但会 Goodhart | `/code-review`、`pnpm forge-verify`、`skill-eval`、进化 **Verify by** |

速度差下人类不能放弃审查 → Forge 的 **Task 微循环 + code-review + forge-verify**，不是「生成即交付」。

---

## 三块石碑 ↔ Forge 工件

| 石碑 | 文章 | Forge（v1.33+） |
|------|------|-----------------|
| **① 验收标准即代码** | 「成了」进 Git，与代码同 PR | Spec 验收条款、Phase checklist、`forge-verify` |
| **② 对抗性审查网络** | 做事 ≠ 审事；换角色/换模型 | `code-review` 多子 Agent；实现 Session ≠ 审查视角 |
| **③ 品味作为资产** | `Project Taste`：偏好陈述，非硬规则 | **`.forge/project-taste.md`**（`forge-install`） |

### 与 security-guidance 的分层

| 文件 | 性质 | 示例 |
|------|------|------|
| `security-guidance.md` | **红线**（硬纪律） | 禁止 `eval`、密钥入库 |
| `project-taste.md` | **指纹**（软偏好） | 「偏好简单胜过聪明」「继承不超过两层」 |

合规放 S1/S2；品味放 S3；战略与「带疤痕的判断」见下文「四处不刻」。

---

## 判断力光谱（S1–S5）

| 档 | 可显形程度 | 写什么 | Forge |
|----|------------|--------|-------|
| **S1** | 完全可测 | 硬断言、CI、lint | `forge-verify`、`skill-eval` cases |
| **S2** | 可条款化 | 功能验收、Spec 条目 | `Product-Spec.md` 验收、`DEV-PLAN` Phase |
| **S3** | 偏好陈述 | 团队口味、命名、结构倾向 | `.forge/project-taste.md` |
| **S4** | 语境判断 | 架构取舍、风险 tradeoff | `code-review` + `memory/decisions-log.md` |
| **S5** | 不可外包 | 战略、价值观底线、审美争论 | **Confirm 门**；不写入全自动 Eval |

成熟团队：**清楚每件事落在哪一档**——把 S4 写成 S1 是暴力；把合规丢在 S5 是失职。

---

## 不可能三角（判断工程）

三者不可兼得（文章断言，Forge 采纳为设计约束）：

1. **Spec 完备性** — 所有「好」都写下来  
2. **Goodhart 抗性** — 指标不被刷爆  
3. **Tacit 保全** — 直觉/审美不被抹除  

**Forge 立场：** 不追求 Eval 覆盖一切；用 **held-out**（[skill-eval.md](./skill-eval.md)）、**rejected-edits**（[skillopt-comparison.md](./skillopt-comparison.md)）、进化 **Confirm** 抗 Goodhart；用 **project-taste** + 人工 CR 保 Tacit。

---

## 科学林业警告 ↔ 勿窄化「好」

文章：第一代科学林业材积惊艳，第二代生态塌方——把「森林」窄化成「木材产出」。

**Forge 对应：**

- 勿把「好代码」窄化成「`pnpm test` 全绿」或「Eval 全过」  
- `forge-verify` / skill-eval 是 **必要不充分**  
- 老代码里的隐性约束、CR 时「说不清但不对」的直觉 → 记入 `project-taste` 或 `feedback/`，而非假装已测到

---

## 四处刻意不刻（文章）

| 不刻 | 原因 | Forge |
|------|------|-------|
| 战略方向 | 外包则人失去意义 | 不在 Spec 里写公司战略；Product-Spec 只写本产品 |
| 价值观底线 | 规则沉默处才见价值观 | 极少量写进 Spec「非目标」；其余靠 Confirm |
| 肌肉记忆禁忌 | 理性化后失效 | `project-taste` 可写「周四下午不发版」，但不进 CI |
| 审美争论 | 争论本身是健康信号 | `code-review` 可记录分歧，不强制单一分数 |

---

## 带疤痕的判断

文章：AI 不会半夜想起三年前的线上事故；**带承担意愿的判断**是人的护城河。

Forge：**不替代** 人对 Merge / 发布 / evolution Confirm 的责任；`code-review` 输出供人决策，不是自动合并。

---

## 刻意不做

- 把 Harness 叙事改成「纯控制 AI」（与「镜子」相反）  
- 用单一加权分定义「代码质量」  
- 在 Forge 内实现 Scott/Goodhart 的学术框架运行时  

---

## 参考

- [project-taste-template.md](../templates/project-taste-template.md)  
- [product-spec-builder/SKILL.md](../skills/product-spec-builder/SKILL.md) — Judgment Spectrum  
- [code-review/SKILL.md](../skills/code-review/SKILL.md) — Judgment Spectrum + Taste  
- [dev-builder/SKILL.md](../skills/dev-builder/SKILL.md) — Loading Phase 读 taste  
- [skillopt-comparison.md](./skillopt-comparison.md) · [security-guidance-comparison.md](./security-guidance-comparison.md)
