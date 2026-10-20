# Moodrobe / local AI style studio

An English-language personal wardrobe web app with a photographic sample wardrobe, a real on-device neural recommendation pipeline, and a transparent research room. Product concept and case study: Benedetta. Implementation: AI-assisted engineering. The pretrained encoder is credited to its original authors.

## Run and build

Node.js 22.12 or later:

```sh
npm ci
npm run dev
npm test
npm run test:e2e
npm run build
npm run preview
```

The browser tests start/reuse Vite on port 5173. They use installed Chrome on macOS or Playwright Chromium elsewhere (`npx playwright install chromium`). `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select a different executable.

## Vercel deployment

Import this source into your own Git repository, then Vercel → Add New Project. Use the repository root, or set Root Directory to `moodrobe` if this folder is nested. Framework: **Vite**. Build command: **npm run build**. Output: **dist**. No API keys, environment variables, database or paid inference service are required.

The application is currently published privately on Sites. Sites access settings do not carry over to Vercel: configure Vercel deployment protection before sharing. Normal hosting/storage/bandwidth plan limits still apply. Model downloads are not free of bandwidth costs on every hosting plan.

`prebuild` copies the matching standard ONNX Runtime WASM files from installed dependencies. `finalize-build.mjs` removes the unused asyncify binary Vite emits from an internal fallback reference; the worker explicitly uses `/ort/ort-wasm-simd-threaded.{mjs,wasm}`. The final production build must be tested with real inference after this step. Individual static assets are checked against a 25 MiB limit.

## What the AI actually does

1. A pretrained **all-MiniLM-L6-v2** sentence encoder runs in a Web Worker through Transformers.js and ONNX Runtime WASM. Its quantised ONNX weights and tokenizer are vendored under `public/models/minilm`; no external inference endpoint is called.
2. The encoder represents the user's brief and each garment's textual metadata as normalised 384-dimensional vectors. **It does not inspect the photographs.** A name and detailed description make a meaningful difference to its input.
3. Structural assembly enumerates complete outfits from owned, available items: a top and bottom or a dress, plus shoes and optional layers/accessories. Weather controls layering. A candidate cap bounds computation.
4. A small regularised logistic preference model is fitted to up to 150 recent labelled outfit vectors (35 training epochs, learning rate 0.18, L2 penalty 0.015). No labelled examples means zero preference weights.
5. Ranking uses semantic similarity, the learned preference logit, and small reuse/occasion weights. The coefficients are visible in `src/ai.worker.js`; the top results are diversified by their base garments. **This is a hybrid recommender, not a rule-free system.**
6. A positive/negative vote on a neural edit stores its vector and label locally. It changes the preference head on the next neural edit. Starter-rule votes are kept but do not masquerade as neural training examples.

The first use downloads roughly 23 MB of model weights plus roughly 14 MB of inference runtime and supporting files from the site. Loading is explicit, with progress/error states. Runtime caching and speed depend on browser and device. Inference runs off the UI thread with one WASM thread and requires no cross-origin isolation header. This is a general semantic encoder, not a model trained for clothing compatibility or emotion recognition. Training loss is shown only as an internal fit measure; **no validation accuracy or psychological effectiveness is claimed**.

The starter edits visible before activation are explicitly marked **Starter edit · Rules**. If the neural model cannot load, the UI reports the error rather than relabelling a rules result as AI.

## Model provenance

- ONNX conversion: [Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2).
- Pinned revision: `751bff37182d3f1213fa05d7196b954e230abad9`.
- Original encoder: [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), Apache-2.0.
- Runtime: Transformers.js 4.3.1 / the ONNX Runtime version pinned in package-lock.json.
- Model card, Apache-2.0 licence and SHA-256 manifest: `public/models/minilm/`.

No leaked credentials, shared API keys or unauthorised third-party accounts are used.

## Product features

- Entire application in English; legacy Italian sample metadata migrates locally without discarding wear history. User-entered garment names are preserved.
- Distinct studio-style identity, a photographic outfit collage and a dedicated model/research room.
- Sixteen **AI-generated, unbranded sample photographs**, explicitly marked as samples. User uploads are displayed from local compressed photos. No synthetic photograph is passed off as an actual item owned by the visitor.
- Wardrobe CRUD, descriptions, colour confirmation, season/style metadata, search, category filters and laundry availability.
- Self-reported mood, energy, emotional tone, tension, occasion, free-text brief and temperature. Optional weather uses approximate location through Open-Meteo.
- Neural and starter edits, explainable piece lists, colour palettes, positive/negative feedback, saved edits, calendar planning and real wear diary.
- In-app rediscovery after 60 days; a neural edit can be anchored to a forgotten piece. External resale/donation links never perform actions automatically.
- Separate, user-requested editorial advice about improving an outfit. No invented affiliate relationships.
- Optional local camera mirror, ephemeral audio recording and RMSSD calculation from imported RR intervals. These do not infer emotion and do not enter the outfit model.
- Consent-based local exploratory A/B comparison between a neural edit and a rule control, random display order, CSV export and deletion. This is not a controlled study.
- Local backup/import, validation of photo and embedding data, consent reset on import, and deletion.

## Privacy and limits

Wardrobe images, descriptions, diary, check-ins, labelled embeddings and preferences stay in this browser's IndexedDB, with a localStorage fallback/journal. No cloud accounts or cross-device synchronisation. People sharing the same browser profile share access. Backups contain personal images and preference data: store them privately. Optional location is sent to Open-Meteo only on request; camera/audio/RR data are not saved. Hosting can keep ordinary access logs.

Not implemented: facial-emotion inference, wearable integration, voice-prosody inference, image segmentation/background removal, automatic vision garment classification, brand QR scanning, cloud identity, subscriptions and commercial partnerships. The model does not generate a photo of the user wearing an outfit; it composes actual uploaded or labelled sample garment images.

## Source map

- `src/main.jsx`: product flows and English UI.
- `src/style.css`: responsive studio identity.
- `src/ai.worker.js`: actual model loading, encoding, ranking and execution measurements.
- `src/engine.js`: structural assembly, vector operations, preference training and diversity.
- `src/useLocalAI.js`: worker lifecycle and explicit neural/loading/error states.
- `src/domain.js`: transparent starter rules, sample metadata, dates and RMSSD.
- `src/migration.js`, `src/backup.js`, `src/storage.js`: data migration, validation and persistence.
- `src/Garment.jsx`: photos and local fallback illustration renderer.
- `public/images/`: generated sample imagery and generation provenance.
- `tests/`: meaningful engine, migration, persistence, media-lifecycle, UI, accessibility and **real neural inference** tests.
- `docs/PRESENTATION.md`: recruiter demo guidance with accurate contribution statements.
