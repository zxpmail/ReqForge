#!/bin/bash
# PostToolUse hook: mark changed code files as needing review
# Exclude known non-code file types, trigger on everything else

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Exclude non-code files, mark everything else as needing review
case "$FILE_PATH" in
  *.md|*.txt|*.json|*.yaml|*.yml|*.toml|*.lock|*.log|*.env|*.env.*|*.gitignore|*.prettierrc|*.eslintrc)
    ;;
  *)
    echo "needs_review" > "$CLAUDE_PROJECT_DIR/.claude/.needs-review"
    ;;
esac

exit 0
