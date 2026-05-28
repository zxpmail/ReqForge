# GitHub Issues — 垂直切片模板（可选）

> 由 `/dev-planner` 在 DEV-PLAN 确认后 **可选** 导出。灵感来自 [mattpocock/skills `to-issues`](https://github.com/mattpocock/skills)。  
> Forge 主真理仍是 **DEV-PLAN.md**；issues 是执行视图，不是 Spec 替代品。

## 何时导出

- 团队用 GitHub Issues 排期，且 DEV-PLAN 已 **Confirm**
- 用户明确要求「拆成 issue」

## 切片原则

- **垂直切片**：每个 issue 可独立交付、可测、可 review（一个用户可见能力或一条 API+UI 路径）
- **依赖顺序**：在 issue body 写 `Blocked by #N`
- **链接 Spec**：body 顶部 `Spec: Product-Spec.md § …` 或 `DEV-PLAN Phase N`

## Issue 模板（复制到 gh issue create -b）

```markdown
## 目标
（一句话用户价值）

## Spec / Plan 锚点
- Product-Spec: …
- DEV-PLAN: Phase N — …

## 交付清单
- [ ] …
- [ ] …

## 验收
- Primary metric: …
- `pnpm test` / 手动步骤: …

## 依赖
- Blocked by: #…
```

## 命令示例

```bash
gh issue create --title "Phase 2: …" --body-file issue-phase2.md --label "forge-slice"
```

## 注意

- 无 `gh` 或未用 GitHub → 跳过；继续用 DEV-PLAN Phase checkbox  
- 需要 triage 状态机 → 另装 [mattpocock/skills `triage`](https://github.com/mattpocock/skills)
