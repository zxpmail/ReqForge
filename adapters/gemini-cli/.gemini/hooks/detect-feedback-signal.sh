#!/bin/sh
# Hook: UserPromptSubmit
# Detect correction/feedback signals in user prompt
# Keywords aligned with feedback-writer SKILL.md observation dimension #1 "user correction" signal definitions

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.prompt||'')}catch(e){console.log('')}})" 2>/dev/null)

if [ -z "$PROMPT" ]; then
  exit 0
fi

# Correction signal: user says AI was wrong, missed something, forgot something
# Dissatisfaction signal: user expresses frustration, doubt, repeated emphasis
# Improvement signal: user suggests what should be done, requests behavior change
case "$PROMPT" in
  *"that's not right"*|*"not what I meant"*|*"you messed up"*|*"you got it wrong"*|*"wrong"*)
    echo '{"additionalContext": "Detected user correction signal. After handling the request, dispatch feedback-observer sub-agent to record this feedback using the feedback-writer skill. Save feedback to the feedback/ directory, not the memory directory."}'
    ;;
  *"shouldn't"*|*"you missed"*|*"you forgot"*|*"change this"*|*"doesn't make sense"*)
    echo '{"additionalContext": "Detected user correction signal. After handling the request, dispatch feedback-observer sub-agent to record this feedback using the feedback-writer skill. Save feedback to the feedback/ directory, not the memory directory."}'
    ;;
  *"you misunderstood"*|*"that's not what I said"*|*"are you sure"*|*"why didn't"*|*"not working"*)
    echo '{"additionalContext": "Detected user correction signal. After handling the request, dispatch feedback-observer sub-agent to record this feedback using the feedback-writer skill. Save feedback to the feedback/ directory, not the memory directory."}'
    ;;
  *"didn't work"*|*"didn't execute"*|*"forgot again"*|*"keep saying"*|*"told you"*|*"reminded you"*)
    echo '{"additionalContext": "Detected user correction signal. After handling the request, dispatch feedback-observer sub-agent to record this feedback using the feedback-writer skill. Save feedback to the feedback/ directory, not the memory directory."}'
    ;;
  *"still not"*|*"always"*|*"every time"*|*"I told you not to"*|*"stop doing"*|*"don't"*|*"stop"*)
    echo '{"additionalContext": "Detected user correction signal. After handling the request, dispatch feedback-observer sub-agent to record this feedback using the feedback-writer skill. Save feedback to the feedback/ directory, not the memory directory."}'
    ;;
  *"never mind"*|*"not yet"*|*"wait"*)
    echo '{"additionalContext": "Detected user correction signal. After handling the request, dispatch feedback-observer sub-agent to record this feedback using the feedback-writer skill. Save feedback to the feedback/ directory, not the memory directory."}'
    ;;
esac

exit 0
