---
type: feedback
description: User reports one pass of product-spec-builder final validation is insufficient - typically needs 3 iterations to fix all issues
created: 2026-05-17
updated: 2026-05-17
occurrences: 1
graduated: false
source_skill: product-spec-builder
---

# product-spec-builder final validation single pass insufficient

**Problem**: After testing the new final validation step in product-spec-builder, the user observed that one pass of validation is usually insufficient to fix all issues. It typically takes at least 3 iterations to fully clean up the document.

**Context**: The user tested the product-spec-builder skill. The current implementation only performs one pass of final validation and repair before asking the user for confirmation.

**Lesson / Recommendation**: Change the final validation step from a single pass to a loop that allows up to 3 automatic validation-fix iterations before asking user confirmation. Add an iteration counter to prevent infinite loops.
