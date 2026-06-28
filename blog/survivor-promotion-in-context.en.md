---
tags: [ai, webdev, productivity, architecture]
---

# Don't Compress, Promote

AI coding has a hidden bottleneck that isn't in the model — it's in how you manage context across sessions.

You finish Phase 1. The codebase grew by 5000 lines. When you start Phase 2, how do you carry "what the AI knows" across?

The common answer today is **Repomix**: compress the entire codebase into one Markdown file, dump it into the prompt. It looks like a solution, but it creates a bigger problem.

---

## Repomix Is a Full GC Heap Dump

A `-XX:+HeapDumpOnOutOfMemoryError` snapshot contains every living object, every dead object, every byte of fragmentation. You *can* fit the whole heap on disk, but loading it, parsing it, and finding the 12 objects you actually care about among thousands — that's the real cost.

In AI context terms:

- 100K-line codebase → Repomix packs it into ~150K tokens → dumped into the prompt
- The AI has to find "the 3 files Phase 2 needs to change" inside 150K tokens
- 150K tokens of latency + attention dilution + key signals buried in boilerplate
- Phase 2 code starts drifting from Phase 1's intent → more corrections needed → more context bloat → **death spiral**

This has a name: **[lost in the middle](https://arxiv.org/abs/2307.03172)**. Accuracy for the middle portion of long contexts drops off a cliff. By feeding the entire 150K-token heap dump, you're guaranteeing the AI forgets the 100K tokens in the middle.

But the deeper issue is:

**Only Full GC dumps need "compression." Promotion doesn't compress — it promotes.**

---

## The JVM Had This Figured Out 25 Years Ago

HotSpot splits memory into three generations:

| Generation | Role | Collection Strategy |
|-----------|------|-------------------|
| **Eden** | Where new objects are born | Most die in Minor GC; survivors get promoted |
| **Survivor (S0/S1)** | Objects that survived 1+ GC cycles | Copied between S0/S1, age increments each round |
| **Tenured (Old)** | Long-lived objects promoted from Survivor | Collected rarely (Major GC) |

This maps perfectly to the lifecycle of information in a codebase during AI-assisted development:

```
Phase completed → what survives goes to next phase
     │
     ├─ Eden code (90%)             → DON'T carry forward
     │    Scaffolding, boilerplate, temp solutions, experiments
     │
     ├─ Survivor (9%)               → PROMOTE to context
     │    Interfaces, types, domain models validated by this phase
     │
     ├─ Broken assumptions          → LOG to assumption registry
     │    "PostgreSQL doesn't support this full-text search syntax"
     │    "This library behaves differently on Windows paths"
     │
     └─ Known technical debt        → TAG explicitly, don't forget
          "Phase 3 must refactor the auth provider"
```

The difference isn't compression — it's **promotion**. You don't need to flatten the entire heap. You only need to upgrade the surviving objects to the next generation's context.

---

## How to Promote (Takeaway Template)

### At Phase End: Three Questions

**Q1: Which data structures and interfaces proved their long-term value?**
→ Promote the declarations, not the implementations.

```markdown
# Core Domain (promoted from Phase 1)
- User: { id, email, hashedPassword, displayName }
  invariant: email globally unique, validated on create
- Book: { id, title, isbn, ownerId, status }
  invariant: status ∈ {reading, finished, abandoned}
```

**Q2: Which assumptions got broken?**
→ One line each. The next phase shouldn't relearn them.

```markdown
# Assumption Changes
- "DB connection pool default of 10 is enough" ❌ bumped to 25
- "Vercel free tier supports 100MB responses" ❌ added pagination
```

**Q3: What's knowingly left undone?**
→ Tag it explicitly so it survives the phase boundary.

```markdown
# Carried Debt
- [ ] Phase 3: Migrate auth from JWT session to OAuth2
      Rationale: MVP first, third-party login required in Phase 3
```

### At Phase Start: Only Load Promoted Data

```
Phase N context
├── Product spec (confirmed, not draft)
├── Core domain (promoted types + invariants)
│     ├── Survivor interfaces / domain models
│     ├── Assumption change log
│     └── Carried debt tags
└── Phase N goals (from development plan)
```

No Repomix dump. No full session history from the previous phase. No design docs you already finished reasoning through.

**Token comparison:**

| Approach | Tokens | Attention Profile |
|----------|--------|------------------|
| Full Repomix dump | ~100K-500K | Diluted globally, key signals drowned |
| Promotion-based load | ~3K-10K | Concentrated on what this phase actually needs |

That's two orders of magnitude.

---

## Repomix and Promotion Aren't Mutually Exclusive

Compression solves a *transport* problem: "can the whole codebase fit in context?"

Promotion solves a *selection* problem: "what does the next phase actually need?"

Repomix is fine for cross-reference lookup — keep it as a collapsible reference that the AI reads *on demand*. But it shouldn't be the foundation of every phase start. The foundation should be promoted knowledge.

The right prompt structure:

```
[Phase context] — promoted interfaces + phase goals       (3K-10K tokens)
[Change files] — the 3-5 files this phase modifies        (10K-20K tokens)
[Repomix dump] — optional, for cross-reference lookup     (collapsible)
```

The AI's attention stays on the most critical signals: what survived from before, and what needs to change now. The full codebase becomes an on-demand reference, not mandatory reading.

---

## Closing

Repomix solves a real problem (the codebase doesn't fit in context), but it chooses the wrong answer: a bigger dump instead of a smarter filter. In JVM terms, it's choosing more frequent Full GCs over generational collection.

And any engineer who's tuned a JVM knows: **the generational hypothesis holds** — most objects die young. The few that survive are worth promoting.

Codebase information follows the same pattern:

- **90%** is Eden — written once, never needed again
- **9%** is Survivor — promoted each phase
- **1%** is Tenured — core domain model, changes rarely

You don't need compression. You need to **recognize the 10% worth keeping**.

---

*June 2026. Inspiration from JVM generational GC — the original "promote, don't compress."*
