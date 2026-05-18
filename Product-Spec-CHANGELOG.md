# 变更记录

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
