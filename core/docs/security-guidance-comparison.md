# ReqForge 与 Claude Code security-guidance 对照

> 参考：[告别事后审计！Claude Code 上线实时安全审查插件](https://mp.weixin.qq.com/s/EtlbUi_z5ReyCc-cujEbSA)（知识发电机）  
> 高后果事实分层（S0/S1/S2）：[Codex 酒店语音红队 — 报警号码错误](https://mp.weixin.qq.com/s/UvsPARnid0cb0WxwA6PeLg) → `security-guidance-template.md` § 后果等级  
> Anthropic 官方能力见 Claude Code 插件市场 **security-guidance**。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **security-guidance 插件** | Claude Code 内 **实时** 轻量安全检查（编辑 / diff / commit 三层 hooks） |
| **ReqForge** | 跨客户端 Harness：**项目内** `.forge/security-guidance.md` + 审查 Skill + `forge-verify` 兜底 |

插件解决「写的时候别埋雷」；Forge 解决「规则可版本化、三端一致、与 Spec/Plan 流程衔接」。

---

## 三层检查 ↔ Forge 落点

| 插件层级 | ReqForge 对应 | 状态 |
|----------|---------------|------|
| 编辑文件时扫危险模式 | `forge-verify` → `security-patterns`（Phase 后 grep） | ✅ 轻量、可关 |
| 一轮输出后 review diff | `dev-builder` Task 微循环 → `code-reviewer-security` | ✅ Task 级 |
| commit 时上下文校验 | `pre-commit-check`（轻量：TS `tsc` + README 版本序）、`forge-verify`（Phase：编译/测试/占位符等） | ✅ 分层（commit ≠ 全量 verify） |
| 组织规则 `claude-security-guidance.md` | **`.forge/security-guidance.md`**（`forge-install`） | ✅ v1.29+ |

Forge **刻意不做** PreToolUse 每次 Write 实时拦（误杀与维护成本高）；团队可先写清 `security-guidance.md`，再按需加 hook。

---

## Skill 引用链

| 阶段 | 必读 `security-guidance.md` 的时机 |
|------|-------------------------------------|
| `/dev-builder` | Loading Phase；安全敏感 Task（auth、支付、上传） |
| `/code-review` | `change_complexity` ≥ moderate 或 security 子 Agent 激活时 |
| `/release-builder` | 发布前 smoke / 隐私扫描前 |

---

## 与 founders-playbook Security Gate

| Playbook | Forge |
|----------|-------|
| 发布前安全审查 | `release-builder` + 本文件 + `code-reviewer-security` |
| 团队教训固化 | `.forge/security-guidance.md` + `memory/decisions-log.md` |
| 不替代合规/SOC2 | 文档标明 Out of scope |

---

## 刻意不做

- 绑定单一 Claude 插件市场（Cursor/OpenCode 用户无法同等使用）
- 替代 CI、SAST、依赖漏洞扫描（供应链须专用工具）
- 实时阻断所有 `pnpm add`（仅纪律 + review，无 OS 级拦截）

---

## 参考

- [security-guidance-template.md](../templates/security-guidance-template.md)
- [code-review/SKILL.md](../skills/code-review/SKILL.md)
- [release-builder/SKILL.md](../skills/release-builder/SKILL.md)
- [forge-verify/README.md](../../scripts/forge-verify/README.md)
