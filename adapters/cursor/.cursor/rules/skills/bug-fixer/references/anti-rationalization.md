# Anti-Rationalization Checklist（bug-fixer）

| Rationalization | Reality |
|---|---|
| "I've seen this error before, this is how I fixed it last time" | Same error can have different root causes; collect evidence first, then decide |
| "No need to reproduce, it's obviously a problem with XX" | "Obviously" is not evidence; verify the hypothesis first, then change |
| "Let me just try changing it and see what happens" | Locate the root cause first; blindly attempting introduces new problems |
| "I'll just fix this while I'm at it" | One problem at a time |
| "These two bugs are related" | Even if related, verify step by step, one at a time |
| "I only changed one line, it won't affect anything else" | One line change can impact the entire module; regression verification is not optional |
| "It's fixed, take a look" | A fix must have evidence (compilation passes + bug no longer reproduces + regression passes) |
| "This bug is too simple, no need for the four-stage process" | When you think it's simple is exactly when you are most likely to miss critical information |
| "It's an environment issue, no need to investigate" | Environment issues are bugs too; use the same systematic approach |
