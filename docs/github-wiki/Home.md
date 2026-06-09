# ReqForge（Forge）

**当前版本：v1.44.0**（2026-06-09）  
**主文档**：[README 中文](https://github.com/zxpmail/ReqForge/blob/main/README.zh-CN.md) · [README English](https://github.com/zxpmail/ReqForge/blob/main/README.md) · [CHANGELOG](https://github.com/zxpmail/ReqForge/blob/main/CHANGELOG.md)

---

ReqForge 是把 AI 编码助手变成**可交付产品开发操作系统**的开源 Harness（不是零散 prompt）：

- **需求 → Spec → Plan → 实现 → 审查 → 发布**
- 适配 **Claude Code**、**Cursor**、**OpenCode**、**Gemini CLI**
- **14 个 Skill + 钩子 + 记忆 + 进化**，让输出可验证、可回滚

**一句话**：模型是 CPU，Harness 是 OS——编排、记忆、护栏、验收，目标是把产品做出来，而不是聊完就散。

---

## 快速开始

1. 克隆 [zxpmail/ReqForge](https://github.com/zxpmail/ReqForge)
2. **推荐**：`pnpm forge-install <client> --target /path/to/my-app`（`claude-code` | `cursor` | `opencode` | `gemini-cli`）  
   或手动复制 `adapters/<client>/` 下对应目录到用户项目根
3. 陌生领域可选先跑 **`/domain-mapper`** → `domain-map.md`
4. **`/product-spec-builder`** → `Product-Spec.md`（0-to-1 默认 Multi-Stakeholder Review + 批判 Gate）→ 确认后再 **`/dev-planner`**、**`/dev-builder`**

详细安装见 README [安装与使用](https://github.com/zxpmail/ReqForge/blob/main/README.zh-CN.md#安装与使用)。

---

## v1.43 要点（摘要）

| 主题 | 说明 |
|------|------|
| **Multi-Stakeholder Review** | 写 Spec 前四视角扫描（业务/技术/体验/范围与风险） |
| **/domain-mapper** | 领域研究 → `domain-map.md`（独立于 spec→build 管线） |
| **forge-bug-fix** | bisect / classify / trace / verify，已接入 bug-fixer |
| **Gemini CLI** | 第 4 个适配器；`.gemini/GEMINI.md` |
| **2.5 层 + UI-Spec** | design-maker → dev-builder 模型间中间表示 |
| **Workflow Cookbook** | [workflow-cookbook.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/workflow-cookbook.md) |
| **forge-install 写入** | `.forge/quickref.md`、dev-map、security-guidance、preflight |
| **发版守门** | 维护者：`pnpm forge-smoke` |

---

## 核心 Skill 命令

| 阶段 | 命令 | 产出 |
|------|------|------|
| 模糊路由 | `/request-dispatcher` | 推荐目标 Skill |
| 领域研究（可选） | `/domain-mapper` | `domain-map.md` |
| 需求 | `/product-spec-builder` | `Product-Spec.md` |
| 设计（可选） | `/design-brief-builder` · `/design-maker` | `Design-Brief.md` · 设计稿 + 临时 `UI-Spec.md` |
| 存量变更 | `/change-manager` | `changes/<name>/` |
| 计划 | `/dev-planner` | `DEV-PLAN.md` |
| 开发 | `/dev-builder` | 代码 + `memory/` |
| 调试 | `/bug-fixer` | 修复（可配合 `pnpm forge-bug-fix`） |
| 审查 | `/code-review` | 审查报告 |
| 发布 | `/release-builder` | 发布清单 |

---

## 文档导航（仓库内）

| 文档 | 链接 |
|------|------|
| Harness 成熟度自检 | [harness-maturity-checklist.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/harness-maturity-checklist.md) |
| 七层对照 | [agent-harness-seven-layer-map.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/agent-harness-seven-layer-map.md) |
| Loadout 场景选型 | [loadout-scenarios.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/loadout-scenarios.md) |
| Workflow Cookbook | [workflow-cookbook.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/workflow-cookbook.md) |
| Agent 执行纪律（8 条） | [session-execution-discipline.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/session-execution-discipline.md) |
| OpenSpec 对照 | [openspec-comparison.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/openspec-comparison.md) |
| 平台合规（CI/fork） | [platform-compliance.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/platform-compliance.md) |

完整对照索引见 [README → 参考与对照](https://github.com/zxpmail/ReqForge/blob/main/README.zh-CN.md#参考与对照)。

---

## Wiki 维护说明

- 本页源稿：`docs/github-wiki/Home.md`（随版本 bump 时一并更新）
- **GitHub Wiki 不会**随 `git push` 自动更新，需维护者按 [`docs/github-wiki/README.md`](https://github.com/zxpmail/ReqForge/blob/main/docs/github-wiki/README.md) 手动粘贴

---

*ReqForge · MIT · [GitHub](https://github.com/zxpmail/ReqForge)*
