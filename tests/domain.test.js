import test from "node:test";
import assert from "node:assert/strict";
import {
  seedWardrobe,
  recommend,
  rmssd,
  daysSince,
  stats,
} from "../src/domain.js";
const ctx = {
  mood: "calm",
  occasion: "Lavoro / studio",
  temp: 16,
  energy: 30,
  stress: 65,
};
test("three complete, unique looks contain only owned available garments", () => {
  const wardrobe = seedWardrobe();
  wardrobe[0].available = false;
  const results = recommend(wardrobe, ctx);
  assert.equal(results.length, 3);
  assert.equal(new Set(results.map((l) => l.id)).size, 3);
  for (const l of results) {
    assert(l.items.some((i) => i.category === "Scarpe"));
    assert(
      l.items.some((i) => i.category === "Abiti") ||
        (l.items.some((i) => i.category === "Top") &&
          l.items.some((i) => ["Pantaloni", "Gonne"].includes(i.category))),
    );
    assert(
      l.items.every((i) => wardrobe.some((g) => g.id === i.id) && i.available),
    );
  }
});
test("empty and incomplete wardrobes produce no fabricated clothing", () => {
  assert.deepEqual(recommend([], ctx), []);
  assert.deepEqual(
    recommend(
      seedWardrobe().filter((i) => i.category === "Top"),
      ctx,
    ),
    [],
  );
  assert.deepEqual(
    recommend(
      seedWardrobe().filter((i) => i.category !== "Scarpe"),
      ctx,
    ),
    [],
  );
});
test("a dress and shoes are enough to build one real look", () => {
  const a = seedWardrobe().filter(
    (i) => i.category === "Abiti" || i.id === "demo-10",
  );
  assert.equal(recommend(a, ctx).length, 1);
  assert.equal(recommend(a, ctx)[0].items.length, 2);
});
test("cold weather adds a layer; warm weather does not", () => {
  const a = seedWardrobe();
  assert(
    recommend(a, { ...ctx, temp: 10 }).every((l) =>
      l.items.some((i) => i.category === "Capispalla"),
    ),
  );
  assert(
    recommend(a, { ...ctx, temp: 28 }).every(
      (l) => !l.items.some((i) => i.category === "Capispalla"),
    ),
  );
});
test("acceptance and rejection affect the score of owned items", () => {
  const a = seedWardrobe();
  const top = a.find((i) => i.id === "demo-0");
  const before = recommend(a, ctx).find((l) =>
    l.items.some((i) => i.id === top.id),
  )?.score;
  const after = recommend(a, ctx, [{ itemIds: [top.id], accepted: true }]).find(
    (l) => l.items.some((i) => i.id === top.id),
  )?.score;
  assert(Math.abs(after - before - 3) < 1e-9);
});
test("same inputs give reproducible results without mutating wardrobe", () => {
  const a = seedWardrobe();
  const snapshot = JSON.stringify(a);
  assert.deepEqual(recommend(a, ctx), recommend(a, ctx));
  assert.equal(JSON.stringify(a), snapshot);
});
test("required rediscovery garment is included in every returned look", () => {
  for (const id of ["demo-2", "demo-4", "demo-8", "demo-12", "demo-14"]) {
    const r = recommend(seedWardrobe(), ctx, [], 0, id);
    assert(r.length);
    assert(r.every((l) => l.items.some((i) => i.id === id)));
  }
});
test("future dates never create a negative inactivity period", () => {
  assert.equal(daysSince("2050-01-01"), 0);
  assert.equal(daysSince("2020-01-01", new Date("2020-03-01").getTime()), 60);
});
test("RMSSD matches a known sequence and rejects malformed input", () => {
  assert.equal(
    rmssd(Array.from({ length: 20 }, (_, i) => (i % 2 ? 820 : 800))),
    20,
  );
  assert.throws(() => rmssd([800, 810]));
  assert.throws(() => rmssd(Array(20).fill(NaN)));
  assert.throws(() => rmssd(Array(20).fill(2001)));
});
test("impact metrics distinguish demo catalog from real worn events", () => {
  const a = seedWardrobe();
  const m = stats(a, []);
  assert.equal(m.looks, 0);
  assert.equal(m.worn, 0);
  assert.equal(m.dormant, 5);
  assert.equal(stats([], []).utilization, 0);
  assert.equal(stats(a, [{ type: "worn", itemIds: [a[0].id] }]).looks, 1);
});

test("adding never-worn garments does not claim utilization", () => {
  assert.equal(
    stats(
      seedWardrobe().map((i) => ({ ...i, wears: 0 })),
      [],
    ).utilization,
    0,
  );
});
