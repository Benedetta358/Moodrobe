export const legacyLabels = {
  Tutti: "All",
  Top: "Tops",
  Pantaloni: "Trousers",
  Gonne: "Skirts",
  Abiti: "Dresses",
  Capispalla: "Layers",
  Scarpe: "Shoes",
  Accessori: "Accessories",
  "In cerca di calma": "Seeking calm",
  Calma: "Calm",
  "Piena di energia": "Feeling energised",
  Energia: "Energy",
  "Pronta a brillare": "Feeling confident",
  Sicurezza: "Confidence",
  "Un po’ sottotono": "Keeping it gentle",
  Comfort: "Comfort",
  "Linee morbide, colori che ti fanno respirare.":
    "Soft shapes and a little breathing room.",
  "Un accento luminoso per seguire la tua energia.":
    "A brighter accent to meet your energy.",
  "Strutture decise, dettagli che senti tuoi.":
    "Intentional structure. Details that feel like you.",
  "Il comfort di un capo familiare, senza rinunciare a te.":
    "The comfort of something familiar, with your own point of view.",
  "Maglia in cotone": "Cotton crewneck",
  "Camicia azzurra": "Blue cotton shirt",
  "Top terracotta": "Terracotta tee",
  "Blazer sabbia": "Sand tailored blazer",
  "Cardigan salvia": "Sage cardigan",
  "Cappotto cacao": "Chocolate wool coat",
  "Pantaloni sartoriali": "Tailored trousers",
  "Jeans indaco": "Indigo straight jeans",
  "Gonna a pieghe": "Pleated midi skirt",
  "Abito nero": "Black midi dress",
  "Sneakers avorio": "Ivory sneakers",
  "Mocassini cuoio": "Leather loafers",
  "Ballerine nere": "Black ballet flats",
  "Borsa quotidiana": "Everyday shoulder bag",
  "Foulard seta": "Silk scarf",
  "T-shirt bianca": "White cotton tee",
  "Lavoro / studio": "Work / campus",
  "Un’occasione speciale": "An occasion",
  "Una giornata per me": "An everyday kind of day",
  "Una passeggiata": "Out and about",
  "Il tuo equilibrio": "Your everyday anchor",
  "Un’altra prospettiva": "A different perspective",
  "Un piccolo cambio di ritmo": "A change of pace",
  "Inserisci almeno 20 intervalli RR validi, in millisecondi (300–2000).":
    "Enter at least 20 valid RR intervals in milliseconds (300–2000).",
};
export function migrate(s) {
  if (!s) return s;
  const tr = (x) => legacyLabels[x] || x;
  return {
    ...s,
    items: s.items.map((i) => ({
      ...i,
      name: i.demo ? tr(i.name) : i.name,
      category: tr(i.category),
    })),
    checkin: s.checkin
      ? { ...s.checkin, occasion: tr(s.checkin.occasion) }
      : null,
    saved: s.saved.map((l) => ({ ...l, title: tr(l.title) })),
    plans: s.plans.map((l) => ({ ...l, title: tr(l.title) })),
    history: s.history.map((l) => ({ ...l, title: tr(l.title) })),
  };
}
