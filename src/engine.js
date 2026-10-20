// Structural outfit assembly is deliberately separate from neural ranking.
export const MODEL_INFO = {
  name: "all-MiniLM-L6-v2",
  source: "https://huggingface.co/Xenova/all-MiniLM-L6-v2",
  revision: "751bff37182d3f1213fa05d7196b954e230abad9",
  dimensions: 384,
  license: "Apache-2.0",
};
export const normalize = (v) => {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
};
export const cosine = (a, b) => a.reduce((s, x, i) => s + x * (b[i] || 0), 0);
export function fitPreferenceHead(feedback, dimension = 384) {
  const examples = feedback
    .filter(
      (f) =>
        Array.isArray(f.vector) &&
        f.vector.length === dimension &&
        f.vector.every(Number.isFinite) &&
        typeof f.accepted === "boolean",
    )
    .slice(-150);
  const w = Array(dimension).fill(0);
  let loss = null;
  if (!examples.length) return { weights: w, samples: 0, loss: null };
  for (let epoch = 0; epoch < 35; epoch++) {
    let total = 0;
    for (const f of examples) {
      const z = Math.max(-20, Math.min(20, cosine(w, f.vector))),
        p = 1 / (1 + Math.exp(-z)),
        y = f.accepted ? 1 : 0;
      for (let k = 0; k < dimension; k++)
        w[k] -= 0.18 * ((p - y) * f.vector[k] + 0.015 * w[k]);
      total -= y * Math.log(p + 1e-8) + (1 - y) * Math.log(1 - p + 1e-8);
    }
    loss = total / examples.length;
  }
  return { weights: w, samples: examples.length, loss };
}
export function describeItem(i) {
  return `${i.name}. ${i.category}. ${i.color} colour. ${i.description || ""} ${i.formality === 3 ? "Tailored formal elegant structured" : i.formality === 2 ? "Smart casual refined versatile" : "Relaxed casual comfortable easygoing"}. ${i.season === "winter" ? "Warm cosy cold-weather layer" : i.season === "summer" ? "Lightweight breathable summer" : "Everyday versatile all-season clothing"}.`;
}
export function describeIntent(c) {
  const mood =
    {
      calm: "calm relaxed understated peaceful soft comfortable clothing",
      bright: "energetic playful expressive colourful bright creative clothing",
      confident: "confident polished structured elegant bold clothing",
      soft: "cosy gentle familiar comfortable effortless relaxed clothing",
    }[c.mood] || "comfortable everyday clothing";
  return `${c.intent || ""}. Outfit for ${c.occasion}. ${mood}. ${c.temp < 15 ? "Cool weather with warm layers" : c.temp > 24 ? "Hot weather lightweight breathable clothing" : "Mild weather versatile clothing"}. ${c.energy < 35 ? "Low energy, easy comfortable clothes." : ""} ${c.stress > 65 ? "Avoid fussy clothing, choose familiar comfortable pieces." : ""}`;
}
export function assembleCandidates(items, c, requiredId = null) {
  const a = items.filter((i) => i.available !== false),
    tops = a.filter((i) => i.category === "Tops"),
    bottoms = a.filter((i) => ["Trousers", "Skirts"].includes(i.category)),
    dresses = a.filter((i) => i.category === "Dresses"),
    shoes = a.filter((i) => i.category === "Shoes"),
    layers = a.filter(
      (i) => i.category === "Layers" && !(c.temp > 23 && i.season === "winter"),
    ),
    accessories = a.filter((i) => i.category === "Accessories");
  const bases = [];
  for (const t of tops) for (const b of bottoms) bases.push([t, b]);
  for (const d of dresses) bases.push([d]);
  const result = [];
  for (const base of bases)
    for (const shoe of shoes) {
      const ls = c.temp < 19 && layers.length ? layers : [null];
      for (const layer of ls) {
        const ats = accessories.length ? [null, ...accessories] : [null];
        for (const accessory of ats) {
          const pieces = [
            ...base,
            shoe,
            ...(layer ? [layer] : []),
            ...(accessory ? [accessory] : []),
          ];
          if (requiredId && !pieces.some((i) => i.id === requiredId)) continue;
          result.push({
            id: pieces
              .map((i) => i.id)
              .sort()
              .join("|"),
            itemIds: pieces.map((i) => i.id),
          });
          if (result.length >= 2000) return result;
        }
      }
    }
  return result;
}
export function selectDiverse(ranked, count = 3) {
  const chosen = [];
  for (const r of ranked) {
    if (chosen.length >= count) break;
    const overlap = chosen.some((c) => {
      const base = c.itemIds.filter((id) => c.baseIds?.includes(id)),
        other = r.baseIds || r.itemIds;
      return base.length && base.every((id) => other.includes(id));
    });
    if (!overlap) chosen.push(r);
  }
  for (const r of ranked) {
    if (chosen.length >= count) break;
    if (!chosen.some((c) => c.id === r.id)) chosen.push(r);
  }
  return chosen;
}
