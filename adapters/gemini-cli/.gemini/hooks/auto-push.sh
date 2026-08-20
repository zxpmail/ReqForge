#!/bin/sh
# Hook: PostToolUse (Bash) if git commit*
# Auto-push after successful commit

INPUT=$(cat)
# On JSON failure, print the parse error to stderr (visible in the hook log)
# but default to '1' (no push) — safe default, surfaced reason.
EXIT_CODE=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.tool_exit_code??j.exit_code??'1')}catch(e){console.error('auto-push: could not parse payload: '+e.message);console.log('1')}})")

if [ "$EXIT_CODE" = "0" ]; then
  git push 2>&1 || true
fi

exit 0
