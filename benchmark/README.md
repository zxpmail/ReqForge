# Benchmark: Anti-Slop 规则 vs 锚点范例

测试 Forge 两种 anti-slop 方案对模型生成质量的影响。

## 测试任务

给 todo-cli 添加 `search` 命令，支持按关键词搜索任务标题和按分类筛选。

验收标准：
1. `todo search <keyword>` — 搜索标题包含 keyword 的任务，按分类分组显示
2. `todo search <keyword> --category bug` — 在指定分类中搜索
3. 空结果输出 "No matching todos found."
4. 搜索大小写不敏感
5. 已有功能（add/list/complete/delete）不受影响
6. 新增 search.test.ts，覆盖：正常搜索、空结果、分类筛选、特殊字符

## 两种方案

| 方案 | 参考文件 | 存放位置 |
|------|---------|---------|
| **对照组（旧）** | 9 条 anti-slop 禁止清单 | `benchmark/context-OLD.md` |
| **实验组（新）** | 3 个代码锚点 + 兜底检查 | `benchmark/context-NEW.md` |

## 运行方法

### 对照组

```bash
cat benchmark/context-OLD.md > .benchmark-prompt.md
# 把 .benchmark-prompt.md 的内容 + 下面的测试任务发给 Claude Code
```

### 实验组

```bash
cat benchmark/context-NEW.md > .benchmark-prompt.md
# 把 .benchmark-prompt.md 的内容 + 下面的测试任务发给 Claude Code
```

### 测试任务文本（两组共用）

```
在 todo-cli 中添加 search 命令。
验收标准见 benchmark/task-definition.md。
要求：新增 todo search 和对应测试。
```

## 评分表

| 维度 | 对照组 | 实验组 | 说明 |
|------|--------|--------|------|
| **一次跑通** | pass / fail | pass / fail | `pnpm test` 是否一次通过 |
| **风格一致** | 1-5 | 1-5 | 代码风格跟现有 todo-cli 一致程度 |
| **安全/输入校验** | 有/无 | 有/无 | 搜索输入是否做 basic sanitization |
| **多余抽象** | 有/无 | 有/无 | 有没有 YAGNI 的抽象 |
| **测试覆盖面** | 几个 it | 几个 it | 测试用例数量 |
