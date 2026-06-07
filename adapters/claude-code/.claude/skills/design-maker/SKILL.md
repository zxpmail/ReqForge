<!-- forge: design-maker v1.0 -->
---
name: design-maker
description: Used when the Design Brief is complete and the user needs to generate mockups. Reads Product-Spec.md and Design-Brief.md, then generates a complete set of design deliverables through a design tool MCP, including all pages, state variants, component specifications, and design tokens.
version: 1.0.0
updated: 2026-05-26
requires: []
---

<!-- begin: task -->
[Task]
    Read Product-Spec.md and Design-Brief.md, then generate complete design deliverables through a design tool MCP. Ensure that every feature with UI in the Product Spec has a corresponding design page, and every page covers all critical state variants.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Defining visual direction or style preferences -> use /design-brief-builder instead
    - Writing code from designs -> use /dev-builder instead
    - Projects without a design tool MCP available -> skip this skill and go straight to /dev-builder

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Automatically executed as the first step when the Skill starts.

    Required:
    - Product-Spec.md → If missing, prompt the user to call /product-spec-builder first
    - Design-Brief.md → If missing, prompt the user to call /design-brief-builder first
    - Design tool MCP → See the design tool detection process below

    Optional:
    - references/design-self-critique.md → used in verification if available

    Design tool detection process:
    1. Ask the user whether they want to use Pencil or Figma
    2. Check if the corresponding MCP is connected
    3. Connected → Continue
    4. Not connected → Attempt to connect the MCP, or prompt the user to connect
    5. User does not have the corresponding design software installed → Prompt the user to install it and retry
    6. User chooses to skip → Exit design-maker; subsequent workflow continues in no-mockup mode

<!-- end: dependency-check -->
<!-- begin: first-principles -->
[First Principles]
    **Full Coverage Principle**: Every feature with UI in the Product Spec must have a design page. Miss one page and development loses one reference — the consequence is development by guessing.
    **State Completeness Principle**: Every page must have more than just a default state. Empty state, loading state, error state, active state — pages with interactivity must cover critical state variants.
    **Components First Principle**: Build reusable components first, then compose pages from them. Avoid drawing the same button 10 times across 10 pages, requiring 10 changes for a single update.
    **Document-Driven Principle**: All design decisions come from Product-Spec.md and Design-Brief.md. Do not improvise based on personal preference, and do not add features not described in the documents.

<!-- end: first-principles -->
<!-- begin: output-style -->
[Output Style]
    **Tone**: Designer presenting mockups to an engineering team — structured, precise, complete. Every page and variant is explicitly listed.
    **Principles**:
    - V Every feature with UI in the Spec has a design page
    - V Every interactive page covers empty, loading, error, and active states
    - V Design tokens are documented (not "looks about right")
    - X No improvised features — everything comes from Product-Spec.md and Design-Brief.md

<!-- end: output-style -->
<!-- begin: design-coverage-checklist -->
[Design Coverage Checklist]
    Before delivering, verify each dimension:

    | Dimension | Must-Have | Recommended |
    |-----------|-----------|-------------|
    | **Page Coverage** | Every Spec UI feature has a design page | State variants (empty/loading/error) for interactive pages |
    | **Component System** | Reusable components extracted before page composition | Design tokens for colors, typography, spacing, radius |
    | **Spec Fidelity** | Layout and content match Product-Spec.md item by item | Visual direction matches Design-Brief.md mood and notes |
    | **Self-Critique** | references/design-self-critique.md executed (all >=3) | Anti-ai-slop checklist from design-brief-builder reviewed |
    | **Consistency** | Same component looks same across pages | Design tokens referenced correctly, no ad-hoc values |

<!-- end: design-coverage-checklist -->
<!-- begin: file-structure -->
[File Structure]
    ```
    design-maker/
    ├── SKILL.md
    └── references/
        ├── design-self-critique.md        # 五维自检 + anti-slop（交付前）
        ├── anti-rationalization.md
        └── dimension-checklist.md
    ```

<!-- end: file-structure -->
<!-- begin: gotchas -->
[Gotchas]
    **Missing state variants**: Default state only is not a design. Every interactive component needs: empty, loading, error, active/selected, and disabled states. If you only design the happy path, development will guess the rest.
    **Skipping component isolation**: Drawing the same button on 10 pages = 10 updates when the button changes. Build a component library first, compose pages from it. The extra 5 minutes saves hours.
    **Design tool sync loss**: The design tool has the source of truth, but the SKILL.md describes what was true at invocation time. If the design tool is available, re-read values before each Task — don't trust memory.
    **Inconsistent spacing/color system**: Using ad-hoc values instead of a design token system. Every color, spacing, and font size should come from a defined palette, not "this looks about right."

<!-- end: gotchas -->
<!-- begin: anti-rationalization-checklist -->
[Anti-Rationalization Checklist]
    → `references/anti-rationalization.md`
    遇 skipping planning / skipping component system / skipping state variants 时读取。

<!-- end: anti-rationalization-checklist -->
<!-- begin: dimension-checklist -->
[Dimension Checklist]
    See [references/dimension-checklist.md](references/dimension-checklist.md) for the full dimension checklist.

    Must-have dimensions:
    - **Page Coverage**: every Spec UI feature has a design page
    - **State Completeness**: empty/loading/error/active for every interactive page
    - **Component System**: reusable components before page composition
    - **Spec Fidelity**: layout and content match Product-Spec.md item by item
    - **Self-Critique**: references/design-self-critique.md executed, all ≥3

<!-- end: dimension-checklist -->
<!-- begin: quality-rubric -->
[Quality Rubric]
    8-item, 16-point scoring system. Ship threshold: **≥ 12** with no critical item scoring 0.

    | # | Dimension | Pts | Critical | Scoring |
    |---|-----------|-----|----------|---------|
    | 1 | Page coverage | 2 | YES | 2 = Every Spec UI feature has a design page; 1 = 1-2 pages missing; 0 = Significant gaps |
    | 2 | State completeness | 2 | YES | 2 = Empty/loading/error/active states for every interactive page; 1 = States covered but not all; 0 = Default state only |
    | 3 | Component system | 2 | — | 2 = Reusable components built before page composition; 1 = Partial extraction; 0 = Same element duplicated across pages |
    | 4 | Design tokens | 2 | — | 2 = Colors, typography, spacing, radius all tokenized; 1 = Partial token set; 0 = Ad-hoc values throughout |
    | 5 | Spec fidelity | 2 | YES | 2 = Layout and content match Product-Spec.md item by item; 1 = Minor deviations; 0 = Contradicts Spec |
    | 6 | Brief alignment | 2 | — | 2 = Visual direction matches Design-Brief.md mood/notes; 1 = Partial alignment; 0 = Ignores Brief direction |
    | 7 | Self-critique executed | 2 | — | 2 = `references/design-self-critique.md` executed, all ≥3; 1 = Executed but ≤2 scores not revised; 0 = Skipped |
    | 8 | Visual consistency | 2 | — | 2 = Same component looks identical across pages, tokens used correctly; 1 = Minor inconsistencies; 0 = Visual drift across pages |

    **Scoring**: Run `pnpm validate-skill --score core/skills/design-maker` to compute.
<!-- end: quality-rubric -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **Design Deliverables** (created via design tool MCP):
      - Design tokens (color, typography, spacing, border radius system)
      - Reusable components
      - All page mockups
      - State variants (default, empty, loading, error, etc.)
    - **Design Completion Report** (printed to screen)

<!-- end: output-artifacts -->
<!-- begin: skills -->
[Skills]
    - **Document Analysis**: Extract all pages, features, and interactive elements from the Product Spec; extract visual direction from the Design Brief
    - **Design Planning**: Transform extracted information into a design delivery checklist, listing all pages and variants that need to be designed
    - **Component Design**: Create a reusable component system using the design tool MCP
    - **Page Design**: Generate complete designs page by page using the design tool MCP
    - **Completeness Verification**: Cross-reference against the Product Spec to verify all pages and states are covered

<!-- end: skills -->
<!-- begin: design-deliverables -->
[Design Deliverables]
    A complete set of mockups must include the following:

    **When Multi-Alternative Mode is active** (`--alternatives N` or `alternatives: N` in brief):
    - Generate **N distinct design alternatives**, each with a different visual/interaction approach
    - Each alternative must be internally consistent (tokens, components, pages all match that alternative's direction)
    - After all N alternatives are complete, produce a **cross-comparison table**:
      | Dimension | Alt A | Alt B | Alt C |
      |-----------|-------|-------|-------|
      | Approach | (e.g. "density-first") | (e.g. "guided wizard") | (e.g. "card-based") |
      | Key strength | ... | ... | ... |
      | Key weakness | ... | ... | ... |
      | Best for | ... | ... | ... |
    - Include a **recommendation** with rationale, then let the user decide before proceeding to dev-planner

    **When Gradual Refinement Mode is active**:
    Deliver in 3 graduated tiers so the user can validate each layer before the next is built:

    **Tier 1 — Structure & Layout** (foundation)
    - Page layout skeleton: columns, sections, content areas
    - Component placement without full polish
    - Navigation flow between pages
    - No detailed styling, no state variants yet
    - Goal: validate information architecture before investing in visual detail

    **Tier 2 — Interaction & Core Logic** (behavior)
    - Full interactive states for primary user flows
    - Sorting, filtering, pagination, form submission, navigation
    - Core feature interactions are functional
    - Error states for primary operations
    - Goal: validate interaction logic before edge cases

    **Tier 3 — Edge Cases & Polish** (completion)
    - Empty states, loading states, error states for all pages
    - Responsive / screen-adaptation details
    - Animation and micro-interaction notes
    - Accessibility (contrast, focus states, touch targets)
    - Final design token audit
    - Goal: ship-ready polish

    **Standard mode** (default) — all tiers delivered in one pass as described below.

    **1. Design Tokens**
    Extracted from Design-Brief.md and set in the design tool:
    - Color system: background color, text color, brand color, semantic color, label color
    - Typography system: font family, font size hierarchy, font weight
    - Spacing system: common values for padding, gap
    - Border radius system: radius values for each level

    **2. Reusable Components**
    Extract common components from the Product Spec's UI layout and feature requirements:
    - Buttons (primary, secondary, text buttons)
    - Input fields
    - Navigation items (selected state, unselected state)
    - Cards
    - Tags / badges
    - Other elements that repeat across pages

    **3. All Pages**
    Every page or view described in the Product Spec's UI layout section must have a corresponding design:
    - Cross-reference the UI layout, feature requirements, and user flow sections of the Product Spec to compile the page list
    - Each page is assembled using reusable components
    - Layout, spacing, and content must strictly adhere to the Spec description

    **4. State Variants**
    Each page must cover the corresponding states based on its interaction complexity:
    - Default state: Required for all pages
    - Empty state: Required for pages that display data
    - Loading state: Required for pages with asynchronous operations
    - Error state: Required for operations that can fail
    - Interaction variants: When the same area can display different content types, one variant per content type

<!-- end: design-deliverables -->
<!-- begin: workflow -->
[Workflow]
<!-- end: workflow -->
    <!-- begin: startup-phase -->
    [Startup Phase]
        Step 1: Dependency Check
            Execute [Dependency Check]

        Step 2: Load Documents
            Read Product-Spec.md → Extract all pages, features, UI layout descriptions, user flows
            Read Design-Brief.md → Extract mood keywords, color direction, information density, typography direction, interaction style, core page visual notes, state design direction

    <!-- end: startup-phase -->
    <!-- begin: planning-phase -->
    [Planning Phase]
        Step 1: Extract Page List
            Extract all described pages and views from the Product Spec's UI layout section
            Supplement potentially missing pages from the feature requirements section
            Confirm page transition relationships from the user flow section

        Step 2: Determine State Variants
            Analyze which state variants each page needs
            Compile a complete design delivery checklist in the format: Page name + list of required state variants

        Step 3: Extract Component List
            Identify recurring UI elements from the page list
            Determine the list of reusable components that need to be created

        Step 4: Present Design Plan
            Show the user the complete design delivery checklist:
            - Number of components
            - Number of pages
            - Number of variants
            - Total design items

            **If Multi-Alternative Mode**: state the number of alternatives (e.g. "2 alternatives with different interaction paradigms")
            **If Gradual Refinement Mode**: state the 3 tiers and ask if they want to confirm Tier 1 before proceeding
            **If both**: confirm the grid (e.g. "2 alternatives × 3 tiers = 6 delivery rounds")

            Begin designing after user confirmation

    <!-- end: planning-phase -->
    <!-- begin: design-phase -->
    [Design Phase]
        Step 1: Get Design Tool Guidelines
            Call the design tool's get_guidelines to obtain usage specifications and best practices

        Step 2: Set Design Tokens
            Based on the Design Brief's color, typography, and spacing direction, set global design tokens via the design tool API
            **In Multi-Alternative Mode**: create a separate token set per alternative (e.g. Alt A: warm palette, Alt B: cool palette)

        Step 3: Create Reusable Components
            **Standard Mode**: Create components one by one according to the component list
            **Multi-Alternative Mode**: Create component sets for each alternative independently
            **Gradual Refinement Mode**: Create only structural components in Tier 1; add interactive components in Tier 2; create specialized components in Tier 3
            Take a screenshot for verification after each component is created

        Step 4: Design Pages One by One
            **Standard Mode**: Design each page according to the page list
            **Multi-Alternative Mode**: Design pages for Alternative A first, then Alternative B, etc. — do not interleave
            **Gradual Refinement Mode**: Per tier:
              - Tier 1: layout skeleton only — wireframe-level fidelity, content areas marked but not styled
              - Tier 2: full visual design for primary flows — interactions functional, core pages polished
              - Tier 3: all remaining states + edge cases + polish pass
              After each tier: present to user for confirmation before starting the next tier
            **Hybrid (alternatives + refinement)**: Complete Tier 1 for all alternatives first → user picks winner → refine winner through Tiers 2-3

            For each page (in applicable mode):
            1. Assemble using reusable components
            2. Fill with real content — do not use Lorem ipsum
            3. Cross-reference against the Product Spec description to confirm layout and content item by item
            4. Cross-reference against the Design Brief's visual notes to confirm the style
            5. Take a screenshot for verification

        Step 5: Design State Variants
            Design each variant according to the variant list
            Each variant is based on the corresponding page's default state with modifications

    <!-- end: design-phase -->
    <!-- begin: verification-phase -->
    [Verification Phase]
        Step 1: Completeness Verification
            Cross-reference against the design delivery checklist from the Planning Phase, confirming item by item whether it has been completed:
            - Has each component been created?
            - Has each page been designed?
            - Has each state variant been covered?

        Step 2: Consistency Verification
            Check visual consistency across all pages:
            - Does the same component look the same across different pages?
            - Are colors, font sizes, and spacing globally consistent?
            - Are design tokens referenced correctly?

        Step 3: Spec Cross-Reference
            Re-read the Product Spec's feature requirements to confirm that no feature's corresponding UI has been missed

        Step 3b: Design self-critique (required)
            Execute `references/design-self-critique.md` and `design-brief-builder/references/anti-ai-slop-checklist.md`
            Revise mockups if any dimension ≤2; record scores in the completion report

        Step 3c: Generate UI-Spec.md (required)
            Generate `UI-Spec.md` in the project root — a structured YAML spec covering:
            - Page purpose, target user, primary action
            - Sections with priority, component type, states
            - Responsive layout rules (desktop / tablet / mobile)
            - Reusable component list
            - Acceptance criteria
            Use `core/templates/ui-spec-template.md` as the format reference.
            This file is consumed by dev-builder to avoid guessing structure from pixels.
            Do NOT commit UI-Spec.md to the repo (it is regenerated on each design cycle).

        Step 3d: Cross-comparison (Multi-Alternative Mode only)
            Produce a cross-comparison table:
            | Dimension | Alt A | Alt B | ... |
            | Approach | ... | ... | ... |
            | Key strength | ... | ... | ... |
            | Key weakness | ... | ... | ... |
            | Self-critique score | ... | ... | ... |
            | Best suited for | ... | ... | ... |
            Include a recommendation with clear rationale. Present to user for decision before proceeding.

        Step 4: Output Report
            Present the design completion report to the user:
            - List of completed pages and variants
            - Design file location
            - Uncovered items and reasons (if any)

            Guide the next steps:
            "Mockups are complete.

             Next steps:
             - Call /dev-planner to create a development plan (will reference the mockups)
             - Or continue the conversation to adjust design details"

    <!-- end: verification-phase -->
<!-- begin: initialization -->
[Initialization]
    Execute [Startup Phase]

<!-- end: initialization -->