#!/bin/sh
# Post-Tool-Use hook: compact task-history.md when it exceeds 30 entries
# Archives old entries to keep context lean and prevent context rot
# Runs silently — only outputs when compaction actually happens

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
TASK_HISTORY="$PROJECT_DIR/memory/task-history.md"

# Skip if not initialized yet
if [ ! -f "$TASK_HISTORY" ]; then
  exit 0
fi

# Count data rows (lines between the second table's header and the comment)
ENTRY_COUNT=$(awk '/^| [0-9]/ {count++} END {print count+0}' "$TASK_HISTORY")

if [ "$ENTRY_COUNT" -le 30 ]; then
  exit 0
fi

# Calculate how many to archive
EXCESS=$((ENTRY_COUNT - 25))  # keep 25, archive the rest

# Split the file: keep header + last 25 entries, move older to archive section
ARCHIVE_FILE="$PROJECT_DIR/memory/task-history-archive.md"

# Extract lines to archive (oldest entries, after the format section)
HEADER_LINES=$(grep -n '^|---' "$TASK_HISTORY" | head -2 | tail -1 | cut -d: -f1)
TOTAL_LINES=$(wc -l < "$TASK_HISTORY")
FIRST_DATA_LINE=$((HEADER_LINES + 2))
ARCHIVE_END=$((FIRST_DATA_LINE + EXCESS - 1))

# Append archived entries to archive file
mkdir -p "$PROJECT_DIR/memory"
{
  echo ""
  echo "### Archived on $(date +%Y-%m-%d)"
  echo ""
  sed -n "${FIRST_DATA_LINE},${ARCHIVE_END}p" "$TASK_HISTORY"
} >> "$ARCHIVE_FILE"

# Remove archived lines from task-history
sed -i "${FIRST_DATA_LINE},${ARCHIVE_END}d" "$TASK_HISTORY"

# Add a note at the top of the archive section about the compaction
# (silent — no user-facing output, just file modification)
exit 0