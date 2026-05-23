#!/bin/sh
# BeforeCommand: block agent stop while .forge/phase-exit-block exists (Ralph-style phase completion)
# Agent writes the file when Phase/DEV-PLAN acceptance is incomplete; removes it when truly done.
# YOLO: log to .yolo-pending instead of blocking (same pattern as stop-gate)

is_yolo_mode() {
  [ -f "$CLAUDE_PROJECT_DIR/.forge/config" ] && grep -qi "^FORGE_MODE=yolo" "$CLAUDE_PROJECT_DIR/.forge/config" 2>/dev/null && return 0
  [ -f "$HOME/.forge/config" ] && grep -qi "^FORGE_MODE=yolo" "$HOME/.forge/config" 2>/dev/null && return 0
  [ "$FORGE_MODE" = "yolo" ] && return 0
  return 1
}

BLOCK_FILE="$CLAUDE_PROJECT_DIR/.forge/phase-exit-block"

if [ ! -f "$BLOCK_FILE" ]; then
  exit 0
fi

REASON=$(head -n 1 "$BLOCK_FILE" 2>/dev/null | tr -d '\r')
if [ -z "$REASON" ]; then
  REASON="Phase or DEV-PLAN acceptance criteria not complete. See DEV-PLAN.md and dev-builder phase verification."
fi

if is_yolo_mode; then
  mkdir -p "$CLAUDE_PROJECT_DIR/.claude/.yolo-pending"
  printf '%s\n' "phase-exit-guard: $REASON" > "$CLAUDE_PROJECT_DIR/.claude/.yolo-pending/phase-exit"
  exit 0
fi

# Escape double quotes for JSON reason field
ESCAPED=$(printf '%s' "$REASON" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf '{"decision": "block", "reason": "%s — Complete Phase four-step verification in dev-builder, then remove .forge/phase-exit-block before stopping."}\n' "$ESCAPED"
exit 0
