#!/bin/sh
# Hook: SessionStart (startup)
# 1) Check FEEDBACK-INDEX.md for unprocessed feedback → mandatory evolution dispatch
# 2) Check project state (Product-Spec.md / DEV-PLAN.md / code) → inject state summary
# Both are hard triggers, not suggestions. The main Agent MUST process them.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
FEEDBACK_INDEX="$PROJECT_DIR/.claude/feedback/FEEDBACK-INDEX.md"

# --- Part 1: Evolution check ---
if [ -f "$FEEDBACK_INDEX" ]; then
  COUNT=0
  while IFS= read -r line; do
    case "$line" in
      "- ["*) COUNT=$((COUNT + 1)) ;;
    esac
  done < "$FEEDBACK_INDEX"

  if [ "$COUNT" -gt 0 ] 2>/dev/null; then
    echo '{"additionalContext": "Mandatory action: Project has '"${COUNT}"' feedback entries with scored data. You MUST dispatch evolution-runner sub-agent now to scan for evolution proposals. Do not skip this step."}'
  fi
fi

# --- Part 2: Project state injection ---
HAS_SPEC=0
HAS_PLAN=0
HAS_CODE=0

[ -f "$PROJECT_DIR/Product-Spec.md" ] && HAS_SPEC=1
[ -f "$PROJECT_DIR/DEV-PLAN.md" ] && HAS_PLAN=1
# Heuristic: check for typical source directories
for dir in src app lib packages; do
  [ -d "$PROJECT_DIR/$dir" ] && HAS_CODE=1 && break
done

STATE_MSG="Project state: Product-Spec"
if [ "$HAS_SPEC" -eq 0 ]; then
  STATE_MSG="$STATE_MSG ❌"
elif [ "$HAS_SPEC" -eq 1 ]; then
  STATE_MSG="$STATE_MSG ✅"
fi

STATE_MSG="$STATE_MSG, DEV-PLAN"
if [ "$HAS_PLAN" -eq 0 ]; then
  STATE_MSG="$STATE_MSG ❌"
elif [ "$HAS_PLAN" -eq 1 ]; then
  STATE_MSG="$STATE_MSG ✅"
fi

STATE_MSG="$STATE_MSG, Code"
if [ "$HAS_CODE" -eq 0 ]; then
  STATE_MSG="$STATE_MSG ❌"
elif [ "$HAS_CODE" -eq 1 ]; then
  STATE_MSG="$STATE_MSG ✅"
fi

STATE_MSG="$STATE_MSG."

# Route guidance
if [ "$HAS_SPEC" -eq 0 ]; then
  STATE_MSG="$STATE_MSG Next: describe your product idea to generate Product-Spec.md (use /product-spec-builder)."
elif [ "$HAS_PLAN" -eq 0 ]; then
  STATE_MSG="$STATE_MSG Next: generate DEV-PLAN.md from your spec (use /dev-planner)."
elif [ "$HAS_CODE" -eq 0 ]; then
  STATE_MSG="$STATE_MSG Next: start building (use /dev-builder)."
else
  STATE_MSG="$STATE_MSG In development — continue with current phase or /dev-builder."
fi

echo "{\"additionalContext\": \"${STATE_MSG}\"}"

exit 0
