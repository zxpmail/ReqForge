# From Shackles to Anchors: How I Resurrected an Abandoned Open-Source Framework by Learning to Work *With* AI, Not Against It

*GitHub Finish-Up-A-Thon submission*

---

## The Abandoned Framework

ReqForge is an open-source LLM agent harness — a structured workflow for turning product ideas into shippable code. I started it months ago. It worked, but something was off.

The framework was built on a simple philosophy: **constrain the model enough and it will produce correct code.** Rules. Validators. Checklists. Gates. Every conversation started with a list of "don'ts" — don't over-abstract, don't hallucinate APIs, don't write empty catch blocks, don't use `as any`, don't copy-paste templates...

I had built a framework that spent most of its energy **fighting the model.** And the result was predictable: generated code was correct but stiff. Every new feature required more rules. The framework was becoming a burden.

I shelved it.

---

## The Spark

Then I watched a YouTube video about a 2300-year-old Chinese philosophy text — Zhuangzi's story of Cook Ding, a butcher whose knife never dulls.

Lord Wenhui watches Cook Ding cut up an ox. Other butchers smash through bones, replacing their knife every month. But Ding's blade glides through the ox's body like music. After thousands of oxen, his knife is still sharp.

"How?" asks the lord.

Ding replies: "What I care about is the Way, which goes beyond skill. A good butcher changes his knife every year. An ordinary butcher changes it every month. I've used this knife for 19 years. When I first started, I saw nothing but the whole ox. After three years, I no longer saw the ox — I saw the gaps between joints. Now I meet it with spirit, not with my eyes. My senses stop. My spirit guides the knife."

**I realized: my framework was stuck at "good butcher" level.** I was adding better rules, sharper validators, more gates — better knives — instead of learning to see the gaps.

**The gaps are the model's natural pattern-matching ability.** LLMs aren't logic engines. They're pattern matchers. Every "don't" rule forces the model to suppress its natural generation pattern. Instead of fighting this, I should work *with* it.

---

## The Resurrection: From Shackles to Anchors

I reopened the repo and completely rewrote the design philosophy.

### Before (Shackles)

The framework's code generation guidance looked like this:

```
Checklist:
- [ ] No over-abstraction
- [ ] No hallucinated APIs
- [ ] No hardcoded values
- [ ] No empty catch blocks
- [ ] No copy-paste templates
- [ ] No fake tests
- [ ] No TODO debris
- [ ] No type escapes
- [ ] No style scattering
```

Nine "don't" rules. The model had to recite them while generating, suppressing its natural tendencies simultaneously. Every suppression could fail.

### After (Anchors)

I replaced the checklist with three short code examples — perfect patterns showing the model what TO do:

```typescript
// Anchor 1: Error handling pattern
async function createUser(email: string, password: string): Promise<User> {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(ErrorCode.CONFLICT, "Email already registered");
  }
  const hashed = await bcrypt.hash(password, 12);
  const user = await db.user.create({ data: { email, passwordHash: hashed } });
  logger.info("User created", { userId: user.id });
  return user;
}
```

(Plus API endpoint and test pattern anchors.)

The model reads three perfect examples, its pattern-matching activates, and it naturally continues in the correct style. The checklist stays as a safety net — demoted from generation guide to pre-delivery sanity check.

### The Full Transformation

I made eight interconnected changes in one continuous session with GitHub Copilot:

| Change | Before | After |
|--------|--------|-------|
| **Difficulty markers** | Every task treated equally | 🔴/🟡/🟢 levels — model slows down for hard tasks, speeds through easy ones |
| **Anti-slop reform** | 9 "don't" rules per skill | 3 perfect code anchors + light checklist |
| **Phase 1 catalyst** | First phase starts coding immediately | Lays down domain skeleton first — all subsequent code follows |
| **Self-review** | Code reviewed externally (late) | Self-review in the same hot context (early) |
| **Closing ritual** | Phase ends, move to next | Append discoveries to spec, log decisions, clear context |
| **Attention layout** | Key info buried in the middle | Critical instructions at the end (recency bias) |
| **Auto-rollback** | Manual git checkout | Automatic snapshot restore on verify failure |
| **Security rules** | Scattered across files | One installable template |

I also wrote a **benchmark** to prove the approach works — same task, two approaches, measured results:

| Dimension | Old (9 rules) | New (3 anchors) |
|-----------|---------------|-----------------|
| Tests passed | 26/26 | 26/26 |
| Code size | 53 lines | 45 lines (−15%) |
| Structure | 2-pass filter + Map | 1-pass filter, simpler |

And a **manifesto** explaining the philosophy — [From Shackles to Anchors](https://github.com/zxpmail/ReqForge/issues/1).

---

## How GitHub Copilot Made This Possible

This wasn't a "write 1000 lines of boilerplate" session. It was something more interesting.

The most valuable Copilot interactions weren't code completions — they were **discussions about design philosophy.** I pasted a Chinese subtitle file about Zhuangzi into the conversation. Copilot connected it to LLM harness design. We iterated on the "2.5 layer" concept together — not as master and tool, but as two collaborators refining an idea.

Copilot didn't just generate code. It:
1. **Challenged my assumptions** — when I proposed adding more rules, it pointed out I was building a "good butcher's knife"
2. **Connected disparate ideas** — Zhuangzi's butcher 🠒 Transformer pattern matching 🠒 anchor-based guidance
3. **Generated the code changes** — all 8 framework modifications implemented in one continuous session
4. **Wrote the benchmark** — created the reproducible comparison test
5. **Drafted the philosophy document** — translated Chinese insights into English

The final framework has 236 files in sync across 4 AI client adapters, all 98 unit tests pass, and the generated code is measurably cleaner. But the real transformation was in the design philosophy.

---

## The Result

The project went from an abandoned rule-collection to a coherent, philosophy-driven framework with:

- **4 AI client adapters** (Claude Code, Cursor, OpenCode, Gemini CLI)
- **13 skills** with anchor-based guidance
- **10 sub-agents** for specialized tasks
- **4 project starter templates** for `forge-scaffold init`
- **944 files** in perfect sync across all adapters
- **98 unit tests**, all passing
- **A published design manifesto** with benchmark evidence
- **A GitHub Issue** explaining the philosophy

More importantly, the framework no longer fights the model. It works *with* it.

---

## Links

- **Repository**: [github.com/zxpmail/ReqForge](https://github.com/zxpmail/ReqForge)
- **Design Manifesto**: [Issue #1](https://github.com/zxpmail/ReqForge/issues/1)
- **Benchmark Data**: [benchmark/](https://github.com/zxpmail/ReqForge/tree/main/benchmark)
- **Benchmark Technical Post**: [docs/benchmark-technical-post.md](https://github.com/zxpmail/ReqForge/blob/main/docs/benchmark-technical-post.md)

*Built with GitHub Copilot, from an abandoned repo to a published design philosophy — all in one continuous session.*
