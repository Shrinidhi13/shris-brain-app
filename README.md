# Shri's Stock Brain

A cinematic, local-first stock philosophy explorer built around Shri's stated investing preferences and selected portfolio evidence.

## Current architecture

The web app and the ChatGPT Skill are companions, not a live integrated system. The Skill can research a company and export app-compatible JSON; the user then imports that file into the web app. The app does not invoke or execute the installed ChatGPT Skill directly.

`serve.py` is a small local static-file server. It is not the stock-analysis API. The deterministic screen runs in browser JavaScript, while optional market lookup requests go directly from the browser to Alpha Vantage.

## What it does

- Opens with an animated decision graph of Shri's holdings and philosophy clusters.
- Calculates a transparent **Shri Happiness Meter**.
- Keeps **Shri fit** separate from **fundamental quality** so a low-P/E value trap cannot pass merely because it feels familiar.
- Uses sector-specific tests for banks, NBFCs, infrastructure/EPC, power, pharma, cyclicals, auto, real estate and hospitality.
- Accepts a normalized JSON file, a Skill-output JSON file, a one-row/key-value CSV, or a quick manual screen.
- Offers an optional free **BSE end-of-day** lookup through Alpha Vantage. Free API limits and incomplete Indian fundamentals are shown honestly.
- Includes a scenario lab, evidence-gap view, kill conditions, portfolio-overlap view and editable philosophy weights.
- Stores the optional API key and philosophy changes only in browser local storage when explicitly requested.

## Run it

From this folder:

```bash
python3 serve.py
```

Then open `http://127.0.0.1:8080` in a modern browser.

You can also use any static web server, for example:

```bash
python3 -m http.server 8080
```

Do not open `index.html` directly with `file://` if you want JSON downloads, local sample files and API calls to behave consistently.

## First run

1. Click **Play the brain tour** to inspect the portfolio-philosophy graph.
2. In **Analyze**, run either demo card. The first is a good-fit regional bank; the second demonstrates a Shri-shaped EPC value trap.
3. Upload `sample-data/company-input-template.json`, one of the examples, or a JSON created by the companion Skill.
4. For a free market snapshot, obtain your own Alpha Vantage key and enter a documented BSE-form symbol such as `RELIANCE.BSE`.

## Files

- `index.html` — semantic interface.
- `styles.css` — visual system, responsive layout and motion.
- `profile.js` — Shri's editable philosophy calibration and portfolio graph.
- `scoring.js` — browser-side deterministic scoring engine.
- `app.js` — interactions, canvases, upload/lookup workflow and reporting.
- `sample-data/` — template and fictional test cases.
- `serve.py` — dependency-free local server.

## Data reality

The app deliberately avoids hidden scraping. Alpha Vantage documents global daily equity data and provides a BSE symbol example, but its free allowance is small and fundamentals can be incomplete for Indian securities. NSE's official real-time and delayed feeds are licensed data products. Use exchange/company filings or a cited companion-Skill export for serious fundamental work.

## Philosophy calibration

The current calibration excludes Eureka, IRCTC, GNFC and Franklin Industries at Shri's request. Mutual-fund look-through holdings are not treated as personal stock selections. Account-return claims are not displayed in the interface.

## Disclaimer

Educational and experimental research tool only. It is not personalised investment advice, a recommendation to buy or sell, a target price, or a forecast of returns. Inputs can be stale, incomplete or wrong. Verify current filings, market data, governance and tax/regulatory implications independently.

## Build note

Build `2026.07.12-brain-r2` keeps the performance panel removed, replaces the central circle with an animated neon-green brain, and serves all local assets with `Cache-Control: no-store` to prevent stale JavaScript during development.
