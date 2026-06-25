# 3 个代码范例 vs 9 条规则：一个受控基准测试教会我的事

*一次对比是故事。三十次运行是数据。为什么它们给出了不同的答案。*

---

## 问题

大多数 AI 编码框架通过规则来引导模型：「不要硬编码 API Key」「不要用空 catch」「不要过度抽象」。

但 LLM 不是逻辑引擎——它是模式匹配系统。每一条「不要」都在增加认知负载：模型必须在抑制自然生成倾向的同时构造代码。

如果不列「不要做什么」，而是给模型 3 个完美的「该怎么做」范例呢？让模式匹配自己干活。

我跑了一个对照测试来找答案。结论是：**取决于你怎么测量。**

---

## 缘起：一次看起来不错的单次对比

在一个简单的 [todo-cli](https://github.com/zxpmail/ReqForge/tree/main/test-demo/todo-cli) 项目（TypeScript，6 个源文件，5 个测试文件）上，我给模型相同的任务——添加 `search` 命令——但搭配了两组不同的上下文：

| 方式 | 上下文 |
|------|--------|
| **旧（规则）** | 9 条「不要」检查清单 |
| **新（锚点）** | 3 段代码范例（错误处理、API 风格、测试模式）+ 4 条兜底检查 |

### 代码差异

**旧方式（规则引导）：**

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

模型严格执行规则——验证一切、检查每个边界。安全但啰嗦：两次 filter + 预建 Map。

**新方式（锚点引导）：**

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

模型看到现有的 `list.ts` 模式，自然续写：`lowerKeyword` 提前提取一次，category 过滤合并在同一趟，用运行时 filter 替代 Map。

**结果**：两组全部 26 个测试通过。锚点版本短了 15%（45 vs 53 行），结构更简洁。大部分人看到这个就会发文章——实际上很多人就是这么做的。

但一次对比不是基准测试。

---

## 受控实验

我搭建了一个正式的测试框架（`benchmark/run.mjs`），在更复杂的任务上跑了 30 次代码生成（每个变量 10 次）：给已有的 Express API 添加**异步数据导出系统**（提交、验证、格式化 JSON/CSV、过滤），用 35 个扩展测试评估。

| 变量 | 上下文 | 次数 |
|------|--------|:----:|
| V1 | 3 段锚点范例 | 10 |
| V2 | 6 条通用规则 | 10 |
| V3 | 锚点 + 规则合并 | 10 |

全部使用同一模型（xopglm51 via XFYun MaaS, temperature 0.3）。无 API 错误。全部编译通过。

### 数据

| 指标 | V1（锚点） | V2（规则） | V3（合并） |
|------|:---------:|:---------:|:---------:|
| **测试通过（满分 35）** | 30.5 ± 1.6 | **33.9 ± 2.3** | 34.0 ± 2.1 |
| **满分次数** | 1/10 | 8/10 | 8/10 |
| **代码行数** | 155 ± 4 | 168 ± 15 | 166 ± 9 |
| **编译通过率** | 100% | 100% | 100% |

结果出乎意料：**规则组的测试通过率比锚点组高 3.4 个百分点。** 10 次中有 8 次拿到满分，而锚点组只有 1 次。

锚点的代码仍然更短（155 vs 168 行），与单次对比的模式一致。但更短的代码没有带来更高的正确性。

在规则之上叠加锚点（V3）没有带来提升——V2 和 V3 的结果几乎相同（33.9 vs 34.0）。

### 为什么单次对比会误导

todo-cli 任务足够简单，两组都能全通过。差异纯属风格（更短 vs 更防御性）。在更难的 express-export 任务（更多函数、更多边界情况）上，规则的防御性编码带来了实际收益——锚点版本持续遗漏了必要的边界处理。

单次对比展示了一个真实差异，但推导了错误的结论：**更短不等于更好。**

---

## 基准测试的教训

### 1. 永远不要信任 n=1

一次对比能展示真实差异——锚点和规则产生的代码风格差异确实有意思。但它是好是坏需要很多次运行才能判断。那篇我差点发出去的文章和这篇诚实复盘，素材一模一样：一个数据点。

### 2. 缺少的对照组最重要

这个实验最大的缺口不是锚点 vs 规则——是没有裸基线（只有任务定义，没有任何额外上下文）。没有它，我无法判断 3.4pp 的差距是格式的真实差异，还是「有额外上下文」这件事本身的随机波动。

### 3. 模型和任务的天花板真实存在

在大多数任务上，xopglm51 不管用什么变量都通过了 87-100% 的测试。在三个探针任务上（每个变量 n=3，共 3 个任务），锚点和规则全部通过。当模型足够强、能弥补 prompt 的不足时，你需要更难的任务或不同的指标才能看到信号。

### 4. 格式的重要性可能低于文献所说

在 7 个任务、约 80 次生成中，锚点和规则在测试通过率上的差异是 0-3.4pp。两种格式都能生成可工作的代码。**有相关上下文可能比上下文用什么格式更重要。**

---

## 下次会怎么做

1. 先跑裸基线——只给任务定义，不加任何额外上下文
2. 预注册效应量——在跑之前决定多大的差异才有意义
3. 用更难的任务——找基线 ~50% 的任务，给两个方向都留空间
4. 多模型测试——一个模型的天花板是另一个模型的放大器

---

## 诚实结论

锚点和规则产生可测量的不同代码：
- **锚点代码更短**，更贴近项目现有模式
- **规则代码更长**，但边界处理更全面

在测试通过率上，差异很小（0-3.4pp），方向不一致。在这个模型和任务上，规则有中等优势。在简单任务上，没有差异。

「哪个更好」不如「在这个模型、这个任务、这个指标上，哪个更合适。」下一个基准测试应该为回答这个问题而设计。

---

*完整的可复现基准测试（上下文文件、任务定义、生成代码、原始结果）在 [ReqForge 仓库](https://github.com/zxpmail/ReqForge/tree/main/benchmark)。带全部限制条件的复盘分析在 [docs/benchmark-lessons-learned.md](https://github.com/zxpmail/ReqForge/blob/main/docs/benchmark-lessons-learned.md)。*
