// Independent runner — asserts the write-invalidation SIDE EFFECT.
// Observes the referent (cache after write), not the vocabulary.
// Usage: node verify-write-invalidation.js <impl.js>
// exit 0 = PASS (write invalidated cache), 1 = FAIL (stale survived), 2 = setup error
const path = require("path");
const { RateLimiter } = require(path.resolve(process.argv[2]));

const r = new RateLimiter();
r.set("key1", "value1");
if (!r._cache.has("key1") || r._cache.get("key1") !== "value1") {
  console.log("SETUP_FAIL: cache did not store key1=value1");
  process.exit(2);
}
r.write("key1", "value2");
const stillStale = r._cache.has("key1") && r._cache.get("key1") === "value1";
if (stillStale) {
  console.log("FAIL: write did not invalidate cache — key1 still holds stale value1");
  process.exit(1);
}
console.log("PASS: write invalidated cache (side effect observed, method name irrelevant)");
process.exit(0);
