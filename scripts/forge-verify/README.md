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
| 7 | content-quality | 四层结构化内容验证（L0 形状 → L1 合约 → L2 LLM → L3 分歧） | 已配置 `.forge/content-verify.json` 的项目 |

## 基线对比流程

1. **开发前**：`pnpm forge-verify --baseline save`
2. **开发后**：`pnpm forge-verify --baseline compare`
3. **判定**：新增失败必须修，全过才算 Phase 完成

## 基线文件

`.forge/verify-baseline.json` — 建议加入 `.gitignore`（基线是本地开发状态快照）

---

## 四层内容验证（可选，实验 F 架构）

`content-quality` 检查用分层架构验证产物内容是否满足任务要求。架构来源于实验 F（blog 仓 `agent-determinism-illusions`，评论区 Alexey Spinov / Manuel Bruña 的分层建议）：

```
         ┌──────────────┐
 产物 →  │  Layer 0      │  形状/存在性
         │  (确定性代码)  │  空文件？纯标点？占位符？零用例？
         └──────┬───────┘
                │ 通过        ┌──────────────┐
                ├────────────→│  Layer 1      │  合约匹配
                │             │  (确定性代码)  │  minLen/keywords/noKeywords
                │             └──────┬───────┘
                │ 通过              │ 通过
                │                   ├────────────→┌──────────────┐
                │                   │              │  Layer 2      │  LLM 瘦审查
                │                   │              │  (语义充分性)  │  只处理确定性无法判断的残差
                │                   │              └──────┬───────┘
                │                   │  分歧 > 阈值        │ 全票一致
                │                   ├──────────────────→┌──────────────┐
                │                   │                   │  Layer 3      │  转人工 / 写报告
                │                   │                   └──────────────┘
                ↓                   ↓
             ❌ 拒绝             ❌ 拒绝              ✅ 自动通过
```

### 实验数据（8 场景 + 30 样本验证）

| 指标 | Layer 0/1（零成本） | Layer 2（LLM） |
|------|-------------------|---------------|
| 垃圾拦截率（P1 8 场景） | **100%**（4/4 垃圾在到达 LLM 前拦截） | — |
| 垃圾拦截率（P4 30 样本） | **80%**（8/10 垃圾零成本拦截） | 剩余 2 个语义模糊样本 |
| LLM 调用节省（P1） | **50%**（4/8 根本不调 LLM） | — |
| LLM 调用节省（P4） | **33%**（10/30 不调 LLM） | — |
| 确定性层假阳性 | **0%**（不误杀合法） | — |

### 配置

在项目 `.forge/content-verify.json` 中添加：

```json
{
  "task": "当前 Phase 的任务描述",
  "files": ["src/api/register.ts", "tests/register.test.ts"],
  "contracts": {
    "src/api/register.ts": {
      "minLen": 100,
      "keywords": ["register", "validate", "password"],
      "noKeywords": ["TODO", "FIXME"]
    }
  },
  "layer3": {
    "divergence_threshold": 0.8,
    "uncertain_output": ".forge/verify-uncertain.json"
  }
}
```

- **`contracts`**（选填）：Layer 1 文件级合约。`minLen` 最小字符数，`keywords` 需含关键词（≥1/3 匹配即通过），`noKeywords` 禁用关键词。
- **`layer3.divergence_threshold`**（选填，默认 0.8）：Layer 3 分歧阈值。当 N 次投票中最大比例低于此值 → UNCLEAR 转人工，不做多数决。
- **`layer3.uncertain_output`**（选填）：UNCLEAR 结果写入路径。

### 运行

```bash
pnpm forge-verify-content          # 从 .forge/content-verify.json 读配置
pnpm forge-verify-content --from-config  # 显式指定
```

逐文件输出各层判定结果：

```
  📄 src/api/register.ts
  ❌ REJECT @ L3: REJECT (3/3 票)
    └ L1: UNCLEAR — 含禁用关键词: FIXME
    └ L2: [REJECT/REJECT/REJECT] PASS=0 REJ=3
    └ L3: REJECT — REJECT (3/3 票)
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ANTHROPIC_AUTH_TOKEN` | API token（必填） | — |
| `ANTHROPIC_BASE_URL` | API 地址 | `https://api.deepseek.com` |
| `ANTHROPIC_MODEL` | 模型名 | `deepseek-chat` |
| `VERIFY_RUNS` | 每文件投票次数 | `3` |

### 已知局限

跨模型语义验证（Layer 2）存在不可消除的精度-召回权衡。分层架构的作用不是消除这个权衡——它通过在 Layer 0/1 用确定性代码拦截明显垃圾，来**减少喂到 Layer 2 的样本量**。Layer 2 的权衡依然存在，但影响范围缩小了。

详细实验数据见 `github.com/zxpmail/blog` → `agent-determinism-illusions` → 实验 F + 终章补遗。
