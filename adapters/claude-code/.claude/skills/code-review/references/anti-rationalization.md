# Anti-Rationalization Checklist（code-review）

| Rationalization | Reality |
|---|---|
| "The change is small, just a quick glance" | Review is not based on change size; item-by-item comparison is the minimum bar |
| "I already reviewed this before" | Re-verify every time; code may have changed |
| "This feature was not modified, no need to review" | Unmodified code can still be broken by context changes |
| "Everything looks normal" | "Normal" is not evidence; every conclusion needs file_path:line_number |
| "Other features should not be affected" | "Should" equals not verified; regression scope must be explicit |
| "This code is standard" | Standard or not depends on whether it deviates from the Spec |
| "This project is small, there won't be security issues" | Small projects are more prone to security vulnerabilities |
| "I didn't write any SQL" | Security issues are not just SQL injection (XSS, path leakage, hardcoded credentials) |
| "I only changed styles, no need to compile" | Style files can also cause compilation errors |
| "The change is small, compilation will definitely pass" | Compilation is a gate; run it every time |
