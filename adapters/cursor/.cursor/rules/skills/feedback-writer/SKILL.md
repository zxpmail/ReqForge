<!-- forge: feedback-writer v1.0 -->
---
name: feedback-writer
description: Called by the feedback-observer sub-agent when the user corrects AI behavior, provides improvement feedback, or a Skill execution needs capability assessment recording.
---

[Task]
    Receive context passed in by the main Agent, analyze whether there are feedback signals worth recording.
    Yes -> Write to ../../feedback/ and update the index.
    No -> Return "no new feedback".

[Observation Dimensions]
    The following 5 types of signals trigger feedback recording:

        1. **User Correction**
           The user corrects the AI's behavior.
           Signal: "that's not right", "don't do that", "you got it wrong", the user manually edits AI output.
           -> Tag the corrected Skill and the specific behavior.

        2. **Uncovered Scenario**
           The Skill encountered a situation its guidance did not cover.
           Signal: The AI improvises a solution on the spot, skips steps, or is unsure how to proceed.
           -> Tag which Skill is missing what.

        3. **Repetitive Operation**
           The user repeatedly performs the same type of operation with no Skill support.
           Signal: More than 3 consecutive natural-language requests for the same type of thing.
           -> Tag the operation pattern.

        4. **Quality Issues**
           The same type of code quality problem keeps showing up.
           Signal: Multiple consecutive Phases show type errors, naming inconsistencies, CSS side effects, etc.
           -> Tag the problem type and frequency.

        5. **Skill Capability Assessment**
           After Skill execution completes, score across 4 dimensions (1-5).
           Two sources: auto-inferred from failure (see below) or manual after completion.

           **Precision** — Was the Skill guidance accurate?
           5: Zero corrections / 4: 1-2 minor tweaks / 3: 3+ corrections / 2: Redo direction / 1: User gave up

           **Coverage** — Did the Skill cover what was actually needed?
           5: Followed guidance completely / 4: 1 case improvised / 3: 2-3 on-the-spot decisions / 2: Heavy improvisation / 1: Severe mismatch

           **Efficiency** — Was the flow smooth?
           5: Passed first try / 4: 1 clarification / 3: 2-3 rounds of back-and-forth / 2: Many rounds / 1: Deadlocked

           **Satisfaction** — Did the user accept the output?
           5: Expressed satisfaction unprompted / 4: No negative feedback / 3: Requested changes / 2: Demanded major rework / 1: Rejected output entirely

           **Anti-inflation**: Had corrections -> Precision <= 3 / Improvised -> Coverage <= 3 / 2+ rounds -> Efficiency <= 3 / Had change requests -> Satisfaction <= 3

           **Auto-scoring on failure**: When feedback-observer dispatches with a failure trigger_reason, it provides pre-inferred scores based on the failure type mapping in feedback-observer.md [Auto-Scoring on Failure]. Write these scores directly into the feedback file — do not re-evaluate or inflate them. These scores are the minimum signal the evolution engine needs to function. Without them, feedback accumulates but never triggers proposals.

        **Judgment Standard**:
        Only record when a signal is actually observed. Better to miss than to over-record.

[Gotchas]
    **Missing context**: Recording "the user corrected the AI" without capturing what the AI did, what the correct behavior should be, and which Skill was in use. A feedback entry without context is noise — it can't drive evolution.
    **Duplicate entries**: The same failure mode recorded 5 times because no one checked FEEDBACK-INDEX.md first. Always check existing entries before creating new ones — merge, don't duplicate.
    **False positives**: User frustration does not always equal bad AI behavior. Frustration at the tool/environment/language itself should not be recorded as AI capability feedback. Discriminate signal from noise.
    **Skipping scoring**: Writing qualitative feedback without Precision/Coverage/Efficiency/Satisfaction scores. Score-less feedback can't trigger evolution thresholds. Always fill all 4 score fields.

[Output Artifacts]
    - **../../feedback/\<topic-name\>.md** — feedback topic file
    - **../../feedback/FEEDBACK-INDEX.md** — feedback index (append or update)

[Routing Rules]
    Project-related -> Write to ../../feedback/
    Not project-related -> Do not write, let the AI client handle via default behavior
    No duplicate writing — each piece of information goes into exactly one system

[Write Flow] 1. Read ../../feedback/FEEDBACK-INDEX.md (if it does not exist, create from templates/feedback-index-template.md) 2. Check if a feedback topic already exists (dedup) - Exists -> Update content + occurrences +1 + update updated - Does not exist -> Create new file + update index 3. Filename in kebab-case, brief topic description 4. Write using templates/feedback-topic-template.md format 5. Update FEEDBACK-INDEX.md

[File Specification]
    Storage location: ../../feedback/
    Index file: ../../feedback/FEEDBACK-INDEX.md
    Index template: ../../feedback/templates/feedback-index-template.md
    Content template: ../../feedback/templates/feedback-topic-template.md

[Return Format]
    Return to the main Agent after execution: - New record: "Recorded 1 feedback: [title] ([filename])" - Updated existing: "Updated [filename], occurrences: N -> N+1" - No signal: "No new feedback"
