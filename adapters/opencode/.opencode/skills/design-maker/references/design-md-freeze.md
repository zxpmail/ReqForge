# DESIGN.md 冻结流程（Design Token Freeze）

mockup 验收通过后，将 **方向（Brief）** 与 **数值（设计工具）** 合并为根目录 `DESIGN.md`。完整模板 → `templates/design-md-template.md`。

## 何时执行

- design-maker **Verification Phase Step 3e**（UI-Spec.md 之后、完成报告之前）
- **跳过 mockup** 时不生成（dev-builder 继续用 Design-Brief.md）
- **Multi-Alternative Mode**：用户选定方案后，仅为**胜出方案**生成一份 DESIGN.md

## 输入

| 来源 | 读取内容 |
|------|---------|
| `Design-Brief.md` | Mood Keywords、Reference Products、Negative References、Color/Typography/Interaction 方向、Anti-Slop、Key Page Visual Notes |
| 设计工具 MCP | 全局 token：色板、字号阶梯、spacing scale、radius、核心组件样式 |
| `.forge/design-maker/00-tokens-done.md` | 设计阶段记录的 token 快照（若 MCP 不可用时的 fallback） |

## 转换规则

### 1. Overview（ prose 优先）

- 开头用 Brief 的 **Success look** 或最具体的 Reference Product 作锚点
- 写入 Mood Keywords 各一句释义（非罗列形容词）
- 若 Brief 有 Visual Direction Preset，注明 preset 名及偏离点
- **禁止**复制 Brief 表格 verbatim；要写成连贯叙事

### 2. Colors

- 从设计工具读取**实际 hex**（或 oklch），写入 YAML `colors:`
- prose 节解释每色角色；引用 `{colors.token}` 语法
- Brief 的「蓝紫调」→ 命名如 `brand` / `accent`，并在 prose 说明与 Brief 方向一致

### 3. Typography / Layout / Shapes

- 对齐 Brief § Typography Direction、Information Density
- spacing / rounded 数值来自设计工具，勿凭感觉填

### 4. Components

- 至少覆盖：`button-primary`（+ hover）、`input-default`、`nav-item`（+ active）
- 属性值优先用 `{colors.*}` / `{rounded.*}` 引用，减少硬编码重复
- 与 UI-Spec.md 中的 Reusable component list 交叉核对

### 5. Do's and Don'ts

- 逐条迁移 `Design-Brief.md` § Anti-Slop Review
- 从 Negative References 提炼 **Don't**
- 从 Reference Products「Liked Aspects」提炼 **Do**
- 每条须可执行（「不要用全屏渐变 hero」✓；「要好看」✗）

## 输出

1. 写入项目根 `DESIGN.md`
2. 运行 lint（若 CLI 可用）：

```bash
npx -p @google/design.md designmd lint DESIGN.md
```

3. findings 含 **error** → 修复 YAML 断链或结构问题后再交付
4. 在完成报告中注明：DESIGN.md 路径、lint 摘要（errors/warnings）

## 常见错误

| 错误 | 修复 |
|------|------|
| hex 来自 Brief 臆造 | 回设计工具读值，或读 `00-tokens-done.md` |
| prose 只有 token 列表 | Overview/Colors 须有「为什么」叙事 |
| 与 UI-Spec 组件名不一致 | 统一命名后再写 components 块 |
| 混淆 `design.md` | 变更级方案在 `changes/<name>/design.md`；全局视觉身份只用根目录 `DESIGN.md` |

## 与 dev-builder 交接

完成报告中追加：

> `DESIGN.md` 已冻结。dev-builder 实现 UI 时优先读此文件；可用 `designmd export` 生成 Tailwind theme。
