# Release verification / 20 October 2026

- `npm test`: 19 passed, zero failures.
- `npm run test:e2e`: 7 browser scenarios passed, zero failures (23.4 seconds in the final run).
- `npm run build`: production build and static-asset size checks passed.
- `node scripts/verify-production.mjs`: actual neural inference passed against the final production build served on port 5180.
- `npm audit`: zero reported vulnerabilities at verification.

## Actual AI evidence

The browser downloaded the pinned quantised model, ran the ONNX encoder locally and produced three neural edits from owned candidate combinations. An explicit feedback vote stored a finite 384-value vector; the next run trained a preference head and exposed its internal training loss.

The production smoke test used two contrasting briefs with the same sample wardrobe and returned different leading edits:

- Formal: black midi dress, ivory sneakers, sand tailored blazer, silk scarf.
- Casual: blue cotton shirt, indigo straight jeans, ivory sneakers, sage cardigan.

These are measured outputs, not curated results or proof that the recommendations are optimal. No external network requests and no page errors were observed during that production inference test. Runtime and model requests stayed on the application's own origin. The unused large asyncify fallback binary was removed from the final build; real inference succeeded using the explicit standard runtime under `/ort/`.

## Other coverage

Complete owned outfit structure, required rediscovery item, missing wardrobe slots, deterministic starter rules, feedback scores, unavailable pieces, dates, RMSSD, no invented utilisation, preference-model learning, malformed vector rejection, diversity, legacy Italian-data migration, validated backup import.

English daily flow, photos and descriptions, search, availability, saved edits, planned outfits, wear diary, persistence after reload, JSON export/import, rejection of invalid backup, deletion, optional camera denial, ephemeral RR input, camera and microphone track cleanup, neural-vs-rules local comparison and CSV.

Axe checks using WCAG 2 A/AA and 2.1 AA rules found no violations on desktop/mobile home, wardrobe, add-piece dialog, rewear, AI lab, privacy, check-in and optional-signal tools. This is an automated audit, not a comprehensive accessibility certification.

Desktop 1440 px and mobile 390 px screenshots were inspected. No horizontal overflow was detected. The mobile rewear banner was checked separately after its layout correction (content width approximately 263 px, banner height approximately 223 px at a 390 px viewport).

## Verification limits

Browser execution used headless Chrome on macOS. No physical iPhone/Safari, wearable, real camera or real microphone hardware validation was completed. Synthetic streams verified the media-lifecycle regression. The optional weather service depends on permissions, connectivity and supplier availability. No participant pilot or psychological-effectiveness validation has taken place. No emotion classifier or clothing-image analysis is claimed. Vercel account deployment has not been performed.
