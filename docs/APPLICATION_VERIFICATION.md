# Moodrobe v2.1 verification
21 October 2026 · Local Chrome on macOS · Automated engineering checks, not participant evidence.

- 21 unit checks passed: complete owned-item combinations, ranking, real preference-head learning, legacy migration, backup validation and usability schemas.
- 11 browser checks passed: daily journey, photos, private backups, actual neural inference and training, media permission denial/cleanup, desktop/mobile automated accessibility, isolated review mode, consent/export and local research import/deduplication with escaped comments.
- Automated accessibility checks cover the app screens, guided review, project brief and research page. They do not substitute for a manual assistive-technology audit.
- The real inference check uses the bundled model; no model responses are mocked. A development-only first-use dependency reload found during testing was corrected by prebundling the worker dependency.
- The existing contribution block was compared with the prior source and remains unchanged.
- No participant sessions or user-study results are bundled. Test-only fixtures remain in test source.

Reproduce: npm ci; npm test; npm run test:e2e; npm run build.
