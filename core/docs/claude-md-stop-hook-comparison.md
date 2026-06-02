# ReqForge 与「CLAUDE.md + Stop Hook 元审查」对照

> 参考：[靠 CLAUDE.md，自己实现一个 Stop Hook 就够了](https://mp.weixin.qq.com/s/iZ4goN8KVipHBEhIPihg3A)（公众号「克劳德猎手」；Cole Medin helpline 思路：规则随代码演进）  
> 与 [session-execution-discipline.md](./session-execution-discipline.md)（停止前纪律）、[skill-evolution-comparison.md](./skill-evolution-comparison.md) / `evolution-engine`（反馈驱动进化）、[karpathy-skills-comparison.md](./karpathy-skills-comparison.md)（精简 CLAUDE.md）互补。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **此文** | **元规则维护**：每次会话结束用 Stop Hook 跑无头审查 → `git diff` vs 分层 `CLAUDE.md` → 建议写入 `.claude/claude-md-review.md`（**不自动改**规则） |
| **ReqForge** | **交付门控**：`stop-gate` / `phase-exit-guard` 阻止「未审/Phase 未完成就停」；`evolution-engine` 从 **反馈模式** 提案改 Skill/规则 |

文章解决「说明书过期」；Forge 解决「任务没收尾、规则进化要有证据」。

---

## 文章方案（摘要）

1. **问题**：`CLAUDE.md` 写一次后随重构过时，Agent 按旧路径/旧命令行事。
2. **机制**：`.claude/settings.json` 注册 **`Stop`** → `propose_claude_md.py`：
   - `git rev-parse --show-toplevel` 定根（hook cwd 不可靠）
   - 对改动文件向上收集所有 `CLAUDE.md`
   - 无头 `claude -p` 对比 diff + 各 md → 输出 **`claude-md-review.md`**
   - 环境变量 **`CLAUDE_MD_REVIEW_LOCK`** 防递归
   - 无 CLI 时降级为只列「可能过时的区域」
3. **Prompt 纪律**：仅 `No change needed` / `Propose edit`；禁止风格改写；**禁止**自动写回 `CLAUDE.md`。
4. **成本**：每轮多一次 LLM 调用；小仓/低频改动不划算。
5. **扩展**：同一骨架可审 Skills 描述、`settings.json` 权限、Start Hook 注入上下文——**元 hook** 趋势。

---

## 与 Forge 现有钩子的分工

| 钩子 / 能力 | 触发 | 问的问题 | 输出 |
|-------------|------|----------|------|
| **此文 Stop Hook** | 会话结束 | 规则文件是否与 **本次 diff** 仍一致？ | `claude-md-review.md` 建议 |
| **stop-gate** | Agent 停止前 | 代码改了是否 **未 code-review**？ | 阻止停止 / YOLO 待办 |
| **phase-exit-guard** | 停止前 | `DEV-PLAN` Phase 是否 **未验收**？ | `.forge/phase-exit-block` |
| **detect-feedback-signal** | 停止前 | 是否有可记录的纠正？ | → `feedback/` |
| **evolution-engine** | 用户触发 | 反馈是否形成 **可验证** 的 Skill/规则变更？ | 进化提案 + Verify by |

**互补，不替代**：此文不管测试绿不绿、Phase 完没完；Forge 不管「第 12 行路径是否还叫 `loadEnv`」。

---

## ReqForge 如何降低 CLAUDE.md 腐烂（结构层）

| 策略 | 落点 |
|------|------|
| **调度图 <60 行** | 用户 `CLAUDE.md` / adapter 只指向 Skill；细节在 `SKILL.md`（按需加载） |
| **Spec/Plan 为真相** | 路径、命令、验收以 `Product-Spec.md` / `DEV-PLAN.md` 为准，不靠超长 CLAUDE.md |
| **分层规则** | `core/skills/*/references/`、`memory/decisions-log.md`；与子目录 `CLAUDE.md` 分层理念一致 |
| **反馈进化** | `evolution-engine`：改前要有模式证据 + 预测效果 + 验证方式 |

文章的多层 `CLAUDE.md` 在 **monorepo 用户项目** 仍有价值；Forge 维护者仓以 **Skill 目录** 替代巨型单文件。

---

## 启示与可选落地

| 启示 | 建议 |
|------|------|
| **规则要随 diff 演进** | 大重构后人工扫一眼 `CLAUDE.md`；或用户自选安装此文 hook |
| **只建议、不自动改规则** | 与 Forge 进化纪律一致：提案 → 人确认 → `skill-eval` / 测试 |
| **防递归 LOCK** | 任何 Stop 里再起 Agent 都必须设锁（此文已示范） |
| **元 hook** | 可扩展审 `.forge/security-guidance.md`、`skill.json` 触发语——**不**默认进 `forge-install` |
| **token 成本** | 与 `forge-loop` 一样需预算；短会话可关 |

### 用户项目可选安装（非 core）

若 monorepo 有大量分层 `CLAUDE.md`，可将此文脚本放到 **用户项目** `.claude/hooks/propose_claude_md.py`，与 Forge 钩子 **并列**注册在 `Stop` 链末尾（在 `stop-gate` 之后或独立 `PostStop` 若客户端支持）。

**不要**与 `evolution-engine` 合并为一条 pipeline：前者是 **漂移检测**，后者是 **行为模式升级**。

---

## 刻意不做

- 在 `core/hooks/` 默认加入 `propose_claude_md.py`（token 成本、与 evolution 职责重叠）
- 用 CLAUDE.md 审查替代 `stop-gate` / `phase-exit-guard`
- 自动 `Edit` 用户或 adapter 的 `CLAUDE.md`（违反「人审最后一把锁」）
- 宣称「删掉 CLAUDE.md 只留一个 hook 就够」——Forge 仍需要 **Spec + Skills + 验证门** 才能交付

---

## 快速对照表

| 你只关心… | 用 |
|-----------|-----|
| 规则文件是否跟上重构 | 此文 Stop Hook（自选） |
| 能不能停、审没审、Phase 完没完 | Forge `stop-gate` + `phase-exit-guard` |
| 团队反复犯的错要升级 Skill | `/evolution-engine` + `feedback/` |
| 库 API 别写错 | Context7 MCP（见 [context7-comparison.md](./context7-comparison.md)） |

---

## 参考

- 微信：[iZ4goN8KVipHBEhIPihg3A](https://mp.weixin.qq.com/s/iZ4goN8KVipHBEhIPihg3A)
- 规则演进语境：Cole Medin helpline（文内引用）
- Forge 停止门：`core/hooks/stop-gate.sh`、`core/hooks/phase-exit-guard.sh`
- 会话纪律：[session-execution-discipline.md](./session-execution-discipline.md)
- 进化：[skill-evolution-comparison.md](./skill-evolution-comparison.md)
