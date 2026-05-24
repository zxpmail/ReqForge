# Agent Harness 七层对照（ReqForge 映射）

> 教学参考：[AGENT魔方 · 从零开始理解 Agent 番外篇：Harness 是什么？](https://bbs.huaweicloud.com/blogs/476342)（`Agent = Model + Harness`）  
> 生产自检：[harness-maturity-checklist.md](./harness-maturity-checklist.md) · 库文档伙伴：[context7-comparison.md](./context7-comparison.md) · Shell 输出压缩：[rtk-comparison.md](./rtk-comparison.md) · Harness 纪律参照：[nanochat-comparison.md](./nanochat-comparison.md) · Skill 进化论文：[skill-evolution-comparison.md](./skill-evolution-comparison.md)

---

## 一句话

**模型负责想，Harness 负责让想法能安全、可重复地落地。** ReqForge 在「七层教学骨架」之上，增加了 **需求工件（Spec/Plan）、存量变更、审查、发布、进化** —— 面向「做出可发布产品」，而不只是 507 行 demo 循环。

---

## 七层对照表

| # | 教学层（AGENT魔方系列） | 解决什么问题 | ReqForge 落点 |
|---|-------------------------|--------------|---------------|
| 1 | **工具 + 执行循环** | 模型只能说话，不能动手 | `dev-builder` Plan Mode → Task → 实现；TDD；`implementer` 子 Agent |
| 2 | **记忆 + 规划** | 每次对话从零开始 | `memory/` 三层；`dev-planner` → `DEV-PLAN.md`；`CONTEXT.md`（用户项目） |
| 3 | **Rules + Skills + MCP** | 不懂项目规范、不会调外部能力 | `CLAUDE.md` / 适配器规则；12 Skills + `references/` 渐进披露；loadout 可选 MCP（Context7、设计、Playwright） |
| 4 | **SubAgent / Teams** | 单线程扛不住复杂任务 | `planner`、`implementer`；并行 4 专项 `code-review` |
| 5 | **上下文压缩** | Context Rot，越长越糊 | `memory-guard`（compaction + handoff）；大输出 offload（`CLAUDE.md`）；可选叠加 [RTK](https://github.com/rtk-ai/rtk)（Shell 输出层，见 [rtk-comparison.md](./rtk-comparison.md)） |
| 6 | **Hook 安全网** | 危险命令、未审查就停 | `hallucination-gate`、`pre-commit-check`、`stop-gate`、`phase-exit-guard` |
| 7 | **续命（Ralph Loop）** | 到迭代上限但任务未完成 | `phase-exit-guard` + `.forge/phase-exit-block`（见下） |

---

## 第 7 层：Phase 退出守卫（Ralph Loop 轻量版）

教学文建议：Agent 想退出时，先问「任务是否真的完成」。

ReqForge 做法（不解析整份 DEV-PLAN，避免误伤）：

1. **开发中**若四步验收未通过或 Phase 未完成：`dev-builder` 可写入  
   `.forge/phase-exit-block`（一行原因，UTF-8）。
2. **`phase-exit-guard` 钩子**（`BeforeCommand`）：该文件存在则 **阻止停止**，提示对照 `DEV-PLAN.md` 验收项。
3. **Phase 真正完成**且用户确认后：删除 `.forge/phase-exit-block`。

与 `stop-gate` 分工：`stop-gate` = 代码改了没审；`phase-exit-guard` = 计划里的 Phase 没收尾。

---

## ReqForge 多出来的层（教学七层之上）

| 能力 | 说明 |
|------|------|
| Product-Spec | 0-to-1 / Quick / 迭代模式 |
| change-manager | 存量功能单次变更（OpenSpec 对齐） |
| code-review | 简单默认 + 复杂并行 |
| release-builder | 发布边界 |
| evolution-engine | 反馈 → 规则/Skill 升级（含可验证预测，见 SKILL） |

---

## 选型简表

| 你的目标 | 建议 |
|----------|------|
| 学会 Harness 原理 | AGENT魔方系列 + 本文对照 |
| 做可发布产品 | ReqForge 全流程 |
| 库 API 不写错 | 叠加 [Context7](https://github.com/upstash/context7) |
| 长会话 shell 输出爆炸 | 叠加 [RTK](https://github.com/rtk-ai/rtk)（可选） |
| 学 Harness 工程纪律（speedrun / 快环） | 读 [nanochat-comparison.md](./nanochat-comparison.md) |
| 只写代码不管需求 | Superpowers 或裸 Context7 + 规则 |

---

## Related

- [harness-maturity-checklist.md](./harness-maturity-checklist.md)
- [context7-comparison.md](./context7-comparison.md)
- [rtk-comparison.md](./rtk-comparison.md)
- [nanochat-comparison.md](./nanochat-comparison.md)
- [superpowers-comparison.md](./superpowers-comparison.md)
