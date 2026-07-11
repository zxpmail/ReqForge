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
| 7 | content-quality | 分层结构化内容验证（L0 形状 → L0e Re-Stat → L1 合约 → L2 LLM → L3 分歧） | 已配置 `.forge/content-verify.json` 的项目 |

## 基线对比流程

1. **开发前**：`pnpm forge-verify --baseline save`
2. **开发后**：`pnpm forge-verify --baseline compare`
3. **判定**：新增失败必须修，全过才算 Phase 完成

## 基线文件

`.forge/verify-baseline.json` — 建议加入 `.gitignore`（基线是本地开发状态快照）

---

## 内容验证（可选，双模式）

`content-quality` 检查支持两种管道：

### 模式 A：传统四层（无证据门）

产物内容逐文件通过 L0→L0e→L1→L2→L3 管道。适用于不需要证据文件的工作流。

```
         ┌──────────────┐
 产物 →  │  Layer 0      │  形状/存在性
         │  (确定性代码)  │  空文件？纯标点？占位符？零用例？
         └──────┬───────┘
                │ 通过        ┌──────────────┐
                ├────────────→│  Layer 0e     │  Re-Stat（复述检测）
                │             │  (确定性代码)  │  未来时态/桩代码/元评论
                │             └──────┬───────┘
                │ 通过              │ 通过
                │                   ├────────────→┌──────────────┐
                │                   │              │  Layer 1      │  合约匹配
                │                   │              │  (确定性代码)  │  minLen/keywords/noKeywords
                │                   │              └──────┬───────┘
                │                   │ 通过              │ 通过
                │                   │                    ├────────→┌──────────────┐
                │                   │                    │         │  Layer 2     │  LLM 瘦审查
                │                   │                    │         │  (语义充分)  │
                │                   │                    │         └──────┬───────┘
                │                   │                    │  分歧>阈值     │全票一致
                │                   │                    ├─────────────→┌──────────────┐
                │                   │                    │              │  Layer 3     │  分歧/转人工
                │                   │                    │              └──────────────┘
                ↓                   ↓                    ↓
             ❌ 拒绝             ❌ 拒绝              ✅ 自动通过
```

### 模式 B：证据门管道（推荐，实验通道对比 + 合约验证结论）

当配置了 `evidence_gates` 时，产物文件通过 L0→L0e→L1 后进入证据门管道，替代传统的 L2 自由文本 LLM。

```
         L0 → L0e → L1 (同上)
              │ 通过
         ┌────▼──────────────┐
         │  Evidence Gate     │  证据文件存在且非空（确定性，零成本）
         │  (check filesystem)│  对应实验 Phase 1 Channel B
         └───────┬───────────┘
                 │ pass?
            ┌────┴────┐
          ╱ NO        YES
         ❌ 拒绝       │
                 ┌────▼──────────────┐
                 │  C1 合约正则       │  逐需求 regex 匹配证据内容（确定性，零成本）
                 │  (确定性的)         │  对应实验 Phase 2 C1
                 └───────┬───────────┘
                         │ pass?
                    ┌────┴────┐
                  ╱ NO        YES  ──────→  L3
                 ❌ 拒绝      │
                              │ 若 type=llm 需求存在或 C1 UNCLEAR
                         ┌────▼──────────────┐
                         │  C2 逐需求 LLM     │  逐条判断证据是否满足需求（有成本）
                         │  (per-req LLM)     │  对应实验 Phase 2 C2，检测率 100%
                         └───────┬───────────┘
                                 │ pass?
                            ┌────┴────┐
                          ╱ NO        YES ──→ L3
                         ❌ 拒绝

         L3 分歧检测（共享，所有路径最终汇聚）
```

**实验结论（2026-07-09, 19 场景, deepseek-v4-flash）：**
- C0（自由文本 LLM，旧 L2）：42.9% 准确率 — 被 agent 话术说服
- C1（合约正则）：85.7%，检测率 80% — 数值约束近零误报，但有"否定盲区"
- C2（逐需求 LLM）：85.7%，**检测率 100%** — 逐需求判断防止整体被说服
- Evidence Gate + C1 + C2 组合：**91.7% 准确率**，唯一共享盲区是 DPI 语义缺口

详见 blog 仓 `agent-determinism-illusions` → `channel-comparison-experiment.md` + `channel-comparison-experiment-phase2.md`

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
- **`evidence_gates`**（选填，推荐）：证据门管道。配置后替代 L2 自由文本 LLM，走 `EG → C1 → C2` 管道。

  ```json
  "evidence_gates": {
    "evidence_dir": ".skillgate/evidence",
    "requirements": [
      {
        "id": "REQ-1",
        "desc": "IP 级别限流",
        "evidence_file": "test-output.txt",
        "pattern": "(?i)(RateLimiter.*IP|isRateLimited.*IP)",
        "type": "regex"
      },
      {
        "id": "REQ-2",
        "desc": "write-invalidation 语义判断",
        "evidence_file": "diff-review.md",
        "type": "llm"
      }
    ]
  }
  ```

  - **`evidence_dir`**：证据文件目录，相对于项目根或绝对路径。
  - **`requirements[].pattern`**：C1 合约正则的 JS RegExp 模式。支持 `(?i)` 前缀转换为 `i` 标志。
  - **`requirements[].type`**：
    - `"regex"` → 走 C1 正向合约（确定性，零成本）。pattern 匹配证据内容 → PASS，不匹配 → FAIL。
    - `"negative"` → 走 C1 负向合约（确定性，零成本）。pattern 匹配证据内容 → FAIL（证据含不应出现的内容），不匹配 → PASS。
    - `"llm"` → 走 C2（逐需求 LLM，有成本）。适合语义判断（"是否真正实现了 write-invalidation"）。
  - **推荐策略**：数值约束和固定格式用 regex，语义判断用 llm。需要堵 scope-matches-claim 缺口（如正向关键词匹配但上下文是否定）时用 negative。同一批需求可以混合三种 type，先过 C1 正向/负向、再过 C2。

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
| `ANTHROPIC_BASE_URL` | API 地址（含 `/anthropic` → 走 Anthropic Messages 协议；否则 → OpenAI） | `https://api.deepseek.com` |
| `ANTHROPIC_MODEL` | 模型名 | `deepseek-chat` |

**LLM 协议自适应：** L2/C2 经统一 `llmComplete()` 调用层，依据 `ANTHROPIC_BASE_URL` 是否含 `/anthropic` 自动选协议 —— 含则走 Anthropic Messages（`/v1/messages` + `x-api-key`，如智谱 GLM 的 `/api/anthropic` 网关，与 Claude Code 同链路），不含则走 OpenAI Chat Completions（`/v1/chat/completions` + `Bearer`，如 deepseek）。一份 `ANTHROPIC_*` env 在两类端点下都可用，无需改代码。`--runs N`（含 `--from-config` 模式）控制每需求投票次数。

**C2 诚实降级：** C2 把 API/解析错误（HTTP 非 2xx、空响应、网络异常）记为非投票（`null`），降级为 `UNCLEAR (C2_api_errors)`，绝不伪装成 `REJECT (execution-lapse)` —— 模型不可达时不会误报"agent 偷懒"。L2 同理（`API_ERROR`/`API_PARSE_ERROR` 为非投票 → L3 分歧 → UNCLEAR）。

### 输出增强字段（v2）

每次验证运行输出增加以下字段：

#### `failure_class`

每个阶段 verdict 附带 failure_class（映射到 feedback-observer 分类）：

| failure_class | 阶段 | 含义 |
|---------------|------|------|
| `execution-lapse` | L0, L0e, EG, C2 | Agent 没做/没产出（空、桩、证据缺失） |
| `skill-defect` | L1, C1 | 合约/正则已定义但输出不满足（skill 未覆盖） |
| `unset` | L0e, L1, C1, C2, L3 | 语义不确定/API 错误/无法归类 |

failure_class 连接 forge-verify 和 feedback-observer：一次 verification REJECT 自动触发对应 failure_class 的 feedback，无需额外分类。

#### `evidence`（chain-of-evidence）

每个阶段输出包含 `evidence` 字段，追溯判据来源：

- L0/L0e/L1/L2: `file:<relative-path>` — 内联内容
- EG: `evidence:<filename>` — 证据文件路径
- C1: `evidence:<filename>(<pattern>)` — 证据文件 + 正则模式
- C2: `evidence:<filename>(<req-id>)` — 证据文件 + 需求 ID

最终输出包含 `trace` 对象：

```json
"trace": {
  "chain": [
    { "stage": "L0", "verdict": "PASS", "evidence": "file:src/rate-limit.ts" },
    { "stage": "EvidenceGate", "verdict": "PASS", "evidence": "evidence:test-output.txt" },
    { "stage": "C1", "verdict": "PASS", "evidence": "evidence:test-output.txt((?i)isRateLimited)" }
  ],
  "evidence_files": {
    "test-output.txt": { "path": "...", "size": 142, "mtime": 1234567890 }
  },
  "checked_at": 1234567890123
}
```

`evidence_files` 记录证据文件 mtime，用于 STALE 检测：如果证据文件在验证后被修改，trace 标记为可能过期。

### 测试脚本

| 脚本 | 用途 |
|------|------|
| `test-dfv2-failure-class.mjs` | 20 DF v2 场景 × 确定性层，验证 failure_class 映射 |
| `test-evidence-gate.mjs` | EG → C1 → C2 管道，验证 failure_class 传播 + 短路行为 |

运行：`node scripts/forge-verify/test-evidence-gate.mjs`

### 进化引擎边界（editable-surface.json）

`.forge/editable-surface.json` 定义 evolution-engine 可写的文件范围：

- **可选路径**：`core/skills/`, `core/hooks/`, `.forge/harnesses/` 等
- **只读路径**：`scripts/forge-verify/`（验证代码）、`.forge/content-verify.json`（生产配置）
- 演化引擎不能修改自己的边界定义（`editable-surface.json` 本身是只读的）

详见 `core/skills/evolution-engine/SKILL.md` → [Harness Search] 和 [Editable Surface Check]。

### 已知局限

跨模型语义验证（Layer 2）存在不可消除的精度-召回权衡。分层架构的作用不是消除这个权衡——它通过在 Layer 0/1 用确定性代码拦截明显垃圾，来**减少喂到 Layer 2 的样本量**。Layer 2 的权衡依然存在，但影响范围缩小了。

详细实验数据见 `github.com/zxpmail/blog` → `agent-determinism-illusions` → 实验 F + 终章补遗。
