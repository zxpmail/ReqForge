# Anti-Rationalization Checklist（design-maker）

| Rationalization | Reality |
|---|---|
| "Skip the planning phase, just start designing" | Planning determines which pages and variants are needed. Without planning, you'll miss states and have to redo pages. |
| "No need for a component system, just make pages directly" | The same button on 10 pages = 10 updates when the button changes. Build components first, always. |
| "State variants are overkill for this simple page" | Developers need empty, loading, error states to code properly. Default-only = developers guess the rest. |
| "Screenshot verification is unnecessary, it looks fine" | "Looks fine" is not a verification criterion. Screenshots catch visual inconsistencies that code review misses. |
| "I've designed similar UIs before, I know what works" | Every product has unique layout and content requirements. Reference the Spec, not your memory. |
| "The Design Brief is clear enough, no need to re-read it during design" | Design choices drift during execution. Re-read the Brief before each page to stay aligned. |
