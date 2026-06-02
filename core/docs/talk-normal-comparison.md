# ReqForge 与 talk-normal 对照

> 参考：[hexiecs/talk-normal](https://github.com/hexiecs/talk-normal) — 单文件 system prompt，去掉通用对话里的 AI 腔（filler、Closing 菜单、废话分层等）；10 题回归约 **72% 字符下降**且声称信息保留。  
> **非 Forge 依赖**；与 [open-design-comparison.md](./open-design-comparison.md)（设计反 slop）、各 Skill `output-style`（任务输出纪律）互补。

---

## 一句话定位

| 项目 | 擅长 |
|------|------|
| **talk-normal** | **L0 语气层**：让任意 LLM「像正常人说话」 |
| **ReqForge** | **L1 交付层**：Spec→Plan→Build→Review→Release + 证据 + 门控 |

**叠加使用**：用户项目 `AGENTS.md` / `CLAUDE.md` 可安装 talk-normal（`install.sh` 幂等标记块）；Forge Skills **不**内嵌全文 prompt，避免与 code-review 证据格式冲突。

---

## 分工表

| 场景 | 用 talk-normal | 用 Forge |
|------|----------------|----------|
| 闲聊、解读长文、科普 | ✅ | — |
| 写 Product-Spec、DEV-PLAN | — | ✅（要条款与验收） |
| code-review 报告 | — | ✅（要 Spec 引用 + 分级） |
| 发布 / 安全 / S0 事实 | — | ✅（constants + 测试） |

---

## 维护者启示（已写入仓库）

| 启示 | 落点 |
|------|------|
| **负例勿写可被照抄的句式** | [skill-authoring-patterns.md](./skill-authoring-patterns.md) § 禁用词与反例 |
| **精简要有度量** | talk-normal 用字数；Forge 用 `pnpm test` / phase-check / review — 不混 KPI |
| **索引 + 详文** | 同 Forge Prompt slimming：`prompt.md` ↔ `references/workflow.md` |
| **规则回归** | talk-normal `regressions/`；Forge `skill-eval` + ref-lint（可选扩展 slop 用例） |

---

## 用户安装（可选）

```bash
git clone https://github.com/hexiecs/talk-normal.git && cd talk-normal && bash install.sh
```

注入 `# --- talk-normal BEGIN/END ---` 到 `AGENTS.md`；**新会话生效**。卸载：`bash install.sh --uninstall`。

与 `pnpm forge-install` **独立**：先装 Forge 流水线，再按需叠 talk-normal 去 AI 腔。

---

## 刻意不做

- 将 `prompt.md` 拷入 `core/` 或 adapter `CLAUDE.md`（体积、与审查输出冲突）
- 用「更短」替代 code-review / Spec 验收
- Forge 内置 talk-normal 安装器（用户自选即可）

---

## 参考

- [talk-normal README](https://github.com/hexiecs/talk-normal/blob/main/README.md) · [TEST_RESULTS](https://github.com/hexiecs/talk-normal/blob/main/TEST_RESULTS.md)
- [regressions/rule-17-negation-frame.md](https://github.com/hexiecs/talk-normal/blob/main/regressions/rule-17-negation-frame.md) — 负例被模型当模板抄的案例
- Forge 共享精简输出：[`core/skills/_shared/output-style-concise.md`](../skills/_shared/output-style-concise.md)
