/**
 * 经验准入控制 — 小任务真训（GridWorld + REINFORCE）
 * 关联：立场文 §7；Stub 见 ../experience-routing-stub/
 * 同一优化器：只改经验准入；深读负担 = 进入梯度更新的轨迹 token。
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "out");
const ACTIONS = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];
const N_ACT = 4;

function makeRng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function loadConfig() {
  const cfg = JSON.parse(readFileSync(join(__dirname, "config.json"), "utf8"));
  const noiseArg = process.argv.find((a) => a.startsWith("--sensor-noise="));
  if (noiseArg) {
    const noise = Number(noiseArg.split("=")[1]);
    cfg.collect.hazardSensorAccuracy = Math.max(0, Math.min(1, 1 - noise));
  }
  return cfg;
}

function nStates(g) {
  return g.w * g.h;
}

function sid(x, y, g) {
  return y * g.w + x;
}

function clampPos(x, y, g) {
  return [Math.max(0, Math.min(g.w - 1, x)), Math.max(0, Math.min(g.h - 1, y))];
}

function initPolicy(g, rng) {
  const theta = new Float64Array(nStates(g) * N_ACT);
  for (let i = 0; i < theta.length; i++) theta[i] = (rng() - 0.5) * 0.02;
  return theta;
}

function logitsAt(theta, s) {
  const b = s * N_ACT;
  return [theta[b], theta[b + 1], theta[b + 2], theta[b + 3]];
}

function softmax(logits) {
  const m = Math.max(...logits);
  const ex = logits.map((z) => Math.exp(z - m));
  const z = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / z);
}

function sampleAction(probs, rng) {
  let u = rng();
  for (let i = 0; i < probs.length; i++) {
    u -= probs[i];
    if (u <= 0) return i;
  }
  return N_ACT - 1;
}

function entropy(probs) {
  let h = 0;
  for (const p of probs) if (p > 1e-12) h -= p * Math.log(p);
  return h;
}

function mean(a) {
  return a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function round4(x) {
  return Math.round(x * 1e4) / 1e4;
}

/** 滚动一条轨迹；hazard 污染目标/陷阱回报 */
function rollout(theta, g, rng, opts) {
  const { epsilon, kind } = opts;
  const goal = [g.w - 1, g.h - 1];
  const trap = [g.w - 1, 0];
  let x = 0;
  let y = 0;
  const steps = [];
  let returnG = 0;

  for (let t = 0; t < g.maxSteps; t++) {
    const s = sid(x, y, g);
    const probs = softmax(logitsAt(theta, s));
    const a = rng() < epsilon ? Math.floor(rng() * N_ACT) : sampleAction(probs, rng);
    const [dx, dy] = ACTIONS[a];
    const [nx, ny] = clampPos(x + dx, y + dy, g);

    // 势能塑形：仅干净环境，帮助采集到可达目标的轨迹
    const dist = (px, py) => Math.abs(goal[0] - px) + Math.abs(goal[1] - py);
    let r = -0.01 + 0.02 * (dist(x, y) - dist(nx, ny));
    let done = false;

    if (nx === goal[0] && ny === goal[1]) {
      r = kind === "hazard" ? -1.5 : 1.0;
      done = true;
    } else if (nx === trap[0] && ny === trap[1]) {
      r = kind === "hazard" ? 1.5 : -0.5;
      done = kind === "hazard";
    }

    steps.push({ s, a, r });
    returnG += r;
    x = nx;
    y = ny;
    if (done) break;
  }

  const returns = new Array(steps.length);
  let G = 0;
  for (let i = steps.length - 1; i >= 0; i--) {
    G += steps[i].r;
    returns[i] = G;
  }

  // 采集时熵：用当前行为策略
  let entSum = 0;
  for (const st of steps) {
    entSum += entropy(softmax(logitsAt(theta, st.s)));
  }

  return {
    steps,
    returns,
    returnG,
    tokens: steps.length,
    meanEntropy: entSum / Math.max(1, steps.length),
    kind,
  };
}

/** 用干净环境短训一个教师，再采集语料 */
function trainTeacher(cfg, seed) {
  const rng = makeRng(seed + 3);
  const theta = initPolicy(cfg.grid, rng);
  for (let i = 0; i < cfg.collect.teacherEpochs; i++) {
    const batch = [];
    for (let k = 0; k < 16; k++) {
      batch.push(
        rollout(theta, cfg.grid, rng, { epsilon: 0.2, kind: "clean" })
      );
    }
    reinforceUpdate(theta, batch, cfg);
  }
  return theta;
}

/** 采集：教师 + ε 探索；注入 hazard 污染轨迹 */
function collectCorpus(cfg, seed) {
  const rng = makeRng(seed);
  const teacher = trainTeacher(cfg, seed);
  const items = [];
  const nHaz = Math.floor(cfg.collect.nTrajectories * cfg.collect.hazardFrac);

  for (let i = 0; i < cfg.collect.nTrajectories; i++) {
    const isHaz = i < nHaz;
    const traj = rollout(teacher, cfg.grid, rng, {
      epsilon: cfg.collect.epsilon,
      kind: isHaz ? "hazard" : "clean",
    });

    const sensorCorrect = rng() < cfg.collect.hazardSensorAccuracy;
    const hazardSensor = sensorCorrect ? (isHaz ? 1 : 0) : isHaz ? 0 : 1;

    const routeScore = clamp01(
      0.5 * (1 - hazardSensor) +
        0.25 * clamp01(traj.meanEntropy / 1.4) +
        0.25 * clamp01((traj.returnG + 1.5) / 3)
    );

    const learnability = !isHaz && traj.returnG > 0 ? 1 : 0;

    items.push({
      id: `ep-${seed}-${i}`,
      ...traj,
      hazardSensor,
      routeScore,
      learnability,
      trueHazard: isHaz ? 1 : 0,
    });
  }

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function selectArmA(corpus, cfg) {
  const n = Math.floor(corpus.length * cfg.armA.admitFrac);
  const admitted = corpus.slice(0, n);
  return { arm: "A", admitted, quarantined: corpus.slice(n) };
}

function selectArmB(corpus, cfg) {
  const b = cfg.armB;
  const safe = [];
  const quarantined = [];
  for (const t of corpus) {
    if (t.hazardSensor >= b.hazardThreshold) quarantined.push(t);
    else safe.push(t);
  }
  safe.sort((a, c) => c.routeScore - a.routeScore);
  const filtered = safe.filter((t) => t.routeScore >= b.minRouteScore);
  const pool = filtered.length ? filtered : safe;
  const nAdmit = Math.max(1, Math.floor(pool.length * b.maxAdmitFracOfSafe));
  const admitted = pool.slice(0, nAdmit);
  return {
    arm: "B",
    admitted,
    quarantined,
    bins: {
      safe: safe.length,
      quarantined: quarantined.length,
      admitted: admitted.length,
    },
  };
}

/** 用当前策略重算概率的 REINFORCE */
function reinforceUpdate(theta, batch, cfg) {
  const lr = cfg.train.lr;
  const allG = [];
  for (const traj of batch) for (const G of traj.returns) allG.push(G);
  const baseline = cfg.train.baseline && allG.length ? mean(allG) : 0;

  for (const traj of batch) {
    for (let t = 0; t < traj.steps.length; t++) {
      const { s, a } = traj.steps[t];
      const probs = softmax(logitsAt(theta, s));
      const adv = traj.returns[t] - baseline;
      const base = s * N_ACT;
      for (let j = 0; j < N_ACT; j++) {
        theta[base + j] += lr * ((j === a ? 1 : 0) - probs[j]) * adv;
      }
    }
  }
}

function trainPolicy(admitted, cfg, seed) {
  const rng = makeRng(seed + 1000);
  const theta = initPolicy(cfg.grid, rng);
  for (let ep = 0; ep < cfg.train.epochs; ep++) {
    reinforceUpdate(theta, admitted, cfg);
  }
  return theta;
}

function evaluate(theta, cfg, seed) {
  const rng = makeRng(seed + 7777);
  let ok = 0;
  for (let i = 0; i < cfg.eval.episodes; i++) {
    // 评测关掉塑形影响：用无塑形干净 rollout
    const traj = rolloutEval(theta, cfg.grid, rng, cfg.eval.epsilon);
    if (traj.hitGoal) ok++;
  }
  return ok / cfg.eval.episodes;
}

/** 评测专用：无势能塑形，只认是否到目标 */
function rolloutEval(theta, g, rng, epsilon) {
  const goal = [g.w - 1, g.h - 1];
  let x = 0;
  let y = 0;
  for (let t = 0; t < g.maxSteps; t++) {
    const s = sid(x, y, g);
    const probs = softmax(logitsAt(theta, s));
    const a = rng() < epsilon ? Math.floor(rng() * N_ACT) : sampleAction(probs, rng);
    const [dx, dy] = ACTIONS[a];
    [x, y] = clampPos(x + dx, y + dy, g);
    if (x === goal[0] && y === goal[1]) return { hitGoal: true };
  }
  return { hitGoal: false };
}

function summarize(sel, corpus) {
  const totTok = corpus.reduce((s, t) => s + t.tokens, 0);
  const admTok = sel.admitted.reduce((s, t) => s + t.tokens, 0);
  const hazardInAdm = sel.admitted.filter((t) => t.trueHazard === 1);
  return {
    arm: sel.arm,
    deepReadRatio: admTok / totTok, // 真训：进入梯度 = 深读
    admitCount: sel.admitted.length,
    quarantinedCount: sel.quarantined.length,
    hazardInAdmCount: hazardInAdm.length,
    bins: sel.bins || null,
  };
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

function spearman(xs, ys) {
  if (xs.length < 3) return 0;
  const rx = ranks(xs);
  const ry = ranks(ys);
  const mx = mean(rx);
  const my = mean(ry);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < xs.length; i++) {
    const a = rx[i] - mx;
    const b = ry[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (!dx || !dy) return 0;
  return num / Math.sqrt(dx * dy);
}

function runSeed(cfg, seed) {
  const corpus = collectCorpus(cfg, seed);
  const selA = selectArmA(corpus, cfg);
  const selB = selectArmB(corpus, cfg);

  const thetaA = trainPolicy(selA.admitted, cfg, seed);
  const thetaB = trainPolicy(selB.admitted, cfg, seed + 17);

  const succA = evaluate(thetaA, cfg, seed);
  const succB = evaluate(thetaB, cfg, seed);
  const sumA = summarize(selA, corpus);
  const sumB = summarize(selB, corpus);

  const held = corpus.slice(0, Math.floor(corpus.length * 0.25));
  const corr = spearman(
    held.map((t) => t.routeScore),
    held.map((t) => t.learnability)
  );

  return {
    seed,
    armA: { ...sumA, success: round4(succA) },
    armB: { ...sumB, success: round4(succB) },
    signalSpearman: round4(corr),
    deltaSuccess: round4(succB - succA),
    deepReadImprove: round4(sumA.deepReadRatio - sumB.deepReadRatio),
  };
}

function judge(results, cfg) {
  const f = cfg.failure;
  const meanA = mean(results.map((r) => r.armA.success));
  const meanB = mean(results.map((r) => r.armB.success));
  const deepImp = mean(results.map((r) => r.deepReadImprove));
  const hazB = results.reduce((s, r) => s + r.armB.hazardInAdmCount, 0);
  const hazA = results.reduce((s, r) => s + r.armA.hazardInAdmCount, 0);
  const corr = mean(results.map((r) => r.signalSpearman));
  const bWins = results.filter((r) => r.armB.success >= r.armA.success - 1e-9).length;

  const failures = [];
  if (deepImp < f.deepReadImproveMin) {
    failures.push({
      id: 2,
      name: "无预算改善",
      detail: `深读比平均下降 ${round4(deepImp)} < ${f.deepReadImproveMin}`,
    });
  }
  if (meanA - meanB > f.perfDropMax) {
    failures.push({
      id: 3,
      name: "受限更新集回撤",
      detail: `A=${round4(meanA)} 高于 B=${round4(meanB)} 超过 ${f.perfDropMax}`,
    });
  }
  if (hazB > 0) {
    failures.push({
      id: 4,
      name: "危险经验穿透隔离边界",
      detail: `B 累计 hazardInAdm=${hazB}`,
    });
  }
  if (Math.abs(corr) < f.signalCorrMin) {
    failures.push({
      id: 5,
      name: "廉价信号与可学习性失相关",
      detail: `mean spearman=${round4(corr)}`,
    });
  }

  const hard = failures.some((x) => x.id === 3 || x.id === 4 || x.id === 5);
  let verdict;
  if (hard) verdict = "reject_or_fail";
  else if (deepImp >= f.deepReadImproveMin && meanB + f.perfDropMax >= meanA && hazB === 0) {
    verdict = meanB >= meanA ? "weak_success_small_task" : "weak_success_budget_only";
  } else verdict = "inconclusive";

  return {
    failures,
    verdict,
    meanSuccessA: round4(meanA),
    meanSuccessB: round4(meanB),
    meanDeepReadImprove: round4(deepImp),
    totalHazardInAdmA: hazA,
    totalHazardInAdmB: hazB,
    meanSignalSpearman: round4(corr),
    seedsWhereBNotWorse: bWins,
  };
}

function toMarkdown(report) {
  const j = report.judgment;
  const lines = [
    `# Experience Routing 小任务真训报告`,
    ``,
    `> ${report.meta.disclaimer}`,
    ``,
    `- **任务:** ${report.meta.task}`,
    `- **优化器:** ${report.meta.optimizer}`,
    `- **seeds:** ${report.meta.seeds.join(", ")}`,
    `- **裁决:** \`${j.verdict}\``,
    `- **B 不劣于 A 的 seed 数:** ${j.seedsWhereBNotWorse}/${report.seeds.length}`,
    ``,
    `## 汇总`,
    ``,
    `| 指标 | A 被动池 | B 准入路由 |`,
    `|------|----------|------------|`,
    `| 平均成功率 | ${j.meanSuccessA} | ${j.meanSuccessB} |`,
    `| 危险进准入(累计) | ${j.totalHazardInAdmA} | ${j.totalHazardInAdmB} |`,
    `| 深读比平均下降 | — | ${j.meanDeepReadImprove} |`,
    `| 信号 Spearman | — | ${j.meanSignalSpearman} |`,
    ``,
    `## 各 seed`,
    ``,
    `| seed | succA | succB | Δ | deep↓ | hazA | hazB | admitB |`,
    `|-----:|------:|------:|--:|------:|-----:|-----:|-------:|`,
  ];
  for (const r of report.seeds) {
    lines.push(
      `| ${r.seed} | ${r.armA.success} | ${r.armB.success} | ${r.deltaSuccess} | ${r.deepReadImprove} | ${r.armA.hazardInAdmCount} | ${r.armB.hazardInAdmCount} | ${r.armB.admitCount} |`
    );
  }
  lines.push(``);
  lines.push(`## 预注册失败条件`);
  lines.push(``);
  if (!j.failures.length) lines.push(`- 可测条件：**未触发**`);
  else for (const f of j.failures) lines.push(`- **失败条件 ${f.id}（${f.name}）:** ${f.detail}`);
  lines.push(``);
  lines.push(`对应：\`${report.meta.paperRef}\``);
  return lines.join("\n");
}

function main() {
  const cfg = loadConfig();
  const results = [];
  for (const seed of cfg.seeds) {
    const r = runSeed(cfg, seed);
    results.push(r);
    console.error(
      `seed=${seed} A=${r.armA.success} B=${r.armB.success} deep↓=${r.deepReadImprove} hazB=${r.armB.hazardInAdmCount} admitB=${r.armB.admitCount}`
    );
  }
  const judgment = judge(results, cfg);
  const report = {
    meta: {
      task: "5×5 GridWorld 导航（干净评测；语料含回报污染 hazard）",
      optimizer: "REINFORCE + baseline（表格 softmax；A/B 相同）",
      paperRef: "docs/drafts/experience-routing-position-paper-zh.md §7",
      disclaimer:
        "小任务真训：真实参数更新与 held-out 成功率。非 LLM agentic RL，不得外推为大规模智能体结论。",
      seeds: cfg.seeds,
      generatedAt: new Date().toISOString(),
    },
    config: cfg,
    seeds: results,
    judgment,
  };
  const tag =
    cfg.collect.hazardSensorAccuracy >= 0.999
      ? "whitebox"
      : `noise-${Math.round((1 - cfg.collect.hazardSensorAccuracy) * 100)}`;
  report.meta.sensorAccuracy = cfg.collect.hazardSensorAccuracy;
  report.meta.tag = tag;

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, `report-${tag}.json`), JSON.stringify(report, null, 2), "utf8");
  const md = toMarkdown(report);
  writeFileSync(join(OUT, `report-${tag}.md`), md, "utf8");
  // 主结果软链：白盒默认也写 report.md
  if (tag === "whitebox") {
    writeFileSync(join(OUT, "report.md"), md, "utf8");
    writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2), "utf8");
  }
  console.log(md);
  console.log(`\nWrote ${join(OUT, `report-${tag}.md`)}`);
}

main();
