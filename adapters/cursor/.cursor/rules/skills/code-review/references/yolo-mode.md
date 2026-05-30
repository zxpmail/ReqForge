# YOLO Mode（code-review）

When `FORGE_MODE=yolo`, the review report is written to file instead of blocking:

**Step 5 (Output Review Report)** → Write `changes/review-report.md`:
Same structured report format. Append if file exists. Main Agent proceeds to fixes without waiting for user confirmation.
