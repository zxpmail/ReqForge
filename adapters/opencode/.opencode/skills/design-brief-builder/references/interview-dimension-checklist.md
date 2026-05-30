# Interview Dimension Checklist

The following dimensions must be explored during the conversation (not necessarily in order — adapt naturally to the flow):

## Must Explore

(without these, the design tool can only guess)

- **Mood Direction**: What feeling should the product convey? Use competing products as anchors to draw out the answer. Keep probing until you have 3 keywords + at least 1 reference product.
  - "Is your product closer to [Reference A]'s XX route, or [Reference B]'s YY route?"
  - "If your product were a person, what three words would you use to describe them?"

- **Color Direction**: Cool / Warm / Neutral? Dark / Light? Is there a brand color? Based on the mood direction, give 2-3 color palette options for the user to choose.
  - "Given your [XX direction], common palettes include A (like [Reference]) and B (like [Reference]). Which do you lean toward?"
  - "Do you already have a brand color or logo?"

- **Information Density**: How much information per screen? Determine based on the Product Spec's feature count and UI layout.
  - "Your product has N core features — that's a lot of information. Do you want it like [dense reference], as much as possible on one screen? Or like [spacious reference], focusing on one thing at a time?"

- **Core Feature Visuals**: For every core feature/page in the Product Spec that has visual design decisions to make, confirm the visual direction one by one. Use competing products as anchors. Skip purely backend features.
  - Spec has a chat interface → "Message bubbles — rounded cards or plain text? Should AI replies have a typewriter effect?"
  - Spec has a data table → "Should the table go for Airtable's colorful tag style, or Excel's compact data style?"
  - Spec has a sidebar nav → "Is the sidebar collapsible? When collapsed, only icons or fully hidden?"
  - Spec has a canvas feature → "Canvas background — plain white or grid? When elements are selected, should it behave like Figma or Miro?"
  - When unsure about a design pattern, WebSearch mainstream design solutions for that feature first

## Try to Explore

(with these, the design is more precise)

- **Negative References**: Styles or products the user dislikes, with specifics on what they dislike.
- **Brand Assets**: Existing logo, brand colors, or fonts?
- **Interaction Style**: Animation level, transition effects, pacing
- **State Design**: Empty, loading, error states
- **Target User Aesthetic**: Developers vs consumers vs enterprise expectations

## Don't Need to Ask the User

(leave these to the design tool)

- Specific border radius values, shadow parameters, spacing numbers
- Specific font sizes, line heights
- Specific hex color values (set direction only, not values)
- Component-specific implementation details
