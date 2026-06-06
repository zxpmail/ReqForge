---
name: changelog-template
description: Change log template. Records iteration history when Product Spec changes, outputs Product-Spec-CHANGELOG.md.
---

# Changelog Template

Template for recording Product Spec iteration history.

---

## File Name

`Product-Spec-CHANGELOG.md`

---

## Template Format

```markdown
# Changelog

## [v1.2] - YYYY-MM-DD
### Added
- <Added features or content>

### Changed
- <Changed features or content>

### Removed
- <Removed features or content>

---

## [v1.1] - YYYY-MM-DD
### Added
- <Added features or content>

---

## [v1.0] - YYYY-MM-DD
- Initial version
```

---

## Change Log Rules

- **Versioning**: Increment +0.1 per iteration (e.g., v1.0 → v1.1 → v1.2)
- **Date**: Use current date, format YYYY-MM-DD
- **Description**: Auto-generated from conversation, keep concise
- **Categories**: Separate Added / Changed / Removed. Omit categories with no entries
- **Actual changes only**: Don't record unchanged parts
- **Include location for UI changes**: When UI changes, specify where the control is placed

---

## Full Example

Reference changelog for a "Storyboard Generator" project:

```markdown
# Changelog

## [v1.2] - 2025-12-08
### Added
- Added "AI Optimize Description" button (at bottom of character settings area), auto-enhances character and scene descriptions
- Added storyboard description display, shows AI-generated scene descriptions below each frame

### Changed
- Left input panel proportion changed from 35% to 40%
- "Generate Storyboard" button style changed to more prominent primary color

---

## [v1.1] - 2025-12-05
### Added
- Added "Scene Settings" section (below character settings area), users can upload scene reference images
- Added "Ink Wash" art style option
- Added image understanding capability for analyzing user-uploaded reference images

### Changed
- Character card layout optimized, reference image preview size from 80px to 120px

### Removed
- Removed "Auto Pagination" feature (users prefer manual page control)

---

## [v1.0] - 2025-12-01
- Initial version
```

---

## Writing Guidelines

1. **Version numbers**: Start at v1.0, increment +0.1 per iteration, major rewrites can +1.0
2. **Date format**: Always YYYY-MM-DD for sorting and lookup
3. **Change descriptions**:
   - Start with action verbs (Added, Changed, Removed, Moved, Adjusted)
   - Be specific about what changed and to what
   - Include location for UI additions (e.g., "at bottom of character settings area")
   - Include before/after for numeric changes (e.g., "from 35% to 40%")
   - Include reason if relevant (e.g., "per user feedback")
4. **Categories**:
   - Added: Features, controls, capabilities that didn't exist before
   - Changed: Modified behavior, style, or parameters of existing features
   - Removed: Features that existed but were taken out
5. **Granularity**: One independent change per entry, don't bundle multiple changes
6. **AI capability changes**: Must be recorded separately when AI capabilities are added or removed
