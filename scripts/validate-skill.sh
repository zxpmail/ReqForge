#!/usr/bin/env bash
# validate-skill.sh — Validate Forge SKILL.md files against the Skill Spec
#
# Usage:
#   ./scripts/validate-skill.sh core/skills/bug-fixer         # Validate one skill
#   ./scripts/validate-skill.sh core/skills/                  # Validate all skills
#   ./scripts/validate-skill.sh --strict core/skills/bug-fixer  # Strict mode (warnings become errors)
#
# Exit codes:
#   0 — All checks pass
#   1 — One or more errors found

set -euo pipefail

STRICT=false
TARGETS=()

for arg in "$@"; do
  case "$arg" in
    --strict) STRICT=true ;;
    *) TARGETS+=("$arg") ;;
  esac
done

if [ ${#TARGETS[@]} -eq 0 ]; then
  echo "Usage: $0 [--strict] <skill-dir-or-parent>"
  echo "  Validate SKILL.md files against the Forge Skill Spec."
  exit 1
fi

# --- Required sections ---
REQUIRED_SECTIONS=("Task" "Dependency Check" "First Principles" "File Structure" "Workflow" "Initialization")
RECOMMENDED_SECTIONS=("Output Style" "Gotchas" "Output Artifacts")

# --- Counters ---
TOTAL=0
PASS=0
FAIL=0
WARN=0

# --- Helper functions ---
error() { echo "  ERROR: $1"; FAIL=$((FAIL + 1)); }
warn()  { echo "  WARN:  $1"; WARN=$((WARN + 1)); }
pass()  { PASS=$((PASS + 1)); }

validate_skill() {
  local dir="$1"
  local skill_md="$dir/SKILL.md"

  TOTAL=$((TOTAL + 1))
  echo ""
  echo "=== Validating: $dir ==="

  # 1. SKILL.md exists
  if [ ! -f "$skill_md" ]; then
    error "SKILL.md not found in $dir"
    return
  fi
  pass

  local content
  content=$(cat "$skill_md")

  # 2. Frontmatter exists
  if ! echo "$content" | head -5 | grep -q "^---"; then
    error "Missing frontmatter (--- delimiters)"
  else
    pass
  fi

  # 3. Frontmatter: name field
  if ! echo "$content" | grep -q "^name:"; then
    error "Missing 'name' in frontmatter"
  else
    local name_val
    name_val=$(echo "$content" | grep "^name:" | head -1 | sed 's/^name:[[:space:]]*//')
    if [ -z "$name_val" ]; then
      error "Frontmatter 'name' is empty"
    else
      pass
    fi
  fi

  # 4. Frontmatter: description field
  if ! echo "$content" | grep -q "^description:"; then
    error "Missing 'description' in frontmatter"
  else
    local desc_val
    desc_val=$(echo "$content" | grep "^description:" | head -1 | sed 's/^description:[[:space:]]*//')
    if [ -z "$desc_val" ]; then
      error "Frontmatter 'description' is empty"
    elif echo "$desc_val" | grep -qi "helps with\|assists with\|supports"; then
      warn "Description is vague — use decidable triggers (e.g., 'Used when user reports error/bug')"
      if [ "$STRICT" = true ]; then error "Strict: vague description"; fi
    else
      pass
    fi
  fi

  # 5. Directory name is kebab-case
  local dirname
  dirname=$(basename "$dir")
  if ! echo "$dirname" | grep -qE "^[a-z][a-z0-9-]*$"; then
    error "Directory name '$dirname' is not kebab-case (expected: ^[a-z][a-z0-9-]*\$)"
  else
    pass
  fi

  # 6. Required sections (fuzzy match — section name as substring)
  for section in "${REQUIRED_SECTIONS[@]}"; do
    if ! echo "$content" | grep -q "\[${section}"; then
      error "Missing required section [${section}]"
    else
      pass
    fi
  done

  # 7. Recommended sections (fuzzy match)
  for section in "${RECOMMENDED_SECTIONS[@]}"; do
    if ! echo "$content" | grep -q "\[${section}"; then
      warn "Missing recommended section [${section}]"
      if [ "$STRICT" = true ]; then error "Strict: missing recommended section [${section}]"; fi
    else
      pass
    fi
  done

  # 8. Gotchas / Anti-Rationalization section has at least 2 entries (if present)
  if echo "$content" | grep -q "\[Gotchas\]\|\[Anti-Rationalization"; then
    local gotchas_count
    gotchas_count=$(echo "$content" | sed -n '/\[Gotchas\]\|\[Anti-Rationalization/,/\[.*\]/p' | grep -cE "^\*\*|^    \*\*" || true)
    if [ "$gotchas_count" -lt 2 ]; then
      warn "Gotchas/Anti-Rationalization section has fewer than 2 entries (found: $gotchas_count)"
      if [ "$STRICT" = true ] && [ "$gotchas_count" -lt 2 ]; then
        error "Strict: Gotchas must have at least 2 entries"
      fi
    else
      pass
    fi
  fi

  # 9. File size check (warn if > 500 lines)
  local line_count
  line_count=$(wc -l < "$skill_md")
  if [ "$line_count" -gt 500 ]; then
    warn "SKILL.md is $line_count lines (recommended: under 500)"
    if [ "$STRICT" = true ] && [ "$line_count" -gt 600 ]; then
      error "Strict: SKILL.md exceeds 600 lines"
    fi
  else
    pass
  fi

  # 10. No TODO/FIXME placeholders
  local todo_count
  todo_count=$(echo "$content" | grep -ci "TODO\|FIXME\|HACK\|XXX" || true)
  if [ "$todo_count" -gt 0 ]; then
    warn "Found $todo_count TODO/FIXME/HACK/XXX markers — Skills should be complete"
    if [ "$STRICT" = true ]; then error "Strict: $todo_count TODO/FIXME markers found"; fi
  fi
}

# --- Collect skill directories ---
SKILL_DIRS=()
for target in "${TARGETS[@]}"; do
  if [ -f "$target/SKILL.md" ]; then
    SKILL_DIRS+=("$target")
  elif [ -d "$target" ]; then
    for sub in "$target"/*/; do
      if [ -f "${sub}SKILL.md" ]; then
        SKILL_DIRS+=("${sub%/}")
      fi
    done
  else
    echo "WARNING: $target is not a valid directory or skill path"
  fi
done

if [ ${#SKILL_DIRS[@]} -eq 0 ]; then
  echo "No SKILL.md files found in specified paths."
  exit 1
fi

# --- Run validation ---
echo "Forge Skill Spec Validator"
echo "Strict mode: $STRICT"
echo "Skills to validate: ${#SKILL_DIRS[@]}"

for dir in "${SKILL_DIRS[@]}"; do
  validate_skill "$dir"
done

# --- Summary ---
echo ""
echo "========================================"
echo "Results: $TOTAL skills validated"
echo "  PASS: $PASS"
echo "  WARN: $WARN"
echo "  FAIL: $FAIL"
echo "========================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
elif [ "$STRICT" = true ] && [ "$WARN" -gt 0 ]; then
  echo "Strict mode: warnings treated as errors"
  exit 1
else
  exit 0
fi
