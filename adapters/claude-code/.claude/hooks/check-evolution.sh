#!/bin/sh
# Hook: SessionStart (startup)
# Check FEEDBACK-INDEX.md for unprocessed feedback
# If entries exist → mandatory dispatch signal for evolution-runner
# This is a hard trigger, not a suggestion. The main Agent MUST dispatch evolution-runner.

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
  echo '{"additionalContext": "Mandatory action: Project has '"${COUNT}"' feedback entries with scored data. You MUST dispatch evolution-runner sub-agent now to scan for evolution proposals. Do not skip this step."}'
fi

exit 0
