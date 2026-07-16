#!/bin/sh
# Hook: PreToolUse (Bash) if git commit*
# Light commit gate — intentionally narrower than forge-verify:
#   - Compile: TypeScript only (tsconfig → tsc --noEmit). No tsconfig → skip.
#     Full language-aware compile = pnpm forge-verify / Phase completion.
#   - README: ### vX.Y.Z headings must be newest-first (same as .bat).
# YOLO mode: write build error log instead of blocking
#   Priority: project .forge/config > global ~/.forge/config > env var FORGE_MODE

is_yolo_mode() {
  [ -f "$CLAUDE_PROJECT_DIR/.forge/config" ] && grep -qi "^FORGE_MODE=yolo" "$CLAUDE_PROJECT_DIR/.forge/config" 2>/dev/null && return 0
  [ -f "$HOME/.forge/config" ] && grep -qi "^FORGE_MODE=yolo" "$HOME/.forge/config" 2>/dev/null && return 0
  [ "$FORGE_MODE" = "yolo" ] && return 0
  return 1
}

TSCONFIG=$(find "$CLAUDE_PROJECT_DIR" -maxdepth 3 -name "tsconfig.json" -not -path "*/node_modules/*" -not -path "*/.next/*" 2>/dev/null | head -1)

if [ -n "$TSCONFIG" ]; then
  PROJECT_CODE=$(dirname "$TSCONFIG")
  cd "$PROJECT_CODE"

  TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
  TSC_EXIT=$?

  if [ $TSC_EXIT -ne 0 ]; then
    if is_yolo_mode; then
      mkdir -p "$CLAUDE_PROJECT_DIR/.claude/.yolo-pending"
      echo "$TSC_OUTPUT" > "$CLAUDE_PROJECT_DIR/.claude/.yolo-pending/build-error.log"
      echo "[yolo] Build errors logged to .claude/.yolo-pending/build-error.log" >&2
    else
      echo "Compilation check failed, commit blocked. Fix the following errors:" >&2
      echo "$TSC_OUTPUT" >&2
      exit 2
    fi
  fi
fi

# Karpathy violation check (advisory, non-blocking)
if [ -f "$CLAUDE_PROJECT_DIR/scripts/check-karpathy-violations.sh" ]; then
  . "$CLAUDE_PROJECT_DIR/scripts/check-karpathy-violations.sh" 2>/dev/null || true
fi

# README version order check (blocking) — prefer shared script; portable fallback
README_SCRIPT="$CLAUDE_PROJECT_DIR/scripts/hooks/readme-version-order.mjs"
if [ -f "$README_SCRIPT" ]; then
  node "$README_SCRIPT" || exit 2
else
  README_ORDER_FAIL=0
  for README_FILE in "$CLAUDE_PROJECT_DIR/README.md" "$CLAUDE_PROJECT_DIR/README.zh-CN.md"; do
    if [ ! -f "$README_FILE" ]; then
      continue
    fi
    VERSIONS=$(grep -E '^### v[0-9]+\.[0-9]+\.[0-9]+' "$README_FILE" 2>/dev/null \
      | sed -E 's/^### v([0-9]+\.[0-9]+\.[0-9]+).*/\1/' | head -10)
    if [ -z "$VERSIONS" ]; then
      continue
    fi
    PREV=""
    for V in $VERSIONS; do
      if [ -n "$PREV" ]; then
        HIGHER=$(printf '%s\n' "$PREV" "$V" | sort -Vr | head -1)
        if [ "$HIGHER" != "$PREV" ]; then
          echo "ERROR: README version order wrong in $(basename "$README_FILE"): $V comes before $PREV (should be newest first)" >&2
          README_ORDER_FAIL=1
        fi
      fi
      PREV="$V"
    done
  done
  if [ $README_ORDER_FAIL -ne 0 ]; then
    exit 2
  fi
fi

exit 0
