---
name: design-md-template
description: DESIGN.md 输出模板。mockup 确认后由 design-maker 从 Design-Brief + 设计工具 token 冻结生成，供 dev-builder 与 designmd lint 使用。格式兼容 @google/design.md alpha spec。
---

# DESIGN.md 输出模板

**文件名**：项目根目录 `DESIGN.md`（全大写，与 OpenSpec 的 `changes/<name>/design.md` 区分）

**生成时机**：design-maker Verification Phase Step 3e，在 UI-Spec.md 之后。

**数据来源**：
1. `Design-Brief.md` — 方向、参照物、反 slop、Do/Don't 意图
2. 设计工具 MCP — 已落地的精确 token 值（颜色 hex、字号、间距、圆角）
3. 禁止从 Brief 臆造 hex；Brief 只写方向，数值必须来自 mockup

---

## 模板结构

```markdown
---
version: alpha
name: <产品名>
description: <一句话视觉身份>
colors:
  <token-name>: "<hex 或 oklch>"
typography:
  <token-name>:
    fontFamily: <string>
    fontSize: <dimension>
    fontWeight: <number | string>
    lineHeight: <dimension | number>
rounded:
  sm: <dimension>
  md: <dimension>
spacing:
  sm: <dimension>
  md: <dimension>
components:
  button-primary:
    backgroundColor: "{colors.<ref>}"
    textColor: "{colors.<ref>}"
    rounded: "{rounded.sm}"
    padding: <dimension>
  button-primary-hover:
    backgroundColor: "{colors.<ref>}"
---

## Overview

<从 Brief 的 Mood Keywords + Reference Products + Success look 合成 2–4 段 prose。
用具体参照物锚定（「像 Linear 的信息密度」），不用空泛形容词。>

## Colors

<每色一段：token 名、hex、在本产品中的角色。Brief 里的「方向」在此落地为命名色。>

- **Primary ({colors.primary})**: ...
- **Secondary ({colors.secondary})**: ...

## Typography

<字体性格、层级关系、中英文策略。>

## Layout

<信息密度、栅格、边距哲学。对齐 Brief § Information Density。>

## Elevation & Depth

<阴影层级或「无阴影/扁平」策略。>

## Shapes

<圆角尺度、边框用法。>

## Components

<核心组件如何组合 token；hover/active 变体说明。>

## Do's and Don'ts

<从 Design-Brief § Anti-Slop Review + Brief 参照物隐含约束提炼。
Google PHILOSOPHY：具体参照 +  intentional don'ts 是 sweet spot。>
```

---

## 命名约定

| Token 类型 | 建议命名 | 说明 |
|-----------|---------|------|
| 背景 | `background`, `surface`, `neutral` | 与 Brief theme 一致 |
| 文本 | `primary`, `secondary`, `muted` | 语义化，非 `#gray-500` |
| 品牌/交互 | `accent`, `tertiary`, `brand` | 对齐 Brief accent 方向 |
| 语义 | `success`, `warning`, `error` | 若有状态色 |

组件 key 用 kebab-case：`button-primary`, `input-default`, `nav-item-active`。

---

## 校验（推荐）

```bash
npx -p @google/design.md designmd lint DESIGN.md
```

Windows/PowerShell 必须用 `designmd` 别名（见 Google README）。exit 0 再进入 dev-builder。

可选导出 Tailwind v4：

```bash
npx -p @google/design.md designmd export --format css-tailwind DESIGN.md > src/theme.css
```

---

## 与兄弟文档的关系

| 文档 | 职责 |
|------|------|
| `Design-Brief.md` | 方向与访谈锁定（无 hex） |
| `DESIGN.md` | 冻结 token + rationale（本模板） |
| `UI-Spec.md` | 页面结构、组件清单、验收标准 |
| `changes/<name>/design.md` | 单次变更技术/UI 方案（OpenSpec） |

dev-builder 读样式优先级：`DESIGN.md` > 设计工具 MCP > `Design-Brief.md`。
