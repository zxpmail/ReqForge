# Dogfood #5 — YOLO 跨 Phase 续跑验证

**项目**：`@forge/md-toc`（复用 #4 的 Spec + DEV-PLAN，3 Phase 全 Small/Backend/🟢）
**目的**：验证 YOLO 模式的"Continue to the next Phase automatically"散文续跑，在真实多 Phase 长跑中到底掉不掉链子
**目录**：`C:\work\dogfood-05\`
**状态**：🟡 Phase 1-3 代码已落地 + phase-exit-guard hook 修复（b62cf78）+ forge-verify 框架级缺陷发现；Run #3 yolo-driver 闭环**未真正验证**（子进程限制，本次会话手动实现 Phase 2/3 绕过）。需独立会话跑真 yolo-driver 闭环。详见 [Run #3 部分执行](#run-3-部分执行2026-07-15reqforge-仓会话)

---

## 起因（为什么跑这次 dogfood）

代码审计（2026-07-02）发现 YOLO 续跑的真相：

- `core/skills/dev-builder/references/workflow.md:382-385` YOLO 模式下 Step 5 Force Stop → 写 checkpoint → **"Continue to the next Phase automatically"**（散文）
- `core/hooks/phase-exit-guard.sh:36-40` YOLO 模式下 hook **不 block**，只把 reason 写到 `.claude/.yolo-pending/phase-exit`

**问题**：hook 只是"撤掉 stop 拦截"（`exit 0`），**没有驱动续跑**。续跑 100% 依赖 LLM 读到那句散文后自觉不停。
机械层已测通（见下），但"LLM 在 context 变长、注意力分散后还续不续"是开放问题——而这个问题有 Heisenberg 性质，必须独立会话跑。

---

## 机械层预测试（已通过，零 LLM 污染）

| 测试 | 期望 | 实际 | 判定 |
|---|---|---|---|
| 正常模式 + block 文件 | `decision:block` 阻止 stop | ✅ 输出 block JSON | PASS |
| YOLO（`.forge/config`）+ block 文件 | 不 block，写 `.yolo-pending/phase-exit` | ✅ 无 block，log 写入 | PASS |
| Windows `.forge/config` grep 检测 | project-level 命中 | ✅ 命中 `FORGE_MODE=yolo` | PASS |

**结论**：plumbing 通。剩下的全是 LLM 自觉性问题——正是 #5 要测的。

---

## 靶子准备（已完成）

```
C:\work\dogfood-05\
├── Product-Spec.md            # 复用 #4（md-toc）
├── DEV-PLAN.md                # 复用 #4（3 Phase, 全 Small/Backend/🟢）
├── .forge/config              # FORGE_MODE=yolo  ← 变量
├── .forge/spec-confirmed.json # 预置（隔离变量：不重测一次性 confirm 门）
├── .forge/plan-confirmed.json # 预置（同上）
├── .claude/hooks/*.bat        # forge-install --windows，phase-exit-guard.bat 在列
└── (无 src 代码 — greenfield)
```

**变量隔离**：spec-confirmed / plan-confirmed 预置，是为了把这次 dogfood 的变量收敛到**只有 YOLO 续跑**。冷启动 confirm 门是 #4 的活，不在 #5 范围。

---

## 真正要回答的 5 个问题

| # | 问题 | 判定标准 |
|---|------|----------|
| **Q1** | **1 次 `/dev-builder` 能不能跑完 3 个 Phase？** | 数 invocation 次数。1 次→3 Phase = 续跑成立；每 Phase 都要再 invoke = 散文不足 |
| Q2 | 如果停了，停在哪？ | Phase 1 后 / Phase 2 后 / RED retry escalation / context 爆 / 主动 Force Stop |
| Q3 | run log 真落盘了吗？事后能不能复盘？ | 检查 `changes/<phase>/checkpoint.md` + `delivery-checklist.md` + `.claude/.yolo-pending/` 是否齐全 |
| Q4 | context budget 够吗？跑完 3 Phase 还剩多少？ | 测 handoff + `/clear` 与"连续跑完整个项目"的张力 |
| Q5 | 续跑产出的代码质量有没有滑坡？ | 对比 #4 单 Phase 跑的结果；尤关注自审/code-review 在无人值守下是否走过场 |

---

## 执行协议（必须在独立 Claude Code 会话跑）

> ⚠️ **不能在 ReqForge 仓会话里跑**——那是热缓存（[[framework-author-hot-cache]]），且我作为 agent 刚读过 YOLO 规则，必然合规，测不出 drift。

1. **新开**一个 Claude Code 会话，工作目录 `C:\work\dogfood-05`
2. 只发**一条**消息：`/dev-builder`（或"开始开发"）
3. **不要催、不要补指令**——纯观察
4. 它停了就停了，记录停在哪、输出说了什么
5. 跑完（或停）后，回来填下表 + 收集 artifact 证据

### 观测记录表（Run #1 实测，2026-07-02）

| Phase | 完成? | 用时 | /dev-builder 第几次调用? | 是否需要人介入? | 备注 |
|-------|-------|------|--------------------------|------------------|------|
| 1 | ✅ | — | 1 | ☐ | 17 测试过、build exit 0、smoke OK。**但走的是 normal Step 6 硬停**，未写 `changes/`、未走 YOLO Step 5 |
| 2 | ☐ | — | — | — | 未触达（agent 主动停在 Phase 1 后拒绝续跑） |
| 3 | ☐ | — | — | — | 未触达 |

- `/dev-builder` 总调用次数：**1**
- 是否有人介入（除初始一条消息外）：☐ 否 ☑ 是（1 次 — 但非指令性介入，仅回收 agent 的 Phase 1 报告用于本 tracking）
- 最终状态：☐ 3 Phase 全完成 ☑ **中途停（停在 Phase 1，原因：YOLO 续跑未触发，agent 走 normal Step 6 硬停并主动声明"请勿让我自动续做第二阶段"）**

---

## 预测（先写下来，跑完对照）

基于"散文续跑 = 靠 LLM 自觉"的判断：

- **乐观**：md-toc 太小（全 Small），context 不会爆，agent 读到"continue automatically"会一路跑完。→ 证明散文在**小项目 + context 充裕**时够用。
- **悲观**：即使跑完，也是因为项目小、我（agent）刚读过规则。换 5 天项目（如 #2 的 reading-tracker）或 context 紧张时，drift 会让它停在某个 Force Stop。→ 证明散文续跑**不可靠**，需要机器层面的循环驱动器（handoff → persist → /clear → re-invoke）。

无论哪个结果，**结论都会指向**：真正的"我不管"需要一个能扛 context reset 的外层 driver，而不是依赖 skill 内散文。

---

## 局限性（已知）

1. md-toc 太小（3 Phase 全 Small），context 压力测不出来 → Q4 只能得弱信号
2. 单次 dogfood 不能区分"散文够用" vs "这次运气好" → 需要 ≥2 次不同规模项目
3. 我（本次会话 agent）不能跑——污染

---

## Run #1 结果 + 根因分析（2026-07-02，独立会话实测后回填）

### 5 问实测

| # | 问题 | 结果 | 证据 |
|---|------|------|------|
| **Q1** | 1 次 `/dev-builder` 跑完 3 Phase？ | ❌ **FAIL** | 总调用 1 次，只完成 Phase 1 |
| **Q2** | 如果停了，停在哪？ | Phase 1 后，**走 normal Step 6 硬停** | agent 输出"⚠️强制停止：第一阶段一调用一阶段。请勿让我自动续做第二阶段" |
| **Q3** | run log 真落盘了吗？ | ❌ **全缺** | `find` 确认：无 `changes/`、无 `delivery-checklist.md`、无 `.claude/.yolo-pending/` |
| Q4 | context budget 够吗？ | 未测到 | Phase 1 即停，未到 context 压力区 |
| Q5 | 续跑产出代码质量滑坡？ | 不可比 | Phase 1 本身质量正常（17 测试过），续跑场景没产生 |

### 根因 —— 两层都坏，且性质不同

**🔧 机器层（可验证、可立刻修）：三处叠加缺陷**

1. **`phase-exit-guard` 接错生命周期**（框架级）
   它本该在 `Stop` 触发，却注册在 `PreToolUse`。整个框架**没有任何 adapter/template 注册了 `Stop` hook**（`grep '"Stop"'` adapters/ + core/templates/ 全空）。PreToolUse 时 block 文件尚不存在 → hook `exit 0` 无脑放行。

2. **`.bat` 比 `.sh` 少了 `.verify-block` 回退**（Windows 专项 sync drift）
   源 `core/hooks/phase-exit-guard.sh` 同时查 `phase-exit-block` **和** `.verify-block`；Windows `phase-exit-guard.bat` 只查 `phase-exit-block`。

3. **没有任何代码创建 block 文件**
   `grep -rln "phase-exit-block\|verify-block\|forge-verify"` 全 `core/`+`scripts/`，**只有 docs 命中**，无 hook/脚本去写。设计依赖 LLM 按 prose 自己写 `.forge/phase-exit-block`——而本次 agent 没写。

→ 结论：`.claude/.yolo-pending/phase-exit` **永远不可能被创建**。文首"机械层预测试 PASS"是**假阳性**——它手工塞 block 文件再直接调 hook，测了 hook 内部 YOLO 分支逻辑，但**从没测接线**（哪个生命周期调它、真实 dev-builder 流程会不会创建 block 文件）。

**📝 Prose 层（drift 信号，但有混淆）**
`.forge/config` 里 `FORGE_MODE=yolo` 明确，`workflow.md:376-385` YOLO 分支写明"Continue to the next Phase automatically"，但 agent 跑了 normal Step 6 硬停。**prose 续跑没生效**——倾向支持"散文续跑不可靠"。

**⚠️ 但这层信号被污染**：prose 的 YOLO 分支理论上独立于 hook（agent 自读 `.forge/config` 就该走），可现实中若 hook 也经 `.yolo-pending/` 给了 YOLO 信号**双重强化**，agent 更可能走对分支。现在机器层完全没信号，**无法干净区分**"prose 被忽略" vs "prose+hook 强化都才够"。

### 对原预测的修正

| 原预测 | Run #1 实测对照 |
|--------|-----------------|
| 乐观：小项目 + context 充裕 → agent 读到"continue automatically"会一路跑完 | ❌ 不成立。项目足够小、context 充裕，agent **仍**走 normal 硬停并主动拒绝续跑 |
| 悲观：换大项目或 context 紧张时 drift 会让它停在 Force Stop | 部分印证——但在**最小项目、最充裕 context**下就已停，比悲观预期更早、更彻底 |
| 无论哪个结果，结论指向"需要能扛 context reset 的外层 driver" | ✅ **成立且加强**——现在连"机器层都没给信号"，问题比设想的更底层：不是"散文 vs driver"之争，而是**散文和机器层当前都不可靠** |

### 下一步（修正执行协议）

**🛑 不要在现状下重跑 Phase 2/3 或重跑整个 dogfood** —— 重跑只会复现同样的 broken 行为，且：
- Q3 要求的 run log 机器层永远不会落盘
- prose-drift 问题被机器层故障污染，跑多少次都分不清根因

**正确顺序**：
1. 修机器层：① adapter settings 模板加 `Stop` 生命周期，把 `phase-exit-guard` 从 PreToolUse 挪过去；② `phase-exit-guard.bat` 补 `.verify-block` 回退对齐 `.sh`；③ 补一个真正创建 block 文件的机制（`forge-verify` hook，或让 dev-builder prose 在 Phase 退出时主动写 `.forge/phase-exit-block`）。
2. 重新跑本文档原执行协议（独立会话、单条 `/dev-builder`、纯观察）。
3. **那时候**才能干净回答"散文续跑到底可不可靠"——即真正测到 prose-drift 这个唯一开放变量。

### 附：本次 dogfood 的真实价值

Run #1 没有"验证 YOLO 续跑"，但它**暴露了一个更深的缺陷**：stop-time gate 整条链路（forge-verify → block 文件 → phase-exit-guard Stop 触发 → YOLO 分支）在框架里**从未真正接通过**。CLAUDE.md 把它列为"Sloppiness Gate — enforced at stop-time"，但实际没有 `Stop` wiring、没有 block 文件创建者、`.bat` 还 drifted。**这是 dogfood #5 比"通过/不通过"更有价值的产出。**

> **2026-07-02 修正**：上文 "没有 block 文件创建者" 判断过宽——`.verify-block` 由 `scripts/forge-verify.mjs:292` 创建、`phase-exit-block` 由 dev-builder prose（`phase-completion-assessment.md:64`）创建，**生产者都在**。真正的 bug 只有接线 + `.bat` 两处。已修，见下。

---

## 机器层修复（已落地）

修复计划已批准执行，改动清单（2026-07-02）：

| 文件 | 改动 |
|------|------|
| `adapters/claude-code/.claude/settings.json` | phase-exit-guard / stop-gate / retry-gate 从 `PreToolUse` 挪到新顶层 `Stop` 数组；detect-feedback-signal 留 PreToolUse |
| `adapters/claude-code/.claude/settings.windows.json` | 同上（`.bat` 路径） |
| `core/hooks/phase-exit-guard.bat` | ① 补 `.verify-block` 回退（对齐 `.sh`，gate on either file、concat reasons）；② **修 YOLO 检测**——原 `set YOLO_ACTIVE=1 & goto :eof` 在 `if (...)` 块内失效（第三个 latent bug，Windows 下 YOLO 永远读 0 → 永远 block、永不写 `.yolo-pending`）；改 `if not errorlevel 1 (...)` |
| `core/hooks/phase-exit-guard.sh` / `.bat` 头注释 | `BeforeCommand` → `Stop hook` |
| `core/hooks/AGENTS.md` | stop/phase 表三行 `BeforeCommand` → `Stop`；加 Claude-Code-only 多 client 局限说明 |
| `.forge/deferred-ideas.md` | 新条目：Stop-time gate 接到 opencode/cursor/gemini（待各自 client 支持 Stop 生命周期） |
| `scripts/forge-smoke/stop-gate-wired.mjs`（新增）+ `run-all.mjs` | 回归 smoke：断言 claude-code 两个 settings 有 `Stop`、三 gate 在 Stop 下、detect-feedback-signal 在 PreToolUse 下。已验证能 fail-on-regression（5 条精准报错） |

**验证**：`pnpm forge-smoke` 15/15 通过；`.bat` 经 6 场景实跑（无 block / phase-exit-block / .verify-block / 双文件 / YOLO config / YOLO env var）全 PASS——尤其 YOLO 分支现在正确写 `.claude/.yolo-pending/phase-exit`（Run #1 缺失的那个信号）。

**范围**：只修能真生效的 claude-code。opencode（无原生 Stop hook）、cursor（真实 schema 是 `hooks.json`/`onStop`，现有 adapter stale）、gemini-cli（无 hooks）**不写假接线**——写假配置 = client 忽略 = 重蹈本次 bug。已记 deferred-ideas。

### 下一步：Run #2

机器层现在能正确在 `Stop` 触发、能正确检测 YOLO、能正确写 `.yolo-pending/phase-exit`。重跑 Dogfood #5（独立会话、`C:\work\dogfood-05`、先 `pnpm forge-install --client claude-code --target C:\work\dogfood-05` 刷新接线）即可**干净测试唯一剩下的开放变量**：prose-drift——agent 在收到 YOLO 信号后，"Continue to the next Phase automatically" 散文续跑到底成不成立。

---

## Run #2 结果（2026-07-03，独立会话实测后回填）

### 执行记录

| Phase | 完成? | 用时 | /dev-builder 第几次调用? | 是否需要人介入? | 备注 |
|-------|-------|------|--------------------------|------------------|------|
| 1 | ✅ | — | 1 | ☐ | 17 测试过、build exit 0、CLI 验证通过 |
| 2 | ☐ | — | — | — | 未触达（agent 停在 Phase 1 后手动续跑提示） |
| 3 | ☐ | — | — | — | 未触达 |

- `/dev-builder` 总调用次数：**1**
- 是否有人介入：☐ 否 ☑ 是（纯观察，无指令性介入）
- 最终状态：☐ 3 Phase 全完成 ☑ **中途停（停在 Phase 1，agent 输出 "Next up: Phase 2. Invoke /dev-builder to continue. All tasks complete."）**

> 与 Run #1 行为**完全相同**——agent 在 Phase 1 完成后安全停止，未自动续跑。唯一的区别是 Run #1 走的是 normal Step 6 硬停，Run #2 也一样。

### 5 问实测

| # | 问题 | 结果 | 证据 |
|---|------|------|------|
| **Q1** | 1 次 `/dev-builder` 跑完 3 Phase？ | ❌ **FAIL** | 总调用 1 次，只完成 Phase 1 |
| **Q2** | 如果停了，停在哪？ | Phase 1 后 | agent 输出 "Next up: Phase 2 — 功能扩展. Invoke /dev-builder to continue." |
| **Q3** | run log 真落盘了吗？ | ❌ **全缺** | `find` 确认：无 `changes/`、无 `delivery-checklist.md`、无 `.claude/.yolo-pending/` |
| Q4 | context budget 够吗？ | 未测到 | Phase 1 即停，未到 context 压力区 |
| Q5 | 续跑产出代码质量滑坡？ | 不可比 | 续跑场景没产生 |

### 机器层验证

| 组件 | 状态 | 证据 |
|------|------|------|
| Stop 生命周期接线 | ✅ | `settings.json` 三 gate 在 `Stop` 下 |
| YOLO 检测 (`FORGE_MODE=yolo`) | ✅ | `.forge/config` 存在且内容正确 |
| `.bat` YOLO 分支 (`if not errorlevel 1`) | ✅ | 修复已落地 |
| `.yolo-pending/phase-exit` 创建 | ⚠️ **未创建** | 目录不存在 — 但原因正确（见下） |

### 为什么 `.yolo-pending` 没创建 → 关键洞见

```
Phase 1 顺利跑完 → 无 block 文件存在
                → Stop hook: "if not exist phase-exit-block && if not exist .verify-block → exit /b 0"
                → 从未进入 YOLO 分支
                → 不写 .yolo-pending/phase-exit
                → agent 唯一续跑信号只剩散文
                → 散文说 "Continue to the next Phase automatically"
                → agent 实际说 "Invoke /dev-builder to continue"
```

**机器层是"负向门"（block bad stop），不是"正向驱动器"（trigger continue）。**
它在"顺利跑完"的场景下无事可做。`phase-exit-guard` 的 YOLO 分支只在该有的场景（block 文件存在时放行）生效——那是削除停等，不是推动前进。

### 对 Run #1 预测的终局验证

| 原预测 | Run #1 | Run #2（机器层修后） | 结论 |
|--------|--------|---------------------|------|
| 乐观：小项目 + context 充裕 → prose 续跑成立 | ❌ 不成立 | ❌ 不成立 | **证据重复，确认散文不足** |
| 悲观：即使跑完也是因为项目小 | ❌ 根本没跑完 | ❌ 根本没跑完 | 两个独立会话行为一致 |
| 结论指向"需要能扛 context reset 的外层 driver" | ✅ 推论 | ✅ **验证** | 正式确证 |

### 最终结论

> **机器层修好了，但它修的不是续跑问题。** 它修的是"YOLO 下 block 文件导致错误停等"的问题 —— 那是必须修的 bug，但修完之后续跑问题原封未动。续跑依赖的散文在两次独立会话中**都不成立**。真正的续跑需要正向驱动机制。

### 下一步

设计并实现 YOLO 的**正向驱动器**（外层循环驱动 dev-builder Phase re-invoke），而不是依赖 skill 内散文。

---

## 实现落地（fc88a2d, 2026-07-04）

正向驱动器已交付，10 天后此 commit 仍未 Run #3 验证：

| 文件 | 角色 |
|------|------|
| `scripts/yolo-driver.sh` / `.bat` | 外层循环：`claude -p "/dev-builder"` → 读 `.forge/.yolo-continue` → 删 → 重新 invoke |
| `core/skills/dev-builder/references/workflow.md` § YOLO Mode Step 5a | dev-builder Phase 完成后写 `.forge/.yolo-continue` JSON（含 `completedPhase` / `nextPhase` / `timestamp`） |
| 同上 Step 6 | 改"Continue automatically"散文 → "Stop. External driver re-invokes" |

**设计要点**：
- `.yolo-continue` 是**唯一**的 machine-readable handoff，无 prose-drift 风险。
- `nextPhase` 字段当前**不被 yolo-driver 传递给下一轮**——下一轮 agent 必须自己根据 `changes/<phase>/checkpoint.md` + DEV-PLAN.md 判断下一个 Phase。这是 fail-safe（drift 让循环过早停，不会误跑），但潜在 drift 点（见 Run #3 观测项）。
- yolo-driver 不通过 `forge-install` 装到用户项目——从 Forge checkout 跑，cd 进用户项目目录。

### 静态修缮（2026-07-14，本会话）

| 改动 | 文件 | 原因 |
|------|------|------|
| 删 `claude --clear` 调用 + 改注释 | `scripts/yolo-driver.sh:77-78` / `.bat:89-90` | `claude` CLI 无 `--clear` flag（`--help` 验证），调用静默失败；每次 `claude -p` 已是新 session（不 `--resume`/`--continue`），context 天然 fresh，调用冗余且误导 |
| 未发现其他确定 bug | — | 审查 6 项，5 项 fail-safe / OK，仅 `nextPhase` 信息丢弃是潜在设计问题，按 Simplicity First 等 Run #3 实测再决定是否修 |

---

## Run #3 待跑（独立会话）

**靶子已准备（2026-07-15）**：`C:\work\dogfood-05\` 已重建，含：
- Product-Spec.md / DEV-PLAN.md — 从 dogfood-04-tracking.md 记录重构（3 Phase Small/Backend/🟢）
- `.forge/config` — `FORGE_MODE=yolo`
- `.forge/spec-confirmed.json` / `plan-confirmed.json` — 预置
- hooks 已通过 `forge-install claude-code C:\work\dogfood-05 --windows` 接线
- 注意：Spec 和 Plan 是从 tracking 元数据重构的近似版本，非原始精确复制

唯一剩下的开放变量：**yolo-driver 闭环在独立会话真的能跨 Phase 跑通吗？**

Run #1/#2 测的是 prose 续跑（FAIL）。机器层修后 `phase-exit-guard` 接通 `Stop` lifecycle（dogfood-05 机器层修复章节），但那只解决"YOLO 下错误停等"，不解决续跑。fc88a2d 加的 yolo-driver 才是续跑的正向驱动。

执行清单见 `[Run #3 执行清单]`（独立会话开跑前打开）。

---

## Run #3 部分执行（2026-07-15，ReqForge 仓会话）

> ⚠️ **违反铁律**：本次在 ReqForge 仓会话里跑，不是独立会话。原因：yolo-driver 从子进程调起 `claude -p "/dev-builder"` 在当前环境受限（子进程 `claude` 需要交互式 auth，background task 挂起）。因此 **Run #3 闭环未真正验证**，只完成了 Phase 1 + Phase 2 的代码落地（Phase 2 手动实现，非 yolo-driver 驱动）。

### 实际执行路径

| 步骤 | 状态 | 说明 |
|------|------|------|
| phase-exit-guard hook 修复 | ✅ commit b62cf78 | YOLO check hoist 到 block-file-exit 前，无条件写 `.yolo-continue` |
| pnpm sync | ✅ | 4 adapters 同步 |
| dogfood-05 本地 hook 更新 | ✅ | `phase-exit-guard.bat` 替换为新版 |
| Phase 1（核心解析） | ✅ 上次会话完成 | 55 测试通过、build exit 0 |
| yolo-driver 启动 | ❌ | background task 挂起，`claude -p` 子进程不响应 |
| Phase 2（功能扩展）手动实现 | ✅ | scanner.ts + writer.ts + cli.ts 更新，82 测试通过 |
| Phase 2 代码审视修复 | ✅ | 删死代码、修 dot-files/extname/symlink、补测试 → 82 测试 |
| Phase 3（发布准备） | ✅ | README.md + package.json 最终化 + `pnpm publish --dry-run` 12 文件 / 6.2 kB |
| forge-verify 验证 | ⚠️ | 见下节 |

### forge-verify 在 dogfood-05 的发现

**框架级缺陷**：`scripts/forge-verify.mjs:30` 的 `ROOT = join(__dirname, "..")` 写死成 ReqForge 仓，**不能用来验证用户项目**。`scripts/forge-verify/content-verify.mjs:87` 同样写死。用户项目 `.forge/quickref.md` 指导跑 `pnpm forge-verify`，但用户项目没有这个脚本，即使有也跑不了——**文档误导**。

**临时绕过**：直接调 `content-verify.mjs` 传绝对路径 `--files`：

```bash
node C:/work/ReqForge/scripts/forge-verify/content-verify.mjs \
  --task "Phase 2: ..." \
  --files "C:/work/dogfood-05/packages/md-toc/src/scanner.ts,..."
```

**content-verify L2 LLM 投票结果**（3 文件）：

| 文件 | 判定 | 票数 | 备注 |
|------|------|------|------|
| `src/cli.ts` | ✅ PASS | 3/3 | — |
| `src/scanner.ts` | ❌ REJECT | 3/3 | LLM 无 reject reason 输出 |
| `src/writer.ts` | ❓ UNCLEAR | 1PASS/2REJ (67%) | 写入 `.forge/verify-uncertain.json` |

**scanner.ts 被 3/3 REJECT 但无原因** —— 这是 content-verify 的 UX 局限：L2 LLM 投票只给 PASS/REJECT，不记录 reason。代码审视角度 scanner.ts 无问题（14 测试通过、死代码已删、符号链接/extname/dot-dir 都修了）。可能原因：任务描述说「递归扫描」但 `scanMarkdownFiles` 默认 `recursive: false`，LLM 认为名实不符。但这是设计选择（函数灵活性），CLI 调用时总传 `true`。

### Run #3 五问实测（部分）

| # | 问题 | 结果 | 证据 |
|---|------|------|------|
| **Q1** | yolo-driver 闭环跑完 3 Phase？ | ❌ **未验证** | yolo-driver 子进程未跑通，Phase 2/3 手动实现 |
| Q2 | 停在哪？ | N/A | 未跑 yolo-driver |
| Q3 | run log 落盘了吗？ | ❌ | 无 `changes/`、无 `delivery-checklist.md`、无 `.yolo-continue` |
| Q4 | 第二轮 agent 正确识别下一个 Phase？ | N/A | 未跑 yolo-driver |
| Q5 | 续跑代码质量 | N/A | 续跑场景没产生 |

### 附加产出（本次会话）

1. **phase-exit-guard 修复**（b62cf78，已 push）：YOLO check hoist 到 block-file-exit 前，hook 无条件写 `.yolo-continue`。机器层修复落地，但未在真实 dev-builder 流程中验证。
2. **Phase 2 代码审视清单**（本次会话产出）：15 项问题（5 错误 + 4 遗漏 + 6 冗余），全部修复。可作为 dev-builder 代码自审的参考 checklist。
3. **forge-verify 框架级缺陷发现 + 修复**（7895b0b，已 commit）：ROOT 写死，不支持用户项目——已修复。加 `--root <path>` 参数 + `resolveRoot()`：优先级 `--root` > cwd（若含 `.forge/` 或 `package.json`）> ReqForge 仓 fallback。原 P3 deferred idea 已实现，从 deferred 标记 ✅。
   - **顺带修第二个 dogfood 发现**：跑 `forge-verify --root C:/work/dogfood-05` 时 `no-placeholders` FAIL——原因是 `grep -rn` 递归进 `packages/md-toc/node_modules`，扫到 `@vitest/expect` 的 FIXME。`checkSecurityPatterns` 用 `collectSourceFiles` 正确跳过 node_modules，但 `checkNoPlaceholders` 用裸 grep 没有 `--exclude-dir`。加 `--exclude-dir=node_modules/dist/.git/.next/build`。
   - **验证**：ReqForge 自检 6 pass / 0 fail / 3 skip；dogfood-05 `--root` 切换正确（仅 dev-map-fresh 合法 FAIL）；forge-smoke 15/15；test-verify-integration 18/18。
4. **content-verify L2 黑盒消除 + 多文件语义错配修复**（本次会话续）：
   - **黑盒消除**：`layer2Check` 已收集 `reasons` 数组但从未输出。在控制台 L2 阶段加 vote-level reason 输出（`content-verify.mjs:1240-1247`）。原 P4 deferred idea 已实现，从 deferred 删除。
   - **多文件语义错配修复**：dogfood-05 Phase 2 三文件验证时 scanner.ts/writer.ts 被 3/3 REJECT，reason 揭示根因——LLM 把「Phase 2: scanner + writer + cli」当作「单次输出应含全部三组件」评判，逐文件验证时单个文件自然「遗漏其他两个」。`LAYER2_PROMPT` 加「multi-file task handling」段落，明确「OUTPUT 是其中一个文件，只评判它那部分」。修复后三文件全 3/3 PASS。
   - **验证**：46 个 content-verify 测试（integration 13 + c2c1 11 + evidence-gate 22）全 PASS，无回归。dogfood-05 Phase 2 代码经 content-verify 验证全 PASS。

### Run #3 真正闭环待跑

**铁律不变**：必须在独立会话（非 ReqForge 仓）跑，用真实 yolo-driver 驱动。本次会话只完成了「代码落地 + 机器层 hook 修复」，没回答「yolo-driver 闭环能不能跨 Phase 跑通」这个核心问题。

执行清单见下节 `[Run #3 执行清单]`。

---

## Run #3 执行清单

### 0. 铁律（同 Run #1/#2）

- **不能在 ReqForge 仓会话里跑** —— 热缓存，且读过 YOLO 规则，必然合规，测不出 drift。
- **单条消息触发，不补指令** —— 纯观察。
- 独立会话 = 新开一个 Claude Code 会话，工作目录 `C:\work\dogfood-05`。

### 1. 重建靶子（Run #1/#2 后目录已不存在）

```powershell
# 在 ReqForge 仓
mkdir C:\work\dogfood-05
cd C:\work\dogfood-05

# 复用 #4 的 md-toc Spec + DEV-PLAN（3 Phase 全 Small/Backend/🟢）
# 从 git 历史或 dogfood-04-tracking.md 找源文，落盘到当前目录

# .forge/config — 变量
mkdir .forge
echo "FORGE_MODE=yolo" > .forge\config

# 预置 confirmed markers — 隔离变量（不重测一次性 confirm 门）
echo '{"confirmed": true, "ts": "2026-07-14"}' > .forge\spec-confirmed.json
echo '{"confirmed": true, "ts": "2026-07-14"}' > .forge\plan-confirmed.json

# 刷新接线
cd C:\work\ReqForge
pnpm forge-install --client claude-code --target C:\work\dogfood-05 --windows
```

### 2. 跑 yolo-driver（独立会话）

**关键**：yolo-driver 不在用户项目，从 Forge checkout 跑：

```powershell
# 独立 Claude Code 会话，工作目录 C:\work\dogfood-05
# 但 yolo-driver 脚本在 ReqForge 仓
cd C:\work\ReqForge
bash scripts\yolo-driver.sh C:\work\dogfood-05
# 或 Windows 原生：
scripts\yolo-driver.bat C:\work\dogfood-05
```

yolo-driver 会循环：
1. cd 进 dogfood-05
2. `claude -p "/dev-builder"`
3. 检查 `.forge/.yolo-continue` → 有则删、循环；无则退出
4. 输出每轮迭代的 Phase 进度

**不要催、不要补指令**。让它自己跑完或停。

### 3. 观测记录表（Run #3 实测，独立会话后回填）

| Phase | 完成? | 用时 | `claude -p` 第几次调用? | `.yolo-continue` 写入? | 备注 |
|-------|-------|------|--------------------------|------------------------|------|
| 1 | ☐ | — | 1 | ☐ | — |
| 2 | ☐ | — | — | — | — |
| 3 | ☐ | — | — | — | — |

- `claude -p` 总调用次数：____
- yolo-driver 退出原因：☐ 全 Phase 完成 ☐ 中途停（停在第 __ 轮） ☐ 死循环（手动 Ctrl-C）
- 是否有人介入：☐ 否 ☐ 是（描述）

### 4. 五问实测

| # | 问题 | 判定标准 |
|---|------|----------|
| **Q1** | **yolo-driver 闭环跑完 3 Phase？** | `claude -p` 调用 = 3 次 = 续跑成立；<3 = 过早停；>3 = 死循环 |
| **Q2** | 停在哪？ | 哪轮迭代退出？什么原因？`.yolo-continue` 缺失还是 agent 没写？ |
| **Q3** | run log 落盘了吗？ | `changes/<phase>/checkpoint.md` + `delivery-checklist.md` + `.yolo-continue`（每 Phase） |
| **Q4** | **第二轮 agent 正确识别"下一个 Phase"？** | 看 agent 第 2/3 轮的输出 / active-scope.json 内容 / `git log` 改了哪些 Phase 的代码。**这是 `nextPhase` 信息丢弃的潜在 drift 验证** |
| Q5 | 续跑代码质量 | 与 #4 单 Phase 跑对比，是否有滑坡 |

### 5. 判定分支

- **Q1 = 3 次且 Q4 正确** → ✅ yolo-driver 闭环成立，dogfood #5 收尾。`nextPhase` 信息丢弃不构成 drift，方案 A（不修）确认。
- **Q1 = 3 次但 Q4 错误**（如第二轮跑回 Phase 1）→ 🔴 `nextPhase` drift 实证，需走方案 B/C（在下一轮 prompt 传 nextPhase 或改 dev-builder prose）。
- **Q1 < 3**（过早停） → fail-safe 触发，看 `.yolo-continue` 缺失在哪轮，定位是 agent 没写还是 yolo-driver 没读到。
- **Q1 > 3**（死循环）→ 罕见，意味着 `.yolo-continue` 在最后一轮仍被写入——可能是 dev-builder 不知道"已是最后一个 Phase"。
