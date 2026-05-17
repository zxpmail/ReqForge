#!/bin/bash
# Hook: SessionStart (startup)
# Check FEEDBACK-INDEX.md for unprocessed feedback
# If entries exist → remind to dispatch evolution-runner

FEEDBACK_INDEX="$CLAUDE_PROJECT_DIR/.claude/feedback/FEEDBACK-INDEX.md"

if [ ! -f "$FEEDBACK_INDEX" ]; then
  exit 0
fi

COUNT=$(grep -c "^- \[" "$FEEDBACK_INDEX" 2>/dev/null)
COUNT=${COUNT:-0}
COUNT=$(echo "$COUNT" | tr -d '[:space:]')

if [ "$COUNT" -gt 0 ] 2>/dev/null; then
  echo "📋 Project has ${COUNT} feedback entries. Consider dispatching evolution-runner for evolution proposals."
fi

exit 0
