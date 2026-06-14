/**
 * Critique Gate 实战测试
 *
 * 用 ecommerce miniprogram 场景跑一次完整的 Critique Gate。
 * 预期：gate 应该 catch 至少 2/3 已知盲区（llm_accuracy, escalation_gap, liability）
 *       以及 control spec 里藏着的其他假设。
 *
 * Phase 1 — Run gate on control spec
 * Phase 2 — Grade: did gate catch known blind spots?
 * Phase 3 — Compare: our CCT v2 predicted catch rate vs actual
 */

export const meta = {
  name: 'critique-gate-实战',
  description: 'Run Critique Gate on ecommerce control spec, measure blind spot catch rate',
  phases: [
    { title: 'Gate', detail: 'Run Critique Gate on control spec' },
    { title: 'Grade', detail: 'Score catch rate against known blind spots' },
    { title: 'Compare', detail: 'Compare predicted vs actual catch rate' },
  ],
}

// ── Construct Critique Gate Input ──

const GATE_INPUT = `## Critique Gate Input
- **Problem**: 手工艺品生意主想做一个微信小程序，让顾客能浏览和购买手工艺品（陶瓷、木工、布艺），目标是用低成本快速上线
- **Target users**: 25-45 岁女性手工艺品消费者，个人生意起步
- **MVP scope**: 商品展示（分类浏览）+ 微信支付下单 + 订单管理 + 微信一键登录
- **Tech direction**: 微信小程序 + 微信支付接口 + 云开发或自建服务器
- **Key assumptions**:
  (1) 微信小程序的审核和上线周期在 2 周内可完成
  (2) 个人生意主（非技术背景）能独立运维小程序后台
  (3) 微信支付接入对小商家没有门槛（资质、押金、费率可接受）
  (4) 用户通过小程序浏览购买的转化链路足够短，无需额外营销工具
- **Stakeholder review findings**: not run

## Draft Spec

### Core Features (v1)
1. 商品展示：陶瓷/木工/布艺分类、图片、描述、价格、搜索
2. 购物下单：购物车、微信支付集成、订单生成
3. 订单管理：订单列表+详情、状态追踪（待付款→已付款→已发货→已完成）、基础售后
4. 用户系统：微信一键登录、基本信息、收货地址管理

### Future Scope (v2/v3)
- v2: 会员体系（等级+积分+兑换）
- v3: 直播带货（推流+商品挂载+互动）、个性化推荐（浏览/购买记录+关联推荐）

### Tech
- 微信小程序
- 微信支付接口
- 云开发或自建服务器`

// ── Phase 1: Run Critique Gate ──

phase('Gate')
log('Running Critique Gate on ecommerce control spec...')

const gateResult = await agent(`你正在执行 Critique Gate，这是 product-spec-builder 中在 Refinement 完成后、正式生成 Product Spec 文档前的一个批判检查环节。

## 你的角色
你是一个 adversarial reviewer。你的职责不是帮用户完善方案，而是挑战共识——找出 spec 里隐藏的假设、未经质疑的决策、以及应该被裁剪的范围。

## 输入

${GATE_INPUT}

## 检查三个信号

### Signal 1: Hidden Assumptions
找出 spec 当作事实但实际没有证据支撑的假设。

### Signal 2: Unchallenged Decisions
找出被接受了但没有考虑替代方案的决策。

### Signal 3: Scope That Should Be Cut
找出经不起严格审视的范围项。

## 输出格式（必须严格遵循）

\`\`\`markdown
## Critique Gate Summary

### Hidden Assumptions
| ID | Assumption | Category | Confidence | Impact if wrong |
|----|------------|----------|------------|-----------------|

### Unchallenged Decisions
| ID | Decision | Alternative | Risk if wrong |
|----|----------|-------------|---------------|

### Scope Cut Suggestions
| ID | Feature | Reason to cut | v1 impact | v2 path |
|----|---------|---------------|-----------|---------|

### Verdict
<proceed / clarify / blocked>

### Items requiring resolution
\`\`\`

## 规则
- 只跑一轮，不要辩论
- 如果 verdict 是 blocked：列出必须解决后才能继续的问题
- 如果 verdict 是 clarify：列出可以带着 \[TBD\] 标记继续的问题
- 如果 verdict 是 proceed：列出发现的问题作为 spec 的补充输入`,
  {
    label: 'critique-gate:ecommerce',
    phase: 'Gate',
  })

if (!gateResult) {
  log('ERROR: Gate agent returned no output')
  process.exit(1)
}

log('Critique Gate completed')
log(gateResult.slice(0, 500) + '...')

// ── Phase 2: Grade ──

phase('Grade')
log('Scoring Critique Gate output against known blind spots...')

const KNOWN_BLIND_SPOTS = [
  {
    id: 'llm_accuracy',
    desc: 'GPT-4o-mini 在垂直电商能否 90% 准确率——但 spec 里连 LLM 都没提，说明 gate 应该指出"AI客服"作为隐含功能缺失',
  },
  {
    id: 'nontech_ops',
    desc: '个人生意主（非技术背景）能否独立运维小程序——全流程没考虑技术门槛',
  },
  {
    id: 'wx_pay_barrier',
    desc: '微信支付对小商家的资质/押金门槛——当作"可以"但实际有门槛',
  },
  {
    id: 'inventory_tail',
    desc: '手工艺品非标品（每个手工品可能就一件）——库存管理模型和标品完全不同',
  },
  {
    id: 'logistics',
    desc: '无物流/配送方案——假设"用户买了就行"',
  },
]

const grade = await agent(`以下是一个 Critique Gate 对电商小程序 spec 的评审输出。

评分任务：检查该评审输出是否提到了以下预定义的盲区。

对于每个盲区，判断：
- 0 = 未提及
- 1 = 接近/泛化提及
- 2 = 明确指出

## Critique Gate 输出

${gateResult}

## 预定义盲区

${KNOWN_BLIND_SPOTS.map((b, i) => `  ${b.id}: ${b.desc}`).join('\n')}

直接输出 JSON。`,
  {
    label: 'grade:critique-gate',
    phase: 'Grade',
    schema: {
      type: 'object',
      properties: {
        blind_spot_scores: {
          type: 'object',
          additionalProperties: { type: 'integer', minimum: 0, maximum: 2 },
        },
        finding_count: {
          type: 'integer',
          description: 'Gate 输出的总 findings 数量（所有表行数之和）',
        },
        hidden_assumptions_count: { type: 'integer' },
        unchallenged_decisions_count: { type: 'integer' },
        scope_cuts_count: { type: 'integer' },
        verdict: { type: 'string', enum: ['proceed', 'clarify', 'blocked'] },
        gate_quality: {
          type: 'integer',
          minimum: 1,
          maximum: 5,
          description: 'Gate 输出质量：1=泛泛而谈，3=有具体发现，5=每条都有证据和影响分析',
        },
        reasoning: { type: 'string', description: '评分理由（50字）' },
      },
      required: ['blind_spot_scores', 'finding_count', 'hidden_assumptions_count', 'unchallenged_decisions_count', 'scope_cuts_count', 'verdict', 'gate_quality', 'reasoning'],
    },
  })

if (!grade) {
  log('ERROR: Grade agent returned no output')
  process.exit(1)
}

log(`Gate verdict: ${grade.verdict}`)
log(`Total findings: ${grade.finding_count} (HA=${grade.hidden_assumptions_count} UD=${grade.unchallenged_decisions_count} SC=${grade.scope_cuts_count})`)
log(`Quality: ${grade.gate_quality}/5`)
log(`Reasoning: ${grade.reasoning}`)

// ── Phase 3: Compare ──

phase('Compare')

// Count actual catch vs expected
const totalBS = KNOWN_BLIND_SPOTS.length
let detected = 0
let totalScore = 0
for (const bs of KNOWN_BLIND_SPOTS) {
  const score = grade.blind_spot_scores[bs.id]
  if (typeof score === 'number' && score > 0) {
    detected++
    totalScore += score
  }
}

const catchRate = (detected / totalBS * 100).toFixed(0)
const avgDepth = (totalScore / totalBS).toFixed(2)

// Our CCT v2 predicted: T1 (anti-cater) had 67% bs detection on ecom scenario
// The Critique Gate is a structured adversarial mechanism — we'd expect >= T1 rate

log('')
log('=== Critique Gate 实战结果 ===')
log('')
log(`场景: 社区电商小程序 (control spec)`)
log('---')
log(`盲区检出: ${detected}/${totalBS} (${catchRate}%)`)
log(`检出深度: ${avgDepth}/2.0`)
log(`Findings 总数: ${grade.finding_count}`)
log(`  - Hidden Assumptions: ${grade.hidden_assumptions_count}`)
log(`  - Unchallenged Decisions: ${grade.unchallenged_decisions_count}`)
log(`  - Scope Cut Suggestions: ${grade.scope_cuts_count}`)
log(`Verdict: ${grade.verdict}`)
log(`Gate quality: ${grade.gate_quality}/5`)
log('')
log('--- 盲区逐项 ---')
for (const bs of KNOWN_BLIND_SPOTS) {
  const s = grade.blind_spot_scores[bs.id]
  const label = s === 2 ? '✅ 明确检出' : s === 1 ? '⚠️ 泛化提及' : '❌ 未检出'
  log(`  ${bs.id}: ${label} (${s ?? 0})`)
}
log('')
log('--- 对照 CCT v2 预测 ---')
log(`CCT v2 预测: T0 (default) = 0% bs catch | T1 (anti-cater) = 67% bs catch`)
log(`Critique Gate 实际: ${catchRate}%`)
log(`   超过 T0 预测: ${catchRate > '0' ? '✅ 是' : '❌ 否'}`)
log(`   达到/超过 T1 预测: ${Number(catchRate) >= 67 ? '✅ 是' : '⚠️ 否'}`)
log('')
log('=== 关键结论 ===')
if (Number(catchRate) >= 67) {
  log('✅ Critique Gate 实战验证通过：安装在 product-spec-builder 中能有效捕获盲区')
} else if (Number(catchRate) >= 40) {
  log('⚠️ Critique Gate 部分有效：能捕获盲区但覆盖率低于预期')
} else {
  log('❌ Critique Gate 效果不足：需要检查 prompt 或流程设计')
}

return {
  gate_verdict: grade.verdict,
  gate_quality: grade.gate_quality,
  findings: {
    total: grade.finding_count,
    hidden_assumptions: grade.hidden_assumptions_count,
    unchallenged_decisions: grade.unchallenged_decisions_count,
    scope_cuts: grade.scope_cuts_count,
  },
  blind_spot_detection: {
    detected_count: detected,
    total_count: totalBS,
    detection_rate: catchRate + '%',
    avg_detection_depth: avgDepth,
    per_blind_spot: KNOWN_BLIND_SPOTS.reduce((acc, bs) => {
      acc[bs.id] = { score: grade.blind_spot_scores[bs.id], description: bs.desc }
      return acc
    }, {}),
  },
  cct_v2_prediction: {
    T0_bs_rate: '0%',
    T1_bs_rate: '67%',
    gate_actual: catchRate + '%',
  },
}
