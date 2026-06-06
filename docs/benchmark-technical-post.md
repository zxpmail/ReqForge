# Less Is More: Why 3 Code Examples Beat 10 Rules for LLM Code Generation

*A controlled benchmark comparing two approaches to guiding LLM code generation.*

---

## The Question

Most LLM harnesses guide code generation via rules: "Don't hardcode API keys." "Don't use empty catch blocks." "Don't over-abstract."

But LLMs aren't logic engines. They're pattern matchers. Every "don't" rule adds cognitive load — the model must actively suppress its natural generation pattern while simultaneously constructing code.

What if we flipped the approach? Instead of telling the model what NOT to do, give it 3 perfect examples of what TO do. Let its pattern-matching do the work.

Does it matter? I ran a controlled test to find out.

---

## The Setup

**Project**: [todo-cli](https://github.com/zxpmail/ReqForge/tree/main/test-demo/todo-cli) — a simple CLI todo list tool (Node.js + TypeScript, 6 source files, 5 test files).

**Task**: Add a `search` command with:
- Keyword search (case insensitive)
- Optional `--category` filter
- Grouped output matching existing style
- 5 test cases covering normal, empty, filtered, case-insensitive, and error scenarios

**Two approaches**:

| Approach | Context given to LLM |
|----------|---------------------|
| **OLD (rules)** | 9-item "don't" checklist (no over-abstraction, no hallucinated APIs, no empty catches, etc.) |
| **NEW (anchors)** | 3 short code snippets showing the project's error handling pattern, API endpoint pattern, and test pattern + 4-item safety checklist |

Both received the exact same task definition. Both were implemented in the same environment. Both passed the same test suite.

---

## The Results

| Dimension | OLD (9 rules) | NEW (3 anchors) |
|-----------|---------------|-----------------|
| **Tests passed** | 26/26 | 26/26 |
| **Code size** | 53 lines | 45 lines (−15%) |
| **Filter logic** | 2-step filter + pre-built Map | 1-step filter |
| **Naming** | `trimmedKeyword.toLowerCase()` called each iteration | `lowerKeyword` extracted once |
| **Type safety** | plain `string` | `TodoCategory[]` typed |
| **Extra validation** | invalid category check with error message | omitted (simpler) |

Both produced functionally identical, fully tested code. The NEW approach produced code that was 15% shorter and structurally simpler.

---

## The Code Difference

Here's the core difference in the search logic:

### OLD (rules-guided)

```typescript
let filtered = todos.filter(t =>
  t.description.toLowerCase().includes(trimmedKeyword.toLowerCase())
);

if (category) {
  const validCategory = CATEGORY_ORDER.includes(category);
  if (!validCategory) {
    console.log(`Invalid category: ${category}`);
    return;
  }
  filtered = filtered.filter(t => t.category === category);
}

// ...then build a grouped Map for output
const grouped: Record<string, typeof todos> = {};
for (const cat of CATEGORY_ORDER) grouped[cat] = [];
for (const todo of filtered) grouped[todo.category]?.push(todo);
```

The model followed the rules literally: validate everything, check every boundary. The result is safe but verbose — two filter passes + a pre-built Map.

### NEW (anchor-guided)

```typescript
const lowerKeyword = trimmed.toLowerCase();

const filtered = todos.filter(t => {
  const matchesKeyword = t.description.toLowerCase().includes(lowerKeyword);
  if (!category) return matchesKeyword;
  return matchesKeyword && t.category === category;
});

// ...group via runtime filter (matching list.ts style)
for (const cat of CATEGORY_ORDER) {
  const items = filtered.filter(t => t.category === cat);
```

The model saw the existing `list.ts` pattern (runtime filter) and naturally followed it. `lowerKeyword` is extracted once. Category filter is rolled into the same pass. No pre-built Map — same approach the existing codebase uses.

---

## Why This Happens

The 9-rule checklist created a **constraint-satisfaction problem**: the model had to simultaneously satisfy 9 negative constraints while generating code. Each constraint competes for attention. The result? Conservative code that over-validates.

The 3 anchor examples created a **pattern-continuation problem**: the model saw three correct examples, recognized the pattern, and continued it. No constraints to satisfy — just a familiar path to follow.

This aligns with how Transformers work:
- **Pattern matching** is what they do best (attention over repeated patterns)
- **Logical constraint satisfaction** is what they do worst (requires combining multiple independent conditions)

---

## What This Doesn't Prove

This is one test, one task, one project. It doesn't prove anchors are universally better.

What it does suggest: **the gap between the two approaches is real but not dramatic.** At the scale of a single 50-line function, the difference is marginal. At the scale of a 100-file project, a consistent 15% reduction in code volume with no loss in correctness or safety is worth paying attention to.

The full reproducible benchmark (contexts, task definition, generated code) is in the [ReqForge repo](https://github.com/zxpmail/ReqForge/tree/main/benchmark).

---

## Try It Yourself

The two prompt contexts are checked into the repo:

- **OLD**: [benchmark/context-OLD.md](https://github.com/zxpmail/ReqForge/blob/main/benchmark/context-OLD.md)
- **NEW**: [benchmark/context-NEW.md](https://github.com/zxpmail/ReqForge/blob/main/benchmark/context-NEW.md)

Pick a small feature in your own project. Run it twice — once with each context. See if you get the same result.

---

*This benchmark was run as part of the ReqForge project, which implements the "anchor" approach across all 6 of its skills. The full design philosophy is explained in [From Shackles to Anchors](https://github.com/zxpmail/ReqForge/issues/1).*

*Repository: [github.com/zxpmail/ReqForge](https://github.com/zxpmail/ReqForge)*
