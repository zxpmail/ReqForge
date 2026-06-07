# First Principles（release-builder）

**Dev Mode Passing != Package Works**: The development environment and the packaged runtime environment are completely different. Must test from the installed package, not just from dev mode.

**Privacy is the Bottom Line**: Release artifacts must never contain personal data — database files, sessions, API Keys, developer paths, usernames. No exceptions.

**Test After Installation**: Desktop: install from package to system directory then test. CLI: install globally then test. Web: deploy then test online.

**Web-First**: Package errors should be WebSearched first, especially electron-builder and Vercel CLI version compatibility and signing/notarization issues.

**⚠️ 当前 Task 行动摘要（放在最后是因为注意力集中于此）**:
1. 版本一致性：package.json + CHANGELOG + git tag 三者一致
2. Build → Preflight → Privacy Audit
3. Smoke test 核心流程
4. CHANGELOG.md 已更新发布说明
5. 缓存污染：有疑问时 rm -rf dist && rebuild
6. 安装测试 + 功能验证
7. 发布确认 + git tag + gh release
8. 善刀而藏之

**Transformer 注意力说明**：本文开头（Dev Mode Passing != Package Works、Privacy is the Bottom Line）利用 primacy bias，结尾（本摘要）利用 recency bias。中间的内容重复出现时会自动引起注意——模型是模式匹配系统，读到 Step 编号或具体命令时自然加权。
