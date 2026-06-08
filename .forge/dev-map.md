# 开发导航地图（dev-map）

> 谁动代码谁改地图。改结构时必须同步更新。
> 安装来源：`core/templates/dev-map-template.md` → 用户项目 `.forge/dev-map.md`（`pnpm forge-install` 写入）

---

## 模块索引

| 模块 | 关键文件 | 说明 | 改动影响链 |
|------|---------|------|-----------|
| Skills | `core/skills/*/SKILL.md` | 14 个 Skill 定义 | 改 Skill → 同步 adapters/ → 跑 `pnpm validate-skill` |
| Hooks | `core/hooks/*.sh` | 事前门禁脚本 | 改 hook → 同步 `.claude/settings.json` → 跑 `pnpm forge-smoke` |
| Templates | `core/templates/*.md` | 项目模板 | 改模板 → 跑 `pnpm forge-install` 验证写入 |
| Install | `scripts/install.ts` | forge-install 逻辑 | 改 → 跑 `pnpm test` |
| Sync | `scripts/sync.ts` | core → adapters 同步 | 改 → 跑 `pnpm sync` 验证 |
| Validate | `scripts/validate-skill.mjs` | Skill 质量评分 | 改 → 跑 `pnpm validate-skill` |
| Smoke | `scripts/forge-smoke/` | 12 项结构测试 | 改 → 跑 `pnpm forge-smoke` |
| Verify | `scripts/forge-verify.mjs` | 事后统一验证 | 改 → 跑 `pnpm forge-verify` |
| Dep Graph | `scripts/dependency-graph.ts` | 依赖图分析 | 改 → 跑 `pnpm dep-graph` |
| Adapters | `adapters/{claude-code,cursor,opencode,gemini-cli}/` | 四客户端适配 | 由 `pnpm sync` 从 core/ 生成，勿手动改 |

## 已有模式

| 模式 | 位置 | 说明 |
|------|------|------|
| Skill 结构 | `core/skills/*/SKILL.md` | [Section] + 4-space indent + HTML begin/end 边界标记 |
| Hook 模式 | `core/hooks/*.sh` + `.bat` | 每个门禁同时提供 sh 和 bat 版本 |
| 模板安装 | `scripts/install.ts` → `pnpm forge-install` | 模板写入用户项目 .forge/ |

## 注意事项

- adapters/ 由 `pnpm sync` 从 core/ 生成，不要手动编辑 adapters/ 下的 Skill/Hook/Template 文件
- SKILL.md 的 [Section] 标题匹配 sed range，改标题名需确认不影响 validate-skill
- `.forge/verify-baseline.json` 是本地基线快照，加入 `.gitignore`
