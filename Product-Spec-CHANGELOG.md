# 变更记录

## [v1.29.0] - 2026-05-28
### 新增
- **`.forge/security-guidance.md`**：团队安全规则模板，`installSecurityGuidance` + 对照文档
- **forge-verify** `security-patterns` 轻量扫描

### 变更
- 框架版本号 **v1.29.0**；code-review / release-builder / dev-builder 引用安全规则文件

## [v1.28.0] - 2026-05-27
### 新增
- **dev-map 开发导航地图**：`.forge/dev-map.md` 项目级语义索引，dev-builder 维护，`forge-install` 写入模板
- **forge-verify 事后验证**：统一入口 `pnpm forge-verify`，9 项检查（含 content-quality 配置探测；语义管道走 `forge-verify-content`）+ 基线对比（save/compare/check）
- **request-dispatcher**：补全 skill.json 元数据和 commands/ 命令文件

### 变更
- 框架版本号 **v1.28.0**（package.json、README 徽章、Wiki Home）；发布日 **2026-05-27**
- **dev-builder**：Loading Phase 保存基线，完成后 forge-verify 对比 + 更新 dev-map；新增 Post-Verification Gate 原则
- **check-evolution hook**：项目状态检测增加 dev-map
- **Smoke tests**：12→13 skill 计数对齐

## [v1.27.0] - 2026-05-27
### 新增
- **CLAUDE.md 分区**：Immutable/Stable/Volatile 三区，提示词前缀保持稳定利于 prompt caching
- **Hook 修复**：PreToolUse/PostToolUse 改为数组，移除无效事件，合并 BeforeCommand/AfterCommand

### 变更
- 框架版本号 **v1.27.0**（package.json、README 徽章、Wiki Home）；发布日 **2026-05-27**
- **Skill 质量**：13/13 PASS，0 FAIL；4 个 Skill 满分 33/33；修复 Gotchas 计数污染、Strategy 复数 regex 不匹配、TBD 匹配 `\[.*\]` sed 模式
- **反馈清理**：JSON 反馈文件统一转为 .md frontmatter 格式，FEEDBACK-INDEX.md 补全

## [v1.26.0] - 2026-05-27
### 新增
- 验证循环纪律、`.forge/quickref.md`（forge-install 写入）
- Idea Validation Gate、DEV-PLAN MVP Scope、Founder's Playbook 对照
- 术哥无界 OpenSpec+Superpowers 对照；change-manager ↔ dev-builder Change-Scoped
- **request-dispatcher** 元 Skill；12 Skill HTML 知识边界标记

### 变更
- 框架版本号 **v1.26.0**（package.json、README 徽章、Wiki Home）；发布日 **2026-05-27**

## [v1.25.0] - 2026-05-25
### 新增
- Harness 硬化：forge-bootstrap、PreToolUse 确认链、implementer-session、skill-fixtures / forge-smoke 12 项
- product-spec-builder：`pm-frameworks-*`（MIT / pm-skills 摘编）、CoT 访谈模板

### 变更
- 框架版本号 **v1.25.0**（package.json、README 徽章）

## [v1.24.0] - 2026-05-24
### 新增
- Karpathy 对照文档：**autoresearch**、**llm-council**、**jobs**、**llm-wiki**（gist）
- **Primary metric**（dev-planner）、**code-review risk_rank**、**PROJECT-HEALTH.md**、Spec **LLM-as-Judge** 段、Council 式审查

### 变更
- **OpenCode**：`.opencode/AGENTS.md` 同步为与 `CLAUDE.md` 相同的 Forge 调度图（修复此前误用空 `agents-template`）
- **forge-smoke**：校验 OpenCode AGENTS.md 含 Skill Dispatch 与 Machine Gates
- **Product-Spec-CHANGELOG** 与 v1.22–v1.24 对齐

## [v1.23.0] - 2026-05-24
### 新增
- **forge-smoke** 发版守门（9→10 项含 test-demo 黄金路径）、**loadout-scenarios.md**、**platform-compliance.md**
- **test-demo/**：Spec/Plan → todo-cli 示范产物 + `pnpm test-demo-golden-path`（维护者/CI 守门，非用户 CLI）
- 对照文档：**RTK**、**nanochat**（Harness 纪律参照）

### 变更
- DEV-PLAN：维护者文档与架构 Phase 分附录；路线图（未排期）与 Phase 1–13 完成态分离

## [v1.22.2] - 2026-05-23
### 变更
- 默认钩子 **10 个**（含 **retry-gate**）；Windows settings 与 Unix 对齐
- Skill 内 `core/docs/` 链接改为 GitHub 绝对 URL（仅复制 adapter 时仍可访问）

## [v1.22.1] - 2026-05-23
### 新增
- **phase-exit-guard**：Phase 未收尾时阻止 Agent 停止（`.forge/phase-exit-block`）
- **agent-harness-seven-layer-map.md**（教学七层 ↔ ReqForge）
### 变更
- **evolution-engine**：提案须含 **Predicted effect** + **Verify by**

## [v1.22.0] - 2026-05-23
### 新增
- **Context7** 叠加：context7-comparison.md、Plan/Spec 模板 Context7 Library ID 列、dev-builder 库文档策略
- **web-app** loadout 可选 Context7 MCP

## [v1.20.2] - 2026-05-23
### 变更
- product-spec-builder 迭代不再创建 `changes/`；中等 scoped 功能转 `/change-manager`
- 代码审查默认 `change_complexity=simple`
- 模板市场、Dashboard 移至路线图（未实现）

## [v1.20.0] - 2026-05-23
### 新增
- **change-manager Skill**：存量项目 `changes/<name>/` 四阶段变更流（propose/apply/verify/archive）
- **openspec-comparison.md**：Forge 与 OpenSpec 对照文档

### 变更
- Skill 总数 11 → 12；增量变更章节与 `/change-manager` 对齐

---

## [v1.14] - 2026-05-19
### 新增
- 依赖图分析成为核心功能：内置文件级依赖图工具，变更时计算 blast-radius 影响范围，数据驱动 complexity gate 决策

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
