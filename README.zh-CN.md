# Forge

**产品开发流程框架** — 从模糊想法到可运行产品，全程 AI 辅助引导。

将完整的产品开发方法论带到各个 AI 编程客户端：Claude Code、Cursor、OpenCode。

---

## 概述

做过 Vibe Coding 的都有体会：难的不是让 AI 写一段代码，而是整个产品开发过程的管理。你跟 AI 说"帮我做一个写作工具"，它可能直接开写。写到一半发现方向不对，推翻重来。好不容易功能写完了，界面丑得没法用——因为没有设计图，AI 只能从预训练数据里拼凑默认样式。改了界面又发现 bug，改了 bug 又引入新 bug。上下文一长，前面说的需求它全忘了。

这些问题的根源不是模型不够聪明，而是模型周围没有系统。

Forge 是一套 **Agent Harness**——不是优化你怎么跟 AI 说话，而是搭建一整套约束、引导和反馈机制，让 AI 在动手之前就知道该怎么做，做完之后自动检查有没有做对，出了问题自动修正，同样的错不犯第二次。

**Harness = Guides（前馈控制）+ Sensors（反馈控制）+ Steering Loop（进化系统）**

- **Guides** — 每个 Skill 定义方法论、执行流程和验收标准，在 Agent 动手之前就把"怎么做"和"做到什么程度算合格"写清楚
- **Sensors** — Hook 脚本 + Code Review，Agent 行动之后的每个关键节点都有检查，不依赖模型自觉
- **Steering Loop** — 每次用户给出修正，系统记录下来；同样的问题出现三次以上，自动升级为写进 Skill 的正式规则

---

## 快速开始

> **不建议在 YOLO 模式下使用 Forge。** Forge 的核心是 Gate — 每个 Phase、每次 review、每个 evolution 提案都需要你确认。YOLO 模式会全部自动批准，让这套 Harness 形同虚设。关掉 YOLO 才能发挥 Forge 的全部价值。
>
> 如果确实要用 YOLO，所有 Gate 会自动切换到**异步写文件模式** — review 报告、fix 日志、evolution 提案、phase 检查点都会写入 `changes/` 和 `.claude/.yolo-pending/`，不阻塞执行。dev-builder 还会自动进入下一 Phase，无需重新调用 `/dev-builder`。这样保留了进化引擎所需的数据流，跑完后你可以一次性查看全部产出。Gate 没有跳过，只是不拦着你了。
>
> **启用方式**（优先级：项目配置 > 全局配置 > 环境变量）：
> 1. **项目配置**：复制 `.forge/config.example` 到 `.forge/config`，取消注释 `FORGE_MODE=yolo`
> 2. **全局配置**：创建 `~/.forge/config`（Linux/Mac）或 `%USERPROFILE%\.forge\config`（Windows），写入 `FORGE_MODE=yolo`
> 3. **环境变量**：`export FORGE_MODE=yolo`（Linux/Mac）或 `set FORGE_MODE=yolo`（Windows）

### Claude Code

复制 `adapters/claude-code/.claude/` 到你项目根目录，打开 Claude Code 即可使用。

### Cursor

复制 `adapters/cursor/.cursor/` 到你项目根目录。

### OpenCode

复制 `adapters/opencode/.opencode/` 到你项目根目录。

### 按平台配置 Hook

Hook 在关键事件（提交、消息、编辑、启动）时自动触发，需要根据平台选择正确的 `settings.json`：

| 平台 | 使用的文件 | Hook 脚本 | 依赖 |
|------|-----------|-----------|------|
| Linux/Mac | `settings.json`（默认） | `.sh` | `sh`（系统自带） |
| Windows | `settings.windows.json` | `.bat` | 无需额外依赖 |

复制适配器目录后，根据平台重命名配置文件：

```
# Windows — 使用 .bat 钩子（无需 Git Bash）
copy settings.windows.json settings.json

# Linux/Mac — .sh 钩子开箱即用，无需额外操作
```

**OpenCode** 不使用 `settings.json` — 它自带的 `.sh`（Linux/Mac）和 `.bat`/`.ps1`（Windows）钩子在各平台原生工作。

---

## 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│  主控文件（CLAUDE.md / .cursor/rules/reqforge.mdc）           │ ← 调度层
│  项目状态检测、流程路由、Skill 调度、Sub-Agent 派发           │
├─────────────────────────────────────────────────────────────┤
│  Sub-Agents × 4（Context Firewall）                          │ ← 执行层
│  ├─ implementer        编码实现 + 编译验证 + 自检             │
│  ├─ code-reviewer      两阶段审查                            │
│  ├─ feedback-observer  捕捉用户反馈                          │
│  └─ evolution-runner   扫描 feedback 积累                    │
├─────────────────────────────────────────────────────────────┤
│  Skills × 11（Guides / 前馈控制）                            │ ← 引导层
│  行动之前注入方法论和验收标准，提高一次做对的概率              │
├─────────────────────────────────────────────────────────────┤
│  Hooks + Review 闭环（Sensors / 反馈控制）                    │ ← 检查层
│  行动之后检查结果，发现偏差触发修正，确定性执行               │
├─────────────────────────────────────────────────────────────┤
│  feedback/ + EVOLUTION.md（Steering Loop）                  │ ← 进化层
│  每次修正改进 Harness，同样的错不犯第二次                    │
└─────────────────────────────────────────────────────────────┘
```

### 引导层 — 十一项 Skill

每个 Skill 是独立的方法论模块，可组合、可扩展、可插拔：

| Skill                    | 职责                                                          |
| ------------------------ | ----------------------------------------------------------- |
| **product-spec-builder** | 需求收集。不是让你写一份需求文档扔给 AI，而是 AI 通过多轮追问帮你把模糊想法变成结构化需求。支持迭代模式     |
| **design-brief-builder** | 设计规范。通过追问把"深色主题、极简风格"这类模糊描述量化为配色方案、交互风格、信息密度等具体方向           |
| **design-maker**         | 设计图制作。通过 Pencil 或 Figma MCP 在设计工具中生成完整页面原型图                 |
| **dev-planner**          | 开发计划。分析功能依赖关系，拆分为多个 Phase，输出分阶段开发计划                         |
| **dev-builder**          | 项目开发。拆分为 Task 逐个完成，每个 Task 走「编码 → review → fix → commit」闭环  |
| **bug-fixer**            | 四阶段系统性调试。不猜不试：收集证据 → 分析模式 → 假设验证 → 实施修复                     |
| **code-review**          | 两阶段审查。Stage 1 查 Spec 合规，Stage 2 查代码质量，Stage 1 未通过不进 Stage 2 |
| **release-builder**      | 构建发布。内置隐私审计和冒烟测试                                            |
| **feedback-writer**      | 将用户的修正和反馈记录为结构化文件。为进化引擎提供数据积累                                     |
| **evolution-engine**     | 扫描积累的 feedback，识别模式（出现 3 次以上），提议升级规则或优化技能                     |
| **skill-builder**        | 从零创建新的 Skill 定义。由进化引擎提议或手动触发                                     |

### 执行层 — Sub-Agent 隔离

每个 Task 用全新的 Sub-Agent 实例，不复用、不继承之前的上下文。主 Agent 给 Sub-Agent 的任务包包含完整的上下文（Spec 条目、交付清单、涉及文件、项目结构），但不包含之前 Task 的执行历史。防止前一个 Task 的错误假设污染后一个 Task 的判断。

### 检查层 — Hook + Review 闭环

代码不是写完就算，写完必须过审：

```
功能开发 → code-reviewer 两阶段审查
  ├─ Stage 1 通过 → Stage 2
  ├─ Stage 1 失败 → 补实现 → 重新 review
  └─ Stage 2 通过 → commit + push → Task 完成
  └─ Stage 2 失败 → bug-fixer 修复 → 重新 review
```

六个 Hook 脚本在关键节点自动触发，作为确定性的传感器：

| Hook                   | 触发时机       | 作用             |
| ---------------------- | ---------- | -------------- |
| pre-commit-check       | commit 前   | 编译不过阻止提交       |
| auto-push              | commit 后   | 自动推送到远程        |
| stop-gate              | Agent 停止前  | 代码未审查不让停       |
| detect-feedback-signal | 用户提交消息     | 自动捕捉修正信号       |
| mark-review-needed     | 文件编辑后      | 标记代码变更待审查      |
| check-evolution        | session 启动 | 检查 feedback 积累 |

### 进化层 — Steering Loop

Harness 不是搭完就不动了。每次出问题，你去改 Harness，让同样的错不再发生：

1. **经验积累** — 用户给出修正时静默记录，几乎无感
2. **规则毕业** — 同一条反馈出现 3 次以上，提议升级为 Skill 或主控文件的正式规则
3. **Skill 优化** — 某 Skill 的反馈评分持续偏低，提议调整该 Skill
4. **新 Skill 创建** — 某操作模式反复出现但没有 Skill 覆盖，提议创建新 Skill

所有进化建议需要用户逐条确认后才执行，不自动改规则。

---

## 设计优先级

```
设计工具中的设计稿（最高）→ Design-Brief.md → Product-Spec.md（功能逻辑）
```

有设计图时，一切 UI 以设计图为准，冲突时设计图优先。

---

## 使用流程

1. **描述想法** — 告诉 AI 你想做什么，product-spec-builder 通过追问帮你想清楚
2. **生成需求文档** — 输出 Product-Spec.md
3. **设计规范（可选）** — 调用 /design-brief-builder
4. **设计图制作（可选）** — 调用 /design-maker
5. **开发计划** — 调用 /dev-planner，输出 DEV-PLAN.md
6. **项目开发** — 调用 /dev-builder，按 Phase 逐 Task 开发
7. **自动审查** — code-reviewer 两阶段审查
8. **自动修复** — 审查失败自动调用 bug-fixer
9. **提交推送** — 审查通过后自动 commit + push
10. **Phase 验证** — 跨 Task 集成检查 + 编译验证 + 功能测试
11. **迭代修改** — 直接对话提需求，自动更新 Spec → Plan → 开发 → 审查
12. **构建发布** — 调用 /release-builder

## 仓库结构

```
Forge/
├── core/                      # 核心共享内容
│   ├── skills/                # 11 个技能定义，每个独立目录
│   ├── agents/                # 4 个 Sub-agent 定义
│   ├── templates/             # 文档模板
│   ├── hooks/                 # Hook 脚本（.sh/.bat/.ps1）
│   └── feedback/              # feedback 模板
├── adapters/
│   ├── claude-code/           # Claude Code 适配（.claude/）
│   ├── cursor/                # Cursor 适配（.cursor/rules/）
│   └── opencode/              # OpenCode 适配（.opencode/）
├── .forge/                    # Forge 项目配置
│   └── config.example         #     配置模板（复制到 config 以激活）
├── .claude/                   # Forge 自身控制文件
├── CLAUDE.md                  # 主控文件
├── scripts/
│   └── sync.ts                # core → 适配器同步脚本
├── changes/                   # 变更产物（proposal/specs/design/tasks）
│   └── archive/               # 已实现的变更归档
├── EVOLUTION.md               # 进化引擎定义
├── Product-Spec.md            # Forge 自身 Product Spec
├── Product-Spec-CHANGELOG.md  # Spec 变更记录
├── DEV-PLAN.md                # Forge 自身开发计划
├── package.json               # Forge 开发依赖
├── tsconfig.json
├── LICENSE                    # MIT 许可证
└── README.md                  # 本文件
```

---

## 模型建议

由于覆盖产品开发的完整链路，对模型能力的要求比单一任务方案更高。建议使用 Opus 或 Sonnet 级别的模型。初次使用建议先跑一个小项目跑通全流程，确认产出质量后再投入完整项目。

---

## 许可证

MIT
