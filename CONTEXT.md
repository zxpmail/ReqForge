# CONTEXT

## 当前正在做什么
- SEA 投稿包装：英文 v0.14 → LaTeX 已重排并对齐中文 v0.19
- **投稿目标待定**：SEA 2026 大概率未入选 NeurIPS 2026（2026-08-04 核实）

## 上次停在哪个位置
- `docs/drafts/experience-routing-sea.tex` 已按 EN v0.14 重写（P1–P4）
- `docs/drafts/experience-routing-sea.pdf` 已重编译：**总 4 页**，References 在第 4 页，正文 <4 页
- 一页摘要已改正文版本号与 P1–P4 口径
- 下一步：**先确认 SEA 2026 是否举办**（OpenReview group 404；官方页仍指 2025）；再 OpenReview 建号 → 盲审确认 → 提交

## SEA 2026 状态核实（2026-08-04，代理恢复后 browse+curl 双通道确认）
- OpenReview `NeurIPS.cc/2026/Workshop/SEA` → **Group Not Found**（web UI 实测）
- NeurIPS 2026 已接受 workshop 全量 100 个 group（OpenReview API）→ **无 SEA**
- SEA 官方 GitHub：6/7 构建 2026 页 → **7/22 commit "Hide unpublished 2026 workshop page"**（`/2026/` gitignored + 分支 `hide-2026-show-2025`）；当前首页 meta-refresh → /2025/
- 隐藏页内真实 CFP（git blob 201b4bb2c6）：Short ≤4pp（**明确收 position**）· Long ≤9pp · excl refs · **8/29 截止** · 9/29 通知 · non-archival · 3 reviews/PC 200+ · 2026 版**未提 double-blind**
- 结论：投 SEA 前必须先确认组织方；备选 NeurIPS 2026 workshop（收 RL/agent/position）：Meta-Agents、SLM-Agents、Verify-Agents、AgenticLS
- endorsement 草稿（arXiv cs.LG）已归档 → `docs/drafts/archive/`（SEA 泡汤退 arXiv 时可用）

## 近期关键决定
- 条件 5：任一子款触发即失败；须检齐三款
- C1：P1 改为「预算语义缺席」，不写「违 P1」
- 其余弱点（4(b)/墙钟启动/口味战等）明确不改，冻结
- LaTeX 增补（不改冻结论点）：SEA 动机一句、Validated 操作底线、条件 5 小样本/selection bias 说明；\(\mathcal{B}\)→\(\mathcal{P}\) 避与 batch \(B_t\) 撞车
