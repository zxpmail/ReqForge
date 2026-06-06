# Requirements Dimension & Information Sufficiency

<!-- 从 SKILL.md 渐进披露拆分；主流程见 ../SKILL.md -->

[Requirements Dimension Checklist]
    During the conversation, information from the following dimensions must be collected (not necessarily in order, follow the natural flow of conversation):

    **Must Collect** (without these, the Product Spec is worthless):
    - Product positioning: What is this? What problem does it solve? Why you?
    - Target users: Who will use it? Why? Will they die without it?
    - Core features: What features are essential? Which ones, if removed, make the product invalid?
    - User flow: How do users use it? The complete path from opening to task completion?
    - AI capability needs: Which features need AI? What type of AI capability?
    - Product type: Is this a Web app, desktop app, CLI tool, or mobile app?

    **Try to Collect** (with these, the Product Spec can actually be implemented):
    - Overall layout: Agent analyzes suitable layout based on product type and functional requirements, recommends to the user and confirms
    - Area content: What content goes in each area, what functionality does it carry
    - Control specifications: Primary input/output methods and interaction elements
    - Input/Output: What does the user input? What does the system output? What format?
    - Use cases: 3-5 specific scenarios, the more specific the better
    - AI enhancement points: Where could "one-click AI optimization" or "AI smart recommendation" be added?
    - Technical complexity: Does the user need to log in? Where is data stored? Is a server needed?

    **Optional Collection** (icing on the cake):
    - Technical preferences: Are there specific technical requirements?
    - Reference products: Any existing products to learn from? What to copy, what not to copy?
    - Priorities: What goes in phase one, what goes in phase two?

    **Optional PM frameworks** (see `references/pm-frameworks-readme.md` — adapted from pm-skills MIT):
    - Value proposition (6-part JTBD): Who / Why / Before / How / After / Alternatives
    - Desired outcome & North Star metric (feeds DEV-PLAN Primary metric later)
    - Top 3–5 risky assumptions + how to validate before or during v1
    - Competitive landscape (5 competitors + differentiation) — facts via WebSearch

[Information Sufficiency Criteria]
    A Product Spec can be generated when the following conditions are met:

    **Must Satisfy**:
    - [x] Product positioning is clear (can explain what this is in one plain sentence)
    - [x] Target users are defined (know who it's for, why they'd use it)
    - [x] Core features are defined (can articulate what features the product must have and why)
    - [x] User flow is clear (at least one complete path from start to finish)
    - [x] AI capability needs are clear (know which features need AI and what type of AI)
    - [x] Product type is determined (Web / Desktop / CLI / Mobile)

    **Try to Satisfy**:
    - [x] Overall layout direction exists (rough structure is understood)
    - [x] Basic control specifications are defined (primary input/output methods are clear)

    If "Must Satisfy" conditions are not met, continue questioning — don't force-generate a garbage document.
    If "Try to Satisfy" conditions are not met, generation is possible but mark items as [TBD].
