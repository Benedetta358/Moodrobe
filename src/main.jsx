import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  Check,
  X,
  Sun,
  CloudSun,
  Heart,
  Leaf,
  SlidersHorizontal,
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
  ChartLineUp,
  Sparkle,
  ArrowsClockwise,
  BookmarkSimple,
  CheckCircle,
  SignOut,
  Smiley,
  FlowerLotus,
  Lightning,
  Star,
  Drop,
  Question,
  House,
  BookOpen,
  Warning,
  Cloud,
  MapPin,
  Export,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "./style.css";
import Garment from "./Garment";
import { loadState, saveState } from "./storage";
import {
  moods,
  categories,
  seedWardrobe,
  recommend,
  daysSince,
  stats,
  rmssd,
} from "./domain";
const KEY = "moodrobe-v1";
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
    return s && s.version === 1 && Array.isArray(s.items)
      ? { ...initial(), ...s }
      : initial();
  } catch {
    return initial();
  }
}
const icons = [FlowerLotus, Lightning, Star, Cloud];
const dateLabel = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());
const download = (name, data, type = "application/json") => {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
function App({ restored }) {
  const [s, setS] = useState(() => restored || read()),
    [page, setPage] = useState("today"),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [storageError, setStorageError] = useState(false),
    [round, setRound] = useState(0),
    [weather, setWeather] = useState({
      temp: 18,
      label: "Meteo impostato",
      live: false,
    }),
    [filter, setFilter] = useState("Tutti"),
    [query, setQuery] = useState("");
  const toastTimer = useRef();
  useEffect(() => {
    let current = true;
    saveState(s)
      .then(() => {
        if (current) setStorageError(false);
      })
      .catch(() => {
        if (current) setStorageError(true);
      });
    return () => {
      current = false;
    };
  }, [s]);
  useEffect(() => {
    document.title = `Moodrobe — ${{ today: "Il tuo oggi", wardrobe: "Guardaroba", looks: "I tuoi outfit", impact: "Seconda vita", project: "Il progetto" }[page]}`;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);
  function notify(t) {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }
  function update(v) {
    setS((p) => {
      const next = {
        ...p,
        ...(typeof v === "function" ? v(p) : v),
        updatedAt: Math.max(Date.now(), (p.updatedAt || 0) + 1),
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* IndexedDB is the durable photo store. */
      }
      return next;
    });
  }
  function go(p) {
    setPage(p);
    setModal(null);
  }
  const active = s.checkin || {
      mood: "calm",
      energy: 30,
      valence: 55,
      stress: 65,
      occasion: "Una giornata per me",
      temp: weather.temp,
    },
    looks = recommend(
      s.items,
      { ...active, temp: active.temp ?? weather.temp },
      s.feedback,
      round,
    ),
    metrics = stats(s.items, s.history),
    unused = s.items.filter((i) => daysSince(i.lastWorn) >= 60),
    isDemo = s.items.some((i) => i.demo);
  function feedback(look, accepted) {
    update((p) => ({
      feedback: [
        ...p.feedback,
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          itemIds: look.items.map((i) => i.id),
          accepted,
          mood: active.mood,
        },
      ],
      ...(!accepted ? {} : {}),
    }));
    notify(
      accepted
        ? "Preferenza salvata. Le prossime proposte ne terranno conto."
        : "Ricevuto. Proveremo combinazioni diverse.",
    );
    if (!accepted) setRound((r) => r + 1);
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
          mood: active.mood,
        },
      ],
      feedback: [
        ...p.feedback,
        {
          id: crypto.randomUUID(),
          date: now,
          itemIds: look.items.map((i) => i.id),
          accepted: true,
          mood: active.mood,
        },
      ],
    }));
    setModal(null);
    notify("Outfit indossato! Il tuo diario è aggiornato.");
  }
  function save(look) {
    const ids = look.items.map((i) => i.id);
    if (s.saved.some((l) => l.itemIds.join("|") === ids.join("|"))) {
      notify("Questo outfit è già nella tua raccolta.");
      return;
    }
    update((p) => ({
      saved: [
        ...p.saved,
        {
          id: crypto.randomUUID(),
          title: look.title,
          itemIds: ids,
          date: new Date().toISOString(),
          mood: active.mood,
        },
      ],
    }));
    notify("Outfit aggiunto alla tua raccolta.");
  }
  async function liveWeather() {
    if (!navigator.geolocation) {
      notify(
        "Geolocalizzazione non disponibile. Puoi impostare la temperatura nel check-in.",
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude.toFixed(2)}&longitude=${pos.coords.longitude.toFixed(2)}&current=temperature_2m&timezone=auto`,
          );
          if (!r.ok) throw Error();
          const d = await r.json();
          if (!Number.isFinite(d.current?.temperature_2m)) throw Error();
          const temp = Math.round(d.current.temperature_2m);
          setWeather({ temp, label: "Meteo locale · Open-Meteo", live: true });
          if (s.checkin) update({ checkin: { ...s.checkin, temp } });
          notify("Temperatura aggiornata. La posizione non è stata salvata.");
        } catch {
          notify(
            "Meteo non raggiungibile. Imposta la temperatura nel check-in.",
          );
        }
      },
      () =>
        notify(
          "Posizione non disponibile. Puoi impostare il meteo manualmente.",
        ),
    );
  }
  function outfitCard(look, index = 0) {
    return (
      <article className="outfit-card" key={look.id}>
        <button
          className="outfit-art"
          onClick={() => setModal({ type: "outfit", look })}
          aria-label={`Esplora ${look.title}`}
        >
          <span className="look-number">LOOK 0{index + 1}</span>
          <div className="collage">
            {look.items.map((i, j) => (
              <Garment item={i} key={i.id} className={`piece p${j}`} />
            ))}
          </div>
          <span className="art-corner">
            <ArrowUpRight size={19} />
          </span>
          {look.items.some((i) => daysSince(i.lastWorn) >= 60) && (
            <span className="rediscovery">
              <Leaf size={13} /> Un capo da riscoprire
            </span>
          )}
        </button>
        <div className="outfit-info">
          <div>
            <span className="eyebrow">
              {index === 0 ? "SCELTO PER IL TUO MOOD" : "DAL TUO GUARDAROBA"}
            </span>
            <h3>{look.title}</h3>
          </div>
          <button
            className="icon-button"
            onClick={() => save(look)}
            aria-label={`Salva ${look.title}`}
          >
            <BookmarkSimple size={22} />
          </button>
        </div>
        <p className="outfit-reason">{look.reason}</p>
        <div className="outfit-footer">
          <div className="swatches">
            {look.palette.map((c) => (
              <span key={c} style={{ background: c }} title={c} />
            ))}
          </div>
          <button
            className="text-button"
            onClick={() => setModal({ type: "outfit", look })}
          >
            Scopri il look <ArrowRight size={16} />
          </button>
        </div>
      </article>
    );
  }
  return (
    <>
      <a href="#main" className="skip">
        Vai al contenuto
      </a>
      <header className="header">
        <button className="brand" onClick={() => go("today")}>
          moodrobe<span className="brand-star">✳</span>
        </button>
        <nav aria-label="Navigazione principale">
          {[
            ["today", "Il tuo oggi", House],
            ["wardrobe", "Guardaroba", CoatHanger],
            ["looks", "I tuoi outfit", SquaresFour],
            ["impact", "Seconda vita", Leaf],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => go(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="header-right">
          <button
            className={`project-link ${page === "project" ? "active" : ""}`}
            onClick={() => go("project")}
          >
            Il progetto <ArrowUpRight size={15} />
          </button>
          <button
            className="avatar"
            aria-label="Profilo e privacy"
            onClick={() => setModal({ type: "settings" })}
          >
            {s.name.slice(0, 1).toUpperCase() || "M"}
          </button>
        </div>
      </header>
      {storageError && (
        <div className="error-banner">
          Salvataggio locale non riuscito. Le ultime modifiche non sono al
          sicuro: esporta un backup dal profilo prima di chiudere.
        </div>
      )}
      <main id="main">
        {page === "today" && (
          <>
            <div className="topline">
              <span>{dateLabel}</span>
              <button onClick={liveWeather}>
                <CloudSun size={19} />
                {weather.temp}° <span>{weather.label}</span>
                <MapPin size={14} />
              </button>
            </div>
            <section className="greeting">
              <div>
                <p className="eyebrow">IL TUO ARMADIO, IN SINTONIA CON TE</p>
                <h1>
                  Buongiorno, {s.name}.<br />
                  Oggi, <em>come ti senti?</em>
                </h1>
                <p className="intro">
                  L’outfit giusto parte da te. Non da un nuovo acquisto.
                </p>
              </div>
              <div className="greeting-note">
                <span className="hand-drawn">
                  meno indecisione,
                  <br />
                  più te.
                </span>
                <div className="note-line" />
                <FlowerLotus size={38} weight="thin" />
              </div>
            </section>
            <section className="mood-section">
              <div className="section-mini">
                <span className="eyebrow">01 — UN MOMENTO PER TE</span>
                <span className="subtle">
                  <Lock size={13} /> Il tuo mood resta su questo dispositivo
                </span>
              </div>
              <div className="mood-options">
                {moods.map((m, i) => {
                  const Icon = icons[i];
                  return (
                    <button
                      key={m.id}
                      style={{ "--mood": m.color }}
                      className={`mood-option ${s.checkin?.mood === m.id ? "selected" : ""}`}
                      onClick={() => setModal({ type: "checkin", mood: m.id })}
                    >
                      <span className="mood-symbol">
                        <Icon size={28} weight="light" />
                      </span>
                      <span>{m.label}</span>
                      <ArrowUpRight size={18} />
                    </button>
                  );
                })}
              </div>
              <div className="checkin-foot">
                <p>
                  {s.checkin ? (
                    <>
                      Il tuo ultimo check-in:{" "}
                      <b>{moods.find((m) => m.id === s.checkin.mood)?.short}</b>{" "}
                      ·{" "}
                      {new Date(s.checkin.date).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  ) : (
                    "Nessuna risposta giusta. Solo il tuo punto di partenza."
                  )}
                </p>
                <button
                  className="text-button"
                  onClick={() => setModal({ type: "checkin" })}
                >
                  {s.checkin
                    ? "Aggiorna il check-in"
                    : "Preferisci un check-in guidato?"}{" "}
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>
            <section className="looks-section">
              <div className="section-title">
                <div>
                  <p className="eyebrow">02 — FATTO CON QUELLO CHE HAI</p>
                  <h2>
                    {s.checkin
                      ? "Il tuo mood, tre modi di vestirlo."
                      : "Il tuo armadio ha ancora molto da dirti."}
                  </h2>
                </div>
                <button
                  className="round-link"
                  onClick={() => {
                    setRound((r) => r + 1);
                    notify("Ecco nuove combinazioni dal tuo guardaroba.");
                  }}
                >
                  <ArrowsClockwise size={18} /> Altre idee
                </button>
              </div>
              <div className="context-strip">
                <span>
                  <FlowerLotus size={15} />
                  {moods.find((m) => m.id === active.mood)?.short}
                  {!s.checkin ? " · esempio" : ""}
                </span>
                <span>
                  <CalendarBlank size={15} />
                  {active.occasion}
                </span>
                <button onClick={() => setModal({ type: "checkin" })}>
                  <SlidersHorizontal size={15} /> Personalizza
                </button>
                {isDemo && (
                  <span className="demo-label">Capi dimostrativi</span>
                )}
              </div>
              {looks.length ? (
                <div className="outfit-grid">{looks.map(outfitCard)}</div>
              ) : (
                <Empty
                  icon={CoatHanger}
                  title="Partiamo dal tuo guardaroba."
                  text="Aggiungi un top, un pantalone e un paio di scarpe, oppure un abito e le scarpe. Costruiremo i look con i tuoi capi."
                  action="Aggiungi un capo"
                  onClick={() => setModal({ type: "add" })}
                />
              )}
            </section>
            <section className="bottom-grid">
              <div className="rediscover-panel">
                <div className="leaf-icon">
                  <Leaf size={25} weight="light" />
                </div>
                <div>
                  <p className="eyebrow">
                    UN NUOVO SGUARDO, NON UN NUOVO ACQUISTO
                  </p>
                  <h3>
                    {unused.length
                      ? `${unused.length} capi aspettano una seconda occasione.`
                      : "Ogni capo merita di uscire."}
                  </h3>
                  <p>
                    Riscopri quello che hai. O fai spazio a una nuova storia.
                  </p>
                  <button className="text-button" onClick={() => go("impact")}>
                    Dai nuova vita al tuo armadio <ArrowRight size={17} />
                  </button>
                </div>
                {unused[0] && <Garment item={unused[0]} />}
              </div>
              <div className="wardrobe-summary">
                <div>
                  <CoatHanger size={22} />
                  <span className="eyebrow">IL TUO PICCOLO MONDO</span>
                </div>
                <p>
                  <strong>{s.items.length}</strong> capi, tante possibilità.
                </p>
                <button className="text-button" onClick={() => go("wardrobe")}>
                  Entra nel guardaroba <ArrowRight size={17} />
                </button>
              </div>
            </section>
            {!s.welcomed && (
              <div className="welcome-bar">
                <Info size={20} />
                <p>
                  Benvenuta in Moodrobe. Esplora con 16 capi illustrati, oppure
                  inizia dal tuo armadio. <b>Nessun account necessario.</b>
                </p>
                <button
                  className="text-button"
                  onClick={() => {
                    update({ welcomed: true });
                    setModal({ type: "start" });
                  }}
                >
                  Inizia da qui <ArrowRight size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Chiudi benvenuto"
                  onClick={() => update({ welcomed: true })}
                >
                  <X size={17} />
                </button>
              </div>
            )}
          </>
        )}
        {page === "wardrobe" && (
          <>
            <PageHeading
              eyebrow="TUTTO QUELLO CHE SERVE È GIÀ QUI"
              title={
                <>
                  Il tuo <em>guardaroba.</em>
                </>
              }
              text="Dai visibilità ai tuoi capi. Le combinazioni vengono dopo."
              action={
                <button
                  className="primary"
                  onClick={() => setModal({ type: "add" })}
                >
                  <Plus size={18} /> Aggiungi un capo
                </button>
              }
            />
            <div className="wardrobe-tools">
              <div className="tabs">
                {categories.map((c) => (
                  <button
                    onClick={() => setFilter(c)}
                    className={filter === c ? "active" : ""}
                    key={c}
                  >
                    {c}
                    {c === "Tutti" && <small>{s.items.length}</small>}
                  </button>
                ))}
              </div>
              <label className="search">
                <MagnifyingGlass size={18} />
                <input
                  placeholder="Cerca un capo…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>
            {isDemo && (
              <div className="inline-note">
                <Info size={17} />
                <span>
                  Le illustrazioni sono capi dimostrativi. Aggiungi le tue foto
                  per creare il tuo guardaroba.
                </span>
                <button
                  className="text-button"
                  onClick={() => setModal({ type: "clearDemo" })}
                >
                  Rimuovi esempi
                </button>
              </div>
            )}
            <div className="garment-grid">
              {s.items
                .filter(
                  (i) =>
                    (filter === "Tutti" || i.category === filter) &&
                    i.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((i) => (
                  <button
                    className="garment-card"
                    key={i.id}
                    onClick={() => setModal({ type: "item", item: i })}
                  >
                    <div className="garment-tile">
                      <Garment item={i} />
                      {daysSince(i.lastWorn) >= 60 && (
                        <span className="item-tag">
                          <Leaf size={12} /> Da riscoprire
                        </span>
                      )}
                      {i.available === false && (
                        <span className="item-tag unavailable">
                          Non disponibile
                        </span>
                      )}
                    </div>
                    <div className="garment-caption">
                      <span>{i.name}</span>
                      <span
                        className="color-dot"
                        style={{ background: i.hex }}
                      />
                    </div>
                    <p>
                      {i.category} · {i.wears} volte indossato
                    </p>
                  </button>
                ))}
              <button
                className="add-tile"
                onClick={() => setModal({ type: "add" })}
              >
                <Plus size={28} weight="light" />
                <span>
                  Un nuovo capo,
                  <br />
                  nuove possibilità.
                </span>
              </button>
            </div>
          </>
        )}
        {page === "looks" && (
          <LooksPage
            s={s}
            looks={looks}
            outfitCard={outfitCard}
            setModal={setModal}
            update={update}
            notify={notify}
            wear={wear}
          />
        )}
        {page === "impact" && (
          <>
            <PageHeading
              eyebrow="COMPRA MENO. VIVI DI PIÙ QUELLO CHE HAI."
              title={
                <>
                  Ogni capo, <em>una nuova storia.</em>
                </>
              }
              text="Piccoli gesti, un guardaroba più consapevole. Senza inventare numeri sull’impatto."
            />
            <div className="metric-grid">
              <Metric value={s.items.length} label="capi nel guardaroba" />
              <Metric
                value={metrics.utilization + "%"}
                label="usati negli ultimi 60 giorni"
                note={
                  isDemo
                    ? "Include lo storico dimostrativo"
                    : "Calcolato dalle date dei tuoi capi"
                }
              />
              <Metric value={metrics.looks} label="outfit registrati da te" />
              <Metric value={unused.length} label="capi da riscoprire" />
            </div>
            <div className="section-title">
              <div>
                <p className="eyebrow">NON INDOSSATI DA ALMENO 60 GIORNI</p>
                <h2>Si meritano un’altra occasione.</h2>
              </div>
            </div>
            <div className="reuse-grid">
              {unused.map((i) => (
                <article className="reuse-card" key={i.id}>
                  <div className="reuse-art">
                    <Garment item={i} />
                  </div>
                  <div>
                    <span className="eyebrow">
                      {daysSince(i.lastWorn)} GIORNI NELL’ARMADIO
                    </span>
                    <h3>{i.name}</h3>
                    <p>
                      Riprovalo in un look diverso, oppure scegli a chi
                      affidarlo.
                    </p>
                    <button
                      className="primary small"
                      onClick={() => {
                        update({
                          checkin: {
                            ...active,
                            date: new Date().toISOString(),
                          },
                        });
                        setModal({ type: "reuse", item: i });
                      }}
                    >
                      Scegli la sua prossima storia <ArrowUpRight size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {!unused.length && (
              <Empty
                icon={Leaf}
                title="Il tuo armadio è in movimento."
                text="Qui ritroverai i capi non indossati da 60 giorni. I promemoria si aggiornano quando apri l’app."
              />
            )}
            <section className="ethos">
              <span className="eyebrow">LA NOSTRA IDEA DI SOSTENIBILITÀ</span>
              <h2>
                Il capo più interessante?
                <br />
                <em>Potrebbe essere già tuo.</em>
              </h2>
              <p>
                Contiamo riutilizzi reali, non emissioni ipotetiche. Nessuna
                stima di CO₂ risparmiata senza dati verificabili. Nessun invito
                all’acquisto tra i tuoi outfit.
              </p>
            </section>
          </>
        )}
        {page === "project" && (
          <Project s={s} update={update} notify={notify} setModal={setModal} />
        )}
      </main>
      <footer>
        <button className="brand" onClick={() => go("today")}>
          moodrobe<span>✳</span>
        </button>
        <p>Il tuo armadio non ti veste e basta. Ti capisce.</p>
        <div>
          <button onClick={() => go("project")}>
            Un progetto di Benedetta
          </button>
          <button onClick={() => setModal({ type: "settings" })}>
            <Lock size={13} /> Privacy & dati
          </button>
        </div>
      </footer>
      {modal && (
        <Modal
          title={modal.title}
          close={() => setModal(null)}
          wide={["outfit", "checkin"].includes(modal.type)}
        >
          {modal.type === "checkin" ? (
            <Checkin
              s={s}
              mood={modal.mood}
              weather={weather}
              onSave={(c) => {
                update({ checkin: c });
                setRound(0);
                setModal(null);
                notify(
                  "Il tuo check-in è pronto. Ecco i look in sintonia con te.",
                );
              }}
              update={update}
            />
          ) : modal.type === "add" ? (
            <AddGarment
              onSave={(item) => {
                update((p) => ({ items: [...p.items, item] }));
                setModal(null);
                notify("Capo aggiunto al guardaroba.");
              }}
            />
          ) : modal.type === "outfit" ? (
            <OutfitDetail
              look={modal.look}
              active={active}
              onWear={() => wear(modal.look)}
              onSave={() => save(modal.look)}
              onFeedback={(a) => feedback(modal.look, a)}
              onPlan={() => setModal({ type: "plan", look: modal.look })}
              onImprove={() => setModal({ type: "improve", look: modal.look })}
            />
          ) : modal.type === "settings" ? (
            <Settings
              s={s}
              update={update}
              notify={notify}
              setModal={setModal}
            />
          ) : modal.type === "item" ? (
            <ItemDetail
              item={modal.item}
              update={update}
              close={() => setModal(null)}
              notify={notify}
              setModal={setModal}
            />
          ) : modal.type === "reuse" ? (
            <Reuse
              item={modal.item}
              onStyle={() => {
                const options = recommend(
                  s.items,
                  active,
                  s.feedback,
                  0,
                  modal.item.id,
                );
                const l = options.find((l) =>
                  l.items.some((i) => i.id === modal.item.id),
                );
                if (l) setModal({ type: "outfit", look: l });
                else
                  notify("Aggiungi capi compatibili per completare un look.");
              }}
              onRemove={() => setModal({ type: "remove", item: modal.item })}
            />
          ) : modal.type === "plan" ? (
            <Plan
              look={modal.look}
              onSave={(date) => {
                update((p) => ({
                  plans: [
                    ...p.plans,
                    {
                      id: crypto.randomUUID(),
                      date,
                      itemIds: modal.look.items.map((i) => i.id),
                      title: modal.look.title,
                    },
                  ],
                }));
                setModal(null);
                notify("Outfit pianificato. Lo trovi in “I tuoi outfit”.");
              }}
            />
          ) : modal.type === "improve" ? (
            <Improve look={modal.look} />
          ) : modal.type === "start" ? (
            <>
              <p className="eyebrow">BENVENUTA NEL TUO NUOVO RITUALE</p>
              <h2>
                Un armadio che
                <br />
                <em>parte da te.</em>
              </h2>
              <p>
                Prova il percorso con i capi illustrati. Oppure aggiungi 5 capi
                reali: un top, un pantalone, le scarpe, uno strato e un
                accessorio.
              </p>
              <button
                className="primary full"
                onClick={() => setModal({ type: "checkin" })}
              >
                Prova il primo check-in <ArrowRight size={18} />
              </button>
              <button
                className="secondary full"
                onClick={() => setModal({ type: "add" })}
              >
                Aggiungi il tuo primo capo
              </button>
              <p className="fine">
                I dati sono salvati solo in questo browser. Potrai esportarli o
                cancellarli in qualsiasi momento dal profilo.
              </p>
            </>
          ) : ["remove", "clearDemo", "reset"].includes(modal.type) ? (
            <>
              <p className="eyebrow">GESTISCI IL TUO SPAZIO</p>
              <h2>
                {modal.type === "remove"
                  ? "Rimuovere questo capo?"
                  : modal.type === "clearDemo"
                    ? "Partiamo dai tuoi capi?"
                    : "Cancellare tutti i dati?"}
              </h2>
              <p>
                {modal.type === "remove"
                  ? `“${modal.item.name}” verrà rimosso. Lo storico resterà nel diario senza la sua foto.`
                  : modal.type === "clearDemo"
                    ? "Rimuoveremo solo i capi illustrati e le raccolte che li contengono. Le tue foto rimangono."
                    : "Guardaroba, foto, check-in, preferenze e diario verranno cancellati da questo browser. Esporta una copia se vuoi conservarli."}
              </p>
              <button
                className="danger full"
                onClick={() => {
                  if (modal.type === "reset") {
                    update({ ...initial(), items: [], welcomed: true });
                  } else {
                    const ids =
                      modal.type === "clearDemo"
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
                  notify("Dati aggiornati.");
                }}
              >
                Conferma eliminazione
              </button>
              <button className="secondary full" onClick={() => setModal(null)}>
                Annulla
              </button>
            </>
          ) : null}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={20} />
          {toast}
          <button aria-label="Chiudi messaggio" onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}
function PageHeading({ eyebrow, title, text, action }) {
  return (
    <section className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="intro">{text}</p>
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
        <button className="primary" onClick={onClick}>
          {action}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
function Metric({ value, label, note }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
      {note && <small>{note}</small>}
    </div>
  );
}
function Modal({ children, close, wide }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const handler = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const els = ref.current?.querySelectorAll(
          'button:not(:disabled),input,select,textarea,a[href],[tabindex="0"]',
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
      previous?.focus();
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
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Moodrobe — dettaglio"
        className={`modal ${wide ? "wide" : ""}`}
      >
        <button
          className="modal-close icon-button"
          aria-label="Chiudi"
          onClick={close}
        >
          <X size={23} />
        </button>
        {children}
      </section>
    </div>
  );
}
function Checkin({ s, mood, weather, onSave, update }) {
  const [chosen, setChosen] = useState(mood || s.checkin?.mood || "calm"),
    [values, setValues] = useState(() => {
      const m = moods.find((x) => x.id === (mood || s.checkin?.mood || "calm"));
      return { energy: m.energy, valence: m.valence, stress: m.stress };
    }),
    [occasion, setOccasion] = useState(
      s.checkin?.occasion || "Una giornata per me",
    ),
    [temp, setTemp] = useState(s.checkin?.temp ?? weather.temp),
    [tab, setTab] = useState("mood"),
    [rr, setRr] = useState(""),
    [hrv, setHrv] = useState(null),
    [message, setMessage] = useState(""),
    [recording, setRecording] = useState(false),
    [audioUrl, setAudioUrl] = useState(null),
    [cameraOn, setCameraOn] = useState(false);
  const video = useRef(),
    stream = useRef(),
    cameraStream = useRef(),
    consentRef = useRef(s.consents),
    recorder = useRef(),
    audioRef = useRef(),
    alive = useRef(true);
  consentRef.current = s.consents;
  useEffect(
    () => () => {
      alive.current = false;
      cameraStream.current?.getTracks().forEach((t) => t.stop());
      stream.current?.getTracks().forEach((t) => t.stop());
      if (recorder.current?.state === "recording") {
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      if (audioRef.current) URL.revokeObjectURL(audioRef.current);
    },
    [],
  );
  async function camera() {
    setMessage("");
    try {
      const st = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (!alive.current || !consentRef.current.face) {
        st.getTracks().forEach((t) => t.stop());
        return;
      }
      cameraStream.current = st;
      setCameraOn(true);
      setTimeout(() => {
        if (video.current) {
          video.current.srcObject = st;
          video.current.play();
        }
      }, 50);
    } catch {
      setMessage(
        "Fotocamera non disponibile o accesso negato. Il check-in manuale funziona sempre.",
      );
    }
  }
  async function record() {
    setMessage("");
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current || !consentRef.current.voice) {
        st.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = st;
      const chunks = [];
      const rec = new MediaRecorder(st);
      recorder.current = rec;
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        const url = URL.createObjectURL(
          new Blob(chunks, { type: rec.mimeType }),
        );
        if (audioRef.current) URL.revokeObjectURL(audioRef.current);
        audioRef.current = url;
        setAudioUrl(url);
        st.getTracks().forEach((t) => t.stop());
        setRecording(false);
      };
      rec.start();
      setRecording(true);
      setTimeout(() => {
        if (rec.state === "recording") rec.stop();
      }, 5000);
    } catch {
      setMessage(
        "Microfono non disponibile o accesso negato. Puoi continuare senza voce.",
      );
    }
  }
  return (
    <>
      <p className="eyebrow">IL TUO CHECK-IN · CIRCA 15 SECONDI</p>
      <h2>
        Prima di vestirti,
        <br />
        <em>ascoltati.</em>
      </h2>
      <p>
        Raccontaci come stai. Il tuo stato dichiarato guida le proposte; puoi
        sempre cambiarlo.
      </p>
      <div className="tabs modal-tabs">
        <button
          className={tab === "mood" ? "active" : ""}
          onClick={() => setTab("mood")}
        >
          Il mio mood
        </button>
        <button
          className={tab === "signals" ? "active" : ""}
          onClick={() => setTab("signals")}
        >
          Segnali facoltativi <span className="tiny-pill">LAB</span>
        </button>
      </div>
      {tab === "mood" ? (
        <>
          <div className="checkin-moods">
            {moods.map((m, i) => {
              const Icon = icons[i];
              return (
                <button
                  key={m.id}
                  className={chosen === m.id ? "selected" : ""}
                  onClick={() => {
                    setChosen(m.id);
                    setValues({
                      energy: m.energy,
                      valence: m.valence,
                      stress: m.stress,
                    });
                  }}
                >
                  <Icon size={23} />
                  {m.label}
                  {chosen === m.id && <Check size={16} />}
                </button>
              );
            })}
          </div>
          <div className="sliders">
            {[
              ["energy", "Energia", "Bassa", "Alta"],
              ["valence", "Tono emotivo", "Sottotono", "Positivo"],
              ["stress", "Tensione", "Distesa", "Tesa"],
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
              Cosa ti aspetta?
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
              >
                <option>Una giornata per me</option>
                <option>Lavoro / studio</option>
                <option>Un’occasione speciale</option>
                <option>Una passeggiata</option>
              </select>
            </label>
            <label>
              Temperatura esterna (°C)
              <input
                type="number"
                min="-20"
                max="50"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
              />
            </label>
          </div>
        </>
      ) : (
        <div className="signals">
          <div className="inline-note">
            <Info size={20} />
            <span>
              Spazio sperimentale. Non viene inferita alcuna emozione da viso,
              voce o HRV. I segnali non modificano le raccomandazioni: il tuo
              check-in rimane la fonte del mood.
            </span>
          </div>
          {[
            [
              "face",
              "Specchio consapevole",
              Camera,
              "Usa la fotocamera per prenderti un momento. Nessun riconoscimento facciale, nessuna foto salvata.",
            ],
            [
              "voice",
              "Una parola per te",
              Microphone,
              "Registra 5 secondi e riascoltati. L’audio resta in memoria e viene eliminato alla chiusura. Nessuna analisi della prosodia.",
            ],
            [
              "hrv",
              "Intervalli RR",
              Heart,
              "Importa misure già raccolte dal tuo dispositivo. Calcoliamo RMSSD, senza interpretazioni emotive o cliniche.",
            ],
          ].map(([id, title, Icon, desc]) => (
            <div className="signal" key={id}>
              <div className="signal-head">
                <Icon size={22} />
                <h3>{title}</h3>
                <label className="switch">
                  <input
                    aria-label={`Consenso ${title}`}
                    type="checkbox"
                    checked={s.consents[id]}
                    onChange={(e) => {
                      update({
                        consents: { ...s.consents, [id]: e.target.checked },
                      });
                      if (!e.target.checked) {
                        if (id === "face") {
                          cameraStream.current
                            ?.getTracks()
                            .forEach((t) => t.stop());
                          setCameraOn(false);
                        }
                        if (id === "voice") {
                          if (recorder.current?.state === "recording") {
                            recorder.current.onstop = null;
                            recorder.current.stop();
                          }
                          stream.current?.getTracks().forEach((t) => t.stop());
                          setRecording(false);
                          setAudioUrl(null);
                          if (audioRef.current) {
                            URL.revokeObjectURL(audioRef.current);
                            audioRef.current = null;
                          }
                        }
                        if (id === "hrv") {
                          setHrv(null);
                          setRr("");
                        }
                      }
                    }}
                  />
                  <span />
                </label>
              </div>
              <p>{desc}</p>
              {s.consents[id] && (
                <>
                  {id === "face" && (
                    <>
                      {cameraOn ? (
                        <>
                          <video
                            ref={video}
                            muted
                            playsInline
                            className="camera-preview"
                          />
                          <button
                            className="secondary"
                            onClick={() => {
                              cameraStream.current
                                ?.getTracks()
                                .forEach((t) => t.stop());
                              setCameraOn(false);
                            }}
                          >
                            Spegni fotocamera
                          </button>
                        </>
                      ) : (
                        <button className="secondary" onClick={camera}>
                          Attiva lo specchio
                        </button>
                      )}
                    </>
                  )}
                  {id === "voice" && (
                    <>
                      <button
                        className="secondary"
                        disabled={recording}
                        onClick={record}
                      >
                        {recording
                          ? "Registrazione… (5 s)"
                          : "Registra la tua voce"}
                      </button>
                      {audioUrl && <audio controls src={audioUrl} />}
                    </>
                  )}
                  {id === "hrv" && (
                    <>
                      <textarea
                        placeholder="800, 820, 810, … (almeno 20 intervalli, in ms)"
                        aria-label="Intervalli RR"
                        value={rr}
                        onChange={(e) => setRr(e.target.value)}
                      />
                      <button
                        className="secondary"
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
                            setMessage("");
                          } catch (e) {
                            setMessage(e.message);
                          }
                        }}
                      >
                        Calcola RMSSD
                      </button>
                      {hrv && (
                        <p className="result">
                          RMSSD: <b>{hrv} ms</b>. Calcolo locale; non salvato.
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          ))}
          {message && (
            <p role="alert" className="form-error">
              {message}
            </p>
          )}
        </div>
      )}
      <button
        className="primary full"
        onClick={() => {
          if (
            temp === "" ||
            !Number.isFinite(+temp) ||
            +temp < -20 ||
            +temp > 50
          ) {
            setMessage("Imposta una temperatura tra −20 e 50 °C.");
            setTab("mood");
            return;
          }
          onSave({
            mood: chosen,
            ...values,
            occasion,
            temp: +temp,
            date: new Date().toISOString(),
            source: "self-report",
          });
        }}
      >
        Trova il mio outfit <ArrowRight size={18} />
      </button>
      {tab === "mood" && message && (
        <p role="alert" className="form-error">
          {message}
        </p>
      )}
      <p className="fine">
        <Lock size={12} /> Salviamo solo il check-in dichiarato. Camera, audio e
        intervalli RR non vengono conservati.
      </p>
    </>
  );
}
const colorChoices = [
  ["cream", "Avorio", "#e8dfcc"],
  ["beige", "Sabbia", "#c7b99f"],
  ["brown", "Cacao", "#85674d"],
  ["black", "Nero", "#363634"],
  ["white", "Bianco", "#f3efe4"],
  ["blue", "Blu", "#7395b1"],
  ["sage", "Verde", "#9ca98c"],
  ["rust", "Terracotta", "#b9765d"],
  ["pink", "Rosa", "#d1a0a6"],
];
const shapes = {
  Top: "shirt",
  Pantaloni: "pants",
  Gonne: "skirt",
  Abiti: "dress",
  Capispalla: "blazer",
  Scarpe: "sneakers",
  Accessori: "bag",
};
function AddGarment({ onSave }) {
  const [name, setName] = useState(""),
    [category, setCategory] = useState("Top"),
    [color, setColor] = useState("cream"),
    [hex, setHex] = useState("#e8dfcc"),
    [season, setSeason] = useState("all"),
    [formality, setFormality] = useState(1),
    [image, setImage] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [autocolor, setAutocolor] = useState(false);
  const file = useRef();
  async function load(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Usa una foto JPG, PNG o WebP.");
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError("La foto deve essere inferiore a 15 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const bmp = await createImageBitmap(f);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
      canvas.width = bmp.width * scale;
      canvas.height = bmp.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      setImage(canvas.toDataURL("image/jpeg", 0.8));
      const pixels = ctx.getImageData(
        canvas.width * 0.3,
        canvas.height * 0.3,
        Math.max(1, Math.floor(canvas.width * 0.4)),
        Math.max(1, Math.floor(canvas.height * 0.4)),
      ).data;
      let r = 0,
        g = 0,
        b = 0,
        n = 0;
      for (let i = 0; i < pixels.length; i += 16) {
        r += pixels[i];
        g += pixels[i + 1];
        b += pixels[i + 2];
        n++;
      }
      const rgb = [r / n, g / n, b / n];
      const closest = colorChoices.reduce(
        (best, c) => {
          const v = c[2].match(/\w\w/g).map((h) => parseInt(h, 16));
          const distance = v.reduce((s, x, i) => s + (x - rgb[i]) ** 2, 0);
          return distance < best.d ? { c, d: distance } : best;
        },
        { d: Infinity },
      );
      setColor(closest.c[0]);
      setHex(closest.c[2]);
      setAutocolor(true);
      if (!name)
        setName(
          f.name
            .replace(/\.[^.]+$/, "")
            .replace(/[_-]/g, " ")
            .slice(0, 60),
        );
      bmp.close();
    } catch {
      setError("Impossibile leggere questa foto. Prova un altro file.");
    }
    setBusy(false);
  }
  return (
    <>
      <p className="eyebrow">UN CAPO ALLA VOLTA</p>
      <h2>
        Facciamo <em>spazio al tuo stile.</em>
      </h2>
      <p>
        Fotografa il capo su uno sfondo uniforme. Il colore viene stimato dalla
        zona centrale della foto: confermalo tu.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: crypto.randomUUID(),
            name: name.trim(),
            category,
            color,
            hex,
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
          type="button"
          className={`upload-zone ${image ? "has-image" : ""}`}
          onClick={() => file.current.click()}
        >
          {image ? (
            <img src={image} alt="Anteprima capo" />
          ) : (
            <>
              <Camera size={30} weight="light" />
              <span>{busy ? "Elaborazione…" : "Carica o scatta una foto"}</span>
              <small>JPG, PNG, WebP · massimo 15 MB</small>
            </>
          )}
        </button>
        {image && (
          <p className="fine">
            La foto è compressa sul dispositivo. Tocca per sostituirla. Lo
            sfondo originale viene mantenuto.
          </p>
        )}
        <label>
          Nome del capo
          <input
            required
            maxLength="60"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. La mia camicia del cuore"
          />
        </label>
        <div className="form-row">
          <label>
            Categoria
            <select
              aria-label="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.slice(1).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Stagione
            <select value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="all">Tutto l’anno</option>
              <option value="summer">Primavera / estate</option>
              <option value="winter">Autunno / inverno</option>
            </select>
          </label>
        </div>
        <label>
          Colore{" "}
          {autocolor && <small>· stimato dalla foto, da confermare</small>}
          <div className="color-choices">
            {colorChoices.map(([id, label, c]) => (
              <button
                type="button"
                key={id}
                aria-label={label}
                title={label}
                aria-pressed={color === id}
                className={color === id ? "selected" : ""}
                style={{ background: c }}
                onClick={() => {
                  setColor(id);
                  setHex(c);
                }}
              >
                {color === id && <Check size={16} />}
              </button>
            ))}
          </div>
        </label>
        <label>
          Stile
          <select
            value={formality}
            onChange={(e) => setFormality(+e.target.value)}
          >
            <option value="1">Casual e rilassato</option>
            <option value="2">Smart casual</option>
            <option value="3">Elegante e strutturato</option>
          </select>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary full" disabled={busy || !name.trim()}>
          Aggiungi al mio guardaroba <Plus size={18} />
        </button>
        <p className="fine">
          La categoria è scelta da te. Puoi salvare anche senza foto: useremo
          un’illustrazione.
        </p>
      </form>
    </>
  );
}
function OutfitDetail({
  look,
  active,
  onWear,
  onSave,
  onFeedback,
  onPlan,
  onImprove,
}) {
  return (
    <>
      <p className="eyebrow">DAL TUO GUARDAROBA · {look.items.length} CAPI</p>
      <h2>{look.title}</h2>
      <div className="outfit-detail-grid">
        <div className="detail-art">
          <div className="collage">
            {look.items.map((i, j) => (
              <Garment key={i.id} item={i} className={`piece p${j}`} />
            ))}
          </div>
        </div>
        <div>
          <div className="swatches large">
            {look.palette.map((c) => (
              <span key={c} style={{ background: c }} title={c} />
            ))}
          </div>
          <h3>Perché questo look?</h3>
          <p>
            {look.reason} Abbiamo considerato {active.occasion.toLowerCase()},{" "}
            {active.temp} °C, i tuoi feedback e i capi meno utilizzati.
          </p>
          <p className="fine">
            È un’ipotesi di stile, non un effetto psicologico garantito. Il tuo
            gusto viene prima delle regole.
          </p>
          <div className="look-list">
            {look.items.map((i) => (
              <div key={i.id}>
                <span className="color-dot" style={{ background: i.hex }} />
                <span>{i.name}</span>
                <small>{i.category}</small>
              </div>
            ))}
          </div>
          <div className="feedback">
            <span>Ti rappresenta?</span>
            <button className="secondary" onClick={() => onFeedback(false)}>
              <X size={16} /> Non oggi
            </button>
            <button className="secondary" onClick={() => onFeedback(true)}>
              <Heart size={16} /> Mi piace
            </button>
          </div>
        </div>
      </div>
      <div className="action-row">
        <button className="primary" onClick={onWear}>
          <Check size={18} /> Lo indosso oggi
        </button>
        <button className="secondary" onClick={onSave}>
          <BookmarkSimple size={18} /> Salva
        </button>
        <button className="secondary" onClick={onPlan}>
          <CalendarBlank size={18} /> Pianifica
        </button>
      </div>
      <button className="text-button improve" onClick={onImprove}>
        Consigliami come migliorare questo outfit <ArrowUpRight size={16} />
      </button>
    </>
  );
}
function ItemDetail({ item, update, close, notify, setModal }) {
  const [name, setName] = useState(item.name),
    [available, setAvailable] = useState(item.available !== false);
  return (
    <>
      <p className="eyebrow">IL TUO GUARDAROBA</p>
      <div className="item-detail-art">
        <Garment item={item} />
      </div>
      <h2>{item.name}</h2>
      <p>
        {item.category} · {item.wears} volte indossato
        {item.demo ? " · capo dimostrativo" : ""}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update((p) => ({
            items: p.items.map((i) =>
              i.id === item.id ? { ...i, name: name.trim(), available } : i,
            ),
          }));
          close();
          notify("Capo aggiornato.");
        }}
      >
        <label>
          Nome
          <input
            required
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />{" "}
          Disponibile per gli outfit (togli se in lavanderia)
        </label>
        <button className="primary full">Salva modifiche</button>
      </form>
      <button
        className="secondary full"
        onClick={() => {
          update((p) => ({
            items: p.items.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    lastWorn: new Date().toISOString(),
                    wears: i.wears + 1,
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
          notify("Utilizzo registrato nel diario.");
        }}
      >
        L’ho indossato oggi <Check size={16} />
      </button>
      <button
        className="text-button danger-text"
        onClick={() => setModal({ type: "remove", item })}
      >
        <Trash size={16} /> Rimuovi dal guardaroba
      </button>
    </>
  );
}
function LooksPage({ s, looks, outfitCard, setModal, update, notify, wear }) {
  const [tab, setTab] = useState("saved");
  return (
    <>
      <PageHeading
        eyebrow="IL TUO STILE, GIORNO DOPO GIORNO"
        title={
          <>
            Le combinazioni <em>che restano.</em>
          </>
        }
        text="Salva quello che ti piace. Pianifica le tue giornate. Impara a riconoscerti."
      />
      <div className="tabs collection-tabs">
        {[
          ["saved", "La mia raccolta", s.saved.length],
          ["plans", "In agenda", s.plans.length],
          ["history", "Diario", s.history.length],
        ].map(([id, label, count]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
            <small>{count}</small>
          </button>
        ))}
      </div>
      {tab === "saved" &&
        (s.saved.length ? (
          <div className="saved-grid">
            {s.saved.map((l) => {
              const items = l.itemIds
                  .map((id) => s.items.find((i) => i.id === id))
                  .filter(Boolean),
                look = {
                  ...l,
                  items,
                  palette: [...new Set(items.map((i) => i.hex))],
                  reason: "Una combinazione che hai scelto di tenere.",
                };
              return (
                <div className="saved-wrapper" key={l.id}>
                  {outfitCard(look)}
                  <button
                    className="text-button danger-text"
                    onClick={() => {
                      update((p) => ({
                        saved: p.saved.filter((x) => x.id !== l.id),
                      }));
                      notify("Outfit rimosso dalla raccolta.");
                    }}
                  >
                    <Trash size={14} /> Rimuovi dalla raccolta
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty
            icon={BookmarkSimple}
            title="I tuoi preferiti abitano qui."
            text="Apri un look e salvalo. Lo ritroverai qui per i giorni in cui vuoi andare sul sicuro."
            action="Esplora un look"
            onClick={() =>
              looks[0]
                ? setModal({ type: "outfit", look: looks[0] })
                : setModal({ type: "add" })
            }
          />
        ))}
      {tab === "plans" &&
        (s.plans.length ? (
          <div className="agenda-list">
            {[...s.plans]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((p) => (
                <article className="agenda-card" key={p.id}>
                  <div className="agenda-date">
                    <strong>{new Date(p.date + "T12:00:00").getDate()}</strong>
                    <span>
                      {new Date(p.date + "T12:00:00").toLocaleDateString(
                        "it-IT",
                        { month: "short", year: "numeric" },
                      )}
                    </span>
                  </div>
                  <div>
                    <h3>{p.title}</h3>
                    <p>
                      {p.itemIds
                        .map((id) => s.items.find((i) => i.id === id)?.name)
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => {
                      const items = p.itemIds
                        .map((id) => s.items.find((i) => i.id === id))
                        .filter(Boolean);
                      if (!items.length) return;
                      wear({ title: p.title, items });
                      update((prev) => ({
                        plans: prev.plans.filter((x) => x.id !== p.id),
                      }));
                    }}
                  >
                    Lo indosso
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Rimuovi piano"
                    onClick={() =>
                      update((prev) => ({
                        plans: prev.plans.filter((x) => x.id !== p.id),
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
            title="Un pensiero in meno per domani."
            text="Pianifica un outfit dalla sua scheda e ritrovalo qui nella data scelta."
          />
        ))}
      {tab === "history" &&
        (s.history.length ? (
          <div className="timeline">
            {[...s.history].reverse().map((h) => (
              <article key={h.id}>
                <span className="timeline-dot" />
                <span className="eyebrow">
                  {new Date(h.date).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <h3>{h.title}</h3>
                <p>
                  {h.itemIds
                    .map(
                      (id) =>
                        s.items.find((i) => i.id === id)?.name ||
                        "Capo rimosso",
                    )
                    .join(" · ")}
                </p>
                {h.mood && (
                  <span className="tag">
                    {moods.find((m) => m.id === h.mood)?.short}
                  </span>
                )}
              </article>
            ))}
          </div>
        ) : (
          <Empty
            icon={BookOpen}
            title="La prima pagina è tua."
            text="Quando scegli “Lo indosso oggi”, il look entra nel diario. Nessun utilizzo viene inventato."
          />
        ))}
    </>
  );
}
function Plan({ look, onSave }) {
  const [date, setDate] = useState(
    new Date(Date.now() + 86400000).toLocaleDateString("en-CA"),
  );
  return (
    <>
      <p className="eyebrow">UN PENSIERO IN MENO</p>
      <h2>
        Portalo <em>in agenda.</em>
      </h2>
      <p>
        {look.title} · {look.items.length} capi dal tuo guardaroba.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(date);
        }}
      >
        <label>
          Quando vuoi indossarlo?
          <input
            type="date"
            required
            min={new Date().toLocaleDateString("en-CA")}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button className="primary full">
          Pianifica outfit <CalendarBlank size={18} />
        </button>
      </form>
    </>
  );
}
function Reuse({ item, onStyle, onRemove }) {
  return (
    <>
      <p className="eyebrow">UNA SECONDA OCCASIONE</p>
      <h2>
        La prossima storia
        <br />
        <em>di questo capo.</em>
      </h2>
      <div className="item-detail-art small-art">
        <Garment item={item} />
      </div>
      <p>
        <b>{item.name}</b> · non indossato da {daysSince(item.lastWorn)} giorni.
      </p>
      <button className="primary full" onClick={onStyle}>
        Riscoprilo in un outfit <ArrowsClockwise size={18} />
      </button>
      <div className="external-links">
        <a
          href="https://www.vinted.it/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Vendilo su Vinted <ArrowUpRight size={18} />
        </a>
        <a
          href="https://www.vestiairecollective.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Esplora Vestiaire Collective <ArrowUpRight size={18} />
        </a>
        <a href="https://cri.it/" target="_blank" rel="noopener noreferrer">
          Informati presso la Croce Rossa <ArrowUpRight size={18} />
        </a>
      </div>
      <p className="fine">
        Link esterni, nessuna affiliazione. Verifica condizioni, disponibilità e
        modalità di raccolta presso l’organizzazione locale. Nessuna
        pubblicazione o donazione viene effettuata automaticamente.
      </p>
      <button className="text-button danger-text" onClick={onRemove}>
        L’ho ceduto: rimuovi dal mio guardaroba <ArrowRight size={15} />
      </button>
    </>
  );
}
function Improve({ look }) {
  return (
    <>
      <p className="eyebrow">UN CONSIGLIO RICHIESTO DA TE</p>
      <h2>
        Un dettaglio,
        <br />
        <em>un altro punto di vista.</em>
      </h2>
      <p>
        Prima di comprare, prova a cambiare proporzioni: una manica arrotolata,
        un top infilato a metà o un accessorio già tuo possono trasformare{" "}
        {look.title.toLowerCase()}.
      </p>
      <div className="inline-note">
        <Leaf size={22} />
        <span>
          Per questa palette, prova un piccolo accessorio{" "}
          {look.items.some((i) => i.color === "brown")
            ? "dorato o avorio"
            : "cuoio o sabbia"}
          . Cerca prima nel tuo armadio.
        </span>
      </div>
      <p>
        Se decidi di cercare un capo nuovo, valuta frequenza d’uso, abbinamenti
        con almeno tre outfit e possibilità di acquistarlo di seconda mano.
      </p>
      <a
        className="secondary full"
        href="https://www.vinted.it/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Esplora il second hand <ArrowUpRight size={16} />
      </a>
      <p className="fine">
        Non ci sono brand partner, sconti o commissioni attivi. Il suggerimento
        è una regola editoriale, non una consulenza AI.
      </p>
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
      if (f.size > 12e6) throw Error("Backup troppo grande (massimo 12 MB).");
      const d = JSON.parse(await f.text());
      if (
        d.version !== 1 ||
        !Array.isArray(d.items) ||
        d.items.length > 300 ||
        !Array.isArray(d.history) ||
        !Array.isArray(d.saved) ||
        !Array.isArray(d.feedback) ||
        !Array.isArray(d.plans) ||
        !Array.isArray(d.pilot)
      )
        throw Error("Il file non è un backup Moodrobe valido.");
      const ids = new Set();
      d.items.forEach((i) => {
        if (
          !i ||
          typeof i.id !== "string" ||
          i.id.length > 100 ||
          ![
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
          ].includes(i.shape) ||
          typeof i.color !== "string" ||
          !["all", "summer", "winter"].includes(i.season) ||
          ![1, 2, 3].includes(i.formality) ||
          ids.has(i.id) ||
          typeof i.name !== "string" ||
          i.name.length > 120 ||
          !categories.includes(i.category) ||
          !/^#[0-9a-f]{6}$/i.test(i.hex) ||
          !Number.isFinite(i.wears) ||
          i.wears < 0 ||
          !Number.isFinite(new Date(i.lastWorn).getTime()) ||
          (i.image &&
            (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(
              i.image,
            ) ||
              i.image.length > 1500000))
        )
          throw Error("Il backup contiene capi non validi.");
        ids.add(i.id);
      });
      for (const group of [d.history, d.saved, d.feedback, d.plans])
        group.forEach((x) => {
          if (
            !x ||
            typeof x.id !== "string" ||
            !Array.isArray(x.itemIds) ||
            x.itemIds.some((id) => typeof id !== "string") ||
            typeof x.date !== "string"
          )
            throw Error("Il backup contiene record non validi.");
        });
      for (const group of [d.history, d.saved, d.plans])
        if (
          group.some((x) => typeof x.title !== "string" || x.title.length > 150)
        )
          throw Error("Titoli del backup non validi.");
      if (d.feedback.some((x) => typeof x.accepted !== "boolean"))
        throw Error("Feedback non validi.");
      if (
        d.checkin &&
        (!moods.some((m) => m.id === d.checkin.mood) ||
          !Number.isFinite(d.checkin.temp) ||
          typeof d.checkin.occasion !== "string" ||
          !["energy", "valence", "stress"].every(
            (k) =>
              Number.isFinite(d.checkin[k]) &&
              d.checkin[k] >= 0 &&
              d.checkin[k] <= 100,
          ))
      )
        throw Error("Check-in non valido.");
      if (d.plans.some((p) => !/^\d{4}-\d{2}-\d{2}$/.test(p.date)))
        throw Error("Date agenda non valide.");
      d.pilot.forEach((p) => {
        if (
          typeof p.id !== "string" ||
          typeof p.date !== "string" ||
          typeof p.moodPreferred !== "boolean" ||
          !moods.some((m) => m.id === p.mood)
        )
          throw Error("Sessioni pilot non valide.");
      });
      update({
        ...initial(),
        ...d,
        name: typeof d.name === "string" ? d.name.slice(0, 30) : "Benedetta",
        consents: { face: false, voice: false, hrv: false },
        researchConsent: false,
        welcomed: true,
      });
      notify(
        "Backup importato. I consensi facoltativi sono stati disattivati.",
      );
      setError("");
    } catch (e) {
      setError(e.message);
    }
    e.target.value = "";
  }
  return (
    <>
      <p className="eyebrow">IL TUO SPAZIO, LE TUE SCELTE</p>
      <h2>
        Piacere di <em>conoscerti.</em>
      </h2>
      <label>
        Come ti chiami?
        <input
          value={name}
          maxLength={30}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <button
        className="primary full"
        disabled={!name.trim()}
        onClick={() => {
          update({ name: name.trim() });
          notify("Nome aggiornato.");
        }}
      >
        Salva il nome <Check size={17} />
      </button>
      <div className="settings-block">
        <h3>
          <Lock size={19} /> Privacy, in concreto
        </h3>
        <p>
          Guardaroba, foto, check-in, preferenze e diario sono salvati nel
          browser di questo dispositivo. Non c’è un account né una
          sincronizzazione cloud. Chi usa lo stesso browser può accedere ai
          dati. In navigazione privata potrebbero essere cancellati alla
          chiusura.
        </p>
        <p>
          Le foto sono compresse localmente. Non conserviamo video, audio o
          intervalli RR. Nessun tracker analitico o pubblicitario viene
          caricato. Il servizio di hosting può mantenere normali log tecnici di
          accesso.
        </p>
        <p>
          Solo se richiedi il meteo, le coordinate approssimate vengono inviate
          a Open-Meteo; non vengono salvate dall’app. I link esterni aprono
          servizi con le proprie informative.
        </p>
        <a
          className="text-button"
          href="https://open-meteo.com/en/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          Informativa del servizio meteo <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="settings-block">
        <h3>Segnali facoltativi</h3>
        <p>
          Puoi revocare i consensi in qualsiasi momento. Le preferenze di
          consenso non attivano automaticamente camera o microfono.
        </p>
        {[
          ["face", "Fotocamera locale"],
          ["voice", "Registrazione vocale locale"],
          ["hrv", "Calcolo RMSSD locale"],
        ].map(([id, label]) => (
          <label className="checkbox-row" key={id}>
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
      </div>
      <div className="settings-block">
        <h3>I tuoi dati sono tuoi.</h3>
        {!s.items.some((i) => i.demo) && (
          <button
            className="secondary"
            onClick={() => {
              update((p) => ({
                items: [
                  ...p.items,
                  ...seedWardrobe().filter(
                    (i) => !p.items.some((x) => x.id === i.id),
                  ),
                ],
              }));
              notify(
                "Capi dimostrativi aggiunti. Le tue foto sono rimaste nel guardaroba.",
              );
            }}
          >
            Aggiungi capi di esempio <Plus size={16} />
          </button>
        )}
        <p>
          Esporta una copia prima di cambiare dispositivo. Il file contiene foto
          e mood: conservalo in uno spazio privato. L’importazione sostituisce i
          dati presenti.
        </p>
        <div className="action-row">
          <button
            className="secondary"
            onClick={() =>
              download("moodrobe-backup.json", JSON.stringify(s, null, 2))
            }
          >
            <Download size={17} /> Esporta backup
          </button>
          <button className="secondary" onClick={() => file.current.click()}>
            <Upload size={17} /> Importa backup
          </button>
          <input
            ref={file}
            hidden
            type="file"
            accept="application/json,.json"
            onChange={restore}
          />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="text-button danger-text"
          onClick={() => setModal({ type: "reset" })}
        >
          <Trash size={16} /> Elimina tutti i miei dati
        </button>
      </div>
    </>
  );
}
function Project({ s, update, notify, setModal }) {
  return (
    <>
      <section className="project-hero">
        <p className="eyebrow">MOODROBE / UN PROGETTO DI BENEDETTA</p>
        <h1>
          Vestirsi è una scelta.
          <br />
          <em>Sentirsi sé stesse, il punto.</em>
        </h1>
        <p>
          Un esperimento di design e tecnologia per ridurre l’indecisione,
          ascoltare la persona e usare meglio il guardaroba che ha già.
        </p>
        <a className="english-brief" href="/en.html">
          Read the project brief in English <ArrowUpRight size={15} />
        </a>
        <span className="project-badge">
          <span /> Web app funzionante · ricerca da validare
        </span>
      </section>
      <div className="project-summary">
        <div>
          <span className="eyebrow">LA DOMANDA</span>
          <h2>
            E se la prima cosa
            <br />
            da scegliere fosse
            <br />
            <em>come vogliamo sentirci?</em>
          </h2>
        </div>
        <div>
          <p>
            Il punto di partenza del case study è la distanza tra un armadio
            pieno e la sensazione di non avere nulla da indossare. Moodrobe
            rende visibili le possibilità: pochi look spiegati, costruiti con
            capi reali, senza spingere verso un nuovo acquisto.
          </p>
          <p>
            Questa versione implementa il percorso con mood dichiarato e un
            motore di ranking trasparente. L’idea multimodale del case study
            rimane un’ipotesi di ricerca: nessun algoritmo biometrico validato è
            attivo.
          </p>
        </div>
      </div>
      <div className="project-principles">
        {[
          [
            "01",
            "La persona decide",
            "Il check-in è facoltativo, modificabile e guidato dal racconto della persona.",
          ],
          [
            "02",
            "Il guardaroba viene prima",
            "Ogni proposta usa esclusivamente i capi disponibili nel catalogo.",
          ],
          [
            "03",
            "Le prove contano",
            "Preferenze vere, nessuna precisione AI o metrica d’impatto inventata.",
          ],
        ].map(([n, t, d]) => (
          <article key={n}>
            <span>{n}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </article>
        ))}
      </div>
      <section className="method-section">
        <div className="section-title">
          <div>
            <p className="eyebrow">SOTTO LA SUPERFICIE</p>
            <h2>Un motore che si può spiegare.</h2>
          </div>
          <BookOpen size={30} weight="light" />
        </div>
        <div className="method-flow">
          {[
            [
              "Input",
              "Mood dichiarato, occasione, temperatura e capi disponibili.",
            ],
            [
              "Ranking",
              "Compatibilità di stile, colori, stagionalità, tempo dall’ultimo utilizzo e feedback.",
            ],
            [
              "Output",
              "Fino a tre combinazioni diverse: top + fondo o abito, scarpe e strati quando servono.",
            ],
            [
              "Apprendimento",
              "Un peso locale per ogni capo: i sì lo aumentano, i no lo riducono. Nessun modello addestrato.",
            ],
          ].map(([t, d], i) => (
            <div key={t}>
              <small>0{i + 1}</small>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
        <p className="fine">
          Le palette sono ipotesi di design, non prescrizioni psicologiche. Il
          sistema non diagnostica, misura o tratta stati emotivi.
        </p>
      </section>
      <section className="status-section">
        <p className="eyebrow">COSA PUOI VERIFICARE OGGI</p>
        <h2>
          Funzioni reali. <em>Limiti dichiarati.</em>
        </h2>
        <div className="status-table">
          {[
            [
              "Disponibile",
              "Catalogo e foto locali",
              "Upload, compressione, stima del colore da confermare, categorie manuali, disponibilità e gestione dei capi.",
            ],
            [
              "Disponibile",
              "Rituale quotidiano",
              "Check-in, meteo su richiesta, ranking locale, palette, feedback, outfit salvati, calendario e diario.",
            ],
            [
              "Disponibile",
              "Riuso e portabilità",
              "Promemoria in-app dopo 60 giorni, link esterni di riuso, esportazione/importazione e cancellazione dei dati.",
            ],
            [
              "Sperimentale",
              "Segnali facoltativi",
              "Specchio locale, registrazione di 5 secondi e RMSSD da intervalli RR importati. Nessuna inferenza emotiva.",
            ],
            [
              "Da sviluppare",
              "Modello multimodale",
              "SDK facciale, wearable HRV, analisi vocale, fusione dei segnali e validazione indipendente.",
            ],
            [
              "Da sviluppare",
              "Servizi commerciali e cloud",
              "Account e sincronizzazione, segmentazione automatica dello sfondo, classificazione AI, QR brand, pagamenti e partnership.",
            ],
          ].map(([state, t, d]) => (
            <div key={t}>
              <span
                className={`status-pill ${state === "Disponibile" ? "ready" : ""}`}
              >
                {state}
              </span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="research-section">
        <p className="eyebrow">L’IPOTESI VA MESSA ALLA PROVA</p>
        <h2>
          Prima una domanda.
          <br />
          <em>Poi i dati.</em>
        </h2>
        <p>
          Un pilot con 15–20 partecipanti per 2–3 settimane può confrontare
          outfit basati sul mood e outfit di controllo. I criteri del case study
          sono fissati prima della raccolta: almeno il 60% di preferenze per i
          look mood, adesione quotidiana del 70% e riscoperta di un capo per
          almeno un terzo dei partecipanti.
        </p>
        <p>
          Il confronto qui sotto prova solo il meccanismo di raccolta: una
          sessione locale non costituisce uno studio, non controlla i fattori
          confondenti e non dimostra l’efficacia del prodotto.
        </p>
        <Pilot s={s} update={update} notify={notify} />
      </section>
      <section className="sources">
        <p className="eyebrow">LETTERATURA DI PARTENZA</p>
        <h2>
          Curiosità, con <em>spirito critico.</em>
        </h2>
        <a
          href="https://doi.org/10.1037/0022-3514.79.6.995"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            Iyengar & Lepper · 2000
            <small>
              Scelta e sovraccarico decisionale. L’effetto dipende dal contesto.
            </small>
          </span>
          <ArrowUpRight size={22} />
        </a>
        <a
          href="https://doi.org/10.1016/j.jesp.2012.02.008"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            Adam & Galinsky · 2012
            <small>
              Enclothed cognition. Un punto di partenza, non una prova di
              efficacia di Moodrobe.
            </small>
          </span>
          <ArrowUpRight size={22} />
        </a>
        <a
          href="https://doi.org/10.1177/01461672231182478"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            Horton, Adam & Galinsky · meta-analisi
            <small>Riesame delle evidenze e dei limiti di replicazione.</small>
          </span>
          <ArrowUpRight size={22} />
        </a>
        <a
          href="https://arxiv.org/abs/1707.05691"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            Han et al. · 2017
            <small>
              Compatibilità degli outfit mediante reti neurali. Non il modello
              usato in questa app.
            </small>
          </span>
          <ArrowUpRight size={22} />
        </a>
      </section>
      <section className="ethos">
        <span className="eyebrow">LA PROSSIMA TAPPA</span>
        <h2>
          Non chiediamo di crederci.
          <br />
          <em>Chiediamo di provarlo.</em>
        </h2>
        <p>
          Il prossimo passo è un pilot con consenso informato, protocollo
          definito e supervisione adeguata. Le integrazioni biometriche
          richiedono prima una valutazione scientifica, tecnica e di protezione
          dei dati.
        </p>
        <button
          className="primary"
          onClick={() => setModal({ type: "checkin" })}
        >
          Prova il percorso <ArrowRight size={18} />
        </button>
      </section>
    </>
  );
}
function Pilot({ s, update, notify }) {
  const [trial, setTrial] = useState(null),
    [done, setDone] = useState(false);
  const mood = s.checkin || {
    mood: "calm",
    occasion: "Una giornata per me",
    temp: 18,
  };
  function start() {
    const match = recommend(s.items, mood, s.feedback, 0)[0];
    const pool = recommend(s.items, { ...mood, mood: "bright" }, [], 2).filter(
      (l) => l.id !== match?.id,
    );
    if (!match || !pool.length) {
      notify(
        "Servono più combinazioni diverse nel guardaroba per il confronto.",
      );
      return;
    }
    const random = pool[Math.floor(Math.random() * pool.length)];
    setTrial(
      Math.random() < 0.5
        ? { a: match, b: random, matched: "a" }
        : { a: random, b: match, matched: "b" },
    );
    setDone(false);
  }
  const csv = () => {
    const header = "session_id,date,mood_preferred,mood\n";
    download(
      "moodrobe-pilot.csv",
      header +
        s.pilot
          .map((p) =>
            [p.id, p.date, p.moodPreferred ? 1 : 0, p.mood]
              .map(
                (x) =>
                  '"' +
                  String(x)
                    .replace(/^[=+@\-\t\r]/, (v) => "'" + v)
                    .replace(/"/g, '""') +
                  '"',
              )
              .join(","),
          )
          .join("\n"),
      "text/csv;charset=utf-8",
    );
  };
  return (
    <div className="pilot">
      <div className="inline-note">
        <Info size={21} />
        <span>
          Confronto esplorativo: il controllo è un’altra combinazione generata
          dal motore con parametri diversi. Non è un esperimento scientifico
          randomizzato completo.
        </span>
      </div>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={s.researchConsent}
          onChange={(e) => {
            update({ researchConsent: e.target.checked });
            if (!e.target.checked) setTrial(null);
          }}
        />{" "}
        Acconsento a salvare localmente le mie scelte di questo confronto.
        Nessun dato viene inviato a terzi.
      </label>
      {!trial ? (
        <button
          className="primary"
          disabled={!s.researchConsent}
          onClick={start}
        >
          Avvia il confronto A / B <ArrowRight size={17} />
        </button>
      ) : !done ? (
        <>
          <p>
            Quale indosseresti oggi? Scegli senza conoscere il metodo di
            selezione.
          </p>
          <div className="ab-grid">
            {["a", "b"].map((key) => (
              <button
                key={key}
                onClick={() => {
                  update((p) => ({
                    pilot: [
                      ...p.pilot,
                      {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        moodPreferred: key === trial.matched,
                        mood: mood.mood,
                        source: "local-exploratory",
                      },
                    ],
                  }));
                  setDone(true);
                }}
              >
                <span className="eyebrow">PROPOSTA {key.toUpperCase()}</span>
                <div className="ab-garments">
                  {trial[key].items.map((i) => (
                    <Garment key={i.id} item={i} />
                  ))}
                </div>
                <span>
                  Preferisco questa <ArrowRight size={16} />
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="pilot-done">
          <CheckCircle size={28} />
          <h3>Scelta registrata.</h3>
          <p>
            La proposta {trial.matched.toUpperCase()} usava il tuo mood attuale.
            Le preferenze locali sono osservazioni esplorative, non risultati
            clinici o evidenza di efficacia.
          </p>
          <button className="secondary" onClick={start}>
            Un altro confronto
          </button>
        </div>
      )}
      <div className="pilot-summary">
        <span>{s.pilot.length} confronti registrati su questo dispositivo</span>
        <button
          className="text-button"
          disabled={!s.pilot.length}
          onClick={csv}
        >
          Esporta CSV <Download size={15} />
        </button>
      </div>
      {s.pilot.length > 0 && (
        <button
          className="text-button danger-text"
          onClick={() => {
            update({ pilot: [] });
            setTrial(null);
            notify("Scelte del confronto eliminate.");
          }}
        >
          Elimina le mie scelte <Trash size={14} />
        </button>
      )}
    </div>
  );
}
const storedDB = await loadState();
const localState = read();
const restored =
  storedDB &&
  (!localState.updatedAt || storedDB.updatedAt >= localState.updatedAt)
    ? storedDB
    : localState;
createRoot(document.getElementById("root")).render(
  <App
    restored={
      restored && restored.version === 1 && Array.isArray(restored.items)
        ? restored
        : null
    }
  />,
);
