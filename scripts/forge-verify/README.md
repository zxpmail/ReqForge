# forge-verify — 事后统一验证入口

## 用法

```bash
pnpm forge-verify                           # 运行验证，失败 exit 1
pnpm forge-verify --baseline save           # 保存当前结果为基线
pnpm forge-verify --baseline compare        # 与基线对比，输出增量
pnpm forge-verify --baseline check          # 与基线对比，有新增失败则 exit 1（默认）
```

## 验证项

| # | 名称 | 说明 | 适用 |
|---|------|------|------|
| 1 | skill-quality | `pnpm validate-skill` | 仅 ReqForge 框架仓 |
| 2 | compile | `tsc --noEmit` 或 build | 有 tsconfig 的项目 |
| 3 | test | vitest / jest | 有测试配置的项目 |
| 4 | no-placeholders | grep TBD/FIXME in src/ | 所有项目 |
| 5 | dev-map-fresh | .forge/dev-map.md 存在且已填充 | 所有项目 |
| 6 | security-patterns | `eval` / `new Function` 轻量扫描（需 security-guidance.md） | 有 src/ 的项目 |
| 7 | content-quality | 跨模型语义验证 — 用 LLM 检查输出内容是否满足任务要求 | 已配置 `.forge/content-verify.json` 的项目 |

## 基线对比流程

1. **开发前**：`pnpm forge-verify --baseline save`
2. **开发后**：`pnpm forge-verify --baseline compare`
3. **判定**：新增失败必须修，全过才算 Phase 完成

## 基线文件

`.forge/verify-baseline.json` — 建议加入 `.gitignore`（基线是本地开发状态快照）

---

## 语义内容验证（可选）

在 Phase Gate 的符号层检查（文件存在 / exit code）之外，`content-quality` 检查用 LLM 验证**产物内容是否确实满足任务要求**——这是实验 E 中验证过的跨模型语义共识方案的工程化实现。

### 配置

在项目 `.forge/content-verify.json` 中添加：

```json
{
  "task": "当前 Phase 的任务描述（如：实现用户注册 API，含参数校验 + 异常处理 + 测试）",
  "files": ["src/api/register.ts", "tests/register.test.ts", "docs/api/register.md"]
}
```

### 运行

```bash
pnpm forge-verify-content
```

检查结果将逐文件显示 `PASS` / `REJECT` / `UNCLEAR`，并附带模型给出的判断理由（便于追溯）。未通过的检查可被 `forge-verify` 的 `content-quality` 项发现（前提是 `.forge/content-verify.json` 已配置）。

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ANTHROPIC_AUTH_TOKEN` | API token | — |
| `ANTHROPIC_BASE_URL` | API 地址 | `https://api.deepseek.com` |
| `ANTHROPIC_MODEL` | 模型名 | `deepseek-chat` |
| `VERIFY_RUNS` | 每文件投票次数（抗温度 0 发散） | `3` |

### 原理

对应实验 E 的设计：符号层（Phase Gate / 零成本） → 语义验证层（LLM-judge / 每次 N 调用，默认 3 次投票） → 人工兜底（不确定场景）。提供了配置无关的 skip 行为和 async LLM 调用链路。

### 已知局限（来自实验 E 实测）

跨模型语义验证存在一个不可消除的权衡：**模型越强，假阳率越低，但误杀合法产物的比例同步上升。**

| 模型 | 假阳率（垃圾被放行） | 误杀合法（好的被毙） | 说明 |
|------|-------------------|-------------------|------|
| qwen3:0.5b（弱模型） | 25% | 50% | 适合容忍少量垃圾的场景 |
| gemma3:4.3b（中等） | 25% | 50% | 更稳，但边界相同 |
| GLM-5.2 / DeepSeek（强模型） | 0% | **75%** | 不放垃圾但大量误杀 |

没有免费午餐。选择什么强度的模型取决于工程上更能接受漏垃圾（假阳）还是误杀合法（误杀）。

**建议：** 默认使用 3 次多数投票（`--runs 3`）抗温度 0 发散。如果误杀率过高，尝试切换弱模型并接受更高的假阳率；如果假阳率过高，切换强模型并为误杀准备人工复查通道。

详细实验数据见 `github.com/zxpmail/blog` → `agent-determinism-illusions`。
