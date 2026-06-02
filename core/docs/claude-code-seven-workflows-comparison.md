# ReqForge 与「Claude Code 七个工作流」对照

> 参考：[我真正推荐的 7 个 Claude Code 工作流：每个都附固定问法](https://mp.weixin.qq.com/s/i0dNm-BTrsrJnzP2JGfu3w)（公众号「AI数字公园」，2026-06）  
> 与 [claude-md-stop-hook-comparison.md](./claude-md-stop-hook-comparison.md)（规则漂移）、[mattpocock-skills-comparison.md](./mattpocock-skills-comparison.md)（日常小 Skill）、[session-execution-discipline.md](./session-execution-discipline.md)（八条纪律）互补。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **此文** | Claude Code **原生习惯**：7 条可反复按的固定问法（记忆→计划→审阅→子代理→并行→钩子→MCP/Review） |
| **ReqForge** | 把其中可机械化的部分写成 **Skill + Hook + 工件**（Spec/Plan/证据门），避免只靠口头提醒 |

文章是「个人高效按钮」；Forge 是「团队可复制的交付 Harness」。**叠加使用**，不是二选一。

---

## 七条工作流 ↔ ReqForge 映射

| # | 文章工作流 | 文章固定问法（摘要） | ReqForge 落点 | 差距 / 可选 |
|---|------------|----------------------|---------------|-------------|
| **1** | **CLAUDE.md + `/memory`** | 先 `/init` 或整理 CLAUDE.md：启动、测试、目录、禁区 | `pnpm forge-install` → 用户 `CLAUDE.md` + `memory/` 三层；`/product-spec-builder` 写验收真相 | 可选 [claude-md-stop-hook](./claude-md-stop-hook-comparison.md) 防规则过期 |
| **2** | **计划模式** | 「先不要改代码；列影响文件、方案、风险；确认后再小步改」 | `/dev-planner` → `DEV-PLAN.md`；`spec-confirmed` / `plan-confirmed` 门；`dev-builder` Plan Mode | 比单次 Plan 多 **Spec 确认** 与 Phase 表 |
| **3** | **HTML Artifact** | 复杂方案输出 HTML：对比表、流程图、文件清单、风险 | `design-maker` / Open Design；复杂架构可用 [architecture-diagram](https://github.com/Cocoon-AI/architecture-diagram-generator) HTML | **Spec/Plan 仍以 Markdown+Git 为准**；HTML 仅审阅用 |
| **4** | **Subagents** | 子代理只调查、不改文件；带回文件链与风险 | `implementer` / `planner`；`bug-fixer` 证据优先；`code-review` 四专项 | Forge 实现 Session 与审查 Session **分离**（Iron Law） |
| **5** | **Worktrees** | `claude --worktree <name>` 并行；边界清楚才并行 | `dev-builder` **Per-Task worktree**（`.claude/worktrees/<task>`） | 文章是 CLI 并行会话；Forge 是 **单 Task 隔离** + 合并清理 |
| **6** | **Hooks + 验证** | 完成=命令+输出+未验项；前端要截图 | `stop-gate`、`phase-exit-guard`、`pre-commit-check`；[session-execution-discipline](./session-execution-discipline.md) §8；`pnpm test` / `forge-verify` | `forge-ui-check` / Playwright 按项目选配 |
| **7** | **MCP + Code Review** | PR review：逻辑/安全/回归/测试缺口 | `/code-review`；loadout MCP（Context7、GitHub 等）；[platform-compliance](./platform-compliance.md) | Forge 不托管 GitHub App；用户接 MCP |

---

## 文章推荐的优先级 ↔ 新用户路径

文章顺序：

1. CLAUDE.md → 2. Plan → 3. HTML artifact → 4. Subagent → 5. Worktree → 6. Hooks → 7. MCP/Review → **再** 沉淀 Skill

Forge 等价 onboarding（见 [loadout-scenarios.md](./loadout-scenarios.md)）：

```
forge-install → /product-spec-builder → /dev-planner → /dev-builder
→ /code-review →（团队）MCP → /evolution-engine
```

**启示**：「重复解释三次的事」→ 写进 Spec、`memory/decisions-log.md` 或 Skill，而不是更长 system prompt（与 [talk-normal-comparison](./talk-normal-comparison.md) 分层一致）。

---

## 核心原则对照

| 文章原则 | Forge |
|----------|-------|
| 先审方案再动手 | Plan 确认门 + `change-manager` 存量变更 |
| 脏上下文交给 subagent | `implementer` 子会话、`code-review` 并行 |
| 并行要隔离 | git worktree 步骤 + 禁止多 Agent 同目录乱改 |
| 完成=可验证证据 | `.forge/evidence/`、`forge-phase-check`、禁止无输出标 DONE |
| Review 不代替 approve | `code-review` 分级 + 人 merge |
| 别先囤 50 个 prompt | 12 workflow Skills + loadout，非 prompt 合集 |

---

## 与微信 / 通道类文章的分工

| 文档 | 主题 |
|------|------|
| [wechat-ilink-acp-comparison.md](./wechat-ilink-acp-comparison.md) | 微信里遥控 Claude（**通道**） |
| **本文** | IDE 里 Claude Code **怎么干活**（**纪律**） |

第 7 条里的 GitHub/PR 与微信桥无关；远程审批见 wechat 文 + Claude Code Channels，**非** Forge core。

---

## 刻意不做

- 在 core 实现 Claude Code `/init` 或 HTML artifact 生成器
- 用 7 条问法替代 `Product-Spec.md` 验收条款
- 默认开启 `claude --worktree` 多会话（Forge 只在 Task 级 worktree）
- 把文章整段 prompt 拷进 adapter `CLAUDE.md`（违反 <60 行调度图）

---

## 参考

- 微信原文：[mp.weixin.qq.com/s/i0dNm-BTrsrJnzP2JGfu3w](https://mp.weixin.qq.com/s/i0dNm-BTrsrJnzP2JGfu3w)
- Forge 会话纪律：[session-execution-discipline.md](./session-execution-discipline.md)
- Matt Pocock 小 Skill：[mattpocock-skills-comparison.md](./mattpocock-skills-comparison.md)
- Harness 七层：[agent-harness-seven-layer-map.md](./agent-harness-seven-layer-map.md)
