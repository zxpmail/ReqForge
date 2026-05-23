#!/bin/sh
# PostToolUse: 记忆子系统守卫（归档 task-history + 会话交接提示）
# 委托给既有脚本，避免逻辑重复；check-evolution 仍在 OnInit 独立运行

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"

sh "$HOOK_DIR/context-compaction.sh"
sh "$HOOK_DIR/check-handoff.sh"

exit 0
