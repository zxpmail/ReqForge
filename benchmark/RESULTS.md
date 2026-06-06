# Benchmark Results

## Test Environment

- **Project**: todo-cli（test-demo/todo-cli）
- **Task**: 添加 `search` 命令（5 个测试用例）
- **测试结果**：两组全部通过（6 test files, 26 tests）

## 对比

| 维度 | 对照组（9 条规则） | 实验组（3 个锚点） | 说明 |
|------|-------------------|-------------------|------|
| **一次通过率** | ✅ 一次通过 | ✅ 一次通过 | 无差别 |
| **测试数** | 5 pass | 5 pass | 无差别 |
| **代码行数** | 69 行 | 51 行 | 实验组少 26% |
| **代码复杂度** | 高 | 低 | 见下方分析 |

## 代码差异分析

### 变量命名
```
OLD: const trimmedKeyword = keyword.trim();
NEW: const trimmed = keyword.trim();
```
实验组更简洁——不需要 `trimmedKeyword` 这么长的名字，`trimmed` 在这一步已经足够清晰。

### 搜索逻辑
**OLD：两步过滤**
```typescript
let filtered = todos.filter(t => t.description.toLowerCase().includes(trimmedKeyword.toLowerCase()));
if (category) {
  filtered = filtered.filter(t => t.category === category);
}
```
多了一步判断 + 重新过滤。分类校验还多了一段错误处理（`console.log('Invalid category')`）。

**NEW：一步过滤**
```typescript
const filtered = todos.filter(t => {
  const matchesKeyword = t.description.toLowerCase().includes(lowerKeyword);
  if (!category) return matchesKeyword;
  return matchesKeyword && t.category === category;
});
```
一个循环搞定。`lowerKeyword` 只计算一次（`trimmed.toLowerCase()`），不重复调用。

### 输出分组
**OLD：预建 Map**
```typescript
const grouped: Record<string, typeof todos> = {};
for (const cat of CATEGORY_ORDER) grouped[cat] = [];
for (const todo of filtered) grouped[todo.category]?.push(todo);
// 然后遍历 grouped
```

**NEW：运行时过滤**
```typescript
for (const cat of CATEGORY_ORDER) {
  const items = filtered.filter(t => t.category === cat);
  // 直接输出
}
```
实验组更简单——不需要预建 Map，直接 filter。对于小数据集（todo app）完全够用。

## 结论

两个版本功能等价，所有测试通过。但实验组（锚点法）的代码：

1. **更短** — 51 行 vs 69 行（-26%）
2. **更简单** — 没有预建 Map，没有两步过滤，没有冗余校验
3. **更一致** — 变量命名和循环方式跟 list.ts 的现有风格更接近

**这个 benchmark 不能证明锚点法在所有场景都更好**（样本量 = 1），但在这个具体的 Task 里，锚点法产出的代码确实更干净。

差距不是"一个能用、一个不能用"的级别——是"一个写完能用、另一个写得更干净"的级别。For 一个 50 行的 search 命令，差距不大。但每个文件省 20-30% 的冗余，累计到 100 个文件，差异就拉出来了。
