# ReqForge 与 Matt Pocock Skills 对照

> 参考：[mattpocock/skills](https://github.com/mattpocock/skills)（Skills For Real Engineers）· 本地路径示例 `E:\skills-main`  
> 与 [superpowers-comparison.md](./superpowers-comparison.md)、[skill-evolution-comparison.md](./skill-evolution-comparison.md) 互补。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **Matt Pocock Skills** | 小、可拼装、**日常工程**（grill、TDD、diagnose、triage、架构保健） |
| **ReqForge** | **产品交付 Harness**（Spec → Plan → Build → Review → Release → 进化）+ 机器门 |

Matt 反对全流程托管（GSD/BMAD/Spec-Kit）；Forge ** deliberately 做全流程 + 硬门**。二者 **并行安装**，不合并仓库。

---

## 能力映射

| Matt Skill | Forge 对应 | v1.34+ 落点 |
|------------|------------|-------------|
| `grill-me` / `grill-with-docs` | `product-spec-builder` | **[Light Grill Mode](./../skills/product-spec-builder/references/light-grill-mode.md)** — 对齐不产出完整 Spec |
| `tdd` | `dev-builder` Task 微循环 | 已有 RED-GREEN-REFACTOR；Matt 的 `tests.md` 可作团队参考 |
| `diagnose` | `bug-fixer` | Forge 更厚 + 与 code-review 联动 |
| `to-prd` | `product-spec-builder` | Forge 结构化访谈 + 确认门 |
| `to-issues` | `dev-planner` | **[github-issues-slices-template.md](../templates/github-issues-slices-template.md)**（可选导出） |
| `triage` | — | **不做** — Forge 用 DEV-PLAN Phase + `changes/`；GitHub 用户可另装 Matt 包 |
| `improve-codebase-architecture` | — | **[architecture-health-pass.md](./../skills/dev-planner/references/architecture-health-pass.md)**（可选） |
| `zoom-out` | dev-map、`dep-graph` | **[zoom-out-pass.md](./../skills/dev-builder/references/zoom-out-pass.md)** |
| `prototype` | `design-maker` | Matt 偏可抛原型；Forge 偏正式设计链 — **不合并** |
| `caveman` / `handoff` | session 纪律、`memory/` | **不内置** — 可选另装 Matt productivity 包 |
| `write-a-skill` | `skill-builder` + `skill-eval` | Forge 更规范 |

---

## 刻意不做

- 整包 fork / 替换 Forge 13 Skill
- 绑定 GitHub Issues 为唯一 backlog（Forge 仍以 Spec/Plan 为真理）
- 复制 `setup-matt-pocock-skills` 的 issue tracker 脚手架（与 `.forge/*` 分工不同）

---

## 推荐使用

1. **用户项目**：`pnpm forge-install` 管交付；需要 issue triage / caveman 时 **`npx skills add mattpocock/skills`** 单独装。  
2. **Light Grill**：计划未定型、还不要 Spec — `/product-spec-builder` 或说「grill me」。  
3. **架构保健**：每 1–2 周或泥球感明显时 — 见 architecture-health-pass（不替代 code-review）。

---

## 参考

- [light-grill-mode.md](../skills/product-spec-builder/references/light-grill-mode.md)
- [zoom-out-pass.md](../skills/dev-builder/references/zoom-out-pass.md)
- [architecture-health-pass.md](../skills/dev-planner/references/architecture-health-pass.md)
- [github-issues-slices-template.md](../templates/github-issues-slices-template.md)
