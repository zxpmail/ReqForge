# 反 AI 味清单（release-builder）

<!-- 发布前自检，避免「编译过了就上线」的草率发布。 -->

[Anti–AI-Slop Checklist]

勾选通过后再 publish；任一项为「是」须补充步骤或阻塞发布。

| 检查项 | 通过标准 |
|--------|----------|
| 唯编译论 | 非「build 成功=可发布」——已执行 smoke test 验证核心流程 |
| 隐私泄漏 | 未在构建产物中发现 `/Users/`、`C:\Users\`、`API_KEY`、`sk-ant-` |
| 版本错位 | package.json + git tag + artifact name 三者一致 |
| 跳过回滚 | 未定义回滚策略——出了问题怎么还原？几分钟？ |
| 依赖漏洞 | 未执行 `npm audit` 或等效检查——存在 critical/high 漏洞须阻塞 |
| 环境漂移 | 「我机器上能跑」= 未检查环境一致性——OS/运行时/依赖版本已对齐 |
| 缓存污染 | 增量构建可能携旧文件——有疑问时 `rm -rf dist && build` |
| 无变更日志 | CHANGELOG.md 未更新——用户看不到本次发布内容 |
