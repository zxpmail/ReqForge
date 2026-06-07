# 反 AI 味清单（change-manager）

> 归档前读本文。不是为了"检查"，是为了**激活正确的变更管理模式**。
> 下面三段锚点覆盖了 change-manager 最常见的三种场景。

---

## 锚点一：Proposal 编写模式

> 模型的自然倾向是跳过 proposal 直接改代码。
> 下面展示正确的 propose 格式：RED（当前问题）+ GREEN（目标状态）+ 验收。

```markdown
## Proposal: add-dark-mode

**RED**: 当前用户只能在亮色模式下使用，夜间使用刺眼
**GREEN**: 用户可在亮/暗/跟随系统三种模式间切换，偏好持久化存储
**Verify By**: 切换暗模式 → 刷新页面 → 保持暗模式 → 切回亮模式

### IN (变更范围)
- src/components/ThemeToggle.tsx（新建）
- src/context/ThemeContext.tsx（新建）
- src/styles/globals.css（追加 dark 变量）

### OUT (不在本变更内)
- 自定义主题色编辑器（未来功能）
- 旧版浏览器降级方案
```

关键点：
- IN/OUT 边界决定了审查范围，不能模糊
- Verify By 必须是可测试的，不是"看起来正常"
- 列出具体文件路径，不是"相关文件"

---

## 锚点二：Verify 验证模式

> 模型的自然倾向是"看起来正常"就归档。
> 下面展示正确的 verify 格式：每个 acceptance criterion 对应一条测试证据。

```markdown
| Acceptance Criterion | Verification | Result |
|---------------------|--------------|--------|
| 暗模式持久化 | 切暗模式 → 刷新 → `<html>` class 为 dark | ✅ pass |
| 亮模式切换 | 切亮模式 → `<html>` class 为 light | ✅ pass |
| 跟随系统 | navigator 暗模式 → 自动切 → 切回亮 → 跟随 | ✅ pass |
| 回归：已有功能不受影响 | pnpm test | ✅ 26/26 pass |
```

关键点：
- 每条验收标准都有具体测试方法
- 必须有回归测试输出
- "看起来正常" 不是验收证据

---

## 锚点三：Archive 归档模式

> 模型的自然倾向是 archive 时忘了更新 Spec 和 CHANGELOG。
> 下面展示完整的 archive checklist。

```markdown
## Archive Checklist

- [ ] specs.md 的 Delta（ADDED/MODIFIED/REMOVED）已合并到 Product-Spec.md
- [ ] Product-Spec-CHANGELOG.md 已追加本次变更记录
- [ ] change 目录已移到 changes/archive/
- [ ] 如涉及回滚，回滚策略已文档化
```

关键点：
- archive = 数据合并，不是文件搬家
- CHANGELOG 不更新等于用户看不到变更记录

---

## 兜底检查

| 检查项 | 通过标准 |
|--------|----------|
| 跳过 propose | proposal.md 有明确的 IN/OUT |
| 边界蠕变 | 未超出 proposal 定义的 IN 范围 |
| 伪造 specs | specs.md 是增量 diff（ADDED/MODIFIED/REMOVED），非 Product-Spec.md 全文拷贝 |
| 重复劳动 | 已检查 changes/ 无同主题进行中的变更 |
| 验收敷衍 | verify.md 有具体测试输出，非"看起来正常" |
| 遗漏回滚 | archive 前已定义回滚步骤 |
| 悬空 archive | Product-Spec.md / CHANGELOG 已同步更新 |
