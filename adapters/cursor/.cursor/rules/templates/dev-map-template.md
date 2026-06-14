# 开发导航地图（dev-map）

> 谁动代码谁改地图。改结构时必须同步更新。
> 安装来源：`core/templates/dev-map-template.md` → 用户项目 `.forge/dev-map.md`（`pnpm forge-install` 写入）

---

## 技术栈

> **必填**。流水线所有 Skill 依赖此节判断构建、测试、lint 命令和代码规范。

- Language: （JavaScript / TypeScript / Java / Python / Go / Rust …）
- Build:    （`pnpm build` / `mvn compile` / `cargo build` …）
- Test:     （`pnpm test` / `mvn test` / `cargo test` …）
- Lint:     （`eslint` / `checkstyle` / `ruff` …）
- Source:   （`src/` / `src/main/java/` / `lib/` …）


## 模块索引

| 模块 | 关键文件 | 说明 | 改动影响链 |
|------|---------|------|-----------|
| _Phase 完成后由 dev-builder 填写_ | | | |

## 已有模式

| 模式 | 位置 | 说明 |
|------|------|------|
| _记录项目中的标准写法、惯用模式_ | | |

## 注意事项

- _记录踩过的坑、不可碰的红线_

---

*dev-map · 开发 Agent 维护，PM 不负责改地图。先搞清这里已经长成了什么样，再下手。*
