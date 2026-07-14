# Generate forge-verify Contracts from DEV-PLAN

当 DEV-PLAN.md 确认后，自动生成 `.forge/content-verify.json` 基底，让 forge-verify 的 C1 层从 Phase 阶段产出开始就有 patterns，无需手动编写。

## 用法

```bash
# 1. 从 DEV-PLAN.md 各 Phase 提取需求，按 JSON 格式写入临时文件
# 2. pipe 给 generate-contracts.mjs
node scripts/forge-verify/generate-contracts.mjs < .forge/phase-requirements.json

# 或者
node scripts/forge-verify/generate-contracts.mjs --in .forge/phase-requirements.json
```

## 输入格式

```json
{
  "task": "Phase 1: User Authentication",
  "files": ["src/api/auth.ts", "tests/auth.test.ts"],
  "requirements": [
    {
      "id": "REQ-1",
      "desc": "IP 级别限流",
      "evidence_file": "test-output.txt"
    },
    {
      "id": "REQ-2",
      "desc": "Coverage ≥ 85%",
      "evidence_file": "coverage.txt"
    }
  ]
}
```

## 从 DEV-PLAN 自动构造 requirements 的规则

从每个 Phase 构造 requirements：

1. **id**: `PHASE-<N>-<M>`（Phase N 的第 M 个需求）
2. **desc**: 从 Phase 的 Acceptance Criteria 或 Deliverables 提取。优先用验收标准中最具体的可验证描述
3. **evidence_file**: 根据 Phase Nature 决定
   - Backend → `test-output.txt`（测试输出）
   - UI → `storybook-output.txt` 或 `lint-output.txt`
   - Data → `migration-output.txt`
   - Integration → `integration-test-output.txt`
4. **task**: Phase 名
5. **files**: Phase 的 Key Files 列表

### 示例

```markdown
## Phase 1: User Authentication (Backend)

**Deliverables:**
- Login API with JWT token
- Rate limiting by IP address
- Password hashing with bcrypt

**Acceptance Criteria:**
- Coverage ≥ 85%
- All auth tests pass
- Rate limiter blocks >100 req/min per IP
```

→

```json
{
  "task": "Phase 1: User Authentication",
  "files": ["src/api/auth.ts", "tests/auth.test.ts"],
  "requirements": [
    {
      "id": "PHASE-1-1",
      "desc": "Login API with JWT token",
      "evidence_file": "test-output.txt"
    },
    {
      "id": "PHASE-1-2",
      "desc": "Rate limiting by IP address",
      "evidence_file": "test-output.txt"
    },
    {
      "id": "PHASE-1-3",
      "desc": "Password hashing with bcrypt",
      "evidence_file": "test-output.txt"
    },
    {
      "id": "PHASE-1-4",
      "desc": "Coverage ≥ 85%",
      "evidence_file": "coverage.txt"
    },
    {
      "id": "PHASE-1-5",
      "desc": "Rate limiter blocks >100 req/min per IP",
      "evidence_file": "test-output.txt"
    }
  ]
}
```

## 输出

`generate-contracts.mjs` 会：
- 自动从 desc 展开同义 patterns（多措辞覆盖）
- 自动检测数字约束（如 "≥ 85%" → 区间正则）
- 自动检测否定语义（如 "不要使用 TTL" → type=negative）
- 已有显式 `pattern`/`patterns` 的需求保留原样

输出保存为 `.forge/content-verify.json`，可手工优化（加减 patterns、调整 type）。

## 注意

- 生成结果是 **起点**，不是最终合约。运行 forge-verify 一段时间后，如果发现 false FAIL（C1 不匹配但实际实现正确），用 `patterns` 数组补措辞变体
- C2→C1 反馈环（`forge-verify-content` 运行输出中的 `💡` 建议）是持续改善 patterns 的另一来源
