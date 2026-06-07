# dev-planner First Principles

> Plan 前读取。

[First Principles]
    **Verifiable Principle**: Each Phase must be compilable, runnable, and show results upon completion. No "write a bunch of code but nothing runs" Phases allowed. Each Phase should deliver a **minimum runnable subset** — a core path that works end-to-end, even if features are incomplete. It's better to have 3 features that run than 10 features that don't.

    **Dependency Order Principle**: Foundation first, building later. Infrastructure (project skeleton, database, routing) always comes before business features. When features have dependencies, the depended-upon item is built first.

    **Online-First Principle**: Rely on real-time information, not outdated memory.
    - Tech stack selection -> WebSearch to confirm framework latest stable version, known issues, recommended pairings
    - Critical dependencies -> WebSearch to confirm API compatibility, version numbers, breaking changes
    - Uncertain technical solutions -> search before deciding, don't make architectural decisions based on outdated memory

    **Appropriate Granularity Principle**: Phases that are too large can't be completed, too small have high management overhead. One Phase should correspond to one independently verifiable functional unit, typically 1-3 core deliverables.

    **Task Time Budget Principle**: Each Task within a Phase should be completable in ≤15 minutes of coding. If a Task would take longer, split it into smaller Tasks. Guidelines:
    - One page/component/feature per Task — do not group unrelated changes
    - Each Task has a single clear deliverable (a working test, a single API endpoint, one UI component)
    - Large Tasks accumulate risk: harder to review, harder to roll back, easier to drift from spec
    - When in doubt, split — small Tasks compose into complete Phases; oversized Tasks fragment into incomplete work

    **Explicit File Path Principle**: Each Phase must list the specific file paths to be created or modified. "Implement chat feature" is not a plan — "create src/components/views/chat-view.tsx and src/hooks/use-chat.ts" is a plan.

    **Primary Metric Principle** (autoresearch-style): Each Phase must declare exactly **one** falsifiable **Primary metric** line (e.g. `pnpm test --filter X` exit 0). dev-builder treats it as the Phase keep/discard anchor — do not change mid-Phase without user-approved replan. Acceptance Criteria may list multiple checks; Primary metric is the single decision number.

    **No Placeholder Principle**: Every word in the Plan must be specific enough that anyone picking up this Plan can start working immediately.
    - Not allowed: TBD, "to be filled", "to be determined", "implement later"
    - Not allowed: "similar to Task N" — repeat the specific content, don't reference
    - Not allowed: "add appropriate error handling" — specify what errors and how to handle them
    - Not allowed: "implement related features" — list specific feature names and behaviors
    - Each Task description must be complete enough for an engineer without project context to read and execute

**⚠️ 当前 Task 行动摘要（放在最后是因为注意力集中于此）**:
1. 读 Spec 提取功能，WebSearch 确认技术栈
2. 按依赖顺序排列 Phase，每 Phase 有 Primary Metric
3. 每个 Task ≤15 min + 显式文件路径，无占位符
4. 验证：每个 Phase 可编译可运行

**Transformer 注意力说明**：本文开头（Verifiable Principle、Dependency Order）利用 primacy bias，结尾（本摘要）利用 recency bias。中间的内容重复出现时会自动引起注意——模型是模式匹配系统，读到 Step 编号或具体命令时自然加权。
