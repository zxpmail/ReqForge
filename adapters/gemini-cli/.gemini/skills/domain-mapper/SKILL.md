<!-- forge: domain-mapper v1.0 -->
---
name: domain-mapper
description: Used when the user wants to research a domain, industry, market, technology, codebase, or competitor — turning scattered/unstructured information into a structured Markdown database (domain-map.md). Triggers on phrases like "帮我研究一下", "分析一下这个", "我不太熟悉这个领域", "拆一下这个行业/代码库".
version: 1.0.0
updated: 2026-06-08
requires: []
---

<!-- begin: task -->
[Task]
    Transform unstructured/sprawling domain knowledge into a structured Markdown database, independent of any product spec flow.

    **Core pipeline**: Scope definition → Domain Snapshot (domain-map.md) → optional Deep-Dive (competitor-analysis.md) → optional Social/Media Analysis (social-analysis.md) → Synthesis (update domain-map.md).

    **Depth levels**:
    - L1 Snapshot: 30-min pass, only domain-map.md output
    - L2 Standard: 1-2h, domain-map.md + competitor-analysis.md
    - L3 Deep: Half-day, full 5-step pipeline

    The output is a living document: timestamped, source-attributed, and designed to be revisited when the domain evolves.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Writing product requirements -> use /product-spec-builder instead
    - Fixing bugs -> use /bug-fixer instead
    - Code review -> use /code-review instead
    - General web search without structure -> use direct WebSearch or /deep-research instead

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    No required prerequisite files. This skill can always run from a blank project.

    - If domain-map.md already exists for the same domain, warn about staleness (check timestamp in file header) and ask whether to regenerate or append.
    - If Product-Spec.md exists, read it for context but do not modify it.

<!-- end: dependency-check -->
<!-- begin: first-principles -->
[First Principles]
    → `references/first-principles.md`

<!-- end: first-principles -->
<!-- begin: shared-discipline -->
[Shared Discipline]
    Karpathy 四原则 → `../_shared/karpathy-discipline.md`
    Source attribution required on every claim → see workflow.md §源标注

<!-- end: shared-discipline -->
<!-- begin: hard-gate -->
[HARD-GATE]
    Until `domain-map.md` is saved and the user confirms the snapshot:

    - MUST NOT proceed to Step 3 (Deep-Dive) or Step 4 (Social/Media)
    - MUST NOT modify Product-Spec.md, DEV-PLAN.md, or source code
    - MUST NOT treat "looks good in chat" as confirmation — user must confirm the saved file

<!-- end: hard-gate -->
<!-- begin: output-style -->
[Output Style]
    → 每个输出文件头部包含生成时间戳
    → 每一条关键信息附来源 URL（不可溯源标注 ⚠️）
    → 每步完成输出一个文件，不把所有信息挤在同一份报告里

<!-- end: output-style -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **domain-map.md** — 结构化领域数据库（所有深度级别）
    - **competitor-analysis.md** — 对比表 + 叙事差异分析（L2/L3）
    - **social-analysis.md** — 社媒内容分析 + 核心矛盾提取（L3 only）

<!-- end: output-artifacts -->
<!-- begin: file-structure -->
[File Structure]
    ```
    domain-mapper/
    ├── SKILL.md                       # 入口（本文件）
    ├── references/
    │   ├── first-principles.md        # 核心理念 + HBM 示例锚点
    │   └── workflow.md                # 完整 5 步工作流 + 失败模式
    └── templates/
        └── domain-map-template.md     # 通用输出模板
    ../_shared/
    ```

<!-- end: file-structure -->
<!-- begin: gotchas -->
[Gotchas]
    **域过宽陷阱**: "帮我研究科技行业" → 必须强制收窄（芯片 > 封装 > 设备，你关心哪一层？）
    **源不可靠**: WebSearch 未返回实质内容时，必须在输出的对应条目旁标注 ⚠️（来源不足，需人工补充）
    **老化地图**: domain-map.md 头部有生成时间戳，后续引用时若超过 30 天需提醒用户
    **竞品敏感数据**: 某些行业核心信息不在公开网页，技能必须在输出末尾列出"已知盲区"

<!-- end: gotchas -->
<!-- begin: triggers -->
[Triggers]
    The following phrases should route to this skill:
    - "帮我研究一下 X" / "帮我看看 X 行业"
    - "分析一下 X 这个赛道/领域/市场"
    - "我不太熟悉 X，帮我了解一下"
    - "拆一下 X 的竞争格局" / "X 有哪些玩家"
    - "研究一下 X 这个技术/产品/代码库"
    - "画一张 X 的行业地图"

<!-- end: triggers -->
<!-- begin: workflow -->
[Workflow]
    1. Run [Dependency Check]
    2. Read `references/first-principles.md`
    3. Read `references/workflow.md` — 前置深度选择 → 5 步工作流 → 失败模式
    4. 每步完成后暂停，让用户决定继续/转向/停止

<!-- end: workflow -->
<!-- begin: initialization -->
[Initialization]
    Execute [Workflow]

<!-- end: initialization -->
