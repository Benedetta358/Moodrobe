import { validateSession, summariseSessions, TASKS } from "./study.js";
let sessions = [];
const $ = (id) => document.getElementById(id),
  cell = (t) => {
    const e = document.createElement("td");
    e.textContent = String(t);
    return e;
  };
function render() {
  const summary = summariseSessions(sessions);
  $("results").hidden = !summary.count;
  $("empty").hidden = !!summary.count;
  $("export").disabled = !summary.count;
  $("clear").disabled = !summary.count;
  $("metrics").replaceChildren();
  for (const [n, label] of [
    [summary.count, "completed sessions"],
    [summary.conditions.personal, "personal wardrobe sessions"],
    [summary.ease === null ? "—" : summary.ease.toFixed(1), "mean ease / 5"],
    [summary.wouldWear.yes, "would wear: yes"],
  ]) {
    const d = document.createElement("div"),
      b = document.createElement("strong"),
      s = document.createElement("span");
    b.textContent = String(n);
    s.textContent = label;
    d.append(b, s);
    $("metrics").append(d);
  }
  const codes = sessions.map((s) => s.code),
    duplicates = codes.length - new Set(codes).size;
  $("codes").textContent = duplicates
    ? `${duplicates} repeated participant code(s): these sessions must not be presented as distinct verified participants.`
    : "Anonymous codes are not identity verification. Session count is not a verified participant count.";
  $("tasks").replaceChildren();
  for (const task of TASKS) {
    const tr = document.createElement("tr");
    tr.append(cell(task.label));
    for (const condition of ["sample", "mixed", "personal"]) {
      const group = sessions.filter((s) => s.condition === condition);
      tr.append(
        cell(
          `${group.filter((s) => s.tasks[task.id]).length} / ${group.length}`,
        ),
      );
    }
    $("tasks").append(tr);
  }
  $("observations").replaceChildren();
  for (const s of sessions) {
    const d = document.createElement("details"),
      t = document.createElement("summary"),
      p = document.createElement("p");
    t.textContent = `${s.code} · ${s.condition} · ease ${s.answers.ease}/5 · would wear: ${s.answers.wouldWear}`;
    p.className = "session-note";
    p.textContent = s.answers.obstacle || "No optional comment provided.";
    d.append(t, p);
    $("observations").append(d);
  }
}
$("files").addEventListener("change", async (e) => {
  const errors = [];
  let added = 0;
  for (const file of e.target.files) {
    try {
      if (file.size > 2e6) throw Error("File exceeds 2 MB.");
      const data = JSON.parse(await file.text()),
        batch =
          data.schema === "moodrobe-usability-batch-v1"
            ? data.sessions
            : [data];
      if (!Array.isArray(batch) || batch.length > 1000)
        throw Error("Invalid batch.");
      const validated = batch.map(validateSession);
      for (const s of validated)
        if (!sessions.some((x) => x.id === s.id)) {
          sessions.push(s);
          added++;
        }
    } catch (err) {
      errors.push(`${file.name}: ${err.message}`);
    }
  }
  $("status").textContent =
    `${added} new session(s) imported. ${errors.join(" ")}`;
  render();
  e.target.value = "";
});
$("clear").addEventListener("click", () => {
  sessions = [];
  render();
  $("status").textContent = "Analysis cleared. Source files were not modified.";
});
$("export").addEventListener("click", () => {
  const safe = (x) =>
    '"' +
    String(x)
      .replace(/^[=+@\-\t\r]/, (v) => "'" + v)
      .replace(/"/g, '""') +
    '"';
  const lines = [
    [
      "session_id",
      "participant_code",
      "wardrobe_condition",
      "ease_1_to_5",
      "would_wear",
      "elapsed_ms",
      ...TASKS.map((t) => t.id + "_completed"),
    ],
    ...sessions.map((s) => [
      s.id,
      s.code,
      s.condition,
      s.answers.ease,
      s.answers.wouldWear,
      s.elapsedMs,
      ...TASKS.map((t) => (s.tasks[t.id] ? 1 : 0)),
    ]),
  ];
  const u = URL.createObjectURL(
      new Blob([lines.map((row) => row.map(safe).join(",")).join("\n")], {
        type: "text/csv",
      }),
    ),
    a = document.createElement("a");
  a.href = u;
  a.download = "moodrobe-usability-summary.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
});
render();
