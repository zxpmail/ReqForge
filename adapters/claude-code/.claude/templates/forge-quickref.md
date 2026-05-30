# Forge 速查（Quickref）

> 人类与 Agent 的一页索引。详细流程在对应 Skill 的 `SKILL.md`；本文件不替代按需加载。
> 安装来源：`core/templates/forge-quickref.md` → 用户项目 `.forge/quickref.md`（`pnpm forge-install` 写入）

---

## 当前进度（打开即看）

| 文件 | 含义 |
|------|------|
| `Product-Spec.md` | 产品需求（无则先 `/product-spec-builder`） |
| `§ Idea Stage Exit Criteria` | 构思三门禁：问题真实 / 方案对准 / 证据足够 |
| `.forge/spec-confirmed.json` | Spec 已书面确认 |
| `DEV-PLAN.md` | 开发计划（含 **MVP Scope**） |
| `.forge/plan-confirmed.json` | Plan 已书面确认 |
| `.forge/implementer-session.json` | implementer 子 Agent 正在写业务代码 |
| `.forge/dev-map.md` | 开发导航地图（谁动代码谁改地图） |
| `.forge/security-guidance.md` | 团队安全规则（审查/发布前对照） |
| `AGENTS.md` | AI Agent 行为约束与并行工作流规范（forge-install 写入） |
| `.forge/preflight.json` | 发布门禁配置 → `pnpm preflight` |
| `.forge/trace/` | 探索图（Phase 决策/死胡同/证据绑定） |
| `.forge/tests/` | Playwright E2E 测试模板（config + auth + Phase 验证） |
| `.forge/active-scope.json` | 当前 Phase 文件作用域（巽 — 越界检查） |
| `memory/handoff.md` | 跨 session / 跨客户端接力摘要（Phase 完成或上下文将满时生成） |

---

## 跨客户端接力（Cross-Client Handoff）

换 AI 客户端（Claude Code ↔ Cursor ↔ OpenCode 等）或换 Agent 继续同一 Phase 时，**不要口头复述上下文**——先更新文件，新 session 按序读取：

| 顺序 | 文件 | 用途 |
|------|------|------|
| 1 | `memory/handoff.md` | 当前进度、待办、阻塞（有则必读） |
| 2 | `memory/project-memory.md` + `decisions-log.md` | 架构约束与已做决策 |
| 3 | `DEV-PLAN.md` 当前 Phase | 任务范围与验收标准 |
| 4 | `.forge/active-scope.json` | 允许修改的文件边界 |
| 5 | `.forge/trace/phase-<N>.json` | 本 Phase 决策、死胡同、证据 |
| 6 | `AGENTS.md` | 本项目 Agent 行为约束 |

**离开前**：更新 `handoff.md`（或让 dev-builder Phase 完成时生成）；**进入后**：按上表读取再动手。

---

## 四阶段 ↔ Forge（Founder's Playbook）

| 阶段 | 目标 | Forge 命令 |
|------|------|------------|
| Idea | 验证后再构建 | `/product-spec-builder` |
| MVP | 最小范围 + PMF 证据 | `/dev-planner` → `/dev-builder` |
| Launch | 发布与加固 | `/code-review` → `pnpm preflight` → `/release-builder` |
| Scale | 公司化增长 | （Harness 不覆盖，用 Playbook + Cowork） |

---

## Claude 表面怎么选（非 Forge 时）

| 任务 | 用 | 原因 |
|------|-----|------|
| 快问、改写、头脑风暴 | Chat | 轻、对话式 |
| 研究、长文档、连接器自动化 | Cowork | 文件夹 + MCP + 定时任务 |
| 写软件、测试、git | Claude Code + **Forge Skills** | 代码库 + 机器门 |

---

## Karpathy 四原则（快照）

| # | 原则 | 一句话 |
|---|------|--------|
| 1 | Think Before Coding | 不猜；有歧义先问；有 tradeoff 先摆 |
| 2 | Simplicity First | 最少代码；不写未来抽象 |
| 3 | Surgical Changes | 只改必须改的 |
| 4 | Goal-Driven Execution | 可验证成功标准；测试/检查循环直到通过 |

详情 → `.claude/skills/*/SKILL.md` 内 Behavior Rules，或 `behavior-rules.md`

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

完整版 → `session-execution-discipline.md`

---

## 常见反模式（勿做）

| 反模式 | 后果 |
|--------|------|
| 无 Spec § Idea Stage 就写业务代码 | Idea Validation Gate 拦截 |
| 把可运行原型当「已验证」 | 须真人访谈证据写在 Spec |
| 无验证输出就宣称完成 | Sloppiness Gate |
| 主 Session 直接改 `src/` | Implementer Gate |
| 顺手加 Plan 外功能 | 查 DEV-PLAN Scope amendment criteria |
| 单次验证失败仍标 DONE | 须验证循环 |

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
| 发布 | `/release-builder`（前先 `pnpm preflight --build-dir <产物>`） |

---

## 发布前门禁（preflight）

```bash
pnpm preflight
pnpm preflight --build-dir dist    # 构建后扫描产物
```

- 配置：`.forge/preflight.json`（安装时生成）
- 公众号示例：`.forge/preflight-wechat.example.json`
- 详解：`core/docs/external-publish-preflight.md`（用户项目可复制该路径说明到团队 wiki）
- **exit 1 = 禁止发布**

---

## 自定义 Skill 评估（skill-eval）

```bash
pnpm skill-eval init my-skill           # → .forge/skills/my-skill/eval/
pnpm skill-eval my-skill                # 静态检查 + 对 eval-output/ 断言
pnpm skill-eval judge-prep my-skill     # 初始化 judge 配置（rubric 定义）
pnpm skill-eval judge my-skill          # 打印 judge briefing（给 AI agent 用）
pnpm skill-eval judge-record my-skill --report judge-report.json  # 记录结果
```

- 模板：`.forge/skills/_template/eval/`（`forge-install` 写入）
- 详解：`core/docs/skill-eval.md`（触发准确率需在客户端人工对照；judge 效果评估需 AI agent spawn 独立 sub-agent）
- Skill 编写模式：`core/docs/skill-authoring-patterns.md`（工作流设计 + 失败模式编码 + 反例黑名单 + rubric 自查）

---

## 维护者验证（ReqForge 框架仓）

```bash
pnpm test && pnpm forge-smoke
```

改 `core/` 后：`pnpm sync`

---

## 事后验证（forge-verify）

```bash
pnpm forge-verify                      # 运行验证
pnpm forge-verify --baseline save      # 开发前保存基线
pnpm forge-verify --baseline compare   # 开发后对比基线
```

## 探索图（trace）

```bash
node scripts/forge-trace.mjs init <N>                               # Phase N 初始化
node scripts/forge-trace.mjs decision <N> -q "<问>" -c "<选>" -r "<因>"  # 记录决策
node scripts/forge-trace.mjs dead-end <N> --approach "<方案>" --lesson "<教训>" # 记录死胡同
node scripts/forge-trace.mjs summary [<N>]                          # 查看摘要
```

## 作用域过滤（巽 — Filter）

```bash
node scripts/forge-scope.mjs init <N> --modify "src/" --readonly "src/lib/"  # 声明 Phase 范围
node scripts/forge-scope.mjs check                                            # 检查是否越界
node scripts/forge-scope.mjs show                                             # 查看当前作用域
```

---

## E2E 测试（Playwright）

```bash
npx playwright test --project=chromium               # 运行 Chromium 测试
npx playwright test --headed                          # 带浏览器界面运行
npx playwright test tests/verify-phase-<N>.spec.ts    # 运行特定 Phase 验证
npx playwright show-report                            # 查看 HTML 报告
npx playwright show-trace trace.zip                   # 调试失败 Trace
```

配置模板见 `.forge/tests/`（forge-install 写入）。首次使用需先 `npm init playwright@latest`。

---

*Forge Quickref · 随 `forge-install` 更新，勿手改后与模板漂移*
