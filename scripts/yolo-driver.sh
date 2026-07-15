#!/usr/bin/env bash
# yolo-driver.sh — YOLO forward driver: loop /dev-builder across all Phases
#
# Each iteration:
#   1. Run `claude -p "/dev-builder"` (non-interactive, exits after Phase completes)
#   2. Check .forge/.yolo-continue — if present, re-invoke for next Phase
#   3. If absent, all Phases are done (or user intervened)
#
# The dev-builder agent writes .yolo-continue at Phase completion (YOLO mode only).
# This file is the ONLY machine-readable handoff — no prose-drift risk.
#
# Usage:
#   scripts/yolo-driver.sh [project-dir]       # Default: current directory
#
# Prerequisites:
#   - Product-Spec.md + DEV-PLAN.md at project root
#   - .forge/config with FORGE_MODE=yolo
#   - claude CLI available in PATH
#
# Design: https://github.com/zxpmail/ReqForge (dogfood-05-tracking.md)

# pipefail so pipeline exit reflects claude failure (not jq/tee); no -e (we handle errors in loop)
set -o pipefail
PROJECT="${1:-$(pwd)}"
cd "$PROJECT" || { echo "❌ Cannot access: $PROJECT"; exit 1; }

# === Preflight checks ===
check_file() {
  if [ ! -f "$1" ]; then
    echo "❌ Missing: $1"
    exit 1
  fi
}
check_file "Product-Spec.md"
check_file "DEV-PLAN.md"
check_file ".forge/config"

if ! grep -qi "^FORGE_MODE=yolo" ".forge/config"; then
  echo "❌ .forge/config must contain FORGE_MODE=yolo"
  exit 1
fi

if ! command -v claude >/dev/null 2>&1; then
  echo "❌ claude CLI not found in PATH"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  YOLO Driver — multi-Phase /dev-builder"
echo "  Project: $PROJECT"
echo "═══════════════════════════════════════════"
echo ""

ITERATION=0
while true; do
  ITERATION=$((ITERATION + 1))

  # Show current Phase from scope
  if [ -f ".forge/active-scope.json" ]; then
    CURRENT=$(cat ".forge/active-scope.json" 2>/dev/null)
    echo "▶ [$ITERATION] $(echo "$CURRENT" | head -c 120)"
  else
    echo "▶ [$ITERATION] Starting Phase 1"
  fi

  # Run dev-builder in non-interactive YOLO mode.
  # --dangerously-skip-permissions: skip all approval prompts (in -p mode, default
  #   permission mode hangs waiting for stdin → "black screen no output")
  # --output-format stream-json --include-partial-messages: stream tokens live
  #   (default text format buffers everything until exit → black screen for minutes)
  # jq filter extracts assistant text for readability; raw JSONL saved to log file.
  # < /dev/null closes stdin to prevent any prompt from hanging.
  if command -v jq >/dev/null 2>&1; then
    claude -p "/dev-builder" \
      --dangerously-skip-permissions \
      --output-format stream-json --verbose --include-partial-messages \
      < /dev/null 2>&1 | \
      tee ".forge/yolo-run-${ITERATION}.jsonl" | \
      jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="text") | .text'
    EXIT_CODE=${PIPESTATUS[0]}
  else
    echo "⚠️  jq not installed — raw stream-json will be shown. Install jq for readable output."
    claude -p "/dev-builder" \
      --dangerously-skip-permissions \
      --output-format stream-json --include-partial-messages \
      < /dev/null 2>&1 | \
      tee ".forge/yolo-run-${ITERATION}.jsonl"
    EXIT_CODE=${PIPESTATUS[0]}
  fi

  if [ "$EXIT_CODE" -ne 0 ]; then
    echo "⚠️  claude exited with non-zero status ($EXIT_CODE) at iteration $ITERATION"
  fi

  # Check handoff signal
  if [ -f ".forge/.yolo-continue" ]; then
    echo "→ ✓ Phase complete: $(cat ".forge/.yolo-continue" | head -c 200)"
    rm -f ".forge/.yolo-continue"

    # Each `claude -p` is a fresh session (no --resume/--continue), so context
    # is already clean — no explicit clear needed.
    echo "→ Continuing to next Phase..."
    echo ""
  elif [ "$EXIT_CODE" -eq 0 ]; then
    # Clean exit + no handoff = genuine completion (last Phase done)
    echo ""
    echo "═══════════════════════════════════════════"
    echo "  ✅ All phases complete ($ITERATION iteration(s))"
    echo "═══════════════════════════════════════════"
    break
  else
    # Non-zero exit + no handoff = claude errored (API limit, auth, etc.)
    echo ""
    echo "═══════════════════════════════════════════"
    echo "  ❌ claude errored at iteration $ITERATION (exit $EXIT_CODE)"
    echo "  No .yolo-continue handoff written."
    echo "  Check .forge/yolo-run-${ITERATION}.jsonl for details."
    echo "  529 / 429 = rate limit (retry); other codes = check auth/config."
    echo "═══════════════════════════════════════════"
    exit 1
  fi
done
