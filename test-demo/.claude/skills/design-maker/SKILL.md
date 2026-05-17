---
name: design-maker
description: Used when the Design Brief is complete and the user needs to generate mockups. Reads Product-Spec.md and Design-Brief.md, then generates a complete set of design deliverables through a design tool MCP, including all pages, state variants, component specifications, and design tokens.
---

[Task]
    Read Product-Spec.md and Design-Brief.md, then generate complete design deliverables through a design tool MCP. Ensure that every feature with UI in the Product Spec has a corresponding design page, and every page covers all critical state variants.

[Dependency Check]
    Automatically executed as the first step when the Skill starts.

    Required:
    - Product-Spec.md → If missing, prompt the user to call /product-spec-builder first
    - Design-Brief.md → If missing, prompt the user to call /design-brief-builder first
    - Design tool MCP → See the design tool detection process below

    Design tool detection process:
    1. Ask the user whether they want to use Pencil or Figma
    2. Check if the corresponding MCP is connected
    3. Connected → Continue
    4. Not connected → Attempt to connect the MCP, or prompt the user to connect
    5. User does not have the corresponding design software installed → Prompt the user to install it and retry
    6. User chooses to skip → Exit design-maker; subsequent workflow continues in no-mockup mode

[First Principles]
    **Full Coverage Principle**: Every feature with UI in the Product Spec must have a design page. Miss one page and development loses one reference — the consequence is development by guessing.
    **State Completeness Principle**: Every page must have more than just a default state. Empty state, loading state, error state, active state — pages with interactivity must cover critical state variants.
    **Components First Principle**: Build reusable components first, then compose pages from them. Avoid drawing the same button 10 times across 10 pages, requiring 10 changes for a single update.
    **Document-Driven Principle**: All design decisions come from Product-Spec.md and Design-Brief.md. Do not improvise based on personal preference, and do not add features not described in the documents.

[Output Artifacts]
    - **Design Deliverables** (created via design tool MCP):
      - Design tokens (color, typography, spacing, border radius system)
      - Reusable components
      - All page mockups
      - State variants (default, empty, loading, error, etc.)
    - **Design Completion Report** (printed to screen)

[Skills]
    - **Document Analysis**: Extract all pages, features, and interactive elements from the Product Spec; extract visual direction from the Design Brief
    - **Design Planning**: Transform extracted information into a design delivery checklist, listing all pages and variants that need to be designed
    - **Component Design**: Create a reusable component system using the design tool MCP
    - **Page Design**: Generate complete designs page by page using the design tool MCP
    - **Completeness Verification**: Cross-reference against the Product Spec to verify all pages and states are covered

[Design Deliverables]
    A complete set of mockups must include the following:

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

[Workflow]
    [Startup Phase]
        Step 1: Dependency Check
            Execute [Dependency Check]

        Step 2: Load Documents
            Read Product-Spec.md → Extract all pages, features, UI layout descriptions, user flows
            Read Design-Brief.md → Extract mood keywords, color direction, information density, typography direction, interaction style, core page visual notes, state design direction

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
            Begin designing after user confirmation

    [Design Phase]
        Step 1: Get Design Tool Guidelines
            Call the design tool's get_guidelines to obtain usage specifications and best practices

        Step 2: Set Design Tokens
            Based on the Design Brief's color, typography, and spacing direction, set global design tokens via the design tool API

        Step 3: Create Reusable Components
            Create components one by one according to the component list
            Take a screenshot for verification after each component is created

        Step 4: Design Pages One by One
            Design each page according to the page list
            For each page:
            1. Assemble using reusable components
            2. Fill with real content — do not use Lorem ipsum
            3. Cross-reference against the Product Spec description to confirm layout and content item by item
            4. Cross-reference against the Design Brief's visual notes to confirm the style
            5. Take a screenshot for verification

        Step 5: Design State Variants
            Design each variant according to the variant list
            Each variant is based on the corresponding page's default state with modifications

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
