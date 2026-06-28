---
tags: [designtokens, ai, webdev, ux]
---

# A Design Document vs a Design Chain

> Google open-sourced `DESIGN.md` — YAML tokens, a CLI linter, one-command Tailwind export. Great.
> But a format only helps people who already know what they want. What 0→1 products need isn't a format — it's a chain.

---

Google Labs open-sourced something [interesting](https://github.com/google-labs-code/design.md): a standardized format for AI coding agents to read and write design tokens.

```yaml
colors:
  background: "#ffffff"
  ink: "#08060d"
  accent: "#aa3bff"
```

Each named value in that YAML — `#ffffff`, `18px`, `4px` — is a **design token**: the smallest atomic value in a design system, carrying a name and a number, so the agent doesn't guess when building UI.

Plus a CLI: `designmd lint`, `designmd export --format css-tailwind`, `designmd diff`.

Looks complete. Agents read tokens and write UI. Design changes get diffed. Themes get exported.

But if you've ever started from scratch with an AI coding assistant, you've hit an awkward truth:

**DESIGN.md tells you *what to write*, not *what to decide*.**

Whether the accent is `#aa3bff` or `#2563eb` — that decision happens *before* DESIGN.md gets written. And the painful part is exactly that "before."

---

## 1. A Format Is the Destination, Not the Path

Google's PHILOSOPHY.md has a line I strongly agree with: **"prose sets the tone, tokens are the prose's context."** Don't write vague adjectives; write concrete references — "like a 1970s lecture handout," not "retro style."

But where does the prose come from? Who picks the reference? Who gets to decide "like a 1970s lecture handout" when the product idea is still fuzzy?

DESIGN.md assumes you **already have design intent**. It doesn't help you discover it.

Here's the gap:

```
                    ┌─────────────────────────────────┐
                    │  You have intent → write tokens  │  ← format covers
                    └─────────────────────────────────┘
                              ↑
                    ┌──────────────────────────────────┐
                    │  No intent yet → how do you get   │
                    │  to the point of having one?      │  ← not covered
                    └──────────────────────────────────┘
```

For teams with a designer, a design system, and a mature product, the first half isn't a problem. For 0→1 teams and solo developers — it's the whole problem.

---

## 2. The Chain's Answer: Four Rings

The format only covers the second half. To cover the first half, you need a **chain** — from vague idea to concrete values, step by step, each ring solving one specific problem.

### Ring 1: Direction Document — No Concrete Values

First output: a direction document. What's the visual tone? What products are we referencing? What styles are we avoiding?

This phase **intentionally writes zero color values**. This isn't neglect — it's discipline. If you write `#aa3bff` in round one, that hex is probably your "gut feeling," not the result of any reference analysis. It can't survive the question: "Why this purple and not that purple?"

The direction document outputs: tone, reference products, visual mood, anti-cliché checks. All prose, zero concrete values.

(I implemented this step as a "Design Brief" skill in the [ReqForge](https://github.com/zxpmail/ReqForge) framework — a questionnaire plus reference analysis to help users clarify intent. Output is prose only, no hex values.)

### Ring 2: Mockup — Pixel-Level Validation

Build a reviewable visual mockup with design tools (Pencil, Figma, or whatever fits). The value here isn't "making it look good" — it's **turning abstract descriptions into something you can concretely disagree with**:

- "This spacing is too wide" → you can point at it on the mockup
- "This color is wrong" → you can change it
- "This font feels cramped" → you can see it

The gap between what people mean by "clean modern palette" and what they actually approve when they see specific pixels is wider than you think. Ten times wider.

### Ring 3: Post-Approval — Freeze the Values

Only after the mockup passes human review do you enter the value-freeze phase.

"Freeze" means: this color value has survived at least three rounds of validation (direction → pixels → human sign-off). It's no longer one person's gut call.

The frozen spec file becomes the **single source of truth**. Implementers writing UI and reviewers auditing it both read values from this file first. The design tool mockups can keep evolving, but the canonical values live in this one file.

### Ring 4: Verification — Lint, Diff, Export

This is where the standard format shines. The frozen spec can be automated:

```bash
npx -p @google/design.md designmd lint DESIGN.md     # conformance check
npx -p @google/design.md designmd diff DESIGN.md v2  # change tracking
npx -p @google/design.md designmd export --format css-tailwind  # theme export
```

But in the chain's view, this is an **optional exit**, not the entrance. When lint fails, the right response isn't "block the release" — it's "check whether the values went through the three rounds of validation first." Because many projects don't even have UI, and don't need this layer at all.

---

## 3. Format and Chain Are Complementary

They're not competing. They solve different problems, and they need each other.

| Dimension | Format (DESIGN.md) | Chain (four rings) |
|-----------|-------------------|-------------------|
| Core question | How to write values | How to decide values |
| Assumption | You already have design intent | Helps you discover intent |
| Verifiability | CI lint/diff | Mockup review, questioning |
| Change tracking | `designmd diff` | Inter-ring decision records |
| Best for | Mature products, teams with a designer | 0→1 products, solo developers |

Google's DESIGN.md philosophy says: **"specific reference > adjectives."** Write "like a 1970s lecture handout," not "retro style."

The chain says the same thing — it just pushes it one step earlier: if you don't have that "specific reference" yet, go find one before you write tokens.

Both paths discovered the same truth: **concrete beats abstract.** The format demands you write concrete tokens. The chain demands you also make the *source* of those tokens concrete.

---

## 4. When Is the Format Enough?

Fair question. Not every project needs the full chain.

### ✅ Format-only is fine when

- You have a designer or an existing design system
- You're redesigning an existing product — direction is known
- Your team can align on intent through prose alone
- You're using other tools for design output and just need a spec file for downstream consumption

### ❌ Consider running the full chain when

- You're building 0→1 with no reference product
- You're a solo PM + developer with unvalidated design instincts
- Multiple people are involved and everyone's "clean" is a different "clean"
- Your last release was slowed down by design rework

This isn't a quality threshold — it's a **risk threshold**. Skipping the direction phase and writing values directly is a bet that your gut is accurate enough. For some teams and some products, that bet pays off. For most 0→1 scenarios, it doesn't.

---

## 5. Closing

Google's DESIGN.md is an excellent format proposal. It solves a real problem: without a stable source of values, AI agents guess colors, and when enough colors get guessed, your UI turns into a rainbow.

But a format is the destination, not the path.

What makes a value trustworthy isn't a well-defined YAML schema or a passing lint check. It's **being asked "are you sure?" three times** — once in the direction document, once before the mockup, once at mockup approval.

If the answer is the same all three times, the color is probably right.

If you wrote it straight into the spec file on the first pass, you'll never know whether it would have survived the third.

---

*June 2026. A format helps you write it right. A chain helps you be right before you write. You need both — but the order matters.*
