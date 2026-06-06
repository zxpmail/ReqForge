#!/bin/sh
# Hook: PostToolUse (periodic)
# Generate session handoff when context usage is high
# Checks if handoff should be suggested based on session length

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MEMORY_DIR="$PROJECT_DIR/memory"
HANDOFF_FILE="$MEMORY_DIR/handoff.md"

# Only suggest if memory/ exists (project uses Forge dev flow)
if [ ! -d "$MEMORY_DIR" ]; then
  exit 0
fi

# If handoff already exists from today, skip
if [ -f "$HANDOFF_FILE" ]; then
  TODAY=$(date +%Y-%m-%d)
  # macOS: date -r, Linux: stat -c, Windows Git Bash: stat -c
  FILE_DAY=""
  if date -r "$HANDOFF_FILE" +%Y-%m-%d >/dev/null 2>&1; then
    FILE_DAY=$(date -r "$HANDOFF_FILE" +%Y-%m-%d)
  elif stat -c %y "$HANDOFF_FILE" >/dev/null 2>&1; then
    FILE_DAY=$(stat -c %y "$HANDOFF_FILE" | cut -d' ' -f1)
  else
    :  # can't determine file date, skip check
  fi
  if [ "$FILE_DAY" = "$TODAY" ]; then
    exit 0
  fi
fi

# Signal: context may be running long — suggest handoff
echo '{"additionalContext": "Tip: Session running for a while. If context feels full, run /handoff to generate a session handoff document, then /clear to reset. This preserves progress for the next session."}'

exit 0
