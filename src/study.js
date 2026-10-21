export const STUDY_PROTOCOL = "moodrobe-usability-2026-10-21-v1";
export const STUDY_KEY = "moodrobe-usability-v1";
export const TASKS = [
  { id: "checkin", label: "Set your mood and occasion" },
  { id: "neural", label: "Generate a real neural edit" },
  { id: "save", label: "Inspect and save one outfit" },
  { id: "wear", label: "Record an outfit in the diary" },
  { id: "lab", label: "Open the model and limitations" },
];
export function beginSession(code, condition, now = Date.now()) {
  if (!/^[A-Za-z0-9-]{2,12}$/.test(code))
    throw Error(
      "Use an anonymous code of 2–12 letters, numbers or hyphens. Do not use your name.",
    );
  return {
    id: crypto.randomUUID(),
    protocol: STUDY_PROTOCOL,
    code,
    condition,
    startedAt: new Date(now).toISOString(),
    consentAt: new Date(now).toISOString(),
    adultConfirmed: true,
    tasks: {},
    status: "active",
  };
}
export function recordTask(session, task, now = Date.now()) {
  if (
    !session ||
    session.status !== "active" ||
    !TASKS.some((t) => t.id === task) ||
    session.tasks[task]
  )
    return session;
  return {
    ...session,
    tasks: {
      ...session.tasks,
      [task]: {
        at: new Date(now).toISOString(),
        elapsedMs: Math.max(0, now - new Date(session.startedAt).getTime()),
      },
    },
  };
}
export function finishSession(session, answers, now = Date.now()) {
  if (!session || session.status !== "active")
    throw Error("Start a session first.");
  const ease = +answers.ease;
  if (
    !Number.isInteger(ease) ||
    ease < 1 ||
    ease > 5 ||
    !["yes", "maybe", "no"].includes(answers.wouldWear)
  )
    throw Error("Choose an ease rating and whether you would wear an outfit.");
  return {
    ...session,
    status: "completed",
    finishedAt: new Date(now).toISOString(),
    elapsedMs: Math.max(0, now - new Date(session.startedAt).getTime()),
    answers: {
      ease,
      wouldWear: answers.wouldWear,
      obstacle: String(answers.obstacle || "")
        .trim()
        .slice(0, 500),
    },
    schema: "moodrobe-usability-export-v1",
  };
}
export function exportSession(session) {
  return { schema: "moodrobe-usability-export-v1", ...session };
}
export function validateSession(s) {
  if (
    !s ||
    s.schema !== "moodrobe-usability-export-v1" ||
    s.protocol !== STUDY_PROTOCOL ||
    s.status !== "completed" ||
    typeof s.id !== "string" ||
    !/^[A-Za-z0-9-]{2,12}$/.test(s.code) ||
    s.adultConfirmed !== true ||
    !["sample", "personal", "mixed"].includes(s.condition) ||
    !Number.isFinite(s.elapsedMs) ||
    s.elapsedMs < 0 ||
    s.elapsedMs > 86400000 ||
    !Number.isFinite(new Date(s.startedAt).getTime()) ||
    !Number.isFinite(new Date(s.finishedAt).getTime()) ||
    !Number.isFinite(new Date(s.consentAt).getTime()) ||
    !Number.isInteger(s.answers?.ease) ||
    s.answers.ease < 1 ||
    s.answers.ease > 5 ||
    !["yes", "maybe", "no"].includes(s.answers.wouldWear) ||
    typeof s.answers.obstacle !== "string" ||
    s.answers.obstacle.length > 500 ||
    !s.tasks ||
    typeof s.tasks !== "object"
  )
    throw Error("Invalid or incompatible usability-session file.");
  for (const [k, v] of Object.entries(s.tasks))
    if (
      !TASKS.some((t) => t.id === k) ||
      !v ||
      !Number.isFinite(v.elapsedMs) ||
      v.elapsedMs < 0 ||
      v.elapsedMs > s.elapsedMs ||
      !Number.isFinite(new Date(v.at).getTime())
    )
      throw Error("Invalid task timing.");
  return s;
}
export function summariseSessions(sessions) {
  const unique = [
    ...new Map(sessions.map((s) => [validateSession(s).id, s])).values(),
  ];
  return {
    count: unique.length,
    conditions: Object.fromEntries(
      ["sample", "personal", "mixed"].map((c) => [
        c,
        unique.filter((s) => s.condition === c).length,
      ]),
    ),
    ease: unique.length
      ? unique.reduce((n, s) => n + s.answers.ease, 0) / unique.length
      : null,
    tasks: TASKS.map((t) => ({
      ...t,
      completed: unique.filter((s) => s.tasks[t.id]).length,
    })),
    wouldWear: Object.fromEntries(
      ["yes", "maybe", "no"].map((v) => [
        v,
        unique.filter((s) => s.answers.wouldWear === v).length,
      ]),
    ),
  };
}
