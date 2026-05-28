# Evolution 提案 — 有预算的 Skill 编辑（单条）

> 用于 **Skill Optimization** 类 evolution 提案。对齐 SkillOpt **bounded edits** + Forge 人工 Confirm 门。

## 约束

- **最多 3 条**编辑，类型仅限：`add` | `delete` | `replace`
- 每条必须说明：**修复哪类失败**（可引用 feedback `failure_class`）
- held-out / **Verify by** 未通过 → 写入 `.forge/skills/<name>/eval/rejected-edits.json`，勿重复提案

## 编辑表（示例）

| # | op | target | change | fixes_failure |
|---|-----|--------|--------|---------------|
| 1 | add | `SKILL.md` § Workflow Step 2 | 先读 `.forge/security-guidance.md` 再改 auth 相关代码 | skill-defect: 漏读安全规则 |
| 2 | replace | `[Gotchas]` 第 3 条 | （旧句）→（新句，更短、带触发条件） | execution-lapse: Agent 忽略已有规则 |
| 3 | delete | `SKILL.md` 重复段落 X | 与 Step 4 重复，易与 hook 冲突 | skill-defect: 规则互相打架 |

## 验收三问（提案前自检）

1. 它修复了哪类失败？（有 feedback 或轨迹证据）
2. 会不会伤害已有能力？（对照 train cases / 近期 Phase）
3. 在 held-out 或 Verify by 上有没有提升？——答不了就先别 Confirm
