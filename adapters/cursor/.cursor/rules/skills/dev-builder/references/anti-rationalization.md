# Anti-Rationalization Checklist

<!-- 从 SKILL.md 渐进披露拆分 -->

[Anti-Rationalization Checklist]

| Rationalization | Reality |
|---|---|
| "This is simple, just write it directly" | Plan Mode doesn't care about complexity, it's about discipline. Simple Phases also need Plan + TaskList |
| "Just changing one file" | Even one file requires impact assessment before proceeding |
| "User is waiting, write first" | 5 minutes of planning saves 30 minutes of rework |
| "I just tested this" | Every completion declaration requires fresh evidence run on the spot |
| "This change couldn't possibly break anything" | Changes that can't break anything are the most likely to break something. Verify. |
| "Compilation passes, so it's fine" | Compilation passing doesn't mean functionality works. Every step of the four-step process is needed. |
| "Small change, no review needed" | Every code change goes through review, regardless of size |
| "Just fixed a typo" | Typo fixes also get committed, compilation verification still required before commit |
| "Context isn't that full yet" | By the time it feels full, it's too late. Generate handoff early. |
| "I'll remember for next time" | You won't. Next invocation is a fresh context with zero memory. |
| "The user didn't ask for it" | Proactive handoff is part of Force Stop discipline. Generate it. |
| "Figure out details during implementation" | Plan stage requires thinking it through, otherwise implementation will go off track |
| "Similar approach to Task 1" | Write the specific approach, don't reference other Tasks |
| "Add necessary error handling" | Specify which errors and what approach to use |
| "It's a small fix, no need to record feedback" | Every fix, regardless of size, is a learning opportunity for the ratchet. Without recording, the same failure repeats. |
| "I'll record feedback later" | You won't. You're in a fix loop. Record it now or forget it. |
| "I'll just mock the database for local testing" | Mocks return what you expect, not what reality delivers. Use a real substitute (H2, SQLite, in-memory store) so local failures predict production failures. |
| "This service isn't available locally, I'll stub it" | A stub that always returns 200 teaches AI nothing. Write a real local implementation or script that exercises the same code path. |
| "Should be fine" | "Fine" needs evidence — run the verification command |
| "Looks correct" | "Correct" needs comparison between the Spec original text and code |
| "Likely passes" | Probability is not evidence — run the test and get results |
| "Just read the next Phase briefly" | Do not read it. One Phase per invocation. |
| "Since all files are here, might as well do Phase N+1 too" | No. User must call /dev-builder again. |
| "Saving time by continuing to the next Phase" | This is not saving time, it's skipping process. Stop. |
| "User said continue, so I'll start Phase N+1" | User said continue to confirm Phase N is complete. They did NOT say to start Phase N+1. Invoke /dev-builder is required. |
