---
name: list-sort-order-wrong
description: List command displayed todos in insertion order instead of newest-first by creation time as specified
type: ux_feedback
occurrences: 1
---

# What happened

During dev-builder Phase 2 implementation, the AI implemented the list/todo display command which showed items in insertion order. The user reported: "排序方式不对, 应该按创建时间倒序排列" (the sort order is wrong, should be newest first by creation time). The Product-Spec.md clearly specifies that items should be sorted newest-first by creation time, but the implementation defaulted to insertion order instead.

# Why this matters

Sort order directly affects usability — a todo list that doesn't show the most recent items first makes it harder for users to track what was just added. This is a spec-compliance failure during implementation: the spec requirement was clear but the code didn't implement it.

# Suggested action

1. When implementing list/display features, always verify sort order against Product-Spec.md requirements before considering the task complete
2. Add a review checklist item: "Verify list sort order matches spec" to the dev-builder review phase
3. For database queries with creation timestamps, default to ORDER BY created_at DESC unless the spec explicitly says otherwise
