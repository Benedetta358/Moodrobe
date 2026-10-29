# Portable beta deployment
Checked 26 October 2026. No curriculum section has been added.

## Architecture and unchanged features
This is a static Vite/React application. No external database, backend, paid inference service, API key or hosting-specific runtime is required. IndexedDB stores the personal wardrobe and photographs. localStorage holds a metadata journal/fallback and optional consented usability records. The reviewer wardrobe uses sessionStorage. Local neural inference, feedback learning, wardrobe editing/photos, mood/context, saved outfits, planning, diary, rediscovery, backup/import, optional media/RR tools and local study analysis remain available.

The optional weather button calls Open-Meteo after location permission; manually entered temperatures work without it. Model files, runtime, fonts and sample photographs are served from the same origin. Research/model attribution links are ordinary outbound links.

## GitHub
Use the contents of the `moodrobe` source folder as the repository root, including public/, scripts/, src/, tests/, package.json, package-lock.json, netlify.toml and vercel.json. Do not upload node_modules/, dist/, temporary recordings or personal backup/session files. The supplied portable source ZIP omits Git history and Sites metadata; it creates no repository and pushes nothing automatically. No Git LFS is required: the largest model file is about 23 MB.

## Netlify from GitHub
Import the repository. If it contains a nested moodrobe folder, set that folder as the base directory. Build: `npm run build`. Publish directory: `dist`. Node: 22. Configuration is included in netlify.toml. No environment variables, Functions, database provisioning or redirects are needed; app views use query strings and the reviewer/research pages are real HTML files.

For a manual Netlify upload, use the separate `moodrobe-netlify-dist.zip` (built static files only). Upload/extract its contents as requested by the Netlify UI. A source ZIP is not a built website.

## Vercel from the same GitHub repository
Import the same source repository. Root Directory: repository root, or moodrobe if nested. Framework: Vite. Build: `npm run build`. Output: `dist`. Node: 22.x. vercel.json includes the build settings and browser permission/security headers. No environment variables or database setup is needed.

Official references: https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/ and https://vercel.com/docs/frameworks/frontend/vite

## Data portability and limits
Netlify and Vercel can host the same source independently. Browser storage is scoped to the exact origin (scheme, hostname and port). Export a wardrobe backup from the old site and import it on the new one to move personal data; optional usability results have their own separate export. There is no automatic cross-device or cross-domain synchronisation. This is the existing local-first behaviour, not a removed cloud feature. Clearing browser data can erase local records.

HTTPS is required for optional camera, microphone and geolocation; permission denial must leave the rest of the app usable. Hosting access controls are separate from the app and do not migrate from Sites. Configure the desired audience before sharing beta URLs. The first neural request serves about 37 MB of model/runtime files, so hosting bandwidth limits still apply.

## Reproduce verification
With Node 22.12+:

```
npm ci
npm test
npm run test:e2e
npm run build
npm run preview -- --port 5180
# In a second terminal:
node scripts/verify-production.mjs
```

Playwright uses installed Chrome on macOS, or install Chromium using `npx playwright install chromium`. Production inference verifies contrasting briefs produce different leading outfits with no external inference requests. Hosting platform deployment itself must be confirmed after importing into the target account.
