import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Check,
  X,
  CloudSun,
  Heart,
  Leaf,
  Trash,
  Download,
  Upload,
  Camera,
  Microphone,
  Lock,
  Info,
  CalendarBlank,
  CoatHanger,
  SquaresFour,
  Sparkle,
  ArrowsClockwise,
  BookmarkSimple,
  CheckCircle,
  FlowerLotus,
  Lightning,
  Star,
  House,
  BookOpen,
  Cloud,
  MapPin,
  MagnifyingGlass,
  Cpu,
  SlidersHorizontal,
  ArrowLeft,
  Flask,
} from "@phosphor-icons/react";
import "@fontsource/space-grotesk/latin-400.css";
import "@fontsource/space-grotesk/latin-500.css";
import "@fontsource/space-grotesk/latin-600.css";
import "@fontsource/space-grotesk/latin-700.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "./style.css";
import Garment from "./Garment";
import {
  moods,
  categories,
  seedWardrobe,
  recommend,
  daysSince,
  stats,
  rmssd,
} from "./domain";
import { loadState, saveState } from "./storage";
import { migrate } from "./migration";
import { useLocalAI } from "./useLocalAI";
import { MODEL_INFO } from "./engine";
const KEY = "moodrobe-v1",
  icons = [FlowerLotus, Lightning, Star, Cloud],
  titles = [
    "The everyday anchor",
    "A different perspective",
    "The unexpected favourite",
  ];
const initial = () => ({
  version: 1,
  updatedAt: 0,
  name: "Benedetta",
  items: seedWardrobe(),
  history: [],
  feedback: [],
  saved: [],
  plans: [],
  checkin: null,
  consents: { face: false, voice: false, hrv: false },
  pilot: [],
  researchConsent: false,
  welcomed: false,
});
function read() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s?.version === 1 && Array.isArray(s.items)
      ? migrate({ ...initial(), ...s })
      : initial();
  } catch {
    return initial();
  }
}
export function download(name, value, type = "application/json") {
  const u = URL.createObjectURL(new Blob([value], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
function App({ restored }) {
  const [s, setS] = useState(restored || read),
    [page, setPage] = useState(
      new URLSearchParams(location.search).get("view") === "lab"
        ? "lab"
        : "today",
    ),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [storeError, setStoreError] = useState(false),
    [filter, setFilter] = useState("All"),
    [search, setSearch] = useState(""),
    [round, setRound] = useState(0),
    [weather, setWeather] = useState({ temp: 18, live: false }),
    [collectionTab, setCollectionTab] = useState("saved");
  const ai = useLocalAI(),
    timer = useRef();
  const context = s.checkin || {
    mood: "calm",
    energy: 30,
    valence: 55,
    stress: 50,
    occasion: "Work / campus",
    temp: weather.temp,
    intent:
      "An easy day on campus. Comfortable, considered, a little creative.",
  };
  const catalogSignature = JSON.stringify(
    s.items.map((i) => [
      i.id,
      i.name,
      i.category,
      i.available,
      i.description,
      i.formality,
      i.color,
      i.wears,
    ]),
  );
  useEffect(() => {
    let current = true;
    saveState(s)
      .then(() => {
        if (current) setStoreError(false);
      })
      .catch(() => {
        if (current) setStoreError(true);
      });
    return () => {
      current = false;
    };
  }, [s]);
  useEffect(() => {
    document.title = `Moodrobe / ${{ today: "Your daily edit", wardrobe: "Your wardrobe", looks: "Saved & diary", rewear: "Wear it again", lab: "Inside the AI" }[page]}`;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);
  useEffect(() => {
    ai.clear();
  }, [catalogSignature]);
  function update(v) {
    setS((p) => {
      const next = {
        ...p,
        ...(typeof v === "function" ? v(p) : v),
        updatedAt: Math.max(Date.now(), (p.updatedAt || 0) + 1),
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }
  function notify(t) {
    setToast(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 5000);
  }
  function go(p) {
    setPage(p);
    setModal(null);
  }
  const fallback = recommend(s.items, context, s.feedback, round),
    looks =
      ai.status === "ready"
        ? ai.looks.map((l, k) => ({
            ...l,
            items: l.itemIds
              .map((id) => s.items.find((i) => i.id === id))
              .filter(Boolean),
            title: titles[k],
            palette: [
              ...new Set(
                l.itemIds
                  .map((id) => s.items.find((i) => i.id === id)?.hex)
                  .filter(Boolean),
              ),
            ],
            reason: explanation(l, s.items, context),
          }))
        : fallback.map((l, k) => ({ ...l, title: titles[k], engine: "rules" })),
    metrics = stats(s.items, s.history),
    unused = s.items.filter((i) => daysSince(i.lastWorn) >= 60),
    learned = s.feedback.filter((f) => f.vector?.length === 384).length;
  function run(c = context, requiredId) {
    ai.generate(s.items, c, s.feedback, requiredId);
  }
  function vote(look, accepted) {
    update((p) => ({
      feedback: [
        ...p.feedback,
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          itemIds: look.items.map((i) => i.id),
          accepted,
          mood: context.mood,
          ...(look.vector ? { vector: look.vector } : {}),
          engine: look.engine || "rules",
        },
      ],
    }));
    notify(
      look.vector
        ? "Preference recorded. Your local preference model will learn from this on the next edit."
        : "Preference saved for starter suggestions. Use local AI to train the neural preference layer.",
    );
  }
  function wear(look) {
    const now = new Date().toISOString();
    update((p) => ({
      items: p.items.map((i) =>
        look.items.some((g) => g.id === i.id)
          ? { ...i, lastWorn: now, wears: i.wears + 1 }
          : i,
      ),
      history: [
        ...p.history,
        {
          id: crypto.randomUUID(),
          type: "worn",
          date: now,
          title: look.title,
          itemIds: look.items.map((i) => i.id),
          mood: context.mood,
        },
      ],
      feedback: [
        ...p.feedback,
        {
          id: crypto.randomUUID(),
          date: now,
          itemIds: look.items.map((i) => i.id),
          accepted: true,
          mood: context.mood,
          ...(look.vector ? { vector: look.vector } : {}),
          engine: look.engine || "rules",
        },
      ],
    }));
    setModal(null);
    notify("Outfit logged. Your wardrobe story just got another page.");
  }
  function save(look) {
    const ids = look.items.map((i) => i.id);
    if (s.saved.some((l) => l.itemIds.join("|") === ids.join("|")))
      return notify("Already in your saved edits.");
    update((p) => ({
      saved: [
        ...p.saved,
        {
          id: crypto.randomUUID(),
          title: look.title,
          itemIds: ids,
          date: new Date().toISOString(),
          mood: context.mood,
        },
      ],
    }));
    notify("Saved to your edits.");
  }
  async function getWeather() {
    if (!navigator.geolocation)
      return notify(
        "Location is unavailable. Set temperature in your check-in.",
      );
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try {
          const r = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude.toFixed(2)}&longitude=${p.coords.longitude.toFixed(2)}&current=temperature_2m&timezone=auto`,
          );
          if (!r.ok) throw Error();
          const d = await r.json(),
            temp = Math.round(d.current.temperature_2m);
          if (!Number.isFinite(temp)) throw Error();
          setWeather({ temp, live: true });
          if (s.checkin) {
            update({ checkin: { ...s.checkin, temp } });
            ai.clear();
          }
          notify("Local temperature updated. Location was not saved.");
        } catch {
          notify(
            "Weather could not load. Manual temperature is still available.",
          );
        }
      },
      () =>
        notify(
          "Location permission was not granted. Set temperature manually.",
        ),
    );
  }
  function card(l, k) {
    return (
      <article className="look-card" key={l.id}>
        <div className="look-top">
          <span className="mono">EDIT / 0{k + 1}</span>
          <button
            className="icon-button"
            aria-label={`Save ${l.title}`}
            onClick={() => save(l)}
          >
            <BookmarkSimple size={20} />
          </button>
        </div>
        <button
          className="look-photo"
          onClick={() => setModal({ type: "look", look: l })}
          aria-label={`Open ${l.title}`}
        >
          <OutfitArt items={l.items} />
          <span className="open-circle">
            <ArrowUpRight size={20} />
          </span>
        </button>
        <div className="look-caption">
          <div className="look-label">
            <span
              className={`engine-tag ${l.engine === "neural" ? "neural" : ""}`}
            >
              {l.engine === "neural" ? (
                <>
                  <Cpu size={12} /> NEURAL EDIT
                </>
              ) : (
                <>STARTER EDIT · RULES</>
              )}
            </span>
            {l.items.some((i) => daysSince(i.lastWorn) >= 60) && (
              <span className="reuse-tag">
                <Leaf size={12} /> Rediscovered
              </span>
            )}
          </div>
          <h3>{l.title}</h3>
          <p>{l.reason}</p>
          <div className="look-bottom">
            <div className="swatches">
              {l.palette.map((c) => (
                <span key={c} style={{ background: c }} title={c} />
              ))}
            </div>
            <button
              className="text-link"
              onClick={() => setModal({ type: "look", look: l })}
            >
              See the pieces <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </article>
    );
  }
  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <aside className="sidebar">
        <button className="logo" onClick={() => go("today")}>
          moodrobe
          <span className="logo-dot" />
        </button>
        <span className="sidebar-caption mono">A LITTLE MORE YOU.</span>
        <nav aria-label="Main navigation">
          {[
            ["today", "Your daily edit", House],
            ["wardrobe", "Your wardrobe", CoatHanger],
            ["looks", "Saved & diary", BookmarkSimple],
            ["rewear", "Wear it again", Leaf],
            ["lab", "Inside the AI", Cpu],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              aria-current={page === id ? "page" : undefined}
              onClick={() => go(id)}
            >
              <Icon size={20} weight={page === id ? "fill" : "regular"} />
              <span>{label}</span>
              {id === "lab" && <span className="lab-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <span className="status-dot" />
            <span className="mono">LOCAL BY DESIGN</span>
            <p>
              Your clothes. Your device.
              <br />
              No cloud wardrobe.
            </p>
          </div>
          <button
            className="profile-button"
            onClick={() => setModal({ type: "settings" })}
            aria-label="Profile and privacy"
          >
            <span className="avatar">{s.name[0]?.toUpperCase() || "M"}</span>
            <span>
              {s.name}
              <small>Your private space</small>
            </span>
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </aside>
      <div className="app-shell">
        <header className="topbar">
          <div>
            <span className="mono">PERSONAL STYLE STUDIO</span>
            <span className="topbar-slash">/</span>
            <span className="topbar-page">
              {page === "today"
                ? "The daily edit"
                : page === "lab"
                  ? "The research room"
                  : page === "wardrobe"
                    ? "The wardrobe"
                    : page === "rewear"
                      ? "The second chapter"
                      : "The collection"}
            </span>
          </div>
          <div>
            <button className="weather" onClick={getWeather}>
              <CloudSun size={18} />
              {s.checkin?.temp ?? weather.temp}°
              <span>{weather.live ? "Local weather" : "Set weather"}</span>
            </button>
            <button
              className="mobile-profile avatar"
              aria-label="Profile and privacy"
              onClick={() => setModal({ type: "settings" })}
            >
              {s.name[0]?.toUpperCase()}
            </button>
          </div>
        </header>
        <main id="main">
          {storeError && (
            <div role="alert" className="alert">
              Changes could not be saved. Export a backup from your profile
              before closing.
            </div>
          )}
          {page === "today" && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="hero-kicker">
                    <span className="small-star">✳</span>
                    <span className="mono">STYLE STARTS WITH A FEELING.</span>
                  </div>
                  <h1>
                    Wear your
                    <br />
                    <span>state of mind.</span>
                  </h1>
                  <p>
                    Good morning, {s.name}. A new way to see the clothes you
                    already own. Fewer decisions. More you.
                  </p>
                  <button
                    className="button black"
                    onClick={() => setModal({ type: "checkin" })}
                  >
                    Build my daily edit <ArrowUpRight size={19} />
                  </button>
                  <div className="hero-foot mono">NO NEW CLOTHES REQUIRED.</div>
                </div>
                <div
                  className="hero-board"
                  aria-label="AI-generated sample capsule wardrobe"
                >
                  <span className="board-sticker mono">
                    AI-GENERATED SAMPLE / 01
                  </span>
                  <div className="hero-piece hero-knit">
                    <Garment
                      item={
                        s.items.find((i) => i.id === "demo-0") ||
                        seedWardrobe()[0]
                      }
                    />
                  </div>
                  <div className="hero-piece hero-jeans">
                    <Garment
                      item={
                        s.items.find((i) => i.id === "demo-7") ||
                        seedWardrobe()[7]
                      }
                    />
                  </div>
                  <div className="hero-piece hero-shoes">
                    <Garment
                      item={
                        s.items.find((i) => i.id === "demo-10") ||
                        seedWardrobe()[10]
                      }
                    />
                  </div>
                  <span className="board-note">
                    familiar pieces,
                    <br />
                    <b>new possibilities.</b>
                  </span>
                  <span className="board-id mono">MR / EVERYDAY STUDY 01</span>
                </div>
              </section>
              <section className="checkin-bar">
                <div className="checkin-lead">
                  <span className="mono">01 / TUNE IN</span>
                  <h2>How’s your inner weather?</h2>
                </div>
                <div className="mood-list">
                  {moods.map((m, k) => {
                    const Icon = icons[k];
                    return (
                      <button
                        key={m.id}
                        className={
                          context.mood === m.id && s.checkin ? "chosen" : ""
                        }
                        onClick={() =>
                          setModal({ type: "checkin", mood: m.id })
                        }
                      >
                        <span style={{ "--mood": m.color }}>
                          <Icon size={22} />
                        </span>
                        {m.short}
                        <ArrowUpRight size={13} />
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="intent-panel">
                <div className="intent-copy">
                  <span className="mono">
                    <Cpu size={14} /> YOUR LOCAL AI STYLIST
                  </span>
                  <h2>
                    A feeling is a starting point.
                    <br />
                    Tell us the rest.
                  </h2>
                  <p>
                    A real sentence-embedding model reads your context and ranks
                    combinations of your own clothes. It runs on your device.
                  </p>
                </div>
                <div className="intent-controls">
                  <label htmlFor="daily-intent">
                    What does today look like?
                  </label>
                  <textarea
                    id="daily-intent"
                    disabled={ai.status === "loading"}
                    maxLength={500}
                    value={context.intent || ""}
                    onChange={(e) => {
                      update({
                        checkin: {
                          ...context,
                          intent: e.target.value,
                          date: new Date().toISOString(),
                        },
                      });
                      if (ai.status === "ready") ai.clear();
                    }}
                    placeholder="A gallery visit, a long day on campus, dinner with friends…"
                  />
                  <div className="intent-action">
                    <span className="mono">
                      {ai.status === "loading"
                        ? `${ai.stage} ${ai.progress ? ai.progress + "%" : ""}`
                        : "~23 MB MODEL · NO API KEY"}
                    </span>
                    <button
                      className="button orange"
                      disabled={ai.status === "loading" || !s.items.length}
                      onClick={() => run()}
                    >
                      {ai.status === "loading" ? (
                        <>
                          <span className="spinner" /> Thinking locally…
                        </>
                      ) : (
                        <>
                          <Sparkle size={18} />{" "}
                          {ai.status === "ready"
                            ? "Refresh neural edit"
                            : "Create with local AI"}
                        </>
                      )}
                    </button>
                  </div>
                  {ai.status === "loading" && (
                    <progress
                      aria-label="Model loading progress"
                      max="100"
                      value={ai.progress}
                    />
                  )}
                  <p className="micro">
                    First use downloads the model and inference runtime from
                    this site. Clothing descriptions stay in this browser. Speed
                    depends on your device.
                  </p>
                  {ai.error && (
                    <p role="alert" className="error">
                      {ai.error}{" "}
                      <button className="text-link" onClick={() => run()}>
                        Try again
                      </button>
                    </p>
                  )}
                </div>
              </section>
              <section className="edit-section">
                <div className="section-heading">
                  <div>
                    <span className="mono">02 / THE POSSIBILITIES</span>
                    <h2>
                      {ai.status === "ready"
                        ? "Your mood. Your wardrobe. Your edit."
                        : "A few ways to make it yours."}
                    </h2>
                  </div>
                  <button
                    className="text-link"
                    onClick={() =>
                      ai.status === "ready"
                        ? run()
                        : (setRound((r) => r + 1),
                          notify(
                            "A different starter edit. Enable local AI for neural ranking.",
                          ))
                    }
                  >
                    <ArrowsClockwise size={16} /> Another perspective
                  </button>
                </div>
                <div className="edit-context">
                  <span>{moods.find((m) => m.id === context.mood)?.short}</span>
                  <span>{context.occasion}</span>
                  <span>{context.temp}°C</span>
                  <button onClick={() => setModal({ type: "checkin" })}>
                    Adjust your day <SlidersHorizontal size={13} />
                  </button>
                  <span className="source-note">
                    {ai.status === "ready"
                      ? `${ai.meta.candidates} combinations evaluated · ${ai.meta.trainedExamples} learning examples`
                      : "Starter suggestions use transparent rules. AI is not active yet."}
                  </span>
                </div>
                {looks.length ? (
                  <div className="look-grid">{looks.map(card)}</div>
                ) : (
                  <Empty
                    icon={CoatHanger}
                    title="An edit needs a few pieces."
                    text="Add a top, a bottom and shoes, or a dress and shoes. Everything we suggest will come from your wardrobe."
                    action="Add a piece"
                    onClick={() => setModal({ type: "add" })}
                  />
                )}
                <p className="image-disclosure">
                  {s.items.some((i) => i.demo)
                    ? "Sample wardrobe photographs are AI-generated, unbranded demonstration assets. Your uploaded photographs replace them in your own wardrobe."
                    : ""}
                </p>
              </section>
              <section className="rewear-banner">
                <div className="rewear-mark">
                  <Leaf size={35} weight="light" />
                </div>
                <div>
                  <span className="mono">
                    THE NEXT GREAT FIND MIGHT ALREADY BE YOURS.
                  </span>
                  <h2>
                    {unused.length
                      ? `${unused.length} pieces. A second chance.`
                      : "A wardrobe with more stories to tell."}
                  </h2>
                  <p>
                    Something you haven’t worn in a while could be the start of
                    a new favourite.
                  </p>
                </div>
                <button className="button outline" onClick={() => go("rewear")}>
                  See what’s waiting <ArrowUpRight size={18} />
                </button>
              </section>
            </>
          )}
          {page === "wardrobe" && (
            <>
              <PageHeading
                kicker="THE ORIGINAL COLLECTION"
                title={
                  <>
                    Your wardrobe.
                    <br />
                    <span>Not a shopping list.</span>
                  </>
                }
                text="A little visibility changes everything. Add what you own, then find new ways to wear it."
                action={
                  <button
                    className="button black"
                    onClick={() => setModal({ type: "add" })}
                  >
                    <Plus size={18} /> Add a piece
                  </button>
                }
              />
              <div className="wardrobe-toolbar">
                <div className="filter-tabs">
                  {categories.map((c) => (
                    <button
                      key={c}
                      aria-pressed={filter === c}
                      className={filter === c ? "active" : ""}
                      onClick={() => setFilter(c)}
                    >
                      {c}
                      {c === "All" && <small>{s.items.length}</small>}
                    </button>
                  ))}
                </div>
                <label className="search">
                  <MagnifyingGlass size={17} />
                  <input
                    aria-label="Search wardrobe"
                    placeholder="Find a piece…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              {s.items.some((i) => i.demo) && (
                <div className="notice">
                  <Info size={17} />
                  <p>
                    These sample photographs are AI-generated. Add your own
                    photos for a personal wardrobe.
                  </p>
                  <button
                    className="text-link"
                    onClick={() => setModal({ type: "clear-demo" })}
                  >
                    Remove samples
                  </button>
                </div>
              )}
              <div className="wardrobe-grid">
                {s.items
                  .filter(
                    (i) =>
                      (filter === "All" || filter === i.category) &&
                      i.name.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((i) => (
                    <button
                      key={i.id}
                      className="wardrobe-card"
                      onClick={() => setModal({ type: "item", item: i })}
                    >
                      <div className="wardrobe-image">
                        <Garment item={i} />
                        <span className="wardrobe-index mono">
                          {i.demo ? "SAMPLE" : "OWNED"}
                        </span>
                        {i.available === false && (
                          <span className="availability">Unavailable</span>
                        )}
                        {daysSince(i.lastWorn) >= 60 && (
                          <span className="rewear-chip">
                            <Leaf size={12} /> Ready for a return
                          </span>
                        )}
                      </div>
                      <div>
                        <h3>{i.name}</h3>
                        <span
                          style={{ background: i.hex }}
                          className="colour-dot"
                        />
                      </div>
                      <p>
                        {i.category} / worn {i.wears} times
                      </p>
                    </button>
                  ))}
                <button
                  className="add-card"
                  onClick={() => setModal({ type: "add" })}
                >
                  <Plus size={35} weight="light" />
                  <span>
                    One more piece.
                    <br />
                    Many more possibilities.
                  </span>
                </button>
              </div>
            </>
          )}
          {page === "looks" && (
            <>
              <PageHeading
                kicker="A PERSONAL STYLE ARCHIVE"
                title={
                  <>
                    Some edits
                    <br />
                    <span>are worth keeping.</span>
                  </>
                }
                text="Save the combinations that feel right. Plan a little. Leave room for the unexpected."
              />
              <div className="filter-tabs collection-tabs">
                {[
                  ["saved", "Saved edits", s.saved.length],
                  ["plans", "Planned", s.plans.length],
                  ["history", "Wear diary", s.history.length],
                ].map(([id, t, n]) => (
                  <button
                    key={id}
                    className={collectionTab === id ? "active" : ""}
                    onClick={() => setCollectionTab(id)}
                  >
                    {t}
                    <small>{n}</small>
                  </button>
                ))}
              </div>
              {collectionTab === "saved" &&
                (s.saved.length ? (
                  <div className="look-grid">
                    {s.saved.map((l, k) => {
                      const items = l.itemIds
                          .map((id) => s.items.find((i) => i.id === id))
                          .filter(Boolean),
                        look = {
                          ...l,
                          items,
                          palette: [...new Set(items.map((i) => i.hex))],
                          reason: "A combination you chose to come back to.",
                          engine: "saved",
                        };
                      return (
                        <div key={l.id}>
                          {card(look, k)}
                          <button
                            className="text-link delete"
                            onClick={() => {
                              update((p) => ({
                                saved: p.saved.filter((x) => x.id !== l.id),
                              }));
                              notify("Removed from saved edits.");
                            }}
                          >
                            <Trash size={14} /> Remove saved edit
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Empty
                    icon={BookmarkSimple}
                    title="Your favourites live here."
                    text="Open an outfit and save it. It will be waiting for the days when you want one less decision."
                    action="Explore today’s edit"
                    onClick={() => go("today")}
                  />
                ))}
              {collectionTab === "plans" &&
                (s.plans.length ? (
                  <div className="timeline">
                    {[...s.plans]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((l) => (
                        <article key={l.id}>
                          <div className="calendar-tile">
                            <b>{new Date(l.date + "T12:00:00").getDate()}</b>
                            <span>
                              {new Date(
                                l.date + "T12:00:00",
                              ).toLocaleDateString("en-GB", { month: "short" })}
                            </span>
                          </div>
                          <div>
                            <h3>{l.title}</h3>
                            <p>
                              {l.itemIds
                                .map(
                                  (id) =>
                                    s.items.find((i) => i.id === id)?.name,
                                )
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <button
                            className="button small outline"
                            onClick={() => {
                              wear({
                                title: l.title,
                                items: l.itemIds
                                  .map((id) => s.items.find((i) => i.id === id))
                                  .filter(Boolean),
                              });
                              update((p) => ({
                                plans: p.plans.filter((x) => x.id !== l.id),
                              }));
                            }}
                          >
                            Wear it today
                          </button>
                          <button
                            className="icon-button"
                            aria-label="Remove planned outfit"
                            onClick={() =>
                              update((p) => ({
                                plans: p.plans.filter((x) => x.id !== l.id),
                              }))
                            }
                          >
                            <X size={18} />
                          </button>
                        </article>
                      ))}
                  </div>
                ) : (
                  <Empty
                    icon={CalendarBlank}
                    title="Make room for tomorrow."
                    text="Plan an outfit from its detail card. It will appear here on the date you choose."
                  />
                ))}
              {collectionTab === "history" &&
                (s.history.length ? (
                  <div className="diary-grid">
                    {[...s.history].reverse().map((h) => (
                      <article key={h.id}>
                        <span className="mono">
                          {new Date(h.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <h3>{h.title}</h3>
                        <div className="diary-pieces">
                          {h.itemIds
                            .map((id) => s.items.find((i) => i.id === id))
                            .filter(Boolean)
                            .map((i) => (
                              <Garment item={i} key={i.id} />
                            ))}
                        </div>
                        <p>
                          {h.itemIds
                            .map(
                              (id) =>
                                s.items.find((i) => i.id === id)?.name ||
                                "Removed piece",
                            )
                            .join(" · ")}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <Empty
                    icon={BookOpen}
                    title="The first page is yours."
                    text="Choose “Wear it today” on an outfit to start a real diary. No wear history is invented."
                  />
                ))}
            </>
          )}
          {page === "rewear" && (
            <>
              <PageHeading
                kicker="THE SECOND CHAPTER"
                title={
                  <>
                    Less forgotten.
                    <br />
                    <span>More worn.</span>
                  </>
                }
                text="A better relationship with your wardrobe starts with what is already there."
              />
              <div className="metrics">
                {[
                  [s.items.length, "pieces in your wardrobe"],
                  [metrics.utilization + "%", "worn in the last 60 days"],
                  [metrics.looks, "wears recorded by you"],
                  [unused.length, "pieces ready for a return"],
                ].map(([n, t]) => (
                  <div key={t}>
                    <strong>{n}</strong>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <p className="micro">
                Wardrobe metrics include sample history while sample pieces are
                present. No estimated carbon savings or impact claims.
              </p>
              <div className="section-heading">
                <div>
                  <span className="mono">
                    AT LEAST 60 DAYS SINCE THEIR LAST CHAPTER
                  </span>
                  <h2>It could be love, again.</h2>
                </div>
              </div>
              <div className="rewear-grid">
                {unused.map((i) => (
                  <article key={i.id}>
                    <div className="rewear-image">
                      <Garment item={i} />
                    </div>
                    <div>
                      <span className="mono">
                        {daysSince(i.lastWorn)} DAYS / STILL YOURS
                      </span>
                      <h3>{i.name}</h3>
                      <p>
                        Try a new combination, pass it on or give it a second
                        home.
                      </p>
                      <button
                        className="button outline small"
                        onClick={() => setModal({ type: "reuse", item: i })}
                      >
                        Choose its next chapter <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {!unused.length && (
                <Empty
                  icon={Leaf}
                  title="Your wardrobe is in motion."
                  text="Pieces not worn for 60 days will appear here when you open the app."
                />
              )}
              <div className="manifesto">
                <span className="mono">A DIFFERENT KIND OF MORE.</span>
                <h2>
                  More possibilities.
                  <br />
                  Not more purchases.
                </h2>
                <p>
                  Shopping never appears inside your daily recommendations.
                  Advice about adding something new is available only when you
                  ask for it.
                </p>
              </div>
            </>
          )}
          {page === "lab" && (
            <Lab
              ai={ai}
              learned={learned}
              s={s}
              run={run}
              go={go}
              notify={notify}
              update={update}
            />
          )}
        </main>
        <footer>
          <span className="logo small-logo">
            moodrobe
            <span className="logo-dot" />
          </span>
          <span className="mono">
            A PROJECT BY BENEDETTA / BUILT TO BE QUESTIONED.
          </span>
          <button
            className="text-link"
            onClick={() => setModal({ type: "settings" })}
          >
            Privacy & your data <ArrowUpRight size={14} />
          </button>
        </footer>
      </div>
      {modal && (
        <Modal
          close={() => setModal(null)}
          wide={["look", "checkin"].includes(modal.type)}
        >
          {modal.type === "checkin" ? (
            <Checkin
              state={s}
              update={update}
              context={context}
              initialMood={modal.mood}
              onSave={(c) => {
                update({ checkin: c });
                ai.clear();
                setModal(null);
                notify(
                  "Check-in saved. Your next neural edit will use this context.",
                );
              }}
            />
          ) : modal.type === "add" ? (
            <AddPiece
              onSave={(i) => {
                update((p) => ({ items: [...p.items, i] }));
                setModal(null);
                notify("Piece added. Ready for its first edit.");
              }}
            />
          ) : modal.type === "look" ? (
            <LookDetail
              look={modal.look}
              context={context}
              vote={(a) => vote(modal.look, a)}
              wear={() => wear(modal.look)}
              save={() => save(modal.look)}
              plan={() => setModal({ type: "plan", look: modal.look })}
              improve={() => setModal({ type: "improve", look: modal.look })}
            />
          ) : modal.type === "settings" ? (
            <Settings
              s={s}
              update={update}
              notify={notify}
              setModal={setModal}
            />
          ) : modal.type === "item" ? (
            <Item
              item={modal.item}
              update={update}
              notify={notify}
              close={() => setModal(null)}
              setModal={setModal}
            />
          ) : modal.type === "plan" ? (
            <Plan
              onSave={(date) => {
                update((p) => ({
                  plans: [
                    ...p.plans,
                    {
                      id: crypto.randomUUID(),
                      date,
                      title: modal.look.title,
                      itemIds: modal.look.items.map((i) => i.id),
                    },
                  ],
                }));
                setModal(null);
                notify("Your outfit is on the calendar.");
              }}
            />
          ) : modal.type === "reuse" ? (
            <>
              <span className="mono">A NEW CHAPTER</span>
              <h2>{modal.item.name}</h2>
              <div className="single-piece">
                <Garment item={modal.item} />
              </div>
              <p>
                This piece has been waiting for {daysSince(modal.item.lastWorn)}{" "}
                days.
              </p>
              <button
                className="button black full"
                onClick={() => {
                  go("today");
                  run(context, modal.item.id);
                  notify("The next neural edit will include this piece.");
                }}
              >
                Build an AI edit around it <Sparkle size={18} />
              </button>
              <div className="external-links">
                <a
                  href="https://www.vinted.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Explore resale on Vinted <ArrowUpRight size={18} />
                </a>
                <a
                  href="https://www.vestiairecollective.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Explore Vestiaire Collective <ArrowUpRight size={18} />
                </a>
                <a
                  href="https://cri.it/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ask your local Red Cross about donation{" "}
                  <ArrowUpRight size={18} />
                </a>
              </div>
              <p className="micro">
                External services, no affiliation. Check local collection
                arrangements. Nothing is sold, published or donated
                automatically.
              </p>
              <button
                className="text-link delete"
                onClick={() => setModal({ type: "remove", item: modal.item })}
              >
                I’ve passed it on: remove this piece <Trash size={15} />
              </button>
            </>
          ) : modal.type === "improve" ? (
            <>
              <span className="mono">ASKED BY YOU, NEVER PUSHED BY US</span>
              <h2>
                A small change.
                <br />A new perspective.
              </h2>
              <p>
                Before buying, try a different proportion: roll a sleeve, tuck a
                shirt, switch a layer or add an accessory you already own.
              </p>
              <div className="notice">
                <Leaf size={22} />
                <p>
                  A small{" "}
                  {modal.look.items.some((i) => i.color === "brown")
                    ? "ivory or gold-toned"
                    : "tan or warm neutral"}{" "}
                  detail can bring this palette together. Start in your
                  wardrobe.
                </p>
              </div>
              <p>
                If you decide to add something, look for a piece you can combine
                with at least three outfits. Consider second hand first.
              </p>
              <a
                className="button outline full"
                href="https://www.vinted.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Explore second hand <ArrowUpRight size={17} />
              </a>
              <p className="micro">
                This is editorial advice, not an AI-generated shopping
                recommendation. No partners, commissions or invented discounts.
              </p>
            </>
          ) : ["remove", "reset", "clear-demo"].includes(modal.type) ? (
            <>
              <span className="mono">MAKE SOME SPACE</span>
              <h2>
                {modal.type === "reset"
                  ? "Delete your local data?"
                  : modal.type === "clear-demo"
                    ? "Start with your own pieces?"
                    : "Remove this piece?"}
              </h2>
              <p>
                {modal.type === "reset"
                  ? "Your wardrobe, photos, check-ins, preferences and diary will be deleted from this browser. Export a backup first if you want a copy."
                  : modal.type === "clear-demo"
                    ? "Only sample pieces and saved/planned edits containing them will be removed. Your own photographs remain."
                    : `“${modal.item.name}” will be removed. Previous diary entries remain without its photograph.`}
              </p>
              <button
                className="button danger full"
                onClick={() => {
                  if (modal.type === "reset")
                    update({ ...initial(), items: [], welcomed: true });
                  else {
                    const ids =
                      modal.type === "clear-demo"
                        ? s.items.filter((i) => i.demo).map((i) => i.id)
                        : [modal.item.id];
                    update((p) => ({
                      items: p.items.filter((i) => !ids.includes(i.id)),
                      saved: p.saved.filter(
                        (l) => !l.itemIds.some((id) => ids.includes(id)),
                      ),
                      plans: p.plans.filter(
                        (l) => !l.itemIds.some((id) => ids.includes(id)),
                      ),
                    }));
                  }
                  setModal(null);
                  ai.clear();
                  notify("Your local data has been updated.");
                }}
              >
                Confirm deletion
              </button>
              <button
                className="button outline full"
                onClick={() => setModal(null)}
              >
                Keep it for now
              </button>
            </>
          ) : null}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={19} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
function explanation(l, items, c) {
  const names = l.itemIds
      .map((id) => items.find((i) => i.id === id))
      .filter(Boolean),
    less = names.find((i) => daysSince(i.lastWorn) >= 60);
  return `${less ? `${less.name} gets another chapter. ` : ""}Selected by semantic similarity to your ${moods.find((m) => m.id === c.mood)?.short.toLowerCase()} brief${l.personal !== 0 ? " and your learned preferences" : ""}. You make the final call.`;
}
function OutfitArt({ items }) {
  return (
    <div className={`outfit-art count-${items.length}`}>
      {items.map((i, k) => (
        <div
          key={i.id}
          className={`art-piece art-${k} cat-${i.category.toLowerCase()}`}
        >
          <Garment item={i} />
        </div>
      ))}
    </div>
  );
}
function PageHeading({ kicker, title, text, action }) {
  return (
    <section className="page-heading">
      <div>
        <span className="mono">{kicker}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </section>
  );
}
function Empty({ icon: Icon, title, text, action, onClick }) {
  return (
    <div className="empty">
      <Icon size={38} weight="light" />
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="button black" onClick={onClick}>
          {action}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
function Modal({ children, close, wide }) {
  const ref = useRef();
  useEffect(() => {
    const prev = document.activeElement;
    const handler = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const els = ref.current?.querySelectorAll(
          "button:not(:disabled),input:not([type=hidden]),select,textarea,a[href]",
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Moodrobe studio"
        tabIndex={-1}
        ref={ref}
      >
        <button
          className="icon-button close"
          onClick={close}
          aria-label="Close dialog"
        >
          <X size={23} />
        </button>
        {children}
      </section>
    </div>
  );
}
function Checkin({ state, update, context, initialMood, onSave }) {
  const [mood, setMood] = useState(initialMood || context.mood),
    [values, setValues] = useState(() => {
      const m = moods.find((x) => x.id === (initialMood || context.mood));
      return { energy: m.energy, valence: m.valence, stress: m.stress };
    }),
    [occasion, setOccasion] = useState(context.occasion),
    [temp, setTemp] = useState(context.temp),
    [tab, setTab] = useState("mood"),
    [error, setError] = useState("");
  return (
    <>
      <span className="mono">A FIFTEEN-SECOND PAUSE</span>
      <h2>
        Before you get dressed,
        <br />
        <span>check in with yourself.</span>
      </h2>
      <p>
        Your own account of how you feel is the starting point. There is no
        right answer.
      </p>
      <div className="filter-tabs modal-tabs">
        <button
          className={tab === "mood" ? "active" : ""}
          onClick={() => setTab("mood")}
        >
          My check-in
        </button>
        <button
          className={tab === "signals" ? "active" : ""}
          onClick={() => setTab("signals")}
        >
          Optional signals <small>EXPERIMENTAL</small>
        </button>
      </div>
      {tab === "mood" ? (
        <>
          <div className="checkin-moods">
            {moods.map((m, k) => {
              const Icon = icons[k];
              return (
                <button
                  key={m.id}
                  aria-pressed={mood === m.id}
                  className={mood === m.id ? "selected" : ""}
                  onClick={() => {
                    setMood(m.id);
                    setValues({
                      energy: m.energy,
                      valence: m.valence,
                      stress: m.stress,
                    });
                  }}
                >
                  <Icon size={23} />
                  {m.label}
                  {mood === m.id && <Check size={17} />}
                </button>
              );
            })}
          </div>
          <div className="sliders">
            {[
              ["energy", "Energy", "Low", "High"],
              ["valence", "Emotional tone", "Low", "Positive"],
              ["stress", "Tension", "Relaxed", "Tense"],
            ].map(([id, label, l, r]) => (
              <label key={id}>
                <span>
                  {label}
                  <b>{values[id]} / 100</b>
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={values[id]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [id]: +e.target.value }))
                  }
                />
                <small>
                  {l}
                  <span>{r}</span>
                </small>
              </label>
            ))}
          </div>
          <div className="form-row">
            <label>
              What’s the occasion?
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
              >
                {[
                  "An everyday kind of day",
                  "Work / campus",
                  "An occasion",
                  "Out and about",
                ].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
            <label>
              Outside temperature (°C)
              <input
                type="number"
                value={temp}
                min="-20"
                max="50"
                onChange={(e) => setTemp(e.target.value)}
              />
            </label>
          </div>
        </>
      ) : (
        <SignalTools consents={state.consents} update={update} />
      )}
      <button
        className="button black full"
        onClick={() => {
          if (
            temp === "" ||
            !Number.isFinite(+temp) ||
            +temp < -20 ||
            +temp > 50
          ) {
            setError("Choose a temperature between −20 and 50°C.");
            setTab("mood");
            return;
          }
          onSave({
            ...context,
            mood,
            ...values,
            occasion,
            temp: +temp,
            date: new Date().toISOString(),
            source: "self-report",
          });
        }}
      >
        Save my check-in <ArrowRight size={18} />
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <p className="micro">
        <Lock size={12} /> Only your declared check-in is saved. The AI does not
        infer your emotions from biometrics.
      </p>
    </>
  );
}
function SignalTools({ consents, update }) {
  const [camOn, setCamOn] = useState(false),
    [recording, setRecording] = useState(false),
    [audio, setAudio] = useState(null),
    [rr, setRr] = useState(""),
    [hrv, setHrv] = useState(null),
    [error, setError] = useState("");
  const camera = useRef(),
    microphone = useRef(),
    video = useRef(),
    recorder = useRef(),
    url = useRef(),
    alive = useRef(true),
    permission = useRef(consents);
  permission.current = consents;
  useEffect(
    () => () => {
      alive.current = false;
      camera.current?.getTracks().forEach((t) => t.stop());
      microphone.current?.getTracks().forEach((t) => t.stop());
      if (recorder.current?.state === "recording") {
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      if (url.current) URL.revokeObjectURL(url.current);
    },
    [],
  );
  useEffect(() => {
    if (camOn && video.current) {
      video.current.srcObject = camera.current;
      video.current.play().catch(() => {});
    }
  }, [camOn]);
  function revoke(id) {
    if (id === "face") {
      camera.current?.getTracks().forEach((t) => t.stop());
      setCamOn(false);
    }
    if (id === "voice") {
      if (recorder.current?.state === "recording") {
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      microphone.current?.getTracks().forEach((t) => t.stop());
      setRecording(false);
      if (url.current) URL.revokeObjectURL(url.current);
      url.current = null;
      setAudio(null);
    }
    if (id === "hrv") {
      setRr("");
      setHrv(null);
    }
  }
  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (!alive.current || !permission.current.face) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      camera.current = stream;
      setCamOn(true);
    } catch {
      setError(
        "Camera unavailable or permission denied. Your manual check-in still works.",
      );
    }
  }
  async function record() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current || !permission.current.voice) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      microphone.current = stream;
      const chunks = [],
        r = new MediaRecorder(stream);
      recorder.current = r;
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (!alive.current) return;
        if (url.current) URL.revokeObjectURL(url.current);
        url.current = URL.createObjectURL(
          new Blob(chunks, { type: r.mimeType }),
        );
        setAudio(url.current);
        setRecording(false);
      };
      r.start();
      setRecording(true);
      setTimeout(() => {
        if (r.state === "recording") r.stop();
      }, 5000);
    } catch {
      setError(
        "Microphone unavailable or permission denied. Continue without voice.",
      );
    }
  }
  return (
    <div className="signals">
      <div className="notice">
        <Info size={19} />
        <p>
          Exploratory tools, not emotion detectors. None of these signals enters
          the outfit model. Photos, recordings and RR intervals are not saved.
        </p>
      </div>
      {[
        [
          "face",
          "A moment in the mirror",
          Camera,
          "A live local mirror. No face recognition, photograph storage or facial-emotion prediction.",
        ],
        [
          "voice",
          "A few words to yourself",
          Microphone,
          "Record five seconds and listen back. No transcription, vocal inference or uploaded audio.",
        ],
        [
          "hrv",
          "Your RR intervals",
          Heart,
          "Calculate RMSSD from existing measurements. No wearable connection or emotional/clinical interpretation.",
        ],
      ].map(([id, title, Icon, description]) => (
        <article key={id} className="signal">
          <div>
            <Icon size={22} />
            <h3>{title}</h3>
            <label className="toggle">
              <input
                type="checkbox"
                aria-label={`Consent: ${title}`}
                checked={consents[id]}
                onChange={(e) => {
                  update({ consents: { ...consents, [id]: e.target.checked } });
                  if (!e.target.checked) revoke(id);
                }}
              />
              <span />
            </label>
          </div>
          <p>{description}</p>
          {consents[id] && (
            <>
              {id === "face" &&
                (camOn ? (
                  <>
                    <video
                      ref={video}
                      muted
                      playsInline
                      className="camera-preview"
                    />
                    <button
                      className="button outline small"
                      onClick={() => revoke("face")}
                    >
                      Stop camera
                    </button>
                  </>
                ) : (
                  <button
                    className="button outline small"
                    onClick={startCamera}
                  >
                    Open local mirror
                  </button>
                ))}
              {id === "voice" && (
                <>
                  <button
                    className="button outline small"
                    onClick={record}
                    disabled={recording}
                  >
                    {recording ? "Recording… (5 s)" : "Record five seconds"}
                  </button>
                  {audio && <audio controls src={audio} />}
                </>
              )}
              {id === "hrv" && (
                <>
                  <textarea
                    aria-label="RR intervals"
                    placeholder="800, 820, 810… at least 20 intervals in milliseconds"
                    value={rr}
                    onChange={(e) => setRr(e.target.value)}
                  />
                  <button
                    className="button outline small"
                    onClick={() => {
                      try {
                        setHrv(
                          rmssd(
                            rr
                              .trim()
                              .split(/[\s,;]+/)
                              .map(Number),
                          ).toFixed(1),
                        );
                        setError("");
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                  >
                    Calculate RMSSD
                  </button>
                  {hrv && (
                    <p>
                      RMSSD: <b>{hrv} ms</b>. Calculated locally, not saved.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </article>
      ))}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
const colours = [
  ["cream", "Ivory", "#e8dfcc"],
  ["beige", "Sand", "#c7b99f"],
  ["brown", "Brown", "#85674d"],
  ["black", "Black", "#363634"],
  ["white", "White", "#f3efe4"],
  ["blue", "Blue", "#7395b1"],
  ["sage", "Sage", "#9ca98c"],
  ["rust", "Terracotta", "#b9765d"],
  ["pink", "Pink", "#d1a0a6"],
];
const shapes = {
  Tops: "shirt",
  Trousers: "pants",
  Skirts: "skirt",
  Dresses: "dress",
  Layers: "blazer",
  Shoes: "sneakers",
  Accessories: "bag",
};
function AddPiece({ onSave }) {
  const [name, setName] = useState(""),
    [category, setCategory] = useState("Tops"),
    [colour, setColour] = useState("cream"),
    [hex, setHex] = useState("#e8dfcc"),
    [description, setDescription] = useState(""),
    [season, setSeason] = useState("all"),
    [formality, setFormality] = useState(1),
    [image, setImage] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [estimated, setEstimated] = useState(false);
  const file = useRef();
  async function load(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
      f.size > 15 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG or WebP photograph under 15 MB.");
      return;
    }
    setBusy(true);
    try {
      const bmp = await createImageBitmap(f),
        c = document.createElement("canvas"),
        scale = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
      c.width = Math.max(1, Math.round(bmp.width * scale));
      c.height = Math.max(1, Math.round(bmp.height * scale));
      const x = c.getContext("2d");
      x.drawImage(bmp, 0, 0, c.width, c.height);
      setImage(c.toDataURL("image/jpeg", 0.8));
      const pixels = x.getImageData(
        Math.floor(c.width * 0.3),
        Math.floor(c.height * 0.3),
        Math.max(1, Math.floor(c.width * 0.4)),
        Math.max(1, Math.floor(c.height * 0.4)),
      ).data;
      let rgb = [0, 0, 0],
        n = 0;
      for (let k = 0; k < pixels.length; k += 16) {
        rgb = rgb.map((v, j) => v + pixels[k + j]);
        n++;
      }
      rgb = rgb.map((v) => v / n);
      const nearest = colours
        .map((a) => ({
          a,
          d: a[2]
            .match(/\w\w/g)
            .reduce((s, h, k) => s + (parseInt(h, 16) - rgb[k]) ** 2, 0),
        }))
        .sort((a, b) => a.d - b.d)[0].a;
      setColour(nearest[0]);
      setHex(nearest[2]);
      setEstimated(true);
      if (!name)
        setName(
          f.name
            .replace(/\.[^.]+$/, "")
            .replace(/[_-]/g, " ")
            .slice(0, 60),
        );
      bmp.close();
    } catch {
      setError("This photo could not be read. Please choose another file.");
    }
    setBusy(false);
  }
  return (
    <>
      <span className="mono">ONE PIECE, MANY POSSIBILITIES</span>
      <h2>
        Meet your next
        <br />
        <span>old favourite.</span>
      </h2>
      <p>
        A clear photograph and a few details are all it takes. The neural model
        reads the description, not the photograph.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: crypto.randomUUID(),
            name: name.trim(),
            category,
            color: colour,
            hex,
            description: description.trim(),
            season,
            formality: +formality,
            image,
            shape: shapes[category],
            lastWorn: new Date().toISOString(),
            wears: 0,
            createdAt: new Date().toISOString(),
            demo: false,
            available: true,
          });
        }}
      >
        <input
          ref={file}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={load}
        />
        <button
          className={`upload-area ${image ? "has-photo" : ""}`}
          type="button"
          onClick={() => file.current.click()}
        >
          {image ? (
            <img src={image} alt="Piece preview" />
          ) : (
            <>
              <Camera size={31} weight="light" />
              <span>
                {busy ? "Preparing photograph…" : "Upload or take a photograph"}
              </span>
              <small>JPG / PNG / WEBP — UP TO 15 MB</small>
            </>
          )}
        </button>
        <label>
          Piece name
          <input
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="That shirt you always come back to"
          />
        </label>
        <div className="form-row">
          <label>
            Category
            <select
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.slice(1).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Season
            <select value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="all">Year-round</option>
              <option value="summer">Spring / summer</option>
              <option value="winter">Autumn / winter</option>
            </select>
          </label>
        </div>
        <label>
          Describe the feel
          <input
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Soft linen, oversized fit, easy to layer…"
          />
        </label>
        <p className="micro">
          This description helps the embedding model understand your piece.
        </p>
        <div className="colour-picker">
          <span>
            Colour{" "}
            {estimated && (
              <small>
                · estimated from the centre of your photo; please confirm
              </small>
            )}
          </span>
          <div>
            {colours.map(([id, label, c]) => (
              <button
                type="button"
                key={id}
                aria-label={label}
                title={label}
                aria-pressed={colour === id}
                className={colour === id ? "selected" : ""}
                style={{ background: c }}
                onClick={() => {
                  setColour(id);
                  setHex(c);
                }}
              >
                {colour === id && <Check size={15} />}
              </button>
            ))}
          </div>
        </div>
        <label>
          Style
          <select
            value={formality}
            onChange={(e) => setFormality(+e.target.value)}
          >
            <option value="1">Relaxed / casual</option>
            <option value="2">Smart casual</option>
            <option value="3">Tailored / formal</option>
          </select>
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="button black full" disabled={busy || !name.trim()}>
          Add to my wardrobe <Plus size={18} />
        </button>
        <p className="micro">
          Photographs are compressed and stored locally. Backgrounds are kept.
          Categories are confirmed by you. No photo is sent to an AI service.
        </p>
      </form>
    </>
  );
}
function LookDetail({ look, context, vote, wear, save, plan, improve }) {
  return (
    <>
      <span className="mono">
        {look.engine === "neural" ? "A NEURAL EDIT" : "YOUR PERSONAL EDIT"} /{" "}
        {look.items.length} OWNED PIECES
      </span>
      <h2>{look.title}</h2>
      <div className="look-detail">
        <div className="detail-photo">
          <OutfitArt items={look.items} />
        </div>
        <div>
          <h3>Why these pieces?</h3>
          <p>{look.reason}</p>
          <p>
            {context.occasion} · {context.temp}°C. You choose what feels right;
            colour and mood associations are design hypotheses, not
            psychological guarantees.
          </p>
          <div className="piece-list">
            {look.items.map((i) => (
              <div key={i.id}>
                <Garment item={i} />
                <span>
                  {i.name}
                  <small>{i.category}</small>
                </span>
                <span className="colour-dot" style={{ background: i.hex }} />
              </div>
            ))}
          </div>
          {look.engine === "neural" && (
            <div className="model-note">
              <Cpu size={16} />
              <span>
                384-dimensional sentence embeddings + a locally trained
                preference head. Photos are displayed, not analysed.
              </span>
            </div>
          )}
          <div className="feedback-buttons">
            <span>Does this feel like you?</span>
            <button
              className="button outline small"
              onClick={() => vote(false)}
            >
              <X size={16} /> Not today
            </button>
            <button className="button outline small" onClick={() => vote(true)}>
              <Heart size={16} /> That’s me
            </button>
          </div>
        </div>
      </div>
      <div className="action-row">
        <button className="button black" onClick={wear}>
          Wear it today <Check size={18} />
        </button>
        <button className="button outline" onClick={save}>
          Save edit <BookmarkSimple size={18} />
        </button>
        <button className="button outline" onClick={plan}>
          Plan it <CalendarBlank size={18} />
        </button>
      </div>
      <button className="text-link improve" onClick={improve}>
        I’d like advice on improving this outfit <ArrowUpRight size={16} />
      </button>
    </>
  );
}
function Item({ item, update, notify, close, setModal }) {
  const [name, setName] = useState(item.name),
    [description, setDescription] = useState(item.description || ""),
    [available, setAvailable] = useState(item.available !== false);
  return (
    <>
      <span className="mono">PART OF YOUR COLLECTION</span>
      <div className="single-piece">
        <Garment item={item} />
      </div>
      <h2>{item.name}</h2>
      <p>
        {item.category} / worn {item.wears} times
        {item.demo ? " / AI-generated sample" : ""}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update((p) => ({
            items: p.items.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    name: name.trim(),
                    description: description.trim(),
                    available,
                  }
                : i,
            ),
          }));
          close();
          notify("Piece updated. Your next AI edit will use these details.");
        }}
      >
        <label>
          Name
          <input
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Description for the AI
          <input
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />{" "}
          Available for outfits (uncheck if in the laundry)
        </label>
        <button className="button black full">Save changes</button>
      </form>
      <button
        className="button outline full"
        onClick={() => {
          update((p) => ({
            items: p.items.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    wears: i.wears + 1,
                    lastWorn: new Date().toISOString(),
                  }
                : i,
            ),
            history: [
              ...p.history,
              {
                id: crypto.randomUUID(),
                type: "worn",
                date: new Date().toISOString(),
                title: item.name,
                itemIds: [item.id],
                mood: p.checkin?.mood || null,
              },
            ],
          }));
          close();
          notify("Wear recorded in your diary.");
        }}
      >
        I wore this today <Check size={17} />
      </button>
      <button
        className="text-link delete"
        onClick={() => setModal({ type: "remove", item })}
      >
        Remove piece <Trash size={15} />
      </button>
    </>
  );
}
function Plan({ onSave }) {
  const [date, setDate] = useState(
    new Date(Date.now() + 86400000).toLocaleDateString("en-CA"),
  );
  return (
    <>
      <span className="mono">ONE LESS DECISION TOMORROW</span>
      <h2>
        Put it in
        <br />
        <span>your calendar.</span>
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(date);
        }}
      >
        <label>
          When will you wear it?
          <input
            type="date"
            required
            min={new Date().toLocaleDateString("en-CA")}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button className="button black full">
          Plan this outfit <CalendarBlank size={18} />
        </button>
      </form>
    </>
  );
}
function Settings({ s, update, notify, setModal }) {
  const [name, setName] = useState(s.name),
    [error, setError] = useState("");
  const file = useRef();
  async function restore(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      if (f.size > 64e6) throw Error("Please choose a backup under 64 MB.");
      const { validateBackup } = await import("./backup");
      const d = validateBackup(JSON.parse(await f.text()));
      update({
        ...initial(),
        ...d,
        name: typeof d.name === "string" ? d.name.slice(0, 30) : "Benedetta",
        consents: { face: false, voice: false, hrv: false },
        researchConsent: false,
        welcomed: true,
      });
      notify("Backup imported. Optional consents have been reset.");
      setError("");
    } catch (e) {
      setError(e.message);
    }
    e.target.value = "";
  }
  return (
    <>
      <span className="mono">YOUR SPACE. YOUR CHOICES.</span>
      <h2>
        A little more
        <br />
        <span>about you.</span>
      </h2>
      <label>
        Your name
        <input
          maxLength={30}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <button
        className="button black full"
        disabled={!name.trim()}
        onClick={() => {
          update({ name: name.trim() });
          notify("Name updated.");
        }}
      >
        Save name <Check size={17} />
      </button>
      <div className="settings-block">
        <h3>
          <Lock size={20} /> Privacy in practice
        </h3>
        <p>
          Your wardrobe, photos, check-ins, diary and preference examples stay
          in this browser, primarily in IndexedDB. There is no account or
          cross-device sync. Anyone using this browser profile can access them.
        </p>
        <p>
          The AI model and runtime are downloaded from this site. Clothing
          descriptions and embeddings are processed on your device, without an
          inference API. Embeddings saved with your preferences are included in
          backups. Camera, audio and RR intervals are not saved.
        </p>
        <p>
          Weather is optional: approximate coordinates are sent to Open-Meteo
          only when you request it. Hosting can retain ordinary technical access
          logs; external links have their own policies.
        </p>
        <a
          className="text-link"
          href="https://open-meteo.com/en/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          Weather service terms <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="settings-block">
        <h3>Optional signal permissions</h3>
        {[
          ["face", "Local camera mirror"],
          ["voice", "Local audio recording"],
          ["hrv", "Local RR calculation"],
        ].map(([id, label]) => (
          <label className="checkbox" key={id}>
            <input
              type="checkbox"
              checked={s.consents[id]}
              onChange={(e) =>
                update({ consents: { ...s.consents, [id]: e.target.checked } })
              }
            />
            {label}
          </label>
        ))}
        <p className="micro">
          Permission preferences never turn devices on automatically.
        </p>
      </div>
      <div className="settings-block">
        <h3>Your data is yours.</h3>
        <p>
          Export a backup before changing device. It includes your photos and
          preferences: keep it private. Importing replaces the current data.
        </p>
        <div className="action-row">
          <button
            className="button outline"
            onClick={() =>
              download("moodrobe-backup.json", JSON.stringify(s, null, 2))
            }
          >
            <Download size={17} /> Export backup
          </button>
          <button
            className="button outline"
            onClick={() => file.current.click()}
          >
            <Upload size={17} /> Import backup
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={restore}
          />
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {!s.items.some((i) => i.demo) && (
          <button
            className="text-link"
            onClick={() => {
              update((p) => ({
                items: [
                  ...p.items,
                  ...seedWardrobe().filter(
                    (i) => !p.items.some((x) => x.id === i.id),
                  ),
                ],
              }));
              notify("Sample wardrobe added. Your own pieces have been kept.");
            }}
          >
            Add a sample wardrobe <Plus size={16} />
          </button>
        )}
        <button
          className="text-link delete"
          onClick={() => setModal({ type: "reset" })}
        >
          Delete all my local data <Trash size={15} />
        </button>
      </div>
    </>
  );
}
function Lab({ ai, learned, s, run, go, notify, update }) {
  const [trial, setTrial] = useState(null),
    [chosen, setChosen] = useState(null);
  function startTrial() {
    const matched = ai.looks[0],
      ctx = s.checkin || { mood: "calm", occasion: "Work / campus", temp: 18 },
      control = recommend(s.items, ctx, [], 2).find(
        (l) => l.id !== matched?.id,
      );
    if (!matched || !control)
      return notify(
        "Generate a neural edit first, with enough pieces for different combinations.",
      );
    const actual = {
      ...matched,
      items: matched.itemIds
        .map((id) => s.items.find((i) => i.id === id))
        .filter(Boolean),
    };
    setTrial(
      Math.random() < 0.5
        ? { a: actual, b: control, matched: "a" }
        : { a: control, b: actual, matched: "b" },
    );
    setChosen(null);
  }
  const yes = s.pilot.filter((p) => p.moodPreferred).length;
  return (
    <>
      <PageHeading
        kicker="THE RESEARCH ROOM"
        title={
          <>
            Real inference.
            <br />
            <span>Open to inspection.</span>
          </>
        }
        text="A working neural recommender, a personal learning experiment, and a clear boundary between what exists and what still needs evidence."
        action={
          <span className="research-badge">
            <span className="status-dot" /> ON-DEVICE / NO API KEY
          </span>
        }
      />
      <section className="lab-hero">
        <div>
          <span className="mono">THE MODEL CARD</span>
          <h2>
            A language model for similarity.
            <br />A preference model for you.
          </h2>
          <p>
            We use a pretrained sentence encoder to turn your brief and garment
            descriptions into 384-dimensional vectors. A small logistic
            preference model learns from the outfits you accept and reject.
            Structural rules keep the results wearable: owned pieces, a complete
            outfit, and weather-appropriate layers.
          </p>
          <div className="lab-pills">
            <span>ONNX / WASM</span>
            <span>QUANTISED · Q8</span>
            <span>TEXT EMBEDDINGS</span>
            <span>LOCAL FEEDBACK LEARNING</span>
          </div>
        </div>
        <div className="neural-graphic" aria-hidden="true">
          <div className="neural-orbit orbit-1" />
          <div className="neural-orbit orbit-2" />
          <div className="neural-orbit orbit-3" />
          <div className="neural-core">
            <Cpu size={37} />
            <span className="mono">384 DIMENSIONS</span>
          </div>
          <span className="orbit-label label-1">YOUR BRIEF</span>
          <span className="orbit-label label-2">OWNED PIECES</span>
          <span className="orbit-label label-3">YOUR FEEDBACK</span>
        </div>
      </section>
      <div className="lab-metrics">
        {[
          [ai.meta?.candidates ?? "—", "combinations evaluated"],
          [384, "embedding dimensions"],
          [learned, "labelled preference examples"],
          [
            ai.meta ? `${(ai.meta.elapsedMs / 1000).toFixed(1)}s` : "—",
            "last inference, including loading",
          ],
        ].map(([n, t]) => (
          <div key={t}>
            <strong>{n}</strong>
            <span>{t}</span>
          </div>
        ))}
      </div>
      <div className="notice">
        <Info size={20} />
        <p>
          These are execution measurements, not accuracy or
          psychological-effectiveness scores. No preference accuracy is claimed.
          A few personal votes are not a validated training dataset.
        </p>
      </div>
      <section className="model-table">
        <div>
          <span className="mono">ENCODER</span>
          <h3>{MODEL_INFO.name}</h3>
          <p>
            Pretrained by the Sentence Transformers community; ONNX conversion
            by Xenova. Moodrobe does not claim to have trained this encoder.
          </p>
          <a
            href={MODEL_INFO.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            Read the source model card <ArrowUpRight size={15} />
          </a>
        </div>
        <div>
          <span className="mono">PERSONAL PREFERENCE HEAD</span>
          <h3>Learned from your choices.</h3>
          <p>
            A regularised logistic model is fitted on accepted/rejected outfit
            vectors, using up to 150 recent examples. Its weights influence the
            next neural ranking. No examples means a cold start based on
            semantic similarity.
          </p>
          {ai.meta?.trainingLoss != null && (
            <span className="training-loss mono">
              LAST TRAINING LOSS / {ai.meta.trainingLoss.toFixed(3)} · NOT
              VALIDATION ACCURACY
            </span>
          )}
        </div>
        <div>
          <span className="mono">WHAT THE MODEL SEES</span>
          <h3>Words, not your body.</h3>
          <p>
            The model reads garment names, descriptions, categories, style,
            season and your brief. Photographs are displayed as outfit imagery.
            It does not analyse your face, body, voice or the clothing images.
          </p>
        </div>
        <div>
          <span className="mono">WHAT THE MODEL CANNOT PROVE</span>
          <h3>Style is not a diagnosis.</h3>
          <p>
            Semantic similarity is an experimental proxy for relevance. It does
            not demonstrate fashion compatibility or a causal mood benefit.
            Biological emotion inference and a trained vision compatibility
            model are separate research tasks.
          </p>
        </div>
      </section>
      <section className="pipeline-section">
        <span className="mono">FOLLOW A REAL REQUEST</span>
        <h2>
          From “how I feel”
          <br />
          to “that feels like me”.
        </h2>
        <div className="pipeline">
          {[
            [
              "01",
              "Encode",
              "Your brief and clothing descriptions become semantic vectors.",
            ],
            [
              "02",
              "Assemble",
              "Build complete candidates from available pieces. Add layers for cooler days.",
            ],
            [
              "03",
              "Rank",
              "Combine semantic similarity, the learned preference score and small reuse/occasion weights.",
            ],
            [
              "04",
              "Choose",
              "Select different base combinations. Your feedback becomes a future training example.",
            ],
          ].map(([n, t, d]) => (
            <article key={n}>
              <span className="mono">{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
        <button
          className="button black"
          onClick={() => {
            go("today");
            run();
          }}
        >
          Run it with my wardrobe <ArrowUpRight size={18} />
        </button>
      </section>
      <section className="pilot-section">
        <span className="mono">A QUESTION BEFORE A CLAIM</span>
        <h2>Would you actually wear it?</h2>
        <p>
          The next research step is a 15–20 person pilot over two to three
          weeks. The case study proposes thresholds of 60% preference for
          mood-motivated outfits, 70% check-in adherence, and rediscovery of a
          forgotten piece by at least one third of participants.
        </p>
        <p>
          This local A/B interface compares a current neural suggestion and a
          rule-based control, with random display order. It illustrates
          preference collection, not a controlled study or evidence of efficacy.
        </p>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={s.researchConsent}
            onChange={(e) => {
              update({ researchConsent: e.target.checked });
              if (!e.target.checked) setTrial(null);
            }}
          />{" "}
          I consent to storing these comparison choices locally, separately from
          outfit preferences. Nothing is sent to a research server.
        </label>
        {!trial ? (
          <button
            className="button black"
            disabled={!s.researchConsent || !ai.looks.length}
            onClick={startTrial}
          >
            Start blind comparison <ArrowRight size={18} />
          </button>
        ) : !chosen ? (
          <div className="comparison">
            {["a", "b"].map((k) => (
              <button
                key={k}
                onClick={() => {
                  setChosen(k);
                  update((p) => ({
                    pilot: [
                      ...p.pilot,
                      {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        moodPreferred: k === trial.matched,
                        mood: s.checkin?.mood || "calm",
                        source: "neural-vs-rules-exploratory",
                      },
                    ],
                  }));
                }}
              >
                <span className="mono">PROPOSAL {k.toUpperCase()}</span>
                <OutfitArt items={trial[k].items} />
                <span>
                  I’d wear this <ArrowRight size={17} />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="notice">
            <CheckCircle size={23} />
            <p>
              Choice recorded. Proposal {trial.matched.toUpperCase()} used
              neural ranking. This observation is exploratory, not an
              effectiveness result.
            </p>
            <button className="text-link" onClick={startTrial}>
              Try another
            </button>
          </div>
        )}
        <div className="pilot-footer">
          <span>{s.pilot.length} local comparisons recorded.</span>
          <button
            className="text-link"
            disabled={!s.pilot.length}
            onClick={() => {
              const safe = (x) =>
                '"' +
                String(x)
                  .replace(/^[=+@\-\t\r]/, (v) => "'" + v)
                  .replace(/"/g, '""') +
                '"';
              download(
                "moodrobe-comparisons.csv",
                "id,date,neural_preferred,mood,source\n" +
                  s.pilot
                    .map((p) =>
                      [
                        p.id,
                        p.date,
                        p.moodPreferred ? 1 : 0,
                        p.mood,
                        p.source || "legacy-exploratory",
                      ]
                        .map(safe)
                        .join(","),
                    )
                    .join("\n"),
                "text/csv",
              );
            }}
          >
            Export comparison CSV <Download size={15} />
          </button>
        </div>
        {s.pilot.length > 0 && (
          <button
            className="text-link delete"
            onClick={() => {
              update({ pilot: [] });
              setTrial(null);
              notify("Comparison choices deleted.");
            }}
          >
            Delete comparison choices <Trash size={14} />
          </button>
        )}
      </section>
      <section className="evidence">
        <span className="mono">THE THINKING BEHIND THE QUESTION</span>
        <h2>
          Research inspires.
          <br />
          <span>Evidence decides.</span>
        </h2>
        {[
          [
            "Iyengar & Lepper / 2000",
            "Choice overload, with effects that depend on context.",
            "https://doi.org/10.1037/0022-3514.79.6.995",
          ],
          [
            "Adam & Galinsky / 2012",
            "Enclothed cognition: a hypothesis-generating foundation, not proof that Moodrobe works.",
            "https://doi.org/10.1016/j.jesp.2012.02.008",
          ],
          [
            "Horton, Adam & Galinsky",
            "A critical reassessment of the evidence and replication limits.",
            "https://doi.org/10.1177/01461672231182478",
          ],
          [
            "Reimers & Gurevych / 2019",
            "Sentence-BERT: sentence embeddings using Siamese BERT networks.",
            "https://arxiv.org/abs/1908.10084",
          ],
        ].map(([t, d, url]) => (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer">
            <div>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
            <ArrowUpRight size={23} />
          </a>
        ))}
      </section>
      <div className="project-credit">
        <span className="mono">CONCEPT & CASE STUDY / BENEDETTA</span>
        <p>
          Implementation developed with AI-assisted engineering. The pretrained
          encoder and inference runtime are attributed to their original
          authors. No proprietary training dataset, pilot participants or
          results have been invented.
        </p>
      </div>
    </>
  );
}
const db = await loadState(),
  local = read(),
  restored =
    db && (!local.updatedAt || db.updatedAt >= local.updatedAt)
      ? migrate({ ...initial(), ...db })
      : local;
createRoot(document.getElementById("root")).render(<App restored={restored} />);
