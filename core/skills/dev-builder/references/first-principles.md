# dev-builder First Principles

> 编码前读取本文。遇阻力时另读 `anti-rationalization.md`。

**Phase 1 放下骨架（0-to-1 项目的天理定锚）**:
    Phase 1 不是"写第一个功能"——它是给整个项目放骨架。
    骨架 = 领域模型、核心类型定义、数据流接口、Validator 模式、错误处理公约。
    **后续所有 Phase 的代码都是从这个骨架自然生长出来的。**
    如果 Phase 1 骨架没放好，后续 Phase 每个都在猜"这个项目的代码应该长什么样"。
    骨架放好了，模型看到 Phase 2 的 Task 时，"哦，这个项目的 Entity 是这样组织的"，自然续写下去。
    **所以 Phase 1 的核心交付不是"功能可用"，是"结构清晰"。**

**TDD First (RED-GREEN-REFACTOR)**: Tests before functional code. Non-negotiable — no "code first, tests later."

**Modification Discipline**: Assess impact before every change; regression-validate after.

**Blast-Radar**: If `.forge/graph.json` exists → `pnpm dep-graph affected|risk <file>` before edits; pass `affected_files` to code-reviewer.

**Glue Code First**: (1) framework/SDK (2) maintained OSS (3) AI boilerplate — custom code only for business logic/glue. WebSearch before reinventing.

**Tool AI-fication Priority**: CLI > MCP > Skill wrapper > GUI. GUI-only ops → CLI wrapper first.

**Substitute, Don't Mock**: Real substitutes (H2, in-memory queue, local FS) over hardcoded mocks.

**Online-First**: Context7 when installed, else WebSearch — see `development-strategies.md` Library Docs Strategy.

**Verification Is Evidence**: DONE requires verification command + output in the **same message**. No "tested earlier."

**Post-Verification Gate**: After Phase four-step pass → `pnpm forge-verify --baseline compare`; update `.forge/dev-map.md`.

**Spec/Plan Read-Only**: Do not edit Product-Spec.md / DEV-PLAN.md to excuse drift → `/change-manager` or replan.

**Tech Stack Awareness**: 编码前先读 `.forge/dev-map.md` 的"技术栈"节。根据声明的语言选择编译、测试、lint 命令和代码规范惯例。
**Code Standards**: 根据 dev-map 声明的语言采用该语言社区公认的编码规范（命名、包结构、错误处理、测试）。如有特殊约定，写在 dev-map.md 的「注意事项」节。

**Task Micro-Cycle (≤10 min)**: After each Task RED/GREEN/REFACTOR → targeted test/lint + record pass/fail before code-reviewer.

**File Slimming**: 单文件 ≤300 行。编码前先在计划里按功能拆成小文件，不写大了再返工拆分。只生成当前 Task 需要的代码，不预写"未来可能需要"的。

**Simplification Marker**: 当显式选择了一个比"稳妥方案"更简化的实现时（例如用 Map 替代 Cache 类、一行替代完整类、YAGNI 跳过某个功能），在代码旁加 `// NOTE: <简化了什么>，<什么时候需要升级>` 注释。示例：`// NOTE: 用 Map 替代 Cache 类，当需要 TTL 或过期策略时换 class`。好处是让简化决策可追溯、可复盘、可决定何时承担升级成本。改动理由应同时写入 commit message 的主体而非仅依赖行内注释。

**Build Speed (Inner Loop)**: Full build + verify chain under 1 minute. If it takes longer, the Task is too coarse — split it. Fast feedback is the agent's verification loop; without it the agent works blind.

**AI Only for Judgment Tasks**: Loops/conditions/arithmetic → plain code.

**Token Budget Awareness**: Low context → suggest `/clear` + checkpoint commit.

**Sub-Agent Isolation (MANDATORY)**: Per Task, implementer sub-agent only for app `Write`/`Edit` — see `sub-agent-isolation.md`.

**⚠️ 当前 Task 行动摘要（放在最后是因为注意力集中于此）**:
1. 读 Difficulty（🔴 放慢/🟢 快速）+ 读 Spec + UI-Spec.md（如有）
2. **YAGNI 检查**（🔴 高难度 Phase 必做，🟢 低难度 Phase 可选）：读当前 Task 描述，自问"这段代码真的需要存在吗？项目已有依赖或自研库能解决吗？"如需跳过简化，在代码旁加 `// NOTE: <跳过理由>`。
3. 感知天理——扫一眼已有代码风格
4. RED（先写测试）→ GREEN（最小实现）→ REFACTOR
5. 生成后自审 + Micro-cycle verify（≤10 min）
6. **Phase 完成 → 读 gc-audit-routing.md 决策表 → 按影响范围执行审计**
7. 投递 code-review → 通过后 commit + 善刀而藏之

**Transformer 注意力说明**：本文开头（放下骨架、TDD）利用 primacy bias，结尾（本摘要）利用 recency bias。中间的内容重复出现时会自动引起注意——模型是模式匹配系统，读到 Step 编号或具体命令时自然加权。
