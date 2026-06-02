# ReqForge 与 Karpathy「Coding AGI 已来」对照

> 参考：[Karpathy 最新分享：Coding AGI 已来](https://mp.weixin.qq.com/s/xRmvFr31BOR1DClUSWNdjA)（红杉 AI Ascent 2026 访谈整理）  
> 与 [karpathy-skills-comparison.md](./karpathy-skills-comparison.md)（四原则行为层）、[tencent-harness-mirror-comparison.md](./tencent-harness-mirror-comparison.md)（Harness 哲学）互补。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **此文** | 范式判断：2025-12 编程 AGI 拐点、第三种计算范式、可验证性经济学、Agent 原生基础设施、人类保留 Understanding |
| **ReqForge** | 在 **Agentic Engineering** 侧落地：Spec→Plan→Build→Review→Release + 机器门 + 证据链，把「发需求 + 验功能」写成可重复 Harness |

文章回答「拐点之后工作方式怎么变」；Forge 回答「在用户项目里怎么验、怎么不把判断外包给模型」。

---

## 核心观察 ↔ Forge

### 1. Coding AGI 拐点（2025-12 信任跃迁）

| 文章 | ReqForge |
|------|----------|
| 错误率低于临界点后：逐行检查 → 全权委托 Agent | 不假设「已信任」：`forge-verify`、Sloppiness Gate、code-review 仍要求证据 |
| 人的角色：发需求 + **验证功能是否实现** | `pnpm test`、`forge-phase-check`、`forge-loop`、`skill-eval`、FDE 证据报告 `.forge/evidence/` |
| 顶尖工程师 10×+；多数公司未适应 | `DEV-PLAN` Phase gate + `forge-loop`「下班一条命令」降低组织适应成本 |

**互补**：Karpathy 描述个人信任跃迁；Forge 把「验证」从心理习惯变成仓库内机械门，避免跃迁后无验收的「假完成」。

### 2. Vibe Coding ↔ Agentic Engineering

| 模式 | 文章 | Forge |
|------|------|-------|
| **Vibe Coding** | 拉低下限，人人能写 | Quick Mode、`lite` loadout（轻量 spec） |
| **Agentic Engineering** | 保持专业质量下的效率革命 | 全 loadout：spec/plan/build/review/release + hooks + 多 reviewer |

Forge 默认路径面向 **Agentic Engineering**，不是「聊天生成即交付」。

### 3. LLM = 第三种计算范式

| 层 | 文章 | Forge |
|----|------|-------|
| 传统代码 | if-else 可预测 | 应用代码 + `scripts/` 确定性工具 |
| 神经网络权重 | 软规则 | 模型选择由用户/adapter 配置 |
| **需求即程序** | 上下文窗口 = 编辑器，提示词 = 语言 | `Product-Spec.md`、`DEV-PLAN.md`、Skills、`memory/` 版本化进 Git |

「仓库即大脑」与 OpenAI Codex 文一致 → Forge 的 `forge-install`、`.forge/*` 状态、无外部 Notion 依赖。

### 4. 可验证性 + 经济因素

| 文章 | Forge |
|------|-------|
| 代码/数学等可验证领域进步快 | `pnpm test`、`forge-verify`、Playwright（`forge-ui-check`）、`skill-eval` 用例 |
| 创业者机会：**验证器 + 领域数据** 飞轮 | `.forge/skills/*/eval/`、`feedback/` → `evolution-engine`；用户自定义 Skill 可自带 judge |
| 「高速公路 vs 丛林越野」 | 把任务放进 **有验收条款的 Spec/Phase**，避免 Agent 在不可验证领域裸奔 |

### 5. Agent 原生世界

| 文章 | Forge | 缺口 |
|------|-------|------|
| 基础设施仍为人类（DNS、部署） | `release-builder` + `pnpm preflight`；微信草稿示例 | **一键 Agent 部署** 非核心范围 |
| Agent 原生测试：提示词 → 生成 → 无人工部署上线 | — | 需外部 PaaS / 用户 CI |
| Agent↔Agent 经纪、人做顶层目标 | `request-dispatcher`、多 sub-agent review | 跨组织 Agent 协议未实现 |

人类仍负责的：**美学、逻辑判断、品味、需求准确性** → `design-maker`、`.forge/project-taste.md`、`product-spec-builder` 确认门、`code-review`。

### 6. Understanding 不能外包

| 文章 | Forge |
|------|-------|
| 可外包 Thinking（执行推理）；**Understanding**（建什么、是否值得）留人 | Idea Validation Gate、spec 确认、plan 确认；实现 Session 与审查 Session 分离 |
| 瓶颈变成「要构建什么」 | `/product-spec-builder`、`/change-manager` 存量路由；非 `/dev-builder` 默认起手 |

---

## 行动建议 ↔ 仓库命令

| 文章末尾建议 | Forge 等价 |
|-------------|------------|
| 认真用 Agent 级编程工具试完整项目 | `forge-install` → `/product-spec-builder` → `/dev-planner` → `/dev-builder` |
| 信任跃迁后仍要验功能 | `pnpm forge-loop <N>` 或 `pnpm forge-fde <N>` |
| 公司级适应 | `DEV-PLAN.md` + Phase 表 + `pnpm forge-smoke`（框架仓） |

---

## 与 karpathy-skills-comparison 的分工

| 文档 | 覆盖 |
|------|------|
| [karpathy-skills-comparison.md](./karpathy-skills-comparison.md) | **怎么做对一次改动**（四原则、Machine Gates） |
| **本文** | **为什么现在必须 Harness**（拐点、范式、可验证性、Agent 原生、Understanding 边界） |
| [levie-karpathy-agent-era-comparison.md](./levie-karpathy-agent-era-comparison.md) | **宏观 Agent 时代 + 微观杠杆**；最后一公里 vs happy path |

---

## 参考

- 微信整理：[Coding AGI 已来](https://mp.weixin.qq.com/s/xRmvFr31BOR1DClUSWNdjA)
- Karpathy 四原则上游：[karpathy-skills-comparison.md](./karpathy-skills-comparison.md)
- Harness 哲学：[tencent-harness-mirror-comparison.md](./tencent-harness-mirror-comparison.md)
- 成熟度清单：[harness-maturity-checklist.md](./harness-maturity-checklist.md)
