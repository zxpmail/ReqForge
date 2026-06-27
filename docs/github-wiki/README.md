# GitHub Wiki 源稿

本目录是 Wiki **源稿**；线上 Wiki 通过 `pnpm forge-wiki-sync` 同步（或手动粘贴）。

## 推荐：一条命令同步

```bash
pnpm forge-wiki-sync              # clone/pull Wiki 仓库 → 复制 Home.md → commit + push
pnpm forge-wiki-sync --dry-run    # 预览是否有变更，不 push
pnpm forge-wiki-sync --no-push    # 仅本地 wiki clone 内 commit
pnpm forge-wiki-sync --message "custom commit message"
```

- **源稿**：`docs/github-wiki/*.md`（跳过 `README.md`）
- **Wiki 仓库**：从 `git remote get-url origin` 推导为 `{owner}/{repo}.wiki.git`
- **本地 clone**：`.forge/wiki-clone/`（已 gitignore）

需对 Wiki 仓库有 **push 权限**（与主仓库相同的 GitHub 凭据）。

## 手动粘贴（备用）

1. 打开仓库 **Wiki** → 编辑 [Home](https://github.com/zxpmail/ReqForge/wiki/Home)
2. 将 [`Home.md`](./Home.md) 全文粘贴为 Wiki 正文
3. 保存

## 与 README 的关系

| 文档 | 用途 |
|------|------|
| [README.zh-CN.md](https://github.com/zxpmail/ReqForge/blob/main/README.zh-CN.md) | 完整说明（主文档） |
| `docs/github-wiki/Home.md` | Wiki 首页摘要 + 导航（轻量） |

版本与 README 徽章对齐时请同步修改 `Home.md` 顶部的版本行，然后运行 `pnpm forge-wiki-sync`。
