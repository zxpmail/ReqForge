# Next Step Gate（Brief 完成后强制门禁）

**新用户不知道 Brief 之后还有 mockup。** 本门禁在 `Design-Brief.md` 写入后执行——但 **仅适用于有 UI 的产品**（见 `references/surface-routing.md`）。

## Step 0：Surface 判定（先于一切）

**必读** `references/surface-routing.md`。

| Spec 类别 | 本 Gate |
|-----------|---------|
| **C · 无 UI**（API/库/无界面 CLI） | **不执行**；写 `design-next-step.json`（`reason: no-ui-product`）→ 推荐 `/dev-planner` |
| **B · 轻交互 CLI** | **简化 Gate**（无 mockup 选项，见 surface-routing.md） |
| **A · 有 UI** | 执行下方完整 Gate |

若 Session 从未产生 `Design-Brief.md`（C 类已跳过 Brief），**不要**运行本文件。

## 何时触发（仅 A/B 类且 Brief 已落盘）

- `Design-Brief.md` 已保存且用户已确认方向
- **禁止**在仅完成访谈、未落盘 Brief 时宣称「设计阶段完成」

## A 类：Agent 必须做的事（按序）

### 1. 用固定话术说明 Brief ≠ 设计稿

向用户说明（可略改措辞，四项信息不可缺）：

> **Design-Brief.md 是文字规格，不是界面稿。**  
> 有 UI 的产品下一步通常应做 **可视化 mockup**；mockup 确认后会冻结 **DESIGN.md**（设计 token，兼容 [Google design.md](https://github.com/google-labs-code/design.md)），供开发直接引用。  
> 否则开发容易「按 Spec 猜 UI」。  
> 请三选一（必须明确回复，不能默认跳过）：

### 2. 三选一（用 AskQuestion 或等价结构化选项）

| 选项 | 用户选 | Agent 动作 |
|------|--------|------------|
| **A · 出 mockup（推荐）** | `design-maker` | 立即 invoke `/design-maker`；无 Figma/Pencil MCP 时说明连接方式或协助跳过 |
| **B · 跳过 mockup** | `skip-mockup` | 写入 `.forge/design-next-step.json`（见下）；说明后续 `/dev-builder` 将仅依 Brief 编码，UI 偏差风险自负 |
| **C · 先写开发计划** | `dev-planner-first` | 写入 `.forge/design-next-step.json`；推荐 `/dev-planner`，Plan 确认后再 `/design-maker` 或 `/dev-builder` |

**默认不得替用户选 B。** 用户未回复前，Session 状态为 **BLOCKED（等待设计下一步决策）**。

### 3. 写入 `.forge/design-next-step.json`

用户选 B 或 C 时写入（选 A 且即将进入 design-maker 时可写 `pending-design-maker`）：

```json
{
  "decided_at": "ISO8601",
  "choice": "design-maker | skip-mockup | dev-planner-first",
  "decided_by": "user",
  "brief_path": "Design-Brief.md",
  "surface_class": "A",
  "note": "用户原话或简短原因"
}
```

C 类自动跳过（无 Brief）时：

```json
{
  "choice": "skip-mockup",
  "decided_by": "agent",
  "reason": "no-ui-product",
  "surface_class": "C"
}
```

选 A 且 `/design-maker` 已成功启动后，更新为：

```json
{
  "choice": "design-maker",
  "mockup_status": "in_progress | complete",
  "design_tool": "figma | pencil | other"
}
```

### 4. 在 `Design-Brief.md` 末尾写入「下一步决策」节

模板见 `templates/design-brief-template.md` § Next Step Decision。若用户尚未决策，该节写 `[PENDING — 等待用户三选一]`。

### 5. Session 结束语（Status 协议）

Brief + Gate 完成后，回复末尾**必须**包含：

```
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Next Step: /design-maker（推荐）| 用户已选 skip → /dev-planner 或 /dev-builder | BLOCKED 等待用户三选一
```

C 类跳过 Gate 时：

```
Status: DONE
Next Step: /dev-planner（无 UI 产品，已跳过 Design Brief 与 mockup）
```

## B 类：简化 Gate（轻交互 CLI）

仅两选：

| 选项 | 动作 |
|------|------|
| **跳过 mockup**（默认） | `skip-mockup` → `/dev-planner` |
| **先 dev-planner** | `dev-planner-first` |

**不提供**「出 mockup」选项。

## 与 design-maker 的关系

- `/design-maker` 仍为 **Manual Skill**，且 **仅 A 类（有 UI）** 默认推荐。
- 用户说「ok / 继续 / 默认」且上下文是 **A 类 Brief 刚完成** → **解释为选 A**，invoke `/design-maker`。
- **C 类**用户说「继续」→ **解释为 `/dev-planner`**，不要 invoke design-maker。

## 反模式（禁止）

- ❌ 对 **无 UI 产品** 仍推 `/design-maker` 或完整 Design Brief 访谈  
- ❌ Brief 写完只说「如需 mockup 可调用 design-maker」——太弱，新用户会漏（**A 类**）  
- ❌ 假设「已有代码 = 不需要 mockup」—— brownfield 仍应问是否补稿（**A 类**）  
- ❌ 未写入 `design-next-step.json` 就 skip——下游无法路由
