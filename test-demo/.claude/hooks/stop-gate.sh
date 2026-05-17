#!/bin/sh
# Stop hook: block stop when code files are modified but not reviewed
# State file .needs-review: needs_review = block, clean = allow and delete file, absent = allow

STATE_FILE="$CLAUDE_PROJECT_DIR/.claude/.needs-review"

if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

STATE=$(cat "$STATE_FILE" 2>/dev/null | tr -d '[:space:]')

case "$STATE" in
  "needs_review")
    echo '{"decision": "block", "reason": "Code has been changed but not reviewed. Dispatch code-reviewer sub-agent for two-stage review."}'
    exit 0
    ;;
  "clean")
    rm -f "$STATE_FILE"
    exit 0
    ;;
  *)
    exit 0
    ;;
esac
