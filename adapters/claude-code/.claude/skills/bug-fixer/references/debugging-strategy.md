# Debugging Strategy（四阶段）

No stage-skipping allowed. CoT checklist → `cot-diagnostic-checklist.md`.
交付前自审 → `anti-ai-slop-checklist.md`.

---

## Stage 1: Collect Evidence

**Goal**: Gather all available signals before forming any hypothesis.

### Generic

- Read the full error message and stack trace
- Reproduce the bug (consistent vs intermittent) → if cannot reproduce reliably, do NOT fix yet
- Check recent code changes (`git log --oneline -10`, `git diff`)
- Multi-component systems → identify layer (frontend / API / database / third party)
- Trace data flow from trigger to error point

### ReqForge-specific

- **Dependency Graph**: if `.forge/graph.json` exists → `pnpm dep-graph affected <file>` to scope blast radius before touching any code
- **Trace history**: `pnpm forge-bug-fix status` — 检查 `.forge/trace/` 下是否有同类 bug 的历史 trace。如果同一区域最近修过类似问题，先读 trace 记录再动手
- **Project memory**: read `memory/project-memory.md` → Known Pitfalls 节，看当前 bug 是否命中已知模式
- **Decisions log**: check `memory/decisions-log.md` — 最近的技术决策可能引入了当前 bug 的条件
- **Scenario-specific diagnose**: 根据问题类型运行专项诊断：
  - 编译/类型错误 → `pnpm forge-bug-fix diagnose --scenario compile`
  - 环境/配置问题 → `pnpm forge-bug-fix diagnose --scenario config`
  - 数据/IO 问题 → `pnpm forge-bug-fix diagnose --scenario data`
- **Cross-skill check**: bug 可能来自上游产出物（Spec 矛盾、DEV-PLAN 过时）。如果 Product-Spec.md 存在，交叉验证实际行为与 Spec 描述是否一致

---

## Stage 2: Analyze Patterns

**Goal**: Find structure in the evidence — what's similar to what, what changed, what's different from a working case.

### Generic

- Find a similar feature that works; compare with broken one
- Understand dependencies (modules / data / state)
- If Product-Spec.md exists → confirm expected behavior

### ReqForge-specific

- **forge-bug-fix classify**: `pnpm forge-bug-fix classify` — 自动分类错误类型，输出建议修复方向。用输出结果辅助假设排序
- **Bisect**: 如果 bug 由近期提交引入（且能通过测试检测）→ `pnpm forge-bug-fix bisect <good-commit> [bad-commit]` 自动定位首个故障提交
- **Domain-specific pattern matching**: 对比当前 bug 与 project-memory 中记录的已知陷阱。如果模式匹配，直接跳到最后一条已知修复方案验证

---

## Stage 3: Hypothesis Verification

**Goal**: Form and test hypotheses with minimal change. One fix at a time.

### Generic

- Execute `cot-diagnostic-checklist.md`
- Form 1–3 hypotheses ordered by likelihood
- Validate with minimal changes (logs, breakpoints)
- Validated → Stage 4; refuted → next hypothesis; all refuted → Stage 1
- If stuck → WebSearch

### ReqForge-specific

- **Capture trace**: 验证前 `pnpm forge-bug-fix trace <bug-name>` 捕获当前现场快照。如果修复失败需要回溯，trace 保存了 git commit、分支、改动状态、环境信息
- **Sandboxed verification**: 假设验证优先在隔离环境做（测试用例、独立数据目录），不在生产数据上直接试
- **Three-strikes stall**: 同一 bug 连续修 3 次仍失败 → 停。不是换个修法继续，而是问题层级判断错了。回到 Stage 1，重新定义问题范围

---

## Stage 4: Implement Fix

**Goal**: Surgical change. One logical point. Verify everything.

### Generic

- Single fix (one logical point at a time)
- Compile verification (`tsc --noEmit` zero errors)
- Function verification (bug no longer reproduces)
- Regression verification (related features work)
- Fix fails → roll back, Stage 3; 3 consecutive failures → stop, re-examine architecture

### ReqForge-specific

- **forge-bug-fix verify**: `pnpm forge-bug-fix verify` — 自动化编译 + 测试验证
- **Self-review**: 提交前执行 `anti-ai-slop-checklist.md` 自审。尤其检查：是否修了症状而不是根因、是否有硬编码值或幻觉 API、是否补了回归测试
- **Memory update**: 修复完成后更新 `memory/task-history.md`（记录根因、改动文件）、`memory/project-memory.md`（如果揭示了新陷阱）、`memory/decisions-log.md`（如果涉及重大技术决策）
- **Three-layer diagnosis**: 修复报告必须包含三层分析：
  - Symptom（现象）
  - Design Flaw（允许 bug 存在的结构缺陷）
  - Principle Violation（违反了哪条流程/规则）
