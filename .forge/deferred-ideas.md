# Deferred Ideas — 待办池

记录当前不做、但不想丢的想法。每条必须写**触发条件**（什么时候回头考虑），否则就是死想法。

---

## `forge-init --one-line`

**想法**：一行 `curl | bash`（macOS/Linux）或 `irm | iex`（Windows）拉起 ReqForge，跳过现有 `forge_install` 引导流程。

**触发条件**（满足任意一条才回头评估）：
1. 3+ 个外部用户主动反馈"装起来太麻烦"
2. 分发渠道明确要求一行装（如 awesome-claude-code list 的收录门槛）
3. Dogfooding #5 之后，核心 loop 证明稳定，可以挪精力到采用面

**为什么现在不做**：
- 解决的是伪需求 — 真问题是分发（没人知道 ReqForge），不是门槛（Claude Code 自己门槛更高，几百万用户）
- 多平台 install 脚本 + 与现有 `forge_install` 的双路径维护 + Windows hook 注册脆弱性（上周 `d67d69d` 才 fix 过）= 长期 +1 维护面
- 当前主线是真实项目 dogfooding，不是采用面优化

**当前优先级**：P4

**记录日期**：2026-06-25

---

## CI-watch 闭环（SessionStart 拉取红灯 CI → feedback 管道）

**想法**：在 `check-evolution.sh` 加 Part 1.5，SessionStart 跑 `gh run list -L1 --json conclusion,...`；遇 `failure` 且未见过（`.forge/.ci-seen.json` 去重）→ 注入 `dispatch feedback-observer(trigger_reason=test_fail, failure_detail=<log>)`。红灯 CI 本质是 feedback-observer 已有类型的 `test_fail` 信号，复用现有 feedback→evolution 管道，只新增一个拉取触发器。

**触发条件**（满足任意一条才回头评估）：
1. 出现 autonomous `forge-loop` / `forge-phase-loop` 连续 push 且无 human-in-the-loop，红灯 CI 跨越 session 边界未被发现（lazy 闭环只有在此场景才有增量价值）
2. 框架自身 CI（`forge-smoke`）或某真实使用 ReqForge 的项目，出现"红灯 CI 未处理导致下游问题"实例 ≥1
3. `gh` CLI 在目标用户环境的 auth 普及度经调查可接受（否则 graceful no-op 会吞掉大多数场景）

**为什么现在不做**：作者单人维护，CI 红灯 GitHub 直接推送，人工监控已覆盖；SessionStart 拉取是 lazy 闭环（next session 才发现），对 human-in-the-loop 无增量价值；引入 `gh` auth 依赖面反而给最终用户带来 S1 式冷启动摩擦（作者机器 `gh` 已 auth = 热缓存陷阱）。违反"无分发=无伪需求"——真问题是采用面，不是 CI 拉取。

**当前优先级**：P3

**记录日期**：2026-06-27

---

## 过闸契约 prose 从机器生成（③ 的重一半）

**想法**：让 `spec-before-code-gate.mjs` 做单一事实源（SSOT），`hard-gate-summary.md` / `forge-bootstrap` gate 行 / 各 SKILL HARD-GATE 段等 prose 从机器实现**生成**而非手维护，消除 4 处手抄漂移。

**触发条件**（满足任意一条）：
1. gate 集稳定——近期仍有 Nature Gate bypass 这类结构演进，等 ≥3 个版本无 gate 结构变更
2. 出现一次"prose 与机器实现漂移导致用户被误导"的实际事件（smoke-assert 只能 detect 漂移并 fail CI，挡不住 prose 内容本身过时）

**为什么现在不做**：③ 的廉价一半（`machine-gates-doc` smoke-assert：声明 enforced 的 gate 无 enforcing file 即 fail CI，且 Overstepping 必须标注 not-yet-enforced）已交付，drift-detection 达成。生成 prose 是更重机制（generator 脚本 + 模板维护），gate 集还在动时引入 generator = churn。Simplicity First：smoke-assert 已解核心问题。

**当前优先级**：P3

**记录日期**：2026-06-27

---

## Phase-boundary-detector（= Overstepping Gate 的真实机器 enforcement）

> **2026-06-27 更新**：程序式版本已交付（`dd59af2`）——implementer 纪律（`files_to_modify` 范围约束）+ dev-builder Step 8.5 返还后验证（`file_changes` vs `files_to_modify` 交叉核对）。以下条目保留给**钩子强制**版本（待条件满足时考虑升级）。

**想法**：在 `spec-before-code-gate.mjs` 加钩子检查：implementer 写 `allowed_files` 之外的文件时拦截（当前程序式版本只警告不拦截）。这是 Overstepping Gate 的完整机器 enforcement。

**触发条件**（满足任意一条）：
1. 程序式 Phase-boundary-detector 运行中出现 ≥2 次"implementer 无视范围纪律，提交 BLOCKED/DONE_WITH_CONCERNS 后才被主 session 发现"的实例（说明程序式不够，需要强制钩子）
2. DEV-PLAN 的 Key Files 字段格式统一到可被 `.mjs` 正则解析（当前是自由 prose，解析脆弱）

**为什么现在不做**：程序式版本（`dd59af2`）已覆盖核心用例——implementer 纪律约束 + 返还后交叉核对。钩子版本需要更稳定的 Key Files 格式 + 实际证据证明程序式不够。Simplicity First：程序式够了就先不写钩子。

**当前优先级**：P2（程序式已交付；钩子升级降为 P3）

---

## 双 gate 合并 → 单次 confirmation（Q5）

**想法**：合并 `spec-confirmed.json` + `plan-confirmed.json` 为一次"可以开始开发吗"确认。dogfood #2 Q5 判定两者在小项目是纯形式噪音。

**触发条件**（满足任意一条）：
1. ≥2 次 dogfood 重复验证双 gate 在 small/medium 项目无实际防错价值（dogfood #2 是第 1 次，单点不足以下定论）
2. 出现 gate 简化未导致 spec/plan 质量回退的对照数据

**为什么现在不做**：双 gate 是 Spec-Before-Code 链的硬执行点（`spec-before-code-gate.mjs` 依赖这两个 marker），合并牵动 gate 实现 + spec/plan 两 skill 确认流程 + 4 adapter 同步，非小改；dogfood #2 是单一样本（reading-tracker，单人 5 天项目），Q5"噪音"判定需更多规模/团队样本才稳。属 dogfood #2 deferred 提案之一。

**当前优先级**：P3（需更多 dogfood 样本）

**记录日期**：2026-06-27

---

## Stop-time gate 接到非 Claude Code client（opencode / cursor / gemini-cli）

**想法**：把 stop-time gate（`phase-exit-guard` / `stop-gate` / `retry-gate`）真正接到 opencode / cursor / gemini-cli 的 stop 生命周期，使 Sloppiness Gate 在这些 client 也机器生效。

**触发条件**（满足任意一条才回头评估）：
1. opencode 发布原生 `Stop` hook 支持（目前是 open feature request #14863，插件层做不到 Stop re-activation，需 core 支持）
2. cursor adapter 决定重写——真实 schema 是 `.cursor/hooks.json` + `onStop`/`session.start` 等 camelCase 事件（非现有 `settings.json` + `BeforeCommand`），现有 adapter 已 stale；重写需先逐 client 调研每个事件的 stdin/exit 契约
3. ≥1 个真实非-claude-code 用户反馈"stop-time gate 在我的 client 没生效，导致未验证就 done"

**为什么现在不做**：只有 Claude Code 支持真正的 `Stop` 生命周期事件。opencode 无原生 Stop；cursor 当前 adapter 用的是错的 schema（`BeforeCommand` 在 cursor 里不是 stop 语义）；gemini-cli 无 hook 系统。强行写假 `Stop`/`BeforeCommand` 配置 = client 直接忽略 = 重蹈 dogfood #5 发现的 bug（"看起来接好了，实际从不触发"）。Simplicity First：不为不支持的 client 写假接线；现状在 `core/hooks/AGENTS.md` 已标注 Claude-Code-only。

**当前优先级**：P3（依赖外部 client 能力，非框架单方面可控）

**记录日期**：2026-07-02

---

## Contract type="addressable" — 写时 referent 强制验证

**想法**：加 `type="addressable"` contract，强制需求写明 key/path/entity 等 addressable referent，不写全 C1 直接 FAIL。Mike Czerwinski 推的逻辑：relevant 不是不可寻址，是作者没算。把 scope 决策从运行时压到需求写入时。

**触发条件**（满足任意一条才回头评估）：
1. L3 监控数据连续 2+ 周显示"C3 ABSTAIN（无可执行指称）"的需求占人工审查时间 >30%，证明含糊 referent 是真实的 reviewer 负担来源
2. 出现至少 1 个真实案例：一条因 referent 含糊而 C3 ABSTAIN 的需求，C2 通过了但实际有严重缺陷（当前理论上有此可能，但无实例）

**为什么现在不做**：
- 收益已被管道优雅降级覆盖：C3 ABSTAIN → C2 → L3 是正确行为，不是缺口
- C1 是正则层，做不了语义分类。硬做需启发式（脆弱）或偷渡 LLM（越层）
- 真实破口在别处：C1 在真实 agent 产出上 collapse 到 24%（正则匹配不上正确工作），优先级更高
- 没有实测数据证明含糊 referent 是当前的 reviewer 负担大头

**当前优先级**：P4

**记录日期**：2026-07-14

---

## forge-verify 支持 `--root` 参数（用户项目验证）✅ 已实现

**想法**：`scripts/forge-verify.mjs:30` 和 `scripts/forge-verify/content-verify.mjs:87` 的 `ROOT = join(__dirname, "..")` 写死成 ReqForge 仓，导致 `forge-verify` **只能验证 ReqForge 自己**，不能验证用户项目。用户项目 `.forge/quickref.md` 指导跑 `pnpm forge-verify`，但用户项目没有这个脚本，即使有也跑不了——**文档误导**。应加 `--root <path>` 参数或检测 `process.cwd()`。

**实现状态**（2026-07-15）：
- `scripts/forge-verify.mjs` 加 `--root <path>` 参数 + `resolveRoot()`：优先级 `--root` > cwd (若含 `.forge/` 或 `package.json`) > REQFORGE_ROOT fallback
- 验证通过：ReqForge 自验证 6 pass / 0 fail；`node forge-verify.mjs --root C:/work/dogfood-05` 正确切到 dogfood-05
- 顺带修复 dogfooding 暴露的 `checkNoPlaceholders` 扫描 node_modules 的 bug（加 `--exclude-dir=node_modules/dist/.git/.next/build`）
- `content-verify.mjs` 的 ROOT 写死未改（它已通过 `--files` 绝对路径支持用户项目，不需要 --root）

**为什么现在做**：dogfood-05 跑 `forge-verify` 触发"dogfooding 发现工具缺陷 > 读代码审视"模式——这是真实使用场景，不是假设。

**原触发条件**（保留供未来类似决策参考）：
1. 真实用户项目（非 dogfood）需要跑 forge-verify 验证，且遇到"找不到文件"或"验证的不是我的项目"问题 ≥1 次
2. dogfood-05 之外的 dogfood 项目出现，且作者尝试用 forge-verify 验证发现限制
3. forge-verify 被列为用户项目主推验证手段时（当前 CLAUDE.md 已列，但实际不通）

**原不做理由**（已被 dogfooding 推翻）：
- dogfood-05 用 content-verify.mjs + 绝对路径 `--files` 临时绕过，能跑 → 但绕过不等于正确，且绕过本身是认知负担
- forge-verify 的主消费者是 ReqForge 仓自身（框架内省），用户项目验证是次要场景 → 次要 ≠ 不做，dogfood 就是用户项目
- 改 ROOT 需要同步改所有 `join(ROOT, ...)` 调用点（17 处） → 实际只需改 `const ROOT = ...` 一处，所有 join(ROOT, ...) 自动用新值
- 当前主线是 yolo-driver 闭环验证 → 不冲突，并行做

---
