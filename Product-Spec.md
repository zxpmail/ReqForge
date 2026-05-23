# Product Spec: Forge

## 产品概述

这是一个开源的产品开发流程框架，整合了**废才**方法论的完整产品开发全流程，借鉴了 **oh-my-openagent** 的开放多客户端架构，吸收了 **superpowers** 的技能化设计和 TDD 纪律，融合了 **OpenSpec** 的轻量级迭代和 CLI 便捷体验，参考了 **ai-coding-ok** 的三层记忆体系和 PDCA 强制闭环，为独立开发者提供开箱即用的 AI 辅助产品开发体验。

**目标用户**：独立开发者、产品经理、创业者，他们使用 Claude Code/Cursor/OpenCode 等 AI 编程工具开发产品，需要一套经过验证的完整开发流程，但不想被绑定在单一平台。

**核心价值**：
- 一站式产品开发流程：从模糊想法 → 需求文档 → 开发计划 → 可运行产品，全程有框架引导
- 开放架构：核心逻辑一份，多客户端适配，用户可以自由切换或同时使用多个 AI 编程工具
- 技能化设计：每个技能对应一份精心调校的提示词，独立目录存放，可组合、可扩展、可插拔
- 开源社区：开源免费，社区协作进化，持续积累最佳实践，欢迎贡献新技能
- **开箱即用**：框架文件直接复制到项目目录就能用，不需要安装任何包，不需要复杂配置
- 灵活迭代：不搞僵化瀑布，支持随时增量变更

## 应用场景

- **从零开始新项目**：独立开发者有一个想法，克隆 Forge 仓库，按照框架流程一步步走，很快就能产出可运行产品，不会在流程上卡壳。
- **多工具切换开发**：开发者平时用 Claude Code，遇到复杂问题想用 Cursor，直接切过去，Forge 配置自动适配，不用重新搭建环境。
- **团队协作规范**：小团队采用 Forge 作为统一开发流程，每个人都遵循相同的规范，避免"各搞各的"导致混乱。
- **学习 AI 辅助开发**：新手开发者跟着框架走，能学会从想法到产品的完整流程，理解每个阶段该做什么。

## 功能需求

**核心功能**

- **完整开发流程定义**：框架内置标准流程 → 需求收集 → 设计规范 → 开发计划 → 项目开发 → Bug 修复 → 代码审查 → 构建发布，每个阶段都有清晰的任务、输出和验收标准。
- **多角色 Sub-Agent 分工**：借鉴 Symphony 思想，Skill 负责流程引导，Sub-Agent 负责隔离执行：
  - `planner` → 架构设计 + Phase 拆分
  - `implementer` → 编码实现
  - `code-reviewer` → 聚合并行审查结果（含 complexity gate + blast-radius 分析，小改跳过并行 Agent）
  - `code-reviewer-design` / `code-reviewer-bug` / `code-reviewer-security` / `code-reviewer-types` → 并行专项审查
  - `feedback-observer` → 反馈记录（追踪模型版本，检测规则过时）
  - `evolution-runner` → 进化扫描
  - `test-writer` → 自动生成测试
  对应 Skill：`product-spec-builder`（需求）、`change-manager`（存量增量变更）、`dev-planner`（计划）、`dev-builder`（实现）等，Skill 与 Sub-Agent 分工明确。
- **开放架构**：核心内容一份存放，各 AI 客户端分别做适配层，维护一份核心，多端同步更新。每个技能独立目录，自带 SKILL.md，可组合、可插拔、可扩展。
- **项目进度自动检测**：框架自动检测当前项目进度（哪个阶段完成了，哪个阶段没做），引导用户进入下一步，不用用户自己记。
- **evolution 进化引擎**：记录用户反馈，重复出现的经验自动升级为框架规则，框架用得越多越聪明。
- **三层记忆体系**：项目记忆分三层（长期架构事实、中期决策记录、短期任务历史），版本控制存储在 `memory/` 目录，跨 session 保持上下文，解决 AI 失忆问题。
- **红绿灯行为边界**：所有操作分为 🟢 自主执行、🟡 需确认、🔴 严禁无确认三级，YOLO 模式下 🔴 操作仍需确认，防止 AI 越界。
- **强制 TDD 纪律**：开发阶段严格要求 RED-GREEN-REFACTOR 循环，提高代码质量。
- **增量变更管理**：每个变更独立文件夹 `changes/<name>/`（proposal + specs + design + tasks + verify），由 `/change-manager` 统一 propose → apply → verify → archive；归档至 `changes/archive/`。对照说明见 `core/docs/openspec-comparison.md`。
- **快速初始化模式**：用户一句话描述项目，AI 推断最小可用 Spec，不确定项标记 [待确认]，降低首次使用门槛。
- **依赖图分析**：内置文件级依赖图工具，自动追踪代码间引用关系，变更时计算 blast-radius 影响范围，用数据驱动 complexity gate 决策，指导 code-reviewer 精准审查。
- **入门铁律**：框架强制遵守的 8 条底线规则，不可跳过、不可变通：
  1. 先定义问题，再让 AI 写代码
  2. 先让 AI 给计划，再让 AI 执行
  3. 每一步都要能验证，不把"看起来对"当成完成
  4. 频繁提交 Git，把每次进展变成可回滚的检查点
  5. 文档持续更新，避免上下文丢失
  6. 只相信可复现命令、测试输出、CI 状态，不相信 AI 的口头保证
  7. 重要规范必须代码化：能写成 lint/test/schema/hook/CI 的，就不要只写成自然语言
  8. 不符合规范的产出必须失败，而不是靠人记住提醒 AI
## 路线图（未实现，非当前版本能力）

- **模板市场**：常见产品类型脚手架（Next.js 全栈、CLI、Electron 等）一键初始化
- **Dashboard Web UI**：可视化项目进度与变更历史

## UI 布局

本产品是框架类工具，本身不提供用户交互界面，所有交互都通过宿主 AI 客户端（Claude Code/Cursor/OpenCode）完成。框架只提供规则文件、模板、Skill 定义。

## 用户使用流程

### 新项目初始化

**方式一：手动复制（推荐，零依赖）**
1. 用户创建空项目目录
2. 克隆 Forge 仓库
3. 选择要使用的 AI 客户端（Claude Code / Cursor / OpenCode）
4. 复制对应适配目录下的所有文件到自己项目
5. 打开 AI 客户端 → 框架自动检测项目进度，引导用户描述产品想法
6. 进入需求收集阶段 → 调用 `/product-spec-builder` 生成 Product-Spec.md

### 标准开发流程

1. **需求收集阶段**：用户描述产品想法 → 框架追问细节 → 生成完整 Product-Spec.md
2. **设计规范阶段（可选）**：用户调用 `/design-brief-builder` → 生成 Design-Brief.md
3. **开发计划阶段**：用户调用 `/dev-planner` → 生成分阶段 DEV-PLAN.md
4. **项目开发阶段**：用户调用 `/dev-builder` → 按 Phase 逐步开发，每个 Task 都走「开发 → code-review → fix → commit」闭环
5. **Bug 修复**：用户报告问题 → 框架自动调用 `/bug-fixer` 定位修复
6. **代码审查**：用户调用 `/code-review` → 两阶段审查输出报告
7. **构建发布**：用户调用 `/release-builder` → 打包或部署上线

## AI 能力需求

| 能力类型 | 用途说明 | 应用位置 |
|---------|---------|---------|
| 文本理解与生成 | 理解用户模糊想法，追问细节，生成结构化需求文档 | 需求收集阶段 |
| 结构化推理 | 将需求拆分为多个开发阶段，每个阶段拆分为具体 Task | 开发计划阶段 |
| 代码生成 | 根据需求和计划生成可运行代码 | 项目开发阶段 |
| 代码审查 | 对照 Spec 检查功能完整性和代码质量 | code-review 阶段 |

*所有 AI 能力由宿主客户端（Claude Code/Cursor/OpenCode）提供，Forge 不直接调用大模型。*

## 技术方向

| 维度 | 选择 | 理由 |
|------|------|------|
| 产品类型 | AI 开发流程规则框架 | 为 Claude Code/Cursor/OpenCode 提供完整产品开发流程，本身是规则文件和模板集合，框架文件复制到项目就能用 |
| 推荐技术栈 | 纯 Markdown | 规则文件都是文本，不需要编译，零依赖 |
| 项目架构 | 核心共享 + 多端适配目录 | 核心技能和模板一份存放，每个客户端有独立适配目录，直接复制到用户项目 |
| 数据存储 | 本地文件系统 | 所有规则、模板、feedback、变更 proposal 都存在本地项目目录，不需要云端服务 |
| 部署方式 | GitHub 仓库开源 | 用户克隆仓库后，手动复制对应客户端目录到自己项目 |

## 技术说明

- **架构原则**：核心共享 + 多端适配。核心流程定义、技能、模板一份存放，各客户端只保留适配入口文件（CLAUDE.md / rules 等）。
- **技能化设计**：每个技能独立目录，自带 SKILL.md，清晰边界，可独立演进。
- **依赖**：核心不需要任何依赖，用户有对应 AI 客户端就能用。
- **跨平台**：支持 Windows/macOS/Linux，钩子脚本同时提供 .sh（Unix）和 .bat（Windows）版本，确保跨平台兼容性。
- **适配格式**：Claude Code 使用 CLAUDE.md（dispatch map），Cursor 使用 .mdc 规则文件，OpenCode 使用 AGENTS.md（约束文件格式，含技术栈精确版本、行为边界、硬约束列表）。
- **使用方式**：用户克隆 Forge → 复制对应客户端目录（如 `adapters/claude-code/`）到自己项目 → 粘贴进去就能用

## 补充说明

| 开发阶段 | 输出文件 | 必需/可选 |
|---------|---------|----------|
| 需求收集 | Product-Spec.md | 必需 |
| 需求收集 | Product-Spec-CHANGELOG.md | 自动生成（变更时） |
| 设计规范 | Design-Brief.md | 可选 |
| 开发计划 | DEV-PLAN.md | 必需 |
| 项目记忆 | memory/project-memory.md, decisions-log.md, task-history.md | 自动生成（首次 /dev-builder 时） |
| 框架配置 | .claude/CLAUDE.md / .opencode/AGENTS.md, .claude/EVOLUTION.md | 自动生成 |
| 增量变更 | changes/<change-name>/（verify.md） | 可选；`/change-manager` |

### Forge 仓库目录结构（开源仓库本身））

```
Forge/
├── core/                      # 核心共享内容（技能、模板、agents）
│   ├── skills/                # 各技能定义，每个技能独立目录
│   ├── agents/                # Sub-agent 定义（planner, implementer, code-reviewer, feedback-observer, evolution-runner, test-writer）
│   ├── templates/             # 文档模板（Product-Spec, DEV-PLAN, 记忆模板等）
│   │   └── memory/            # 三层记忆模板 + handoff 交接模板
│   ├── hooks/                 # 钩子脚本（stop-gate, memory-check 等）
│   ├── docs/                  # 行为边界、记忆、Sub-Agent、openspec-comparison 等
│   └── feedback/              # 反馈目录
├── adapters/
│   ├── claude-code/           # Claude Code 适配（.claude/ 目录结构）
│   ├── cursor/                # Cursor 适配（.cursor/rules/ 目录结构）
│   ├── opencode/              # OpenCode 适配（.opencode/ 目录结构）
│   └── gemini-cli/            # Gemini CLI 适配（未来）
├── scripts/                   # 同步脚本、依赖图分析工具
└── README.md                  # 使用说明
```

### 用户项目中安装后的结构

```
user-project/
├── .claude/                   # （Claude Code 用户）从 adapters/claude-code 复制
│   ├── CLAUDE.md              # 主控入口
│   ├── EVOLUTION.md
│   ├── agents/
│   ├── skills/
│   └── ...
├── memory/                    # 三层项目记忆（首次 /dev-builder 时创建）
│   ├── project-memory.md      # 长期：架构、约束、已知陷阱
│   ├── decisions-log.md       # 中期：架构决策记录（ADR）
│   └── task-history.md        # 短期：近期任务摘要（最多30条）
├── Product-Spec.md            # 用户产品需求文档（用户项目根目录）
├── DEV-PLAN.md                # 开发计划
├── changes/                   # 可选：存量功能增量（/change-manager）
│   └── archive/
└── ...                        # 用户项目代码
```

### 设计思想参考

- 流程方法论：**废才** - 完整产品开发从0到1流程
- 开放多客户端：**oh-my-openagent** - 不绑定单一平台
- 技能化架构：**superpowers** - 每个技能独立可插拔，强制 TDD
- CLI + 增量变更：**OpenSpec** - artifact-guided 迭代；Forge 用 `/change-manager` + `changes/` 对齐同类流程（见 openspec-comparison.md）
- 提示词工程：**awesome-chatgpt-prompts** - 每个技能是一份精心调校的提示词，社区贡献
- 多角色分工：**OpenAI Symphony** - 不同阶段由专门的 Sub-Agent 负责，各尽其职
- 记忆体系 + PDCA 闭环：**ai-coding-ok** - 三层记忆解决 AI 失忆，红绿灯行为边界约束 AI 越界
- Agent Harness 工程：**Addy Osmani - Agent Harness Engineering** - Agent = Model + Harness，Harness（提示词、工具、钩子、子代理、反馈循环）决定模型实际行为；导入上下文压缩、渐进式披露、工具调用卸载策略
