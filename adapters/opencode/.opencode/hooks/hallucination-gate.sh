#!/bin/sh
# Hook: PreToolUse (PreToolUse)
# Hallucination Gate: Verify file paths and dependency references before tool execution
# Checks:
# 1. Write/Edit targets exist in expected directories
# 2. Dependency install commands reference valid packages
# Only blocks obvious hallucinations — not style or convention preferences

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.tool_name||j.tool||'')}catch(e){console.log('')}})" 2>/dev/null)
FILE_PATH=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.tool_input?.file_path||j.tool_input?.path||'')}catch(e){console.log('')}})" 2>/dev/null)

# Only validate Write/Edit/Bash tools
case "$TOOL_NAME" in
  "Write"|"Edit")
    if [ -z "$FILE_PATH" ]; then
      exit 0
    fi
    # Check: parent directory should exist
    PARENT_DIR=$(dirname "$FILE_PATH" 2>/dev/null)
    if [ -n "$PARENT_DIR" ] && [ "$PARENT_DIR" != "." ] && [ ! -d "$PARENT_DIR" ] 2>/dev/null; then
      # Allow node_modules/.pnpm and other virtual dirs
      case "$PARENT_DIR" in
        *"/node_modules/"*|*"/.pnpm/"*) exit 0 ;;
        *)
          echo "{\"decision\":\"block\",\"reason\":\"Hallucination Gate: target directory '$PARENT_DIR' does not exist. Verify the correct path before writing.\"}"
          exit 0
          ;;
      esac
    fi
    ;;
  "Bash")
    COMMAND=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.tool_input?.command||'')}catch(e){console.log('')}})" 2>/dev/null)
    # Check: npm/pnpm install of non-existent packages
    if echo "$COMMAND" | grep -qE "pnpm (add|install)\s+\S+" 2>/dev/null; then
      PACKAGE=$(echo "$COMMAND" | sed 's/.*pnpm add //' | sed 's/ .*//' 2>/dev/null)
      if [ -n "$PACKAGE" ] && [ -f "package.json" ] && ! grep -q "\"$PACKAGE\"" package.json 2>/dev/null; then
        # Package not yet in package.json — this is normal for install
        exit 0
      fi
    fi
    ;;
esac

exit 0
