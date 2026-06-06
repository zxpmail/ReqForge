#!/bin/sh
# PostToolUse hook: mark changed code files as needing review
# Exclude known non-code file types, trigger on everything else

if [ -z "$CLAUDE_PROJECT_DIR" ]; then
  exit 0
fi

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.tool_input?.file_path||'')}catch(e){console.log('')}})" 2>/dev/null)

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
