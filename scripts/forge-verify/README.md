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

## 基线对比流程

1. **开发前**：`pnpm forge-verify --baseline save`
2. **开发后**：`pnpm forge-verify --baseline compare`
3. **判定**：新增失败必须修，全过才算 Phase 完成

## 基线文件

`.forge/verify-baseline.json` — 建议加入 `.gitignore`（基线是本地开发状态快照）
