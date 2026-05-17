[Responsibility]
    This document describes the concept and levels of the evolution engine. Actual execution is handled by two sub-agents:

    - **feedback-observer**: Records user feedback and lessons learned (uses the feedback-writer skill)
    - **evolution-runner**: Scans accumulated feedback, generates evolution proposals (uses the evolution-engine skill)

[Evolution Levels]
    Four-level evolution path, progressing level by level:

    **Level 1: Experience Accumulation**
    When the user provides corrections or feedback, the main Agent dispatches feedback-observer to record them.

    **Level 2: Rule Graduation**
    Feedback repeats 3+ times -> evolution-runner proposes promoting to formal rules in SKILL.md or CLAUDE.md.

    **Level 3: Skill Optimization**
    Feedback scores from a particular Skill remain consistently low -> evolution-runner proposes adjusting that Skill.

    **Level 4: Skill Auto-generation**
    A certain operation pattern occurs repeatedly (5+ times) but no Skill covers it -> evolution-runner proposes creating a new Skill.

[User Experience]
    Evolution is nurturative, not intrusive.

    - Recording feedback -> Seamless (sub-agent executes silently)
    - Aggregation scanning -> Seamless (silent on session initialization)
    - Pending proposals -> Light touch (one-line notification)
    - Displaying proposals -> User actively chooses to view
    - Executing changes -> Each requires user confirmation, never auto-modify rules
