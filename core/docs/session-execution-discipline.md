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
8. **验证循环才算完成** — 宣布就绪前进入 **验证循环**：实施 → 跑 **最小验证集**（lint、类型检查、覆盖本次变更的测试）→ 若有失败则修复 → **重新跑同一验证集** → 重复直到全部通过 → 才可声明 DONE。单次失败后「应该可以了」不算完成；完成声明须附**最后一轮**验证命令与通过摘要。

---

## 验证循环（执行纪律 · 与第 8 条配套）

与 [behavior-rules.md](./behavior-rules.md) §4 Goal-Driven Execution 一致；任务级强制写法：

```
计划（已批准）→ 实施 → 验证 → [失败] 修复 → 重新验证 → … → 全部通过 → DONE
```

- **强成功标准**：可独立循环（「让测试/检查通过」），无需每轮问用户「这样可以吗？」  
- **弱成功标准**：仅口头确认、无命令输出 —— 不得标 DONE  

---

## 常见反模式

| 反模式 | 为什么错 | 对应纪律 |
|--------|---------|---------|
| 无验证命令输出就宣称 DONE | Hook/审查无法事后补证据 | 8 · Goal-Driven |
| 验证失败一次后仍标完成 | 未进入循环 | 8 |
| 主 Session 在无 `.forge/implementer-session.json` 时改 `src/` 等 | 绕过 implementer 隔离 | Iron Law 5 |
| 与 `.forge/spec-confirmed.json` / `plan-confirmed.json` 状态竞争写业务代码 | 绕过 HARD-GATE | Iron Law 3–4 |
| 在 Read/Grep 结果上再包一层无用抽象或重复穿透调用链 | 重复 context、易幻觉、违反最小 diff | 3 |
| 顺手改格式、注释、无关文件或「顺便重构」 | diff 不可追溯到请求 | 3、6 · Surgical |
| 计划外问题未经批准就修 | 范围蔓延 | 6 |
| 无先例仍自行发明需求 | 违反 Think Before Coding | 4 |

Agent 借口对照 → `core/skills/_shared/shortcuts-to-resist.md`（全局）+ `dev-builder/references/anti-rationalization.md`（构建专属）

**三类证据**：代码契约（test/tsc）≠ Skill 产出（skill-eval）≠ 门禁交付（forge-verify）。不可互相替代。

**可选（用户项目）**：Stop Hook 对照 `git diff` 审查分层 `CLAUDE.md` 是否过时 → [claude-md-stop-hook-comparison.md](./claude-md-stop-hook-comparison.md)（不替代本纪律或 `stop-gate`）。

---

## 在哪里写测试（框架仓库）

| 测试内容 | 位置 | 框架 |
|---------|------|------|
| 脚本逻辑（sync、install、dep-graph） | `scripts/__tests__/*.test.ts` | Vitest |
| Skill 规则守门 | `tests/skill-fixtures/*.yaml` + `pnpm forge-smoke` | 静态断言 |
| 适配器/文档/CI 一致性 | `scripts/forge-smoke/*.mjs` | Node smoke |
| Harness 端到端 | `test-demo/run-golden-path.mjs` | 集成脚本 |
| 示例应用（test-demo） | `test-demo/todo-cli/src/__tests__/` | Vitest |

**分工**：`pnpm test` = Vitest 单元测试；`pnpm forge-smoke` = 结构/同步/发版守门（见 `scripts/forge-smoke/README.md`）。

用户项目：按 DEV-PLAN 与项目既有测试命令；第 8 条使用**该项目**的最小验证集，不必照搬上表路径。

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
