#!/bin/bash
# Hook: UserPromptSubmit
# Detect correction/feedback signals in user prompt
# Keywords aligned with feedback-writer SKILL.md observation dimension #1 "user correction" signal definitions

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null)

if [ -z "$PROMPT" ]; then
  exit 0
fi

# Correction signal: user says AI was wrong, missed something, forgot something
# Dissatisfaction signal: user expresses frustration, doubt, repeated emphasis
# Improvement signal: user suggests what should be done, requests behavior change
if echo "$PROMPT" | grep -qE "that's not right|not what I meant|you messed up|you got it wrong|wrong|shouldn't|you missed|you forgot|change this|doesn't make sense|you misunderstood|that's not what I said|are you sure|why didn't|not working|didn't work|didn't execute|forgot again|keep saying|told you|reminded you|still not|always|every time|I told you not to|stop doing|don't|stop|never mind|not yet|wait"; then
  echo '{"additionalContext": "Detected user correction signal. After handling the request, dispatch feedback-observer sub-agent to record this feedback using the feedback-writer skill. Save feedback to the feedback/ directory, not the memory directory."}'
fi

exit 0
