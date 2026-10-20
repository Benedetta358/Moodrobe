export const categories = [
  "All",
  "Tops",
  "Trousers",
  "Skirts",
  "Dresses",
  "Layers",
  "Shoes",
  "Accessories",
];
export const moods = [
  {
    id: "calm",
    label: "Seeking calm",
    short: "Calm",
    color: "#8eaa9a",
    energy: 30,
    valence: 55,
    stress: 65,
    description: "Soft shapes and a little breathing room.",
  },
  {
    id: "bright",
    label: "Feeling energised",
    short: "Energy",
    color: "#d3a252",
    energy: 85,
    valence: 85,
    stress: 20,
    description: "A brighter accent to meet your energy.",
  },
  {
    id: "confident",
    label: "Feeling confident",
    short: "Confidence",
    color: "#a66758",
    energy: 70,
    valence: 80,
    stress: 30,
    description: "Intentional structure. Details that feel like you.",
  },
  {
    id: "soft",
    label: "Keeping it gentle",
    short: "Comfort",
    color: "#a59ab2",
    energy: 25,
    valence: 30,
    stress: 45,
    description:
      "The comfort of something familiar, with your own point of view.",
  },
];
export function seedWardrobe() {
  const data = [
    ["Cotton crewneck", "Tops", "cream", "#e8dfcc", "knit", 2, 16, "all", 1],
    ["Blue cotton shirt", "Tops", "blue", "#a7bdc9", "shirt", 10, 9, "all", 2],
    ["Terracotta tee", "Tops", "rust", "#b9765d", "tee", 67, 3, "summer", 1],
    [
      "Sand tailored blazer",
      "Layers",
      "beige",
      "#bba78b",
      "blazer",
      5,
      11,
      "all",
      3,
    ],
    [
      "Sage cardigan",
      "Layers",
      "sage",
      "#9ca98c",
      "cardigan",
      72,
      2,
      "winter",
      1,
    ],
    [
      "Chocolate wool coat",
      "Layers",
      "brown",
      "#78604d",
      "coat",
      13,
      8,
      "winter",
      3,
    ],
    [
      "Tailored trousers",
      "Trousers",
      "beige",
      "#c7b99f",
      "pants",
      3,
      14,
      "all",
      3,
    ],
    [
      "Indigo straight jeans",
      "Trousers",
      "blue",
      "#536b80",
      "jeans",
      6,
      21,
      "all",
      1,
    ],
    [
      "Pleated midi skirt",
      "Skirts",
      "brown",
      "#9d876c",
      "skirt",
      83,
      1,
      "all",
      2,
    ],
    [
      "Black midi dress",
      "Dresses",
      "black",
      "#363634",
      "dress",
      31,
      5,
      "all",
      3,
    ],
    [
      "Ivory sneakers",
      "Shoes",
      "cream",
      "#e5e0d2",
      "sneakers",
      2,
      28,
      "all",
      1,
    ],
    [
      "Leather loafers",
      "Shoes",
      "brown",
      "#895d40",
      "loafers",
      8,
      15,
      "all",
      3,
    ],
    [
      "Black ballet flats",
      "Shoes",
      "black",
      "#383834",
      "flats",
      64,
      2,
      "all",
      2,
    ],
    [
      "Everyday shoulder bag",
      "Accessories",
      "brown",
      "#8e6548",
      "bag",
      4,
      32,
      "all",
      2,
    ],
    ["Silk scarf", "Accessories", "rust", "#b7866b", "scarf", 75, 1, "all", 2],
    ["White cotton tee", "Tops", "white", "#f3efe4", "tee", 9, 18, "summer", 1],
  ];
  return data.map((a, i) => ({
    id: `demo-${i}`,
    name: a[0],
    category: a[1],
    color: a[2],
    hex: a[3],
    shape: a[4],
    lastWorn: new Date(Date.now() - a[5] * 86400000).toISOString(),
    wears: a[6],
    season: a[7],
    formality: a[8],
    createdAt: new Date().toISOString(),
    demo: true,
    available: true,
  }));
}
export function daysSince(date, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(date).getTime()) / 86400000));
}
export function recommend(
  items,
  checkin,
  feedback = [],
  round = 0,
  requiredId = null,
) {
  const available = items.filter((i) => i.available !== false),
    tops = available.filter((i) => i.category === "Tops"),
    bottoms = available.filter((i) =>
      ["Trousers", "Skirts"].includes(i.category),
    ),
    dresses = available.filter((i) => i.category === "Dresses"),
    shoes = available.filter((i) => i.category === "Shoes");
  if (((!tops.length || !bottoms.length) && !dresses.length) || !shoes.length)
    return [];
  const mood = checkin.mood || "calm",
    formality =
      checkin.occasion === "Work / campus"
        ? 2
        : checkin.occasion === "An occasion"
          ? 3
          : 1,
    preferences = {};
  feedback.forEach((f) =>
    f.itemIds.forEach(
      (id) =>
        (preferences[id] = (preferences[id] || 0) + (f.accepted ? 3 : -2)),
    ),
  );
  function score(i) {
    let s = (preferences[i.id] || 0) + Math.min(5, daysSince(i.lastWorn) / 18);
    s -= Math.abs((i.formality || 1) - formality) * 2;
    if (
      ["calm", "soft"].includes(mood) &&
      ["sage", "cream", "blue", "beige"].includes(i.color)
    )
      s += 3;
    if (mood === "bright" && ["rust", "white"].includes(i.color)) s += 4;
    if (mood === "confident" && (i.formality || 1) >= 2) s += 3;
    if (
      (checkin.stress ?? 0) > 65 &&
      ["cream", "sage", "blue"].includes(i.color)
    )
      s += 2;
    if ((checkin.energy ?? 50) > 70 && i.color === "rust") s += 2;
    if (checkin.temp > 22 && i.season === "winter") s -= 15;
    if (checkin.temp < 13 && i.season === "summer") s -= 8;
    return s;
  }
  const sort = (a) =>
      [...a].sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id)),
    ts = sort(tops),
    bs = sort(bottoms),
    ds = sort(dresses),
    ss = sort(shoes),
    outer = sort(available.filter((i) => i.category === "Layers")),
    access = sort(available.filter((i) => i.category === "Accessories"));
  let candidates = [];
  for (const top of ts)
    for (const bottom of bs)
      for (const shoe of ss) candidates.push([top, bottom, shoe]);
  for (const dress of ds) for (const shoe of ss) candidates.push([dress, shoe]);
  if (requiredId)
    candidates = candidates.filter(
      (base) =>
        base.some((i) => i.id === requiredId) ||
        available.some(
          (i) =>
            i.id === requiredId &&
            ["Layers", "Accessories"].includes(i.category),
        ),
    );
  candidates = candidates
    .map((base) => {
      let list = [...base];
      if (checkin.temp < 20 && outer.length)
        list.push(outer[(round + list[0].id.length) % outer.length]);
      if (access.length)
        list.push(access[(round + list[0].id.length) % access.length]);
      if (requiredId && !list.some((i) => i.id === requiredId)) {
        const required = available.find((i) => i.id === requiredId);
        if (required) {
          list = list.filter((i) => i.category !== required.category);
          list.push(required);
        }
      }
      return {
        items: list,
        score: list.reduce((s, i) => s + score(i), 0),
        signature: list
          .map((i) => i.id)
          .sort()
          .join("|"),
      };
    })
    .sort(
      (a, b) => b.score - a.score || a.signature.localeCompare(b.signature),
    );
  const result = [];
  if (!candidates.length) return result;
  for (let k = 0; k < candidates.length && result.length < 3; k++) {
    const c = candidates[(k + round * 3) % candidates.length];
    if (
      result.some(
        (r) =>
          r.items[0].id === c.items[0].id && r.items[1]?.id === c.items[1]?.id,
      )
    )
      continue;
    result.push({
      ...c,
      id: c.signature,
      title: [
        "Your everyday anchor",
        "A different perspective",
        "A change of pace",
      ][result.length],
      palette: [...new Set(c.items.map((i) => i.hex))].slice(0, 5),
      reason:
        moods.find((m) => m.id === mood)?.description || moods[0].description,
    });
  }
  return result;
}
export function rmssd(a) {
  if (
    a.length < 20 ||
    a.some((n) => !Number.isFinite(n) || n < 300 || n > 2000)
  )
    throw new Error(
      "Enter at least 20 valid RR intervals in milliseconds (300–2000).",
    );
  return Math.sqrt(
    a.slice(1).reduce((s, n, i) => s + (n - a[i]) ** 2, 0) / (a.length - 1),
  );
}
export function stats(items, history) {
  const real = history.filter((h) => h.type === "worn");
  return {
    worn: new Set(real.flatMap((h) => h.itemIds)).size,
    looks: real.length,
    dormant: items.filter((i) => daysSince(i.lastWorn) >= 60).length,
    utilization: items.length
      ? Math.round(
          (items.filter((i) => i.wears > 0 && daysSince(i.lastWorn) < 60)
            .length /
            items.length) *
            100,
        )
      : 0,
  };
}
