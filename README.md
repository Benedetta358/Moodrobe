# Moodrobe

Web app di guardaroba personale, pronta per build statica e deployment Vercel. Concept e case study: Benedetta. Implementazione sviluppata con assistenza AI; presentare il ruolo effettivo della studentessa senza attribuirle codice o sperimentazioni non svolte.

## Avvio

Node.js 22.12 o successivo.

```sh
npm ci
npm run dev
```

Apri l’indirizzo stampato da Vite. Per una verifica della versione finale:

```sh
npm test
npm run build
npm run preview
```

`npm run test:e2e` usa Playwright e avvia automaticamente Vite su porta 5173 (o riusa il server già in ascolto). Usa Google Chrome su macOS, quando installato; sugli altri sistemi installare prima il browser con `npx playwright install chromium`. È possibile impostare `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` per un eseguibile diverso.

## Deploy su Vercel

1. Carica **la cartella `moodrobe`** in un repository Git privato, senza `node_modules`, `dist` o dati personali.
2. Vercel → Add New → Project → importa il repository.
3. Se il repository contiene la cartella `moodrobe`, imposta **Root Directory: `moodrobe`**; se contiene direttamente questi file, lascia la radice.
4. Framework: **Vite**. Build: **`npm run build`**. Output: **`dist`**. Node: **22.x** o successivo supportato.
5. Non servono variabili d’ambiente, database o chiavi API.
6. Scegli esplicitamente la protezione del deployment in Vercel prima di condividere il link. L’accesso privato di Sites non viene trasferito su Vercel.

`vercel.json` contiene configurazione di build e header di sicurezza. HTTPS è necessario per camera, microfono e geolocalizzazione. Il servizio meteo è Open-Meteo e viene chiamato solo su richiesta. Prima di un utilizzo commerciale verificare le condizioni del fornitore.

## Funzioni operative

- 16 capi illustrati di esempio, esplicitamente identificati e rimovibili.
- Upload e compressione foto sul dispositivo; stima del colore centrale, da confermare; categoria, stagione e formalità manuali.
- CRUD guardaroba, ricerca, filtri e disponibilità dei capi.
- Check-in dichiarato su tre assi, occasione e temperatura; meteo locale su consenso del browser.
- Ranking deterministico e spiegabile; look completi solo da capi presenti e disponibili; palette; preferenze positive/negative con pesi locali.
- Raccolta outfit, pianificazione, diario e conteggio degli utilizzi registrati.
- Riscoperta dopo 60 giorni e percorsi esterni per rivendita/donazione; nessuna pubblicazione automatica.
- Consiglio editoriale di miglioramento solo su richiesta; nessuna affiliazione o partnership fittizia.
- Camera come specchio, registrazione locale effimera di 5 secondi, calcolo RMSSD da intervalli RR forniti dall’utente. Non inferiscono emozioni e non alimentano il ranking.
- Esportazione/importazione backup JSON, cancellazione dati, revoca dei consensi.
- Confronto A/B esplorativo con consenso distinto ed esportazione CSV.
- Pagina di presentazione con metodo, limiti e fonti.

## Perimetro e limiti

Foto e stato sono salvati in IndexedDB, con fallback su localStorage se necessario. Il browser determina la quota disponibile. Un avviso segnala il mancato salvataggio; il backup resta sempre disponibile dalla sessione aperta.

Questa è una web app **personale e locale**, senza account o sincronizzazione tra dispositivi. Il browser è il confine di separazione dei dati: persone che condividono lo stesso profilo del browser condividono l’accesso al guardaroba. Non è un servizio multiutente con autenticazione. Nessuna emozione viene dedotta da biometria; nessun modello multimodale, classificatore moda o rimozione automatica dello sfondo è integrato. Il motore è un algoritmo di ranking, non un modello neurale addestrato. I feedback aggiornano pesi individuali per capo, non una correlazione mood–stile validata.

La versione non include pagamenti, notifiche push/background, collegamento diretto smartwatch, scansione QR brand, pubblicazione su marketplace o condivisione dati B2B. Le proiezioni finanziarie e le affermazioni comparative del case study non sono presentate come risultati del prodotto. Un’eventuale integrazione biometrica e un servizio cloud richiedono un progetto distinto, validazione e valutazione dei dati prima del rilascio.

Il backup contiene dati personali e immagini: conservarlo privatamente. Le foto non vengono caricate su server. Siti esterni e hosting hanno le proprie informative. La cancellazione elimina i dati dell’app nel browser, non eventuali copie di backup già scaricate.

## Struttura

- `src/main.jsx`: UI e flussi di prodotto.
- `src/domain.js`: raccomandazione, metriche e RMSSD, senza dipendenze React.
- `src/Garment.jsx`: illustrazioni originali del catalogo dimostrativo.
- `src/style.css`: sistema visivo, responsive e reduced motion.
- `tests/domain.test.js`: invarianti del motore.
- `tests/browser/`: scenari end-to-end e audit automatico di accessibilità.
- `docs/`: guida di presentazione e matrice dei requisiti.
- `public/en.html`: presentazione in inglese per recruiter.

Non aggiungere dati personali di partecipanti o backup al repository.
