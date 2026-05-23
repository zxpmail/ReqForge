# 设计交付五维自检（Design Self-Critique）

<!-- design-maker 全部页面完成后、输出 Completion Report 前执行。借鉴 open-design 五维 critique。 -->

[Design Self-Critique]

对**已产出稿**（MCP 设计文件）逐项打分：1=问题明显，3=可接受，5=优秀。任一维度 ≤2 须修订后再交付。

| 维度 | 问什么 |
|------|--------|
| **1. 层次与节奏** | 主次是否一眼可见？间距是否一致有系统？ |
| **2. 品牌一致** | 是否符合 Design-Brief 的情绪词与色温？ |
| **3. 信息密度** | 与 Brief 的密度方向一致？是否塞满或过空？ |
| **4. 状态完整** | 清单内页面是否覆盖 empty/loading/error/交互态？ |
| **5. 可开发性** | Token/组件是否可映射到代码？有无无法实现的装饰？ |

同时跑一遍 `design-brief-builder/references/anti-ai-slop-checklist.md`。

**输出**：在 Design Completion Report 附 `Self-critique: 5/5/4/5/4 — revised empty state on Dashboard`（示例）。
