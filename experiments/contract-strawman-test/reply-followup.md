@jugeni Follow-up: implemented `type: "negative"` for C1 contracts in forge-verify.

When `type: "negative"`, pattern matching means FAIL (evidence contains something it shouldn't), opposite of `type: "regex"` where matching means PASS. Same zero-cost deterministic check, inverted semantics.

For the write-invalidation scenario:

```
REQ-2  type="regex"    write.?invalidat           → PASS (keyword exists)
NEG-2  type="negative" (TTL.*(simpler|sufficient|instead)|NOT IMPLEMENTED) → FAIL (negation detected)
```

C1 sees 2/3 pass (REQ-1, REQ-2 pass; NEG-2 fails) → UNCLEAR → L3 human review. No C2 API call needed.

Also fixed a pre-existing hole: C1 UNCLEAR used to silently pass when there were no C2 LLM requirements. Now C1 conflict propagates to L3 UNCLEAR without C2.

Experiment and code: `ReqForge/experiments/contract-strawman-test/` `ReqForge/scripts/forge-verify/content-verify.mjs`
