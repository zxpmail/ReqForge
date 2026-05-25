# ReqForge 与 Founder's Playbook 对照

> 参考：[The Founder's Playbook: Building an AI-Native Startup](https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/69fe2a55b93bb0732b1fe33c_The-Founders-Playbook-%2005062026_v3%20(1).pdf)（Anthropic，2026-05）  
> 与 [karpathy-skills-comparison.md](./karpathy-skills-comparison.md)、[multica-comparison.md](./multica-comparison.md)（待补）互补。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **Founder's Playbook** | AI 原生创业四阶段（Idea→MVP→Launch→Scale）、验证先于构建、创始人编排 Agent |
| **ReqForge** | 在 **Claude Code / Cursor / OpenCode** 路径上把 Spec→Plan→Build→Review→Release 做成可执行 Harness |

Playbook 管 **商业阶段与何时用 Chat/Cowork/Code**；ReqForge 管 **写对产品代码前的工程纪律与机器门**。

---

## 四阶段 ↔ Skill 映射

| Playbook 阶段 | 退出标准（摘要） | ReqForge Skill | 落地状态 |
|---------------|------------------|----------------|----------|
| **Idea** | 问题真实、方案对准验证后的问题、有足够定性证据再构建 | `/product-spec-builder` | ✅ `§ Idea Stage Exit Criteria` + **Idea Validation Gate**（PreToolUse） |
| **MVP** | PMF 证据；架构/范围文档；防 scope creep | `/dev-planner` → `/dev-builder` | ✅ DEV-PLAN `## MVP Scope`；dev-builder 读范围 + 修订标准 |
| **Launch** | 可重复增长、生产加固、运营系统化 | `/release-builder` + `/code-review` | ⚠️ 部分（发布清单/审查）；GTM/合规 OS 不在范围 |
| **Scale** | 组织成熟、护城河 | — | ❌ 超出 Harness 范围 |

---

## 机器门链（更新后）

```
Product-Spec.md
  → § Idea Stage Exit Criteria（三问填满）
  → .forge/spec-confirmed.json
  → DEV-PLAN.md（含 MVP Scope）
  → .forge/plan-confirmed.json
  → .forge/implementer-session.json
  → 应用代码 Write/Edit
```

实现：`scripts/hooks/spec-before-code-gate.mjs`

---

## Playbook 主张 ↔ ReqForge 落点

| Playbook | ReqForge |
|----------|----------|
| 别把构建当验证 | Idea 三门禁 + product-spec 魔鬼代言人步骤 |
| MVP「刻意不做什么」 | DEV-PLAN `Out of scope` + `Scope amendment criteria` |
| CLAUDE.md 会话末更新决策 | dev-builder Session lifecycle → `memory/decisions-log.md` |
| 指标先于首个用户 | Spec `Success Metrics`（已有）；release-builder 指标门 — 待加强 |
| 发布前安全审查 | code-review / release-builder — 待加强 Security Gate 节 |
| Chat / Cowork / Code 分工 | `.forge/quickref.md` Claude 表面指南 |

---

## 刻意不做（Out of scope for ReqForge）

- Launch/Scale 的运营自动化、GTM、SOC2 合规工作流（Cowork 域）
- 客户发现 CRM、访谈排期自动化（Multica / Cowork）
- 替代创始人做商业判断 — Harness 只强制 **证据写进 Spec/Plan**

---

## 参考

- [product-spec-template.md](../skills/product-spec-builder/templates/product-spec-template.md) — Idea Stage Exit Criteria
- [dev-plan-template.md](../skills/dev-planner/templates/dev-plan-template.md) — MVP Scope
- [session-execution-discipline.md](./session-execution-discipline.md) — 验证循环
