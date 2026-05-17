#!/bin/bash
# Hook: PostToolUse (Bash) if git commit*
# Auto-push after successful commit

INPUT=$(cat)
EXIT_CODE=$(echo "$INPUT" | jq -r '.tool_exit_code // .exit_code // "1"' 2>/dev/null)

if [ "$EXIT_CODE" = "0" ]; then
  git push 2>&1 || true
fi

exit 0
