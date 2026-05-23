#!/bin/sh
# Post-Tool-Use hook: check if project code was modified but memory files were not updated
# Triggers after file edits in the project code directory
# If code changed but task-history.md wasn't touched in the same session, output a reminder

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MEMORY_DIR="$PROJECT_DIR/memory"
TASK_HISTORY="$MEMORY_DIR/task-history.md"

# Skip if memory system not initialized yet
if [ ! -d "$MEMORY_DIR" ]; then
  exit 0
fi

# Check if task-history.md exists and was modified recently (within last 60 seconds)
if [ -f "$TASK_HISTORY" ]; then
  now=$(date +%s)
  file_mod=$(stat -c %Y "$TASK_HISTORY" 2>/dev/null || stat -f %m "$TASK_HISTORY" 2>/dev/null || echo 0)
  age=$((now - file_mod))
  if [ "$age" -lt 60 ]; then
    # Memory was updated recently, all good
    exit 0
  fi
fi

# If we get here, memory exists but wasn't updated recently
echo '{"decision": "approve", "reason": "Reminder: project memory exists but task-history.md was not updated after code changes. Consider appending to memory/task-history.md and checking if decisions-log.md or project-memory.md need updates."}'
exit 0
