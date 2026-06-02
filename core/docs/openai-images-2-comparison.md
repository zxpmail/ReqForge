# ReqForge 与「OpenAI Images 2.0 / 思考时代」对照

> 参考：[OpenAI Images 2.0 全面解析：AI画图进入「思考时代」](https://mp.weixin.qq.com/s/xj7otUUf6z0v8himRhwvdg)（公众号「周老师指北」技术长文，2026-04 前后）  
> 与 [open-design-comparison.md](./open-design-comparison.md)（设计发现层）、[karpathy-coding-agi-comparison.md](./karpathy-coding-agi-comparison.md)（可验证交付拐点）互补。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **此文** | 多模态产品跃迁：`gpt-image-2` 的 **Instant / Thinking** 双模、规划→渲染→自验、与 Codex 同日专业化战略 |
| **ReqForge** | **文本与代码交付 Harness**：Spec→Plan→Build→Review→Release + 机器门，不内置图像 API |

文章描述「视觉任务从灵感板走向可生产资产」；Forge 描述「工程任务从聊天走向可合并、可测试、可发布」。**同一套 Harness 思想，不同模态。**

---

## 文章核心论点（摘要）

1. **范式**：从「提示词→直出图」变为 **思考 →（可选）搜索 → 规划 → 渲染 → 自验**；产品称谓从「图像生成器」转向「视觉思维伙伴」。
2. **架构**：GPT Image 系列为 **自回归 + 与语言模型共享注意力**（相对 DALL·E 扩散 + 外挂工具链）；O 系列推理接入图像管道。
3. **双模**：Instant（快、全员）vs Thinking（推理链、联网、最多 8 张一致性、自验，付费门控）。
4. **能力**：多语言文字渲染、多宽高比、信息图/像素风/UI 模拟、多图角色一致性。
5. **生态**：与 **Codex / Codex Labs** 同日发布——专业化 Agent 分域（视觉 vs 工程）+ 企业落地服务，而非单一通用聊天。
6. **局限**：架构黑盒、按 Token 计费（Thinking 成本可变）、高量产成本、最强能力需付费账户实测。

---

## 与 Forge Harness 的结构性对照

### 1. 三阶段管道 ↔ 交付 Phase

| Images 2.0（Thinking） | ReqForge |
|------------------------|----------|
| 思考：解析意图、布局、约束 | `product-spec-builder`：需求、验收、S0/S1 |
| 渲染：按计划出图 | `dev-builder`：按 `DEV-PLAN` 实现 |
| 自验：输出是否符合约束 | `code-review`、`pnpm test`、`forge-verify`、`forge-phase-check` |

**启示**：「先规划再执行再自验」已是跨模态标准；Forge 的价值是把自验从模型自述变成 **仓库内可重复命令 + 证据路径**（`.forge/evidence/`）。

### 2. Instant vs Thinking ↔ Loadout / Quick Mode

| 图像产品 | Forge |
|----------|-------|
| Instant：80% 场景、质量已跃升 | Quick Mode、`lite` loadout、单 Phase 切片 |
| Thinking：多约束、批量一致、实时信息 | 全 loadout、`forge-loop`、多 reviewer、`change-manager` 存量变更 |

**启示**：默认走轻路径，**仅在约束复杂或一致性要求高时** 打开重推理/重门控——与 [loadout-scenarios.md](./loadout-scenarios.md) 一致。

### 3. 「可生产资产」vs「灵感板」↔ Shippable

| 文章 | Forge |
|------|-------|
| 品牌 VI、可读文字、目标尺寸、系列一致 | 可运行代码、测试绿、Spec 条款闭合、发布前 `pnpm preflight` |
| 减少 Photoshop 后处理 | 减少「看起来完成但未验收」的合并 |

**互补**：`design-maker` / Open Design 仍负责 **发现与 mockup**；若团队采用 `gpt-image-2`，应用 **Spec 中写清** 尺寸、文案、品牌色与验收截图，而非把生成图当唯一真相源。

### 4. 专业化 Agent 矩阵 ↔ Skill 分域

| OpenAI 同日战略 | Forge |
|-----------------|-------|
| Images 2.0 → 视觉创意闭环 | `design-maker`、`design-brief-builder` |
| Codex → 工程闭环 | `dev-builder`、`dev-planner`、`code-review` |
| Codex Labs → 企业落地 | 用户自选咨询；Forge 提供可安装 Harness |

**启示**：不要在一个 Skill 里混「画图 + 写库 + 发布」；维持 [skill-taxonomy.md](./skill-taxonomy.md) 的 workflow / component 边界。

### 5. 联网搜索 ↔ 外部上下文

| 图像 Thinking | Forge |
|---------------|-------|
| 生成前 Web Search（如最新纪录、品牌） | `Context7`、用户 MCP、Spec 中的事实链接 |
| 知识截止 2025-12 + 搜索补洞 | `memory/`、`Product-Spec.md` 版本化事实；**代码真理在 Git** |

**启示**：实时信息进 **Spec/Plan 或引用**，避免 Agent 在实现阶段「凭训练记忆猜 API」。

### 6. 安全与溯源 ↔ 已有门

| 文章 | Forge |
|------|-------|
| C2PA 元数据、内容过滤、公众人物策略 | [security-guidance-comparison.md](./security-guidance-comparison.md)、S0/S1、[external-publish-preflight.md](./external-publish-preflight.md) |
| SynthID（Google）式像素水印 | 非 Forge 范围；用户选云厂商 |

---

## 对 ReqForge 维护者与用户的启示

| 启示 | 建议落点 | 是否改 core |
|------|----------|-------------|
| **规划→执行→自验** 是通用模式 | 继续强化 `forge-loop`、phase-check、review 证据 | 已有；保持 |
| 视觉与代码 **分 Skill、分验收** | Spec 区分「UI 资产」与「功能验收」 | 文档 / Spec 模板提示即可 |
| 多图一致性 ≈ 多 Phase 同一角色/模块 | 长叙事用 `DEV-PLAN` Phase 表 + 同一 `changes/<name>/` | 流程纪律 |
| Thinking 成本可变 | Agent 循环预算写进 Plan；避免无上限 `forge-loop` | 用户治理 |
| 架构黑盒 | 不假设能微调图像模型；工程侧仍靠测试与 lint | — |
| 信息图 / 架构图 | 可选：`gpt-image-2`（信息图）或 [architecture-diagram](https://github.com/Cocoon-AI/architecture-diagram-generator)（HTML/SVG）；**不进** `pnpm forge-install` | 用户自选 |
| DALL·E 3 停服（2026-05-12） | 用户项目若用旧 API，在 **change-manager** 迁移任务中单列 | 用户仓 |

---

## 刻意不做

- 在 `core/` 或 adapter 内嵌 `gpt-image-2` 调用、计费或 API 密钥管理
- 新增 `image-builder` Skill 替代 `design-maker`（职责重叠且非 Harness 核心）
- 用「生成图好看」替代 `pnpm test` / code-review
- 将公众号长文中的市场数据（Arena +242 分等）写死为 Forge 依赖版本

---

## 推荐工作流（用户项目）

1. **工程主路径**：`/product-spec-builder` → `/dev-planner` → `/dev-builder` → `pnpm forge-loop`（不变）。
2. **需要营销图 / 信息图 / 角色板**：在 Spec 增加「视觉交付」小节（尺寸、文案、品牌色、张数）；用 Images 2.0 Thinking 或设计工具生成；**验收**为人工或视觉 checklist，不阻塞 `pnpm test`。
3. **需要架构示意图**：可选 Claude Skill [architecture-diagram-generator](https://github.com/Cocoon-AI/architecture-diagram-generator) 产出独立 HTML，链入 `docs/`。
4. **对外发布图文**：仍走 [external-publish-preflight.md](./external-publish-preflight.md)（微信草稿、IP 白名单、图床上传），与模型生图解耦。

---

## 与相关对照文档的分工

| 文档 | 覆盖 |
|------|------|
| [open-design-comparison.md](./open-design-comparison.md) | 设计发现、mockup、反 slop |
| [karpathy-coding-agi-comparison.md](./karpathy-coding-agi-comparison.md) | 编程 AGI 拐点、可验证性、Understanding 边界 |
| **本文** | **视觉模态的「思考时代」** 与 Harness 同构启示 |
| [levie-karpathy-agent-era-comparison.md](./levie-karpathy-agent-era-comparison.md) | 宏观 Agent 时代与最后一公里 |

---

## 参考

- 原文：[OpenAI Images 2.0 全面解析](https://mp.weixin.qq.com/s/xj7otUUf6z0v8himRhwvdg)
- OpenAI 产品叙事（同日 Codex Labs）：文内引用 2026-04-21 发布节点
- Forge 设计层：[open-design-comparison.md](./open-design-comparison.md)
- Forge 发布门：[external-publish-preflight.md](./external-publish-preflight.md)
