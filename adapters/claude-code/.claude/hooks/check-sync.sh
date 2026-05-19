#!/bin/sh
# Hook: PostToolUse (after any tool call)
# Check if core/ files were modified but adapters not synced
# Only fires when core/ exists (ReqForge self-development context)
# Returns additionalContext when divergence is detected

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

if [ ! -f "$PROJECT_DIR/core/skills/dev-builder/SKILL.md" ]; then
  exit 0
fi

CORE_HASH=$(cd "$PROJECT_DIR" && md5sum core/skills/dev-builder/SKILL.md | cut -d' ' -f1)
ADAPTER_HASH=$(cd "$PROJECT_DIR" && md5sum adapters/claude-code/.claude/skills/dev-builder/SKILL.md | cut -d' ' -f1)

if [ "$CORE_HASH" != "$ADAPTER_HASH" ]; then
  echo '{"additionalContext": "SynCheck: core/skills/ differs from adapters/ — run pnpm sync before committing."}'
fi

exit 0
