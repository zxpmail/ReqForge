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

**想法**：implementer 产出文件若超出当前 DEV-PLAN Phase 声明的 deliverable 文件列表 → 发警告让 PM 确认是否合并 Phase。这是 Overstepping Gate 当前缺失的机器 enforcement（目前 Overstepping 仅 skill prose + `change-manager`，非 hook——见 CLAUDE.md 标注）。

**触发条件**（满足任意一条）：
1. dogfood #2 已观察到 implementer 在 Phase 1 批量交付 Phase 2-3 代码（Q1 证据）；当累计 ≥2 次"implementer 跨 Phase 交付导致返工 / Phase 边界失效"实例时
2. DEV-PLAN 模板的 Phase deliverable 字段稳定到可机器解析（当前粒度/格式未统一）

**为什么现在不做**：需 DEV-PLAN 每个 Phase 声明确定的文件列表；跨 Phase 交付目前由 human PM 在 `dev-builder` 调用边界把控。属 dogfood #2 deferred 提案之一（commit `436322a` 注明 deferred）。

**当前优先级**：P2（dogfood 已有证据，待 DEV-PLAN deliverable 字段标准化）

**记录日期**：2026-06-27

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
