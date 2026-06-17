# 编码约束

实现功能时，必须遵守以下约束：

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
