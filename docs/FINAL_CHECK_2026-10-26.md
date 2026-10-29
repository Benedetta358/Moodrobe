# Final beta hosting check — 26 October 2026

Scope: Moodrobe only. Curriculum/contribution statements and application functionality are unchanged. No Netlify/Vercel account deployment or GitHub repository creation was performed.

## Observed results
- Clean dependency installation from package-lock.json succeeded.
- 21 unit tests and 11 browser tests passed (32 total).
- Static production build succeeded; required entry pages, downloads, model and WASM runtime are present.
- Real production inference produced different leading outfits for contrasting formal and casual briefs, with zero external requests and zero page errors in that check.
- npm audit reported zero vulnerabilities.
- Netlify TOML and Vercel JSON parse successfully and agree on build command and dist output.
- No application source code or dependency versions were changed by this hosting preparation.
- No external database dependency exists. Data remains in IndexedDB/localStorage/sessionStorage as appropriate. The optional weather request remains available.
- Largest production file: 22,972,370 bytes (quantised model). Git LFS is not needed for this file.

## Added hosting preparation
- netlify.toml: static build/output, Node 22 and permission/security headers.
- public/_headers: matching headers for manual Netlify uploads.
- .gitignore: excludes environment secrets and local Netlify/Vercel metadata.
- docs/DEPLOYMENT.md and README: GitHub, Netlify, Vercel and manual data migration instructions.

The portable source archive excludes Git history, Sites metadata, dependencies, builds and temporary recordings. The separate Netlify archive contains the built website. Hosting access settings must be configured on the destination; they do not transfer from Sites. Live hosting/platform headers and deployment success still require confirmation in the chosen account after upload.
