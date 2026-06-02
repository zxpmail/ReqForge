# ReqForge 与 withastro 生态（Flue / Rosie / Maintainer Skills）对照

> 参考：[withastro](https://github.com/withastro/) 组织 · 核心 Agent 相关仓库：  
> - [flue](https://github.com/withastro/flue) — *The Agent Harness Framework*（可编程、无头 Claude Code 式运行时）  
> - [rosie](https://github.com/withastro/rosie) — Agent Skill 包管理器（`npx rosie-skills install owner/repo`）  
> - [astro-maintainer-skills](https://github.com/withastro/astro-maintainer-skills) — Astro  monorepo 维护者专用 Skills  
> 与 [systems-around-ai-comparison.md](./systems-around-ai-comparison.md)（系统 > 模型）、[agent-harness-engineering-survey-comparison.md](./agent-harness-engineering-survey-comparison.md)（ETCLOVG）、[claude-code-seven-workflows-comparison.md](./claude-code-seven-workflows-comparison.md)、[mattpocock-skills-comparison.md](./mattpocock-skills-comparison.md) 互补。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **Flue** | **TypeScript Agent 运行时/框架**：Harness + Session + Sandbox + Workflow，可部署 Node/Cloudflare/CI；逻辑多在 Markdown（`AGENTS.md`、`.agents/skills/`） |
| **Rosie** | **Skill 分发与锁文件**（npm 式），跨多种 coding agent 安装第三方 skill 包 |
| **ReqForge** | **产品交付 Harness 包**（Spec→Release + 机器门 + 进化），经 `forge-install` 写入用户项目，**非**可部署 Agent 服务器 |

同一赛道不同层：Flue 是「造 Agent 应用的 Next.js」；Forge 是「在现有 IDE Agent 里把软件做出来」的 **Guidance + 门控** 安装包。

---

## withastro 组织：与 Agent 相关的分工

| 仓库 | 角色 | 与 Forge 关系 |
|------|------|---------------|
| [astro](https://github.com/withastro/astro) | 内容驱动网站框架 | 正交；用户站点技术栈自选 |
| [starlight](https://github.com/withastro/starlight) | 文档站主题 | 可选：ReqForge 文档站选型，**非** Harness |
| [flue](https://github.com/withastro/flue) | Agent Harness **框架** | 对照见下表；**不** vendoring 进 `core/` |
| [rosie](https://github.com/withastro/rosie) | Skill **包管理** | 可与 `npx skills add` / 用户自管 skill 并存 |
| [astro-maintainer-skills](https://github.com/withastro/astro-maintainer-skills) | 单项目维护 skill 集 | 模式类似 `core/skills/`，领域仅限 Astro |

---

## Flue 核心概念 ↔ ReqForge

| Flue | 说明 | ReqForge 对应 | 差异 |
|------|------|---------------|------|
| **Agent** | `createAgent()` + 模型/沙箱配置 | 各 adapter 下的 **Sub-Agent** 定义（`core/agents/`） | Forge 不托管 HTTP/WebSocket Agent 实例 |
| **Harness** | `init(agent)` → 工具、沙箱、会话 | 整包 **Skills + hooks + 工件门** | Forge Harness = 流程纪律，非 TS API |
| **Session** | `session.prompt()` / `skill()` / `task()` | 单次 IDE 会话 + `memory/` + phase 状态 | Flue 可持久化（如 DO）；Forge 靠 Git |
| **Workflow** | `.flue/workflows/*.ts` 编排 | Spec→Plan→Build→Review→Release **Skill 链** | Flue 用代码编排；Forge 用文档+人确认 |
| **Sandbox** | 默认 virtual（just-bash）、`local()`、Daytona 等 | 用户本机 / CI；**无**内置容器产品 | Flue 强项：多租户 headless |
| **Skills** | `/.agents/skills/` + `session.skill('name')` | `.claude/skills/` 等（`pnpm sync`） | 格式均趋近 `SKILL.md`；Forge 有 `skill.json` 与 eval 模板 |
| **AGENTS.md** | 工作区发现 | 根 `CLAUDE.md` / `AGENTS.md`（`forge-install`） | 同为调度薄层，Forge 强调 <60 行 |
| **Typed result** | Valibot `result` schema | Spec 验收条、`forge-phase-check`、测试 | Forge 门在 **Git/CI**，非单次 prompt 返回值 |
| **CI 示例** | Issue triage `flue run triage` | `forge-loop`、`change-manager`、GitHub Actions 可选 | 可 **叠加**：Flue 跑 triage，Forge 管 feature 交付 |
| **Observability** | `@flue/opentelemetry`、Sentry 示例 | hooks 日志、`.forge/evidence/` | Forge 无托管 trace 产品 |

Flue README 自述：*「If you know Claude Code… you already know Flue」* — 与 [claude-code-seven-workflows-comparison.md](./claude-code-seven-workflows-comparison.md) 同向；Forge 则把 Claude Code **习惯**固化成 **可安装交付包**。

---

## 三层叠加（推荐心智模型）

```text
┌─────────────────────────────────────────┐
│  Flue（可选）— 部署/CI/多租户 Agent API   │
├─────────────────────────────────────────┤
│  ReqForge — Spec/Plan/门控/Review/Release │
├─────────────────────────────────────────┤
│  IDE Agent（Claude Code / Cursor / …）   │
└─────────────────────────────────────────┘
```

| 场景 | 建议 |
|------|------|
| 团队只在 IDE 里开发 | `pnpm forge-install` 即可 |
| 需要 headless triage、客服 Bot、WebSocket Agent | 用 **Flue** 建 workflow；项目内仍可 `forge-install` 写 `AGENTS.md`/Spec |
| 从 GitHub 装零散 skill | **Rosie** 或 `npx skills add`；**不**替代 Forge 全流程 |
| 维护 Astro 上游 | `astro-maintainer-skills`；与 Forge **无关** |

---

## Rosie ↔ Forge 安装方式

| 维度 | Rosie | ReqForge |
|------|-------|----------|
| 单位 | `owner/repo` skill 包 | 整包 Harness（skills+agents+hooks+templates） |
| 锁文件 | `.agents/rosie.lock` | Git 中的 Spec/Plan/`.forge/*` |
| 命令 | `npx rosie-skills install …` | `pnpm forge-install <adapter> --target …` |
| 范围 | 多 agent 检测、通用 skill | 固定 12 Skill 生命周期 + 机器门 |

**启示**：Rosie 解决「skill 从哪来、版本锁」；Forge 解决「做完后怎么验收、发布」。用户可先 `forge-install`，再用 Rosie 追加 `anthropics/skills` 等，但勿用零散 skill **替代** Spec/Plan 真理源。

---

## astro-maintainer-skills ↔ Forge `core/skills/`

| Maintainer skill | 用途 | Forge 类比 |
|------------------|------|------------|
| astro-test-perf | CI 测试性能报告 | `skill-eval`、PROJECT-HEALTH 思路 |
| astro-preview-release | pkg.pr.new 预览发版 | `release-builder` + preflight（不同工具链） |
| security-advisory-review | 安全公告评估 | `code-review` + `security-guidance` |

**模式一致**：领域技能 + Agent 自动发现；**范围不同** — 维护者包不进 `forge-install` 默认集。

---

## 与「围绕 AI 建系统」叙事的对齐

[systems-around-ai-comparison.md](./systems-around-ai-comparison.md) 强调记忆、编排、验证环。Flue **用代码实现** 这些层（session 持久化、workflow、`result` schema、sandbox 边界）；Forge **用工件与命令** 实现（`DEV-PLAN`、`forge-loop --strict`、`code-reviewer` 只读）。

| 能力 | Flue | Forge |
|------|------|-------|
| 记忆复利 | Session store / CF DO | `memory/` + Git 文档 |
| 验证环 | Valibot + 自定义 workflow 分支 | `pnpm test`、phase-check |
| 编排智能 | TypeScript `run()` | Skill 工作流 + 人确认门 |
| 模型可换 | `configureProvider` | 适配器无关 `core/` sync |

---

## 对维护者与用户的启示

| 启示 | 建议 |
|------|------|
| 评估 Flue 前先看需求 | 要 **API/多租户/CI Agent 服务** → Flue；要 **规范交付** → Forge |
| 不要二选一叙事 | Flue 仓库内可 `cwd` 到已 `forge-install` 的项目，读 `AGENTS.md` 与 skills |
| Issue triage 示例 | Flue `triage` workflow ≈ 单次 skill+schema；Forge `change-manager` ≈ 长期变更目录 |
| Rosie 锁与 Forge 工件 | 两套锁并存时，**Spec/Plan 优先** 于 skill 包版本争论 |
| Starlight | 仅文档站选型；与 Harness 无关 |
| Flue 仍 Experimental | API 会变；Forge 对照文档随上游更新，**不** fork Flue 进 core |

---

## 刻意不做

- 将 `@flue/runtime` 列为 ReqForge 依赖或默认后端
- 用 Flue 替代 `forge-install`（不同产品层）
- 在 `core/` vendoring Flue / Rosie 源码
- 把 `astro-maintainer-skills` 并入通用 Forge（领域过窄）
- 声称 Forge 提供 Cloudflare Durable Objects 级 session 托管（见 [harness-maturity-checklist](./harness-maturity-checklist.md) P2）

---

## 相关文档

| 文档 | 关系 |
|------|------|
| [awesome-llm-apps-comparison.md](./awesome-llm-apps-comparison.md) | Runnable 模板 vs Flue 框架 vs Forge 门 |
| [karpathy-skills-comparison.md](./karpathy-skills-comparison.md) | Skill 生态与安装纪律 |
| [skill-evolution-comparison.md](./skill-evolution-comparison.md) | Skill 进化 vs Flue 静态 import skill |
| [openhuman-comparison.md](./openhuman-comparison.md) | 个人运行时记忆 vs Flue session store |

---

*对照版本：2026-06-02 · 依据 Flue/Rosie README 与 withastro 组织公开仓库说明*
