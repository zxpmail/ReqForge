# Forge 速查（Quickref）

> 人类与 Agent 的一页索引。详细流程在对应 Skill 的 `SKILL.md`；本文件不替代按需加载。
> 安装来源：`core/templates/forge-quickref.md` → 用户项目 `.forge/quickref.md`（`pnpm forge-install` 写入）

---

## 当前进度（打开即看）

| 文件 | 含义 |
|------|------|
| `Product-Spec.md` | 产品需求（无则先 `/product-spec-builder`） |
| `.forge/spec-confirmed.json` | Spec 已书面确认 |
| `DEV-PLAN.md` | 开发计划（无则 `/dev-planner`） |
| `.forge/plan-confirmed.json` | Plan 已书面确认 |
| `.forge/implementer-session.json` | implementer 子 Agent 正在写业务代码 |

---

## Karpathy 四原则（快照）

| # | 原则 | 一句话 |
|---|------|--------|
| 1 | Think Before Coding | 不猜；有歧义先问；有 tradeoff 先摆 |
| 2 | Simplicity First | 最少代码；不写未来抽象 |
| 3 | Surgical Changes | 只改必须改的 |
| 4 | Goal-Driven Execution | 可验证成功标准；测试/检查循环直到通过 |

详情 → `.claude/skills/*/SKILL.md` 内 Behavior Rules，或框架文档 `behavior-rules.md`

---

## 任务级纪律（八条摘要）

1. 先计划，批准再动手  
2. 改前先读  
3. 别重复造轮子 / 最小 diff  
4. 不确定先问  
5. 转向先确认  
6. 计划外问题只报告  
7. 提交前展示 diff、用户批准  
8. **验证循环**：实施 → 跑最小验证集 → 失败则修 → **重新跑** → 全过才算 DONE  

完整版 → `session-execution-discipline.md`（适配器 `templates/` 或 `core/docs/`）

---

## 常见反模式（勿做）

| 反模式 | 后果 |
|--------|------|
| 无验证命令输出就宣称完成 | Sloppiness Gate / 违反 Goal-Driven |
| 主 Session 直接改 `src/` 无 implementer 标记 | Implementer Gate 拦截 |
| 顺手改格式/注释/无关文件 | Surgical Changes 违反 |
| 在 Read 结果上再包一层无用抽象 | 浪费 context、易幻觉 |
| 单次验证失败仍标 DONE | 须进入验证循环 |

---

## Skill 命令速查

| 阶段 | 命令 |
|------|------|
| 需求 | `/product-spec-builder` |
| 存量变更 | `/change-manager` |
| 计划 | `/dev-planner` |
| 开发 | `/dev-builder`（每 Phase 一次） |
| 调试 | `/bug-fixer` |
| 审查 | `/code-review` |
| 发布 | `/release-builder` |

---

## 维护者验证（ReqForge 框架仓）

```bash
pnpm test && pnpm forge-smoke
```

改 `core/` 后：`pnpm sync`

---

*Forge Quickref · 随 `forge-install` 更新，勿手改后与模板漂移*
