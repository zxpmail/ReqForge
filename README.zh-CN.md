# Forge

[![version](https://img.shields.io/badge/version-v1.14.2-blue)](CHANGELOG.md) [![license](https://img.shields.io/badge/license-MIT-green)](LICENSE) [![English](https://img.shields.io/badge/lang-en-blue)](README.md) [![中文](https://img.shields.io/badge/lang-zh--CN-red)](README.zh-CN.md)

**产品开发框架** — 从模糊想法到可交付产品，全程 AI 辅助引导。

面向 AI 编程助手（Claude Code、Cursor、OpenCode）的完整产品开发方法论。

**使用框架无需 npm install** — 将适配目录复制到项目根目录，打开 AI 客户端即可。仅在本仓库贡献或运行 `scripts/` 时才需要 Node.js + pnpm。

| 章节 | 说明 |
|------|------|
| [安装与使用](#安装与使用) | 克隆、复制适配层、钩子、首次运行 |
| [工作流程](#工作流程) | 需求 → 计划 → 开发 → 发布 |
| [框架开发与维护](#框架开发与维护) | 测试、同步、依赖图（贡献者） |

---

## 近期更新

### v1.17 — 2026-05-22
- **Decidable Activation 可判定激活 — [Not For] 章节**：全部 11 个 Skill 新增 `[Not For]` 章节，明确什么时候不该使用该 Skill 及应改用什么。validate-skill.sh 将其列为必需章节。skill-template.md 同步更新。
- **三层诊断模型**：bug-fixer 不止定位根因——追问 现象层 → 设计缺陷层 → 原则违反层。每个修复报告包含三层诊断，从源头防止复发，而非仅修补症状。
- **数值化质量评分表**：skill-builder 新增 16 项 32 分制评分表，交付阈值 ≥ 24 分且无关键项为 0。运行 `pnpm validate-skill --score` 计算评分。
- **create-skill.sh 脚手架**：CLI 工具，从名称自动生成完整 Skill 目录。支持 `--minimal`（仅必需章节）和 `--full`（含推荐章节）。运行 `pnpm create-skill <名称>`。

### v1.16 — 2026-05-21
- **Harness Engineering 工程化原则**：dev-builder 新增 Tool AI-fication 优先级（CLI > MCP > Skill > GUI）、Substitute Don't Mock（真实替身替代 Mock）、Environment-First（项目先跑起来再写功能）、Minimum Runnable Subset（每个 Phase 交付端到端核心路径）、Scripted Verification（复杂 Phase 自动生成 `verify-phase-N.sh`）。
- **Machine Gates 机器门**：CLAUDE.md 新增三级可执行门禁——Hallucination Gate（路径/依赖不存在则失败）、Sloppiness Gate（无验证证据则阻止完成）、Overstepping Gate（范围蔓延则拒绝）。可编码的门禁必须用 lint/test/hook 实现。
- **Iron Rules 入门铁律**：提炼 8 条 Forge 基线规则（知识卸载、无 prompt 魔法、真实文件、护栏等），写入 Product-Spec.md 与 README。
- **llms.txt**：AI 可搜索的项目摘要，放置于仓库根目录。
- **目录级 AGENTS.md**：为 `core/skills/`、`core/agents/`、`core/hooks/`、`core/templates/`、`core/feedback/` 添加 MUST/MUST NOT/SHOULD 规则。
- **validate-skill.sh**：正式 SKILL.md 规范校验器——检查 frontmatter、必需章节、kebab-case 命名、Gotchas 条目数、文件大小、TODO 标记。通过 `pnpm validate-skill` 运行。
- **Claude Code 适配器规则迁移**：目录级规则从 AGENTS.md（Claude Code 不读取）迁移到 `.claude/rules/*.md`，使用路径作用域 `globs` 前导元数据。AGENTS.md 保留给 OpenCode 适配器。
- **SKILL.md 结构性审计**：校验全部 11 个 Skill——修复 11 个缺失必需章节的错误和 19 个警告（为 design-maker、evolution-engine、feedback-writer、bug-fixer、code-review、dev-builder、dev-planner 添加 [Dependency Check]、[File Structure]、[Initialization]、[Output Style]、[Gotchas] 章节）。
- **全 Skill 新增 Gotchas 章节**：11 个 Skill 全部增加 `[Gotchas]` 章节，记录领域特定失败模式（模糊需求、隐私泄漏、过早演化、重复反馈等）。每个 Skill 随时间积累实战教训。
- **Skill 模板更新**：新 Skill 自动包含 `[Gotchas]` 推荐章节。
- **CLAUDE.md 增加 CLI 最佳实践**：`/model`、`/compact`、`/context`、`/sandbox` 用法写入 General Rules。关键规则包裹 `<important if="">` 标签提升遵守率。
- **命名统一**：dev-builder、code-review、bug-fixer 的 `[Anti-Rationalization Checklist]` 统一为 `[Gotchas: Anti-Rationalization]`。
- **Glue Code First 胶水代码优先**：dev-builder 的 "SDK-First" 升级为 "Glue Code First"——优先级链：框架内置 → 开源库 → AI 提示词 → 仅业务逻辑自研。
- **Generator/Optimizer 递归原则**：evolution-engine 新增 First Principles，进化引擎自身也应是可被进化的对象。
- **跨会话审计**：code-review 新增原则——复杂审查必须在独立子会话中执行，防止自我确认偏差。
- **Prompt Remediation 补救提示词**：feedback 模板新增 `prompt_remediation` 字段，每次失败可附带可复用的 prompt 片段防止再犯。

### v1.14.2 — 2026-05-20
- **forge-install**：`pnpm forge-install <client> --target <目录>` 一键复制适配层；提供 `install.sh` / `install.ps1` 封装
- **安全升级**：`--force` 合并安装，不覆盖已有 `feedback/` 与 `settings.local.json`

### v1.14.1 — 2026-05-20
- **脚本单元测试**：`scripts/__tests__/` 覆盖 `sync.ts` 与 `dependency-graph.ts`（Vitest 4.1.6），`pnpm test` 一键验证
- **依赖图修复**：正确解析 `import { x } from "./y"` 等命名导入，blast-radius 更准确
- **工程对齐**：`package.json` 版本 `1.14.1`，开发依赖精确锁定 patch 版本；`DEV-PLAN.md` 增加 Phase 进度表

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
- **test-writer Sub-Agent**：为工具脚本生成 Vitest 测试（v1.14.1 已落地 `sync` / `dependency-graph` 测试套件）
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

## 安装与使用

Forge 采用**复制即用**：不向 npm 发布包，你的业务项目里也**不需要** `npm install` 安装 Forge。

### 前置条件

| 必需 | 说明 |
|------|------|
| **AI 客户端**（任选其一） | [Claude Code](https://docs.anthropic.com/en/docs/claude-code)、[Cursor](https://cursor.com)、[OpenCode](https://opencode.ai) |
| **Git** | 用于克隆本仓库；你自己的项目可选用 Git |
| **项目目录** | 空目录或已有代码均可；Forge 文件放在项目根目录 |

| 可选（仅贡献本仓库） | 说明 |
|----------------------|------|
| Node.js 22.x LTS + pnpm 10.x | 运行 `pnpm test`、`pnpm sync`、`pnpm dep-graph` — 见 [框架开发与维护](#框架开发与维护) |

### 步骤 1 — 克隆 Forge

```bash
git clone https://github.com/zxpmail/ReqForge.git
cd ReqForge
```

记住克隆路径，后续从 `ReqForge/adapters/...` **复制到** 你的应用项目。

### 步骤 2 — 安装到你的项目

**方式 A — 一键安装（推荐）**

在 Forge 克隆目录下执行（需 Node.js，用于 `ts-node`）：

```bash
# 安装到指定项目
pnpm forge-install claude-code --target /path/to/my-app

# 安装到当前目录
pnpm forge-install cursor .

# 升级合并（保留你的 feedback/ 与 settings.local.json）
pnpm forge-install claude-code --target ../my-app --force
```

```powershell
# Windows — 或在仓库根目录使用 PowerShell 封装
.\scripts\install.ps1 claude-code C:\path\to\my-app
```

```bash
# macOS / Linux 封装
./scripts/install.sh opencode /path/to/my-app
```

Windows 下会自动应用 `settings.windows.json` → `settings.json`；其他平台可加 `--windows`。

**方式 B — 手动复制**

进入你的应用目录，按所用客户端**只复制对应适配目录**：

| 客户端 | 从 Forge 克隆中复制 | 复制到项目 |
|--------|---------------------|------------|
| **Claude Code** | `adapters/claude-code/.claude/` | `<你的项目>/.claude/` |
| **Cursor** | `adapters/cursor/.cursor/` | `<你的项目>/.cursor/` |
| **OpenCode** | `adapters/opencode/.opencode/` | `<你的项目>/.opencode/` |

**命令示例**（请替换为实际路径）：

```bash
# macOS / Linux — Claude Code
cp -R /path/to/ReqForge/adapters/claude-code/.claude /path/to/my-app/.claude

# macOS / Linux — Cursor
cp -R /path/to/ReqForge/adapters/cursor/.cursor /path/to/my-app/.cursor

# macOS / Linux — OpenCode
cp -R /path/to/ReqForge/adapters/opencode/.opencode /path/to/my-app/.opencode
```

```powershell
# Windows — Claude Code（PowerShell）
Copy-Item -Recurse -Force C:\path\to\ReqForge\adapters\claude-code\.claude C:\path\to\my-app\.claude

# Windows — Cursor
Copy-Item -Recurse -Force C:\path\to\ReqForge\adapters\cursor\.cursor C:\path\to\my-app\.cursor
```

> **OpenCode** 主控文件为 `.opencode/AGENTS.md`（约束格式：技术栈、行为边界、硬约束），不是根目录 `CLAUDE.md` 的副本。

### 步骤 3 — 启用钩子（Claude Code / Cursor）

钩子在提交、编辑、会话启动等时机自动运行。复制 `.claude/` 或 `.cursor/` 后：

| 平台 | 操作 |
|------|------|
| **Windows** | 在 `.claude/`（或 `.cursor/rules` 下相应目录）执行：`copy settings.windows.json settings.json` |
| **Linux / Mac** | 默认 `settings.json` 使用 `.sh` 脚本，无需改动 |
| **OpenCode** | 无 `settings.json`；各平台原生支持 `.sh` / `.bat` 钩子 |

### 步骤 4 — 在 AI 客户端中首次使用

1. 用 AI 客户端打开**你的项目目录**（已包含 `.claude/`、`.cursor/` 或 `.opencode/`）。
2. 新建对话。Forge 会根据现有文件自动判断进度（`Product-Spec.md`、`DEV-PLAN.md`、代码、`memory/` 等）。
3. 用自然语言描述产品想法，或调用 Skill：

| 目标 | Skill 命令（Claude Code / OpenCode） | 产出 |
|------|--------------------------------------|------|
| 需求收集 | `/product-spec-builder` | `Product-Spec.md` |
| 设计规范（可选） | `/design-brief-builder` | `Design-Brief.md` |
| 开发计划 | `/dev-planner` | `DEV-PLAN.md` |
| 编码实现 | `/dev-builder` | 代码 + 自动创建 `memory/` |
| Bug 修复 | 描述问题（可自动触发 `/bug-fixer`） | 修复 + 审查闭环 |
| 构建发布 | `/release-builder` | 打包 / 部署检查清单 |

**Cursor**：`.cursor/rules/` 规则会自动加载；在对话中说明要执行的 Skill（如「执行 product-spec-builder」），或使用客户端自带的 Skill 入口。

**快速 Spec**：一句话例如「带 AI 教练的习惯追踪 App」，可生成带 `[待确认]` 标记的最小 `Product-Spec.md`，再逐步完善。

### 安装后 — 项目中会出现的文件

```
my-app/
├── .claude/          # 或 .cursor/ 或 .opencode/  ← 你复制的适配层
├── Product-Spec.md   # /product-spec-builder 之后
├── DEV-PLAN.md       # /dev-planner 之后
├── Design-Brief.md   # 可选
├── memory/           # 首次 /dev-builder 时自动创建
│   ├── project-memory.md
│   ├── decisions-log.md
│   └── task-history.md
└── src/ ...          # 你的业务代码
```

除非你明确要求，Forge **不会**擅自修改你项目里的 `package.json`。

### 在已有项目中升级 Forge

1. 拉取最新 `ReqForge` 克隆（或下载新版本）。
2. 用新适配目录覆盖项目中的 `.claude/` / `.cursor/` / `.opencode/`（若自定义过 `feedback/`，请先备份）。
3. Windows 下重新执行 `settings.windows.json` → `settings.json`（如适用）。

### YOLO 模式（不建议）

> Forge 的价值在于**关卡**：阶段、审查、进化提案需你确认。YOLO 会全自动放行，削弱框架约束。
>
> 若仍启用，关卡改为**异步写入**（产物在 `changes/`、`.claude/.yolo-pending/`）。🔴 红色边界操作仍须明确批准。
>
> 启用方式（优先级：项目 > 全局 > 环境变量）：
> 1. 复制 `.forge/config.example` → `.forge/config`，设置 `FORGE_MODE=yolo`
> 2. 或 `~/.forge/config` / `%USERPROFILE%\.forge\config`
> 3. 或环境变量 `FORGE_MODE=yolo`

更多说明见 [core/docs/](core/docs/)（行为边界、记忆体系、Sub-Agent 编排）。

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

每个 Skill 是独立的方法论模块——可组合、可扩展、可插拔。每个 Skill 包含 `[Gotchas]` 章节记录常见陷阱与实战教训：

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

### 入门铁律 — 不可变通的底线

1. 先定义问题，再让 AI 写代码
2. 先让 AI 给计划，再让 AI 执行
3. 每一步都要能验证——"看起来对"不算完成
4. 频繁提交 Git——每个进展点都应是可回滚的检查点
5. 文档持续更新——上下文丢失是无声杀手
6. 只相信机器证据（可复现命令、测试输出、CI 状态）——不相信 AI 的口头保证
7. 重要规范必须代码化——能写成 lint/test/schema/hook/CI 的就必须代码化，自然语言不算执行
8. 不符合规范的产出必须失败，而不是靠人记住提醒 AI

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
│   ├── sync.ts                # core → adapter 同步脚本
│   ├── install.ts             # adapter → 用户项目安装
│   ├── install.sh / install.ps1 # 安装命令封装
│   ├── dependency-graph.ts    # 文件级依赖图与 blast-radius 分析
│   └── __tests__/             # Vitest 单元测试
├── vitest.config.ts           # 测试配置
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

## 框架开发与维护

修改 `core/` 后需同步到各适配器，提交前建议跑通测试与编译。

**环境要求**：Node.js 22.x LTS、pnpm 10.x

```bash
pnpm install          # 安装开发依赖（TypeScript、Vitest 等）
pnpm test             # 运行单元测试（12 项）
pnpm build            # 编译 scripts/ 到 dist/
pnpm sync             # 将 core/ 同步到 adapters/
pnpm dep-graph build  # 构建项目依赖图 → .forge/graph.json
pnpm dep-graph stats  # 查看图统计
```

| 命令 | 说明 |
|------|------|
| `pnpm test:watch` | 监听模式运行测试 |
| `pnpm dep-graph affected [files...]` | blast-radius：列出受变更影响的文件（无参数时用 git diff） |
| `pnpm dep-graph risk [files...]` | 变更风险评分 |
| `pnpm forge-install <client> --target <dir>` | 将适配层安装到用户项目 |

修改 `core/skills`、`core/agents`、`core/hooks` 等后务必执行 `pnpm sync`，否则 `check-sync` 钩子会提示不同步。

---

## 模型推荐

Forge 覆盖完整的产品开发流程，对模型的要求高于单一任务场景。推荐使用 Opus 或 Sonnet 级别的模型。建议先用小项目验证输出质量和工作流程流畅度，再投入到大型项目。

## 许可证

MIT
