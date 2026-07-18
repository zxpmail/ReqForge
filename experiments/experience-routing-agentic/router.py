# 经验准入路由：Arm A 被动池 / Arm B 隔离+选择性准入
# 关联：deepseek_worker.Trajectory、train_ab.py
from __future__ import annotations

from typing import Any

from deepseek_worker import Trajectory


def select_arm_a(corpus: list[Trajectory], admit_frac: float) -> dict[str, Any]:
    n = max(1, int(len(corpus) * admit_frac))
    admitted = corpus[:n]
    return {
        "arm": "A",
        "admitted": admitted,
        "quarantined": corpus[n:],
        "deep_read": admitted,
    }


def select_arm_b(
    corpus: list[Trajectory],
    hazard_threshold: float,
    min_route_score: float,
    admit_top_frac_of_safe: float,
) -> dict[str, Any]:
    safe: list[Trajectory] = []
    quarantined: list[Trajectory] = []
    for t in corpus:
        haz = float(t.fp.get("hazard_sensor", 0.0))
        if haz >= hazard_threshold or t.used_dangerous:
            quarantined.append(t)
        else:
            safe.append(t)
    safe_sorted = sorted(safe, key=lambda x: float(x.fp.get("route_score", 0.0)), reverse=True)
    filtered = [t for t in safe_sorted if float(t.fp.get("route_score", 0.0)) >= min_route_score]
    pool = filtered or safe_sorted
    n_admit = max(1, int(len(pool) * admit_top_frac_of_safe)) if pool else 0
    admitted = pool[:n_admit]
    return {
        "arm": "B",
        "admitted": admitted,
        "quarantined": quarantined,
        "deep_read": safe_sorted,  # 可观察 ≠ 准入
        "bins": {
            "safe": len(safe),
            "quarantined": len(quarantined),
            "admitted": len(admitted),
        },
    }


def summarize_selection(sel: dict[str, Any], corpus: list[Trajectory]) -> dict[str, Any]:
    tot = sum(t.tokens for t in corpus) or 1
    adm = sel["admitted"]
    deep = sel.get("deep_read") or adm
    adm_tok = sum(t.tokens for t in adm)
    deep_tok = sum(t.tokens for t in deep)
    hazard_in = [t for t in adm if t.true_hazard or t.used_dangerous]
    return {
        "arm": sel["arm"],
        "admit_count": len(adm),
        "deep_read_count": len(deep),
        "quarantined_count": len(sel.get("quarantined") or []),
        "deep_read_ratio": deep_tok / tot,
        "admit_token_ratio": adm_tok / tot,
        "hazard_in_adm_count": len(hazard_in),
        "bins": sel.get("bins"),
    }
