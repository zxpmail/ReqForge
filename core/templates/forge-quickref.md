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
| `.claude/rules/security.md` | 安全硬规则：无硬编码密钥 + 输入验证 + 审计日志（从 `core/templates/security-rules-template.md` 安装） |
| `AGENTS.md` | AI Agent 行为约束与并行工作流规范（forge-install 写入） |
| `.forge/preflight.json` | 发布门禁配置 → `pnpm preflight` |
| `.forge/trace/` | 探索图（Phase 决策/死胡同/证据绑定） |
| `.forge/tests/` | Playwright E2E 测试模板（config + auth + Phase 验证） |
| `.forge/active-scope.json` | 当前 Phase 文件作用域（巽 — 越界检查） |
| `.forge/evidence/` | FDE 模式交付证据报告（测试通过率 + 清单完成度 + 文件变更） |
| `.forge/ops/` | 运营监控报告（健康检查 + 回归检测 + 自动修复） |
| `memory/handoff.md` | 跨 session / 跨客户端接力摘要（Phase 完成或上下文将满时生成） |

---

## 项目状态路由（Session 启动）

检测文件系统 → 推荐下一步（Forge 控制文件 `CLAUDE.md` volatile 区引用本表）：

| 状态 | 下一步 |
|------|--------|
| 无 `Product-Spec.md` | `/product-spec-builder` |
| 有 Spec，无 `DEV-PLAN.md`，无代码 | Spec 完成 → `/dev-planner`（或可选 design） |
| 有 Spec + Plan，无代码 | `/dev-builder` Phase 1 |
| 有 Spec + 代码，无 Plan | `/dev-planner` |
| 有 Spec + Plan + 代码 | 继续 `/dev-builder` 或 `/bug-fixer` |
| 活跃 `changes/<name>/`（非 archive） | `/change-manager` apply/verify；勿并行无关 Phase |
| 新功能请求（无 active change） | 优先 `/change-manager` propose |
| `memory/` 存在 | Session 启动读三文件；有代码无 memory → dev-builder 后补 |

汇报：Product Spec · active changes · Design Brief · DEV-PLAN · Code · Memory · **Next Step**。

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

## 通用规则（CLAUDE.md 指针目标）

| 主题 | 规则 |
|------|------|
| Tool-call offloading | 输出 >2000 行 → 写临时文件，上下文只留头尾 |
| Web-first | 碰外部库 / API / 框架版本前先 WebSearch |
| Pin exact versions | `major.minor.patch` 精确版本；禁止 `^` / `latest` / `*` |
| forge-install | `pnpm forge-install <client> --target <dir>`；`--loadout <name>` 只装对应 Skill/Agent + hooks |
| Loadout 选型 | [loadout-scenarios.md](../docs/loadout-scenarios.md) |
| CLI session | `/model`（Opus 规划 · Sonnet 编码）· `/compact` 带 hint · `/context` >40% 考虑 handoff · `/sandbox` |

---

## 可选叠加（非 Forge 核心）

| 工具 | 用途 | 与 Forge 关系 |
|------|------|----------------|
| [talk-normal](https://github.com/hexiecs/talk-normal) | 去掉**通用对话** AI 腔（废话、Closing 菜单） | **叠加**于 `AGENTS.md`；不替代 Spec/审查/测试。见 [talk-normal-comparison.md](../docs/talk-normal-comparison.md) |
| [Context7](https://github.com/upstash/context7) | 库文档注入 MCP | 与 dev-builder 叠加 |
| [RTK](https://github.com/rtk-ai/rtk) | Bash 输出压缩 | 可选，见 [rtk-comparison.md](../docs/rtk-comparison.md) |

安装 talk-normal：`git clone …/talk-normal && bash install.sh`（`# --- talk-normal BEGIN/END ---` 标记块，新会话生效）。

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
| 生态库 | `pnpm forge-ecosystem search <lang> <query>` |

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
pnpm skill-eval trigger my-skill           # 触发准确率模拟评估（20 条查询）
pnpm skill-eval judge-prep my-skill     # 初始化 judge 配置（rubric 定义）
pnpm skill-eval judge my-skill          # 打印 judge briefing（给 AI agent 用）
pnpm skill-eval judge-record my-skill --report judge-report.json  # 记录结果
```

- 模板：`.forge/skills/_template/eval/`（`forge-install` 写入）
- 详解：`core/docs/skill-eval.md`（触发准确率需在客户端人工对照；judge 效果评估需 AI agent spawn 独立 sub-agent）
- **ref-lint**：`skill-eval run` 自动扫描 SKILL.md 中数字引用与列表长度不一致（如"四个维度"但列表只有 3 项）
- **6 维 Rubric**: 结构完整性(10%) · 可执行具体性(20%) · 失败模式编码(15%) · 反例完备性(10%) · **工作流质量与可重复性(30%)** · 实测效果与基线对比(15%)
- Skill 编写模式：`core/docs/skill-authoring-patterns.md`（工作流设计 + 失败模式编码 + 反例黑名单 + rubric 自查）

---

## 运营监控（forge-ops）

```bash
pnpm forge-ops https://myapp.com                          # 单次健康检查 + 基线对比
pnpm forge-ops https://myapp.com --interval 300 --fix     # 循环监控 + 自动修复
pnpm forge-ops https://myapp.com --baseline save          # 保存当前状态为基线
pnpm forge-ops https://myapp.com --baseline compare       # 对比基线
```

**做什么**：上线后的运营闭环。每个 tick—健康检查 HTTP 端点 → 运行验证套件 → 对比基线 → 检测回归 → 生成 fix-brief → 出报告。

输出 → `.forge/ops/report.md`（含健康状态、验证通过率、基线 delta、问题清单）。

## 维护者验证（ReqForge 框架仓）

```bash
pnpm test && pnpm forge-smoke
```

改 `core/` 后：`pnpm sync`

**drift 检测**：`pnpm sync --discover` — 比较 core 与 adapter 文件哈希，报告漂移/孤立/缺失。

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

## 下班一条命令（forge-loop）

```bash
pnpm forge-loop                               # 看看还有哪些阶段没做完
pnpm forge-loop --all                         # 全自动：把所有没做完的阶段逐个做完
pnpm forge-loop 3                             # 只做 Phase 3
pnpm forge-loop 3 --run                       # 还没开始？先跑 dev-builder 干活
pnpm forge-loop 3 --serve "pnpm dev"          # 启动网页服务
pnpm forge-loop 3 --url http://localhost:5173 # 检查网页对不对
pnpm forge-loop 3 --max 10                    # 最多搞 10 轮（默认 5）
pnpm forge-loop 3 --skip-test                # 跳过测试
pnpm forge-loop 3 --fde                      # FDE 模式：上下文感知 + 证据报告
pnpm forge-loop 3 --strict                  # 严格模式：测试失败即停，输出 review.md
pnpm forge-loop 3 --linear                  # 线性模式：单次检测→测试→报告，不迭代
pnpm forge-loop 3 --reset                    # 重置重来
```

**做什么**：自动检查清单→修 bug→跑测试→修 bug→跑测试→…直到全部通过。

**下班怎么用**：
```bash
claude --dangerously-skip-permissions
# 进去后输入：
/loop pnpm forge-loop --all --run --max 5
如果 fix-brief.md 存在就执行修复
重复直到全部完成
```
然后关电脑下班，第二天来查结果。
```

### FDE（Forward Deployed）模式

```bash
pnpm forge-fde <N>                        # FDE 模式：上下文感知 + 证据报告
pnpm forge-fde --all --run --max 10       # 全自动 FDE 交付循环
pnpm forge-fde 3 --fde --url localhost:5173
```

**和 forge-loop 的区别**：
- 执行前先读取 Product-Spec.md 和 DEV-PLAN.md 了解上下文
- 每轮检测输出附带阶段目标和 Spec 背景
- 完成时生成 `.forge/evidence/phase-N-report.md`（结果证据链：测试通过率、交付清单完成度、文件变更清单、UI 检查结果）
- 适合**需要可追溯交付证据**的场景（发布审查、客户交付、合规）

**证据报告示例**（.forge/evidence/phase-N-report.md）：
```
# Forward Deployed Report — Phase 3

**Status**: passed
| Check | Result | Detail |
|-------|--------|--------|
| 交付清单 | ✅ | 8/8 通过 |
| UI 检查 | ✅ | 通过 |
| 测试 | ✅ | 通过 |

**文件变更**: 12 个文件
**自动创建**: 2 个文件
**结论**: 可交付 — 所有门禁通过。
```

---

## Phase 完成检查（forge-phase-check）

```bash
pnpm forge-phase-check <N>              # 检查 Phase N 的交付清单完整性
pnpm forge-phase-check <N> --base <ref> # 与指定基线对比（默认: main）
```

机械地比对各阶段交付清单与真实文件变更，输出遗漏/完成/冗余报告。
不靠 AI 判断 — 纯清单⇔文件对照。

---

## Phase 自动循环（forge-phase-loop）

```bash
pnpm forge-phase-loop <N>               # 单次迭代：检查+生成fix brief
pnpm forge-phase-loop <N> --max 10      # 最多迭代 10 次（默认 5）
pnpm forge-phase-loop <N> --reset       # 重置循环状态
```

YOLO 模式下的自动循环工具。每次迭代运行 forge-phase-check，有遗漏则生成
`.forge/phase-loop/fix-brief.md`（AI 可读的精确修复指令），AI 执行修复后
再检查，直到 clean 或达到最大次数。

---

## Hash-anchored editing（forge-hashline）

```bash
pnpm forge-hashline hash <file>                                 # 打印文件 SHA256
pnpm forge-hashline hash <file> --lines N:M                     # 打印行范围哈希
pnpm forge-hashline verify <file> <hash>                        # 验证哈希匹配
pnpm forge-hashline edit <file> <hash> --new-string "..."       # 验证后替换内容
pnpm forge-hashline edit <file> <hash> --from <content-file>    # 从文件读取替换内容
pnpm forge-hashline verify-brief <brief-path>                   # 检查 fix-brief 哈希是否仍有效
pnpm forge-hashline verify-brief <brief-path> --after-fix       # 检查 fix-brief 的修改是否已应用
pnpm forge-hashline verify-brief <brief-path> --json            # JSON 格式输出
pnpm forge-hashline apply-brief <brief-path>                    # 自动创建 fix-brief 中的新文件
```

**做什么**：用内容哈希锚点替代字符串匹配编辑。先验证文件未经篡改（哈希匹配），再执行写入。不匹配则拒绝（STALE_ANCHOR），防止脏写入。

**与 fix-brief 集成**：`forge-loop` 和 `forge-phase-loop` 生成的 `fix-brief.md` 自动附带 `**Hashline**:` 条目。

**verify-brief**：`forge-loop` 每次迭代时自动执行。before-fix（brief 刚生成）验证所有哈希锚点有效；after-fix（下一轮迭代）验证 AI 确实修改了文件。UNCHANGED = AI 没改、STALE = 文件被人动过、MISSING = 新文件没创建。验证不通过则提前报错，避免脏循环。

**apply-brief**：自动创建 fix-brief 中标记为 `(新文件)` 的文件骨架。已在 `forge-loop` 生成 fix-brief 后自动执行。

源自 oh-my-pi hashline 设计。

---

## 作用域过滤（巽 — Filter）

```bash
node scripts/forge-scope.mjs init <N> --modify "src/" --readonly "src/lib/"  # 声明 Phase 范围
node scripts/forge-scope.mjs check                                            # 检查是否越界
node scripts/forge-scope.mjs show                                             # 查看当前作用域
```

---

## UI 检查（forge-ui-check）

```bash
pnpm forge-ui-check <N>                       # 静态检查 UI 文件存在性
pnpm forge-ui-check <N> --url http://...      # 启动 Playwright 动态检查
pnpm forge-ui-check <N> --clean               # 测试后清理生成文件
```

解析 DEV-PLAN.md Phase N 的 UI 相关清单项，自动生成 Playwright 断言
（表单/按钮/输入框/导航/页面路由等），执行并输出 pass/fail 报告。

---

## UI 自动循环（forge-ui-loop）

```bash
pnpm forge-ui-loop <N>                        # 单次迭代：检查 UI + 生成 fix brief
pnpm forge-ui-loop <N> --url http://...       # 支持 Playwright 动态检查
pnpm forge-ui-loop <N> --max 10               # 最多迭代 10 次（默认 5）
pnpm forge-ui-loop <N> --reset                # 重置循环状态
```

YOLO 模式下的 UI 自动修复循环。有 UI 问题则生成 `.forge/ui-loop/fix-brief.md`，
AI 执行修复后重新检查，直到全部通过或超限。

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
