# Experience Routing GPU（真权重最小主实验）

本机 **RTX 3070** 上跑：小 MLP 策略 + 回报加权行为克隆（真 CUDA 梯度），对照 **A 被动 / B 准入 / P PER**。

## 边界

| 是 | 不是 |
|----|------|
| CUDA 上真的更新神经网络权重 | 开源 LLM LoRA / GRPO |
| 含 PER 基线对照 | DeepSeek 云端微调 |
| 多 seed 可复现 | 弹药级大规模 agentic 主结果 |

## 环境

使用专用 Python 3.12 + CUDA torch（勿用系统 3.14 CPU 版）：

```bash
E:\work\ReqForge\experiments\.py312\python.exe experiments/experience-routing-gpu/train_gpu.py
```

## 报告

`out/report.md`
