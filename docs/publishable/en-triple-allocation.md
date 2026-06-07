---
title: Smarter Resource Allocation Beats Stronger Models
published: false
description: Why AI code review quality depends more on search strategy than model tier — and how GC-style audit zoning + anchor-based prompting beat both.
tags: ai, coding, architecture, engineering, productivity
---

# Smarter Resource Allocation Beats Stronger Models

You ask Sonnet to review code it just wrote. It says looks good. You ask Opus to review the same code. Opus finds half a dozen issues.

It's tempting to conclude Opus is just smarter. But if you reverse the experiment — let Opus write the code and ask Sonnet to review — Sonnet still misses things. The two models share nearly the same training data and architecture. What's actually different?

The answer isn't capability. It's **search strategy**.

## Search Depth > Model Capability

Two radiologists read the same CT scan:

- **Intern**: glances at it. "No obvious abnormalities."
- **Attending**: follows a fixed sequence — mediastinum → hilum → lung parenchyma → pleura → bone windows. Finds a 3mm nodule in the lower left quadrant.

The attending isn't sharper-eyed. She has a **protocol**.

Opus is the same. It doesn't think harder than Sonnet — it searches more systematically. It walks every conditional branch. It constructs boundary inputs. It questions its own assumptions. The difference isn't raw reasoning — it's how attention gets allocated.

A model's attention is a finite resource. How you spend it matters more than whether you upgrade to the next tier.

This breaks into two concrete problems: **when to inspect**, and **what to show the model**. A third is meta: **where do these rules live so they survive a platform switch?**

---

## 1. When to Inspect: GC-Inspired Audit Routing

### Why the writer shouldn't review their own code

When I write code, my attention traces a path: A → B → C. When I review it, I trace the same path. I don't magically discover branch D that I never considered. This is the **same-model blind spot**.

The model does the same thing. It walks the path it just wrote. It doesn't know what it doesn't know.

The naive fix is "use a stronger model for review." That doubles inference cost and doesn't solve the root problem: the review has no strategy.

### The GC insight

JVM garbage collection has a key design decision: not all objects need equal scan frequency. Freshly allocated objects (Eden) are volatile — scan them often. Objects that survive multiple GC cycles (Old Generation) have proven stable — scan them rarely.

Code review is the same. Not every code change needs a full regression.

| Zone | Development Equivalent | Review Strategy |
|------|----------------------|----------------|
| **Perm Gen** | Configuration, specs, skill definitions | Full review on every change |
| **Old Gen** | Stable phases (unchanged through N subsequent phases) | Low frequency, regression only |
| **New Gen** | Recent 1-2 phases | High frequency, every new phase |
| **Eden** | Just-written code | Full review immediately |

Making this work requires two things:

**A change tracking card.** Every phase outputs a card after completion:

```
Phase N Change Card
  ├─ Interface changed: userService.getProfile() — return type changed
  ├─ Files changed: src/services/profile.ts
  ├─ Global state affected? Yes/No
  └─ Consumers: Phase 1 (calls getProfile)
```

The card drives audit routing:

```
Impact = 0 new interfaces                      → Skip
Impact ≤ 2 phases (local interface change)     → Minor GC: self-review + review direct dependents
Impact ≤ 5 phases (shared module changed)      → Major GC: full review of all affected phases
Global state changed                           → Full GC: complete regression
```

**An assumption registry.** Every phase records three things on completion:

```
1. What did I assume won't happen?
2. If this assumption breaks, what breaks?
3. Which interfaces/state/behaviors did I change?
```

Subsequent phases read the registry before writing code. If new work breaks an old assumption, the conflict must be resolved explicitly — not silently overwritten.

---

## 2. What to Show the Model: Anchors Over Rules

"When to inspect" is about resource scheduling. More fundamental is: **what do we put in the model's input? If attention is finite, what gets the scarce real estate?**

### Why prohibitions are weak

Traditional prompt engineering relies on prohibitions: "Don't use standard Markdown links." "Don't forget edge cases." "Don't create duplicate code."

But a model is a pattern-matching system, not a command executor. Reading "don't use X" activates the X pattern. The more prohibitions you pile on, the more each one is diluted. Ten rules don't work ten times better than one — they work worse.

### Anchors

The alternative is: **give the model examples instead of rules.**

Don't tell it "don't use standard Markdown links." Show it a file with the correct Obsidian-style links.

Don't tell it "check boundary conditions before writing logic." Ask it to fill out a truth table of all state combinations before touching code.

This is the core of what I've been calling the "2.5 layer" approach — between the spec (what to build) and the implementation (how to build it), there's a middle layer of **anchors** that show the model what correct output looks like for this specific project.

Steph Ango's obsidian-skills project (33K stars) is a clean public example. He didn't write "don't use `[]()` format links" — he shipped a `.md` file with correct syntax. The model reads it and learns. Cheaper than rules, and more effective.

### A concrete example

In practice, one of the most effective anchors has been an auto-generated UI specification file — a YAML document produced by the design step and consumed by the implementation step. It lists every page, its components, their states (loading/empty/error/edge), and responsive breakpoints. The model reads this before generating UI code.

Before this anchor, the model would guess pixel values, invent component names, and skip error states. Not because it was "bad" — because it had no project-specific reference. The anchor didn't add a single rule. It just changed the distribution of what the model saw, which changed what it generated.

---

## 3. Where These Rules Live

The first two sections define strategy. But strategy dies if it's locked into a single platform's format.

The trap is writing audit routing or specification checklists inside a `workflow.md` file — because `workflow.md` is typically a platform plugin, read on demand. Switch from Claude Code to OpenCode, Cursor, or Gemini CLI, and it breaks.

The fix is: **write decision tables in platform-agnostic reference files.** The workflow references them but doesn't implement them.

```
Platform-specific workflow:
  "Phase complete → read gc-audit-routing.md → execute audit per decision table"

Platform-agnostic reference (gc-audit-routing.md):
  Defines the decision rules only — no agent() calls, no platform-specific hooks
```

Each platform adapter decides how to execute. The decision logic itself lives in one place.

This generalizes to a principle: **decisions about how to decide don't belong in workflow scripts.** Workflow scripts handle sequencing of steps. Decision criteria go in reference documents.

---

## Putting It Together

| Problem | Resource | Common Approach | Better Approach |
|---------|----------|----------------|-----------------|
| When to inspect | Attention | Uniform coverage or stronger model | GC zoning: allocate attention by impact scope |
| What to show | Input samples | Prohibition stacking | Anchors: shape output through input distribution |

Both problems share the same premise: **a model's compute is finite. The engineering lever is allocation strategy, not raw capability.**

This isn't a philosophical claim — it's an engineering constraint. A code review burns a few thousand tokens of inference. Spreading that budget uniformly across every file is less effective than concentrating it on Eden-zone and cross-generation changes. Shoving raw requirement text into context is less effective than putting structural anchors at attention-relevant positions.

Consequences follow naturally:
- Don't buy a stronger model to catch more bugs — spend existing attention where bugs actually hide
- Don't write more prompt rules — give the model better examples
- Don't reimplement review logic for every platform — put the decision table in the middle, let platforms execute

Models change every year. Attention allocation and sample distribution principles don't.

---

*This article is based on work from an open-source framework project. The GC-audit routing and platform-independent decision patterns are available as feature proposals in the repository.*
