#!/bin/sh
# Hook: PreToolUse (PreToolUse)
# 1) Spec-Before-Code Gate — no Product-Spec.md → block app paths (scripts/hooks/spec-before-code-gate.mjs)
# 2) Hallucination Gate — verify paths and dependency references before tool execution

ROOT="$(CDPATH= cd "$(dirname "$0")/../.." && pwd)"
INPUT=$(cat)

BLOCK=$(echo "$INPUT" | node "$ROOT/scripts/hooks/spec-before-code-gate.mjs" 2>/dev/null)
if [ -n "$BLOCK" ]; then
  echo "$BLOCK"
  exit 0
fi

TOOL_NAME=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.tool_name||j.tool||'')}catch(e){console.log('')}})" 2>/dev/null)
FILE_PATH=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.tool_input?.file_path||j.tool_input?.path||'')}catch(e){console.log('')}})" 2>/dev/null)

case "$TOOL_NAME" in
  "Write"|"Edit")
    if [ -z "$FILE_PATH" ]; then
      exit 0
    fi
    PARENT_DIR=$(dirname "$FILE_PATH" 2>/dev/null)
    if [ -n "$PARENT_DIR" ] && [ "$PARENT_DIR" != "." ] && [ ! -d "$PARENT_DIR" ] 2>/dev/null; then
      case "$PARENT_DIR" in
        *"/node_modules/"*|*"/.pnpm/"*) exit 0 ;;
        *)
          echo "{\"decision\":\"block\",\"reason\":\"Hallucination Gate: target directory '$PARENT_DIR' does not exist. Verify the correct path before writing.\\n\\n─── Recovery Options ───\\n1. Run 'ls' to list existing directories in the parent\\n2. Correct the file_path to use an existing directory\\n3. If the directory should be created, use 'mkdir -p' first\\n4. Then retry this write.\"}"
          exit 0
          ;;
      esac
    fi
    ;;
  "Bash")
    COMMAND=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.tool_input?.command||'')}catch(e){console.log('')}})" 2>/dev/null)
    if echo "$COMMAND" | grep -qE "pnpm (add|install)\s+\S+" 2>/dev/null; then
      PACKAGE=$(echo "$COMMAND" | sed 's/.*pnpm add //' | sed 's/ .*//' 2>/dev/null)
      if [ -n "$PACKAGE" ] && [ -f "package.json" ] && ! grep -q "\"$PACKAGE\"" package.json 2>/dev/null; then
        exit 0
      fi
    fi
    ;;
esac

exit 0
