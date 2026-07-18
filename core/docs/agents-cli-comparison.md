# vs google/agents-cli

> 生成：2026-07-18 · 来源：[google/agents-cli](https://github.com/google/agents-cli/)

## 一句话

**agents-cli** = 给 coding agent 的「ADK 智能体上云」CLI + Skills。  
**ReqForge** = 「想法 → 可交付产品」Harness。同构：Skills + 可重复动词；不同域。

## 已吸收（本仓库）

| 点 | 落点 |
|----|------|
| Quality Flywheel：compare / analyze | `pnpm skill-eval compare|analyze` · `scripts/skill-eval-flywheel.ts` |
| Shortcuts to Resist | `core/skills/_shared/shortcuts-to-resist.md` |
| 阶段入口重读 Skill | `forge-bootstrap` Iron Law 10 |
| 代码契约 ≠ 行为/Skill 评测 ≠ 门禁 | quickref + skill-eval.md「三类证据」 |

## 明确不抄

- GCP / Agent Runtime / Trace / Gemini Enterprise
- Always-active 巨型 workflow Skill（与 Forge dispatch 冲突）
- GEPA 自动调 prompt（贵、慢、需显式授权）

## 相关

- [skill-eval.md](./skill-eval.md)
- [shortcuts-to-resist.md](../skills/_shared/shortcuts-to-resist.md)
