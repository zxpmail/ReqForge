# 视觉方向预设（Visual Direction Presets）

<!-- 借鉴 open-design 五学派思路：先选方向，再填 Brief，减少模型随意发挥。非像素级 token，具体色值由设计工具/MCP 落地。 -->

[Visual Direction Presets]

用户无品牌、说不清风格时，提供 **5 选 1**（可微调）。选中后将对应关键词写入 Design-Brief 的 Mood / Color / Typography。

## 1 · Editorial Monocle（编辑/杂志）

- **Mood**：编辑感、留白、衬线标题、克制配色
- **Color**：中性底 + 单一强调色（墨黑/深红/海军蓝）
- **Density**：适中偏疏
- **References**：Monocle、NYT、Medium 长文
- **Avoid**：大面积渐变、玻璃拟态堆叠

## 2 · Modern Minimal（现代极简）

- **Mood**：干净、几何无衬线、高对比层级
- **Color**：白/浅灰底或纯深色底；品牌色单点强调
- **Density**：适中
- **References**：Linear、Vercel、Apple 营销页
- **Avoid**：装饰性插画泛滥、过多描边卡片

## 3 · Warm Soft（温暖柔和）

- **Mood**：圆角、暖灰/米色、友好插画或图标
- **Color**：暖中性色 + 柔和强调（珊瑚、橄榄、陶土）
- **Density**：适中偏疏
- **References**：Notion 营销、Airbnb 早期、Calm
- **Avoid**：冷灰科技风、过高信息密度

## 4 · Tech Utility（工具/开发者）

- **Mood**：深色优先、信息密度高、等宽/半等宽点缀
- **Color**：冷色深色底 + 青/绿/蓝功能色
- **Density**：紧凑
- **References**：GitHub、Raycast、VS Code
- **Avoid**：过度圆角糖果色、无关动效

## 5 · Brutalist Experimental（粗野/实验）

- **Mood**：大字号、强网格、高对比、非常规排版
- **Color**：黑白强对比或单一荧光强调
- **Density**：变化大（Hero 疏、数据区密）
- **References**：Brutalist 落地页、部分 Web3/文化站
- **Avoid**：默认 SaaS 蓝紫渐变模板

---

**Workflow**：问卷完成后若用户仍模糊 → 展示上表 5 项让用户选一 → 再进入 [Interview Dimension Checklist] 细化。

**Optional**：`reference_design_system: linear | stripe | notion` 等社区 Markdown 系统（见 [open-design-comparison.md](../../../docs/open-design-comparison.md)）— 仅作 Brief 文字引用，不 vendoring 全套库。
