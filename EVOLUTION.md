[Responsibility]
    This document describes the concept and levels of the evolution engine. Actual execution is handled by two sub-agents:

    - **feedback-observer**: Records user feedback and lessons learned (uses the feedback-writer skill)
    - **evolution-runner**: Scans accumulated feedback, generates evolution proposals (uses the evolution-engine skill)

[Relationship with Memory System]
    The evolution engine and three-tier memory system are complementary:

    - **feedback** (`.claude/feedback/`) = "what went wrong and how to improve" → fuel for the evolution engine, drives rule improvements
    - **memory** (`memory/`) = "what we know and decided" → cross-session context preservation, does not directly trigger evolution

    The evolution engine primarily scans feedback, but evolution-runner can cross-reference memory:
    - Repeated Known Pitfalls in `memory/project-memory.md` may trigger Level 2 rule graduation
    - Superseded decisions in `memory/decisions-log.md` may hint at Skill adjustments needed (Level 3)
    - This cross-referencing is optional enhancement, not a mandatory scan path

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
