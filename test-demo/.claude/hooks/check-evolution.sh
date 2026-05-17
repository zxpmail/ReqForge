#!/bin/sh
# Hook: SessionStart (startup)
# Check FEEDBACK-INDEX.md for unprocessed feedback
# If entries exist → remind to dispatch evolution-runner

FEEDBACK_INDEX="$CLAUDE_PROJECT_DIR/.claude/feedback/FEEDBACK-INDEX.md"

if [ ! -f "$FEEDBACK_INDEX" ]; then
  exit 0
fi

COUNT=0
while IFS= read -r line; do
  case "$line" in
    "- ["*) COUNT=$((COUNT + 1)) ;;
  esac
done < "$FEEDBACK_INDEX"

if [ "$COUNT" -gt 0 ] 2>/dev/null; then
  echo "📋 Project has ${COUNT} feedback entries. Consider dispatching evolution-runner for evolution proposals."
fi

exit 0
