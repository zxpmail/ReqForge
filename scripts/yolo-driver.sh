#!/bin/sh
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

set -e
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

  # Run dev-builder in non-interactive mode
  # claude -p processes the message, runs tools, prints response, then exits.
  if ! claude -p "/dev-builder"; then
    echo "⚠️  claude exited with non-zero status at iteration $ITERATION"
  fi

  # Check handoff signal
  if [ -f ".forge/.yolo-continue" ]; then
    echo "→ ✓ Phase complete: $(cat ".forge/.yolo-continue" | head -c 200)"
    rm -f ".forge/.yolo-continue"

    # Clear context so next Phase starts fresh
    claude --clear 2>/dev/null || true

    echo "→ Continuing to next Phase..."
    echo ""
  else
    echo ""
    echo "═══════════════════════════════════════════"
    echo "  ✅ All phases complete ($ITERATION iteration(s))"
    echo "═══════════════════════════════════════════"
    break
  fi
done
