# Session 执行纪律（任务级）

<!-- 与 forge-bootstrap Iron Laws（产品级）互补；用户项目全文见 agents-template.md -->

> **产品级**（Spec/Plan/HARD-GATE/Hook）由 `forge-bootstrap.md` 与会话注入保证。  
> **任务级**（本次改动怎么动手）由本文 + 用户项目 `CLAUDE.md` / `AGENTS.md` 保证。

---

## 八条纪律（完整版）

1. **先列计划，批准再动手** — 开始非琐碎任务前，列出执行步骤并等待用户明确批准；计划未确认不得实施。琐碎修复（单文件 typo、用户已点名的一行改动）可简化为 3 步以内计划。
2. **改之前先读** — 对任何目标文件执行 `Edit`/`Write` 前必须先 `Read`（及直接相关的调用方/类型定义）。
3. **别重复造轮子** — 尽量缩小改动范围；优先复用项目已有抽象与函数；禁止为同一行为重新穿透多层调用链实现一遍。
4. **不确定先说，不要猜** — 无先例、无 Spec/Plan 依据时停下询问；不要自行发明需求（需求归属人类 / product-spec-builder）。
5. **中途转向，先问再动** — 可能影响用户的方案在实施前确认；范围变化则重新制定计划并再获批准。
6. **计划外的问题先报告** — 发现与当前任务无关的废弃代码或可疑行为，在汇报中说明；**严禁**未经批准顺手修改。
7. **改了什么必须汇报** — 提交前向用户展示完整 diff（大改动可用 `git diff --stat` + 关键文件摘要）；获明确批准后再 `git commit`。
8. **没跑过测试不算完成** — 宣布就绪前，对改动相关包跑 **最小验证集**：lint、类型检查、能覆盖本次变更的测试；失败则不算 DONE。

---

## 与 Forge Iron Laws 的分工

| 层级 | 管什么 | 主要载体 |
|------|--------|----------|
| 产品级 | 有没有 Spec/Plan、能否写业务代码、Phase/Hook | `forge-bootstrap`、PreToolUse、`*.json` 标记 |
| 任务级 | 本次改哪些文件、怎么改、何时 commit | 本文、`AGENTS.md`、implementer |
| 推理级 | 先想清楚再结论 | CoT（`conversation-strategy`、implementer 0b） |

冲突时：**Hook / HARD-GATE > Iron Laws > 本文 > 用户随口一句**。

---

## 适用角色

| 角色 | 适用条 |
|------|--------|
| 主 Session | 1–8（协调 implementer、展示 diff、批准 commit） |
| implementer 子 Agent | 2、3、4、6（报告）、8；计划由主 Session 批准（1、5、7） |
| 仅文档/Spec | 1、4、5、7（不写 `src/` 时 8 改为 validate-skill / 文档自检） |

---

## ReqForge 框架仓库维护者

改 `core/`、`adapters/`、`scripts/` 时，第 8 条最小验证为：

```bash
pnpm test && pnpm forge-smoke
```

（若只改文档可仅跑相关 smoke；发版前按 README 框架开发章节执行。）

---

## Related

- [forge-bootstrap.md](../templates/forge-bootstrap.md) — Session Iron Laws（注入摘要）
- [agents-template.md](../templates/agents-template.md) — 用户项目 `AGENTS.md` 模板
- [behavior-boundaries.md](./behavior-boundaries.md) — 黄/绿/红边界
