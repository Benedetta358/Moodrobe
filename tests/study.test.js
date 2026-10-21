import test from "node:test";
import assert from "node:assert/strict";
import {
  beginSession,
  recordTask,
  finishSession,
  validateSession,
  summariseSessions,
} from "../src/study.js";
const start = Date.parse("2026-10-21T10:00:00Z");
test("usability records only first completed task and separates conditions", () => {
  const s = beginSession("TEST01", "sample", start),
    a = recordTask(s, "checkin", start + 1000);
  assert.equal(recordTask(a, "checkin", start + 2000), a);
  const d = finishSession(a, { ease: 4, wouldWear: "maybe" }, start + 3000);
  assert.equal(validateSession(d), d);
  assert.equal(d.tasks.checkin.elapsedMs, 1000);
  assert.equal(summariseSessions([d, d]).count, 1);
  assert.equal(summariseSessions([d]).conditions.sample, 1);
  assert.equal(JSON.stringify(d).includes("items"), false);
});
test("invalid identity, ratings, protocol and timing are rejected", () => {
  assert.throws(() => beginSession("a name", "sample", start));
  const s = beginSession("TEST02", "personal", start);
  assert.throws(() =>
    finishSession(s, { ease: 6, wouldWear: "yes" }, start + 1000),
  );
  const d = finishSession(s, { ease: 3, wouldWear: "no" }, start + 1000);
  assert.throws(() => validateSession({ ...d, protocol: "other" }));
  assert.throws(() =>
    validateSession({
      ...d,
      tasks: { neural: { elapsedMs: 2000, at: d.finishedAt } },
    }),
  );
  assert.equal(summariseSessions([]).ease, null);
});
