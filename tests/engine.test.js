import test from "node:test";
import assert from "node:assert/strict";
import {
  assembleCandidates,
  fitPreferenceHead,
  normalize,
  cosine,
  selectDiverse,
} from "../src/engine.js";
import { seedWardrobe } from "../src/domain.js";
import { validateBackup } from "../src/backup.js";
const context = { mood: "calm", temp: 14, occasion: "Work / campus" };
test("candidate assembler only uses complete outfits from available owned items", () => {
  const items = seedWardrobe();
  items[0].available = false;
  const c = assembleCandidates(items, context);
  assert(c.length > 3);
  for (const x of c) {
    const a = x.itemIds.map((id) => items.find((i) => i.id === id));
    assert(a.every((i) => i.available));
    assert(a.some((i) => i.category === "Shoes"));
    assert(
      a.some((i) => i.category === "Dresses") ||
        (a.some((i) => i.category === "Tops") &&
          a.some((i) => ["Trousers", "Skirts"].includes(i.category))),
    );
    assert(a.some((i) => i.category === "Layers"));
  }
});
test("required rediscovery garment is included in all candidate outfits", () => {
  for (const id of ["demo-2", "demo-4", "demo-8", "demo-12", "demo-14"]) {
    const c = assembleCandidates(seedWardrobe(), context, id);
    assert(c.length);
    assert(c.every((x) => x.itemIds.includes(id)));
  }
});
test("missing shoes means no complete candidate, not generated imaginary pieces", () => {
  assert.equal(
    assembleCandidates(
      seedWardrobe().filter((i) => i.category !== "Shoes"),
      context,
    ).length,
    0,
  );
});
test("preference head actually learns opposing labels rather than a fixed rule", () => {
  const pos = normalize([1, 0.1, 0]),
    neg = normalize([0, 0.1, 1]);
  const trained = fitPreferenceHead(
    [
      { accepted: true, vector: pos },
      { accepted: false, vector: neg },
    ],
    3,
  );
  assert.equal(trained.samples, 2);
  assert(Number.isFinite(trained.loss));
  assert(cosine(trained.weights, pos) > 0);
  assert(cosine(trained.weights, neg) < 0);
  assert.equal(fitPreferenceHead([], 3).samples, 0);
});
test("malformed training examples cannot poison weights", () => {
  assert.equal(
    fitPreferenceHead([{ accepted: true, vector: [NaN] }], 1).samples,
    0,
  );
});
test("diverse ranking preserves distinct base combinations", () => {
  const r = selectDiverse([
    {
      id: "a",
      itemIds: ["top", "bottom", "shoe1"],
      baseIds: ["top", "bottom"],
    },
    {
      id: "b",
      itemIds: ["top", "bottom", "shoe2"],
      baseIds: ["top", "bottom"],
    },
    {
      id: "c",
      itemIds: ["top2", "bottom", "shoe1"],
      baseIds: ["top2", "bottom"],
    },
    { id: "d", itemIds: ["dress", "shoe1"], baseIds: ["dress"] },
  ]);
  assert.deepEqual(
    r.map((i) => i.id),
    ["a", "c", "d"],
  );
});
test("legacy wardrobes migrate without losing wear history", () => {
  const backup = {
    version: 1,
    items: seedWardrobe().map((i) =>
      i.id === "demo-0"
        ? { ...i, name: "Maglia in cotone", category: "Top" }
        : i,
    ),
    history: [],
    saved: [],
    feedback: [],
    plans: [],
    pilot: [],
    checkin: null,
  };
  const b = validateBackup(backup);
  assert.equal(b.items[0].name, "Cotton crewneck");
  assert.equal(b.items[0].category, "Tops");
  assert.equal(b.items[0].wears, 16);
});
test("backup rejects malformed preference vectors and remote image URLs", () => {
  const b = {
    version: 1,
    items: seedWardrobe(),
    history: [],
    saved: [],
    feedback: [],
    plans: [],
    pilot: [],
    checkin: null,
  };
  assert.throws(() =>
    validateBackup({
      ...b,
      items: [{ ...b.items[0], image: "https://tracker.invalid/photo.jpg" }],
    }),
  );
  assert.throws(() =>
    validateBackup({
      ...b,
      feedback: [
        {
          id: "x",
          date: new Date().toISOString(),
          itemIds: [],
          accepted: true,
          vector: [0],
        },
      ],
    }),
  );
});
