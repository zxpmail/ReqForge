# Policy version + witness quorum (forge-smoke)

发版守门：`scripts/forge-smoke/policy-witness-quorum.mjs`（`pnpm forge-smoke`）。

| 文件 | 作用 |
|------|------|
| `policy-version.json` | 政策头：`minimum` / `artifact_digest` / `tree_size` / `root` |
| `witness-set.json` | n=4, q=3（f=1 交点） |
| `witness-dev-keys.json` | **DEV ONLY** HMAC 钥（CI 可复现，非生产信任） |
| `witness-receipts/*.json` | 针对当前 `root|tree_size` 的收据（至少 3 份） |

重新生成收据：`node scripts/gen-policy-witness-fixtures.mjs`

治理约定：改 `policy-version` / 见证集应视为与 minimum-version 同级的受控变更；普通 PR 不应手改。当前实现是文件 + CI 门闩，完整 append-only 登记仍为残差。
