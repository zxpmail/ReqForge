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
