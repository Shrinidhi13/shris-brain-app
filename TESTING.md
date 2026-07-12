# Validation notes

Validated on 11 July 2026 with system Chromium and Python 3.

- Desktop viewport: 1280 × 900; no horizontal overflow.
- Mobile viewport: 390 × 844; no horizontal overflow.
- Good-value bank demo: score 78/100; classified as a Shri-aligned quality candidate.
- Cheap-looking EPC demo: score 61/100; classified as Shri-shaped value-trap risk.
- Tested JSON upload, CSV upload, manual input, result tabs, scenario lab, kill conditions, and missing-API-key handling.
- Tested the dependency-free local server and sample-data route.

The demo companies and demo financial values are fictional and exist only to test the scoring behavior.

## Architecture checks

- `serve.py` serves static files only; it does not call the companion Skill.
- Skill integration is a manual JSON export/import handoff.
- `/favicon.ico` returns an empty successful response to avoid a harmless browser-generated 404.
- The previous performance panel is absent.
- No Zerodha, Kotak, Great Eastern Shipping return, 70% return, or account-performance text appears in the app source.
