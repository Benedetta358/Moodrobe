export const categories = [
  "Tutti",
  "Top",
  "Pantaloni",
  "Gonne",
  "Abiti",
  "Capispalla",
  "Scarpe",
  "Accessori",
];
export const moods = [
  {
    id: "calm",
    label: "In cerca di calma",
    short: "Calma",
    color: "#8eaa9a",
    energy: 30,
    valence: 55,
    stress: 65,
    description: "Linee morbide, colori che ti fanno respirare.",
  },
  {
    id: "bright",
    label: "Piena di energia",
    short: "Energia",
    color: "#d3a252",
    energy: 85,
    valence: 85,
    stress: 20,
    description: "Un accento luminoso per seguire la tua energia.",
  },
  {
    id: "confident",
    label: "Pronta a brillare",
    short: "Sicurezza",
    color: "#a66758",
    energy: 70,
    valence: 80,
    stress: 30,
    description: "Strutture decise, dettagli che senti tuoi.",
  },
  {
    id: "soft",
    label: "Un po’ sottotono",
    short: "Comfort",
    color: "#a59ab2",
    energy: 25,
    valence: 30,
    stress: 45,
    description: "Il comfort di un capo familiare, senza rinunciare a te.",
  },
];
export function seedWardrobe() {
  const data = [
    ["Maglia in cotone", "Top", "cream", "#e8dfcc", "knit", 2, 16, "all", 1],
    ["Camicia azzurra", "Top", "blue", "#a7bdc9", "shirt", 10, 9, "all", 2],
    ["Top terracotta", "Top", "rust", "#b9765d", "tee", 67, 3, "summer", 1],
    [
      "Blazer sabbia",
      "Capispalla",
      "beige",
      "#bba78b",
      "blazer",
      5,
      11,
      "all",
      3,
    ],
    [
      "Cardigan salvia",
      "Capispalla",
      "sage",
      "#9ca98c",
      "cardigan",
      72,
      2,
      "winter",
      1,
    ],
    [
      "Cappotto cacao",
      "Capispalla",
      "brown",
      "#78604d",
      "coat",
      13,
      8,
      "winter",
      3,
    ],
    [
      "Pantaloni sartoriali",
      "Pantaloni",
      "beige",
      "#c7b99f",
      "pants",
      3,
      14,
      "all",
      3,
    ],
    ["Jeans indaco", "Pantaloni", "blue", "#536b80", "jeans", 6, 21, "all", 1],
    ["Gonna a pieghe", "Gonne", "brown", "#9d876c", "skirt", 83, 1, "all", 2],
    ["Abito nero", "Abiti", "black", "#363634", "dress", 31, 5, "all", 3],
    [
      "Sneakers avorio",
      "Scarpe",
      "cream",
      "#e5e0d2",
      "sneakers",
      2,
      28,
      "all",
      1,
    ],
    [
      "Mocassini cuoio",
      "Scarpe",
      "brown",
      "#895d40",
      "loafers",
      8,
      15,
      "all",
      3,
    ],
    ["Ballerine nere", "Scarpe", "black", "#383834", "flats", 64, 2, "all", 2],
    [
      "Borsa quotidiana",
      "Accessori",
      "brown",
      "#8e6548",
      "bag",
      4,
      32,
      "all",
      2,
    ],
    ["Foulard seta", "Accessori", "rust", "#b7866b", "scarf", 75, 1, "all", 2],
    ["T-shirt bianca", "Top", "white", "#f3efe4", "tee", 9, 18, "summer", 1],
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
    tops = available.filter((i) => i.category === "Top"),
    bottoms = available.filter((i) =>
      ["Pantaloni", "Gonne"].includes(i.category),
    ),
    dresses = available.filter((i) => i.category === "Abiti"),
    shoes = available.filter((i) => i.category === "Scarpe");
  if (((!tops.length || !bottoms.length) && !dresses.length) || !shoes.length)
    return [];
  const mood = checkin.mood || "calm",
    formality =
      checkin.occasion === "Lavoro / studio"
        ? 2
        : checkin.occasion === "Un’occasione speciale"
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
    outer = sort(available.filter((i) => i.category === "Capispalla")),
    access = sort(available.filter((i) => i.category === "Accessori"));
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
            ["Capispalla", "Accessori"].includes(i.category),
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
        "Il tuo equilibrio",
        "Un’altra prospettiva",
        "Un piccolo cambio di ritmo",
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
      "Inserisci almeno 20 intervalli RR validi, in millisecondi (300–2000).",
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
