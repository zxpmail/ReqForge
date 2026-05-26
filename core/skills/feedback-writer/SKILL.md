<!-- forge: feedback-writer v1.0 -->
---
name: feedback-writer
description: Called by the feedback-observer sub-agent when the user corrects AI behavior, provides improvement feedback, or a Skill execution needs capability assessment recording.
version: 1.0.0
updated: 2026-05-26
requires: []
---

[Task]
    Receive context passed in by the main Agent, analyze whether there are feedback signals worth recording.
    Yes -> Write to ../../feedback/ and update the index.
    No -> Return "no new feedback".

[Not For]
    - Evolving rules from feedback patterns -> use /evolution-engine instead
    - Fixing the underlying bug that caused the feedback -> use /bug-fixer instead
    - General user conversation not related to AI behavior -> do not record, not feedback material

[Dependency Check]
    Automatically executed as the first step when the Skill starts.

    Required:
    - ../../feedback/ directory → If missing, create from templates/feedback-index-template.md
    - ../../feedback/FEEDBACK-INDEX.md → If missing, create from templates/feedback-index-template.md
    - Signal context from feedback-observer → correction, failure, or assessment data

[First Principles]
    **Signal Over Noise**: Only record when a signal is actually observed. Better to miss than to over-record. User frustration at the tool/environment itself is not AI capability feedback.
    **Dedup Before Write**: Always check FEEDBACK-INDEX.md for existing entries before creating new ones. Merge, don't duplicate. The same failure mode recorded 5 times inflates occurrence counts without adding information.
    **Scored Feedback**: Every feedback entry must have Precision/Coverage/Efficiency/Satisfaction scores. Score-less feedback can't trigger evolution thresholds. Always fill all 4 score fields.
    **Context Completeness**: A feedback entry without context (what the AI did, what the correct behavior is, which Skill was in use) is noise — it can't drive evolution.

[Failure Classification]
    Every feedback entry SHOULD set `failure_class` in frontmatter (enables evolution-engine routing — see evolution-engine [Failure-Class Routing]):

    | Value | When to use | Evolution should target |
    |-------|-------------|-------------------------|
    | `skill-defect` | Skill text is missing, wrong, or outdated; Agent followed Skill but guidance failed | `SKILL.md`, `references/`, rule graduation |
    | `execution-lapse` | Skill already states the correct behavior; Agent skipped steps, ignored HARD-GATE, or hooks did not fire | `forge-bootstrap.md`, hooks, `CLAUDE.md` dispatch — **not** duplicate prose across Skills |
    | `unset` | Cannot tell yet — add one sentence in body explaining ambiguity | evolution-engine infers; prefer `unset` over guessing |

    **How to decide**:
    - User says "the Skill says X but you didn't do X" → `execution-lapse`
    - User says "the Skill never mentioned X" or "workflow is wrong" → `skill-defect`
    - Same failure after Skill was updated and user confirmed → often `execution-lapse` (bootstrap/hook)

    **Skill TDD input for evolution**: In the body, include a short **RED** line: "Without rule Y, Agent did Z" — feeds evolution-engine RED observation field.

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

[File Structure]
    ```
    feedback-writer/
    └── SKILL.md                           # Main Skill definition (this file)
    ```

[Output Style]
    **Tone**: Auditor recording an incident — factual, structured, contextual. Every entry must be actionable by the evolution-engine.
    **Principles**:
    - V Every entry includes Precision/Coverage/Efficiency/Satisfaction scores
    - V Every entry captures what the AI did, what was correct, and which Skill was in use
    - V Check FEEDBACK-INDEX.md before writing — merge, don't duplicate
    - X No entries for user frustration with the tool/environment itself

[Output Artifacts]
    - **../../feedback/\<topic-name\>.md** — feedback topic file
    - **../../feedback/FEEDBACK-INDEX.md** — feedback index (append or update)

[Routing Rules]
    Project-related -> Write to ../../feedback/
    Not project-related -> Do not write, let the AI client handle via default behavior
    No duplicate writing — each piece of information goes into exactly one system

[Workflow] 1. Read ../../feedback/FEEDBACK-INDEX.md (if it does not exist, create from templates/feedback-index-template.md) 2. Check if a feedback topic already exists (dedup) - Exists -> Update content + occurrences +1 + update updated - Does not exist -> Create new file + update index 3. Filename in kebab-case, brief topic description 4. Write using templates/feedback-topic-template.md format 5. Update FEEDBACK-INDEX.md

[File Specification]
    Storage location: ../../feedback/
    Index file: ../../feedback/FEEDBACK-INDEX.md
    Index template: ../../feedback/templates/feedback-index-template.md
    Content template: ../../feedback/templates/feedback-topic-template.md
    Drift map (optional, ≥3 repeats before evolution): ../../feedback/templates/drift-map-template.md

[Return Format]
    Return to the main Agent after execution: - New record: "Recorded 1 feedback: [title] ([filename])" - Updated existing: "Updated [filename], occurrences: N -> N+1" - No signal: "No new feedback"

[Initialization]
    Step 1: Execute [Dependency Check]
    Step 2: Execute [Workflow]
