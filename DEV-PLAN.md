# Development Plan — Forge

> 本文件记录 Forge **Harness 架构**的开发阶段（Phase 1–13）、当前进度和剩余工作。
> **维护者文档与合规**（loadout 选型、平台政策）见附录 B；**框架仓库测试**（forge-smoke）见附录 A，对应 Phase 10 的延伸，仍非 Harness 架构。
> 新 session 启动时应首先阅读此文件，了解项目状态后再继续开发。

---

## 当前进度（架构 Phase 1–13 · v1.23.0 标签同期）

| Phase | 状态 | 备注 |
|-------|------|------|
| 1 项目骨架 | ✅ 完成 | `core/`、`adapters/`、`scripts/` |
| 2 核心技能 | ✅ 完成 | 12 个 Skill（含 change-manager）+ skill.json + commands 层 |
| 3 Sub-agent | ✅ 完成 | 10 个 Agent（含 4 个专项 reviewer、planner、test-writer） |
| 4 文档模板 | ✅ 完成 | 含 memory / agents 模板 |
| 5 Claude Code 适配 | ✅ 完成 | |
| 6 同步脚本 | ✅ 完成 | `scripts/sync.ts` |
| 7 Cursor 适配 | ✅ 完成 | |
| 8 OpenCode 适配 | ✅ 完成 | 主控为 `AGENTS.md` |
| 9 README 收尾 | ✅ 完成 | 中英文 README + CHANGELOG |
| 10 脚本测试 | ✅ 完成 | Vitest：`scripts/__tests__/`；发版静态 smoke：`scripts/forge-smoke/`（见附录 A） |
| 11 Loadout 机制 | ✅ 完成 | `core/loadouts/` 4 个内置 loadout（架构：bundle 定义） |
| 12 并行代码审查 | ✅ 完成 | 4 专项 reviewer + 聚合器 |
| 13 change-manager | ✅ 完成 | 存量变更流 + openspec-comparison.md |

**架构验证**：`pnpm install` → `pnpm test`（Vitest 单元测试）→ `pnpm build` → `pnpm sync`

**框架仓库发版测试（非架构）**：`pnpm forge-smoke`（静态 smoke，见附录 A）

**待办（架构）**：`adapters/gemini-cli/`、模板市场、Dashboard Web UI；Skill 进化 P1/P2（feedback 归因、skill-bypass 清单）

---

## 附录 A：框架仓库测试 — forge-smoke（非架构）

> v1.23.0。Phase 10 的**静态 smoke 延伸**：验证目录齐、adapter 同步、loadout 引用、文档章节、CI 无 cron。  
> 详表：[scripts/forge-smoke/README.md](scripts/forge-smoke/README.md)

| 命令 | 与 Vitest 分工 |
|------|----------------|
| `pnpm test` | `sync.ts`、`install.ts`、`dependency-graph.ts` 等**逻辑**单元测试（22 项） |
| `pnpm forge-smoke` | **结构/一致性**静态检查（10 项 smoke + 内嵌 validate-skill，含 test-demo 黄金路径） |

发版前建议：`pnpm test` → `pnpm forge-smoke` → `pnpm sync`（若改过 core）。

---

## 附录 B：维护者文档与合规（非架构 · 非测试）

> 面向贡献者与平台审查；与用户 Harness、forge-smoke 测试套件无关。

| 文档 | 用途 |
|------|------|
| [loadout-scenarios.md](core/docs/loadout-scenarios.md) | 帮终端用户选 `full/web-app/cli-tool/minimal` |
| [platform-compliance.md](core/docs/platform-compliance.md) | GitHub Actions / fork / 密钥策略说明 |

注：`workflows-compliance` smoke 会**检查** platform-compliance 文档与 workflow 是否一致，但合规文档本身不是测试代码。

## Phase 1: 项目骨架搭建 + 核心目录结构

**交付内容**：
- 创建 Forge 仓库根目录结构
- 创建 core/ 目录，存放核心技能、agents、模板
- 创建 adapters/ 目录，存放各客户端适配层
- 创建 scripts/ 目录，存放同步脚本

**关键文件**：
- `core/skills/.gitkeep` — 核心技能目录占位
- `core/agents/.gitkeep` — Sub-agent 定义目录占位
- `core/templates/.gitkeep` — 文档模板目录占位
- `adapters/claude-code/.gitkeep` — Claude Code 适配目录占位
- `adapters/cursor/.gitkeep` — Cursor 适配目录占位
- `adapters/opencode/.gitkeep` — OpenCode 适配目录占位
- `scripts/sync.ts` — 核心 → 适配器同步脚本

**验收标准**：
- 目录结构完整，符合 Product Spec 定义
- 所有文件创建完成，Git 可追踪

---

## Phase 2: 核心技能填充

**交付内容**：
- 将原有技能定义复制到 core/skills/
- 每个技能保持独立目录，自带 SKILL.md
- 吸收 superpowers 技能化设计，确保每个技能边界清晰
- 按技能功能分类整理

**关键文件**：
- `core/skills/product-spec-builder/SKILL.md` — 需求收集技能
- `core/skills/design-brief-builder/SKILL.md` — 设计规范技能
- `core/skills/design-maker/SKILL.md` — 设计图制作技能
- `core/skills/dev-planner/SKILL.md` — 开发计划技能
- `core/skills/dev-builder/SKILL.md` — 项目开发技能
- `core/skills/bug-fixer/SKILL.md` — Bug 修复技能
- `core/skills/code-review/SKILL.md` — 代码审查技能
- `core/skills/release-builder/SKILL.md` — 构建发布技能
- `core/skills/skill-builder/SKILL.md` — 新建技能技能
- `core/skills/feedback-writer/SKILL.md` — 反馈记录技能
- `core/skills/evolution-engine/SKILL.md` — 进化引擎技能

**验收标准**：
- 所有核心技能都已填充
- 每个技能都有完整的 SKILL.md
- 目录结构正确，边界清晰

---

## Phase 3: 核心 Sub-agent 定义

**交付内容**：
- 创建 core/agents/ 目录，存放所有 Sub-agent 定义
- 每个 Sub-agent 保持独立文件，明确角色和任务

**关键文件**：
- `core/agents/implementer.md` — 实现者 Sub-agent
- `core/agents/planner.md` — 架构与 Phase 拆分 Sub-agent
- `core/agents/code-reviewer.md` — 审查者 Sub-agent
- `core/agents/feedback-observer.md` — 反馈观察员 Sub-agent
- `core/agents/evolution-runner.md` — 进化引擎 Sub-agent
- `core/agents/test-writer.md` — 测试生成 Sub-agent

**验收标准**：
- 所有六个 Sub-agent 定义完整
- 每个文件明确角色、任务、输出规范
- 遵循 OpenAI Symphony 多角色分工思想，各尽其职

---

## Phase 4: 核心文档模板

**交付内容**：
- 创建 core/templates/ 目录，存放所有文档模板
- 复制并整理各阶段输出文档的标准模板

**关键文件**：
- `core/templates/product-spec-template.md` — Product Spec 输出模板
- `core/templates/changelog-template.md` — 变更记录模板
- `core/templates/dev-plan-template.md` — DEV-PLAN 输出模板
- `core/templates/design-brief-template.md` — Design Brief 输出模板

**验收标准**：
- 所有模板完整复制到位
- 模板结构清晰，提示文字完整

---

## Phase 5: Claude Code 适配层

**交付内容**：
- 完成 adapters/claude-code/ 适配层
- 创建 .claude/ 目录结构
- 复制主控入口 CLAUDE.md 和 EVOLUTION.md
- 复制 agents、skills、feedback 目录结构
- 确保用户复制到项目后开箱即用

**关键文件**：
- `adapters/claude-code/.claude/CLAUDE.md` — 主控入口（从废才框架继承，适配 Forge 定位）
- `adapters/claude-code/.claude/EVOLUTION.md` — 进化引擎定义
- `adapters/claude-code/.claude/agents/` — 软链接或复制 core/agents
- `adapters/claude-code/.claude/skills/` — 软链接或复制 core/skills
- `adapters/claude-code/.claude/feedback/.gitkeep` — feedback 目录
- `adapters/claude-code/.claude/hooks/` — Git hooks（可选，如果需要）

**验收标准**：
- 用户克隆 Forge 后，只需复制 `adapters/claude-code/.claude/` 到自己项目根目录即可使用
- 目录结构完整，所有文件路径正确
- 框架能自动检测项目进度，进入对应流程

---

## Phase 6: 同步脚本实现

**交付内容**：
- 实现 scripts/sync.ts 同步脚本
- 脚本功能：将 core/ 内容同步到各 adapters 目录
- 确保 core 更新后，所有适配器能一键同步

**关键文件**：
- `scripts/sync.ts` — 主同步逻辑（`syncDir`、`copyFile` 内联实现）

**验收标准**：
- 运行 `pnpm sync` 或 `npm run sync` 能正常执行
- 核心更新后，所有适配器目录同步完成
- 不覆盖适配器中特定配置文件

---

## Phase 7: Cursor 适配层

**交付内容**：
- 完成 adapters/cursor/ 适配层
- 适配 Cursor 自定义规则格式（.cursor/rules/）
- 将 Forge 流程转换为 Cursor 可加载的规则文件
- 保持流程逻辑与 Claude Code 一致

**关键文件**：
- `adapters/cursor/.cursor/rules/reqforge.mdc` — 主规则入口
- `adapters/cursor/.cursor/rules/skills/` — 各技能规则拆分

**验收标准**：
- 用户复制后，Cursor 能正确加载 Forge 规则
- 流程逻辑与 Claude Code 一致

---

## Phase 8: OpenCode 适配层

**交付内容**：
- 完成 adapters/opencode/ 适配层
- 适配 OpenCode 插件格式
- 保持流程逻辑一致

**关键文件**：
- `adapters/opencode/.opencode/` — OpenCode 适配目录
- `adapters/opencode/.opencode/AGENTS.md` — 主控入口（约束文件格式）
- `adapters/opencode/.opencode/EVOLUTION.md` — 进化引擎定义

**验收标准**：
- 用户复制后，OpenCode 能正确加载
- 流程逻辑一致

---

## Phase 9: README 文档 + 收尾

**交付内容**：
- 编写 README.md 使用说明
- 安装方法（仅手动复制，保持简单）
- 各客户端使用指南
- 设计思想、贡献指南
- 更新 CHANGELOG

**关键文件**：
- `README.md` — 主 README
- `CHANGELOG.md` — 项目变更记录
- `LICENSE` — 开源许可证（MIT）

**验收标准**：
- 新手能按照 README 说明快速上手
- 所有链接正确
- 许可证信息完整

---

## Phase 10: 脚本自动化测试

**交付内容**：
- 为 `scripts/sync.ts`、`scripts/dependency-graph.ts` 增加 Vitest 单元测试
- 导出可测函数，`require.main === module` 守卫 CLI 入口
- `package.json` 版本与 CHANGELOG 对齐，依赖精确锁定 patch 版本

**关键文件**：
- `scripts/__tests__/sync.test.ts` — 同步逻辑（跳过 check-sync、目录复制）
- `scripts/__tests__/dependency-graph.test.ts` — 图构建、blast-radius、风险评分
- `vitest.config.ts` — 测试配置

**验收标准**：
- `pnpm test` 全部通过
- `pnpm build` 编译通过
- `package.json` 无 `^` 范围依赖

---

## 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 语言 | 纯 Markdown + 文本 | - | 规则和模板都是文本文件，不需要编译 |
| 同步脚本 | Node.js | 22.x LTS | 可选同步脚本运行时 |
| 语言 | TypeScript | 5.7.3 | 类型安全，同步脚本使用 |
| 测试 | Vitest | 4.1.6 | 脚本单元测试 |
| 包管理 | pnpm | 10.x | 快速，磁盘空间高效 |

## 开发规则

- 每完成一个 Phase 执行四步走：Code Review → 测试完整性 → 编译验证 → 功能测试
- 四步走全部通过后才能 commit
- Commit message 格式：`phase-N: 简要描述`
- 包管理器：pnpm
- 核心文件不允许依赖二进制 Node 模块，保持纯文本可用
- 适配器只放入口文件，核心内容通过同步脚本从 core 同步
