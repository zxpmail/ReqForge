# 3 Anchors vs 9 Rules: What a Controlled Benchmark Taught Me About Prompting LLMs

*A single comparison is a story. Thirty runs are data. Here's why they disagreed.*

---

## The Question

Most LLM coding frameworks guide generation through rules: "Don't hardcode API keys." "Don't use empty catch blocks." "Don't over-abstract."

But LLMs aren't logic engines — they're pattern matchers. Every "don't" adds cognitive load: the model must suppress its natural generation pattern while simultaneously constructing code.

What if instead of telling the model what NOT to do, you gave it 3 perfect examples of what TO do? Let its pattern-matching do the work.

I ran a head-to-head comparison to find out. The short version: **it depends on how you measure.**

---

## The Spark: One Shot That Looked Promising

In an initial single-shot comparison on a [todo-cli](https://github.com/zxpmail/ReqForge/tree/main/test-demo/todo-cli) project (TypeScript, 6 source files, 5 test files), I gave the model the same task — add a `search` command — with two different contexts:

| Approach | Context |
|----------|---------|
| **OLD (rules)** | 9-item "don't" checklist (no over-abstraction, no hallucinated APIs, no empty catches, etc.) |
| **NEW (anchors)** | 3 short code snippets showing the project's error handling, API endpoint, and test patterns + 4-item safety checklist |

### The Code Difference

**OLD (rules-guided):**

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

const grouped: Record<string, typeof todos> = {};
for (const cat of CATEGORY_ORDER) grouped[cat] = [];
for (const todo of filtered) grouped[todo.category]?.push(todo);
```

The model followed the rules literally — validate everything, check every boundary. Safe but verbose: two filter passes + a pre-built Map.

**NEW (anchor-guided):**

```typescript
const lowerKeyword = trimmed.toLowerCase();

const filtered = todos.filter(t => {
  const matchesKeyword = t.description.toLowerCase().includes(lowerKeyword);
  if (!category) return matchesKeyword;
  return matchesKeyword && t.category === category;
});

for (const cat of CATEGORY_ORDER) {
  const items = filtered.filter(t => t.category === cat);
```

The model saw the existing `list.ts` pattern and naturally continued it: `lowerKeyword` extracted once, category filter in the same pass, runtime filter matching existing style.

**Result**: Both passed all 26 tests. The anchor version was 15% shorter (45 vs 53 lines) and structurally simpler. This is the result most people would publish — and many do.

But one comparison isn't a benchmark.

---

## The Controlled Experiment

I set up a proper harness (`benchmark/run.mjs`) and ran 30 code generations (n=10 per variant) on a more complex task: **adding an async data export system** (submit, validate, format JSON/CSV, filter) to an existing Express API, evaluated against 35 extended tests.

| Variant | Context | # Runs |
|---------|---------|:------:|
| V1 | 3 anchor snippets only | 10 |
| V2 | 6 generalized rules only | 10 |
| V3 | both anchors and rules | 10 |

All runs used the same model (xopglm51 via XFYun MaaS, temperature 0.3). No API errors. All code compiled.

### What the Data Says

| Metric | V1 (anchors) | V2 (rules) | V3 (both) |
|--------|:------------:|:----------:|:---------:|
| **Tests passed (max 35)** | 30.5 ± 1.6 | **33.9 ± 2.3** | 34.0 ± 2.1 |
| **Perfect scores** | 1/10 | 8/10 | 8/10 |
| **Code lines** | 155 ± 4 | 168 ± 15 | 166 ± 9 |
| **Compiles** | 100% | 100% | 100% |

The result surprised me: **rules outperformed anchors on test pass rate** by a mean of 3.4 percentage points. 8 out of 10 rule-guided runs scored perfectly, versus 1 out of 10 anchor-guided runs.

The anchor code was still shorter on average (155 vs 168 lines), replicating the pattern from the single-shot comparison. But shorter code didn't translate to higher correctness.

Adding rules on top of anchors (V3) didn't improve over rules alone — V2 and V3 are essentially identical (33.9 vs 34.0).

### Why the Single Shot Misled

The todo-cli task was simple enough that both variants produced fully passing code. The difference was purely stylistic (shorter vs more defensive). On the harder express-export task (more functions, more edge cases), the rules' defensive coding paid off — the anchor variant consistently missed required edge-case handling.

The single shot showed a real difference but drew the wrong lesson: shorter != better.

---

## Lessons for Benchmarking

### 1. Never trust n=1

A single comparison can show you a real difference — the code style difference between anchors and rules is genuinely interesting. But whether that difference helps or hurts correctness requires many runs. Both the article I almost published and the fraud I avoided are built from the same raw material: a single data point.

### 2. The control you're missing matters

The biggest gap in this experiment wasn't anchors vs rules — it was the absence of a bare baseline (task-definition only, no extra context). Without it, I can't tell whether the 3.4pp gap between anchors and rules reflects a true difference in format, or just random variation around the presence of any extra context.

### 3. Model and task ceilings are real

xopglm51 passed 87-100% of tests regardless of variant on most tasks. On three probe tasks (n=3 per variant, 3 tasks), both anchors and rules passed every test. When the model is capable enough to compensate for prompt deficiencies, you need harder tasks or different metrics to see signal.

### 4. Format matters less than the literature suggests

Across 7 tasks and ~80 generations, the difference between anchor-guided and rule-guided code on test pass rate was 0-3.4pp. Both formats produced working code. The presence of relevant context may matter more than its format.

---

## What I'd Do Differently

1. **Establish a bare baseline first** — run task-definition only before adding any extra context
2. **Pre-register effect sizes** — decide what difference is meaningful before running, not after
3. **Use harder tasks** — find tasks where baseline performance is ~50%, so there's room for either direction
4. **Multiple models** — one model's ceiling is another model's differentiator

---

## The Honest Conclusion

Anchors and rules produce measurably different code:
- **Anchor-guided code** is shorter and structurally closer to existing project patterns
- **Rule-guided code** is longer but more thorough on edge cases

On test pass rate, the difference is small (0-3.4pp) and not consistently directional. On this model and task, rules held a moderate advantage. On simpler tasks, there was no difference.

The question "which is better" is less useful than "which is better for this model, this task, and this measure." The next benchmark should be designed to answer that.

---

*The full reproducible benchmark (context files, task definitions, generated code, raw results) is in the [ReqForge repo](https://github.com/zxpmail/ReqForge/tree/main/benchmark). The post-mortem analysis with all caveats is at [docs/benchmark-lessons-learned.md](https://github.com/zxpmail/ReqForge/blob/main/docs/benchmark-lessons-learned.md).*
