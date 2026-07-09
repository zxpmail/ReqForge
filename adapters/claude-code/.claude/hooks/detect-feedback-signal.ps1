# Hook: UserPromptSubmit (also defensive on PreToolUse)
# Detect correction/feedback signals in user prompt via PowerShell.
# Always emit exactly one valid JSON line on stdout so callers (Claude Code / Cursor)
# never parse an empty/BOM-polluted buffer as invalid JSON.
$ErrorActionPreference = 'SilentlyContinue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
$matched = $false
$c = [Console]::In.ReadToEnd()
if ($c) {
    try {
        $p = ($c | ConvertFrom-Json).prompt
        if ($p) {
            if ($p -match "that's not right|not what I meant|you messed up|you got it wrong|wrong|shouldn't|you missed|you forgot|change this|doesn't make sense|you misunderstood|that's not what I said|are you sure|why didn't|not working|didn't work|didn't execute|forgot again|keep saying|told you|reminded you|still not|always|every time|I told you not to|stop doing|don't|stop|never mind|not yet|wait") {
                [Console]::Out.WriteLine('{"additionalContext": "Detected user correction signal. After handling the request, dispatch feedback-observer sub-agent to record this feedback using the feedback-writer skill. Save feedback to the feedback/ directory, not the memory directory."}')
                $matched = $true
            }
        }
    } catch {}
}
if (-not $matched) {
    [Console]::Out.WriteLine('{"continue":true}')
}
exit 0
