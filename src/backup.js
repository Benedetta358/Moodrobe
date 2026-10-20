import { categories, moods } from "./domain.js";
import { migrate } from "./migration.js";
export function validateBackup(input) {
  if (
    !input ||
    input.version !== 1 ||
    !Array.isArray(input.items) ||
    input.items.length > 500
  )
    throw Error("This is not a valid Moodrobe backup.");
  for (const key of ["history", "saved", "feedback", "plans", "pilot"])
    if (!Array.isArray(input[key]) || input[key].length > 5000)
      throw Error("This is not a valid Moodrobe backup.");
  const d = migrate(input),
    ids = new Set();
  for (const i of d.items) {
    if (
      !i ||
      typeof i.id !== "string" ||
      i.id.length > 100 ||
      ids.has(i.id) ||
      typeof i.name !== "string" ||
      !i.name.trim() ||
      i.name.length > 120 ||
      !categories.slice(1).includes(i.category) ||
      !/^#[0-9a-f]{6}$/i.test(i.hex) ||
      !Number.isFinite(i.wears) ||
      i.wears < 0 ||
      !Number.isFinite(new Date(i.lastWorn).getTime()) ||
      !["all", "summer", "winter"].includes(i.season) ||
      ![1, 2, 3].includes(i.formality) ||
      (i.description && typeof i.description !== "string") ||
      (i.image &&
        (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(
          i.image,
        ) ||
          i.image.length > 1500000))
    )
      throw Error("The backup contains invalid clothing data.");
    ids.add(i.id);
    i.shape = [
      "knit",
      "shirt",
      "tee",
      "blazer",
      "cardigan",
      "coat",
      "pants",
      "jeans",
      "skirt",
      "dress",
      "sneakers",
      "loafers",
      "flats",
      "bag",
      "scarf",
    ].includes(i.shape)
      ? i.shape
      : "shirt";
  }
  for (const key of ["history", "saved", "plans", "feedback"])
    for (const x of d[key]) {
      if (
        !x ||
        typeof x.id !== "string" ||
        !Array.isArray(x.itemIds) ||
        x.itemIds.length > 30 ||
        x.itemIds.some((id) => typeof id !== "string") ||
        typeof x.date !== "string" ||
        !Number.isFinite(new Date(x.date).getTime())
      )
        throw Error("The backup contains invalid records.");
      if (
        key !== "feedback" &&
        (typeof x.title !== "string" || x.title.length > 150)
      )
        throw Error("The backup contains invalid titles.");
      if (
        key === "feedback" &&
        (typeof x.accepted !== "boolean" ||
          (x.vector &&
            (!Array.isArray(x.vector) ||
              x.vector.length !== 384 ||
              !x.vector.every(
                (v) => Number.isFinite(v) && Math.abs(v) <= 1.001,
              ))))
      )
        throw Error("The backup contains invalid preference examples.");
    }
  if (
    d.checkin &&
    (!moods.some((m) => m.id === d.checkin.mood) ||
      !Number.isFinite(d.checkin.temp) ||
      typeof d.checkin.occasion !== "string" ||
      ["energy", "valence", "stress"].some(
        (k) =>
          !Number.isFinite(d.checkin[k]) ||
          d.checkin[k] < 0 ||
          d.checkin[k] > 100,
      ))
  )
    throw Error("The backup contains an invalid check-in.");
  if (
    d.pilot.some(
      (p) =>
        !p ||
        typeof p.id !== "string" ||
        typeof p.date !== "string" ||
        typeof p.moodPreferred !== "boolean" ||
        !moods.some((m) => m.id === p.mood),
    )
  )
    throw Error("The backup contains invalid comparison data.");
  return d;
}
