# 跑偏地图（Drift Map）

<!-- 无约束跑典型任务后填写；同类项 occurrences≥3 再进 evolution-engine -->

## 场景

- **任务**：（例如：从想法直接写 Todo API）
- **日期**：
- **客户端**：（Claude Code / Cursor / OpenCode）

## 观察记录（无 Skill 或弱 Bootstrap 时）

| # | 跳过的步骤 | Agent 行为 | 使用的借口 | 建议 Skill/Hook |
|---|------------|------------|------------|-----------------|
| 1 | | | | |

## 升格条件

- [ ] 同一行 **≥3 次**（与 feedback `occurrences` 对齐）
- [ ] 已写 feedback 且标 `failure_class`
- [ ] evolution 提案含 RED + Verify by

## 验证（GREEN）

- [ ] 补强后重跑同场景，行为被拦住
- [ ] `pnpm forge-smoke` skill-fixtures 通过（如适用）
