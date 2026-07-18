# 凭证加载：环境变量优先，其次 CC Switch 当前/指定 DeepSeek provider
# 关联：deepseek_worker.py、train_ab.py
from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any


class CredentialError(RuntimeError):
    """缺少可用 API 凭证时抛出。"""


def _redact(s: str) -> str:
    if not s:
        return "empty"
    return f"set(len={len(s)}, prefix={s[:4]}…)"


def load_from_env() -> dict[str, Any] | None:
    """从 DEEPSEEK_* / ANTHROPIC_* 环境变量加载。"""
    key = (
        os.environ.get("DEEPSEEK_API_KEY")
        or os.environ.get("ANTHROPIC_AUTH_TOKEN")
        or os.environ.get("ANTHROPIC_API_KEY")
        or ""
    ).strip()
    if not key:
        return None
    base = (
        os.environ.get("DEEPSEEK_BASE_URL")
        or os.environ.get("ANTHROPIC_BASE_URL")
        or "https://api.deepseek.com"
    ).strip()
    model = (
        os.environ.get("DEEPSEEK_MODEL")
        or os.environ.get("ANTHROPIC_MODEL")
        or "deepseek-v4-flash"
    ).strip()
    api_format = "anthropic" if "/anthropic" in base.rstrip("/") else "openai"
    # OpenAI 调用用不带 /anthropic 的根
    openai_base = base.replace("/anthropic", "").rstrip("/")
    return {
        "api_key": key,
        "base_url": openai_base,
        "anthropic_base_url": base if api_format == "anthropic" else f"{openai_base}/anthropic",
        "model": model,
        "api_format": api_format,
        "source": "env",
    }


def load_from_cc_switch(provider_name: str = "DeepSeek") -> dict[str, Any] | None:
    """从 ~/.cc-switch/cc-switch.db 读取指定或当前 Claude provider。"""
    db = Path.home() / ".cc-switch" / "cc-switch.db"
    if not db.is_file():
        return None
    con = sqlite3.connect(str(db))
    row = con.execute(
        "SELECT id, name, settings_config, meta, is_current FROM providers "
        "WHERE app_type='claude' AND name=? COLLATE NOCASE",
        (provider_name,),
    ).fetchone()
    if not row:
        row = con.execute(
            "SELECT id, name, settings_config, meta, is_current FROM providers "
            "WHERE app_type='claude' AND is_current=1"
        ).fetchone()
    if not row:
        return None
    _id, name, settings_raw, meta_raw, _cur = row
    cfg = json.loads(settings_raw or "{}")
    meta = json.loads(meta_raw or "{}") if meta_raw else {}
    env = cfg.get("env") or {}
    key = (env.get("ANTHROPIC_AUTH_TOKEN") or env.get("ANTHROPIC_API_KEY") or "").strip()
    if not key:
        return None
    anth_base = (env.get("ANTHROPIC_BASE_URL") or "https://api.deepseek.com/anthropic").strip()
    model = (
        env.get("ANTHROPIC_MODEL")
        or env.get("ANTHROPIC_DEFAULT_SONNET_MODEL")
        or "deepseek-v4-flash"
    ).strip()
    openai_base = anth_base.replace("/anthropic", "").rstrip("/")
    return {
        "api_key": key,
        "base_url": openai_base,
        "anthropic_base_url": anth_base,
        "model": model,
        "api_format": meta.get("apiFormat") or "openai",
        "source": f"cc-switch:{name}",
        "provider_id": _id,
    }


def load_credentials(cfg: dict[str, Any] | None = None) -> dict[str, Any]:
    """按优先级加载凭证；失败时抛出带指引的 CredentialError。"""
    cfg = cfg or {}
    cred = load_from_env()
    if cred is None:
        cred = load_from_cc_switch(cfg.get("cc_switch_provider_name") or "DeepSeek")
    if cred is None:
        raise CredentialError(
            "未找到 DeepSeek 凭证。请任选其一：\n"
            "  1) 设置环境变量 DEEPSEEK_API_KEY（或 ANTHROPIC_AUTH_TOKEN）\n"
            "  2) 在 CC Switch 中启用 DeepSeek provider（~/.cc-switch/cc-switch.db）\n"
            "不要伪造轨迹；无 Key 时本实验拒绝运行。"
        )
    # config.json 可覆盖 model / base_url
    if cfg.get("model"):
        cred["model"] = cfg["model"]
    if cfg.get("base_url"):
        cred["base_url"] = cfg["base_url"].replace("/anthropic", "").rstrip("/")
    if cfg.get("api_format"):
        cred["api_format"] = cfg["api_format"]
    return cred


def describe_credentials(cred: dict[str, Any]) -> str:
    """日志用描述，不含密钥明文。"""
    return (
        f"source={cred.get('source')} model={cred.get('model')} "
        f"base={cred.get('base_url')} key={_redact(cred.get('api_key', ''))}"
    )
