#!/usr/bin/env bash
# create-skill.sh — Scaffold a new Forge Skill directory
#
# Usage:
#   ./scripts/create-skill.sh bug-fixer                  # Full mode (all sections)
#   ./scripts/create-skill.sh bug-fixer --minimal        # Minimal mode (required sections only)
#
# Creates:
#   skills/<name>/SKILL.md       (from skill-template.md)
#   skills/<name>/templates/     (empty, for Skill-specific templates)

set -euo pipefail

MODE="full"
SKILL_NAME=""

for arg in "$@"; do
  case "$arg" in
    --minimal) MODE="minimal" ;;
    --full) MODE="full" ;;
    --help|-h)
      echo "Usage: $0 <skill-name> [--minimal|--full]"
      echo "  Scaffold a new Forge Skill directory."
      echo "  --minimal  Required sections only (Task, Dependency Check, First Principles, File Structure, Workflow, Initialization)"
      echo "  --full     All sections including recommended (default)"
      exit 0
      ;;
    *) SKILL_NAME="$arg" ;;
  esac
done

if [ -z "$SKILL_NAME" ]; then
  echo "Usage: $0 <skill-name> [--minimal|--full]"
  echo "  Skill name must be kebab-case (e.g., bug-fixer, dev-planner)"
  exit 1
fi

# Validate kebab-case
if ! echo "$SKILL_NAME" | grep -qE "^[a-z][a-z0-9-]*$"; then
  echo "ERROR: Skill name '$SKILL_NAME' is not kebab-case (expected: ^[a-z][a-z0-9-]*\$)"
  exit 1
fi

# Find the skills directory
SKILLS_DIR=""
for candidate in "core/skills" ".claude/skills" ".cursor/rules/skills" ".opencode/skills"; do
  if [ -d "$candidate" ]; then
    SKILLS_DIR="$candidate"
    break
  fi
done

if [ -z "$SKILLS_DIR" ]; then
  echo "ERROR: No skills directory found (tried core/skills, .claude/skills, .cursor/rules/skills, .opencode/skills)"
  exit 1
fi

TARGET_DIR="$SKILLS_DIR/$SKILL_NAME"

if [ -d "$TARGET_DIR" ]; then
  echo "ERROR: Skill directory already exists: $TARGET_DIR"
  exit 1
fi

# Create directory structure
mkdir -p "$TARGET_DIR"
mkdir -p "$TARGET_DIR/templates"

# Generate SKILL.md
cat > "$TARGET_DIR/SKILL.md" << SKILL_EOF
---
name: $SKILL_NAME
description: [When to use: specific trigger conditions. What it does. What it produces.]
---

[Task]
    [One sentence describing what this Skill does. If there are multiple modes, describe each.]

[Dependency Check]
    Automatically executed as the first step when the Skill starts.

    Required:
    - [prerequisite file] -> if missing, prompt to guide the user's next action
    - [system tool] -> if missing, the Agent installs autonomously

    Optional (degradation mode):
    - [optional dependency] -> if missing, mark degraded mode and continue working

[First Principles]
    **[Principle Name]**: [One-sentence explanation]
    **[Principle Name]**: [One-sentence explanation]
    **[Principle Name]**: [One-sentence explanation]
    **Web-First**: When external knowledge is involved, WebSearch to confirm before acting.

[Not For]
    - [Scenario where this Skill should NOT be used, and what to use instead]
    - [Another exclusion boundary]

[File Structure]
    \`\`\`
    $SKILL_NAME/
    └── SKILL.md
    \`\`\`

[Workflow]
    [Step 1: XXX]
        [Specific action]

    [Step 2: XXX]
        [Specific action]

    [Step N: XXX]
        [Specific action]

[Gotchas]
    **Common Pitfall 1**: [What goes wrong and what to do instead]
    **Common Pitfall 2**: [Another failure point accumulated from practice]

[Output Artifacts]
    - **[artifact name]** — [description]

[Initialization]
    Execute [Step 1: XXX]
SKILL_EOF

# If full mode, add recommended sections
if [ "$MODE" = "full" ]; then
  cat >> "$TARGET_DIR/SKILL.md" << FULL_EOF

[Output Style]
    **Tone**:
    - [Describe the speaking style of this Skill]

    **Principles**:
    - X [what NOT to do]
    - V [what TO do]

[DOMAIN Dimension Checklist]
    [Rename DOMAIN to match the skill's domain: Requirements / Review / Development / ...]
    [List all dimensions this Skill needs to focus on, split into must-have / recommended / optional]

[DOMAIN Strategy]
    [Rename DOMAIN to match the skill's domain]
    [Describe the execution methodology — how to do it]
FULL_EOF
fi

echo "✅ Created: $TARGET_DIR/"
echo "   SKILL.md ($MODE mode)"
echo "   templates/ (empty)"
echo ""
echo "Next steps:"
echo "  1. Fill in [placeholders] in $TARGET_DIR/SKILL.md"
echo "  2. Run: bash scripts/validate-skill.sh $TARGET_DIR"
echo "  3. Register in CLAUDE.md [Skill Dispatch] and [Available Skills]"
echo "  4. Run: pnpm sync"
