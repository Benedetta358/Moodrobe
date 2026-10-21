import React, { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Download,
  Info,
  Lock,
  X,
} from "@phosphor-icons/react";
import {
  STUDY_KEY,
  TASKS,
  beginSession,
  recordTask,
  finishSession,
  exportSession,
} from "./study.js";
function stored() {
  try {
    const s = JSON.parse(localStorage.getItem(STUDY_KEY));
    return s?.version === 1 && Array.isArray(s.completed)
      ? s
      : { version: 1, active: null, completed: [] };
  } catch {
    return { version: 1, active: null, completed: [] };
  }
}
export function useStudy() {
  const [data, setData] = useState(stored),
    [error, setError] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem(STUDY_KEY, JSON.stringify(data));
      setError("");
    } catch {
      setError(
        "Study data could not be saved. Export the completed result before closing.",
      );
    }
  }, [data]);
  useEffect(() => {
    function event(e) {
      setData((s) => {
        const active = recordTask(s.active, e.detail);
        return active === s.active ? s : { ...s, active };
      });
    }
    window.addEventListener("moodrobe:activity", event);
    return () => window.removeEventListener("moodrobe:activity", event);
  }, []);
  return {
    ...data,
    error,
    start: (code, condition) =>
      setData((s) => ({ ...s, active: beginSession(code, condition) })),
    finish: (answers) => {
      const done = finishSession(data.active, answers);
      setData((s) => ({
        ...s,
        active: null,
        completed: [...s.completed, done].slice(-100),
      }));
      return done;
    },
    cancel: () => setData((s) => ({ ...s, active: null })),
    erase: () => {
      setData({ version: 1, active: null, completed: [] });
      localStorage.removeItem(STUDY_KEY);
    },
  };
}
export function activity(task) {
  window.dispatchEvent(new CustomEvent("moodrobe:activity", { detail: task }));
}
export function ReviewerGuide({ progress, action, exit, openStudy, study }) {
  const done = TASKS.filter((t) => progress[t.id]).length;
  return (
    <section className="review-guide" aria-label="Guided reviewer demo">
      <div>
        <span className="mono">REVIEW MODE / SAMPLE DATA ONLY</span>
        <h2>A five-minute route through Moodrobe.</h2>
        <p>
          Your personal wardrobe is untouched. This sample session stays in this
          tab.
        </p>
      </div>
      <div className="guide-tasks">
        {TASKS.map((t, k) => (
          <button
            key={t.id}
            className={progress[t.id] ? "done" : ""}
            onClick={() => action(t.id)}
          >
            <span aria-hidden="true">
              {progress[t.id] ? <Check size={13} /> : k + 1}
            </span>
            {t.label}
            <ArrowUpRight size={13} />
          </button>
        ))}
      </div>
      <div className="guide-footer">
        <span>{done} / 5 explored</span>
        <a href="/review.html">
          Read the project brief <ArrowUpRight size={13} />
        </a>
        <button onClick={openStudy}>
          {study.active
            ? "Finish usability session"
            : "Take part in a usability session"}
        </button>
        <button onClick={exit}>
          Leave sample mode <X size={13} />
        </button>
      </div>
    </section>
  );
}
export function Welcome({ dismiss }) {
  return (
    <section className="first-visit">
      <div>
        <span className="mono">NEW HERE?</span>
        <h2>Try it in minutes. No account needed.</h2>
        <p>
          Explore a separate sample session, or start with your own wardrobe.
          The first AI run loads about 37 MB of model and runtime files.
        </p>
      </div>
      <a className="button black" href="/?demo=1&tour=1">
        Try the guided demo <ArrowUpRight size={17} />
      </a>
      <a className="text-link" href="/review.html">
        Project brief <ArrowRight size={14} />
      </a>
      <button
        className="icon-button"
        onClick={dismiss}
        aria-label="Dismiss introduction"
      >
        <X size={18} />
      </button>
    </section>
  );
}
export function StudyBanner({ study, open }) {
  if (!study.active) return null;
  const count = Object.keys(study.active.tasks).length;
  return (
    <div className="study-banner" role="status">
      <span className="mono">USABILITY SESSION / {study.active.code}</span>
      <span>
        {count} / 5 tasks recorded · timings are cumulative since the session
        started.
      </span>
      <button className="text-link" onClick={open}>
        Finish or withdraw <ArrowUpRight size={14} />
      </button>
      {study.error && <p className="error">{study.error}</p>}
    </div>
  );
}
export function StudyForm({ study, condition, download, close, notify }) {
  const [code, setCode] = useState(""),
    [adult, setAdult] = useState(false),
    [consent, setConsent] = useState(false),
    [ease, setEase] = useState(""),
    [wouldWear, setWouldWear] = useState(""),
    [obstacle, setObstacle] = useState(""),
    [error, setError] = useState(""),
    [done, setDone] = useState(null);
  function start(e) {
    e.preventDefault();
    try {
      if (!adult || !consent) throw Error("Both confirmations are required.");
      study.start(code, condition);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  function finish(e) {
    e.preventDefault();
    try {
      setDone(study.finish({ ease, wouldWear, obstacle }));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <span className="mono">USABILITY CHECK / NOT A CLINICAL STUDY</span>
      <h2>
        {done
          ? "Thank you. Your observations matter."
          : study.active
            ? "What worked? What got in the way?"
            : "Help test the experience."}
      </h2>
      {done ? (
        <>
          <p>
            Your session is stored only on this device. Export it if you choose
            to share it with the project team. The file contains no clothing
            photos, mood descriptions or neural vectors.
          </p>
          <div className="notice">
            <Check size={22} />
            <p>
              {Object.keys(done.tasks).length} / 5 tasks recorded. Ease of use:{" "}
              {done.answers.ease} / 5. These are your observations, not product
              validation.
            </p>
          </div>
          <button
            className="button black full"
            onClick={() =>
              download(
                `moodrobe-usability-${done.code}.json`,
                JSON.stringify(exportSession(done), null, 2),
              )
            }
          >
            Download my session <Download size={17} />
          </button>
          <button className="button outline full" onClick={close}>
            Return to the app
          </button>
        </>
      ) : study.active ? (
        <>
          <p>
            Code: <b>{study.active.code}</b> · Wardrobe condition:{" "}
            <b>{study.active.condition}</b>. Tasks you did not finish remain
            incomplete; that is useful information too.
          </p>
          <ul className="study-checklist">
            {TASKS.map((t) => (
              <li key={t.id}>
                <span>
                  {study.active.tasks[t.id] ? (
                    <Check size={15} />
                  ) : (
                    <span className="open-task" />
                  )}
                </span>
                {t.label}
              </li>
            ))}
          </ul>
          <form onSubmit={finish}>
            <label>
              How easy was the experience?
              <select
                required
                value={ease}
                onChange={(e) => setEase(e.target.value)}
              >
                <option value="">Choose a rating</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} / 5
                    {n === 1
                      ? " — very difficult"
                      : n === 5
                        ? " — very easy"
                        : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Would you wear one of the suggested outfits?
              <select
                required
                value={wouldWear}
                onChange={(e) => setWouldWear(e.target.value)}
              >
                <option value="">Choose an answer</option>
                <option value="yes">Yes</option>
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
              </select>
            </label>
            <label>
              What was confusing or missing? (optional)
              <textarea
                maxLength={500}
                value={obstacle}
                onChange={(e) => setObstacle(e.target.value)}
                placeholder="Please avoid names, contact details or sensitive personal information."
              />
            </label>
            <button className="button black full">
              Save my observations <Check size={17} />
            </button>
          </form>
          <button
            className="text-link delete"
            onClick={() => {
              study.cancel();
              close();
              notify("Unfinished session withdrawn and deleted.");
            }}
          >
            Withdraw and delete this unfinished session
          </button>
        </>
      ) : (
        <>
          <p>
            A short, voluntary test for adults. Try five tasks: set a check-in,
            generate an AI edit, inspect/save it, record a wear and find the
            model’s limitations. You can stop or skip tasks.
          </p>
          <div className="notice">
            <Lock size={19} />
            <p>
              With your consent, we record task completion and elapsed times,
              your anonymous code and your answers. Results stay in this
              browser. Nothing is sent automatically. You decide whether to
              export and share a result file.
            </p>
          </div>
          <form onSubmit={start}>
            <label>
              Anonymous participant code
              <input
                required
                pattern="[A-Za-z0-9-]{2,12}"
                maxLength={12}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="For example P01 — not your name"
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={adult}
                onChange={(e) => setAdult(e.target.checked)}
              />{" "}
              I confirm that I am 18 or older.
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />{" "}
              I consent to this local usability recording and understand that
              sharing the exported result is optional.
            </label>
            <button className="button black full" disabled={!adult || !consent}>
              Start my session <ArrowRight size={17} />
            </button>
          </form>
          <p className="micro">
            Wardrobe condition: {condition}. Camera, microphone and RR data are
            not part of this test. This form is a usability consent flow, not a
            claim of institutional research approval.
          </p>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {study.completed.length > 0 && !done && (
        <div className="settings-block">
          <h3>Results on this device</h3>
          <p>
            {study.completed.length} completed session(s). No results have been
            uploaded.
          </p>
          <button
            className="button outline full"
            onClick={() =>
              download(
                "moodrobe-usability-sessions.json",
                JSON.stringify(
                  {
                    schema: "moodrobe-usability-batch-v1",
                    sessions: study.completed.map(exportSession),
                  },
                  null,
                  2,
                ),
              )
            }
          >
            Export completed sessions <Download size={16} />
          </button>
          <button
            className="text-link delete"
            onClick={() => {
              if (
                window.confirm(
                  "Delete all usability results stored on this device?",
                )
              ) {
                study.erase();
                notify("Local usability results deleted.");
              }
            }}
          >
            Delete local usability results
          </button>
        </div>
      )}
    </>
  );
}
