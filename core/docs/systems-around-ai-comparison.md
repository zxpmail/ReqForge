# ReqForge 与「围绕 AI 建系统的人正领先」对照

> 参考微信译文：[围绕AI建系统的人正领先](https://mp.weixin.qq.com/s/-_MBrtSWZWqyTI5pxD1M4A)（Mayank Agarwal，*The Developers Building Systems Around AI Are About to Leave Everyone Else Behind*）  
> 与 [agent-harness-engineering-survey-comparison.md](./agent-harness-engineering-survey-comparison.md)（Harness 综述）、[levie-karpathy-agent-era-comparison.md](./levie-karpathy-agent-era-comparison.md)（验证/Harness 拐点）、[claude-code-seven-workflows-comparison.md](./claude-code-seven-workflows-comparison.md)（Claude Code 工程习惯）、[tencent-harness-mirror-comparison.md](./tencent-harness-mirror-comparison.md)（镜子哲学）互补。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **此文** | 叙事型论断：竞争优势在**模型外的系统**（记忆、上下文、专责智能体、验证环、编排）；开发者从「写代码」→「编排智能」；Claude Code 是信号而非终点 |
| **ReqForge** | **可安装的交付 Harness**：Spec/Plan 为真相、专责 Skill/Agent、机器门与 `forge-loop`，面向 **issue→可发布** 而非个人聊天生产力 |

文章回答「为什么同样模型结果差一个量级」；Forge 回答「在用户项目里用哪些工件与命令把系统搭起来，且哪些 deliberately 不做」。

---

## 文章核心论点（摘要）

1. **错误的主问题**：「哪个模型更好」正在贬值；**正确问题**：如何把语言模型变成能规划、研究、审查、测试、记文档、管长期上下文的**工程系统**。
2. **第一代 AI 编码工具**主攻代码生成；资深工程师很快发现：**写代码很少是最难的部分**——需求、架构、审查、边界测试、协调才是时间黑洞；聊天+粘贴在此崩塌。
3. **Claude Code 类工具的差异**：AI 是工作流里的**执行中参与者**（操作员），不是偶发顾问；问题从「能否写函数」变为「能否端到端处理工作流」。
4. **瓶颈几乎总是上下文，不是智商**：同等模型下，一人产出可上线、一人产出需大量返工 → 差在**是否为模型构建了环境**。
5. **「上下文基础设施」**（文章列举）：跨会话记忆、可检索决策/标准、按需注入而非一次性塞满、工作流编排、输出前评估环、安全边界、验证流水线、识别劣质输出位点的监控。
6. **智能体式分工**：研究 → 架构 → 实现 → 测试 → 安全 → 文档 → 部署，各专责、清晰交接；提示词只是大系统某一阶段的输入。
7. **记忆复利**：前沿模型差距缩小，但**记忆与流程设计**会随时间累积；无记忆则每个项目从零、错误重复。
8. **隐藏层（千层蛋糕）**：模型在顶且最吵；下面才是记忆、编排、eval、安全、去重自动化、串联流水线——**当前最大杠杆在可见层之下**。
9. **云类比**：2008–2009 自建服务器 vs 早期上云；智能体式开发正走「实验 → 竞争优势 → 默认方式」轨迹，**窗口期有限**。
10. **四阶段演化**：编辑器 solo → AI 助手（人仍主产）→ AI 团队（人指挥审查）→ **AI 操作系统**（人作架构师/决策者）。
11. **文末 AI 反思（值得吸收）**：与 Sutton **Bitter Lesson** 张力——部分「围绕模型搭的脚手架」会随模型变强**贬值**；维护记忆/编排本身有成本；缺可复现案例与数字；个人「建一整套」≠ 团队 ROI；厂商 FOMO 与锁定风险。

---

## 文章基础设施 ↔ ReqForge 映射

| 文章层 | 文章描述 | ReqForge 落点 | 备注 |
|--------|----------|---------------|------|
| **记忆** | 跨会话、不每次从零 | `memory/` 三层、`memory-guard`、`CONTEXT.md`、`project-memory.md` | 真理仍在 Git 工件，非聊天历史 |
| **知识/标准** | 决策、模式可引用 | `Product-Spec.md`、`DEV-PLAN.md`、`.forge/project-taste.md`、`security-guidance.md` | 对应「可检索的规范」 |
| **上下文注入** | 对的时机、对的量 | Skill `references/`、Context7 可选、phase 工件 | 避免一次性压爆窗口 |
| **工作流编排** | 顺序与阶段输入输出 | Spec→Plan→Build→Review→Release；`forge-loop`；`change-manager` | **核心强项** |
| **专责智能体** | 研究/架构/实现/测/安/文/部署 | 12 Skills + `code-reviewer`（只读）等 agents | 用 **可调度 Skill** 而非无限子 Agent 膨胀 |
| **评估环** | 输出使用前按标准检查 | `forge-phase-check`、`pnpm test`、`code-review`、`forge-loop --strict` / `--linear` → `review.md` | 结构门，非「更巧提示词」 |
| **安全边界** | 能碰/不能碰 | S0/S1、`hallucination-gate`、`pre-commit-check`、[external-publish-preflight](./external-publish-preflight.md) | Partial：无企业 IdP 一体 |
| **验证流水线** | 错误放大前拦截 | `forge-verify`、测试、UI 检查、Sloppiness Gate | 与 [levie-karpathy-agent-era-comparison](./levie-karpathy-agent-era-comparison.md) 一致 |
| **可观测** | 知系统哪里产垃圾 | hooks 日志、`.forge/evidence/` | 非 APM 产品；见 harness 综述 O 层 |

**ReqForge 多出来的「产品层」**（文章泛谈「工程系统」，Forge 具名）：需求确认门、Phase 表、发布前 `pnpm preflight`、Idea Validation Gate —— 见 [agent-harness-seven-layer-map.md](./agent-harness-seven-layer-map.md)。

---

## Bitter Lesson ↔ Forge 立场（吸收文末反思）

| 张力 | 文章倾向 | ReqForge 策略 |
|------|----------|---------------|
| 手工脚手架 vs 算力 | 强调建系统、复利 | **持久**：Spec/Plan、测试、审查标准、Git 门控 |
| 随模型变强而贬值 | 反思未充分展开 | **会简化**：冗长 prompt 链、针对旧窗口 的 RAG 补丁；**不删**：验证与权限在代码里 |
| 维护成本 | 文末提醒与「技术债」同构 | 用 `forge-install` 标准目录 + 进化提案，避免每人自建不可迁移栈 |
| 厂商叙事 | Claude Code / 上下文工程经济 | **适配器无关**：Claude/Cursor/OpenCode 均 sync 同一 `core/` |
| 锁定 | 记忆/工作流绑死单工具 | 工件 Markdown + 相对路径；MCP/工具可选 |

与 [karpathy-coding-agi-comparison.md](./karpathy-coding-agi-comparison.md) 一致：**拐点后在 Harness 与验证上投资**，但定期做 **ablation**（综述开放问题），删掉只为当前模型缺陷存在的层。

---

## 四阶段 ↔ 用户该装什么

| 阶段 | 行为 | 仅用聊天 | + Claude Code 习惯 | + ReqForge |
|------|------|----------|---------------------|------------|
| 2 | 问 AI、贴代码 | ✓ 常见 | | |
| 3 | 多专责、人审查 | 部分 | ✓ 工作流/子 Agent | ✓ Skill 编排 + `code-reviewer` 只读 |
| 4 | AI 操作系统、人决策 | 难持续 | 个人可接近 | **团队**用 Spec/Plan/门控固化 |

**启示**：文章目标读者是「围绕 AI 建系统」的开发者；Forge 用户应把 **系统** 落在 `Product-Spec.md` / `DEV-PLAN.md` / `.forge/`，而不是更长 system prompt。

---

## 与 Claude Code 信号的关系

| 说法 | Forge 解读 |
|------|------------|
| Claude Code = 窗口之一 | 七工作流对照已映射；**不**把 Forge 绑死在 Anthropic |
| 从「能否写代码」到「能否跑通工作流」 | `dev-builder` + `forge-loop` + phase 验收 |
| 最受益的是「围绕它建最密系统的人」 | `pnpm forge-install` + 坚持 phase 门，而非刷模型排行榜 |

---

## 对维护者与用户的启示

| 启示 | 建议 |
|------|------|
| 同样模型，差在环境 | 安装后先写 Spec/Plan，再开 `dev-builder`；勿空聊开工 |
| 提示词只是表层 | 投资 eval（测试、review.md、phase-check），见 `--strict` / `--linear` |
| 记忆复利 | 维护 `memory/` 与 ADR；**禁止**只靠线程记忆 |
| 专责分工 | 用 `request-dispatcher` / 对应 Skill，勿一个 mega-prompt |
| 最小评估环（文章实践） | 固化「过去 5 次接受/拒绝标准」→ 对齐 `code-review` 与 Spec 验收条 |
| researcher / implementer / reviewer | 对应 `product-spec-builder` / `dev-builder` / `code-reviewer`（只读） |
| 窗口期 | 尽早 `forge-install` 到**用户产品仓**，Harness 与业务同仓演进 |
| 警惕 FOMO | 不 vendoring 第三方整套 agent 栈进 `core/` |

---

## 刻意不做

- 不把 Mayank 全文或微信译文 vendoring 进仓库
- 不用「编排智能」口号替代 `pnpm test`、Spec 确认、发布门
- 不默认 `forge-install` 含托管记忆云、多通道 inbox（见 [harness-maturity-checklist](./harness-maturity-checklist.md) P2）
- 不把 Claude Code 专用配置当作 Forge 唯一路径（三适配器 sync）
- 不重复造「个人围绕单模型建公司」叙事为产品承诺（团队交付以 Phase 表为准）

---

## 相关文档

| 文档 | 关系 |
|------|------|
| [agent-harness-engineering-survey-comparison.md](./agent-harness-engineering-survey-comparison.md) | 学术 ETCLOVG ↔ 同一「Harness 即系统」 |
| [claude-code-seven-workflows-comparison.md](./claude-code-seven-workflows-comparison.md) | Claude Code 实操 ↔ 文章中的「信号」 |
| [hermes-soul-md-comparison.md](./hermes-soul-md-comparison.md) | 人格/运营层；**不**替代本文的工程系统层 |
| [awesome-llm-apps-comparison.md](./awesome-llm-apps-comparison.md) | 模板菜谱 + Forge 门叠加 |
| [session-execution-discipline.md](./session-execution-discipline.md) | 会话纪律 ↔ 避免聊天式循环 |

---

*对照版本：2026-06-02 · 来源：微信译文 + 文内 TLDR/反思结构*
