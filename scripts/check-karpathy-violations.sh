#!/bin/sh
# check-karpathy-violations.sh
# Optional pre-commit helper: detects Karpathy-principle violations in staged diff.
# Designed to be called from pre-commit-check.sh or standalone.
# Exit 0 = no violation detected (or check skipped), exit 1 = violation found.

# --- Configuration ---
MAX_DIFF_LINES_PER_FILE=200  # single file diff > this triggers "Simplicity First" warning

# --- Check 1: Surgical Changes — format-only lines in diff ---
check_format_only_changes() {
  ADDED=$(git diff --cached --numstat 2>/dev/null | awk '{s+=$1}END{print s}')
  [ -z "$ADDED" ] && ADDED=0

  # Count lines that are only whitespace/indentation changes
  FORMAT_LINES=$(git diff --cached --ignore-all-space --ignore-blank-lines 2>/dev/null | grep '^[+-]' | grep -v '^[+-][+-][+-]' | wc -l)
  TOTAL_LINES=$(git diff --cached 2>/dev/null | grep '^[+-]' | grep -v '^[+-][+-][+-]' | wc -l)

  if [ "$TOTAL_LINES" -gt 0 ] 2>/dev/null; then
    FORMAT_RATIO=$(( (TOTAL_LINES - FORMAT_LINES) * 100 / TOTAL_LINES ))
  else
    FORMAT_RATIO=100
  fi

  # If >50% of diff is whitespace-only changes -> potential Surgical Changes violation
  if [ "$FORMAT_RATIO" -lt 50 ] 2>/dev/null; then
    FORMAT_DIFF=$(( TOTAL_LINES - FORMAT_LINES ))
    echo "⚠️  [Karpathy] Surgical Changes: $FORMAT_DIFF/$TOTAL_LINES lines are format-only (whitespace/indentation)."
    echo "   These should not be in the same commit as functional changes."
    return 1
  fi
  return 0
}

# --- Check 2: Simplicity First — oversized single-file diff ---
check_oversized_diff() {
  git diff --cached --numstat 2>/dev/null | while read -r added deleted file; do
    if [ "$added" -gt "$MAX_DIFF_LINES_PER_FILE" ] 2>/dev/null; then
      echo "⚠️  [Karpathy] Simplicity First: $file has $added added lines (>$MAX_DIFF_LINES_PER_FILE)."
      echo "   Consider splitting into smaller changes."
      return 1
    fi
  done
  return 0
}

# --- Check 3: Commit message patterns (if commit message is being prepared) ---
check_commit_msg_patterns() {
  COMMIT_MSG_FILE="$1"
  [ -z "$COMMIT_MSG_FILE" ] && return 0
  [ ! -f "$COMMIT_MSG_FILE" ] && return 0

  if grep -qiE '(顺便|also.+(fix|clean|refactor)|drive.by|while.+(at it|here))' "$COMMIT_MSG_FILE" 2>/dev/null; then
    echo "⚠️  [Karpathy] Surgical Changes: Commit message suggests scope creep ('also fix', 'drive-by')."
    echo "   Each commit should contain one logical change."
    return 1
  fi
  return 0
}

# --- Main ---
VIOLATIONS=0

if [ -d .git ] || git rev-parse --git-dir >/dev/null 2>&1; then
  check_format_only_changes; VIOLATIONS=$((VIOLATIONS + $?))
  check_oversized_diff; VIOLATIONS=$((VIOLATIONS + $?))
fi

check_commit_msg_patterns "$1"; VIOLATIONS=$((VIOLATIONS + $?))

if [ "$VIOLATIONS" -gt 0 ]; then
  echo ""
  echo "💡 Karpathy violations detected. These are advisory — not blocking."
  echo "   To skip: git commit --no-verify"
  echo "   To disable: remove check from pre-commit-check hook"
fi

exit 0  # Always exit 0 — advisory only, never block
