# Skill 行为 Fixture（Skill TDD · 静态层）

<!-- 与 evolution-engine 的 RED/GREEN 闭环配合：此处为静态探针，确保 SKILL 正文含关键约束 -->

## 用途

- **RED（设计期）**：先写 fixture，描述「无此约束时 Agent 会如何跑偏」
- **GREEN**：在 `core/skills/<name>/SKILL.md` 写入规则后，`pnpm forge-smoke` 的 `skill-fixtures` 项应通过
- **REFACTOR**：新增借口时同步更新 fixture 的 `expect_skill_contains`

## 目录

```
tests/skill-fixtures/<skill-name>/*.yaml
```

## YAML 字段

| 字段 | 说明 |
|------|------|
| `id` | 唯一 ID |
| `skill` | 对应 `core/skills/<skill-name>` |
| `description` | 场景说明 |
| `expect_skill_contains` | SKILL.md 必须包含的字符串列表 |
| `expect_reference_contains` | 可选，`references/*.md` 合并正文需包含的字符串 |

## 运行

```bash
pnpm forge-smoke   # 含 skill-fixtures.mjs
```
