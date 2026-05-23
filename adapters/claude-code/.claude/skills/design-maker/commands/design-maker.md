---
description: Generate complete design mockups via design tool MCP
argument-hint: ""
---

# Command: /design-maker

Design mockup generation workflow. Full procedure in SKILL.md.

## Phase 1: Prerequisites & Tool Setup
**Goal**: Confirm inputs and connect design tool MCP
- Read Product-Spec.md and Design-Brief.md
- Detect/connect Pencil or Figma MCP (or exit to no-mockup mode)
- Map Spec UI features to required design pages
- **Acceptance**: Design tool ready, page inventory defined

## Phase 2: Page & State Generation
**Goal**: Produce all pages with critical state variants
- Generate pages per Spec coverage (empty, loading, error, success states)
- Extract design tokens (colors, spacing, typography)
- Component-level specs for dev-builder reference
- **Acceptance**: Every Spec UI feature has a corresponding design page/state set

## Phase 3: Handoff Verification
**Goal**: Confirm designs are complete for dev-builder
- Cross-check Spec feature list against generated pages
- Export/surface design values for coding reference
- **Acceptance**: Design deliverables complete, user confirms ready for /dev-builder
