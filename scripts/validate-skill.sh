#!/usr/bin/env bash
# validate-skill.sh — Validate Forge SKILL.md files against the Skill Spec
#
# Usage:
#   ./scripts/validate-skill.sh core/skills/bug-fixer         # Validate one skill
#   ./scripts/validate-skill.sh core/skills/                  # Validate all skills
#   ./scripts/validate-skill.sh --strict core/skills/bug-fixer  # Strict mode (warnings become errors)
#   ./scripts/validate-skill.sh --score core/skills/bug-fixer   # Score mode (16-item quality rubric)
#
# Exit codes:
#   0 — All checks pass
#   1 — One or more errors found

set -euo pipefail

STRICT=false
SCORE_MODE=false
TARGETS=()

for arg in "$@"; do
  case "$arg" in
    --strict) STRICT=true ;;
    --score) SCORE_MODE=true ;;
    *) TARGETS+=("$arg") ;;
  esac
done

if [ ${#TARGETS[@]} -eq 0 ]; then
  echo "Usage: $0 [--strict] [--score] <skill-dir-or-parent>"
  echo "  Validate SKILL.md files against the Forge Skill Spec."
  echo "  --score: 16-item quality rubric (33 pts, ship threshold ≥ 24)"
  exit 1
fi

# --- Required sections ---
REQUIRED_SECTIONS=("Task" "Dependency Check" "First Principles" "Not For" "File Structure" "Workflow" "Initialization")
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

  # 2. skill.json exists
  local skill_json="$dir/skill.json"
  if [ ! -f "$skill_json" ]; then
    error "skill.json not found in $dir"
  else
    # Validate required fields using available runtime
    local validation_passed=true
    if command -v node &>/dev/null && node -e "process.exit(0)" 2>/dev/null; then
      if ! node -e "
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('$skill_json', 'utf-8'));
const required = ['name','version','description'];
const missing = required.filter(k => !(k in d));
if (missing.length) {
  console.error('missing required fields: ' + missing.join(', '));
  process.exit(1);
}
if (!d.triggers || !['auto','manual','command'].every(k => k in d.triggers)) {
  console.error('triggers missing auto/manual/command');
  process.exit(1);
}
console.log('OK');
" 2>&1; then
        validation_passed=false
      fi
    elif command -v python3 &>/dev/null && python3 --version >/dev/null 2>&1; then
      if ! python3 -c "
import json, sys
with open('$skill_json') as f:
    d = json.load(f)
required = ['name', 'version', 'description']
missing = [k for k in required if k not in d]
if missing:
    print('missing required fields: ' + ', '.join(missing))
    sys.exit(1)
if not d.get('triggers') or not all(k in d['triggers'] for k in ['auto', 'manual', 'command']):
    print('triggers missing auto/manual/command')
    sys.exit(1)
print('OK')
" 2>&1; then
        validation_passed=false
      fi
    else
      # Fallback: basic grep-based check
      if ! grep -q '"name"' "$skill_json" || ! grep -q '"version"' "$skill_json"; then
        validation_passed=false
      fi
    fi
    if [ "$validation_passed" = true ]; then
      pass
    else
      error "skill.json validation failed"
    fi
  fi

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

  # 4b. Frontmatter: version field
  if ! echo "$content" | grep -q "^version:"; then
    warn "Missing 'version' in frontmatter (recommended: semver like 1.0.0)"
    if [ "$STRICT" = true ]; then error "Strict: missing version in frontmatter"; fi
  else
    local ver_val
    ver_val=$(echo "$content" | grep "^version:" | head -1 | sed 's/^version:[[:space:]]*//')
    if ! echo "$ver_val" | grep -qE "^[0-9]+\.[0-9]+\.[0-9]+$"; then
      warn "version '$ver_val' is not valid semver (expected: major.minor.patch)"
    else
      pass
    fi
  fi

  # 4c. Frontmatter: updated field
  if ! echo "$content" | grep -q "^updated:"; then
    warn "Missing 'updated' in frontmatter (recommended: ISO-8601 date like 2026-05-26)"
  else
    local upd_val
    upd_val=$(echo "$content" | grep "^updated:" | head -1 | sed 's/^updated:[[:space:]]*//')
    if ! echo "$upd_val" | grep -qE "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"; then
      warn "updated '$upd_val' is not valid ISO-8601 date (expected: YYYY-MM-DD)"
    else
      pass
    fi
  fi

  # 4d. Frontmatter: requires field
  if ! echo "$content" | grep -q "^requires:"; then
    warn "Missing 'requires' in frontmatter (recommended: [] or list of skill names)"
  else
    pass
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

  # 9b. Progressive disclosure check (warn if > 300 lines without references/)
  if [ "$line_count" -gt 300 ]; then
    if ! echo "$content" | grep -q "references/"; then
      warn "SKILL.md is $line_count lines with no references/ directory — extract detailed workflows into references/ for progressive disclosure"
    fi
  fi

  # 10. No TODO/FIXME placeholders (skip lines inside [Quality Rubric] table)
  local todo_count
  todo_count=$(echo "$content" | grep -vi "quality rubric\|scoring\|ship threshold\|zero TBD\|markers found" | grep -ci "TODO\|FIXME\|HACK\|XXX" || true)
  if [ "$todo_count" -gt 0 ]; then
    warn "Found $todo_count TODO/FIXME/HACK/XXX markers — Skills should be complete"
    if [ "$STRICT" = true ]; then error "Strict: $todo_count TODO/FIXME markers found"; fi
  fi
}

# --- Score a single skill (16-item, 32-point rubric) ---
score_skill() {
  local dir="$1"
  local skill_md="$dir/SKILL.md"
  local total_score=0
  local critical_fail=false

  echo ""
  echo "=== Scoring: $dir ==="

  if [ ! -f "$skill_md" ]; then
    echo "  SKIP: SKILL.md not found"
    return
  fi

  local content
  content=$(cat "$skill_md")

  # 1. Decidable triggers (CRITICAL)
  local s1=0
  local desc_val
  desc_val=$(echo "$content" | grep "^description:" | head -1 | sed 's/^description:[[:space:]]*//')
  if echo "$content" | grep -q "\[Not For\]\|\[Boundaries\]"; then
    s1=2  # when-to-use AND when-not-to-use
  elif [ -n "$desc_val" ] && ! echo "$desc_val" | grep -qi "helps with\|assists with\|supports"; then
    s1=1  # when-to-use only, but decidable
  fi
  total_score=$((total_score + s1))
  [ "$s1" -eq 0 ] && critical_fail=true
  echo "  1. Decidable triggers: $s1/2 $([ $s1 -eq 0 ] && echo 'CRITICAL')"

  # 2. Principle depth
  local s2=0
  local principle_count
  principle_count=$(echo "$content" | sed -n '/\[First Principles\]/,/\[.*\]/p' | grep -cE "^\s+\*\*" || true)
  if [ "$principle_count" -ge 3 ]; then
    s2=2
  elif [ "$principle_count" -ge 1 ]; then
    s2=1
  fi
  total_score=$((total_score + s2))
  echo "  2. Principle depth: $s2/2 ($principle_count principles found)"

  # 3. Gotchas from practice
  local s3=0
  local gotchas_count
  gotchas_count=$(echo "$content" | sed -n '/\[Gotchas\]\|\[Anti-Rationalization/,/\[.*\]/p' | grep -cE "^\*\*|^    \*\*" || true)
  if [ "$gotchas_count" -ge 3 ]; then
    s3=2
  elif [ "$gotchas_count" -ge 1 ]; then
    s3=1
  fi
  total_score=$((total_score + s3))
  echo "  3. Gotchas from practice: $s3/2 ($gotchas_count entries)"

  # 4. Workflow executability (CRITICAL)
  local s4=0
  local workflow_steps
  # Count steps/phases/modes inside any [Workflow...] section
  workflow_steps=$(echo "$content" | sed -n '/\[Workflow/,/^\[/p' | grep -ciE "Step [0-9]|Stage [0-9]|\[.*Phase\]|\[.*Mode\]|Step [0-9]:|Stage [0-9]:" || true)
  # Fallback: count Step N patterns in entire file if no [Workflow] section found
  if [ "$workflow_steps" -eq 0 ]; then
    workflow_steps=$(echo "$content" | grep -ciE "Step [0-9]:|Stage [0-9]:" || true)
  fi
  if [ "$workflow_steps" -ge 3 ]; then
    s4=2
  elif [ "$workflow_steps" -ge 1 ]; then
    s4=1
  fi
  total_score=$((total_score + s4))
  [ "$s4" -eq 0 ] && critical_fail=true
  echo "  4. Workflow executability: $s4/2 ($workflow_steps steps) $([ $s4 -eq 0 ] && echo 'CRITICAL')"

  # 5. Dependency completeness
  local s5=0
  if echo "$content" | grep -q "\[Dependency Check\]"; then
    if echo "$content" | sed -n '/\[Dependency Check\]/,/\[.*\]/p' | grep -qi "optional\|degraded\|failure"; then
      s5=2
    else
      s5=1
    fi
  fi
  total_score=$((total_score + s5))
  echo "  5. Dependency completeness: $s5/2"

  # 6. Output Style defined
  local s6=0
  if echo "$content" | grep -q "\[Output Style\]"; then
    if echo "$content" | sed -n '/\[Output Style\]/,/\[.*\]/p' | grep -qi "tone\|principle\|typical"; then
      s6=2
    else
      s6=1
    fi
  fi
  total_score=$((total_score + s6))
  echo "  6. Output Style defined: $s6/2"

  # 7. Domain dimensions
  local s7=0
  if echo "$content" | grep -qE "\[.*Dimension\]|\[.*Checklist\]"; then
    if echo "$content" | grep -qiE "must.have|recommended|optional"; then
      s7=2
    else
      s7=1
    fi
  fi
  total_score=$((total_score + s7))
  echo "  7. Domain dimensions: $s7/2"

  # 8. Anti-rationalization
  local s8=0
  local anti_rat_count
  anti_rat_count=$(echo "$content" | sed -n '/\[Anti-Rationalization/,/\[.*\]/p' | grep -cE "^\s+- |^\s+\* |^\s+\| \"" || true)
  # Also count Gotchas entries as anti-rationalization data
  local gotchas_as_anti
  gotchas_as_anti=$(echo "$content" | sed -n '/\[Gotchas\]/,/\[.*\]/p' | grep -cE "^\*\*|^    \*\*" || true)
  if [ "$gotchas_as_anti" -gt "$anti_rat_count" ]; then
    anti_rat_count=$gotchas_as_anti
  fi
  if [ "$anti_rat_count" -ge 3 ]; then
    s8=2
  elif [ "$anti_rat_count" -ge 1 ]; then
    s8=1
  fi
  total_score=$((total_score + s8))
  echo "  8. Anti-rationalization: $s8/2 ($anti_rat_count entries)"

  # 9. No placeholders (CRITICAL)
  local s9=0
  local todo_count
  todo_count=$(echo "$content" | grep -vi "quality rubric\|scoring\|ship threshold\|zero TBD\|markers found" | grep -ci "TODO\|FIXME\|HACK" || true)
  if [ "$todo_count" -eq 0 ]; then
    s9=2
  fi
  total_score=$((total_score + s9))
  [ "$s9" -eq 0 ] && critical_fail=true
  echo "  9. No placeholders: $s9/2 ($todo_count markers) $([ $s9 -eq 0 ] && echo 'CRITICAL')"

  # 10. Cross-reference consistency
  local s10=0
  local xref_count=0
  echo "$content" | grep -qiE "\[Workflow[^]]*\].*\[[^]]*[Ss]trategy\]|\[[^]]*[Ss]trategy\].*\[Workflow[^]]*\]" && xref_count=$((xref_count + 1))
  echo "$content" | grep -qiE "references/|see \[.*\]|reference \[|execute \[" && xref_count=$((xref_count + 1))
  if [ "$xref_count" -ge 2 ]; then
    s10=2
  elif [ "$xref_count" -ge 1 ]; then
    s10=1
  fi
  total_score=$((total_score + s10))
  echo "  10. Cross-reference consistency: $s10/2"

  # 11. Boundary clarity (CRITICAL)
  local s11=0
  if echo "$content" | grep -q "\[Not For\]\|\[Boundaries\]"; then
    s11=2
  elif echo "$desc_val" | grep -qi "not for\|do not use\|don't use"; then
    s11=1
  fi
  total_score=$((total_score + s11))
  [ "$s11" -eq 0 ] && critical_fail=true
  echo "  11. Boundary clarity: $s11/2 $([ $s11 -eq 0 ] && echo 'CRITICAL')"

  # 12. Template alignment (sections + frontmatter metadata)
  local s12=2  # Default full — only penalize if clearly divergent
  local required_present=0
  for section in "Task" "Dependency Check" "First Principles" "File Structure" "Workflow" "Initialization"; do
    echo "$content" | grep -q "\[${section}" && required_present=$((required_present + 1))
  done
  if [ "$required_present" -lt 4 ]; then
    s12=0
  elif [ "$required_present" -lt 6 ]; then
    s12=1
  fi
  # Frontmatter metadata bonus: +1 if version + updated both present
  local meta_bonus=0
  if echo "$content" | grep -q "^version:" && echo "$content" | grep -q "^updated:"; then
    meta_bonus=1
  fi
  s12=$((s12 + meta_bonus))
  total_score=$((total_score + s12))
  echo "  12. Template alignment: $s12/3 ($required_present/6 sections$([ $meta_bonus -eq 1 ] && echo ', +1 metadata') )"

  # 13. File size discipline
  local s13=0
  local line_count
  line_count=$(wc -l < "$skill_md")
  if [ "$line_count" -le 500 ]; then
    s13=2
  elif [ "$line_count" -le 600 ]; then
    s13=1
  fi
  total_score=$((total_score + s13))
  echo "  13. File size discipline: $s13/2 ($line_count lines)"

  # 14. Naming convention
  local s14=0
  local dirname
  dirname=$(basename "$dir")
  if echo "$dirname" | grep -qE "^[a-z][a-z0-9-]*$"; then
    s14=2
  fi
  total_score=$((total_score + s14))
  echo "  14. Naming convention: $s14/2 ($dirname)"

  # 15. Output artifacts listed
  local s15=0
  if echo "$content" | grep -q "\[Output Artifacts\]"; then
    s15=2
  elif echo "$content" | grep -qi "output\|artifact\|deliverable"; then
    s15=1
  fi
  total_score=$((total_score + s15))
  echo "  15. Output artifacts listed: $s15/2"

  # 16. Initialization wired
  local s16=0
  if echo "$content" | grep -q "\[Initialization\]"; then
    if echo "$content" | sed -n '/\[Initialization\]/,//p' | grep -qiE "execute|step|run"; then
      s16=2
    else
      s16=1
    fi
  fi
  total_score=$((total_score + s16))
  echo "  16. Initialization wired: $s16/2"

  # Summary
  local status="PASS"
  if [ "$total_score" -lt 24 ] || [ "$critical_fail" = true ]; then
    status="FAIL"
  fi
  echo "  ----------------------------------------"
  echo "  TOTAL: $total_score/33  $status"
  if [ "$critical_fail" = true ]; then
    echo "  ⚠ Critical item scored 0 — must fix before shipping"
  fi
  if [ "$total_score" -lt 24 ]; then
    echo "  ⚠ Below ship threshold (24)"
  fi

  SCORE_TOTAL=$((SCORE_TOTAL + total_score))
  SCORE_COUNT=$((SCORE_COUNT + 1))
  if [ "$status" = "FAIL" ]; then
    SCORE_FAIL=$((SCORE_FAIL + 1))
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

# --- Run validation or scoring ---
if [ "$SCORE_MODE" = true ]; then
  SCORE_TOTAL=0
  SCORE_COUNT=0
  SCORE_FAIL=0

  echo "Forge Skill Quality Rubric (16 items, 33 pts)"
  echo "Ship threshold: ≥ 24 with no critical item at 0"
  echo "Skills to score: ${#SKILL_DIRS[@]}"

  for dir in "${SKILL_DIRS[@]}"; do
    score_skill "$dir"
  done

  echo ""
  echo "========================================"
  echo "Results: $SCORE_COUNT skills scored"
  echo "  Average: $((SCORE_TOTAL / SCORE_COUNT))/33"
  echo "  PASS: $((SCORE_COUNT - SCORE_FAIL))"
  echo "  FAIL: $SCORE_FAIL"
  echo "========================================"

  if [ "$SCORE_FAIL" -gt 0 ]; then
    exit 1
  else
    exit 0
  fi
else
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
fi
