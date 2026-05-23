#!/bin/sh
# Retry Gate: block auto-retry when retry limit is reached
# Reads .forge/.retry-counter.json and prevents infinite review-fix loops
# State "escalated" = block, "active" with retries >= max = block, otherwise pass

RETRY_FILE="$CLAUDE_PROJECT_DIR/.forge/.retry-counter.json"

if [ ! -f "$RETRY_FILE" ]; then
  exit 0
fi

STATE=$(grep -o '"state"[[:space:]]*:[[:space:]]*"[^"]*"' "$RETRY_FILE" 2>/dev/null | head -1 | sed 's/.*"state"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
RETRIES=$(grep -o '"retries"[[:space:]]*:[[:space:]]*[0-9]*' "$RETRY_FILE" 2>/dev/null | head -1 | sed 's/.*:[[:space:]]*//')
MAX=$(grep -o '"max_retries"[[:space:]]*:[[:space:]]*[0-9]*' "$RETRY_FILE" 2>/dev/null | head -1 | sed 's/.*:[[:space:]]*//')

[ -z "$STATE" ] && exit 0
[ -z "$RETRIES" ] && RETRIES=0
[ -z "$MAX" ] && MAX=3

if [ "$STATE" = "escalated" ]; then
  echo '{"decision": "block", "reason": "Retry limit reached (escalated). The auto-fix loop cannot continue. Present options to the user: A) Manual fix, B) Skip task, C) Adjust approach."}'
  exit 0
fi

if [ "$STATE" = "active" ] && [ "$RETRIES" -ge "$MAX" ] 2>/dev/null; then
  echo '{"decision": "block", "reason": "Retry count ('"$RETRIES"') has reached the limit ('"$MAX"'). Set state to escalated and present options to the user."}'
  exit 0
fi

exit 0
