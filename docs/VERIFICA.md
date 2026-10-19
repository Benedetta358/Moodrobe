# Verifica della consegna — 20 ottobre 2026

- `npm test`: 11 test superati, 0 fallimenti.
- `npm run test:e2e`: 10 scenari superati, 0 fallimenti (ultimo giro: 38,8 secondi).
- `npm run build`: build Vite completata, exit code 0.
- Audit dipendenze npm: 0 vulnerabilità segnalate alla verifica.

## Copertura

Motore: composizione di look completi solo da capi disponibili, guardaroba vuoto/incompleto, abiti, strati in base alla temperatura, pesi di feedback, determinismo senza mutazioni, inclusione del capo da riscoprire, date, RMSSD e metriche senza utilizzi inventati.

Browser: check-in, spiegazione look, salvataggio, calendario, outfit indossato, persistenza dopo reload, aggiunta/modifica/rimozione capi, ricerca, disponibilità, backup invalido, cancellazione, confronto A/B con consenso, CSV, tastiera e ripristino focus, upload foto, persistenza immagine in IndexedDB, backup con foto, diniego dei permessi, RR effimeri.

Un test di regressione con stream sintetici ha riprodotto e verificato la correzione della chiusura simultanea di camera e microfono: entrambi i track risultano `ended` dopo la chiusura del dialogo.

Audit Axe su home desktop/mobile, guardaroba, aggiunta capo, seconda vita, progetto, impostazioni, check-in, segnali e brief inglese: nessuna violazione rilevata nel set di regole WCAG 2 A/AA e 2.1 AA eseguito. Un audit automatico non equivale a una certificazione completa di accessibilità.

Screenshot ispezionati su desktop 1440 px e mobile 390 px. Nessun overflow orizzontale rilevato alle dimensioni testate; brief inglese verificato anche a 1280 px.

## Limiti della verifica

Esecuzione su Google Chrome headless su macOS. Non sono state eseguite prove su hardware reale di smartwatch, camera e microfono, né su Safari/iPhone fisico. La disponibilità del meteo dipende da rete, fornitore e permessi di geolocalizzazione; il percorso manuale rimane disponibile. Non è stato eseguito un pilot con partecipanti e non è stato validato alcun classificatore emotivo. Nessun deployment Vercel è stato effettuato nell’account dell’utente.
