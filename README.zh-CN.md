# Forge

[![English](https://img.shields.io/badge/lang-en-blue)](README.md) [![中文](https://img.shields.io/badge/lang-zh--CN-red)](README.zh-CN.md)

**产品开发框架** — 从模糊想法到可交付产品，全程 AI 辅助引导。

面向 AI 编程助手（Claude Code、Cursor、OpenCode）的完整产品开发方法论。

---

## 近期更新

### v1.14 — 2026-05-19
- **精确版本锁定**：每个依赖锁定到 `major.minor.patch`——无范围、无 `latest`
- **专属 AGENTS.md 模板**：OpenCode 使用约束文件格式（技术栈、行为边界、硬约束），非 CLAUDE.md 克隆
- **依赖图分析**：`scripts/dependency-graph.ts` — 文件级导入图，支持 blast-radius 影响范围分析。`pnpm dep-graph build | affected | risk | stats`。已集成到 dev-builder 审查循环，code-reviewer 接收 `affected_files` 精准定位审查范围

### v1.13 — 2026-05-19
- **Planner Sub-Agent**：专用于架构设计和 Phase 拆分的独立 Agent，与 implementer 上下文解耦
- **Session Handoff 会话交接**：`handoff-template.md` + `check-handoff` 钩子，在上下文重置前生成会话摘要，防止进度丢失
- **Complexity Gate 复杂度门**：`code-reviewer` 对 `change_complexity="simple"` 跳过 Stage 1，审查深度与变更范围匹配
- **模型版本追踪**：`feedback-observer` 记录每次反馈的模型版本，使进化引擎能检测过时规则

### v1.10–1.12 — 2026-05-19
- **test-writer Sub-Agent**：为 `sync.ts` 和核心工具生成 Vitest 测试
- **check-sync 钩子**：编辑后检测 `core/` 与 `adapters/` 不同步
- **自身钩子配置**：ReqForge 自身的 `.claude/settings.json` 启用全部 6 个钩子，`settings.local.json` 从 65 行精简至 32 行

### v1.9 — 2026-05-19
- **AI Only for Judgment Tasks**：确定性逻辑用代码而非 AI 推理
- **Fail Loudly**：不确定时明确说"不知道"
- **Token Budget Awareness**：每个 Task 后评估上下文使用量

完整版本历史见 [CHANGELOG.md](./CHANGELOG.md)。

---

## 概述

如果你体验过 Vibe Coding，就会知道难点不在于让 AI 写代码，而在于管理整个产品开发流程。你跟 AI 说"帮我做个写作工具"，它直接就开始写了。做到一半发现方向不对，推翻重来。功能终于能用了，UI 却一塌糊涂——没有设计规范，AI 只能从训练数据里拼凑默认样式。修 UI 引入 bug，修 bug 引入更多 bug。上下文越来越长，AI 忘了之前的需求，代码开始失控。

根本原因不是模型不够聪明，而是模型周围缺少一套**系统**。

Forge 是一个 **Agent Harness（智能体框架）**——不是优化你与 AI 对话的方式，而是构建一整套约束、引导和反馈系统。AI 在行动前就知道该做什么，行动后自动验证结果，出错时自我修正，并且不会重复犯同样的错误。

**Harness = 引导（前馈）+ 传感器（反馈）+ 转向循环（进化）**

- **引导（Guides）** — 每个 Skill 定义了方法论、工作流和验收标准。Agent 行动前就知道"怎么做"和"怎样才算完成"。
- **传感器（Sensors）** — 钩子脚本 + Code Review 在关键节点检查执行结果，不依赖模型的自我意识。
- **转向循环（Steering Loop）** — 每次纠正都被记录下来，相同问题出现 3 次以上自动升级为 Skill 的正式规则。

---

## 快速开始

> **Forge 不建议使用 YOLO 模式。** Forge 的价值在于关卡——每个阶段、审查和进化提案都会要求你确认。YOLO 模式自动批准这些，使框架失去意义。不启用 YOLO 以获得完整收益。
>
> 如果确实启用 YOLO，所有关卡切换为**异步写入模式**——审查报告、修复日志、进化提案和阶段检查点写入 `changes/` 和 `.claude/.yolo-pending/` 而不阻塞执行。dev-builder 会自动进入下一 Phase 而无需重新调用 `/dev-builder`。这样保留了进化引擎的数据流，让你在运行后审查完整输出。关卡不会跳过，只是不阻塞。
>
> **通过配置文件启用**（优先级：项目 > 全局 > 环境变量）：
> 1. **项目级**：复制 `.forge/config.example` 为 `.forge/config`，取消注释 `FORGE_MODE=yolo`
> 2. **全局级**：创建 `~/.forge/config`（Linux/Mac）或 `%USERPROFILE%\.forge\config`（Windows），写入 `FORGE_MODE=yolo`
> 3. **环境变量**：`export FORGE_MODE=yolo`（Linux/Mac）或 `set FORGE_MODE=yolo`（Windows）

### Claude Code

复制 `adapters/claude-code/.claude/` 到你的项目根目录，然后打开 Claude Code。

### Cursor

复制 `adapters/cursor/.cursor/` 到你的项目根目录。

### OpenCode

复制 `adapters/opencode/.opencode/` 到你的项目根目录。

**注意**：OpenCode 使用 `AGENTS.md` 作为规则文件（约束文件格式，包含技术栈、行为边界和硬约束）。

### 按平台配置钩子

钩子在关键事件（提交、消息、编辑、启动）时自动触发。需要平台特定的设置：

| 平台 | 使用的 `settings.json` | 钩子脚本 | 要求 |
|----------|-------------------------------|--------------|-------------|
| Linux/Mac | `settings.json`（默认） | `.sh` | `sh`（内置） |
| Windows | `settings.windows.json` | `.bat` | 无需（cmd 原生） |

复制适配器目录后，重命名或复制平台文件：

```
# Windows — 使用 .bat 钩子（无需 Git Bash）
copy settings.windows.json settings.json

# Linux/Mac — .sh 钩子开箱即用，无需操作
```

**OpenCode** 不使用 `settings.json`——它的 `.sh`（Linux/Mac）和 `.bat`/`.ps1`（Windows）钩子在各自平台原生工作。

---

## 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│  控制文件 (CLAUDE.md / .cursor/rules/reqforge.mdc)          │ ← 编排层
│  <60 行 — 仅调度映射，详情在 core/docs/                      │
│  项目状态检测，流程路由，Skill 调度                           │
├─────────────────────────────────────────────────────────────┤
│  三层记忆体系（上下文保持）                                   │ ← 记忆层
│  ├─ project-memory.md  长期：架构、约束                      │
│  ├─ decisions-log.md   中期：ADR 技术决策                    │
│  └─ task-history.md    短期：近期任务摘要                     │
├─────────────────────────────────────────────────────────────┤
│  Sub-Agent × 6（上下文隔离防火墙）                           │ ← 执行层
│  ├─ implementer        编码 + 编译验证 + 自我检查            │
│  ├─ code-reviewer      两阶段审查 + complexity gate          │
│  ├─ feedback-observer  捕获失败 + 用户纠正                   │
│  ├─ evolution-runner   扫描反馈积累                          │
│  ├─ test-writer        为工具/脚本生成测试                   │
│  └─ planner            分析 Spec，拆分 Phase，制定计划        │
├─────────────────────────────────────────────────────────────┤
│  Skills × 11（引导/前馈控制）                                │ ← 引导层
│  在 Agent 行动前注入方法论和标准                              │
├─────────────────────────────────────────────────────────────┤
│  钩子 + 审查循环（传感器/反馈控制）                          │ ← 检查层
│  在 Agent 行动后检查结果，确定性执行                          │
├─────────────────────────────────────────────────────────────┤
│  feedback/ + EVOLUTION.md（转向循环）                       │ ← 进化层
│  每次纠正都在改进框架，永不重复错误                          │
└─────────────────────────────────────────────────────────────┘
```

### 记忆层 — 三层项目记忆

AI 失忆是真实存在的问题。每次新会话，AI 都会忘记项目结构、决策历史和上周的进展。Forge 通过三层版本控制的记忆体系解决这个问题：

| 层级 | 文件 | 保留期 | 内容 |
|------|------|-----------|---------|
| 长期 | `memory/project-memory.md` | 永久 | 架构、技术栈、约束、已知陷阱、开发环境 |
| 中期 | `memory/decisions-log.md` | 永久 | ADR 格式决策记录（背景 → 方案 → 决策 → 影响） |
| 短期 | `memory/task-history.md` | 最近 30 条 | 任务摘要（日期、阶段、类型、变更文件、备注） |

**工作方式**：
- **会话启动**：AI 在执行任何任务前读取全部三个记忆文件 — 强制性上下文加载
- **任务完成**：AI 追加到 `task-history.md`（总是）、`decisions-log.md`（如有决策）、`project-memory.md`（如架构事实变更）
- **初始化**：首次调用 `/dev-builder` 时自动创建 `memory/` 目录

记忆文件是纯 Markdown，提交到项目仓库 — 跨会话、跨成员、跨 AI 工具共享。

### 行为边界 — 红绿灯系统

并非所有 AI 行动都应该有相同的自主级别。Forge 将所有操作分为三个级别：

| 级别 | 规则 | 示例 |
|-------|------|---------|
| 🟢 绿色 | 无需确认直接执行 | 变量命名、代码风格、测试、明显 bug 修复、文档、开发依赖 |
| 🟡 黄色 | 执行前需确认 | 外部依赖、数据库 Schema、核心业务逻辑、项目配置、新路由 |
| 🔴 红色 | 始终需明确批准 | 删除数据、生产配置、force push、发布、认证变更 |

**YOLO 模式**：YOLO 模式下 🟢 和 🟡 操作自动执行。🔴 红色操作**始终**需要确认，即使在 YOLO 模式下也无法覆盖。

### 快速启动模式

不想经历完整的需求访谈？一句话描述你的项目：

```
你："一个带 AI 教练的习惯追踪应用"
Forge：⚡ 快速 Spec 已生成！标记为 [待确认] 的条目是我的最佳猜测。
```

AI 推断一切——产品类型、目标用户、核心功能、技术栈、布局。不确定项默认选择更简单的方案并标记为待确认。随时切换到深度模式：`/product-spec-builder`。

### 引导层 — 11 个 Skill

每个 Skill 是独立的方法论模块——可组合、可扩展、可插拔：

| Skill | 职责 |
| ------------------------ | -------------------------------------------------------------------------------------- |
| **product-spec-builder** | 需求收集。AI 通过多轮问题将模糊想法转化为结构化 Spec。支持迭代模式。 |
| **design-brief-builder** | 设计语言。将模糊描述（"暗色主题，简约"）量化为具体方向：调色板、交互风格、信息密度。 |
| **design-maker** | 设计原型。通过 Pencil 或 Figma MCP 生成完整页面设计稿。 |
| **dev-planner** | 开发计划。分析依赖关系，拆分为多个阶段，输出分阶段开发计划。 |
| **dev-builder** | 编码实现。将工作拆分为 Task——每个 Task 走"编码 → 审查 → 修复 → 提交"闭环。 |
| **bug-fixer** | 四阶段系统调试。不要猜测，不要盲目尝试：收集证据 → 分析模式 → 提出假设 → 修复。 |
| **code-review** | 两阶段审查。第一阶段检查 Spec 符合性，第二阶段检查代码质量。 |
| **release-builder** | 构建与部署。内置隐私审计和冒烟测试。 |
| **feedback-writer** | 记录用户纠正和反馈为结构化文件。为进化引擎提供数据。 |
| **evolution-engine** | 扫描积累的反馈，识别模式（3 次以上出现），生成升级规则或优化技能的提案。 |
| **skill-builder** | 使用项目模板从头创建新的 Skill 定义。由进化提案或手动调用触发。 |

### 执行层 — Sub-Agent 隔离（上下文防火墙）

每个 Task 获得**全新的 Sub-Agent 实例**。不重用，不继承上下文。编排器提供完整的任务上下文（Spec 项、交付物、文件、项目结构），但不提供之前的任务历史。这防止错误假设在任务间级联传播。

### 检查层 — 钩子 + 审查循环

代码不算完成直到被审查：

```
功能完成 → code-reviewer 两阶段审查
  ├─ Stage 1 通过 → Stage 2
  ├─ Stage 1 失败 → 重新实现 → 重新审查
  └─ Stage 2 通过 → 提交 + 推送 → Task 完成
  └─ Stage 2 失败 → bug-fixer 修复 → 重新审查
```

十个钩子脚本在关键节点自动触发：

| 钩子 | 触发时机 | 动作 |
| ---------------------- | ------------------ | --------------------------------------- |
| pre-commit-check | 提交前 | 编译失败则阻止提交 |
| auto-push | 提交后 | 自动推送到远程 |
| stop-gate | Agent 停止前 | 代码未审查则阻止停止 |
| detect-feedback-signal | 用户消息时 | 自动检测纠正信号 |
| mark-review-needed | 文件编辑后 | 标记需要审查的变更 |
| check-evolution | 会话启动时 | 检查反馈积累 |
| memory-check | 文件编辑后 | 如果代码变更则提醒更新记忆 |
| context-compaction | 工具调用后 | 自动归档超过 30 条的旧 task-history 条目，防止上下文腐败 |
| check-sync | 工具调用后 | 检测 core/ 与 adapters/ 不同步并提醒运行 pnpm sync |
| check-handoff | 工具调用后 | 当上下文运行时间较长时建议生成会话交接文档 |

### 进化层 — 转向循环

一个不会从使用中学习的框架是静态的。Forge 持续进化：

1. **Level 0: Harness 基础** — 上下文压缩、渐进式披露、工具调用卸载、失败自动评分——可靠进化的前提条件
2. **经验积累** — 失败和纠正自动记录，附带推断的 Skill 评分（Precision/Coverage/Efficiency/Satisfaction）。评分数据是 Level 2+ 的燃料
3. **规则毕业** — 相同反馈出现 3 次以上 → 提议升级为 Skill 或控制文件中的正式规则
4. **Skill 优化** — Skill 的反馈评分持续偏低 → 提议调整
5. **新 Skill 创建** — 重复操作模式且无 Skill 覆盖 → 提议新 Skill

所有进化提案都需要你明确确认，不会自动更改规则。

---

## 控制文件理念

CLAUDE.md 控制在 60 行以内——是调度映射，不是操作手册。详细流程在各 Skill 的 SKILL.md 中（仅在该 Skill 激活时加载）。参考文档（行为边界、记忆系统、Sub-Agent 编排）在 `core/docs/` 中。

CLAUDE.md 中的每条规则必须可追溯到特定的失败或反馈。通用的最佳实践规则属于 SKILL.md，不应放在控制文件中。这保持了提示词的简洁，每条规则都靠实例说话。

## 设计优先级

```
设计工具稿（最高）→ Design-Brief.md → Product-Spec.md（功能逻辑）
```

当存在设计稿时，所有 UI 必须与设计一致。冲突以设计工具为准。

---

## 工作流程

1. **描述你的想法** — 告诉 AI 你想构建什么；product-spec-builder 通过访谈帮你理清思路（或使用快速模式一句话开始）
2. **生成 Spec** — 输出 Product-Spec.md
3. **设计简报（可选）** — 调用 /design-brief-builder
4. **设计稿（可选）** — 调用 /design-maker
5. **开发计划** — 调用 /dev-planner，输出 DEV-PLAN.md
6. **构建** — 调用 /dev-builder，逐个完成每个 Phase 的 Task
7. **记忆自动更新** — 每个 Task 后自动更新项目记忆
8. **自动审查** — code-reviewer 两阶段审查
9. **自动修复** — 审查失败自动触发 bug-fixer
10. **提交和推送** — 审查通过后自动提交 + 推送
11. **阶段验证** — 跨 Task 集成检查 + 编译 + 功能测试
12. **迭代** — 在对话中请求变更；自动更新 Spec → Plan → 代码 → 审查
13. **发布** — 调用 /release-builder

## 仓库结构

```
Forge/
├── core/                      # 核心共享内容
│   ├── skills/                # 11 个 Skill 定义，每个独立目录
│   ├── agents/                # 6 个 Sub-Agent 定义
│   ├── templates/             # 文档模板
│   │   └── memory/            # 三层记忆 + 会话交接模板
│   ├── hooks/                 # 钩子脚本 (.sh/.bat/.ps1)
│   ├── docs/                  # 详细文档
│   └── feedback/              # 反馈模板
├── adapters/
│   ├── claude-code/           # Claude Code 适配
│   ├── cursor/                # Cursor 适配
│   └── opencode/              # OpenCode 适配
├── .forge/                    # Forge 项目配置
├── .claude/                   # Forge 自身的控制文件
├── CLAUDE.md                  # 主控制文件
├── scripts/
│   └── sync.ts                # core → adapter 同步脚本
├── changes/                   # 变更产物
├── EVOLUTION.md               # 进化引擎定义
├── Product-Spec.md            # Forge 自身产品需求文档
├── Product-Spec-CHANGELOG.md  # Spec 变更日志
├── DEV-PLAN.md                # Forge 自身的开发计划
├── package.json               # Forge 开发依赖
├── tsconfig.json
├── LICENSE                    # MIT 许可证
└── README.md / README.zh-CN.md # 使用说明
```

---

## 模型推荐

Forge 覆盖完整的产品开发流程，对模型的要求高于单一任务场景。推荐使用 Opus 或 Sonnet 级别的模型。建议先用小项目验证输出质量和工作流程流畅度，再投入到大型项目。

## 许可证

MIT
