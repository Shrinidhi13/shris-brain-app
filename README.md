# Shri's Stock Brain

<p align="center">
  <strong>A cinematic, local-first stock philosophy explorer built around Shri's investing style.</strong>
</p>

<p align="center">
  <img alt="Local-first" src="https://img.shields.io/badge/local--first-yes-8cff55">
  <img alt="No build step" src="https://img.shields.io/badge/build%20step-none-59e6ff">
  <img alt="Frontend" src="https://img.shields.io/badge/frontend-HTML%20%2B%20CSS%20%2B%20JavaScript-f2c14e">
  <img alt="Purpose" src="https://img.shields.io/badge/purpose-educational-ff7abf">
</p>

<p align="center">
  <a href="https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY/">Live demo</a>
  ·
  <a href="./skill.zip">Download the companion Skill</a>
</p>

<!-- Add a screenshot at docs/preview.png, then uncomment the line below. -->
<!-- ![Shri's Stock Brain preview](docs/preview.png) -->

## What is Shri's Stock Brain?

Shri's Stock Brain is an experimental stock-research interface that asks two different questions:

1. **Does this company match Shri's investing philosophy?**
2. **Is it fundamentally strong enough to deserve serious research?**

Those questions are deliberately kept separate. A company can look cheap, tangible and familiar while still being a weak business or a value trap.

The project contains two companion components:

- **Web app:** an animated, browser-based experience with the Shri Happiness Meter, philosophy graph, sector checks, scenarios and evidence gaps.
- **ChatGPT Skill:** a research workflow that can investigate a listed company, apply the same philosophy and export app-compatible JSON.

> [!IMPORTANT]
> The web app and the ChatGPT Skill are not live-connected. The Skill can create a structured JSON result, and the user can then import that file into the web app. The browser does not invoke or execute the installed Skill directly.

## Architecture

```mermaid
flowchart LR
    A[Manual input, JSON, CSV or market snapshot] --> B[Web app]
    C[Companion ChatGPT Skill] -->|Exports app-compatible JSON| B
    B --> D[Shri Happiness Meter]
    B --> E[Fundamental quality]
    B --> F[Sector-specific checks]
    B --> G[Scenarios, evidence gaps and kill conditions]
```

`serve.py` is only a small local static-file server. It is **not** a stock-analysis API. Deterministic scoring runs in browser JavaScript. Optional Alpha Vantage requests are also made directly from the browser.

## Highlights

- Animated **decision constellation** built from selected portfolio evidence and philosophy clusters.
- Neon-green animated **Shri Brain** at the centre of the graph.
- Transparent **Shri Happiness Meter**.
- Separate **philosophy-fit** and **fundamental-quality** scores.
- Sector-specific logic for:
  - Banks
  - NBFCs
  - Infrastructure and EPC
  - Power and utilities
  - Pharmaceuticals
  - Cyclicals
  - Automobiles
  - Real estate
  - Hospitality
- Value-trap warnings when a stock matches Shri's style but fails quality checks.
- Scenario lab, evidence-gap view, kill conditions and portfolio-overlap analysis.
- Editable philosophy weights.
- Import support for normalized JSON, Skill-output JSON and CSV.
- Optional free BSE end-of-day lookup through Alpha Vantage.
- Local browser storage only when the user explicitly chooses to remember settings.

## Philosophy model

The current model can be described as:

### India Tangible-Growth and Rerating Barbell

It looks for combinations of:

- Low or reasonable valuation.
- A visible rerating, turnaround or earnings-improvement trigger.
- Tangible assets or an understandable economic engine.
- India-specific structural growth.
- Asset backing, distribution, licences, concessions or cash returns.
- Willingness to accept volatility when downside appears supported.
- A smaller group of quality anchors balancing cyclical and turnaround positions.

The model is an editable hypothesis, not a permanent psychological diagnosis. Its weights can be adjusted inside the app.

## Quick start

### Option 1: Open the hosted version

After enabling GitHub Pages, replace the placeholder link near the top of this README with:

```text
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY/
```

### Option 2: Run locally

From the repository folder:

```bash
python3 serve.py
```

Then open:

```text
http://127.0.0.1:8080
```

You can also use any static web server:

```bash
python3 -m http.server 8080
```

Opening `index.html` directly may display the interface, but a local HTTP server is recommended for consistent JSON loading, downloads and API requests.

## First run

1. Select **Play the brain tour** to explore the philosophy graph.
2. Open **Analyze** and try either built-in demonstration:
   - A regional bank that fits the philosophy and passes the quality screen.
   - An EPC company that looks Shri-like but is flagged as a possible value trap.
3. Upload one of the files in `sample-data/`.
4. Adjust the philosophy weights and observe how the result changes.
5. For an optional market snapshot, enter your own Alpha Vantage key and a documented BSE-form symbol such as `RELIANCE.BSE`.

## Companion ChatGPT Skill

The repository includes the companion package:

```text
skill.zip
```

Where user-created Skills are supported, download the ZIP and import it through the ChatGPT Skills interface.

Example request:

```text
Analyze State Bank of India using Shri's Stock Brain.
Separate Shri Fit from Fundamental Quality, use current primary sources,
and export app-compatible JSON.
```

The intended handoff is:

```text
ChatGPT Skill
    ↓
structured research result
    ↓
app-compatible JSON
    ↓
manual import into the web app
```

The Skill and the website share a philosophy and data format, but they remain separate programs.

## Accepted inputs

### Normalized JSON

Use `sample-data/company-input-template.json` as the starting point.

### Skill-output JSON

Import a result exported by the companion Skill.

### CSV

The app accepts a supported single-row or key-value CSV structure. See the examples in `sample-data/`.

### Manual screen

Enter a smaller set of metrics for a quick deterministic result.

### Optional market lookup

The app can request a free end-of-day BSE snapshot using the visitor's own Alpha Vantage key. Free limits are small, and Indian fundamental coverage can be incomplete.

## Repository structure

```text
.
├── index.html             # Main semantic interface
├── styles.css             # Visual system, responsive layout and motion
├── profile.js             # Philosophy calibration and portfolio graph
├── scoring.js             # Browser-side deterministic scoring engine
├── app.js                 # Interactions, canvas rendering and workflows
├── serve.py               # Dependency-free local static server
├── sample-data/           # Templates and fictional test cases
├── TESTING.md             # Manual validation notes
├── README.md
└── skill.zip              # Companion ChatGPT Skill
```

## Privacy

This public repository does **not** include:

- Amounts invested.
- Current portfolio value.
- Holding quantities.
- Average purchase prices.
- Holding-level profit and loss.
- XIRR.
- Brokerage account numbers.
- DP IDs.
- Login credentials.
- API keys.

It does include selected stock names, explicit exclusions and an inferred investing philosophy. Anyone can inspect those details in the public source code.

No API key is bundled. Visitors who use the optional lookup must supply their own key. Do not commit a personal or paid API key to this repository.

## Data reality

The project deliberately avoids hidden scraping.

Free market-data sources can be delayed, rate-limited or incomplete. A low-confidence or incomplete result should be treated as a request for more evidence, not as a stock verdict.

For serious research, verify:

- Current exchange filings.
- Annual and quarterly reports.
- Corporate announcements.
- Auditor commentary.
- Shareholding and dilution.
- Debt and contingent liabilities.
- Sector-specific regulatory issues.
- Current market price and valuation.

## GitHub Pages deployment

This app is static and can be hosted using GitHub Pages.

A typical setup is:

1. Keep `index.html` in the repository root.
2. Open the repository's **Settings**.
3. Open **Pages**.
4. Publish from the `main` branch and the repository root.
5. Replace the live-demo placeholder in this README with the published URL.

`serve.py` is for local development only and will not run on GitHub Pages.

## Known limitations

- No automatic connection between the website and ChatGPT Skill.
- No secure backend or server-side secret storage.
- No guaranteed live Indian-market fundamentals.
- No automatic brokerage synchronization.
- No statistical return-correlation engine in the current graph.
- No target prices or guaranteed return forecasts.
- Results depend on the completeness and accuracy of supplied data.
- The philosophy model is calibrated from a limited set of examples.

## Roadmap

Possible future improvements:

- Secure backend for one-click research and structured results.
- Broader primary-source ingestion.
- Statistical portfolio-correlation analysis using aligned price histories.
- Shareable stock-analysis reports.
- Versioned philosophy profiles.
- Expanded sector-specific scoring.
- Optional private portfolio mode.
- Better data-provider integrations.

## Contributing

Issues, suggestions and pull requests are welcome.

Useful contributions include:

- Better sector checks.
- Additional fictional test cases.
- Accessibility improvements.
- Mobile and performance fixes.
- More transparent scoring explanations.
- Safer data-provider integrations.

Please do not submit real brokerage credentials, private API keys or another person's confidential portfolio data.

## Disclaimer

Shri's Stock Brain is an educational and experimental research project.

It is not:

- Personalized investment advice.
- A recommendation to buy, sell or hold a security.
- A target-price service.
- A promise or forecast of returns.
- A substitute for professional financial, legal, tax or regulatory advice.

Inputs and outputs may be stale, incomplete, incorrect or misleading. Independently verify current filings, market data, governance, valuation, liquidity, tax treatment and regulatory implications before making any investment decision.

## License

No license has been selected yet. Add a `LICENSE` file before inviting unrestricted reuse.

For a permissive open-source project, the MIT License is a common option. For a personal public showcase, you may instead keep the source publicly viewable without granting broad reuse rights.
