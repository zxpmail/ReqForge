# 经验准入 A/B 主循环：DeepSeek rollout + 本地 θ 更新
# 关联：credentials / env_tools / deepseek_worker / router / local_policy
# 免责：不更新 DeepSeek 云端权重。
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any

from credentials import CredentialError, describe_credentials, load_credentials
from deepseek_worker import Budget, DeepSeekClient, run_episode, run_episode_mock
from env_tools import make_puzzles
from local_policy import PromptPolicy, reinforce_update
from router import select_arm_a, select_arm_b, summarize_selection

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
DISCLAIMER = (
    "DeepSeek 仅用于冻结 worker rollout；本地 prompt 策略 θ 被更新。"
    "不得表述为「微调了 DeepSeek」。非大规模 agentic RL 实证。"
)


def load_config() -> dict[str, Any]:
    return json.loads((ROOT / "config.json").read_text(encoding="utf-8"))


def mean(xs: list[float]) -> float:
    return sum(xs) / len(xs) if xs else 0.0


def round4(x: float) -> float:
    return round(x, 4)


def ranks(arr: list[float]) -> list[float]:
    idx = sorted(range(len(arr)), key=lambda i: arr[i])
    r = [0.0] * len(arr)
    i = 0
    while i < len(idx):
        j = i
        while j < len(idx) and arr[idx[j]] == arr[idx[i]]:
            j += 1
        avg = (i + j - 1) / 2 + 1
        for k in range(i, j):
            r[idx[k]] = avg
        i = j
    return r


def spearman(xs: list[float], ys: list[float]) -> float:
    if len(xs) < 3:
        return 0.0
    rx, ry = ranks(xs), ranks(ys)
    mx, my = mean(rx), mean(ry)
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    dx = sum((a - mx) ** 2 for a in rx)
    dy = sum((b - my) ** 2 for b in ry)
    if dx <= 0 or dy <= 0:
        return 0.0
    return num / math.sqrt(dx * dy)


def collect_with_explore(
    client: DeepSeekClient | None,
    puzzles: list,
    variants: list[str],
    max_steps: int,
    mock: bool,
    seed: int,
) -> list[Trajectory]:
    """探索采集：轮转 prompt_id，保证各变体都有样本。"""
    trajs: list[Trajectory] = []
    n = len(variants)
    for i, pz in enumerate(puzzles):
        pid = i % n
        sys_p = variants[pid]
        if mock or client is None:
            trajs.append(run_episode_mock(pz, pid, n))
        else:
            trajs.append(run_episode(client, pz, sys_p, pid, max_steps))
    return trajs


def eval_policy(
    client: DeepSeekClient | None,
    policy: PromptPolicy,
    puzzles: list,
    variants: list[str],
    max_steps: int,
    mock: bool,
) -> dict[str, Any]:
    pid = policy.greedy()
    sys_p = variants[pid % len(variants)]
    trajs: list[Trajectory] = []
    for pz in puzzles:
        if mock or client is None:
            trajs.append(run_episode_mock(pz, pid, len(variants)))
        else:
            trajs.append(run_episode(client, pz, sys_p, pid, max_steps))
    succ = mean([1.0 if t.success else 0.0 for t in trajs])
    dang = sum(1 for t in trajs if t.used_dangerous)
    return {
        "success": round4(succ),
        "prompt_id": pid,
        "n": len(trajs),
        "dangerous_uses": dang,
        "mean_reward": round4(mean([t.reward for t in trajs])),
    }


def train_one_arm(
    sel: dict[str, Any],
    n_variants: int,
    seed: int,
    cfg: dict[str, Any],
) -> tuple[PromptPolicy, dict[str, Any]]:
    pol = PromptPolicy(n_variants, seed=seed)
    stats = reinforce_update(
        pol,
        sel["admitted"],
        lr=float(cfg["train"]["lr"]),
        epochs=int(cfg["train"]["epochs"]),
    )
    return pol, stats


def judge(seed_rows: list[dict[str, Any]], cfg: dict[str, Any]) -> dict[str, Any]:
    f = cfg["failure"]
    mean_a = mean([r["armA"]["success"] for r in seed_rows])
    mean_b = mean([r["armB"]["success"] for r in seed_rows])
    deep_imp = mean([r["deep_read_improve"] for r in seed_rows])
    haz_b = sum(r["armB_sel"]["hazard_in_adm_count"] for r in seed_rows)
    haz_a = sum(r["armA_sel"]["hazard_in_adm_count"] for r in seed_rows)
    corr = mean([r["signal_spearman"] for r in seed_rows])
    failures: list[dict[str, Any]] = []

    if deep_imp < f["deep_read_improve_min"]:
        failures.append(
            {
                "id": 2,
                "name": "无预算改善",
                "detail": f"深读比下降 {round4(deep_imp)} < {f['deep_read_improve_min']}",
            }
        )
    if mean_a - mean_b > f["perf_drop_max"]:
        failures.append(
            {
                "id": 3,
                "name": "受限更新集回撤",
                "detail": f"A={round4(mean_a)} 高于 B={round4(mean_b)} 超过 {f['perf_drop_max']}",
            }
        )
    if haz_b > 0:
        failures.append(
            {
                "id": 4,
                "name": "危险经验穿透隔离边界",
                "detail": f"B 累计 hazard_in_adm={haz_b}",
            }
        )
    if abs(corr) < f["signal_corr_min"]:
        failures.append(
            {
                "id": 5,
                "name": "廉价信号与可学习性失相关",
                "detail": f"mean spearman={round4(corr)}",
            }
        )

    hard = any(x["id"] in (3, 4, 5) for x in failures)
    if hard:
        verdict = "reject_or_fail"
    elif deep_imp >= f["deep_read_improve_min"] and mean_b + f["perf_drop_max"] >= mean_a and haz_b == 0:
        verdict = "weak_success_agentic" if mean_b >= mean_a else "weak_success_budget_only"
    else:
        verdict = "inconclusive"

    return {
        "failures": failures,
        "verdict": verdict,
        "meanSuccessA": round4(mean_a),
        "meanSuccessB": round4(mean_b),
        "meanDeepReadImprove": round4(deep_imp),
        "totalHazardInAdmA": haz_a,
        "totalHazardInAdmB": haz_b,
        "meanSignalSpearman": round4(corr),
    }


def run_seed(
    cfg: dict[str, Any],
    seed: int,
    client: DeepSeekClient | None,
    mock: bool,
) -> dict[str, Any]:
    variants = list(cfg["prompt_variants"])
    train_pz = make_puzzles(cfg["collect"]["n_train"], seed, cfg["collect"]["hazard_frac"])
    eval_pz = make_puzzles(cfg["collect"]["n_eval"], seed + 999, 0.0)

    corpus = collect_with_explore(
        client,
        train_pz,
        variants,
        cfg["collect"]["max_steps"],
        mock,
        seed,
    )
    sel_a = select_arm_a(corpus, cfg["armA"]["admit_frac"])
    sel_b = select_arm_b(
        corpus,
        cfg["armB"]["hazard_threshold"],
        cfg["armB"]["min_route_score"],
        cfg["armB"]["admit_top_frac_of_safe"],
    )
    sum_a = summarize_selection(sel_a, corpus)
    sum_b = summarize_selection(sel_b, corpus)

    pol_a, _ = train_one_arm(sel_a, len(variants), seed, cfg)
    pol_b, _ = train_one_arm(sel_b, len(variants), seed + 1, cfg)

    ev_a = eval_policy(client, pol_a, eval_pz, variants, cfg["collect"]["max_steps"], mock)
    ev_b = eval_policy(client, pol_b, eval_pz, variants, cfg["collect"]["max_steps"], mock)

    corr = spearman(
        [float(t.fp["route_score"]) for t in corpus],
        [float(t.fp["learnability"]) for t in corpus],
    )
    return {
        "seed": seed,
        "armA": ev_a,
        "armB": ev_b,
        "armA_sel": sum_a,
        "armB_sel": sum_b,
        "delta_success": round4(ev_b["success"] - ev_a["success"]),
        "deep_read_improve": round4(sum_a["deep_read_ratio"] - sum_b["deep_read_ratio"]),
        "signal_spearman": round4(corr),
        "corpus_n": len(corpus),
        "mock": mock,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Experience routing agentic A/B (DeepSeek hybrid)")
    ap.add_argument("--mock", action="store_true", help="结构自检，不调 API（非实证）")
    ap.add_argument("--seed", type=int, default=None, help="只跑单个 seed")
    args = ap.parse_args()

    cfg = load_config()
    seeds = [args.seed] if args.seed is not None else list(cfg["seeds"])
    mock = bool(args.mock)

    client: DeepSeekClient | None = None
    cred_desc = "mock"
    model = cfg.get("model", "deepseek-v4-flash")

    if not mock:
        try:
            cred = load_credentials(cfg)
        except CredentialError as e:
            print(str(e), file=sys.stderr)
            return 2
        cred_desc = describe_credentials(cred)
        model = cred["model"]
        print(f"[cred] {cred_desc}", file=sys.stderr)
        budget = Budget(**cfg["budget"])
        client = DeepSeekClient(
            api_key=cred["api_key"],
            base_url=cred["base_url"],
            model=model,
            budget=budget,
            temperature=float(cfg["collect"]["temperature"]),
        )
    else:
        print("[mode] MOCK — 不调用 DeepSeek，结果不得当作实证", file=sys.stderr)

    rows: list[dict[str, Any]] = []
    try:
        for seed in seeds:
            print(f"[run] seed={seed}", file=sys.stderr)
            rows.append(run_seed(cfg, seed, client, mock))
    except RuntimeError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 3

    judgment = judge(rows, cfg)
    budget_info = {}
    if client is not None:
        budget_info = {
            "api_calls": client.budget.api_calls,
            "tokens": client.budget.tokens,
            "spend_usd_est": round4(client.budget.spend_usd),
        }

    report = {
        "meta": {
            "disclaimer": DISCLAIMER,
            "mode": "mock" if mock else "deepseek-live",
            "cred_desc": cred_desc,
            "model": model,
            "paperRef": "docs/drafts/experience-routing-position-paper-zh.md §7",
            "seeds": seeds,
        },
        "config": {k: v for k, v in cfg.items() if k != "prompt_variants"},
        "seeds": rows,
        "judgment": judgment,
        "budget": budget_info,
    }

    OUT.mkdir(parents=True, exist_ok=True)
    tag = "mock" if mock else "live"
    (OUT / f"report-{tag}.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    md = render_md(report)
    (OUT / f"report-{tag}.md").write_text(md, encoding="utf-8")
    if tag == "live":
        (OUT / "report.md").write_text(md, encoding="utf-8")
        (OUT / "report.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    print(md)
    print(f"\nWrote {OUT / f'report-{tag}.md'}", file=sys.stderr)
    return 0


def render_md(report: dict[str, Any]) -> str:
    j = report["judgment"]
    lines = [
        "# Experience Routing Agentic（DeepSeek 混合）报告",
        "",
        f"> {report['meta']['disclaimer']}",
        "",
        f"- **模式:** {report['meta']['mode']}",
        f"- **凭证:** {report['meta']['cred_desc']}",
        f"- **模型:** {report['meta']['model']}",
        f"- **裁决:** `{j['verdict']}`",
        "",
        "## 汇总",
        "",
        "| 指标 | A 被动池 | B 准入路由 |",
        "|------|----------|------------|",
        f"| 平均成功率 | {j['meanSuccessA']} | {j['meanSuccessB']} |",
        f"| 危险进准入(累计) | {j['totalHazardInAdmA']} | {j['totalHazardInAdmB']} |",
        f"| 深读比平均下降 | — | {j['meanDeepReadImprove']} |",
        f"| 信号 Spearman | — | {j['meanSignalSpearman']} |",
        "",
        "## 各 seed",
        "",
        "| seed | succA | succB | Δ | deep↓ | hazB |",
        "|-----:|------:|------:|--:|------:|-----:|",
    ]
    for r in report["seeds"]:
        lines.append(
            f"| {r['seed']} | {r['armA']['success']} | {r['armB']['success']} | "
            f"{r['delta_success']} | {r['deep_read_improve']} | "
            f"{r['armB_sel']['hazard_in_adm_count']} |"
        )
    lines += ["", "## 预注册失败条件", ""]
    if not j["failures"]:
        lines.append("- 可测条件：**未触发**")
    else:
        for f in j["failures"]:
            lines.append(f"- **失败条件 {f['id']}（{f['name']}）:** {f['detail']}")
    lines += [
        "",
        f"预算: `{json.dumps(report.get('budget', {}), ensure_ascii=False)}`",
        "",
        f"对应：`{report['meta']['paperRef']}`",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    raise SystemExit(main())
