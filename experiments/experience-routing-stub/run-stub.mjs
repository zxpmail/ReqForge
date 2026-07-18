/**
 * 经验准入控制 — Stub 对照实验
 * 关联：docs/drafts/experience-routing-position-paper-zh.md §7
 * 用途：用合成轨迹日志验证 A/B 协议与失败条件能否被机器执行；非真实 RL 证据。
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const OUT = join(ROOT, "out");

/** 可复现伪随机（mulberry32） */
function makeRng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** 读取配置；允许 CLI 覆盖 mode */
function loadConfig(modeOverride) {
  const cfg = JSON.parse(readFileSync(join(ROOT, "config.json"), "utf8"));
  cfg.mode = modeOverride || process.env.STUB_MODE || cfg.modes.default;
  return cfg;
}

/**
 * 生成合成轨迹语料。
 * kind: cold | warm | hot-promising | hot-hazard
 * learnability: held-out「深读是否改善学习」标签（0/1）
 */
function generateCorpus(cfg, rng) {
  const items = [];
  for (let i = 0; i < cfg.nTrajectories; i++) {
    const u = rng();
    let kind;
    if (u < 0.45) kind = "cold";
    else if (u < 0.75) kind = "warm";
    else if (u < 0.9) kind = "hot-promising";
    else kind = "hot-hazard";

    const tokens = Math.floor(80 + rng() * 920);
    // 廉价指纹（设计占位，非真实模型信号）
    let entropy;
    let hazard;
    let novelty;
    if (kind === "cold") {
      entropy = 0.05 + rng() * 0.28;
      hazard = rng() * 0.2;
      novelty = rng() * 0.35;
    } else if (kind === "warm") {
      entropy = 0.35 + rng() * 0.35;
      hazard = rng() * 0.35;
      novelty = 0.3 + rng() * 0.4;
    } else if (kind === "hot-promising") {
      entropy = 0.55 + rng() * 0.35;
      hazard = rng() * 0.35;
      novelty = 0.55 + rng() * 0.4;
    } else {
      entropy = 0.72 + rng() * 0.25;
      hazard = 0.55 + rng() * 0.45;
      novelty = 0.4 + rng() * 0.5;
    }

    // 相关模式：可学习性偏向 warm / hot-promising；危险与冷区偏低
    let learnProb;
    if (kind === "warm") learnProb = 0.55 + 0.35 * novelty;
    else if (kind === "hot-promising") learnProb = 0.4 + 0.4 * novelty;
    else if (kind === "hot-hazard") learnProb = 0.05 + 0.1 * (1 - hazard);
    else learnProb = 0.08 + 0.15 * novelty;

    let learnability = rng() < Math.min(0.95, learnProb) ? 1 : 0;

    // 路由用廉价分：熵与新颖度加权，危险惩罚
    let routeScore = 0.55 * entropy + 0.45 * novelty - 0.8 * hazard;
    routeScore = Math.max(0, Math.min(1, (routeScore + 0.4) / 1.4));

    if (cfg.mode === "decorrelated") {
      // 打乱可学习性标签，使廉价信号与标签失相关
      learnability = rng() < 0.5 ? 1 : 0;
      // 保留指纹分布，但不与标签对齐
    }

    items.push({
      id: `τ-${String(i).padStart(4, "0")}`,
      kind,
      tokens,
      entropy: round4(entropy),
      hazard: round4(hazard),
      novelty: round4(novelty),
      routeScore: round4(routeScore),
      learnability,
    });
  }
  return items;
}

function round4(x) {
  return Math.round(x * 10000) / 10000;
}

/** 划分 train / held-out */
function splitCorpus(items, heldOutFrac, rng) {
  const shuffled = [...items].sort(() => rng() - 0.5);
  const nHold = Math.floor(items.length * heldOutFrac);
  return {
    train: shuffled.slice(nHold),
    heldOut: shuffled.slice(0, nHold),
  };
}

/** Arm A：被动经验池 — 近乎全量深读，几乎全进准入集（含危险） */
function runArmA(items, cfg) {
  const deepRead = [];
  const admitted = [];
  const quarantined = [];
  const nDeep = Math.floor(items.length * cfg.armA.deepReadFrac);

  const order = [...items].sort((a, b) => b.tokens - a.tokens);
  for (let i = 0; i < order.length; i++) {
    const t = order[i];
    if (i < nDeep) deepRead.push(t);
    // 被动池：无隔离制度，危险也可进 D_adm
    admitted.push(t);
  }

  return summarize("A", items, deepRead, admitted, quarantined, cfg);
}

/** Arm B：指纹路由 + 灰度 + 选择性深读 + 危险隔离 */
function runArmB(items, cfg) {
  const b = cfg.armB;
  const cold = [];
  const warm = [];
  const hotPromising = [];
  const hotHazard = [];

  for (const t of items) {
    // 危险优先隔离：高 hazard 标记，或「高熵且偏危险」
    const isHazard =
      t.hazard >= b.hazardFlagThreshold ||
      (t.entropy >= b.hazardEntropyMin && t.hazard >= 0.4);
    if (isHazard) {
      hotHazard.push(t);
      continue;
    }
    if (t.entropy >= b.warmEntropyMin && t.entropy < b.warmEntropyMax) {
      warm.push(t);
    } else if (t.entropy >= b.warmEntropyMax) {
      // 高熵但未判 hazard → promising 隔离观察，不进 D_adm
      hotPromising.push(t);
    } else {
      cold.push(t);
    }
  }

  // 仅 warm 可选择性深读
  const warmSorted = [...warm].sort((a, b) => b.routeScore - a.routeScore);
  const nDeep = Math.max(1, Math.floor(warmSorted.length * b.warmDeepReadTopFrac));
  const deepRead = warmSorted.slice(0, nDeep);

  // 受限更新集：仅从已深读 warm 中再取 top
  const nAdmit = Math.max(1, Math.floor(warmSorted.length * b.admitFromWarmTopFrac));
  const admitted = deepRead
    .slice()
    .sort((a, b) => b.routeScore - a.routeScore)
    .slice(0, Math.min(nAdmit, deepRead.length));

  const quarantined = [...hotHazard, ...hotPromising];

  const summary = summarize("B", items, deepRead, admitted, quarantined, cfg);
  summary.bins = {
    cold: cold.length,
    warm: warm.length,
    hotPromising: hotPromising.length,
    hotHazard: hotHazard.length,
  };
  summary.warmMass = warm.reduce((s, t) => s + t.tokens, 0) / totalTokens(items);
  return summary;
}

function totalTokens(items) {
  return items.reduce((s, t) => s + t.tokens, 0);
}

function summarize(arm, items, deepRead, admitted, quarantined, cfg) {
  const tot = totalTokens(items);
  const deepTok = deepRead.reduce((s, t) => s + t.tokens, 0);
  const fpTok = tot; // 所有轨迹都付指纹成本
  const cost =
    deepTok * cfg.deepReadCostPerToken + fpTok * cfg.fingerprintCostPerToken;

  const hazardInAdm = admitted.filter(
    (t) => t.kind === "hot-hazard" || t.hazard >= cfg.armB.hazardFlagThreshold
  );
  const admitLearn = admitted.reduce((s, t) => s + t.learnability, 0);
  const admitRate = admitted.length ? admitLearn / admitted.length : 0;

  return {
    arm,
    n: items.length,
    deepReadCount: deepRead.length,
    deepReadRatio: deepTok / tot,
    admitCount: admitted.length,
    quarantinedCount: quarantined.length,
    hazardInAdmCount: hazardInAdm.length,
    hazardInAdmIds: hazardInAdm.map((t) => t.id),
    proxyReturn: round4(admitRate),
    cost: round4(cost),
    deepReadIds: deepRead.map((t) => t.id),
    admitIds: admitted.map((t) => t.id),
  };
}

/** Spearman 秩相关（简易，含并列平均秩） */
function spearman(xs, ys) {
  if (xs.length !== ys.length || xs.length < 3) return 0;
  const rx = ranks(xs);
  const ry = ranks(ys);
  const n = xs.length;
  let num = 0;
  let dx = 0;
  let dy = 0;
  const mx = mean(rx);
  const my = mean(ry);
  for (let i = 0; i < n; i++) {
    const a = rx[i] - mx;
    const b = ry[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return 0;
  return num / Math.sqrt(dx * dy);
}

function ranks(arr) {
  const idx = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const r = new Array(arr.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j < idx.length && idx[j].v === idx[i].v) j++;
    const avg = (i + j - 1) / 2 + 1;
    for (let k = i; k < j; k++) r[idx[k].i] = avg;
    i = j;
  }
  return r;
}

function mean(a) {
  return a.reduce((s, x) => s + x, 0) / a.length;
}

/** 失败条件 5：路由分 vs 可学习性；以及相对随机归档增益 */
function evalSignalCorrelation(heldOut, cfg) {
  const scores = heldOut.map((t) => t.routeScore);
  const labels = heldOut.map((t) => t.learnability);
  const corr = spearman(scores, labels);

  // 路由选 top-k vs 随机选同数量
  const k = Math.max(5, Math.floor(heldOut.length * 0.15));
  const byScore = [...heldOut].sort((a, b) => b.routeScore - a.routeScore).slice(0, k);
  const routeHit = mean(byScore.map((t) => t.learnability));

  // 固定种子的「随机归档」对照
  const rng = makeRng(cfg.seed + 99);
  const shuffled = [...heldOut].sort(() => rng() - 0.5).slice(0, k);
  const randomHit = mean(shuffled.map((t) => t.learnability));

  return {
    spearman: round4(corr),
    routeTopHitRate: round4(routeHit),
    randomTopHitRate: round4(randomHit),
    routeGainOverRandom: round4(routeHit - randomHit),
    k,
  };
}

/** 按 §7.3 判定失败条件（Stub 可测子集：1/2/4/5；3 需真训，标为 n/a） */
function judgeFailures(armA, armB, signal, cfg) {
  const f = cfg.failure;
  const failures = [];

  // 失败条件 1：warm 质量占比过高且几乎未分流
  if (armB.warmMass != null && armB.warmMass > f.warmMassMax) {
    const bins = armB.bins || {};
    const diverted = (bins.hotPromising || 0) + (bins.hotHazard || 0) + (bins.cold || 0);
    if (diverted < armB.n * 0.25) {
      failures.push({
        id: 1,
        name: "灰度层失效",
        detail: `warmMass=${round4(armB.warmMass)} > ${f.warmMassMax} 且分流不足`,
      });
    }
  }

  // 失败条件 2：深读负担无改善
  const improve = armA.deepReadRatio - armB.deepReadRatio;
  if (improve < f.deepReadImproveMin) {
    failures.push({
      id: 2,
      name: "无预算改善",
      detail: `深读比下降 ${round4(improve)} < ${f.deepReadImproveMin}`,
    });
  }

  // 失败条件 3：真训回撤 — Stub 不可测
  const fail3 = { id: 3, name: "受限更新集回撤", status: "n/a", detail: "需真实训练，Stub 跳过" };

  // 失败条件 4：危险穿透 D_adm
  if (armB.hazardInAdmCount > 0) {
    failures.push({
      id: 4,
      name: "危险经验穿透隔离边界",
      detail: `hazardInAdm=${armB.hazardInAdmCount}: ${armB.hazardInAdmIds.slice(0, 5).join(",")}`,
    });
  }

  // 失败条件 5：信号失相关
  if (
    Math.abs(signal.spearman) < f.signalCorrMin &&
    signal.routeGainOverRandom < f.randomGainMin
  ) {
    failures.push({
      id: 5,
      name: "廉价信号与可学习性失相关",
      detail: `spearman=${signal.spearman}, gain=${signal.routeGainOverRandom}`,
    });
  }

  const hardFail = failures.some((x) => x.id === 4 || x.id === 5);
  let verdict;
  if (hardFail) verdict = "reject_strong_form";
  else if (failures.length) verdict = "weak_or_fail_soft";
  else if (
    improve >= f.deepReadImproveMin &&
    armB.hazardInAdmCount === 0 &&
    armB.quarantinedCount > 0 &&
    armB.proxyReturn + 0.05 >= armA.proxyReturn * 0.85
  ) {
    verdict = "weak_success_stub";
  } else {
    verdict = "inconclusive";
  }

  return { failures, fail3, hardFail, verdict, deepReadImprove: round4(improve) };
}

function corpusHash(items) {
  const h = createHash("sha256");
  h.update(JSON.stringify(items.map((t) => [t.id, t.kind, t.learnability, t.routeScore])));
  return h.digest("hex").slice(0, 16);
}

function main() {
  const modeArg = process.argv.find((a) => a.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] : undefined;
  const cfg = loadConfig(mode);
  const rng = makeRng(cfg.seed);

  const corpus = generateCorpus(cfg, rng);
  const { train, heldOut } = splitCorpus(corpus, cfg.heldOutFrac, makeRng(cfg.seed + 1));

  const armA = runArmA(train, cfg);
  const armB = runArmB(train, cfg);
  const signal = evalSignalCorrelation(heldOut, cfg);
  const judgment = judgeFailures(armA, armB, signal, cfg);

  const report = {
    meta: {
      title: "Experience Routing Stub A/B",
      paperRef: "docs/drafts/experience-routing-position-paper-zh.md §7",
      disclaimer:
        "合成轨迹 Stub：验证协议可执行性，不构成对 C2 的经验证实。不得转述为真实算力/回报结论。",
      mode: cfg.mode,
      seed: cfg.seed,
      corpusHash: corpusHash(corpus),
      nTrain: train.length,
      nHeldOut: heldOut.length,
      generatedAt: new Date().toISOString(),
    },
    armA: stripIds(armA),
    armB: stripIds(armB),
    signal,
    judgment,
    preregistered: cfg.failure,
  };

  mkdirSync(OUT, { recursive: true });
  const jsonPath = join(OUT, `report-${cfg.mode}.json`);
  const mdPath = join(OUT, `report-${cfg.mode}.md`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  writeFileSync(mdPath, toMarkdown(report), "utf8");
  writeFileSync(join(OUT, `corpus-${cfg.mode}.json`), JSON.stringify(corpus, null, 2), "utf8");

  console.log(toMarkdown(report));
  console.log(`\nWrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);

  // Stub 自身不变量：协议必须可判；decorrelated 模式应触发失败条件 5
  if (cfg.mode === "decorrelated") {
    const has5 = judgment.failures.some((f) => f.id === 5);
    if (!has5) {
      console.error("INVARIANT FAIL: decorrelated mode should trigger failure condition 5");
      process.exit(2);
    }
  }

  process.exit(0);
}

function stripIds(arm) {
  const { deepReadIds, admitIds, hazardInAdmIds, ...rest } = arm;
  return {
    ...rest,
    hazardInAdmIds: hazardInAdmIds?.slice(0, 8) ?? [],
  };
}

function toMarkdown(r) {
  const j = r.judgment;
  const lines = [
    `# Experience Routing Stub 报告`,
    ``,
    `> ${r.meta.disclaimer}`,
    ``,
    `- **模式:** ${r.meta.mode}`,
    `- **种子:** ${r.meta.seed}`,
    `- **语料哈希:** ${r.meta.corpusHash}`,
    `- **train / held-out:** ${r.meta.nTrain} / ${r.meta.nHeldOut}`,
    `- **裁决:** \`${j.verdict}\``,
    ``,
    `## Arm 对照`,
    ``,
    `| 指标 | A 被动池 | B 准入路由 |`,
    `|------|----------|------------|`,
    `| 深读比 | ${pct(r.armA.deepReadRatio)} | ${pct(r.armB.deepReadRatio)} |`,
    `| 准入条数 | ${r.armA.admitCount} | ${r.armB.admitCount} |`,
    `| 隔离条数 | ${r.armA.quarantinedCount} | ${r.armB.quarantinedCount} |`,
    `| 危险进准入 | ${r.armA.hazardInAdmCount} | ${r.armB.hazardInAdmCount} |`,
    `| 代理回报(准入可学习率) | ${r.armA.proxyReturn} | ${r.armB.proxyReturn} |`,
    `| 相对成本 | ${r.armA.cost} | ${r.armB.cost} |`,
    ``,
    `深读比下降: **${j.deepReadImprove}**`,
    ``,
    `## 信号相关（失败条件 5）`,
    ``,
    `- Spearman(routeScore, learnability) = **${r.signal.spearman}**`,
    `- 路由 top-${r.signal.k} 命中率 = ${r.signal.routeTopHitRate}`,
    `- 随机 top-${r.signal.k} 命中率 = ${r.signal.randomTopHitRate}`,
    `- 相对随机增益 = **${r.signal.routeGainOverRandom}**`,
    ``,
    `## 预注册失败条件`,
    ``,
  ];

  if (j.failures.length === 0) {
    lines.push(`- 可测条件 1/2/4/5：**未触发**`);
  } else {
    for (const f of j.failures) {
      lines.push(`- **失败条件 ${f.id}（${f.name}）:** ${f.detail}`);
    }
  }
  lines.push(`- 失败条件 3: ${j.fail3.detail}`);
  lines.push(``);
  lines.push(`## Bins（仅 B）`);
  if (r.armB.bins) {
    lines.push(``);
    lines.push("```");
    lines.push(JSON.stringify(r.armB.bins, null, 2));
    lines.push("```");
  }
  lines.push(``);
  lines.push(`对应立场文：\`${r.meta.paperRef}\``);
  return lines.join("\n");
}

function pct(x) {
  return `${(x * 100).toFixed(1)}%`;
}

main();
