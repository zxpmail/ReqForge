# Hook: UserPromptSubmit
# Detect correction/feedback signals in user prompt via PowerShell
$c = [Console]::In.ReadToEnd()
if ($c) {
    try {
        $p = ($c | ConvertFrom-Json).prompt
        if ($p -match "that's not right|not what I meant|you messed up|you got it wrong|wrong|shouldn't|you missed|you forgot|change this|doesn't make sense|you misunderstood|that's not what I said|are you sure|why didn't|not working|didn't work|didn't execute|forgot again|keep saying|told you|reminded you|still not|always|every time|I told you not to|stop doing|don't|stop|never mind|not yet|wait") {
            Write-Host '{"additionalContext": "Detected user correction signal. Dispatch feedback-observer after handling."}'
        }
    } catch {}
}
