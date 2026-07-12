window.SHRI_PROFILE = {
  version: "1.1-clean",
  name: "India tangible-growth and rerating barbell",
  shortName: "Shri's investing DNA",
  confidence: 73,
  asOf: "2026-07-11",
  note: "Inferred from one portfolio and explicit exclusions. Treat as a living hypothesis, not a permanent personality label.",
  weights: {
    valuation: 92,
    catalyst: 88,
    tangible: 82,
    indiaTailwind: 78,
    balanceSheet: 76,
    improvement: 74,
    quality: 72,
    assetBacking: 66,
    diversification: 58
  },
  excludedFromCalibration: [
    "Eureka Industries / rights entitlement",
    "IRCTC",
    "GNFC",
    "Franklin Industries"
  ],
  clusters: [
    {
      id: "quality",
      label: "Quality anchors",
      accent: "#b7ff5a",
      description: "Established franchises that stop the portfolio from becoming only a rerating bet."
    },
    {
      id: "financial",
      label: "Financial rerating",
      accent: "#5af7ff",
      description: "Low or reasonable valuation plus improving asset quality, returns or distribution."
    },
    {
      id: "capex",
      label: "India capex",
      accent: "#ffcf5a",
      description: "Roads, power and policy-backed tangible growth, with cash-conversion risk."
    },
    {
      id: "cyclical",
      label: "Asset-backed cyclicals",
      accent: "#ff7ee2",
      description: "Hard assets, cycle awareness, balance-sheet support and rerating optionality."
    },
    {
      id: "turnaround",
      label: "Turnaround / product cycle",
      accent: "#8d8bff",
      description: "Operational change can matter more than a static valuation snapshot."
    },
    {
      id: "special",
      label: "Special situations",
      accent: "#ff826e",
      description: "NAV, demerger or event value, but only with a defined catalyst and governance checks."
    },
    {
      id: "diversifier",
      label: "Diversifier",
      accent: "#9ca8bf",
      description: "Useful context but weak evidence of individual stock-picking philosophy."
    }
  ],
  holdings: [
    {
      symbol: "SBIN",
      name: "State Bank of India",
      cluster: "quality",
      status: "current",
      signal: 0.92,
      traits: ["reasonable valuation", "scale", "credit cycle", "tangible franchise"],
      thesis: "A large, understandable bank where valuation and operating improvement can coexist."
    },
    {
      symbol: "CHOLAFIN",
      name: "Cholamandalam Investment",
      cluster: "quality",
      status: "current",
      signal: 0.86,
      traits: ["quality lender", "distribution", "growth", "execution"],
      thesis: "The clearest quality-compounder exception inside an otherwise value-and-catalyst portfolio."
    },
    {
      symbol: "CIPLA",
      name: "Cipla",
      cluster: "quality",
      status: "current",
      signal: 0.82,
      traits: ["defensive", "brand", "healthcare", "cash generation"],
      thesis: "A defensive quality anchor with a familiar franchise and visible products."
    },
    {
      symbol: "DRREDDY",
      name: "Dr. Reddy's Laboratories",
      cluster: "quality",
      status: "current",
      signal: 0.82,
      traits: ["pharma", "pipeline", "global", "quality"],
      thesis: "A quality and pipeline bet, but only when regulatory execution remains credible."
    },
    {
      symbol: "KTKBANK",
      name: "The Karnataka Bank",
      cluster: "financial",
      status: "current",
      signal: 1.0,
      traits: ["small bank", "low PE", "rerating", "asset-quality improvement"],
      thesis: "Strong evidence of Shri's attraction to inexpensive regional banks with an improvement path."
    },
    {
      symbol: "TMB",
      name: "Tamilnad Mercantile Bank",
      cluster: "financial",
      status: "current",
      signal: 0.9,
      traits: ["small bank", "low valuation", "asset quality", "growth"],
      thesis: "A second expression of the small-bank value-plus-quality preference."
    },
    {
      symbol: "LTF",
      name: "L&T Finance",
      cluster: "financial",
      status: "current",
      signal: 0.76,
      traits: ["NBFC", "retailisation", "rerating", "credit cycle"],
      thesis: "A lender transformation thesis rather than a static deep-value holding."
    },
    {
      symbol: "IRB",
      name: "IRB Infrastructure Developers",
      cluster: "capex",
      status: "current",
      signal: 0.95,
      traits: ["roads", "toll assets", "India capex", "asset monetisation"],
      thesis: "Tangible concession assets plus policy tailwind and rerating potential."
    },
    {
      symbol: "ASHOKA",
      name: "Ashoka Buildcon",
      cluster: "capex",
      status: "current",
      signal: 0.91,
      traits: ["EPC", "order book", "roads", "monetisation"],
      thesis: "A classic order-book and asset-monetisation idea where cash conversion is the key test."
    },
    {
      symbol: "TATAPOWER",
      name: "Tata Power",
      cluster: "capex",
      status: "current",
      signal: 0.84,
      traits: ["power demand", "renewables", "capex", "platform"],
      thesis: "Structural power demand with visible assets, but capital intensity must earn its cost."
    },
    {
      symbol: "TATASTEEL",
      name: "Tata Steel",
      cluster: "cyclical",
      status: "current",
      signal: 0.8,
      traits: ["hard assets", "cycle", "commodity", "operating leverage"],
      thesis: "Asset-backed cyclicality; trailing P/E is less useful than normalized margins and debt."
    },
    {
      symbol: "ONGC",
      name: "ONGC",
      cluster: "cyclical",
      status: "current",
      signal: 0.74,
      traits: ["energy assets", "dividend", "commodity", "state franchise"],
      thesis: "A cash-return and asset-value expression with commodity and policy exposure."
    },
    {
      symbol: "GESHIP",
      name: "Great Eastern Shipping",
      cluster: "cyclical",
      status: "realised",
      signal: 0.93,
      traits: ["asset backing", "shipping cycle", "cash returns", "low valuation"],
      thesis: "A realised winner that reinforces the asset-backed cyclical-value hypothesis, without proving every cyclical thesis."
    },
    {
      symbol: "TMPV",
      name: "Tata Motors Passenger Vehicles",
      cluster: "turnaround",
      status: "current",
      signal: 0.88,
      traits: ["product cycle", "market share", "turnaround", "auto"],
      thesis: "A higher-volatility operating change thesis with meaningful product-cycle upside."
    },
    {
      symbol: "VALORESTATE",
      name: "Valor Estate",
      cluster: "special",
      status: "current",
      signal: 0.67,
      traits: ["NAV", "real estate", "special situation", "rerating"],
      thesis: "Suggests comfort with asset-value situations, but governance and cash conversion are decisive."
    },
    {
      symbol: "ADVENTHTL",
      name: "Advent Hotels International",
      cluster: "special",
      status: "inherited",
      signal: 0.45,
      traits: ["demerger", "hospitality", "corporate action"],
      thesis: "Lower-signal evidence because the position is partly a corporate-action consequence."
    },
    {
      symbol: "MAFANG",
      name: "Mirae Asset NYSE FANG+ ETF",
      cluster: "diversifier",
      status: "context",
      signal: 0.35,
      traits: ["international", "technology", "ETF", "diversifier"],
      thesis: "Shows a diversification impulse, not a direct operating-company selection rule."
    }
  ],
  biasGuard: [
    {
      title: "Cheap is not automatically value",
      detail: "A low P/E can reflect weak economics, accounting risk or peak-cycle earnings."
    },
    {
      title: "Order book is not cash flow",
      detail: "Infra growth earns no points unless receivables, working capital and leverage are controlled."
    },
    {
      title: "Good theme, bad shareholder return",
      detail: "India capex or policy support must translate into per-share cash economics."
    },
    {
      title: "Past winners do not prove the rule",
      detail: "GE Shipping supports the hypothesis but must not create outcome bias toward every cyclical."
    },
    {
      title: "Position size is part of the thesis",
      detail: "A stock can be attractive and still be a poor addition when the portfolio already owns the same risk."
    }
  ]
};
