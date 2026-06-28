---
title: The Receipt Test
description: "Most CI pipelines run on hope, not evidence. One question — 'receipt?' — separates comfort from proof."
tags: [ai, webdev, productivity, ci-cd]
---

# The Receipt Test

There's a distinction from product methodology that I've found useful far outside product work:

- **Hope**: Conviction not based on any lived experience or user data. Sounds confident, can't produce a receipt.
- **Belief**: Conviction based on real feedback. Can produce a receipt because it comes from something that actually happened.

Most of us, most of the time, are running on Hope — especially when it comes to trusting AI-generated code. We *feel* protected by our code review and CI pipeline — but how many of us can point to a specific instance where it caught a real problem?

This post is about how to tell the difference, and what to do about it when you're on a small team that can't afford enterprise-grade process.

---

## The Receipt Test

Ask yourself this about your current code review or CI pipeline:

> "Has this process ever stopped a real problem?"

If the answer is "I don't know" or "well, it *would* if..." — that's Hope.

If the answer is "yes, last week it caught a SQL injection in generated code" — that's Belief. You have a receipt.

The uncomfortable part: most CI/review setups for small teams fail the receipt test. Not because they're badly designed — because they were inherited from enterprise playbooks that assume resources a 3-person team doesn't have.

The typical response isn't to admit this. It's to add more process: more lint rules, more review steps, more AI-powered "security scanning." Each addition generates output, which *looks* like evidence. But output isn't evidence. A report that's never caught a real issue is comfort, not proof.

I've been on both sides of this. When I asked the receipt question about my own CI pipeline, I found checks I'd assumed were critical had never actually caught a real issue — they just made me *feel* thorough. Cutting them was harder than adding them had been, but the result was a faster pipeline with less noise to ignore.

---

## What Small Teams Actually Do

After watching (and building) several AI-assisted projects, I've noticed a pattern in how small teams unconsciously adapt:

**They compress the feedback loop.** Instead of pre-merge review gates, they rely on post-merge detection. Not because they don't care — because the math works out differently when the review team is you-and-you.

**They accept a different risk profile.** Enterprise risk models assume "one breach" is catastrophic. For a 5-person SaaS, "ship a bug, fix it in 20 minutes, apologize in the changelog" is a survivable failure mode. Different scale, different calculus.

**They trust deployment mechanics over code review.** A one-click rollback is worth more than a 4-hour manual audit, because it changes the cost of being wrong from "incident" to "oops."

These aren't lazy shortcuts. They're rational adaptations to a different constraint set.

---

## Testing Whether Your Process Is Working

Instead of asking "am I following best practices?", ask:

1. **"When was the last time this process changed my behavior?"** — If your lint/CI/review pipeline runs noise (warnings you always ignore, rules you've learned to work around), it's not improving outcomes. It's just burning attention.

2. **"What would break if I removed this step?"** — If the answer is "I'd feel less comfortable" rather than "specific bugs would ship," the step is providing comfort, not protection.

3. **"Does this consume attention from something more important?"** — Every lint warning you read but skip, every CI check you override, every review comment you acknowledge without acting — that's attention stolen from the 1-2 things that actually catch real issues.

These questions are uncomfortable because the honest answer is often: my process is mostly Hope, and I've been maintaining it for the feeling of safety rather than the fact of it.

So what do you do when the honest answer is "mostly hope"? Below are four patterns I've seen work — not exhaustive, but grounded in what actually moves the needle for small teams.

---

## Four Rules of Thumb (Not Rules)

I don't have a framework to sell you. But I've seen these four patterns work consistently across different team sizes:

### 1. One thing at a time

The single highest-leverage practice for small teams is making AI generate small, reviewable units. Not because you'll catch every bug — because a 50-line change you actually read is more trustworthy than a 500-line change you skim.

This isn't a tool feature. It's a habit: before generating code, write down the smallest atomic change that moves the needle. Generate only that.

### 2. Make rollback a one-step action

If rolling back takes more than 30 seconds, you have an incentive to leave bad code in production while you "investigate." That's the most dangerous gap in the system.

Speed of recovery is a better investment for small teams than depth of review. A fast rollback transforms "we shipped a bug" from a crisis into a routine.

### 3. Evidence, not output

A security scanner flags 200 issues — that's *output*. A developer looks at those 200 issues and finds one real vulnerability — that's *evidence*. These are not the same thing, but most teams conflate them.

Once a quarter, review every step in your pipeline with one question: "Has this caught a real issue in the last cycle?" If the answer is "no" for multiple cycles, demote or remove it. Not because it might not catch something someday — but because pipeline attention is finite, and every step that runs on hope is crowding out a step that runs on evidence.

### 4. Kill the noise

Every three months, review your CI and review pipeline. Remove any check that hasn't caught a real issue in the last cycle.

This is harder than adding checks. But running on a few checks that actually fire is better than maintaining many that generate comfort noise.

---

## Closing

The goal isn't to eliminate Hope. Every early-stage project runs on it — you have to, because there aren't enough receipts yet.

The goal is to know which is which. To recognize when a process is producing comfort vs. evidence, and to be honest about the tradeoff.

Your CI pipeline isn't wrong for not catching enough bugs. But if you've never asked it "have you ever actually stopped something?", the answer is probably "no" — and that's useful information too.

**In engineering, the most expensive cost isn't listed in any budget. It's maintaining a process that feels safe but doesn't work, because stopping it feels scarier than keeping it.**

---

*June 2026. One question — "receipt?" — has saved me more time than any other filter I've tried.*
