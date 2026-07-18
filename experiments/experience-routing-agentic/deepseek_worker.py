# DeepSeek worker：OpenAI 兼容 Chat Completions + function calling
# 关联：credentials.py、env_tools.py、train_ab.py
# 说明：不更新 DeepSeek 权重；仅 rollout。
from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from env_tools import (
    TOOLS_OPENAI,
    EpisodeState,
    Puzzle,
    call_tool,
    fingerprint,
    user_prompt,
)


@dataclass
class Budget:
    max_api_calls: int
    max_tokens: int
    max_spend_usd: float
    usd_per_1k_tokens: float
    api_calls: int = 0
    tokens: int = 0
    spend_usd: float = 0.0

    def charge(self, prompt_tokens: int, completion_tokens: int) -> None:
        self.api_calls += 1
        used = prompt_tokens + completion_tokens
        self.tokens += used
        self.spend_usd += (used / 1000.0) * self.usd_per_1k_tokens

    def check(self) -> None:
        if self.api_calls >= self.max_api_calls:
            raise RuntimeError(f"budget: max_api_calls={self.max_api_calls}")
        if self.tokens >= self.max_tokens:
            raise RuntimeError(f"budget: max_tokens={self.max_tokens}")
        if self.spend_usd >= self.max_spend_usd:
            raise RuntimeError(f"budget: max_spend_usd={self.max_spend_usd}")


@dataclass
class Trajectory:
    id: str
    puzzle_id: str
    prompt_id: int
    messages: list[dict[str, Any]]
    tool_log: list[dict[str, Any]]
    tokens: int
    reward: float
    success: bool
    used_dangerous: bool
    true_hazard: bool
    fp: dict[str, float]
    mock: bool = False


@dataclass
class DeepSeekClient:
    api_key: str
    base_url: str
    model: str
    budget: Budget
    temperature: float = 0.3

    def chat(self, messages: list[dict[str, Any]], tools: list[dict[str, Any]]) -> dict[str, Any]:
        self.budget.check()
        url = self.base_url.rstrip("/") + "/chat/completions"
        body = {
            "model": self.model,
            "messages": messages,
            "tools": tools,
            "tool_choice": "auto",
            "temperature": self.temperature,
            "max_tokens": 768,
            # 降低推理 token 占用，优先工具调用
            "thinking": {"type": "disabled"},
        }
        data = json.dumps(body).encode("utf-8")
        # 直连、禁用系统代理；部分解析 IP 会拒连，故重试
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        last_err: Exception | None = None
        for attempt in range(5):
            req = urllib.request.Request(
                url,
                data=data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                },
                method="POST",
            )
            try:
                with opener.open(req, timeout=120) as resp:
                    payload = json.loads(resp.read().decode("utf-8"))
                last_err = None
                break
            except urllib.error.HTTPError as e:
                err = e.read().decode("utf-8", errors="replace")
                raise RuntimeError(f"DeepSeek HTTP {e.code}: {err[:500]}") from e
            except Exception as e:  # noqa: BLE001 — 网络抖动重试
                last_err = e
                time.sleep(0.6 * (attempt + 1))
        if last_err is not None:
            raise RuntimeError(f"DeepSeek 连接失败（已重试）: {last_err}") from last_err
        usage = payload.get("usage") or {}
        self.budget.charge(
            int(usage.get("prompt_tokens") or 0),
            int(usage.get("completion_tokens") or 0),
        )
        return payload


def _parse_tool_calls(message: dict[str, Any]) -> list[dict[str, Any]]:
    raw = message.get("tool_calls") or []
    out = []
    for tc in raw:
        fn = tc.get("function") or {}
        args_raw = fn.get("arguments") or "{}"
        try:
            args = json.loads(args_raw) if isinstance(args_raw, str) else dict(args_raw)
        except json.JSONDecodeError:
            args = {}
        out.append(
            {
                "id": tc.get("id") or f"call_{len(out)}",
                "name": fn.get("name") or "",
                "arguments": args,
            }
        )
    return out


def run_episode(
    client: DeepSeekClient,
    puzzle: Puzzle,
    system_prompt: str,
    prompt_id: int,
    max_steps: int,
) -> Trajectory:
    """用 DeepSeek 工具循环解一题。"""
    state = EpisodeState(puzzle=puzzle)
    messages: list[dict[str, Any]] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt(puzzle)},
    ]
    tokens_before = client.budget.tokens

    for _ in range(max_steps):
        if state.done:
            break
        payload = client.chat(messages, TOOLS_OPENAI)
        choice = (payload.get("choices") or [{}])[0]
        msg = choice.get("message") or {}
        messages.append(
            {
                "role": "assistant",
                "content": msg.get("content"),
                "tool_calls": msg.get("tool_calls"),
            }
        )
        tool_calls = _parse_tool_calls(msg)
        if not tool_calls:
            # 无工具则结束
            break
        for tc in tool_calls:
            obs = call_tool(state, tc["name"], tc["arguments"])
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": obs,
                }
            )
            if state.done:
                break

    used_tokens = client.budget.tokens - tokens_before
    fp = fingerprint(state, used_tokens, prompt_id)
    return Trajectory(
        id=f"{puzzle.pid}-p{prompt_id}",
        puzzle_id=puzzle.pid,
        prompt_id=prompt_id,
        messages=messages,
        tool_log=state.tool_log,
        tokens=used_tokens,
        reward=state.reward,
        success=state.success,
        used_dangerous=state.used_dangerous,
        true_hazard=puzzle.is_hazard,
        fp=fp,
        mock=False,
    )


def run_episode_mock(
    puzzle: Puzzle,
    prompt_id: int,
    n_variants: int,
) -> Trajectory:
    """结构自检用 mock：不调用 API，不作为实证。"""
    state = EpisodeState(puzzle=puzzle)
    # 变体 0/2 走正确路径；变体 1 偏向危险
    if puzzle.is_hazard or prompt_id == 1:
        call_tool(state, "dangerous_override", {"note": "mock"})
    else:
        for k, v in puzzle.table.items():
            call_tool(state, "lookup_table", {"key": k})
        # 简化：直接提交正确答案
        call_tool(state, "submit_answer", {"value": puzzle.answer})
    tokens = 80 + 20 * state.steps + prompt_id * 3
    fp = fingerprint(state, tokens, prompt_id)
    return Trajectory(
        id=f"{puzzle.pid}-p{prompt_id}-mock",
        puzzle_id=puzzle.pid,
        prompt_id=prompt_id,
        messages=[],
        tool_log=state.tool_log,
        tokens=tokens,
        reward=state.reward,
        success=state.success,
        used_dangerous=state.used_dangerous,
        true_hazard=puzzle.is_hazard,
        fp=fp,
        mock=True,
    )


def collect_corpus(
    client: DeepSeekClient | None,
    puzzles: list[Puzzle],
    prompt_variants: list[str],
    policy_prompt_id: int,
    max_steps: int,
    mock: bool,
) -> list[Trajectory]:
    """采集轨迹；prompt_id 由本地策略采样（传入）或固定。"""
    trajs: list[Trajectory] = []
    for pz in puzzles:
        sys_p = prompt_variants[policy_prompt_id % len(prompt_variants)]
        if mock or client is None:
            trajs.append(run_episode_mock(pz, policy_prompt_id, len(prompt_variants)))
        else:
            # 轻微错开，避免瞬时限流
            time.sleep(0.15)
            trajs.append(
                run_episode(client, pz, sys_p, policy_prompt_id, max_steps)
            )
    return trajs
