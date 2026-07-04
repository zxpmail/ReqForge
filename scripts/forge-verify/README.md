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

### 原理

对应实验 E 的设计：符号层（Phase Gate / 零成本） → 语义验证层（LLM-judge / 每次 1 调用） → 人工兜底（不确定场景）。提供了配置无关的 skip 行为和 async LLM 调用链路。
