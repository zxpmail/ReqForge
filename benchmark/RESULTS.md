# Benchmark Results

## Test

todo-cli 添加 search 命令，两种上下文各生成一次。

## 结果

| 维度 | OLD（9条规则） | NEW（3个锚点） |
|------|---------------|---------------|
| 一次通过 | ✅ 26/26 测试通过 | ✅ 26/26 测试通过 |
| 代码行数 | 53 行 | 45 行（−15%） |
| 过滤逻辑 | 2 步过滤 + 预建 Map 分组 | 1 步过滤 + 运行时 filter |
| 命名 | `trimmedKeyword.toLowerCase()` 每次调用 | `lowerKeyword` 提取一次 |
| 类型安全 | 纯 string | `TodoCategory[]` 类型标注 |

## 关键差异

OLD 版本多了一个无效分类校验（`console.log('Invalid category')`），以及一个预建的 grouped Map。NEW 版本用 `filtered.filter(t => t.category === cat)` 替代了 Map，更简单、跟 list.ts 风格更一致。

两个版本功能等价。差距不是"能用 vs 不能用"，是"干净 vs 更干净"。
