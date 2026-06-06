# 编码上下文（对照组 — 规则约束法）

## 已有代码概览

项目：todo-cli，Node.js + TypeScript。
代码在 `test-demo/todo-cli/` 下。已有命令：add, list, complete, delete。
类型定义在 `src/types.ts`，存储逻辑在 `src/storage.ts`。
测试使用 Vitest，在 `src/__tests__/` 下。

## 编码约束

下表是编码前必须回顾的反 AI 味清单。每一条都必须在生成代码时主动遵守：

| 检查项 | 通过标准 |
|--------|----------|
| 过度抽象 | 非为「未来需求」预建 Factory/Strategy/interface——YAGNI |
| 幻觉 API | 使用的 API/方法在依赖中真实存在，非「应该有这个方法」 |
| 魔法值硬编码 | 非数字/字符串直接写在业务逻辑中——已提取为常量 |
| 空 catch | catch 块非空或只 `console.error`——有错误处理和用户反馈 |
| 复制粘贴模板 | 非从一个模块复制代码到另一个模块仅改变量名——已提取公共逻辑 |
| 虚假测试 | 测试非 `expect(true).toBe(true)` 或只测了 happy path |
| 注释废料 | 无 `// TODO: fix later`、`// This is a workaround` 等遗留标记 |
| 类型逃生 | 无 `as any`、`@ts-ignore`——除非有注释解释 |
| 样式散射 | 非全页面分散写 tailwind class——遵循项目样式约定 |

## 任务

实现 todo-cli 的 search 命令。详细需求见 `benchmark/task-definition.md`。
