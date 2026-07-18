# 本地可训练 θ：在 prompt 变体上做 REINFORCE（DeepSeek 权重不更新）
# 关联：train_ab.py、deepseek_worker.py
from __future__ import annotations

import math
import random
from typing import Any

from deepseek_worker import Trajectory


class PromptPolicy:
    """离散 prompt-id 策略：logits → softmax 采样。"""

    def __init__(self, n_actions: int, seed: int = 0) -> None:
        self.n = n_actions
        self.logits = [0.0] * n_actions
        self.rng = random.Random(seed)

    def probs(self) -> list[float]:
        m = max(self.logits)
        ex = [math.exp(x - m) for x in self.logits]
        z = sum(ex) or 1.0
        return [e / z for e in ex]

    def sample(self) -> tuple[int, list[float]]:
        p = self.probs()
        u = self.rng.random()
        acc = 0.0
        for i, pi in enumerate(p):
            acc += pi
            if u <= acc:
                return i, p
        return self.n - 1, p

    def greedy(self) -> int:
        return max(range(self.n), key=lambda i: self.logits[i])


def reinforce_update(
    policy: PromptPolicy,
    batch: list[Trajectory],
    lr: float,
    epochs: int,
) -> dict[str, Any]:
    """
    同一优化器：用准入轨迹的 (prompt_id, reward) 更新本地 logits。
    不触及 DeepSeek 参数。
    """
    if not batch:
        return {"updates": 0, "mean_reward": 0.0}

    rewards = [float(t.reward) for t in batch]
    baseline = sum(rewards) / len(rewards)

    updates = 0
    for _ in range(epochs):
        for t in batch:
            a = int(t.prompt_id) % policy.n
            adv = float(t.reward) - baseline
            # 用当前 probs 做 REINFORCE
            p = policy.probs()
            for j in range(policy.n):
                grad = ((1.0 if j == a else 0.0) - p[j]) * adv
                policy.logits[j] += lr * grad
            updates += 1

    return {
        "updates": updates,
        "mean_reward": baseline,
        "logits": list(policy.logits),
        "probs": policy.probs(),
    }


def evaluate_prompt_choice(
    policy: PromptPolicy,
    eval_trajs_by_prompt: dict[int, list[Trajectory]],
) -> float:
    """按贪心 prompt 在评测轨迹上的成功率（若无对应轨迹则用全体）。"""
    a = policy.greedy()
    pool = eval_trajs_by_prompt.get(a) or [
        t for ts in eval_trajs_by_prompt.values() for t in ts
    ]
    if not pool:
        return 0.0
    return sum(1.0 for t in pool if t.success) / len(pool)
