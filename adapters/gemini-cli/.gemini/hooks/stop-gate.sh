#!/bin/sh
# Stop hook: block stop when code files are modified but not reviewed
# State file .needs-review: needs_review = block, clean = allow and delete file, absent = allow
# YOLO mode: write async file instead of blocking
#   Priority: project .forge/config > global ~/.forge/config > env var FORGE_MODE

is_yolo_mode() {
  [ -f "$CLAUDE_PROJECT_DIR/.forge/config" ] && grep -qi "^FORGE_MODE=yolo" "$CLAUDE_PROJECT_DIR/.forge/config" 2>/dev/null && return 0
  [ -f "$HOME/.forge/config" ] && grep -qi "^FORGE_MODE=yolo" "$HOME/.forge/config" 2>/dev/null && return 0
  [ "$FORGE_MODE" = "yolo" ] && return 0
  return 1
}

STATE_FILE="$CLAUDE_PROJECT_DIR/.claude/.needs-review"

if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

STATE=$(cat "$STATE_FILE" 2>/dev/null | tr -d '[:space:]')

case "$STATE" in
  "needs_review")
    if is_yolo_mode; then
      mkdir -p "$CLAUDE_PROJECT_DIR/.claude/.yolo-pending"
      echo "stop-gate: code not reviewed" > "$CLAUDE_PROJECT_DIR/.claude/.yolo-pending/review-needed"
      exit 0
    fi
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
