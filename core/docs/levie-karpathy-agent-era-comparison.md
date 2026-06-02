# ReqForge 与 Levie「万亿 Agent」+ Karpathy「像在作弊」对照

> 参考：  
> - [Aaron Levie — Building for Trillions of Agents](https://x.com/levie/article/2030714592238956960)（X Article）  
> - [Andrej Karpathy — status/2030722108322717778](https://x.com/karpathy/status/2030722108322717778)（个人工作方式；Levie 回帖：专长被杠杆放大而非稀释）  
> Levie 同期「最后一公里 / AI psychosis」讨论见 [Fast Company 报道](https://www.fastcompany.com/91549317/why-the-ceo-of-box-says-ceos-are-more-prone-to-ai-psychosis)（happy path 原型 vs 上线后 10～20 步后续工作）。  
> 与 [karpathy-coding-agi-comparison.md](./karpathy-coding-agi-comparison.md)、[autoresearch-comparison.md](./autoresearch-comparison.md)、[security-guidance-comparison.md](./security-guidance-comparison.md)（S0/S1）互补。  
> **本文仅归档启示，不要求新增 Skill 或脚本。**

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **Levie（宏观）** | Agent 将成为软件主用户 → API-first、身份/治理/审计；高管易见 demo 不见 **最后一公里** |
| **Karpathy（微观）** | 20 年后「几乎不写代码」的违和与杠杆；**声明式成功标准**；理解/品味仍是瓶颈 |
| **ReqForge** | 不造「万亿 Agent 平台」；把 **Spec→Plan→验证→审查→证据** 写成仓库内 Harness，填 happy path 与 demo 之间的缝 |

两篇合成：**产品要 Agent 可读，个人可少写字节，但交付链与判断不能省。**

---

## Levie ↔ Forge

### Building for Trillions of Agents

| Levie 主张 | ReqForge 落点 | 刻意不做 |
|------------|---------------|----------|
| 主用户从人转向 Agent | `Product-Spec.md`、`DEV-PLAN.md`、`.forge/*` 文本化、可版本化 | Agent 运行时、注册中心、微支付 |
| API-first | 用户产品 Spec 应写清 REST/CLI/事件契约；框架侧 `pnpm forge-*` 即确定性 API | 替用户实现全栈 API 网关 |
| 沙箱、身份、预算、治理 | `preflight`、`.forge/security-guidance.md`、S0/S1、发布门 | 企业 IAM / Agent 钱包 |
| 长期任务与审计 | FDE `.forge/evidence/`、git 历史、`forge-ops` 告警思路 | 跨租户审计 SaaS |

### 最后一公里 / AI psychosis（同作者，不同帖）

| 现象 | Forge 对策 |
|------|------------|
| CEO 只见 happy path 原型 | Phase 表 + `forge-phase-check`：交付物须可 diff |
| 「合同 AI 生成完还要法务核对」 | Spec 验收 + `code-review` + 发布前 preflight |
| 建议领导自己多用 AI 摸清边界 | 文档与 quickref 推广 `forge-loop --fde`，用证据报告代替口头「做完了」 |

---

## Karpathy（2030722108322717778 一带）↔ Forge

| 观点 | Forge |
|------|-------|
| 用 AI 写代码像「作弊」、不适但真实 | 正常；路径是 **Agentic Engineering**，不是否认 Harness |
| 专长 × 杠杆（Levie 回帖） | 人：Spec、架构、品味（`project-taste.md`）；Agent：实现 |
| 声明式完成（成功标准而非逐步命令） | Spec 验收条款、`pnpm test`、`forge-loop` 通过才算完成 |
| 实验/autoresearch 杠杆 | 见 [autoresearch-comparison.md](./autoresearch-comparison.md)；产品主路径仍 Spec→Release |
| Understanding 不能外包 | 与 [karpathy-coding-agi-comparison.md](./karpathy-coding-agi-comparison.md) §6 一致 |

---

## 三篇 Karpathy / Levie 线如何分工

| 文档 | 回答的问题 |
|------|------------|
| [karpathy-skills-comparison.md](./karpathy-skills-comparison.md) | 单次改动怎么守四原则 |
| [karpathy-coding-agi-comparison.md](./karpathy-coding-agi-comparison.md) | 拐点后为何要 Harness |
| **本文** | 宏观 Agent 时代 + 微观个人杠杆；**为何最后一公里仍要机器门** |
| [autoresearch-comparison.md](./autoresearch-comparison.md) | 约束内实验环（研究子项目） |

---

## 对维护者的行动清单（文档级即可）

1. **对外**：Levie 讲「万亿 Agent」→ Forge 讲「让仓库对 Agent 可读、对人可审计」。  
2. **对内**：Karpathy 式少写代码 → 必须配 `forge-loop` / review / S0/S1，避免 vibe 交付。  
3. **Spec**：有对外集成时写「Agent 可调用面」（API/CLI）；无则标明 N/A。  
4. **不排期**：Agent 身份平台、计费、通用编排运行时 — 非 Harness 仓库范围。

---

## 参考

- [Levie — Building for Trillions of Agents](https://x.com/levie/article/2030714592238956960)  
- [Karpathy — 2030722108322717778](https://x.com/karpathy/status/2030722108322717778)  
- [Fast Company — AI psychosis / last mile](https://www.fastcompany.com/91549317/why-the-ceo-of-box-says-ceos-are-more-prone-to-ai-psychosis)  
- [learnblockchain.cn 编译摘要](https://learnblockchain.cn/article/24287)
