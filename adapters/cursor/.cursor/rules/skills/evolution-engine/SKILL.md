<!-- forge: evolution-engine v1.0 -->
---
name: evolution-engine
description: Auto-triggers on session init, or manually triggered when the user says "check if there are any rules to upgrade" or "check evolution suggestions". Called by the evolution-runner sub-agent.
---

[Task]
    Scan the accumulated data in ../../feedback/ and identify three types of evolution signals:
    1. Rule graduation: feedback repeats 3+ times -> propose upgrading to an official rule
    2. Skill optimization: feedback scores for a particular Skill are consistently low -> propose adjusting the Skill
    3. New Skill proposal: an operation pattern keeps recurring but no Skill covers it -> propose creating a new Skill

    Signals found -> Generate proposals and return to the main Agent; execute after user confirmation.
    No signals -> Return "no evolution suggestions".

[Output Artifacts]
    - **Evolution proposals** (screen output) — three types: Rule Graduation / Skill Optimization / New Skill. Each proposal includes confirm/skip options.

[Scan Flow]

    Step 1: Scan Graduation Candidates
        Read ../../feedback/FEEDBACK-INDEX.md to locate all feedback files
        Read the frontmatter of each file
        Filter: occurrences >= 3 and graduated == false and skipped != true
        Determine graduation target:
        - source_skill is clear -> graduate to the corresponding SKILL.md
        - Involves multiple Skills or is global -> graduate to the main control file [General Rules]

    Step 2: Check Skill Optimization Signals
        Scan scores fields in feedback/, grouped by source_skill
        Trigger conditions (any one met):
        - A Skill has the same dimension scored <= 2 for 3 consecutive times
        - A Skill's average score on some dimension over the last 5 entries <= 3
        - Total feedback occurrences for a Skill >= 5

    Step 3: Check New Skill Signals
        Filter: occurrences >= 5 and not covered by any existing Skill
        -> Mark as "New Skill Candidate"

    Step 4: Generate Proposals
        Signals found -> Generate structured proposals (see [Proposal Format])
        No signals -> Return "no evolution suggestions"

[Proposal Format]
    "**Evolution Suggestions** (N total)

     **Rule Graduation** (X items)
     1. [feedback title]: occurred [N] times (source: [source_skill])
        Suggest writing to: [target file] at [target location]
        Summary: [one sentence]
        -- Confirm / Skip

     **Skill Optimization** (X items)
     1. [Skill name]: [N] related feedback entries accumulated
        Optimization suggestion: [specific suggestion]
        -- Confirm / Skip

     **New Skill Proposal** (X items)
     1. [operation pattern description]: occurred [N] times
        -- Confirm Create / Skip"

[Post-Confirmation Execution]
    User confirms or skips each item:
    - Rule graduation -> Write feedback content into the target SKILL.md or main control file, mark graduated: true
    - Skill optimization -> Modify the corresponding SKILL.md
    - New Skill -> Invoke skill-builder to create
    - Skip -> Mark skipped: true, do not propose again

[YOLO Mode]
    When FORGE_MODE=yolo, proposals are written to file instead of waiting for confirm/skip:

    **Proposal Output** -> Write `changes/proposals.md`:
        All three proposal types in structured format.
        Skip per-item confirm/skip. Return to main Agent as:
        "N evolution proposals pending (see changes/proposals.md)"

[Return Format]
    Return to the main Agent:
    - Proposals exist: "N evolution suggestions pending" + full proposal content
    - No proposals: "No evolution suggestions"
