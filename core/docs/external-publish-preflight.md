# External Publish Preflight

> Release gates for third-party APIs (WeChat, npm, app stores). **Skill = judgment**, **scripts = deterministic**, **preflight = sensor**.

## Three layers

| Layer | Responsibility | Example |
|-------|----------------|---------|
| **Skill** (`release-builder`) | When to run, human confirm 🔴 publish | `/release-builder` Step: Preflight |
| **scripts/preflight.ts** | Executable checks, exit code 0/1 | `pnpm preflight --build-dir dist` |
| **`.forge/preflight.json`** | Project-specific rules | title max bytes, env vars, regex |

## Quick start

1. `pnpm forge-install` creates `.forge/preflight.json` from template (if missing).
2. Edit checks for your channel (or copy items from `preflight-wechat.example.json` in the Forge repo `core/templates/`).
3. Before publish:

```bash
pnpm preflight
pnpm preflight --build-dir dist
pnpm preflight --strict
```

4. `/release-builder` must run preflight after build artifacts exist; **blocked exit code = do not publish**.

## Built-in checks (no config)

- Git working tree clean (use `--allow-dirty-git` to warn only)
- `package.json` has `version` (if present)
- With `--build-dir`: no `.env*`, no `sk-ant-` / API key strings, no `/Users/` or `C:\Users\` in bundle

## Config schema (version 1)

```json
{
  "version": 1,
  "envRequired": ["WEIXIN_APP_ID", "WEIXIN_APP_SECRET"],
  "fileExists": ["draft/article.html"],
  "maxBytes": [{ "id": "title", "file": "draft/title.txt", "max": 64 }],
  "regexChecks": [{
    "id": "images",
    "glob": "draft/**/*.html",
    "mustNotMatch": "src=[\"']https?://(?!mmbiz\\\\.qpic\\\\.cn)"
  }]
}
```

## Personal WeChat Bot (iLink / ACP) vs Official Account

| Channel | Typical tool | Forge doc |
|---------|--------------|-----------|
| **Service account draft** (`draft/add`, mmbiz CDN) | `pnpm preflight` + checks below | This file |
| **Personal DM → coding Agent** (iLink, `wechat-acp`) | External bridge; not `forge-install` | [wechat-ilink-acp-comparison.md](./wechat-ilink-acp-comparison.md) |

Do not mix preflight rules for公众号 API with personal Bot bridges.

## WeChat draft flow (example)

1. AI writes `draft/*.md` / HTML (Skill).
2. Scripts: token, `uploadimg`, `draft/add` (deterministic — not in core; add in your project `scripts/`).
3. `pnpm preflight` with WeChat rules from example config.
4. Human opens mp.weixin.qq.com → preview → publish.

## Evolution

Preflight failures should trigger **feedback-observer** (same as compile/review failures). After 3× same failure, promote rule into `release-builder` SKILL or `.forge/preflight.json` template.

## Related

- [release-builder SKILL](../skills/release-builder/SKILL.md) — Preflight Gate step
- [security-guidance-template.md](../templates/security-guidance-template.md) — team security rules
- [preflight-wechat.example.json](../templates/preflight-wechat.example.json) — copy-paste checks
