# Proposal — self-critique as advisory sensor (not gate)

**状态**: Proposal (2026-07-12, 待评审)
**作者**: Forge
**承接**: `experiments/contract-strawman-test/`、series Part 10 (argument-space)、`scripts/forge-verify/content-verify.mjs`

---

## 1. 一句话

把 producer 模型的自我评判作为 **advisory sensor** 接入 forge-verify,产出"嫌疑 requirement"线索喂给 C2/L3,**永远不当判定闸门**。

## 2. 背景

已有的分层 pipeline 已证明:

- **C2(external LLM judge)在 word-space 有 DPI bound**——S4 实验里它被 fabricated snippet 说服,还背书伪造的注释([[argument-space-experiment]])。换不换模型都救不了,因为 producer 操纵词汇的范围把 judge 包进去了。
- **C3(argument-space,跑 verify_command 看副作用)同义词免疫**——它根本不读 evidence 文本,是唯一 producer 够不着的底。

结论:判定底必须是 C3(结构),不能是 C2(word-space)。

那么"LLM 自我评判"在这个框架里有没有位置?有——但只在 **sensor 位**,不在 **gate 位**。本提案把这个位置钉死。

## 3. 目标 / 非目标

**目标**
- 让 producer 在生成期产出的"自我不确定"成为 pipeline 的一个**正交信号源**
- 帮 C2 聚焦(重点评嫌疑 req)、帮 L3 聚焦(重点看嫌疑 req)
- **靠代码结构保证**它当不了 gate,不靠 prompt 自觉

**非目标**
- ❌ 不新增判定闸门。self-critique 无 reject 权,不进 pass/fail 判定树
- ❌ 不替代 C2/C3。它只产线索,不产 verdict
- ❌ 不追求"评判准确性"。它的卖点是 recall(指出嫌疑),不是 precision(背书)

## 4. 判据回顾(为什么是 sensor 不是 gate)

| 维度 | gate(禁止) | sensor(本提案) |
|---|---|---|
| A — identity | self × word-space 当底 | self,但只产 hints |
| B — substrate | word-space 判定 | word-space **线索** → 喂给 C3(结构) / L3(人) |
| 在 pipeline 的权力 | 可终止 / 放行 | 只能标注,无任何分支权 |

> **自我评判可以当 sensor,不能当 actuator。** 当 gate = 自己推翻系列的论点。

## 5. 设计

### 5.1 数据流:生成期产出,事后读取

forge-verify 事后独立运行,agent 已不在。因此 self-critique 必须是 **producer 在生成期就写下的文件**,forge-verify 事后读。这反而带来一个结构红利:agent 自写的"我心虚",天然不适合当 gate——没有任何 sane pipeline 会把 producer 的自评当放行信号。

```
agent 生成期:
  产 evidence/*.txt       (我做了这些 → 进 gate,被评判)
  产 self-critique.json   (我对这些没底 → 进 attention,做线索)  ← 新

forge-verify 事后:
  EG → C1 → C3 → C2 → L3        (判定树,不变)
        ↑ attention_set 注入       (C2 重点评 / L3 重点看)
```

### 5.2 文件格式(推荐:structured JSON)

`{evidence_dir}/self-critique.json`:

```json
{
  "uncertain": [
    { "id": "REQ-2",
      "why": "described TTL but no actual write-invalidation path",
      "degree": "high" }
  ],
  "confident": ["REQ-1", "NEG-2"]
}
```

- 解析**确定性**(读 `uncertain[].id` → attention_set),不需要 LLM 提取——避免再叠一层 word-space
- `id` 必须对应 `content-verify.json` 里已存在的 `requirements[].id`(确定性映射,self-critique 不选命令、不发明 id)
- 格式不符合 → silent skip 这层(诚实降级,同 C2 api-error 风格),pipeline 不变

### 5.3 配置接入(零配置,存在则读)

**不新增配置字段**。`evidence_dir` 下存在 `self-critique.json` → 解析;不存在 → 跳过。接入成本为零,现有项目行为完全不变。

(备选:显式开关 `"self_critique": { "enabled": true, "mode": "advisory" }`——见 §8 未决问题。)

### 5.4 pipeline 位置

```
EG pass
  ↓
[self-critique 解析] → attention_set = {REQ-2}     ← advisory,无分支权
  ↓
C1 (regex/negative) —— 全跑,不受 attention_set 影响(零成本)
C3 (argument-space) —— 全跑(零成本)
  ↓
C2 (llm) —— attention_set 里的 req 投票次数 +1 或优先评   ← 增益点 1
  ↓
L3 —— 报告标注"producer 自评嫌疑: REQ-2",聚焦人的注意力  ← 增益点 2
```

C1/C3 不消费 attention_set:它们是确定性零成本层,本来就全跑,不需要"聚焦"。
C2/L3 才是消费方:一个省 API、一个省人。

### 5.5 advisory-only 的结构保证(关键)

类比 `constraints.verify_code: false` 用 readonly 区保证 agent 改不了 verify 脚本,self-critique 的 advisory-only 用**类型与控制流**保证:

1. `parseSelfCritique()` 的返回类型是 `{ attention_set: string[], notes: object[] }`——**没有 verdict 字段**
2. `layeredVerify()` 的 pass/fail/reject 分支树**完全不引用** self-critique 的返回值
3. self-critique 的输出只流向两处:C2 的 priority 输入、最终 trace 的 `advisory` 字段
4. 不存在任何 `if (selfCritique.verdict)` 的代码路径——因为类型上就不存在

约束在编译期/结构,不在 prompt 或配置开关。这是"codify as code, not prose"原则的直接应用。

### 5.6 editable-surface 边界

`self-critique.json` 由 agent 在生成期写,放 `evidence_dir`(agent 可写区,与 evidence 同区)。forge-verify 只读。**不进 readonly 区**,也**不进 `constraints`**——因为它本来就没有 gate 权力可被滥用。

## 6. 独特价值(为什么不是多余的)

self-critique 的卖点**不是评判准确性**,是提供 C2/C3 都没有的信号维度:

| 层 | 看什么 | 信号来源 |
|---|---|---|
| C2 (external judge) | evidence 文本表面 | producer 词汇可达范围 |
| C3 (argument-space) | 运行代码的 side effect | 结构不变量 |
| **self-critique** | **producer 生成期的自我不确定** | **producer 特权信息** |

producer 对自己的产出有特权信息:它知道生成时跳过了什么、哪段是硬凑的、哪里的测试是凑出来的。这种"心虚信号"外部 judge 事后看文本拿不到。

**这是正交信号源,不是更好的评判。** C2 看表面,C3 看结构,self 看生成期不确定——三者交集才稳。

## 7. 诚实边界(必须写进 README)

> **用它的"指出",不用它的"背书"。**

DPI bound 在 self-critique 上是**双重**的,比 C2 还重:

1. **战略隐瞒**:producer 知道 REQ-2 没做,但自评说做了(对抗场景)
2. **真心虚报**:producer 自己都没意识到错,自评说没问题(盲区场景)

因此:
- **有效场景**:非对抗 / agent 诚实但有盲区——self-critique 的 recall 是真信号
- **失效场景**:理性对抗者——它既会隐瞒也会撒谎。这种场景**靠 C3 兜底**,不靠 self-critique
- 它说"REQ-2 可疑" → 拿去 C3 跑结构验证 / 给 L3 重点看
- 它说"REQ-5 没问题" → **当没说过**

self-critique 是**非对抗场景下的便宜 recall 源**,不是安全防线。安全防线仍是 C1/C3(确定性)。

## 8. 未决问题(评审决定)

1. **文件格式**:structured JSON(推荐,确定性解析)vs free markdown + LLM 提取(灵活,但叠 word-space)。
2. **配置开关**:零配置"存在则读"(推荐,接入成本零)vs 显式 `"self_critique": {enabled, mode}`。
3. **C2 消费方式**:attention_set 里的 req 是"投票次数 +1"还是"仅标注不改变投票预算"。前者干预判定边界,需谨慎。
4. **degree 字段语义**:`high/low` 是否影响 attention 权重,还是纯给 L3 看。
5. **是否进 README 主表**:作为 content-quality 的第 8 行(注明 advisory),还是只在 evidence_gates 子文档提。

## 9. 实现路径(本提案通过后)

1. 走 **change-manager** propose→apply→verify→archive(框架对自己 dogfood brownfield 流程)
2. 动的文件:`scripts/forge-verify/content-verify.mjs`(加 `parseSelfCritique` + attention_set 注入)、README §evidence_gates、`experiments/self-critique-sensor/` 加测试 fixture
3. 验证:`experiments/self-critique-sensor/` 造一个 producer 自评 REQ-2 uncertain 的场景,确认 (a) pipeline 判定结果**不变**(advisory-only 生效)(b) trace 里出现 advisory 字段 (c) C2/L3 报告含嫌疑标注

## 10. 不做这个会怎样

不会。现有 pipeline 已是完整的判定系统(self-critique 缺席也能跑、也安全)。本提案是**增益**,不是修复——不加它框架没有任何已知缺陷。

加它的理由只有一个:用正交信号源(C2 看表面 / C3 看结构 / self 看生成期不确定)提升非对抗场景下的 recall,同时给 L3 更聚焦的人工 review 焦点。

---

**引用**
- [[argument-space-experiment]] — C2 word-space bound,C3 同义词免疫
- [[channel-contract-experiments]] — Pipeline 三层架构
- series Part 10 — argument-space 压轴
- `scripts/forge-verify/content-verify.mjs` — 现有 pipeline
- `experiments/contract-strawman-test/` — scope-matches-claim 缺口 + negative contract

---

## 11. 实验结论（2026-07-13）— 否决

实验 `exp-run.mjs` + `RESULTS.md` 验证了 5 个场景后，**本提案被否决**。

### 核心否定证据

| 场景 | 关键发现 |
|------|---------|
| plausible-gap（核心假设） | C2 **REJECT** 了 self-critique 标记的同一 req。特权信息假设不成立。 |
| social-only（唯一候选价值） | 根因是 `type="regex"` 而非 `type="llm"` 的配置问题。有更优修复。 |
| false-positive | 实现正确时 self-critique 产生噪音，耗费 L3 注意力。 |
| misdirection | self-critique 标无辜 req 为 uncertain，标真问题 req 为 confident，**主动误导**。 |

### 否决理由

1. **核心假设无实验支撑** — "producer 有特权信息"在 5 个场景中均未观察到。self-critique 和 C2 看到的是同一组证据，判断一致。
2. **唯一候选价值有更优路径** — C1 正则通过但证据空洞，应该改用 `type="llm"` 或自动降级到 C2，而非叠 sensor。
3. **未预期成本已验证** — false-positive（噪音）和 misdirection（主动误导）在实验中出现。
4. **对抗场景下零或负** — confident-wrong：无信号。misdirection：主动误导。
5. **框架无此功能无已知缺陷**（与 §10 一致）

详情见 `experiments/self-critique-sensor/RESULTS.md`。
