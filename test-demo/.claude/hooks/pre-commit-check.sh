#!/bin/sh
# Hook: PreToolUse (Bash) if git commit*
# Auto-compile check before commit, block commit on failure
# Generic: auto-find project code directory containing tsconfig.json

TSCONFIG=$(find "$CLAUDE_PROJECT_DIR" -maxdepth 3 -name "tsconfig.json" -not -path "*/node_modules/*" -not -path "*/.next/*" 2>/dev/null | head -1)

if [ -z "$TSCONFIG" ]; then
  exit 0
fi

PROJECT_CODE=$(dirname "$TSCONFIG")
cd "$PROJECT_CODE"

TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
TSC_EXIT=$?

if [ $TSC_EXIT -ne 0 ]; then
  echo "Compilation check failed, commit blocked. Fix the following errors:" >&2
  echo "$TSC_OUTPUT" >&2
  exit 2
fi

exit 0
