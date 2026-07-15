#!/bin/sh
# Stop hook: block agent stop while .forge/phase-exit-block or .forge/.verify-block exists (Ralph-style phase completion)
# Agent writes phase-exit-block when Phase/DEV-PLAN acceptance is incomplete; forge-verify CLI writes .verify-block on new failures.
# Wired to the Claude Code `Stop` lifecycle event.
#
# YOLO mode: .yolo-continue is written on EVERY Stop (machine handoff, not prose-dependent).
# The external yolo-driver reads this file and re-invokes /dev-builder for the next Phase.
# Without YOLO: block files gate the Stop as usual.
# Fixes dogfood-05 Run #2/#3: phase-exit-guard exited early at block-file check,
# never reached YOLO branch, so .yolo-continue was never written.
# The dev-builder's Step 5a prose instruction to write .yolo-continue was unreliable.
# Machine-enforced: the hook writes it directly on every Stop in YOLO mode.

is_yolo_mode() {
  [ -f "$CLAUDE_PROJECT_DIR/.forge/config" ] && grep -qi "^FORGE_MODE=yolo" "$CLAUDE_PROJECT_DIR/.forge/config" 2>/dev/null && return 0
  [ -f "$HOME/.forge/config" ] && grep -qi "^FORGE_MODE=yolo" "$HOME/.forge/config" 2>/dev/null && return 0
  [ "$FORGE_MODE" = "yolo" ] && return 0
  return 1
}

# YOLO mode → unconditional handoff (even without block files)
if is_yolo_mode; then
  printf '{"yolo":true}\n' > "$CLAUDE_PROJECT_DIR/.forge/.yolo-continue"
  exit 0
fi

BLOCK_FILE="$CLAUDE_PROJECT_DIR/.forge/phase-exit-block"
VERIFY_BLOCK="$CLAUDE_PROJECT_DIR/.forge/.verify-block"

if [ ! -f "$BLOCK_FILE" ] && [ ! -f "$VERIFY_BLOCK" ]; then
  exit 0
fi

REASON=""
if [ -f "$BLOCK_FILE" ]; then
  REASON=$(head -n 1 "$BLOCK_FILE" 2>/dev/null | tr -d '\r')
fi
if [ -f "$VERIFY_BLOCK" ]; then
  VERIFY_REASON=$(head -n 1 "$VERIFY_BLOCK" 2>/dev/null | tr -d '\r')
  if [ -n "$REASON" ]; then
    REASON="$REASON; $VERIFY_REASON"
  else
    REASON="$VERIFY_REASON"
  fi
fi
if [ -z "$REASON" ]; then
  REASON="Phase or DEV-PLAN acceptance criteria not complete, or forge-verify detected new failures. See DEV-PLAN.md and dev-builder phase verification."
fi

# Escape double quotes for JSON reason field
ESCAPED=$(printf '%s' "$REASON" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf '{"decision": "block", "reason": "%s — Complete Phase four-step verification and fix forge-verify failures, then remove block files before stopping."}\n' "$ESCAPED"
exit 0
