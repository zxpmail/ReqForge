---
name: product-spec-template
description: Product Spec output template. When a product requirements document needs to be generated, fill in the content following this template's structure and format, and output as Product-Spec.md.
---

# Product Spec Output Template

This template is used to generate a structurally complete Product Spec document. Fill in the content following this structure.

---

## Template Structure

**File name**: Product-Spec.md

---

## Product Overview
<One paragraph to describe:>
- What is this product
- What problem does it solve
- **Who are the target users** (be specific, don't just say "users")
- What is the core value

## Idea Stage Exit Criteria

> **Validation-before-build** (Founder's Playbook): complete before `/dev-planner`. PreToolUse blocks app code until this section is filled — not `[TBD]`.

### 1. Problem real and specific?

| Field | Answer |
|-------|--------|
| Who exactly (role + context) | |
| How often | |
| How severe | |
| Current workaround | |

### 2. Solution addresses the validated problem?

| Field | Answer |
|-------|--------|
| Validated problem (from discovery, not original guess) | |
| How this product addresses it | |
| Differs from original assumption? (Y/N + note) | |

### 3. Enough signal to justify building?

| Field | Answer |
|-------|--------|
| Qualitative evidence (real conversations) | |
| Disconfirming evidence considered | |
| Why build now vs wait | |

## Use Cases
<List 3-5 specific scenarios: who, under what circumstances, how it's used, what problem it solves>

## Functional Requirements
<Organize by "Core Features" and "Supplementary Features". For each feature, describe: user does what -> system does what -> what is achieved>

## Safety & Consequence Tiers (S0 / S1 / S2)

> Split **what must never be model-improvised** from normal features. Rules: `.forge/security-guidance.md`.

| Tier | Meaning | Spec must specify | Acceptance |
|------|---------|-------------------|------------|
| **S0 — Facts** | Emergency numbers, medical/legal claims, regulated rates — harm if wrong | `constants/` or config; no LLM-only output | Unit test on exact values |
| **S1 — Actions** | Payments, dispatch, bulk notify, irreversible delete, publish | Confirm step in User Flow | No side effect without confirm |
| **S2 — Generative** | Normal features | Agent + review | Tests + review |

| Requirement | Tier | Source / confirm | Test or check |
|-------------|------|------------------|---------------|
| … | S0 / S1 / S2 | … | … |

If none: **"No S0/S1 in v1"**.

## UI Layout
<Describe the overall layout structure and detailed design of each area. Include:>
- Overall layout (number of columns, proportions, fixed elements, etc.)
- What content goes in each area
- Specific control specifications (position, size, style, etc.)

## User Flow
<Describe step by step how the user interacts with the product. Multiple paths are allowed (e.g., quick start, advanced usage)>

## AI Capability Requirements

| Capability Type | Usage Description | Application Location |
|---------|---------|---------|
| <Capability type> | <What it does> | <Where it is triggered> |

### LLM-as-Judge features (if any scoring, ranking, or classification)

> Required when the product uses LLM to score, rank, or classify items (jobs-style rubric). Skip this subsection if no such feature.

| Field | Requirement |
|-------|-------------|
| Output format | Structured JSON per item: `{ "score": <number>, "rationale": "<2-3 sentences>" }` plus schema version / prompt id |
| Scale | Define numeric scale with **anchor examples** (e.g. 0–10 with what 0, 5, 10 mean) |
| Disclaimer (product copy) | Scores are **estimates**, not predictions; do not promise job loss, revenue, or legal outcomes |
| Re-run policy | Changing the rubric re-runs scoring only — does not require regenerating unrelated code |
| Human override | User can edit or dismiss a score; audit log optional [TBD] |

## Technical Direction

| Dimension | Choice | Rationale |
|------|------|------|
| Product Type | <Web / Desktop / CLI / Mobile> | <Why this platform> |
| Recommended Tech Stack | <e.g., Next.js + TypeScript + Tailwind> | <Why this stack> |
| Data Storage | <Local / Cloud / Hybrid> | <Based on product requirements> |
| Deployment | <Static hosting / Server / Desktop installer / App Store> | <Based on product type> |

## Technical Notes (Optional)
<If the following topics are involved, provide details:>
- External dependencies: What services need to be called? Any limitations?
- Special requirements: Offline use? System permissions? Performance requirements?

## Additional Notes
<Use a table to explain options, states, logic, etc. if needed>

## Known Difficult Spots

> 选填。列出已知的技术难点、风险区域、易出错环节，帮助 dev-planner 和 dev-builder 在遇到这些点时"怵然为戒，动刀甚微"。
> **自动演化**：dev-builder 每完成一个 Phase，会在「善刀而藏之」步骤中将新发现的隐藏难点自动追加到此表。下一 Phase 站在更新后的地图上。

| 模块/功能 | 难度 | 预计缝在哪 | 应对策略 |
|-----------|------|-----------|---------|
| <模块名称> | 🔴 高 / 🟡 中 / 🟢 低 | <技术难点、边界条件、已知陷阱> | <绕过或精准处理的策略> |
| Stripe Webhook | 🔴 高 | 幂等性处理、试用期 `invoice.paid` 误触发 | 加 idempotency key，判 subscription status |
| 搜索排序 | 🟡 中 | 多字段权重组合 | 先写单元测试锚定排序行为 |
| 用户注册 | 🟢 低 | 标准 CRUD | 快速通过，不需要逐行盯 |

**难度对照**：
- 🔴 **高** — dev-builder 执行时放慢，追加自我评审，怵然为戒。修改需考虑回滚。
- 🟡 **中** — 标准实施 + code-review 关注。确认验收标准后再通过。
- 🟢 **低** — 快速通过，标准流程，不需额外关注。

---

## Complete Example

Below is a Product Spec example for a "Storyboard Generator" for reference:

```markdown
## Product Overview

This is a tool that helps manga artists, short video creators, and animation teams quickly convert scripts into storyboard images.

**Target Users**: Creators who have a script but lack drawing ability, or want to quickly produce storyboard drafts. They might be independent manga artists, short video bloggers, or pre-production planners at animation studios. Their shared pain point is: "I can picture it in my head, but I can't draw it, or drawing takes too long."

**Core Value**: Users simply input their script text, upload character and scene reference images, and select an art style. The AI automatically analyzes the script structure, generates visually consistent storyboard images, and reduces what used to take hours of storyboard work down to minutes.

## Use Cases

- **Manga Creation**: Independent manga artist Xiao Wang has a 20-page script and needs to produce storyboard drafts before refining. He pastes the script in, uploads the main character's reference image, and gets all storyboard drafts in 10 minutes, ready for refinement.

- **Short Video Planning**: Short video blogger Xiao Li wants to shoot a 3-minute narrative short and needs storyboards for the cinematographer. She inputs the script, selects "Realistic" style, and the generated storyboards serve directly as shooting references.

- **Animation Pre-production**: An animation studio needs to pitch to a client and requires a quick storyboard version to demonstrate script pacing. The planning team uses this tool to produce 50 storyboard images in 30 minutes, enabling a proposal meeting the same day.

- **Novel Visualization**: A web novel author wants promotional images for their story. They input key scene descriptions, and the generated storyboards can be used directly on social media.

- **Teaching Demonstration**: A primary school Chinese teacher wants to turn a lesson into a comic strip for students. They input the lesson content, select "Anime" style, and the generated images can be directly turned into a slideshow.

## Functional Requirements

**Core Features**
- Script Input & Analysis: User inputs script text -> clicks "Generate Storyboard" -> AI automatically identifies characters, scenes, and plot beats, splitting the script into multiple storyboard pages
- Character Setup: User adds character cards (name + appearance description + reference image) -> system builds a character visual profile, maintaining consistent appearance in subsequent generations
- Scene Setup: User adds scene cards (name + atmosphere description + reference image) -> system builds a scene visual profile (optional; if not set, AI generates based on the script)
- Art Style Selection: User selects an art style from a dropdown (Manga/Anime/Realistic/Cyberpunk/Ink Wash) -> generated storyboards adopt the corresponding visual style
- Storyboard Generation: User clicks "Generate Storyboard" -> AI generates 9 storyboard images for the current page (3x3 grid) -> displayed in the right output area
- Continuous Generation: User clicks "Continue Next Page" -> AI generates the next page of 9 storyboard images, maintaining the previous page's art style and character appearance

**Supplementary Features**
- Batch Download: User clicks "Download All" -> system packages the current page's 9 images into a ZIP for download
- History Browsing: User navigates via page controls -> switches to view previously generated pages

## UI Layout

### Overall Layout
Two-column layout: left input area at 40%, right output area at 60%.

### Left - Input Area
- Top: Project name input field
- Script Input: Multi-line text box, placeholder "Enter your script content..."
- Character Setup Area:
    - Character card list, each card includes: character name, appearance description, reference image upload
    - "Add Character" button
- Scene Setup Area:
    - Scene card list, each card includes: scene name, atmosphere description, reference image upload
    - "Add Scene" button
- Art Style Selection: Dropdown (Manga / Anime / Realistic / Cyberpunk / Ink Wash), default "Anime"
- Bottom: "Generate Storyboard" primary button, right-aligned, prominent style

### Right - Output Area
- Storyboard Display Area: 3x3 grid layout, displaying 9 individual storyboard images
- Below each image: storyboard number, brief description
- Action Buttons: "Download All", "Continue Next Page"
- Page Navigation: Shows current page number, supports switching to view history pages

## User Flow

### First Generation
1. Enter script content
2. Add characters: fill in name, appearance description, upload reference image
3. Add scenes: fill in name, atmosphere description, upload reference image (optional)
4. Select art style
5. Click "Generate Storyboard"
6. View the generated 9 storyboard images on the right
7. Click "Download All" to save

### Continuous Generation
1. Complete the first generation
2. Click "Continue Next Page"
3. AI generates the next page of 9 storyboard images based on the previous page's art style and character appearance
4. Repeat until the script is complete

## AI Capability Requirements

| Capability Type | Usage Description | Application Location |
|---------|---------|---------|
| Text Understanding & Generation | Analyze script structure, identify characters, scenes, and plot beats, plan storyboard content | When clicking "Generate Storyboard" |
| Image Generation | Generate 3x3 grid storyboard images based on storyboard descriptions | When clicking "Generate Storyboard" or "Continue Next Page" |
| Image Understanding | Analyze user-uploaded character and scene reference images, extract visual features for consistency | When uploading character/scene reference images |

## Technical Direction

| Dimension | Choice | Rationale |
|------|------|------|
| Product Type | Web | Creative tool, needs easy sharing and collaboration, no system permissions required |
| Recommended Tech Stack | Next.js + TypeScript + Tailwind | Full-stack framework, supports API routes for AI service calls, SSR benefits SEO |
| Data Storage | Local (LocalStorage) | No login needed at MVP stage, reduces complexity |
| Deployment | Static hosting (Vercel) | Zero maintenance, auto-deploy, free tier is sufficient |

## Technical Notes

- **Image Generation**: Calls AI image generation service, each batch of 9 images takes approximately 30-60 seconds
- **File Export**: Supports batch download in PNG format, packaged as ZIP file

## Additional Notes

| Option | Values | Description |
|------|--------|------|
| Art Style | Manga / Anime / Realistic / Cyberpunk / Ink Wash | Determines the overall visual style of storyboards |
| Character Reference Image | Image upload | Used to establish character visual identity, ensuring consistency |
| Scene Reference Image | Image upload (optional) | Used to establish scene atmosphere; if not uploaded, AI generates based on description |
```

---

## Writing Guidelines

1. **Product Overview**:
   - One sentence to describe what it is
   - **Must clearly identify target users**: who they are, their characteristics, their pain points
   - Core value: what the user gains from using this product

2. **Use Cases**:
   - Specific person + specific situation + specific usage + what problem it solves
   - Scenarios should be vivid and easy to understand at a glance
   - Place before functional requirements to help understand the product's value

3. **Functional Requirements**:
   - Separate into "Core Features" and "Supplementary Features"
   - Format for each item: user does what -> system does what -> what is achieved
   - Specify the trigger method (which button to click)

4. **UI Layout**:
   - Start with the overall layout (number of columns, proportions)
   - Then describe each area's content in detail
   - Controls should be specific: list all dropdown options with defaults, button positions and styles

5. **User Flow**: Step by step, can include multiple paths

6. **AI Capability Requirements**:
   - List the required AI capability types
   - Describe specific usage
   - **Clearly state where each capability is triggered** to help developers understand the invocation timing

7. **Technical Direction**:
   - Product type + recommended tech stack + rationale, presented in a table
   - Also include data storage method and deployment method in the table
   - This serves as input for dev-planner and dev-builder

8. **Technical Notes** (Optional):
   - External service dependencies, special requirements
   - Only include when there are technical constraints; omit otherwise

9. **Additional Notes**: Use a table, suitable for explaining options, states, logic
