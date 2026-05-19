# 变更记录

## [v1.14] - 2026-05-19
### 新增
- OpenCode 适配格式说明：AGENTS.md 使用约束文件格式（技术栈精确版本、行为边界、硬约束列表），非 CLAUDE.md 克隆
- 框架配置表新增 .opencode/AGENTS.md 条目
- 技术说明增加各适配格式差异：CLAUDE.md / .mdc / AGENTS.md

---

## [v1.13] - 2026-05-19
### 新增
- planner sub-agent：独立 Agent 负责架构设计和 Phase 拆分，与 implementer 上下文解耦
- code-reviewer 新增 complexity gate：change_complexity="simple" 跳过 Stage 1，小改不走完整两阶段
- feedback-observer 新增模型版本追踪：记录 model_version，检测规则是否因模型升级而过时
- test-writer sub-agent：自动生成 sync.ts 等工具脚本的测试
### 修改
- Sub-Agent 列表从 4 个扩展至 7 个
- agents 目录说明列出全部 6 个 agent 名称

---

## [v1.12] - 2026-05-19
### 修改
- 架构图中 Sub-Agent 从 4 个更新至 6 个（含 test-writer、planner）
- 模板说明更新为含 handoff 交接模板

---

## [v1.10~1.11] - 2026-05-19
### 新增
- self-wired settings.json：ReqForge 自身开发环境钩子配置
- check-sync 钩子：检测 core/ 与 adapters/ 不同步
### 修改
- settings.local.json 权限精简：65 行 → 32 行，一次性命令替换为通配模式

---

## [v1.9] - 2026-05-19
### 新增
- AI Only for Judgment Tasks：确定性逻辑用代码而非 AI 推理
- Fail Loudly：不确定时明确说"不知道"
- Token Budget Awareness：每个 Task 后评估上下文使用量

---

## [v1.8] - 2026-05-18
### 修复
- feedback-observer v1.1：失败时自动推断 Skill 评分（Precision/Coverage/Efficiency/Satisfaction），不再依赖手动打分
- check-evolution 钩子：从软提醒改为硬触发（additionalContext JSON），Agent 必须在 session init 时 dispatch evolution-runner
- dev-builder：失败时传递结构化上下文（trigger_reason + current_skill + ai_action + failure_detail），确保评分准确
- 修复棘轮空转问题：feedback 有记录但无评分数据 → evolution-runner 无法触发提案 → 现在每次失败自动产生评分数据

---

## [v1.7] - 2026-05-18
### 重构
- CLAUDE.md 从 309 行精简至 59 行，仅保留调度映射、身份定义、反馈衍生规则
- 详细说明移至 core/docs/：file-structure.md、behavior-boundaries.md、memory-system.md、sub-agent-orchestration.md

### 修复
- feedback-observer 现支持自动化失败信号触发（编译错误、审查失败、验证失败），非仅用户纠正
- dev-builder SKILL.md：审查失败和验证失败时自动调度 feedback-observer 记录反馈
- Anti-Rationalization Checklist：新增"跳过反馈记录"正反样例

---

## [v1.6] - 2026-05-18
### 修正
- 修复 Product-Spec.md 中"不依赖 bash 钩子"的错误描述，明确同时提供 .sh 和 .bat 版本
- .gitignore 新增 .claude/worktrees/ 排除测试工作树

### 新增
- README 钩子列表新增 context-compaction 条目

---

## [v1.5] - 2026-05-18
### 新增
- Agent Harness 工程参考来源：Addy Osmani - Agent = Model + Harness
- 上下文压缩钩子：Post-Tool-Use 自动归档 task-history.md 旧条目，防止上下文腐败
- 渐进式披露规则：CLAUDE.md 仅保留调度映射，详细流程驻留 SKILL.md，按需加载
- 工具调用卸载策略：超过 2000 行的大输出写入临时文件，仅保留摘要于上下文

### 修改
- EVOLUTION.md 新增 Level 0（Harness Foundation），强调 Harness 是进化的先决条件
- Workflow 部分精简，移除重复的详细流程定义，统一由 SKILL.md 承载
- dev-builder SKILL.md 新增 Tool-Call Offloading 到 First Principles

---

## [v1.4] - 2026-05-18
### 新增
- 三层记忆体系：memory/ 目录，project-memory / decisions-log / task-history 三级，跨 session 保持上下文
- 红绿灯行为边界：🟢🟡🔴 三级操作权限，YOLO 模式下 🔴 仍需确认
- 快速初始化模式：一句话描述项目，AI 推断最小 Spec，不确定项标记 [待确认]
- memory-check 钩子：文件编辑后检测记忆是否更新，防止遗忘

### 修改
- 吸收 ai-coding-ok 设计参考：三层记忆 + PDCA 强制闭环
- 产品概述更新：新增 ai-coding-ok 参考来源
- 目录结构调整：新增 memory/ 目录、hooks/、feedback/ 到 core/
- DEV-PLAN.md 纳入用户项目根目录结构

---

## [v1.3] - 2026-05-16
### 新增
- 吸收 OpenAI Symphony 启示：多角色 Sub-Agent 分工，每个阶段由专门 Agent 负责，各尽其职，产出质量更高
- 吸收 awesome-chatgpt-prompts 启示：每个技能是一份精心调校的提示词，开放社区贡献

---

## [v1.2] - 2026-05-16
### 修改
- 产品定位调整：核心是文件即用，复制到项目目录就能运行，不需要安装 npm 包，更贴近废才使用方式
- 简化架构：去掉复杂 monorepo，核心共享 + 多适配器目录结构，更易于维护和使用
- 保留 CLI 作为可选便利功能，不强制

---

## [v1.1] - 2026-05-16
### 新增
- 吸收 superpowers 启示：技能独立可插拔架构、强制 TDD 纪律、subagent 隔离原则
- 吸收 OpenSpec 启示：CLI 工具一键初始化、增量变更 artifact 管理、支持已有项目初始化
- 支持多客户端适配，每个客户端独立目录结构

### 修改
- 产品定位升级为整合各家所长的开源框架：废才流程 + oh-my-openagent 开放架构 + superpowers 技能化 + OpenSpec CLI 体验

---

## [v1.0] - 2026-05-16
- 初始版本：定义 Forge 产品需求，开源多客户端适配框架，整合废才流程 + oh-my-openagent 开放架构
