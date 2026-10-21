const f = "moodrobe-usability-2026-10-21-v1", l = [
  { id: "checkin", label: "Set your mood and occasion" },
  { id: "neural", label: "Generate a real neural edit" },
  { id: "save", label: "Inspect and save one outfit" },
  { id: "wear", label: "Record an outfit in the diary" },
  { id: "lab", label: "Open the model and limitations" }
];
function u(e) {
  if (!e || e.schema !== "moodrobe-usability-export-v1" || e.protocol !== f || e.status !== "completed" || typeof e.id != "string" || !/^[A-Za-z0-9-]{2,12}$/.test(e.code) || e.adultConfirmed !== !0 || !["sample", "personal", "mixed"].includes(e.condition) || !Number.isFinite(e.elapsedMs) || e.elapsedMs < 0 || e.elapsedMs > 864e5 || !Number.isFinite(new Date(e.startedAt).getTime()) || !Number.isFinite(new Date(e.finishedAt).getTime()) || !Number.isFinite(new Date(e.consentAt).getTime()) || !Number.isInteger(e.answers?.ease) || e.answers.ease < 1 || e.answers.ease > 5 || !["yes", "maybe", "no"].includes(e.answers.wouldWear) || typeof e.answers.obstacle != "string" || e.answers.obstacle.length > 500 || !e.tasks || typeof e.tasks != "object")
    throw Error("Invalid or incompatible usability-session file.");
  for (const [o, n] of Object.entries(e.tasks))
    if (!l.some((t) => t.id === o) || !n || !Number.isFinite(n.elapsedMs) || n.elapsedMs < 0 || n.elapsedMs > e.elapsedMs || !Number.isFinite(new Date(n.at).getTime()))
      throw Error("Invalid task timing.");
  return e;
}
function w(e) {
  const o = [
    ...new Map(e.map((n) => [u(n).id, n])).values()
  ];
  return {
    count: o.length,
    conditions: Object.fromEntries(
      ["sample", "personal", "mixed"].map((n) => [
        n,
        o.filter((t) => t.condition === n).length
      ])
    ),
    ease: o.length ? o.reduce((n, t) => n + t.answers.ease, 0) / o.length : null,
    tasks: l.map((n) => ({
      ...n,
      completed: o.filter((t) => t.tasks[n.id]).length
    })),
    wouldWear: Object.fromEntries(
      ["yes", "maybe", "no"].map((n) => [
        n,
        o.filter((t) => t.answers.wouldWear === n).length
      ])
    )
  };
}
let c = [];
const a = (e) => document.getElementById(e), p = (e) => {
  const o = document.createElement("td");
  return o.textContent = String(e), o;
};
function m() {
  const e = w(c);
  a("results").hidden = !e.count, a("empty").hidden = !!e.count, a("export").disabled = !e.count, a("clear").disabled = !e.count, a("metrics").replaceChildren();
  for (const [t, s] of [
    [e.count, "completed sessions"],
    [e.conditions.personal, "personal wardrobe sessions"],
    [e.ease === null ? "—" : e.ease.toFixed(1), "mean ease / 5"],
    [e.wouldWear.yes, "would wear: yes"]
  ]) {
    const i = document.createElement("div"), r = document.createElement("strong"), d = document.createElement("span");
    r.textContent = String(t), d.textContent = s, i.append(r, d), a("metrics").append(i);
  }
  const o = c.map((t) => t.code), n = o.length - new Set(o).size;
  a("codes").textContent = n ? `${n} repeated participant code(s): these sessions must not be presented as distinct verified participants.` : "Anonymous codes are not identity verification. Session count is not a verified participant count.", a("tasks").replaceChildren();
  for (const t of l) {
    const s = document.createElement("tr");
    s.append(p(t.label));
    for (const i of ["sample", "mixed", "personal"]) {
      const r = c.filter((d) => d.condition === i);
      s.append(
        p(
          `${r.filter((d) => d.tasks[t.id]).length} / ${r.length}`
        )
      );
    }
    a("tasks").append(s);
  }
  a("observations").replaceChildren();
  for (const t of c) {
    const s = document.createElement("details"), i = document.createElement("summary"), r = document.createElement("p");
    i.textContent = `${t.code} · ${t.condition} · ease ${t.answers.ease}/5 · would wear: ${t.answers.wouldWear}`, r.className = "session-note", r.textContent = t.answers.obstacle || "No optional comment provided.", s.append(i, r), a("observations").append(s);
  }
}
a("files").addEventListener("change", async (e) => {
  const o = [];
  let n = 0;
  for (const t of e.target.files)
    try {
      if (t.size > 2e6) throw Error("File exceeds 2 MB.");
      const s = JSON.parse(await t.text()), i = s.schema === "moodrobe-usability-batch-v1" ? s.sessions : [s];
      if (!Array.isArray(i) || i.length > 1e3)
        throw Error("Invalid batch.");
      const r = i.map(u);
      for (const d of r)
        c.some((b) => b.id === d.id) || (c.push(d), n++);
    } catch (s) {
      o.push(`${t.name}: ${s.message}`);
    }
  a("status").textContent = `${n} new session(s) imported. ${o.join(" ")}`, m(), e.target.value = "";
});
a("clear").addEventListener("click", () => {
  c = [], m(), a("status").textContent = "Analysis cleared. Source files were not modified.";
});
a("export").addEventListener("click", () => {
  const e = (s) => '"' + String(s).replace(/^[=+@\-\t\r]/, (i) => "'" + i).replace(/"/g, '""') + '"', o = [
    [
      "session_id",
      "participant_code",
      "wardrobe_condition",
      "ease_1_to_5",
      "would_wear",
      "elapsed_ms",
      ...l.map((s) => s.id + "_completed")
    ],
    ...c.map((s) => [
      s.id,
      s.code,
      s.condition,
      s.answers.ease,
      s.answers.wouldWear,
      s.elapsedMs,
      ...l.map((i) => s.tasks[i.id] ? 1 : 0)
    ])
  ], n = URL.createObjectURL(
    new Blob([o.map((s) => s.map(e).join(",")).join(`
`)], {
      type: "text/csv"
    })
  ), t = document.createElement("a");
  t.href = n, t.download = "moodrobe-usability-summary.csv", t.click(), setTimeout(() => URL.revokeObjectURL(n), 1e3);
});
m();
