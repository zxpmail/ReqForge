# ReqForge 与《Agent Harness Engineering》综述对照

> 参考微信解读：[Agent Harness 工程最新综述：模型之外，决定 Agent 能不能上线的那层系统](https://mp.weixin.qq.com/s/gFeutn69NzIb2muQqVIWkQ)（AINLP，基于联合综述）  
> 原文：[Agent Harness Engineering: A Survey](https://openreview.net/forum?id=eONq7FdiHa) · [项目页](https://picrew.github.io/LLM-Harness/) · [Awesome catalog](https://github.com/Picrew/awesome-agent-harness)  
> 与 [agent-harness-seven-layer-map.md](./agent-harness-seven-layer-map.md)（教学七层）、[tencent-harness-mirror-comparison.md](./tencent-harness-mirror-comparison.md)（Harness 镜子哲学）、[harness-maturity-checklist.md](./harness-maturity-checklist.md)（生产自检）互补。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **综述 + 此文** | 学术/工程共同语言：**ETCLOVG** 七层、Prompt→Context→**Harness** 三阶段、trace-native 评估、Framework→Platform |
| **ReqForge** | 在 Harness 层落地 **需求→可发布产品**：Spec/Plan/Build/Review/Release + Git 工件 + 机器门 |

文章回答「上线前那层系统包含什么、开源哪里薄」；Forge 回答「在用户项目里先补哪几层、哪些 deliberately 不做」。

---

## 综述核心论点（摘要）

1. **同一模型，不同 harness，表现可差一个数量级**（论文引用：仅改工具格式/hooks 的编码 benchmark 提升、Terminal-Bench 52.8%→66.5%、Meta-Harness 自动优化至 76.4%）——数字需回到原实验口径，但方向一致：**长任务成败常在模型外**。
2. **三阶段演进（2022–2026）**  
   - Prompt Engineering：怎么跟模型说  
   - Context Engineering：每一步看见什么  
   - **Harness Engineering**：在真实环境里怎么行动、可追踪、可验收、可治理
3. **ETCLOVG 七层**  
   - **结构层** E/T/C/L：环境、工具协议、上下文与记忆、生命周期编排  
   - **控制面** O/V/G：可观测、验证评估、治理安全
4. **开源生态**：Lifecycle 项目最密；Observability / Governance 相对薄（多藏在企业平台）。
5. **跨层矛盾**：成本–质量–速度三角；能力 vs 控制；**harness coupling**（改一层牵动全局）。
6. **趋势**：Agent 从 **Framework → Platform**（durable workspace、sandbox、identity、billing、trace、eval、governance）。
7. **开放问题**：模型变强后 harness 应 **自我简化**（ablation），而非无限叠 wrapper。

---

## ETCLOVG ↔ ReqForge 映射

| 层 | 综述问题 | ReqForge 落点 | 成熟度 |
|----|----------|---------------|--------|
| **E** Execution | 在哪跑、沙箱与边界 | 用户本机 + AI 客户端；**非**托管远程沙箱 | 依赖用户/CI 环境 |
| **T** Tool | 工具描述、协议、可验证调用 | 12 Skills、`references/`、MCP（Context7/Playwright 等）、bash | 强（Skill 即 Agent 工具） |
| **C** Context | 短期/长期、压缩、来源 | `memory/` 三层、`memory-guard`、`CONTEXT.md` | 强 |
| **L** Lifecycle | 编排、失败恢复、多 Agent 交接 | Spec→Plan→Build→Review→Release；`forge-loop`；`implementer`/`planner`；`change-manager` | **核心强项** |
| **O** Observability | trace、成本、replay | hooks 日志、`.forge/evidence/`、phase-exit；**无**全链路 APM 产品 | Partial |
| **V** Verification | 结果与过程、失败归因 | `pnpm test`、`forge-verify`、`forge-phase-check`、`code-review`、`skill-eval` | **核心强项** |
| **G** Governance | 权限、审批、审计 | `hallucination-gate`、`pre-commit-check`、`security-guidance`、S0/S1、[external-publish-preflight](./external-publish-preflight.md) | Partial（无企业 IdP 一体化） |

**ReqForge 多出来的「产品层」**（综述 taxonomy 不单独成层，但对应 L/V）：`Product-Spec.md`、`DEV-PLAN.md`、验收条款、发布门 —— 见 [agent-harness-seven-layer-map.md](./agent-harness-seven-layer-map.md)「教学七层之上」。

---

## 教学七层 vs ETCLOVG（避免混谈）

| 框架 | 来源 | 用途 |
|------|------|------|
| **教学七层**（工具循环→续命） | [AGENT魔方](https://bbs.huaweicloud.com/blogs/476342) 等 | 入门：模型 + Harness 组件拼图 |
| **ETCLOVG** | CMU/Yale/JHU 等综述 | 生产拆障：故障落在哪一层 |
| **Forge 对照** | 本仓库 `agent-harness-seven-layer-map.md` | 把两者映射到 **具体 Skill/钩子/命令** |

选型时：**用 ETCLOVG 定位缺口，用 Forge 命令填缺口**。

---

## 三阶段演进 ↔ 已有文档

| 阶段 | 综述 | ReqForge |
|------|------|----------|
| Prompt | system prompt、ReAct | 各 Skill `SKILL.md`；**不**把交付押在单段 prompt |
| Context | RAG、压缩、记忆 | `memory-guard`、Context7 可选、[openhuman-comparison](./openhuman-comparison.md) |
| Harness | ETCLOVG 全套 | 全流程 + [harness-maturity-checklist](./harness-maturity-checklist.md) |

与 [karpathy-coding-agi-comparison.md](./karpathy-coding-agi-comparison.md) 一致：拐点之后瓶颈是 **验证与 Harness**，不是再堆 Prompt。

---

## trace-native 评估 ↔ Forge 门控

| 综述 | Forge |
|------|-------|
| 不能只看最终成功率 | `forge-phase-check`、Phase 表、禁止「生成即完成」 |
| 过程重试/绕权限/异常成本也算失败 | `code-review`、Sloppiness Gate、证据目录 |
| 评估器可信度 | `skill-eval`、进化提案 **Verify by** |

**启示**：在 `DEV-PLAN` 或 Spec 中写清 **过程验收**（测试必须绿、禁止跳过 review），而不只写「功能好像能用」。

---

## 开源生态缺口 ↔ 刻意不做

| 综述观察 | Forge 策略 |
|----------|------------|
| O/G 开源薄 | 不假装提供 Datadog 级 trace；用 Git + CI + 用户可选 MCP |
| Lifecycle 工具最多 | **聚焦** issue-to-shippable 编排，不做通用多通道 inbox |
| Framework→Platform | 做 **可安装的 Harness 包**，不做托管 Agent 云平台 |

与 [harness-maturity-checklist.md](./harness-maturity-checklist.md) P2 一致：定时任务、多通道收件箱、Live UI **不在范围**。

---

## 跨层矛盾 ↔ 维护者纪律

| 矛盾 | 启示 | Forge 落点 |
|------|------|------------|
| 成本–质量–速度 | 同步全量 trace/验证很贵 | Quick Mode vs 全 loadout；`forge-loop` 设上限 |
| 能力 vs 控制 | 工具越多越易错 | Skill 分域 [skill-taxonomy.md](./skill-taxonomy.md)；loadout 按需 |
| **coupling** | 改 prompt/工具/沙箱牵动全局 | 变更走 `change-manager`；进化走 eval + 拒绝缓冲 [skillopt-comparison](./skillopt-comparison.md) |

综述提醒：**局部优化 harness 要有系统级回归** → 对应 `pnpm test` / `forge-smoke` / `skill-eval`。

---

## 「模型变强则简化 Harness」↔ 进化引擎

| 综述 | Forge |
|------|-------|
| 每个 gate 假设「模型还做不好」 | `evolution-engine` 应用**有证据**的 Skill/规则变更 |
| 未来需自动 ablation | **人工**确认进化提案；`skill-eval` 防 Goodhart |
| 删控制与加控制同等重要 | 定期审视 hooks 是否冗余；避免与 [talk-normal-comparison](./talk-normal-comparison.md) 叠床架屋 |

---

## 七问检查表（综述文末）→ 仓库命令

| 问题 | 快速自检 |
|------|----------|
| Execution | CI/本地能否复现？危险命令是否被 hook 挡？ |
| Tooling | Skill 描述是否短、可验证？ |
| Context | `memory/` 与 handoff 是否更新？ |
| Lifecycle | `DEV-PLAN` Phase 与 `forge-loop` 是否对齐？ |
| Observability | 失败能否指向 Phase/命令/证据文件？ |
| Verification | `pnpm test` + review 是否绿？ |
| Governance | S0/S1、`security-guidance`、发布 preflight？ |

完整打分表 → [harness-maturity-checklist.md](./harness-maturity-checklist.md)。

---

## 与「腾讯 Harness 镜子」的分工

| 文档 | 角度 |
|------|------|
| [tencent-harness-mirror-comparison.md](./tencent-harness-mirror-comparison.md) | **为什么**要显形（镜子、三块石碑、不可能三角） |
| **本文** | **是什么**（ETCLOVG、三阶段、生态缺口、Platform 趋势） |
| [agent-harness-seven-layer-map.md](./agent-harness-seven-layer-map.md) | **怎么用 Forge 填层** |

---

## 刻意不做

- 将 71 页 PDF 或 [awesome-agent-harness](https://github.com/Picrew/awesome-agent-harness)  catalog  vendoring 进 `core/`
- 把论文 benchmark 数字写成 Forge 性能承诺
- 用综述替代 `Product-Spec` / 用户 Confirm 门（**Understanding 仍在人**）

---

## 参考

- 微信：[Agent Harness 工程最新综述](https://mp.weixin.qq.com/s/gFeutn69NzIb2muQqVIWkQ)
- 论文：[OpenReview eONq7FdiHa](https://openreview.net/forum?id=eONq7FdiHa) · [PDF](https://picrew.github.io/LLM-Harness/main.pdf)
- Catalog：[Picrew/awesome-agent-harness](https://github.com/Picrew/awesome-agent-harness)
- Forge 七层：[agent-harness-seven-layer-map.md](./agent-harness-seven-layer-map.md)
