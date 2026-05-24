# ReqForge 与 autoresearch 对照

> 参考：[karpathy/autoresearch](https://github.com/karpathy/autoresearch)（在 [nanochat](https://github.com/karpathy/nanochat) 上单 GPU 自主实验：固定 5 分钟预算、单指标 val_bpb、只改 `train.py`）  
> 本文说明两者定位差异、**可借鉴的实验组织纪律**，以及 ReqForge **不应自建** 的部分。与 [nanochat-comparison.md](./nanochat-comparison.md)、[rtk-comparison.md](./rtk-comparison.md)、[superpowers-comparison.md](./superpowers-comparison.md) 互补：nanochat = 端到端训练 Harness；autoresearch = **scoped 改动 + 固定预算 + keep/discard 环**；Superpowers = TDD / 子 Agent。

---

## 一句话定位

| 项目 | 擅长 |
|------|------|
| **autoresearch** | **自主实验环**：`prepare.py` 锁定、`train.py` Agent 改、`program.md` 人改；5min 墙钟；**val_bpb** keep/discard |
| **ReqForge** | **产品交付 Harness**：Spec → Plan → 实现 → verify → 审查 → 发布；`changes/` 隔离实验；Machine Gates |

**关系**：autoresearch 教 **在约束内高频实验 + 单一 falsifiable 指标**；Forge 把同一套纪律用在 **需求→可发布产品**，**不**跑 LLM 训练循环。**借鉴方法论，不叠加运行时。**

---

## 三文件架构 ↔ Forge

| autoresearch | ReqForge | 说明 |
|--------------|----------|------|
| `prepare.py`（不可改） | `Product-Spec.md` + Machine Gates + Hook 红线 | **约束边界** |
| `train.py`（唯一可改） | 当前 Phase / Task 范围内的业务代码 | **实验空间** |
| `program.md`（人改组织） | CLAUDE.md / AGENTS.md + Skills + evolution 提案 | **编排层** |

```mermaid
flowchart TB
  subgraph ar [autoresearch]
    P[prepare.py 锁定]
    T[train.py Agent 改]
    M[program.md 人改]
    P --> T
    M -.指导.-> T
    T --> M5[5min train]
    M5 --> V{val_bpb 更好?}
    V -->|yes| Keep
    V -->|no| Discard
  end

  subgraph forge [ReqForge]
    S[Product-Spec / Plan 只读]
    C[Task 代码改动]
    SK[Skills / changes/]
    S --> C
    SK -.指导.-> C
    C --> MC[微循环 verify]
    MC --> CM{主指标 + 测试}
    CM -->|pass| Archive
    CM -->|fail| Retry / abandon
  end
```

---

## 六项启示 ↔ Forge 落点

### 1. 约束编辑边界（Constrained Edit Space）

| autoresearch | ReqForge 现状 | 落点 |
|--------------|---------------|------|
| 物理上只改 `train.py` | prompt + 🔴 行为边界 + Overstepping Gate | **dev-builder**：实现阶段 **Spec/Plan 只读**；改需求 → `/change-manager` 或用户确认后 replan |
| — | 无 hook 拦 Spec/Plan 写入 | **路线图**：PreToolUse 拒写 `Product-Spec.md`/`DEV-PLAN.md`（白名单 change-manager / spec-builder） |

### 2. 紧密验证循环（Tight Feedback Cadence）

| autoresearch | Forge 现状 | 落点 |
|--------------|------------|------|
| 5min / ~12 轮/小时 | TDD Task 环；Task ≤15min | **dev-builder 微循环**：每个 Task 在 **10 分钟内**跑针对性测试并贴 **命令 + 结果** |
| — | Phase 整体验收偏长 | Phase 仍四步验收；Task 级先快环 |

### 3. Agent Swarm / 并行探索

| autoresearch | Forge 现状 | 落点 |
|--------------|------------|------|
| 多 Agent 各分支实验 | **4 并行 code-reviewer** | **路线图**：多 implementer 探索（P2）；短期强化 **`changes/` = fork→实验→verify→archive** |
| — | dep-graph blast-radius | 与 exploration 天然互补 |

### 4. 单一度量标准（Single Source of Truth）

| autoresearch | Forge 现状 | 落点 |
|--------------|------------|------|
| 仅 **val_bpb** | Phase 验收多条、偏定性 | **dev-planner**：每 Phase **Primary metric**（一条，Phase 内不变） |
| — | evolution **Verify by** | Task 完成 = 主指标 + 测试绿；其余 lint 为门禁 |

### 5. 人机分工进化（实验设计师）

| autoresearch | Forge 现状 | 落点 |
|--------------|------------|------|
| 人改 `program.md`，Agent 搜 `train.py` | 人写 Spec，Forge 执行 | 一致；**unattended deep-dive** = 路线图（需 #1+#4+报告 artifact，不能关权限通宵） |

### 6. 极简主义

| autoresearch | Forge 现状 | 落点 |
|--------------|------------|------|
| 630 行、3 文件 | 12 Skill、10 Hook | 域不同；用 **minimal loadout** + 定期 audit，不为 star 砍 change-manager/review |

---

## 与 change-manager / nanochat 的关系

| 机制 | autoresearch 类比 |
|------|-------------------|
| `changes/<name>/` | 单次实验分支（只改 scoped 范围） |
| verify + archive | keep / discard |
| [test-demo 黄金路径](../../test-demo/README.md) | 固定 prepare+train 后的 **一次**验收（不自动重跑 Skill） |
| [nanochat-comparison.md](./nanochat-comparison.md) | speedrun；autoresearch 在其上优化 `train.py` |

---

## 与 ReqForge Skill 的关系

| Skill | autoresearch 启示 |
|-------|-------------------|
| **product-spec-builder** | = `prepare.py`：定义不可侵边界与指标 |
| **dev-planner** | 每 Phase **Primary metric** + 验收预算 |
| **dev-builder** | Spec/Plan 只读；Task **微循环**；代码= `train.py` |
| **change-manager** | fork → 实验 → verify → merge/abandon |
| **code-review** | autoresearch 无；Forge **必须保留** |
| **evolution-engine** | 人改 program；提案 **Predicted effect + Verify by** = val_bpb |

---

## ReqForge 已从 autoresearch 借鉴（v1.24 文档级）

| 借鉴点 | 落点 |
|--------|------|
| prepare/train/program 分层 | 本文；dev-builder Spec/Plan 只读 |
| 5min 快环精神 | dev-builder Task 微循环（≤10min 验证） |
| val_bpb 单指标 | dev-planner **Primary metric** 列 |
| changes/ 实验分支 | change-manager 文档强化（已有流程） |
| program.md = Skill | Skills 体系（已有） |

---

## 明确不做

| autoresearch 能力 | ReqForge 为何不做 |
|-------------------|-------------------|
| 通宵关权限自主改库 | Machine Gates、platform-compliance、用户审查 |
| 单一 val_bpb 压一切 | 产品需功能 + 安全 + 多门禁 |
| LLM 训练循环 | 领域不同 |
| 数千 Agent swarm 产品化 | P2 路线图；非 v1.23 欠账 |
| 将 autoresearch 列为依赖 | 方法论参照 only |

---

## 选型简表

| 场景 | 建议 |
|------|------|
| 自主优化 LLM 训练代码 | 用 **autoresearch** + nanochat |
| 从想法做可发布产品 | **ReqForge** 全流程 |
| 存量 scoped 功能 | **change-manager**（= 实验分支） |
| 学实验组织纪律 | 本文 + nanochat-comparison |

---

## Related

- [nanochat-comparison.md](./nanochat-comparison.md) — speedrun / test-demo
- [openspec-comparison.md](./openspec-comparison.md) — changes/ 工件
- [harness-maturity-checklist.md](./harness-maturity-checklist.md) — falsifiable 验证环
- [test-demo/README.md](../../test-demo/README.md) — 黄金路径守门
