#!/bin/sh
# Hook: SessionStart (startup)
# 0) Inject forge-bootstrap iron laws (always)
# 1) Check FEEDBACK-INDEX.md for unprocessed feedback → mandatory evolution dispatch
# 2) Check project state (Product-Spec.md / DEV-PLAN.md / code) → inject state summary
# All parts are hard triggers, not suggestions. The main Agent MUST process them.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
HOOK_DIR="$(CDPATH= cd "$(dirname "$0")" && pwd)"

# --- Resolve forge-bootstrap.md (framework repo, installed adapters, or hook-relative) ---
find_bootstrap_file() {
  for candidate in \
    "$PROJECT_DIR/.claude/templates/forge-bootstrap.md" \
    "$PROJECT_DIR/.cursor/rules/templates/forge-bootstrap.md" \
    "$PROJECT_DIR/.opencode/templates/forge-bootstrap.md" \
    "$PROJECT_DIR/core/templates/forge-bootstrap.md" \
    "$HOOK_DIR/../templates/forge-bootstrap.md"; do
    if [ -f "$candidate" ]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

# --- Resolve FEEDBACK-INDEX.md (Claude / Cursor / OpenCode / framework repo) ---
find_feedback_index() {
  for candidate in \
    "$PROJECT_DIR/.claude/feedback/FEEDBACK-INDEX.md" \
    "$PROJECT_DIR/.cursor/rules/feedback/FEEDBACK-INDEX.md" \
    "$PROJECT_DIR/.opencode/feedback/FEEDBACK-INDEX.md" \
    "$PROJECT_DIR/core/feedback/FEEDBACK-INDEX.md" \
    "$HOOK_DIR/../feedback/FEEDBACK-INDEX.md"; do
    if [ -f "$candidate" ]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

emit_json_context() {
  # $1 = prefix label, $2 = body text
  node -e "
    const prefix = process.argv[1];
    const body = process.argv[2];
    const msg = prefix + body;
    console.log(JSON.stringify({ additionalContext: msg }));
  " "$1" "$2"
}

# --- Part 0: Bootstrap iron laws (always first) ---
BOOTSTRAP_FILE="$(find_bootstrap_file 2>/dev/null || true)"
if [ -n "$BOOTSTRAP_FILE" ]; then
  emit_json_context "Session Iron Laws (MANDATORY - forge-bootstrap): " "$(tr '\n' ' ' < "$BOOTSTRAP_FILE" | sed 's/  */ /g')"
else
  emit_json_context "Session Iron Laws (MANDATORY): " \
    "Skill before action. No /dev-builder or /dev-planner until Product-Spec.md saved and user confirmed. No app code under src|app|lib|packages until then. No /dev-builder without DEV-PLAN.md. Use /bug-fixer with repro + failing test. Hook blocks are hard stops. One Phase per /dev-builder invocation."
fi

# --- Part 1: Evolution check ---
FEEDBACK_INDEX="$(find_feedback_index 2>/dev/null || true)"
if [ -n "$FEEDBACK_INDEX" ]; then
  COUNT=0
  while IFS= read -r line; do
    case "$line" in
      "- ["*) COUNT=$((COUNT + 1)) ;;
    esac
  done < "$FEEDBACK_INDEX"

  if [ "$COUNT" -gt 0 ] 2>/dev/null; then
    emit_json_context "" \
      "Mandatory action: Project has ${COUNT} feedback entries with scored data. You MUST dispatch evolution-runner sub-agent now to scan for evolution proposals. Do not skip this step."
  fi
fi

# --- Part 2: Project state injection ---
HAS_SPEC=0
HAS_PLAN=0
HAS_CODE=0
HAS_DEVMAP=0

[ -f "$PROJECT_DIR/Product-Spec.md" ] && HAS_SPEC=1
[ -f "$PROJECT_DIR/DEV-PLAN.md" ] && HAS_PLAN=1
for dir in src app lib packages; do
  [ -d "$PROJECT_DIR/$dir" ] && HAS_CODE=1 && break
done
[ -f "$PROJECT_DIR/.forge/dev-map.md" ] && HAS_DEVMAP=1

STATE_MSG="Project state: Product-Spec"
if [ "$HAS_SPEC" -eq 0 ]; then
  STATE_MSG="$STATE_MSG ❌"
else
  STATE_MSG="$STATE_MSG ✅"
fi

STATE_MSG="$STATE_MSG, DEV-PLAN"
if [ "$HAS_PLAN" -eq 0 ]; then
  STATE_MSG="$STATE_MSG ❌"
else
  STATE_MSG="$STATE_MSG ✅"
fi

STATE_MSG="$STATE_MSG, Code"
if [ "$HAS_CODE" -eq 0 ]; then
  STATE_MSG="$STATE_MSG ❌"
else
  STATE_MSG="$STATE_MSG ✅"
fi

STATE_MSG="$STATE_MSG, dev-map"
if [ "$HAS_DEVMAP" -eq 0 ]; then
  STATE_MSG="$STATE_MSG ❌"
else
  STATE_MSG="$STATE_MSG ✅"
fi

STATE_MSG="$STATE_MSG."

if [ "$HAS_SPEC" -eq 0 ]; then
  STATE_MSG="$STATE_MSG Next: describe your product idea to generate Product-Spec.md (use /product-spec-builder). HARD-GATE: no /dev-builder or app code until Spec confirmed."
elif [ "$HAS_PLAN" -eq 0 ]; then
  STATE_MSG="$STATE_MSG Next: generate DEV-PLAN.md from your spec (use /dev-planner). HARD-GATE: no /dev-builder until plan exists."
elif [ "$HAS_CODE" -eq 0 ]; then
  STATE_MSG="$STATE_MSG Next: start building (use /dev-builder)."
else
  STATE_MSG="$STATE_MSG In development — continue with current phase or /dev-builder."
fi

emit_json_context "" "$STATE_MSG"

exit 0
