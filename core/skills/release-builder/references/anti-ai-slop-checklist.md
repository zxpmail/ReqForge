# 反 AI 味清单（release-builder）

> 发布前读本文。不是为了"检查"，是为了**激活正确的发布模式**。
> 下面三段锚点覆盖了 release-builder 最常见的三种场景。

---

## 锚点一：版本一致性检查模式

> 模型的自然倾向是只 build 不检查版本一致性。
> 下面展示正确的版本对齐检查。

```bash
# ✅ 发布前版本一致性检查
# 1. package.json 版本 vs CHANGELOG 版本 vs git tag 版本
grep '"version"' package.json
# → "1.2.3"
grep '## \[' CHANGELOG.md | head -1
# → ## [1.2.3] - 2026-06-06
git tag | tail -1
# → v1.2.3

# 三者不一致 → 阻塞发布，修正后再继续
if [ "$(grep '"version"' package.json | grep -oP '\d+\.\d+\.\d+')" != \
     "$(grep '## \[' CHANGELOG.md | head -1 | grep -oP '\d+\.\d+\.\d+')" ]; then
  echo "❌ Version mismatch between package.json and CHANGELOG"
  exit 1
fi
```

关键点：
- package.json / CHANGELOG / git tag 三者必须一致
- 不一致 → 阻塞，不妥协

---

## 锚点二：构建产物隐私扫描模式

> 模型的自然倾向是 build 成功就上线。
> 下面展示发布前必须做的隐私泄漏检查。

```bash
# ✅ 构建产物隐私扫描
echo "🔍 Scanning for secrets in build artifacts..."

# 本地路径泄漏
grep -rn '/Users/' dist/ && echo "❌ Local path leak found"
grep -rn 'C:\\Users' dist/ && echo "❌ Local path leak found"

# API Key 泄漏
grep -rn 'sk-ant-' dist/ && echo "❌ Anthropic API key leak"
grep -rn 'sk-proj-' dist/ && echo "❌ OpenAI API key leak"
grep -rn 'API_KEY' dist/ --include='*.js' --include='*.map' && echo "❌ API key leak"
grep -rn 'password.*=['"'"'"]' dist/ --include='*.js' && echo "❌ Password leak"

echo "✅ No secrets found"
```

关键点：
- build 成功 ≠ 可发布。构建产物可能夹带本地路径、测试密钥
- grep 扫描是发布前最低成本的防线

---

## 锚点三：回滚策略声明模式

> 模型的自然倾向是跳过回滚策略（"出了问题再说"）。
> 下面展示正确的回滚声明。

```markdown
## Rollback Strategy

**如果发布后发现问题**:

1. `git revert <release-commit>` — 回退代码
2. `pnpm build && pnpm deploy` — 重新部署上个版本
3. 预期耗时: ~5 分钟

**如果数据库迁移需回滚**:
- 迁移脚本必须有 down migration
- `pnpm db:migrate:down <version>`

**验证回滚可用**:
- 在 staging 环境已测试回滚流程
```

关键点：
- "出了事再说" 不是策略——发布前必须定义回滚步骤
- 至少写明：怎么回滚 + 几分钟 + 数据库迁移是否可逆

---

## 兜底检查

| 检查项 | 通过标准 |
|--------|----------|
| 唯编译论 | build 成功 + smoke test 验证核心流程 |
| 隐私泄漏 | grep 确认无 `/Users/`、`API_KEY`、`sk-ant-` |
| 版本错位 | package.json + CHANGELOG + git tag 三者一致 |
| 缓存污染 | 有疑问时 rm -rf dist && rebuild，确保无可疑缓存 |
| 无变更日志 | CHANGELOG.md 已更新发布说明 |
| 跳过回滚 | 已定义回滚策略：方式 + 耗时 + 数据库可逆性 |
| 依赖漏洞 | 已执行 `npm audit` 或等效检查 |
| 环境漂移 | 非"我机器上能跑"——环境已对齐 |
