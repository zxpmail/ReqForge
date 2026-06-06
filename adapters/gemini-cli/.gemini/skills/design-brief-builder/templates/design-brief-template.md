---
name: design-brief-template
description: Design Brief output template. After the design interview, fill in the content following this template's structure and output as Design-Brief.md for reference by design tools and dev-builder during coding.
---

# Design Brief Output Template

This template is used to generate a design specification document. Design tools read this document to determine visual direction, and dev-builder reads it to determine style implementation in code.

---

## Template Structure

**File name**: Design-Brief.md

---

## Product Summary
<Extracted from Product-Spec.md, summarized in one paragraph>
- Product name
- Product type (Web / Desktop / CLI / Mobile)
- Target users
- Core functionality summary

## Design Discovery
<!-- Locked in design-brief-builder Step 4 — see references/design-discovery-questionnaire.md -->
| Field | Answer |
|-------|--------|
| Surface | |
| Primary audience | |
| Tone | |
| Brand context | |
| Density default | |
| Theme | |
| Motion | |
| Must-not | |
| Reference pick | |
| Success look | |

## Visual Direction Preset
<!-- If user picked a preset: Editorial Monocle | Modern Minimal | Warm Soft | Tech Utility | Brutalist Experimental | Custom -->
- **Preset**: [name or Custom]
- **Notes**: [any tweak to preset]

## Design Direction

### Mood Keywords
<3 core keywords that define the overall visual character of the product>
- **Keyword 1**: [word] — [one-sentence explanation of its meaning in this product]
- **Keyword 2**: [word] — [one-sentence explanation]
- **Keyword 3**: [word] — [one-sentence explanation]

### Reference Products
<List the reference products the user approved, noting specific aspects they like>

| Reference Product | Liked Aspects | Disliked Aspects |
|---------|-----------|-------------|
| [Product name] | [What is specifically good] | [What is specifically not good, if any] |

### Negative References
<List styles the user explicitly rejects>
- [Style/Product]: [Reason for rejection]

## Visual Specifications

### Color Direction
- **Theme Mode**: [Dark / Light / Both]
- **Color Temperature**: [Cool / Warm / Neutral]
- **Brand Primary Color Direction**: [Describe the color direction, e.g., "blue-purple tones", "earth tones" — no specific hex values needed]
- **Accent Color Direction**: [Describe the feel of the accent color]
- **Brand Assets**: [Existing logo/brand colors — note them here, or write "None"]

### Information Density
- **Density Direction**: [Compact / Moderate / Spacious]
- **Reference Benchmark**: [Similar to XX's density]
- **Rationale**: [Why this density was chosen, based on product feature complexity]

### Typography Direction
- **Font Character**: [Geometric / Humanist / Mechanical / Elegant], [describe the desired feel]
- **Chinese Font Preference**: [If any]
- **Heading Style**: [Large and prominent / Small and refined / Similar to body text]

### Interaction Style
- **Animation Level**: [Rich / Moderate / Minimal]
- **Transition Effects**: [Describe preferences]
- **Overall Rhythm**: [Lively / Steady / Moderate]

## Key Page Visual Notes
<For core features/pages in the Product Spec that have design decision space, record the user's visual preferences>

### [Page/Feature Name 1]
- **Core Interaction**: [Description]
- **Visual Direction**: [Direction chosen by the user, with reference product]
- **Special Requirements**: [If any]

### [Page/Feature Name 2]
- **Core Interaction**: [Description]
- **Visual Direction**: [Direction chosen by the user, with reference product]
- **Special Requirements**: [If any]

<Dynamically adjust based on the actual number of features in the Product Spec>

## State Design
- **Empty State**: [Direction — illustration? text guidance? minimal placeholder?]
- **Loading State**: [Skeleton screen / Spinning indicator / Progress bar / Typewriter effect]
- **Error State**: [Direction]

## Anti-Slop Review
<!-- From anti-ai-slop-checklist.md — patterns explicitly avoided -->
- [e.g. No purple gradient hero-only layout]
- [e.g. No decorative glassmorphism cards]

---

## Complete Example

Below is a Design Brief example for an "AI Chat Desktop App":

```markdown
## Product Summary
- Product name: Forge
- Product type: Desktop (Electron)
- Target users: Developers and technical users who need a locally running AI assistant
- Core functionality: Chat conversation, Agent management, IM bridging, scheduled tasks

## Design Direction

### Mood Keywords
- **Professional** — Developer-oriented, no fluff, clear information delivery
- **Steady** — Dark theme as primary, comfortable for extended use
- **Refined** — Attention to detail without over-design, every pixel has purpose

### Reference Products
| Reference Product | Liked Aspects | Disliked Aspects |
|---------|-----------|-------------|
| Linear | High information density without clutter, smooth animations | None |
| Arc Browser | Sidebar design, color usage | Some features are too deeply hidden |
| Raycast | Shortcut-driven, minimalist yet powerful | Sometimes shows too little information |

### Negative References
- Enterprise admin style: Avoid the cookie-cutter blue-and-white admin panels like Element UI / Ant Design
- Flashy animations: Avoid full-screen motion effects like the Framer website

## Visual Specifications

### Color Direction
- **Theme Mode**: Dark as primary, support light mode toggle
- **Color Temperature**: Cool
- **Brand Primary Color Direction**: Dark gray background with indigo as the brand identity color
- **Accent Color Direction**: Coral for warnings and important actions
- **Brand Assets**: Custom mascot icon available

### Information Density
- **Density Direction**: Somewhat compact
- **Reference Benchmark**: Close to Linear's density
- **Rationale**: The product has multiple functional areas including chat, management, and settings, requiring efficient space utilization

### Typography Direction
- **Font Character**: Geometric sans-serif, clean and crisp
- **Chinese Font Preference**: System default is fine
- **Heading Style**: Moderate difference from body text, no need for exaggeration

### Interaction Style
- **Animation Level**: Moderate — page transitions and list operations have subtle transitions, no flashy effects needed
- **Transition Effects**: Quick fades primarily, no bounce effects
- **Overall Rhythm**: Steady but not sluggish

## Key Page Visual Notes

### Chat Interface
- **Core Interaction**: User inputs messages, AI streams responses, supports tool call display
- **Visual Direction**: Similar to Claude/ChatGPT conversation layout, AI responses support Markdown rendering
- **Special Requirements**: Tool calls should have collapsible detail cards, not take up full screen

### Management Panel (Skills/Agents/MCP)
- **Core Interaction**: Three-column layout — category navigation + list + editor
- **Visual Direction**: Similar to VS Code's panel style, with left tree navigation
- **Special Requirements**: Editor supports code highlighting and preview toggle

### Sidebar Navigation
- **Core Interaction**: Icon navigation + Workspace switching
- **Visual Direction**: Similar to Slack's sidebar, collapsible
- **Special Requirements**: Shows only icons when collapsed

## State Design
- **Empty State**: Short text guidance + action button, no illustrations
- **Loading State**: Typewriter cursor for AI responses, skeleton screen for everything else
- **Error State**: Inline error prompt, red coral border, no popups
```

---

## Writing Guidelines

1. **Mood Keywords**: Maximum of 3, each must explain its specific meaning within this product
2. **Reference Products**: Must specify "what exactly is liked" — not just the product name
3. **Color Direction**: Describe the direction, not specific values ("blue-purple tones" not "#6366F1")
4. **Information Density**: Must include a reference benchmark ("similar to XX's density")
5. **Key Page Notes**: Only include pages that have design decision space; skip purely backend functionality
6. **State Design**: All three states — empty, loading, error — must have described directions
7. **Overall Principle**: This document is read by design tools and dev-builder; it must be specific enough to execute, but not down to the pixel level
