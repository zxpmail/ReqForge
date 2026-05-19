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
if [ -f "$HANDOFF_FILE" ] && [ "$(date +%Y-%m-%d)" = "$(date -r "$HANDOFF_FILE" +%Y-%m-%d 2>/dev/null)" ]; then
  exit 0
fi

# Signal: context may be running long — suggest handoff
echo '{"additionalContext": "Tip: Session running for a while. If context feels full, run /handoff to generate a session handoff document, then /clear to reset. This preserves progress for the next session."}'

exit 0
