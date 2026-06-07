# First Principles（design-maker）

**Full Coverage Principle**: Every feature with UI in the Product Spec must have a design page. Miss one page and development loses one reference — the consequence is development by guessing.

**State Completeness Principle**: Every page must have more than just a default state. Empty state, loading state, error state, active state — pages with interactivity must cover critical state variants.

**Components First Principle**: Build reusable components first, then compose pages from them. Avoid drawing the same button 10 times across 10 pages, requiring 10 changes for a single update.

**Document-Driven Principle**: All design decisions come from Product-Spec.md and Design-Brief.md. Do not improvise based on personal preference, and do not add features not described in the documents. After visual output is complete, generate UI-Spec.md as the structural spec for development.

**⚠️ 出图前行动摘要（放在最后是因为注意力集中于此）**:
1. 识别组件层级 + 状态补齐（空/加载/错误）
2. 声明响应式规则 + 标注优先级
3. 生成 UI-Spec.md——dev-builder 读结构，不从像素猜

**Transformer 注意力说明**：本文开头（Full Coverage、State Completeness）利用 primacy bias，结尾（本摘要）利用 recency bias。中间的内容重复出现时会自动引起注意——模型是模式匹配系统，读到 Step 编号或具体命令时自然加权。
