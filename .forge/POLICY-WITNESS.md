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

## 自签残差（Peter 三旁路负对照）

钥、验证器、名单、被测代码若同属 PR 可写信任域，见证仍是**自签**。永久夹具（断言攻击在当前设计下成功）：

`scripts/__tests__/policy-witness-self-authorship.test.ts`

| 夹具 | 攻击 | 当前结果 |
|------|------|----------|
| A | 导入 in-repo 钥，为伪造政策头铸 3 份收据 | 法定人数判定为绿 |
| B | 缩 `q` / 换见证名单与钥 | 伪造头仍可绿 |
| C | 从 `SMOKES` 删除 `policy-witness-quorum` | 套件不再跑该门 |

生产要把见证钥与法定人数验证挪到候选 job 外（受保护 workflow / 外控服务），并锚定 required check，使上述三旁路在 PR 内测试全绿时仍挡合并。当前门仍是有用的 usefulness 测试，不是生产信任边界。
