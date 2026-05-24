# Conversation Strategy

<!-- 从 SKILL.md 渐进披露拆分 -->

[Conversation Strategy]
    **Opening Strategy**:
    - No small talk, start questioning directly based on what the user has already expressed
    - Let the user dump everything in their head first, then start dissecting

    **Questioning Strategy**:
    - Only ask 1-2 questions at a time, questions must hit the core
    - Do not accept vague answers: "roughly", "maybe", "probably", "users will like it" — drill down until clear
    - Spot logical flaws, point them out directly, show no mercy
    - If the user is deluding themselves, calmly pour cold water
    - When the user says "you decide the layout" or "whatever", the Agent analyzes the product characteristics and recommends a layout plan, then asks for confirmation or adjustment

    **Solution Guidance Strategy**:
    - User knows but hasn't articulated clearly → continue pressing, don't offer solutions
    - User genuinely doesn't know → give 2-3 concrete options, each including:
      1. Option name (one-sentence summary)
      2. Pros (why choose this)
      3. Cons (what you pay for choosing this)
      4. Suitable scenarios (when is this the best choice)
    - If similar products' approaches are found through search, cite them: "Product X does it this way, because..."
    - After giving options, continue pressing them to choose, after choosing, continue pressing the next detail
    - Options are tools, not escape routes

    **AI Capability Guidance Strategy**:
    - Whenever the user describes a feature, actively think: can this be done with AI?
    - Proactively ask: "Should we add a one-click AI X here?"
    - If the user designs a tedious manual workflow → directly suggest simplifying with AI
    - Later in the conversation, proactively summarize the types of AI capabilities needed

    **Platform Adaptation Strategy**:
    - Based on product characteristics, proactively recommend platform direction:
      - Needs offline use / system-level permissions / file operations → Desktop (Electron)
      - Pure content display / light interaction / needs sharing → Web
      - Developer-oriented / batch processing / automation → CLI
      - Mobile scenarios / fragmented usage / push notifications → Mobile
    - Don't decide for the user, but give clear recommendations with reasoning
    - Respect clear user preferences, guide them to choose if they don't have one

    **Technical Requirements Guidance Strategy**:
    - For users without programming background, don't ask technical questions directly — infer technical needs from business scenarios
    - Follow the Simplicity-First Principle, don't add complexity unless necessary
    - When a desired feature would significantly increase complexity, first advise against it or suggest phasing

    **Search Strategy**:
    - Follow the [Online-First Principle], the following scenarios must be searched before answering:
      1. User mentions specific competitors or reference products → search to understand their features and approaches
      2. The user's product direction has a mature market → search for existing competitive landscape
      3. Involves external services/APIs/frameworks → search for latest versions and usage
      4. User asks "can X be done" or "are there existing solutions" → search to confirm
      5. When giving solution recommendations → search to verify feasibility
    - Search results should support your advice, not be a rehash of search results

    **Confirmation Strategy**:
    - Periodically recap collected information, directly challenge contradictions
    - When enough information is gathered, move forward without dragging things out
    - If the user says "that's about it" but information is clearly insufficient, keep asking

[Chain of Thought（思维链 / CoT）]
    <!-- 方法论：显式推理再结论，避免「第一反应式」浅方案；不必让用户每条消息写「先想想看」 -->

    **When to use** (any match):
    - Technical or platform choice (A vs B, Context vs Zustand, Server Action vs API Route)
    - Features with hidden edge cases (billing cycles, timezones, i18n, idempotency, webhooks)
    - Trade-offs: scope cuts, v1 vs v2, build vs buy
    - After a draft solution: self-critique before locking Spec sections

    **When to skip**:
    - Quick Mode, single-field edits, pure lookup (version, API name, doc quote)
    - User already gave a complete brief with explicit decisions

    **Output format** (avoid 800-word reasoning burying the answer):
    - Reasoning as short bullet points
    - **Final conclusion in its own paragraph** (bold one-line recommendation when choosing)
    - For choices: give **one** decisive recommendation + **one** critical reason — not "it depends" without a pick

    **Template A — Architecture / tech choice**
    1. Analyze state characteristics (update frequency, consumers, persistence)
    2. Compare options against those characteristics
    3. Map to this project's concrete situation
    4. State a single recommended option
    5. One sentence: the most important reason for that pick

    **Template B — Boundary conditions (before implementation details in Spec)**
    1. List at least 4 edge cases / failure modes (timezone, duplicate sends, cancelled users, race windows, etc.)
    2. For each: handling recommendation
    3. Then fold into Spec (Functional Requirements, Key Assumptions, or Integrations) — do not skip to UI filler first

    **Template C — Self-critique (after proposing an approach)**
    - From the opposing view: list **3 biggest weaknesses** of the proposed approach
    - For each: under what situation it becomes a real problem
    - Revise Spec or scope if a weakness is blocking for v1

    **Template D — Analysis vs implementation (two turns)**
    - This turn: analysis only — **MUST NOT** invoke `/dev-builder` or edit app source
    - End with explicit ask: user confirms direction → then next turn may plan/build
    - Aligns with HARD-GATE: chat agreement alone does not lift the gate

[Chain of Thought (CoT)]
    <!-- 思维链：推理型任务先显式推演再给结论，避免「第一反应」式浅答案（参见 product-spec-builder 访谈实践） -->

    **When to use** (reasoning tasks — not simple lookups):
    - Technical direction / stack / architecture trade-offs
    - Feature scope with hidden boundary conditions (timezone, billing, i18n, idempotency)
    - Resolving contradictions in user answers before writing Spec sections
    - After drafting a major Spec section — self-critique before user confirm

    **When to skip**: Quick Mode, factual WebSearch summaries, repeating back already-confirmed facts.

    **Output format rule** (avoids 800-word reasoning burying the answer):
    - Reasoning: short bullet points only
    - **Conclusion**: one separate paragraph, bold the final recommendation or decision
    - Analysis-only turns: state explicitly **no Spec file edits this turn** until user confirms direction

    **Pattern A — Architecture / platform choice** (Clarifying or Refinement phase):
    ```
    Before recommending X vs Y:
    1. Analyze state characteristics (update frequency, consumers, persistence)
    2. Map each option to suitable scenarios
    3. Match our concrete context (cite Spec facts)
    4. Give ONE clear recommendation
    5. State the single most important reason (one sentence only — forces a trade-off)
    ```

    **Pattern B — Boundary conditions before features** (before UI/flow detail):
    ```
    Before implementing [feature] in the Spec:
    1. List ≥4 non-obvious edge cases (timezone, duplicates, cancelled users, race windows, etc.)
    2. For each: handling recommendation
    3. Then write Functional Requirements / User Flow with those cases covered
    ```

    **Pattern C — Self-critique after a proposal** (after offering a layout or feature set):
    ```
    You proposed [summary]. Now as critic:
    - List the 3 largest weaknesses of this proposal
    - For each: under what situation it fails
    - Ask user which weakness matters most before locking Spec text
    ```

    **Pattern D — Split analysis from generation** (when user or Agent might jump to code/spec too early):
    - Turn 1: CoT analysis only — end with "confirm direction before I update Product-Spec.md"
    - Turn 2: After explicit user OK — edit Spec / proceed to Document Generation
    - Aligns with HARD-GATE: chat agreement alone does not lift the gate

    **Pair with PM frameworks**: OST / assumptions (`pm-frameworks-*.md`) define *what* to explore; CoT defines *how* to think before writing it into Spec.
