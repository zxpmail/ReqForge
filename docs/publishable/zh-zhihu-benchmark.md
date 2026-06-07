# 少即是多：为什么 3 个代码范例比 10 条规则更有效

> 一个控制变量实验：9 条审查规则 vs 3 个代码锚点，同样的 Task，结果差多少？

---

## 问题

大多数 AI 编码框架通过规则来引导模型：「不要硬编码 API Key」「不要用空 catch」「不要过度抽象」。

但模型不是逻辑引擎——它是模式匹配系统。每一条「不要」都在增加认知负载：模型必须在抑制自然的生成倾向的同时构造代码。每一条抑制都可能是失败点。

如果反过来呢？不给模型列「不要做什么」，给它 3 个完美的「该怎么做」范例——让模式匹配自己干活。

我跑了一个控制变量测试来找答案。

## 实验设置

**项目**：[todo-cli](https://github.com/zxpmail/ReqForge/tree/main/test-demo/todo-cli)——一个简单的 CLI 待办列表工具（Node.js + TypeScript，6 个源文件，5 个测试文件）。

**任务**：添加一个 `search` 命令，要求：
- 关键字搜索（不区分大小写）
- 可选的 `--category` 过滤
- 分组输出，匹配现有风格
- 5 个测试用例覆盖正常、空结果、过滤、大小写不敏感、错误场景

**两组对照**：

| 组别 | 上下文内容 |
|------|-----------|
| **旧方式（规则）** | 9 条「不要」检查清单（不要过度抽象、不要幻觉 API、不要空 catch 等）|
| **新方式（锚点）** | 3 段简短代码范例（项目的错误处理模式、API 模式、测试模式）+ 4 条兜底检查 |

两组收到完全相同的任务定义，在同一环境中实现，通过同一测试套件。

## 结果

| 维度 | 旧方式（9 条规则） | 新方式（3 个锚点） |
|------|-------------------|-------------------|
| 测试通过 | 26/26 | 26/26 |
| 代码行数 | 53 行 | 45 行（−15%）|
| 过滤逻辑 | 2 步过滤 + 预建 Map | 1 步过滤 |
| 命名 | `trimmedKeyword.toLowerCase()` 每次调用 | `lowerKeyword` 提前提取一次 |
| 类型安全 | 纯 `string` | `TodoCategory[]` 类型标注 |
| 额外验证 | 无效 category 检查 + 错误提示 | 省略（更简洁）|

两组产出功能完全等价、全部测试通过。新方法的代码短了 15%，结构更简单。

## 代码对比

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

// 然后用预建 Map 分组输出
const grouped: Record<string, typeof todos> = {};
for (const cat of CATEGORY_ORDER) grouped[cat] = [];
for (const todo of filtered) grouped[todo.category]?.push(todo);
```

模型严格按照规则执行：验证一切、检查每个边界。结果安全但啰嗦——两次 filter + 一次预建 Map。

**新方式（锚点引导）：**

```typescript
const lowerKeyword = trimmed.toLowerCase();

const filtered = todos.filter(t => {
  const matchesKeyword = t.description.toLowerCase().includes(lowerKeyword);
  if (!category) return matchesKeyword;
  return matchesKeyword && t.category === category;
});

// 运行时 filter 分组（匹配现有 list.ts 风格）
for (const cat of CATEGORY_ORDER) {
  const items = filtered.filter(t => t.category === cat);
```

模型看到现有的 `list.ts` 模式（运行时 filter），自然续写了同样的风格。`lowerKeyword` 提前提取一次。Category 过滤合并在同一趟遍历里。没有预建 Map——跟已有代码的做法一致。

## 为什么

9 条规则检查清单给模型制造了一个**约束满足问题**：它要在满足 9 条负面约束的同时生成代码。每条约束都在争夺注意力。结果就是保守的、过度验证的代码。

3 个锚点范例则是一个**模式续写问题**：模型看到三个正确范例，识别模式，然后续写。没有需要满足的约束——只有一条熟悉的路径要走。

这跟 Transformer 的工作方式吻合：
- **模式匹配**是它最擅长的（在重复模式上聚焦注意力）
- **逻辑约束满足**是它最不擅长的（需要组合多个独立条件）

## 这不能证明什么

这是一次测试、一个任务、一个项目。不能证明锚点在任何场景下都更好。

但它提示了一个方向：两种方式的差距是真实的，但不是戏剧性的。在单个 50 行函数的尺度上，差异微不足道。在 100 个文件的尺度上，一致减少 15% 的代码量且不损失正确性和安全性——这值得关注。

完整的可复现基准测试（上下文、任务定义、生成代码）在 [ReqForge 仓库](https://github.com/zxpmail/ReqForge/tree/main/benchmark)。

## 你自己试试

两个 prompt 上下文已提交到仓库：
- **旧方式**：[benchmark/context-OLD.md](https://github.com/zxpmail/ReqForge/blob/main/benchmark/context-OLD.md)
- **新方式**：[benchmark/context-NEW.md](https://github.com/zxpmail/ReqForge/blob/main/benchmark/context-NEW.md)

在你自己的项目里选一个小功能，分别用两种上下文各跑一次。看看是否得出同样的结果。

---

*项目地址：https://github.com/zxpmail/ReqForge*
