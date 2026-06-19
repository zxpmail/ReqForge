# Workflow (0-to-1 Mode)

<!-- 从 SKILL.md 渐进披露拆分 -->

[Workflow (0-to-1 Mode)]

    [Optional: Product Discovery Phase]
        Goal: When the idea is broad, structure discovery before feature/UI detail (pm-skills-inspired, MIT).

        **When to run**: User has no clear outcome, asks for brainstorm/discovery, or jumps straight to features without problem clarity.
        **When to skip**: Quick Mode, complete brief already provided, or user says proceed to Spec directly.

        Step 0: Choose framework
            Read `references/pm-frameworks-readme.md`.
            Typical path: OST (`pm-frameworks-ost.md`) → assumptions (`pm-frameworks-assumptions.md`) → value prop (`pm-frameworks-value-proposition.md`).
            Competitive scan (`pm-frameworks-competitive.md`) pairs with Exploration WebSearch.

        Step 0b: Summarize for Spec
            Capture outcome, top opportunities, top assumptions, and differentiation bullets for later Document Generation sections (Value Proposition, Success Metrics, Competitive Landscape, Key Assumptions).

        Step 0c: Devil's advocate (recommended before build)
            Ask Claude to argue **against** the hypothesis and surface disconfirming evidence (failed competitors, structural obstacles, behavior that contradicts the idea).
            Capture strongest counterarguments in **Idea Stage Exit Criteria §3** (`Disconfirming evidence considered`).
            Do not treat a prototype as validation — user conversations are the evidence (Founder's Playbook).

        **HARD-GATE unchanged**: Discovery does not replace written Product-Spec.md + explicit user confirm.

    [Requirements Exploration Phase]
        Goal: Get the user to pour out everything in their head

        Step 1: Catch the user
            Based on what the user has already expressed, first WebSearch for related competitors and market information
            Structure findings with `references/pm-frameworks-competitive.md` when writing Competitive Landscape later
            Then start questioning directly — don't repeatedly ask "what do you want to build"
            If similar products are found, tell the user directly: "There are already X and Y doing similar things. How is yours different?"

        Step 2: Questioning
            Target vague, contradictory, or self-delusional points, question them directly
            1-2 questions at a time, make them count
            Simultaneously think about which features could be AI-enhanced
            When involving technology/industry/competitors, WebSearch before speaking

        Step 3: Periodic confirmation
            Recap understanding, confirm no deviation
            Correct issues on the spot

    [Clarifying Questions Phase]
        Goal: Before diving into details, resolve ambiguities and edge cases that could cause rework later. This phase prevents "we built what you said but that's not what you meant."

        Step 1: Ambiguity scan
            Review everything gathered so far, identify unclear items:
            - Vague scope: "support multiple users" — how many? Concurrent? With roles?
            - Unstated assumptions: "users can share" — share what? Public link? Within team?
            - Missing boundaries: "works offline" — fully offline or cache + sync?
            - Edge cases: What happens when a required external service is down? What about empty states?
            - Implicit defaults: "simple interface" — simple for whom? Power user or complete beginner?

        Step 2: Socratic challenge round
            Before moving to detailed requirements, challenge the user's assumptions with targeted Socratic questions:

            **Why this approach?**
            - "Why solve it this way instead of [alternative approach]?"
            - "Is this feature solving a real user need, or is it what you think users want?"
            - "If this feature didn't exist, would the product still work? If yes, should we cut it from v1?"

            **Why now?**
            - "Why is this the right time to build this? What changed?"
            - "Is there a simpler version that could validate demand first?"
            - "What's the minimum version of this feature that delivers 80% of the value?"

            **What if wrong?**
            - "What assumptions are we making that could prove false?"
            - "If we're wrong about [key assumption], what's the fallback?"
            - "What would a competitor say is the flaw in this design?"

            **What's the real problem?**
            - "The user says they want X. But what problem is X actually solving?"
            - "Is X the best solution to that problem, or just the most obvious one?"
            - "If you had unlimited resources but had to solve this without adding features, what would you do?"

            Apply 2-4 challenges per round. The goal is not to be adversarial, but to expose hidden assumptions before they become expensive rework. If the user's answers are solid, move on. If they hedge or reveal uncertainty, drill deeper.

        Step 3: Present ambiguities to user
            Present 2-4 targeted questions per round. Format:

            ```
            🔍 Clarifying before we proceed:

            1. You said "users can share" — do you mean:
               a) Generate a public link (anyone can view)?
               b) Share within a team/workspace?
               c) Something else?

            2. What happens when the AI API is unreachable?
               a) Show error and block usage
               b) Fall back to manual mode
               c) Queue and retry

            (Choose or tell me your own answer.)
            ```

        Step 4: Resolve
            - For each question, get a clear answer before moving on
            - If the user says "I don't know" → offer 2-3 options with trade-offs
            - Record answers as explicit Spec entries so they are not forgotten

        Step 5: Boundary documentation
            After resolving ambiguities, document the boundaries explicitly:
            - In-scope: [confirmed features]
            - Out-of-scope for v1: [explicitly cut features]
            - Deferred decisions: [items left open with trigger conditions]

        This phase is NOT optional for new product specs. It prevents the most common source of rework: ambiguous requirements that get interpreted differently by developer and user.

    [Requirements Refinement Phase]
        Goal: Fill gaps, force the user to think clearly, determine AI capability needs and interface layout

        Step 1: Vulnerability identification
            Cross-reference [Requirements Dimension Checklist], identify missing critical information

        Step 2: Pressing
            Design questions for missing items
            Do not accept perfunctory answers
            Layout questions must be specific: how many columns, proportions, content per area, control specifications
            For uncertain technologies or solutions, WebSearch to confirm before giving advice

        Step 3: AI capability guidance
            Proactively ask the user:
            - "Should this feature have a one-click AI optimization?"
            - "Should users fill this in manually, or let AI smart-recommend?"
            Identify required AI capability types based on user needs (text generation, image generation, image recognition, etc.)
            For specific AI capabilities, WebSearch for the latest available models and solutions

        Step 4: Platform direction confirmation
            Analyze the user's product characteristics according to [Platform Adaptation Strategy]
            Give 2-3 platform options with their pros/cons
            Force the user to make a choice
            After selection, assess technical complexity — suggest phasing for high complexity

        Step 5: Sufficiency check
            Cross-reference [Information Sufficiency Criteria]
            "Must Satisfy" all met → proceed to Multi-Stakeholder Review
            Not met → continue asking, don't indulge

    [Multi-Stakeholder Review Phase]
        Goal: Before writing Spec, run a structured one-pass scan across four stakeholder
        perspectives to surface hidden assumptions and blind spots. This is not a PK debate —
        it is a formatted checklist that either passes or produces blocking items to resolve.
        **Not a replacement for Step 7 Council** — they serve different gates.

        **When to skip**: Quick Mode, Iteration Mode, user says "skip review", or a complete
        brief was already provided. In 0-to-1 full workflow, default on — user may opt out.

        Step 1: Prepare consensus summary
            Distill Refinement output into a compact `## Review Input` block (problem, users,
            MVP scope, tech direction, key assumptions).

        Step 2: Run four perspectives
            Execute `references/multi-stakeholder-review.md`:
            - Business Lens
            - Technical Lens
            - Experience Lens
            - Scope / Risk Lens
            Each returns: ok / clarify / blocked + key finding.

        Step 3: Synthesize
            Chairman (main Agent) produces the `## Stakeholder Review Summary` table:
            perspective × verdict × finding + recommended action.

        Step 4: Resolve blocking items
            Present to user. Blocking must be resolved before proceeding.
            If user resolution requires a re-scan, re-run affected perspective(s) only.
            Hard cap: max 1 re-scan (initial + at most one).

        Step 5: Either proceed or stop
            - Blocked items resolved → Critique Gate Phase
            - Blocked items cannot resolve → stop; mark Spec as blocked
            - No blocking items → Critique Gate Phase (findings feed into Critique Gate input)

    [Critique Gate Phase]
        Goal: Counteract LLM sycophancy bias by forcing a critical re-examination of the
        consensus spec before writing it. Multi-Stakeholder Review asks "should we build this?";
        Critique Gate asks "what are we getting wrong?" — adversarial, not stakeholder.

        **When to skip**: Quick Mode, Iteration Mode, user says "skip critique", or a complete
        brief was already provided. In 0-to-1 full workflow, default on — user may opt out.
        If Multi-Stakeholder Review was skipped, Critique Gate **still runs** (independent gate).

        Step 1: Prepare critique input
            Distill Refinement output + MS Review findings (if any) into a compact
            `## Critique Gate Input` block (problem, users, MVP scope, tech direction,
            key assumptions, stakeholder review findings).

        Step 2: Run three structural signals
            Execute `references/critique-gate.md`:
            - Signal 1: Hidden Assumptions (user/tech/market/scope assumptions treated as facts)
            - Signal 2: Unchallenged Decisions (decisions accepted without alternatives)
            - Signal 3: Scope That Should Be Cut (features that don't survive honest scrutiny)
            Each signal produces: ID + finding + impact assessment.

        Step 3: Synthesize verdict
            Produce the `## Critique Gate Summary`:
            - Hidden Assumptions table
            - Unchallenged Decisions table
            - Scope Cut Suggestions table
            - Verdict: proceed / clarify / blocked

        Step 4: Resolve blocking items
            Present to user. Blocking must be resolved before proceeding.
            No re-scan — the critique gate is a one-pass checkpoint.

        Step 5: Feed findings into Spec
            - Hidden assumptions → `§ Key Assumptions & Validation` in Spec
            - Scope cuts → explicit v1/v2 boundary in Spec
            - Unchallenged decisions → documented rationale in Spec
            Then proceed to Document Generation Phase.

    [Document Generation Phase]
        Goal: Output a usable Product Spec file

        Step 0: Cross-phase dedup (mandatory)
            Before organizing content, perform a structured dedup across all interview notes from Exploration, Clarifying, and Refinement phases:

            1. **Merge duplicates**: Find requirements or questions asked/answered in multiple phases — consolidate to one canonical entry with all resolved answers
            2. **Flag cross-phase contradictions**: A decision in Refinement may contradict an assumption in Clarifying — surface these before generation
            3. **Consolidate decisions scattered across phases**: Same topic discussed in multiple phases → merge into one coherent section
            4. **Prune resolved questions**: Remove questions that were answered and resolved — don't carry them into the Spec as open items

            Run this dedup before Step 1. Redundancy baked into the Spec at generation time is much harder to remove after.

        Step 1: Organize
            Categorize conversation content according to the output template structure

        Step 2: Fill
            Load templates/product-spec-template.md for template format
            Fill according to template format
            Include optional PM sections when Discovery or interviews ran: Value Proposition (JTBD), Success Metrics, Competitive Landscape, Key Assumptions & Validation (see `references/pm-frameworks-*.md`)
            Mark areas where "Try to Satisfy" was not met as [TBD]
            Start feature descriptions with verbs
            Describe UI layout clearly: overall structure and details of each area
            Write clear step-by-step flows

        Step 3: Identify AI capability requirements
            Identify required AI capability types based on functional requirements
            List them in the "AI Capability Requirements" section
            Describe the specific use of each capability in this product

        Step 4: Fill in technical direction
            Based on the platform direction and technical assessment confirmed in conversation
            Fill in the "Technical Direction" section: product type, recommended tech stack, core rationale

        Step 5: Output file
            Save the Product Spec as Product-Spec.md

        Step 6: Final Validation
            Goal: Remove redundancy, resolve contradictions, eliminate vague language before delivering.
            **Must run at least 3 full scan→fix cycles** — one pass catches < 60% of issues.

            Iterative cleanup loop (minimum 3 cycles):
            1. **Full Spec re-read**: Re-read the complete Product Spec from scratch each cycle.
               Do not rely on incremental diffs — they accumulate blind spots.

            2. **Scan**: Perform a complete self-review of the current Product Spec
               - **Redundancy check**: Find duplicate descriptions of the same requirement or feature
               - **Contradiction check**: Find conflicting statements between sections
               - **Vagueness check**: Identify remaining vague language ("good UX", "modern design", "etc.")
               - **Scope check**: Flag features mentioned in passing that aren't actually needed

            3. **Auto-fix**:
               - Redundancy: Automatically remove duplicates, merge descriptions
               - Contradictions: If resolution is obvious, auto-resolve; if not, flag for user
               - Do not auto-fix vagueness or scope issues — these require user input

            4. **Cycle counter**: Track explicit cycle number (1/3, 2/3, 3/3).
               - If cycle < 3 AND any auto-fix was applied → go to Step 1 (next cycle)
               - If cycle >= 3 AND no more auto-fixes possible → proceed to Present
               - If cycle >= 3 but still finding auto-fixable issues → continue until clean
               One pass is rarely enough — 3 cycles removes ~90% of redundancy and contradiction issues.

            5. **Present**: When done with auto-cleanup (minimum 3 cycles completed), present remaining issues to user:
               ```
               📋 Final validation complete (X cycles performed):
               - Auto-fixed: N issues (list briefly)
               - Remaining need your attention:
               - [ ] Vagueness: ... (ask clarification)
               - [ ] Contradiction: ... (propose options)
               - [ ] Scope: ... (confirm keep/remove)

               Please review and confirm.
               ```

            Only after user confirms all issues are resolved can the workflow end. Do not deliver an unclean spec.
            **HARD-GATE note**: Step 6 confirm applies to the written Spec file; chat-only agreement does not lift [HARD-GATE].

        Step 7: Spec Quality Council (llm-council discipline)
            Goal: Multi-perspective quality gate before Spec is final — complements Step 6 self-review with isolated role lenses.

            **When**: After Step 6 user confirms all cleanup issues resolved (or Step 6 found zero remaining items).

            Dispatch **4 parallel read-only perspectives** (same model, different role prompts — no multi-model router):
            1. **Completeness** — Are all key dimensions covered (users, flows, data, AI, tech, edge cases)?
            2. **Consistency** — Internal contradictions, conflicting requirements, duplicate scope?
            3. **Feasibility** — Achievable with stated tech stack and team constraints?
            4. **User lens** — Gaps from target user's job-to-be-done; missing pain points or success criteria?

            Each perspective returns: findings with confidence (0.0–1.0), **blocking / needs-clarification / ok**.

            **Chairman synthesis** (main Agent):
            - Verdict: **可交付 / 待确认 / 阻塞**
            - List blocking items first (must resolve before dev-planner)
            - Merge duplicate findings across perspectives

            If **阻塞** or unresolved **待确认** → return to user; do not mark Spec complete.
            If **可交付** → verify **§ Idea Stage Exit Criteria** is complete (three subsections, no `[TBD]` in required fields); then write `.forge/spec-confirmed.json` if not already written; [HARD-GATE] is lifted for `/dev-planner` — PreToolUse **Idea Validation Gate** blocks app code until this section is filled.

            **Product size detection** (after Spec is confirmed):
            Run `node scripts/forge-size-detect.mjs Product-Spec.md --write-gate-config`
            This detects product scope from the Spec and writes a recommended gate level to `.forge/gate-config.json`:
            - Small product (CLI, ≤4 features, no auth, no DB) → `light` (skip Idea Stage depth check, DEV-PLAN confirmation)
            - Medium/Large product → `full` (all gates enforced)
            User may override by editing `.forge/gate-config.json` manually.

            See [llm-council-comparison.md](../../../docs/llm-council-comparison.md).
