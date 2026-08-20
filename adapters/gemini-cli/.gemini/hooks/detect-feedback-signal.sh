#!/bin/sh
# Hook: UserPromptSubmit (also defensive on PreToolUse)
# Detect correction/feedback signals in user prompt.
# Keywords aligned with feedback-writer SKILL.md observation dimension #1 "user correction" signal definitions.
# Always emit exactly one valid JSON line — never empty stdout — so callers
# (Claude Code / Cursor) don't parse an empty buffer as invalid JSON.
# When stdin is empty or has no .prompt field (e.g. PreToolUse payload), emit {"continue":true} fast.

INPUT=$(cat 2>/dev/null || true)
PROMPT=""
if [ -n "$INPUT" ]; then
  # On JSON failure, print the parse error to stderr (visible in the hook log /
  # to the decision-maker) while still emitting '' so the always-valid-JSON
  # stdout contract holds. The hook then fail-opens with a surfaced reason.
  PROMPT=$(printf '%s' "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);process.stdout.write(j.prompt||'')}catch(e){console.error('detect-feedback-signal: could not parse payload: '+e.message);process.stdout.write('')}})") || true
fi

if [ -z "$PROMPT" ]; then
  printf '%s\n' '{"continue":true}'
  exit 0
fi

# Correction signal: user says AI was wrong, missed something, forgot something
# Dissatisfaction signal: user expresses frustration, doubt, repeated emphasis
# Improvement signal: user suggests what should be done, requests behavior change
MSG='{"additionalContext": "Detected user correction signal. After handling the request, dispatch feedback-observer sub-agent to record this feedback using the feedback-writer skill. Save feedback to the feedback/ directory, not the memory directory."}'
case "$PROMPT" in
  *"that's not right"*|*"not what I meant"*|*"you messed up"*|*"you got it wrong"*|*"wrong"*) printf '%s\n' "$MSG" ;;
  *"shouldn't"*|*"you missed"*|*"you forgot"*|*"change this"*|*"doesn't make sense"*) printf '%s\n' "$MSG" ;;
  *"you misunderstood"*|*"that's not what I said"*|*"are you sure"*|*"why didn't"*|*"not working"*) printf '%s\n' "$MSG" ;;
  *"didn't work"*|*"didn't execute"*|*"forgot again"*|*"keep saying"*|*"told you"*|*"reminded you"*) printf '%s\n' "$MSG" ;;
  *"still not"*|*"always"*|*"every time"*|*"I told you not to"*|*"stop doing"*|*"don't"*|*"stop"*) printf '%s\n' "$MSG" ;;
  *"never mind"*|*"not yet"*|*"wait"*) printf '%s\n' "$MSG" ;;
  *) printf '%s\n' '{"continue":true}' ;;
esac

exit 0
