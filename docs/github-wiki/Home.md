# ReqForge（Forge）

**当前版本：v1.25.0**（2026-05-25）  
**主文档**：[README 中文](https://github.com/zxpmail/ReqForge/blob/main/README.zh-CN.md) · [README English](https://github.com/zxpmail/ReqForge/blob/main/README.md) · [CHANGELOG](https://github.com/zxpmail/ReqForge/blob/main/CHANGELOG.md)

---

ReqForge 是把 AI 编码助手变成**可交付产品开发操作系统**的开源 Harness（不是零散 prompt）：

- **需求 → Spec → Plan → 实现 → 审查 → 发布**
- 适配 **Claude Code**、**Cursor**、**OpenCode**
- **Skill + 钩子 + 记忆 + 进化**，让输出可验证、可回滚

**一句话**：模型是 CPU，Harness 是 OS——编排、记忆、护栏、验收，目标是把产品做出来，而不是聊完就散。

---

## 快速开始

1. 克隆 [zxpmail/ReqForge](https://github.com/zxpmail/ReqForge)
2. 将 `adapters/claude-code/.claude`（或 Cursor / OpenCode 对应目录）复制到你的**用户项目**根目录
3. 在 AI 客户端中从 **`/product-spec-builder`** 开始，产出 `Product-Spec.md` 并**书面确认**后再 `/dev-planner`、`/dev-builder`

详细安装见 README 的 [安装与使用](https://github.com/zxpmail/ReqForge/blob/main/README.zh-CN.md#安装与使用)。

---

## v1.25 要点（摘要）

| 主题 | 说明 |
|------|------|
| **Harness 硬化** | 会话注入 `forge-bootstrap`；PreToolUse 五段链（Spec → 确认 → Plan → 确认 → implementer）；HARD-GATE |
| **PM 框架** | `product-spec-builder` 可选参考 [pm-skills](https://github.com/phuryn/pm-skills)（OST、JTBD、假设、竞品） |
| **思维链 CoT** | 先推理再结论；见 Skill 内模板，**不必**每条消息写「先想想看」 |
| **LLM Wiki 纪律** | 重要结论写入 `memory/` ADR，不单留对话（v1.24 起，见下方对照文档） |
| **发版守门** | 维护者：`pnpm forge-smoke`（12 项） |

---

## 核心 Skill 命令

| 阶段 | 命令 | 产出 |
|------|------|------|
| 需求 | `/product-spec-builder` | `Product-Spec.md` |
| 存量变更 | `/change-manager` | `changes/<name>/` |
| 计划 | `/dev-planner` | `DEV-PLAN.md` |
| 开发 | `/dev-builder` | 代码（每 Task：implementer + worktree） |
| 调试 | `/bug-fixer` | 修复 + 测试 |
| 审查 | `/code-review` | 审查报告 |
| 发布 | `/release-builder` | 发布清单 |

---

## 文档导航（仓库内）

| 文档 | 链接 |
|------|------|
| Harness 成熟度自检 | [harness-maturity-checklist.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/harness-maturity-checklist.md) |
| Loadout 场景选型 | [loadout-scenarios.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/loadout-scenarios.md) |
| 记忆体系 + LLM Wiki | [memory-system.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/memory-system.md) · [llm-wiki-comparison.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/llm-wiki-comparison.md) |
| Superpowers 对照 | [superpowers-comparison.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/superpowers-comparison.md) |
| OpenSpec 对照 | [openspec-comparison.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/openspec-comparison.md) |
| 平台合规（CI/fork） | [platform-compliance.md](https://github.com/zxpmail/ReqForge/blob/main/core/docs/platform-compliance.md) |

完整对照索引见 [README → 参考与对照](https://github.com/zxpmail/ReqForge/blob/main/README.zh-CN.md#参考与对照)。

---

## Wiki 维护说明

- 本页源稿：`docs/github-wiki/Home.md`（随版本 bump 时一并更新）
- **GitHub Wiki 不会**随 `git push` 自动更新，需维护者按 [`docs/github-wiki/README.md`](https://github.com/zxpmail/ReqForge/blob/main/docs/github-wiki/README.md) 手动粘贴

---

*ReqForge · MIT · [GitHub](https://github.com/zxpmail/ReqForge)*
