# 经验准入 — GPU 真权重更新最小主实验
# RTX 3070：小 MLP 策略 + 回报加权行为克隆；对照 A 被动 / B 准入 / P PER
# 关联：立场文 §7；非 LLM 级弹药，但是本机可复现的真梯度证据
from __future__ import annotations

import argparse
import json
import math
import random
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import torch
import torch.nn as nn
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
N_ACT = 6  # a,b,c lookup / calc / submit / danger
DISCLAIMER = (
    "本机 GPU 真权重更新（小 MLP + 回报加权行为克隆，非开源 LLM LoRA）。"
    "对照含被动池 / 准入 / PER。不得外推为 DeepSeek 或大规模 agentic RL。"
)


def load_config() -> dict[str, Any]:
    return json.loads((ROOT / "config.json").read_text(encoding="utf-8"))


def round4(x: float) -> float:
    return round(float(x), 4)


# ---------- 环境：查表计算谜题（离散动作） ----------
@dataclass
class Puzzle:
    table: dict[str, float]
    formula: str
    answer: float
    is_hazard: bool


def make_puzzles(n: int, seed: int, hazard_frac: float) -> list[Puzzle]:
    rng = random.Random(seed)
    formulas = ["a+b", "a*b+c", "(a+b)*c", "a+b*c", "a*b-c"]
    out: list[Puzzle] = []
    n_haz = int(n * hazard_frac)
    for i in range(n):
        table = {k: float(rng.randint(2, 9)) for k in "abc"}
        formula = formulas[i % len(formulas)]
        ans = float(eval(formula, {"__builtins__": {}}, table))  # noqa: S307
        out.append(Puzzle(table, formula, ans, i < n_haz))
    rng.shuffle(out)
    return out


def state_vec(looked: set[str], calculated: bool, submitted: bool, step: int, max_steps: int) -> list[float]:
    return [
        1.0 if "a" in looked else 0.0,
        1.0 if "b" in looked else 0.0,
        1.0 if "c" in looked else 0.0,
        1.0 if calculated else 0.0,
        1.0 if submitted else 0.0,
        step / max_steps,
    ]


@dataclass
class Traj:
    states: list[list[float]]
    actions: list[int]
    returns: list[float]
    reward: float
    success: bool
    used_danger: bool
    true_hazard: bool
    tokens: int  # 用步数近似深读成本
    route_score: float
    hazard_sensor: float
    learnability: float


def rollout_env(policy: nn.Module, puzzle: Puzzle, max_steps: int, device: torch.device, epsilon: float, rng: random.Random) -> Traj:
    looked: set[str] = set()
    calculated = False
    submitted = False
    used_danger = False
    success = False
    reward = 0.0
    states: list[list[float]] = []
    actions: list[int] = []
    rewards: list[float] = []

    for step in range(max_steps):
        s = state_vec(looked, calculated, submitted, step, max_steps)
        states.append(s)
        with torch.no_grad():
            logits = policy(torch.tensor([s], dtype=torch.float32, device=device))
            probs = F.softmax(logits, dim=-1).cpu().numpy()[0]
        if rng.random() < epsilon:
            a = rng.randrange(N_ACT)
        else:
            a = int(rng.choices(range(N_ACT), weights=probs.tolist(), k=1)[0])
        actions.append(a)
        r = -0.02
        done = False
        if a == 0:
            looked.add("a")
        elif a == 1:
            looked.add("b")
        elif a == 2:
            looked.add("c")
        elif a == 3:
            if looked >= set("abc"):
                calculated = True
            else:
                r = -0.05
        elif a == 4:  # submit
            submitted = True
            done = True
            if used_danger:
                success = False
                r = -1.0
            elif calculated and looked >= set("abc"):
                success = True
                r = 1.0
            else:
                success = False
                r = -0.5
        elif a == 5:  # danger
            used_danger = True
            submitted = True
            done = True
            success = False
            r = -1.0
            # hazard 题上给错误的「正回报诱惑」写入指纹侧，不改真实 reward
        rewards.append(r)
        reward += r
        if done:
            break

    # 回报-to-go
    G = 0.0
    returns: list[float] = []
    for r in reversed(rewards):
        G += r
        returns.append(G)
    returns.reverse()

    # hazard 题：传感器偏高；危险动作也高
    hazard_sensor = 1.0 if (puzzle.is_hazard or used_danger) else 0.0
    route_score = max(
        0.0,
        min(
            1.0,
            0.55 * (1.0 - hazard_sensor)
            + 0.25 * (len(looked) / 3.0)
            + 0.2 * (1.0 if success else 0.0),
        ),
    )
    return Traj(
        states=states,
        actions=actions,
        returns=returns,
        reward=reward,
        success=success,
        used_danger=used_danger,
        true_hazard=puzzle.is_hazard,
        tokens=len(actions),
        route_score=route_score,
        hazard_sensor=hazard_sensor,
        learnability=1.0 if (success and not puzzle.is_hazard) else 0.0,
    )


# ---------- 模型 ----------
class PolicyMLP(nn.Module):
    def __init__(self, hidden: int, layers: int) -> None:
        super().__init__()
        dims = [6] + [hidden] * layers + [N_ACT]
        mods: list[nn.Module] = []
        for i in range(len(dims) - 2):
            mods += [nn.Linear(dims[i], dims[i + 1]), nn.ReLU()]
        mods.append(nn.Linear(dims[-2], dims[-1]))
        self.net = nn.Sequential(*mods)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


def expert_traj(puzzle: Puzzle, max_steps: int) -> Traj:
    """干净专家轨迹：查 a/b/c → 计算 → 提交。"""
    looked: set[str] = set()
    calculated = False
    submitted = False
    states: list[list[float]] = []
    actions: list[int] = []
    rewards: list[float] = []
    plan = [0, 1, 2, 3, 4]
    for step, a in enumerate(plan):
        s = state_vec(looked, calculated, submitted, step, max_steps)
        states.append(s)
        actions.append(a)
        r = -0.02
        if a in (0, 1, 2):
            looked.add("abc"[a])
        elif a == 3:
            calculated = True
        elif a == 4:
            submitted = True
            r = 1.0
        rewards.append(r)
    G = 0.0
    returns: list[float] = []
    for r in reversed(rewards):
        G += r
        returns.append(G)
    returns.reverse()
    return Traj(
        states=states,
        actions=actions,
        returns=returns,
        reward=sum(rewards),
        success=True,
        used_danger=False,
        true_hazard=puzzle.is_hazard,
        tokens=len(actions),
        route_score=0.85 if not puzzle.is_hazard else 0.2,
        hazard_sensor=1.0 if puzzle.is_hazard else 0.0,
        learnability=0.0 if puzzle.is_hazard else 1.0,
    )


def poison_traj(puzzle: Puzzle, max_steps: int) -> Traj:
    """危险轨迹：直接 dangerous_override。"""
    s0 = state_vec(set(), False, False, 0, max_steps)
    return Traj(
        states=[s0],
        actions=[5],
        returns=[-1.0],
        reward=-1.0,
        success=False,
        used_danger=True,
        true_hazard=True,
        tokens=1,
        route_score=0.05,
        hazard_sensor=1.0,
        learnability=0.0,
    )


def collect_corpus(
    policy: nn.Module,
    puzzles: list[Puzzle],
    max_steps: int,
    device: torch.device,
    epsilon: float,
    seed: int,
) -> list[Traj]:
    """混合语料：干净专家 + 危险污染 + 探索 rollout。"""
    rng = random.Random(seed)
    policy.eval()
    out: list[Traj] = []
    for i, pz in enumerate(puzzles):
        if pz.is_hazard:
            out.append(poison_traj(pz, max_steps))
            # 再加一条探索，增加被动池噪声
            out.append(rollout_env(policy, pz, max_steps, device, 0.9, rng))
        elif i % 2 == 0:
            out.append(expert_traj(pz, max_steps))
        else:
            out.append(rollout_env(policy, pz, max_steps, device, epsilon, rng))
    rng.shuffle(out)
    return out


def select_a(corpus: list[Traj]) -> list[Traj]:
    return list(corpus)


def select_b(corpus: list[Traj], hazard_threshold: float, admit_top_frac: float) -> list[Traj]:
    safe = [t for t in corpus if t.hazard_sensor < hazard_threshold and not t.used_danger]
    safe.sort(key=lambda t: t.route_score, reverse=True)
    n = max(1, int(len(safe) * admit_top_frac)) if safe else 0
    return safe[:n]


def select_per(corpus: list[Traj], alpha: float, admit_frac: float) -> list[Traj]:
    # 优先级 ∝ |return|^alpha；仍可能含危险（PER 不隔离）
    scored = []
    for t in corpus:
        mag = abs(t.reward) + 1e-3
        scored.append((mag**alpha, t))
    scored.sort(key=lambda x: x[0], reverse=True)
    n = max(1, int(len(corpus) * admit_frac))
    return [t for _, t in scored[:n]]


def train_policy(
    policy: nn.Module,
    batch: list[Traj],
    epochs: int,
    lr: float,
    device: torch.device,
) -> None:
    """
    同一优化器：行为克隆 + 回报加权（正回报轨迹权重大）。
    危险轨迹 reward<0 → 仍会被 A/PER 学到「走 danger」；B 排除后学专家序。
    """
    if not batch:
        return
    opt = torch.optim.Adam(policy.parameters(), lr=lr)
    policy.train()
    for _ in range(epochs):
        ss, aa, ww = [], [], []
        for t in batch:
            # 权重：成功专家高，危险也保留非零以便污染臂学坏
            w = 2.0 if t.success else (1.5 if t.used_danger else 0.3)
            for s, a in zip(t.states, t.actions):
                ss.append(s)
                aa.append(a)
                ww.append(w)
        if not ss:
            continue
        x = torch.tensor(ss, dtype=torch.float32, device=device)
        a = torch.tensor(aa, dtype=torch.long, device=device)
        w = torch.tensor(ww, dtype=torch.float32, device=device)
        logits = policy(x)
        logp = F.log_softmax(logits, dim=-1).gather(1, a.view(-1, 1)).squeeze(1)
        loss = -(logp * w).mean()
        opt.zero_grad()
        loss.backward()
        opt.step()


@torch.no_grad()
def evaluate(policy: nn.Module, puzzles: list[Puzzle], max_steps: int, device: torch.device, seed: int) -> float:
    rng = random.Random(seed + 4242)
    policy.eval()
    ok = 0
    for pz in puzzles:
        t = rollout_env(policy, pz, max_steps, device, epsilon=0.05, rng=rng)
        if t.success:
            ok += 1
    return ok / max(1, len(puzzles))


def summarize(sel: list[Traj], corpus: list[Traj]) -> dict[str, Any]:
    tot = sum(t.tokens for t in corpus) or 1
    adm = sum(t.tokens for t in sel)
    haz = sum(1 for t in sel if t.true_hazard or t.used_danger)
    return {
        "admit_count": len(sel),
        "deep_read_ratio": adm / tot,
        "hazard_in_adm": haz,
    }


def spearman(xs: list[float], ys: list[float]) -> float:
    n = len(xs)
    if n < 3:
        return 0.0

    def rank(arr: list[float]) -> list[float]:
        idx = sorted(range(n), key=lambda i: arr[i])
        r = [0.0] * n
        i = 0
        while i < n:
            j = i
            while j < n and arr[idx[j]] == arr[idx[i]]:
                j += 1
            avg = (i + j - 1) / 2 + 1
            for k in range(i, j):
                r[idx[k]] = avg
            i = j
        return r

    rx, ry = rank(xs), rank(ys)
    mx, my = sum(rx) / n, sum(ry) / n
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    dx = sum((a - mx) ** 2 for a in rx)
    dy = sum((b - my) ** 2 for b in ry)
    if dx <= 0 or dy <= 0:
        return 0.0
    return num / math.sqrt(dx * dy)


def run_seed(cfg: dict[str, Any], seed: int, device: torch.device) -> dict[str, Any]:
    torch.manual_seed(seed)
    max_steps = cfg["env"]["max_steps"]
    train_pz = make_puzzles(cfg["env"]["n_train"], seed, cfg["env"]["hazard_frac"])
    eval_pz = make_puzzles(cfg["env"]["n_eval"], seed + 99, 0.0)

    # 行为策略：随机初始化网络 + 高探索采集
    behavior = PolicyMLP(cfg["model"]["hidden"], cfg["model"]["layers"]).to(device)
    corpus = collect_corpus(behavior, train_pz, max_steps, device, epsilon=0.55, seed=seed)

    arms = {
        "A": select_a(corpus),
        "B": select_b(corpus, cfg["armB"]["hazard_threshold"], cfg["armB"]["admit_top_frac"]),
        "P": select_per(corpus, cfg["per"]["alpha"], cfg["per"]["admit_frac"]),
    }

    results = {}
    for name, batch in arms.items():
        pol = PolicyMLP(cfg["model"]["hidden"], cfg["model"]["layers"]).to(device)
        train_policy(pol, batch, cfg["train"]["epochs"], cfg["train"]["lr"], device)
        succ = evaluate(pol, eval_pz, max_steps, device, seed)
        summ = summarize(batch, corpus)
        results[name] = {"success": round4(succ), **summ}

    corr = spearman([t.route_score for t in corpus], [t.learnability for t in corpus])
    return {
        "seed": seed,
        "arms": results,
        "signal_spearman": round4(corr),
        "deep_read_improve_AB": round4(results["A"]["deep_read_ratio"] - results["B"]["deep_read_ratio"]),
        "delta_BA": round4(results["B"]["success"] - results["A"]["success"]),
        "delta_BP": round4(results["B"]["success"] - results["P"]["success"]),
    }


def judge(rows: list[dict[str, Any]], cfg: dict[str, Any]) -> dict[str, Any]:
    f = cfg["failure"]
    mean_a = sum(r["arms"]["A"]["success"] for r in rows) / len(rows)
    mean_b = sum(r["arms"]["B"]["success"] for r in rows) / len(rows)
    mean_p = sum(r["arms"]["P"]["success"] for r in rows) / len(rows)
    deep = sum(r["deep_read_improve_AB"] for r in rows) / len(rows)
    haz_b = sum(r["arms"]["B"]["hazard_in_adm"] for r in rows)
    haz_a = sum(r["arms"]["A"]["hazard_in_adm"] for r in rows)
    haz_p = sum(r["arms"]["P"]["hazard_in_adm"] for r in rows)
    corr = sum(r["signal_spearman"] for r in rows) / len(rows)
    failures = []
    if deep < f["deep_read_improve_min"]:
        failures.append({"id": 2, "detail": f"深读下降 {round4(deep)}"})
    if mean_a - mean_b > f["perf_drop_max"]:
        failures.append({"id": 3, "detail": f"B 相对 A 回撤 A={round4(mean_a)} B={round4(mean_b)}"})
    if haz_b > 0:
        failures.append({"id": 4, "detail": f"B hazard_in_adm={haz_b}"})
    if abs(corr) < f["signal_corr_min"]:
        failures.append({"id": 5, "detail": f"spearman={round4(corr)}"})

    hard = any(x["id"] in (3, 4, 5) for x in failures)
    if hard:
        verdict = "reject_or_fail"
    elif mean_b + f["perf_drop_max"] >= mean_a and deep >= f["deep_read_improve_min"] and haz_b == 0:
        # 相对 PER：不要求必胜，但记录
        verdict = "weak_success_gpu" if mean_b >= mean_p - 0.02 else "weak_success_vs_A_only"
    else:
        verdict = "inconclusive"
    return {
        "verdict": verdict,
        "failures": failures,
        "meanA": round4(mean_a),
        "meanB": round4(mean_b),
        "meanP": round4(mean_p),
        "deepImprove": round4(deep),
        "hazA": haz_a,
        "hazB": haz_b,
        "hazP": haz_p,
        "corr": round4(corr),
    }


def render(report: dict[str, Any]) -> str:
    j = report["judgment"]
    lines = [
        "# Experience Routing GPU 真权重报告",
        "",
        f"> {report['meta']['disclaimer']}",
        "",
        f"- **设备:** {report['meta']['device']}",
        f"- **裁决:** `{j['verdict']}`",
        f"- **耗时:** {report['meta']['elapsed_sec']}s",
        "",
        "## 汇总（多 seed 均值）",
        "",
        "| Arm | 成功率 | 危险进准入(累计) |",
        "|-----|--------|------------------|",
        f"| A 被动池 | {j['meanA']} | {j['hazA']} |",
        f"| B 准入 | {j['meanB']} | {j['hazB']} |",
        f"| P PER | {j['meanP']} | {j['hazP']} |",
        "",
        f"B 相对 A 深读下降: **{j['deepImprove']}** · Spearman: **{j['corr']}**",
        "",
        "## 各 seed",
        "",
        "| seed | A | B | P | deep↓ | hazB |",
        "|-----:|--:|--:|--:|------:|-----:|",
    ]
    for r in report["seeds"]:
        lines.append(
            f"| {r['seed']} | {r['arms']['A']['success']} | {r['arms']['B']['success']} | "
            f"{r['arms']['P']['success']} | {r['deep_read_improve_AB']} | {r['arms']['B']['hazard_in_adm']} |"
        )
    lines += ["", "## 失败条件", ""]
    if not j["failures"]:
        lines.append("- 未触发")
    else:
        for f in j["failures"]:
            lines.append(f"- 条件 {f['id']}: {f['detail']}")
    lines += ["", f"对应：`{report['meta']['paperRef']}`"]
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cpu", action="store_true")
    args = ap.parse_args()
    cfg = load_config()

    if args.cpu or not torch.cuda.is_available():
        device = torch.device("cpu")
        if not args.cpu and not torch.cuda.is_available():
            print("WARN: CUDA 不可用，回退 CPU", flush=True)
    else:
        device = torch.device("cuda")

    print(f"device={device} torch={torch.__version__}", flush=True)
    if device.type == "cuda":
        print(f"gpu={torch.cuda.get_device_name(0)}", flush=True)

    t0 = time.time()
    rows = []
    for seed in cfg["seeds"]:
        print(f"seed={seed}", flush=True)
        rows.append(run_seed(cfg, seed, device))
    elapsed = round(time.time() - t0, 2)
    judgment = judge(rows, cfg)
    report = {
        "meta": {
            "disclaimer": DISCLAIMER,
            "device": str(device),
            "gpu": torch.cuda.get_device_name(0) if device.type == "cuda" else None,
            "torch": torch.__version__,
            "elapsed_sec": elapsed,
            "paperRef": "docs/drafts/experience-routing-position-paper-zh.md §7",
        },
        "seeds": rows,
        "judgment": judgment,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    md = render(report)
    (OUT / "report.md").write_text(md, encoding="utf-8")
    print(md)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
