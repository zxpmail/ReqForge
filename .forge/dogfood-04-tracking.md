# Dogfood #4 — @forge/md-toc 追踪表

**项目**：`@forge/md-toc`（Markdown 目录生成 CLI）
**目的**：验证发布路径端到端 + forge-install 冷启动完整性
**目录**：`C:\work\dogfood-04\`
**技术栈**：TypeScript + Node 22 + Commander + Vitest
**状态**：✅ 全部完成（2026-06-28，~1 小时）

---

## 真正要回答的问题

| # | 问题 | 结果 | 说明 |
|---|------|------|------|
| # | 问题 | 结果 | 说明 |
|---|------|------|------|
| Q1 | forge-install 冷启动在 Windows 是否完整？ | ⚠️ 需新 session | spec-confirmed + plan-confirmed 已创建，但 hooks 触发需要独立 Claude Code 会话 |
| Q2 | npm 发布路径是否端到端可用？ | ⚠️ 部分验证 | `pnpm publish --dry-run` 通过（22 files, 4.3kB），bin 入口 + files 白名单已验证，缺实际 publish |
| Q3 | 包在干净环境能安装使用？ | ❌ 待验证 | 需要 npm publish → npm install -g 验证 |
| Q4 | 双 gate 在 1-2 天小项目是否仍是噪音？ | ⚠️ 待验证 | confimred 文件已写入，但无 resistance 测试 |
| Q5 | Size pre-check 的 Small Phase 跳过 implementer 是否？ | ✅ 已验证 | 3 Phase 全 Backend + Small，全部直接写，零隔离浪费 |

---

## Phase 进度

### Phase 1 — 核心解析
- [x] 完成
- 产出：package.json + tsconfig + parser + cli + 6 个测试
- 验证：`pnpm test` 6/6 通过

### Phase 2 — 功能扩展
- [x] 完成
- 产出：writer.ts + scanner.ts + config init（全部在 cli.ts 中集成）
- 验证：CLI 输出正确目录

### Phase 3 — 发布
- [x] 完成
- 产出：package.json bin/files 白名单 + README + prepublishOnly 脚本
- 验证：`pnpm publish --dry-run` 通过，tarball 22 文件 4.3kB

---

## 验证结果

**CLI 测试**：
```bash
node dist/cli.js test.md
# → 输出完整 TOC
```

**publish dry-run**：
```
@forge/md-toc@0.1.0
package size: 4.3 kB
total files: 22
```

**构建链**：`pnpm build` → `tsc` (pass) → `pnpm test` (6/6) → `pnpm publish --dry-run` (pass)

---

## 局限性（客观评估）

1. **本次不是真 dogfood** — 从框架仓库会话内执行，不是独立 Claude Code 会话。冷启动 gate、check-evolution、spec-before-code gate 均未触发。要验证这些需要在新会话中重跑
2. **未实际 npm publish** — 缺少 npm auth，无法验证全局安装后的 bin 入口和 ESM 兼容性
3. **Size pre-check 只确认了"能做"，没测试"做错了会怎样"** — Small Phase 正常工作了，但没验证误判场景（如 Large Phase 被错误标为 Small）
4. **Phase 2 的 --recursive 和 --init 没有独立测试覆盖** — 依赖 CLI 集成测试隐式覆盖

---

## 最终 Dogfood 报告

**总用时**：~1 小时（不含之前的品牌命名系统）
**总 Phase**：3（全 Small，skip implementer）
**总文件**：10 源文件 + 配置

**对框架的反馈**：
- Small Phase skip implementer 在小 CLI 项目上是对的——3 个 Phase 全部直接写，没有隔离浪费
- `files` 白名单 + `bin` 入口 + `prepublishOnly` 的组合验证达到了预期效果：build → test → package 一次完成
- 没有跑独立 session 是本次 dogfood 的最大缺陷，建议 dogfood #5 必须走独立 session
