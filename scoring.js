(function () {
  "use strict";

  const DISCLAIMER = "Educational research aid only. This score is not personalised investment advice, a recommendation to transact, or a forecast of returns.";

  const REQUIRED = {
    bank: ["valuation.pe", "valuation.pb", "quality.roe", "quality.roa", "banking.gross_npa", "banking.net_npa", "banking.capital_adequacy", "banking.loan_growth", "banking.deposit_growth"],
    nbfc: ["valuation.pe", "valuation.pb", "quality.roe", "quality.roa", "banking.gross_npa", "banking.net_npa", "banking.capital_adequacy", "quality.debt_to_equity"],
    infrastructure: ["valuation.pe", "valuation.ev_ebitda", "quality.roce", "quality.ocf_to_pat", "quality.net_debt_to_ebitda", "quality.interest_coverage", "operating.order_book_to_revenue", "operating.working_capital_days"],
    power: ["valuation.pe", "quality.roce", "quality.ocf_to_pat", "quality.net_debt_to_ebitda", "quality.interest_coverage"],
    pharma: ["valuation.pe", "quality.roce", "quality.revenue_cagr_3y", "quality.profit_cagr_3y", "quality.ocf_to_pat", "quality.fcf_positive_years_5", "qualitative.regulatory_or_pipeline_quality"],
    cyclical: ["valuation.pb", "valuation.ev_ebitda", "quality.roce", "quality.net_debt_to_ebitda", "quality.interest_coverage", "valuation.dividend_yield", "qualitative.cyclicality"],
    auto: ["valuation.pe", "quality.roce", "quality.profit_cagr_3y", "quality.ocf_to_pat", "quality.net_debt_to_ebitda", "operating.market_share_trend"],
    real_estate: ["valuation.pb", "quality.net_debt_to_ebitda", "operating.presales_growth", "operating.collections_to_sales", "operating.nav_discount", "qualitative.governance"],
    hospitality: ["valuation.ev_ebitda", "quality.roce", "quality.net_debt_to_ebitda", "quality.ocf_to_pat", "qualitative.governance"],
    generic: ["valuation.pe", "quality.roe", "quality.roce", "quality.profit_cagr_3y", "quality.ocf_to_pat", "quality.net_debt_to_ebitda"]
  };

  const NEIGHBORS = {
    bank: ["The Karnataka Bank", "Tamilnad Mercantile Bank", "State Bank of India"],
    nbfc: ["Cholamandalam Investment", "L&T Finance"],
    infrastructure: ["IRB Infrastructure", "Ashoka Buildcon", "Tata Power"],
    power: ["Tata Power", "ONGC"],
    pharma: ["Cipla", "Dr. Reddy's Laboratories"],
    cyclical: ["Tata Steel", "ONGC", "Great Eastern Shipping (realised)"],
    auto: ["Tata Motors Passenger Vehicles"],
    real_estate: ["Valor Estate", "Advent Hotels"],
    hospitality: ["Advent Hotels", "Valor Estate"],
    generic: []
  };

  function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
  }

  function num(value) {
    if (value === null || value === undefined || value === "" || typeof value === "boolean") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function get(obj, path) {
    return path.split(".").reduce((acc, key) => (acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : null), obj);
  }

  function linear(value, points) {
    value = num(value);
    if (value === null) return null;
    const ordered = [...points].sort((a, b) => a[0] - b[0]);
    if (value <= ordered[0][0]) return clamp(ordered[0][1]);
    if (value >= ordered[ordered.length - 1][0]) return clamp(ordered[ordered.length - 1][1]);
    for (let i = 0; i < ordered.length - 1; i += 1) {
      const [x0, y0] = ordered[i];
      const [x1, y1] = ordered[i + 1];
      if (value >= x0 && value <= x1) {
        return clamp(y0 + ((value - x0) / (x1 - x0)) * (y1 - y0));
      }
    }
    return null;
  }

  function weighted(items) {
    const valid = items.filter(([value, weight]) => value !== null && value !== undefined && Number.isFinite(value) && weight > 0);
    if (!valid.length) return null;
    const total = valid.reduce((sum, [, weight]) => sum + weight, 0);
    return valid.reduce((sum, [value, weight]) => sum + value * weight, 0) / total;
  }

  function round(value) {
    return Math.round(clamp(value === null || value === undefined ? 50 : value) * 10) / 10;
  }

  function sectorOf(data) {
    const raw = String(get(data, "company.sector") || "generic").toLowerCase().trim().replace(/[\s-]+/g, "_");
    const aliases = {
      banking: "bank",
      financial_services: "nbfc",
      finance: "nbfc",
      roads: "infrastructure",
      epc: "infrastructure",
      utility: "power",
      utilities: "power",
      pharmaceuticals: "pharma",
      steel: "cyclical",
      oil_gas: "cyclical",
      chemicals: "cyclical",
      automobile: "auto",
      realestate: "real_estate",
      hotel: "hospitality"
    };
    const sector = aliases[raw] || raw;
    return Object.prototype.hasOwnProperty.call(REQUIRED, sector) ? sector : "generic";
  }

  function valuationScore(data, sector) {
    const v = data.valuation || {};
    const q = data.quality || {};
    const b = data.banking || {};
    const positives = [];
    const cautions = [];
    let pe = num(v.pe);
    const pb = num(v.pb);
    const ev = num(v.ev_ebitda);
    if (pe !== null && pe <= 0) {
      cautions.push("P/E is not meaningful because earnings are non-positive or the value is invalid.");
      pe = null;
    }

    if (sector === "bank") {
      let peScore = linear(pe, [[5, 100], [8, 100], [10, 92], [13, 75], [18, 50], [25, 25], [40, 8]]);
      const pbScore = linear(pb, [[0.4, 98], [0.8, 92], [1.2, 82], [1.8, 65], [2.8, 42], [4.5, 18]]);
      const roa = num(q.roa);
      const roe = num(q.roe);
      const nnpa = num(b.net_npa);
      const qualityException = roa !== null && roe !== null && nnpa !== null && roa >= 1.3 && roe >= 15 && nnpa <= 1;
      if (qualityException && peScore !== null) {
        peScore = Math.min(100, peScore + 12);
        positives.push("Quality-bank exception applies: strong returns and controlled net NPA justify some valuation flexibility.");
      }
      const band = String(get(data, "company.market_cap_band") || "").toLowerCase();
      if (pe !== null && ["small", "mid", "regional"].includes(band) && pe <= 10) {
        positives.push(`P/E of ${pe.toFixed(1)}x matches Shri's preference for smaller banks below roughly 10x earnings.`);
      } else if (pe !== null && pe > 18 && !qualityException) {
        cautions.push(`P/E of ${pe.toFixed(1)}x is outside Shri's normal bank comfort zone without a proven quality exception.`);
      }
      return { score: round(weighted([[peScore, 0.62], [pbScore, 0.38]])), positives, cautions };
    }

    if (sector === "nbfc") {
      return {
        score: round(weighted([
          [linear(pe, [[7, 98], [12, 90], [18, 72], [25, 52], [35, 28], [50, 10]]), 0.65],
          [linear(pb, [[0.7, 95], [1.5, 84], [2.5, 65], [4, 42], [6, 18]]), 0.35]
        ])), positives, cautions
      };
    }

    if (sector === "pharma") {
      return {
        score: round(weighted([
          [linear(pe, [[10, 96], [18, 90], [25, 73], [35, 52], [50, 28], [70, 10]]), 0.7],
          [linear(ev, [[6, 96], [12, 82], [18, 62], [28, 35], [40, 15]]), 0.3]
        ])), positives, cautions
      };
    }

    if (["infrastructure", "power", "hospitality"].includes(sector)) {
      return {
        score: round(weighted([
          [linear(pe, [[5, 95], [10, 88], [16, 72], [24, 50], [35, 28], [50, 10]]), 0.45],
          [linear(ev, [[3, 98], [7, 86], [11, 68], [16, 45], [24, 20]]), 0.55]
        ])), positives, cautions
      };
    }

    if (sector === "cyclical") {
      const peScore = linear(pe, [[3, 92], [6, 85], [10, 65], [16, 42], [25, 20]]);
      const pbScore = linear(pb, [[0.4, 96], [0.9, 88], [1.4, 70], [2.2, 45], [3.5, 18]]);
      const evScore = linear(ev, [[2, 98], [5, 88], [8, 68], [12, 42], [18, 18]]);
      let score = weighted([[peScore, 0.25], [pbScore, 0.35], [evScore, 0.4]]) ?? 50;
      const cyc = num(get(data, "qualitative.cyclicality"));
      if (cyc !== null && cyc >= 70 && pe !== null && pe <= 8) {
        score = Math.min(score, 68);
        cautions.push("Trailing low P/E is capped because a highly cyclical company may be near peak earnings.");
      }
      return { score: round(score), positives, cautions };
    }

    if (sector === "real_estate") {
      return {
        score: round(weighted([
          [linear(pb, [[0.3, 98], [0.8, 88], [1.4, 70], [2.5, 45], [4, 18]]), 0.45],
          [linear(get(data, "operating.nav_discount"), [[-20, 20], [0, 45], [20, 70], [40, 88], [60, 98]]), 0.55]
        ])), positives, cautions
      };
    }

    return {
      score: round(weighted([
        [linear(pe, [[5, 96], [10, 90], [18, 75], [25, 58], [35, 38], [50, 18]]), 0.55],
        [linear(ev, [[3, 96], [7, 86], [12, 68], [18, 45], [28, 20]]), 0.25],
        [linear(v.dividend_yield, [[0, 30], [1, 50], [3, 75], [5, 90], [8, 98]]), 0.1],
        [linear(v.fcf_yield, [[-2, 10], [0, 35], [3, 65], [6, 85], [10, 98]]), 0.1]
      ])), positives, cautions
    };
  }

  function qualityScores(data, sector) {
    const q = data.quality || {};
    const b = data.banking || {};
    const o = data.operating || {};
    const qual = data.qualitative || {};
    const positives = [];
    const cautions = [];
    const roe = num(q.roe);
    const roa = num(q.roa);
    const roce = num(q.roce);
    const revenueGrowth = num(q.revenue_cagr_3y);
    const profitGrowth = num(q.profit_cagr_3y);
    const ocfPat = num(q.ocf_to_pat);
    const fcfYears = num(q.fcf_positive_years_5);
    const interest = num(q.interest_coverage);
    const debtEquity = num(q.debt_to_equity);
    const netDebt = num(q.net_debt_to_ebitda);
    const governance = num(qual.governance);
    const management = num(qual.management_execution);
    const capitalAllocation = num(qual.capital_allocation);

    if (["bank", "nbfc"].includes(sector)) {
      const roaScore = linear(roa, [[0.3, 12], [0.7, 38], [1, 58], [1.3, 76], [1.8, 94], [2.5, 100]]);
      const roeScore = linear(roe, [[5, 15], [9, 38], [12, 58], [15, 78], [19, 94], [24, 100]]);
      const npaScore = weighted([
        [linear(b.gross_npa, [[0.5, 100], [1.5, 92], [3, 70], [5, 42], [8, 15]]), 0.45],
        [linear(b.net_npa, [[0.1, 100], [0.6, 92], [1.5, 68], [3, 38], [5, 12]]), 0.45],
        [linear(b.credit_cost, [[0.1, 100], [0.5, 88], [1.2, 60], [2.5, 25], [4, 8]]), 0.1]
      ]);
      const capitalScore = weighted([
        [linear(b.capital_adequacy, [[9, 15], [12, 50], [15, 75], [18, 92], [24, 100]]), 0.75],
        [linear(b.provision_coverage, [[40, 20], [55, 45], [70, 72], [85, 92], [100, 100]]), 0.25]
      ]);
      const loanGrowth = num(b.loan_growth);
      const depositGrowth = num(b.deposit_growth);
      let trend = weighted([
        [linear(loanGrowth, [[-5, 5], [3, 30], [8, 55], [14, 82], [22, 95], [35, 65]]), 0.35],
        [linear(depositGrowth, [[-5, 5], [3, 30], [8, 58], [13, 82], [20, 95], [30, 78]]), 0.35],
        [linear(b.nim, [[1.5, 18], [2.2, 45], [3, 72], [4, 92], [5.5, 100]]), 0.15],
        [linear(profitGrowth, [[-15, 5], [0, 35], [8, 58], [15, 78], [25, 92], [40, 100]]), 0.15]
      ]);
      if (loanGrowth !== null && depositGrowth !== null && loanGrowth - depositGrowth > 6) {
        trend = Math.max(0, (trend ?? 50) - 12);
        cautions.push("Loan growth materially exceeds deposit growth, which may pressure funding or margins.");
      }
      const quality = weighted([[roaScore, 0.28], [roeScore, 0.22], [npaScore, 0.32], [management, 0.1], [governance, 0.08]]);
      const balance = weighted([[capitalScore, 0.55], [npaScore, 0.25], [governance, 0.2]]);
      if (roa !== null && roa >= 1.3) positives.push(`ROA of ${roa.toFixed(2)}% supports a quality-bank exception.`);
      if (roa !== null && roa <= 0.8) cautions.push(`ROA of ${roa.toFixed(2)}% is too weak to make a low valuation compelling.`);
      const nnpa = num(b.net_npa);
      if (nnpa !== null && nnpa <= 1) positives.push(`Net NPA of ${nnpa.toFixed(2)}% is controlled.`);
      if (nnpa !== null && nnpa >= 2.5) cautions.push(`Net NPA of ${nnpa.toFixed(2)}% raises value-trap risk.`);
      return { quality: round(quality), balance: round(balance), trend: round(trend), positives, cautions };
    }

    const roceScore = linear(roce, [[2, 10], [7, 35], [12, 58], [18, 80], [25, 94], [35, 100]]);
    const roeScore = linear(roe, [[3, 12], [8, 38], [12, 60], [18, 82], [25, 96], [35, 100]]);
    const ocfScore = linear(ocfPat, [[-0.5, 5], [0, 18], [0.6, 55], [1, 80], [1.4, 95], [2, 100]]);
    const fcfScore = linear(fcfYears, [[0, 5], [1, 25], [2, 45], [3, 68], [4, 86], [5, 100]]);
    const interestScore = linear(interest, [[0.5, 5], [1.2, 18], [2, 45], [4, 72], [7, 90], [12, 100]]);
    const debtEqScore = linear(debtEquity, [[0, 100], [0.4, 90], [1, 68], [2, 42], [4, 15], [8, 5]]);
    const netDebtScore = linear(netDebt, [[-1, 100], [0, 96], [1, 82], [2.5, 62], [4, 38], [6, 15], [9, 5]]);
    const revenueScore = linear(revenueGrowth, [[-10, 5], [0, 35], [8, 58], [15, 78], [25, 94], [40, 100]]);
    const profitScore = linear(profitGrowth, [[-20, 5], [0, 35], [8, 58], [15, 76], [25, 92], [40, 100]]);

    let quality = weighted([[roceScore, 0.28], [roeScore, 0.12], [ocfScore, 0.2], [fcfScore, 0.12], [management, 0.1], [capitalAllocation, 0.08], [governance, 0.1]]);
    const balance = weighted([[interestScore, 0.35], [netDebtScore, 0.35], [debtEqScore, 0.15], [governance, 0.15]]);
    let trend = weighted([[revenueScore, 0.42], [profitScore, 0.48], [management, 0.1]]);

    if (sector === "infrastructure") {
      const orderScore = linear(o.order_book_to_revenue, [[0, 10], [0.8, 45], [1.5, 70], [2.5, 90], [4, 100], [7, 82]]);
      const wcScore = linear(o.working_capital_days, [[20, 100], [60, 88], [100, 68], [160, 40], [240, 15], [360, 5]]);
      trend = weighted([[trend, 0.55], [orderScore, 0.25], [wcScore, 0.2]]);
      if (num(o.order_book_to_revenue) !== null && num(o.order_book_to_revenue) >= 2 && (ocfPat === null || ocfPat < 0.7)) {
        cautions.push("A strong order book is not yet supported by convincing operating cash conversion.");
      }
    }

    if (sector === "pharma") {
      const regulatory = num(qual.regulatory_or_pipeline_quality);
      quality = weighted([[quality, 0.8], [regulatory, 0.2]]);
      if (regulatory !== null && regulatory < 45) cautions.push("Regulatory or pipeline quality is weak enough to cap enthusiasm despite valuation.");
    }

    if (sector === "auto") {
      const marketScore = linear(o.market_share_trend, [[-5, 5], [-1, 30], [0, 50], [1, 68], [3, 88], [6, 100]]);
      trend = weighted([[trend, 0.72], [marketScore, 0.28]]);
    }

    if (sector === "real_estate") {
      const presales = linear(o.presales_growth, [[-20, 5], [0, 40], [10, 62], [25, 85], [50, 100]]);
      const collections = linear(o.collections_to_sales, [[40, 10], [65, 45], [85, 75], [100, 92], [120, 100]]);
      trend = weighted([[trend, 0.45], [presales, 0.3], [collections, 0.25]]);
    }

    if (roce !== null && roce >= 18) positives.push(`ROCE of ${roce.toFixed(1)}% indicates productive capital use.`);
    if (roce !== null && roce <= 8) cautions.push(`ROCE of ${roce.toFixed(1)}% is weak for the business risk.`);
    if (ocfPat !== null && ocfPat >= 1) positives.push(`Operating cash flow broadly supports reported profit at ${ocfPat.toFixed(2)}x PAT.`);
    if (ocfPat !== null && ocfPat <= 0.4) cautions.push(`Operating cash flow at ${ocfPat.toFixed(2)}x PAT does not adequately support reported earnings.`);
    if (netDebt !== null && netDebt <= 1.5) positives.push(`Net debt/EBITDA of ${netDebt.toFixed(1)}x is manageable.`);
    if (netDebt !== null && netDebt >= 4) cautions.push(`Net debt/EBITDA of ${netDebt.toFixed(1)}x leaves little room for execution errors.`);

    return { quality: round(quality), balance: round(balance), trend: round(trend), positives, cautions };
  }

  function fitScore(data, valuation, trend) {
    const q = data.qualitative || {};
    const profileWeights = (window.SHRI_PROFILE && window.SHRI_PROFILE.weights) || {};
    const score = weighted([
      [valuation, num(profileWeights.valuation) ?? 92],
      [num(q.catalyst), num(profileWeights.catalyst) ?? 88],
      [num(q.tangible_assets), num(profileWeights.tangible) ?? 82],
      [num(q.india_tailwind), num(profileWeights.indiaTailwind) ?? 78],
      [trend, num(profileWeights.improvement) ?? 74],
      [num(q.understandability), (num(profileWeights.tangible) ?? 82) * 0.7],
      [num(q.capital_allocation), num(profileWeights.quality) ?? 72],
      [linear(get(data, "valuation.dividend_yield"), [[0, 30], [1, 48], [3, 72], [5, 88], [8, 100]]), num(profileWeights.assetBacking) ?? 66]
    ]);
    const positives = [];
    const cautions = [];
    const catalyst = num(q.catalyst);
    if (catalyst !== null && catalyst >= 70) positives.push("A visible rerating or operating catalyst matches Shri's preference for change plus value.");
    if (catalyst !== null && catalyst < 40) cautions.push("The thesis appears cheap or thematic without a sufficiently visible catalyst.");
    if (num(q.tangible_assets) !== null && num(q.tangible_assets) >= 70) positives.push("The business has tangible assets or an understandable economic engine.");
    if (num(q.india_tailwind) !== null && num(q.india_tailwind) >= 70) positives.push("The company participates in an India-specific structural tailwind.");
    return { score: round(score), positives, cautions };
  }

  function portfolioScore(data) {
    const p = data.portfolio || {};
    let score = 78;
    const cautions = [];
    const currentWeight = num(p.current_weight);
    const sectorWeight = num(p.sector_weight);
    const overlap = num(p.overlap_score);
    if (currentWeight !== null) {
      if (currentWeight >= 8) {
        score -= 35;
        cautions.push(`Current portfolio weight of ${currentWeight.toFixed(1)}% is already concentrated.`);
      } else if (currentWeight >= 5) {
        score -= 22;
        cautions.push(`Current portfolio weight of ${currentWeight.toFixed(1)}% leaves limited room before concentration rises.`);
      } else if (currentWeight >= 3) score -= 10;
    }
    if (sectorWeight !== null) {
      if (sectorWeight >= 35) {
        score -= 30;
        cautions.push(`Sector exposure of ${sectorWeight.toFixed(1)}% creates substantial common-factor risk.`);
      } else if (sectorWeight >= 25) {
        score -= 18;
        cautions.push(`Sector exposure of ${sectorWeight.toFixed(1)}% is already elevated.`);
      } else if (sectorWeight >= 18) score -= 7;
    }
    if (overlap !== null) {
      if (overlap >= 80) {
        score -= 20;
        cautions.push("The stock closely duplicates drivers already present in the portfolio.");
      } else if (overlap >= 60) score -= 10;
    }
    return { score: round(score), cautions };
  }

  function confidenceScore(data, sector) {
    const required = REQUIRED[sector] || REQUIRED.generic;
    const missing = required.filter(path => num(get(data, path)) === null);
    const completeness = 100 * (required.length - missing.length) / required.length;
    const declared = num(get(data, "qualitative.data_confidence"));
    return { score: round(weighted([[completeness, 0.72], [declared, 0.28]]) ?? completeness), missing };
  }

  function redFlags(data) {
    const severeCodes = new Set(["fraud", "insolvency", "auditor_resignation", "qualified_audit", "governance_severe", "regulatory_threat"]);
    let penalty = 0;
    let cap = null;
    const cautions = [];
    (data.red_flags || []).forEach(item => {
      const obj = typeof item === "string" ? { code: item, severity: "medium", note: item } : item;
      if (!obj) return;
      const severity = String(obj.severity || "medium").toLowerCase();
      const code = String(obj.code || "unknown").toLowerCase().replace(/\s+/g, "_");
      penalty += ({ low: 3, medium: 8, high: 16, severe: 24 })[severity] || 8;
      cautions.push(`Red flag (${severity}): ${obj.note || code.replace(/_/g, " ")}.`);
      if (severity === "severe" || severeCodes.has(code)) cap = Math.min(cap ?? 100, 45);
    });
    return { penalty, cap, cautions };
  }

  function killConditions(sector) {
    const common = [
      "Material governance, audit or related-party evidence deteriorates.",
      "The catalyst is disproved or occurs without an improvement in per-share economics.",
      "The thesis requires permanently rising valuation multiples rather than business progress."
    ];
    const sectorSpecific = {
      bank: ["ROA remains structurally weak while the stock only appears cheap on P/E or P/B.", "Deposit growth persistently trails loan growth or asset-quality slippages accelerate."],
      nbfc: ["Stage 2/3 assets, credit cost, funding cost or ALM risk deteriorate faster than AUM grows."],
      infrastructure: ["Order-book growth fails to convert into operating cash flow or leverage rises without realised monetisation."],
      power: ["Capex returns fall below the cost of capital or debt grows faster than contracted cash flows."],
      pharma: ["A regulatory or product-quality issue expands beyond the base case or the launch pipeline fails."],
      cyclical: ["Normalized earnings and asset value no longer support the price after the cycle turns."],
      auto: ["Market share, margins or automotive free cash flow deteriorate despite the product cycle."],
      real_estate: ["Collections, approvals, title, delivery or leverage evidence breaks the NAV thesis."],
      hospitality: ["Occupancy or pricing normalizes while leverage and capex remain elevated."],
      generic: ["Cash conversion or returns on incremental capital remain below the required level."]
    };
    return common.concat(sectorSpecific[sector] || sectorSpecific.generic);
  }

  function classify(happiness, fit, fundamental, confidence) {
    const confidenceLabel = confidence < 40 ? "Low confidence — needs data" : confidence < 70 ? "Medium confidence" : "Higher confidence";
    const quadrant = fit >= 70 && fundamental >= 70
      ? "Shri-aligned quality candidate"
      : fit >= 70 && fundamental < 55
        ? "Shri-shaped value-trap risk"
        : fit < 60 && fundamental >= 75
          ? "Strong business, not naturally Shri-priced"
          : "Needs proof";
    const label = confidence < 40
      ? "Needs data before judgment"
      : happiness >= 85
        ? "Very Shri — serious research candidate"
        : happiness >= 72
          ? "Strong Shri match — verify valuation and risk"
          : happiness >= 58
            ? "Interesting — more proof required"
            : happiness >= 42
              ? "Tempting, but not enough"
              : "Low match or red-flagged";
    return { label, quadrant, confidenceLabel };
  }

  function analyze(data) {
    if (data && data.schema_version && data.scores && data.classification) return data;
    const sector = sectorOf(data);
    const valuation = valuationScore(data, sector);
    const quality = qualityScores(data, sector);
    const fit = fitScore(data, valuation.score, quality.trend);
    const portfolio = portfolioScore(data);
    const confidence = confidenceScore(data, sector);
    const governance = num(get(data, "qualitative.governance"));
    const fundamental = round(weighted([[quality.quality, 0.42], [quality.balance, 0.25], [quality.trend, 0.18], [governance, 0.15]]));
    let happiness = weighted([[fit.score, 0.4], [fundamental, 0.34], [valuation.score, 0.16], [portfolio.score, 0.1]]) ?? 50;
    const flags = redFlags(data);
    happiness -= flags.penalty;
    let cap = flags.cap;
    if (governance !== null && governance < 35) {
      cap = Math.min(cap ?? 100, 49);
      flags.cautions.push("Low governance score caps the composite regardless of valuation.");
    }
    if (cap !== null) happiness = Math.min(happiness, cap);
    happiness = round(happiness);
    const classification = classify(happiness, fit.score, fundamental, confidence.score);
    const positive = [...new Set([...valuation.positives, ...quality.positives, ...fit.positives])].slice(0, 7);
    const cautions = [...new Set([...valuation.cautions, ...quality.cautions, ...fit.cautions, ...portfolio.cautions, ...flags.cautions])].slice(0, 9);
    const overlap = num(get(data, "portfolio.overlap_score"));
    const relationship = overlap === null
      ? "Portfolio overlap requires user-supplied weights or factor tags."
      : overlap >= 70
        ? "High overlap with existing portfolio drivers."
        : overlap >= 45
          ? "Moderate overlap with existing portfolio drivers."
          : "Potential diversifier relative to existing holdings.";

    return {
      schema_version: "1.0",
      company: data.company || {},
      as_of: data.dates || {},
      scores: {
        happiness_score: happiness,
        shri_fit_score: fit.score,
        fundamental_quality_score: fundamental,
        valuation_score: valuation.score,
        balance_sheet_score: quality.balance,
        trend_score: quality.trend,
        portfolio_fit_score: portfolio.score,
        confidence_score: confidence.score
      },
      classification: {
        label: classification.label,
        quadrant: classification.quadrant,
        confidence_label: classification.confidenceLabel
      },
      reasons: {
        positive,
        cautions,
        missing: confidence.missing,
        kill_conditions: killConditions(sector)
      },
      score_components: [
        { name: "Shri fit", score: fit.score, composite_weight: 0.4 },
        { name: "Fundamental quality", score: fundamental, composite_weight: 0.34 },
        { name: "Valuation comfort", score: valuation.score, composite_weight: 0.16 },
        { name: "Portfolio fit", score: portfolio.score, composite_weight: 0.1 },
        { name: "Balance sheet", score: quality.balance, composite_weight: 0 },
        { name: "Trend", score: quality.trend, composite_weight: 0 },
        { name: "Evidence confidence", score: confidence.score, composite_weight: 0 }
      ],
      portfolio_relationship: {
        closest_holdings: NEIGHBORS[sector] || [],
        note: relationship
      },
      sources: data.sources || [],
      analyst_notes: data.analyst_notes || [],
      disclaimer: DISCLAIMER,
      raw_input: data
    };
  }

  function csvToObject(text) {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (!lines.length) throw new Error("The CSV is empty.");
    const parseLine = line => {
      const cells = [];
      let current = "";
      let quoted = false;
      for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
          if (quoted && line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else quoted = !quoted;
        } else if (char === "," && !quoted) {
          cells.push(current.trim());
          current = "";
        } else current += char;
      }
      cells.push(current.trim());
      return cells;
    };
    const rows = lines.map(parseLine);
    if (rows[0].length === 2 && rows.length > 2 && rows[0][0].toLowerCase() !== "symbol") {
      const flat = {};
      rows.forEach(([key, value]) => { flat[key] = value; });
      return fromFlat(flat);
    }
    const headers = rows[0];
    const values = rows[1] || [];
    const flat = {};
    headers.forEach((header, index) => { flat[header] = values[index] ?? ""; });
    return fromFlat(flat);
  }

  function setPath(target, path, value) {
    const parts = path.split(".");
    let cursor = target;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) cursor[part] = value;
      else {
        cursor[part] = cursor[part] || {};
        cursor = cursor[part];
      }
    });
  }

  function fromFlat(flat) {
    const aliases = {
      company_name: "company.name",
      name: "company.name",
      symbol: "company.symbol",
      ticker: "company.symbol",
      exchange: "company.exchange",
      sector: "company.sector",
      subsector: "company.subsector",
      market_cap_band: "company.market_cap_band",
      price_as_of: "dates.price_as_of",
      fundamentals_as_of: "dates.fundamentals_as_of",
      price: "valuation.price",
      market_cap_cr: "valuation.market_cap_cr",
      pe: "valuation.pe",
      pb: "valuation.pb",
      ev_ebitda: "valuation.ev_ebitda",
      dividend_yield: "valuation.dividend_yield",
      fcf_yield: "valuation.fcf_yield",
      roe: "quality.roe",
      roa: "quality.roa",
      roce: "quality.roce",
      revenue_cagr_3y: "quality.revenue_cagr_3y",
      profit_cagr_3y: "quality.profit_cagr_3y",
      ocf_to_pat: "quality.ocf_to_pat",
      fcf_positive_years_5: "quality.fcf_positive_years_5",
      interest_coverage: "quality.interest_coverage",
      debt_to_equity: "quality.debt_to_equity",
      net_debt_to_ebitda: "quality.net_debt_to_ebitda",
      gross_npa: "banking.gross_npa",
      net_npa: "banking.net_npa",
      credit_cost: "banking.credit_cost",
      provision_coverage: "banking.provision_coverage",
      capital_adequacy: "banking.capital_adequacy",
      casa: "banking.casa",
      nim: "banking.nim",
      loan_growth: "banking.loan_growth",
      deposit_growth: "banking.deposit_growth",
      order_book_to_revenue: "operating.order_book_to_revenue",
      working_capital_days: "operating.working_capital_days",
      market_share_trend: "operating.market_share_trend",
      presales_growth: "operating.presales_growth",
      collections_to_sales: "operating.collections_to_sales",
      nav_discount: "operating.nav_discount",
      governance: "qualitative.governance",
      management_execution: "qualitative.management_execution",
      capital_allocation: "qualitative.capital_allocation",
      tangible_assets: "qualitative.tangible_assets",
      understandability: "qualitative.understandability",
      india_tailwind: "qualitative.india_tailwind",
      catalyst: "qualitative.catalyst",
      regulatory_or_pipeline_quality: "qualitative.regulatory_or_pipeline_quality",
      cyclicality: "qualitative.cyclicality",
      data_confidence: "qualitative.data_confidence",
      current_weight: "portfolio.current_weight",
      sector_weight: "portfolio.sector_weight",
      overlap_score: "portfolio.overlap_score"
    };
    const output = { company: { security_type: "equity", currency: "INR" }, dates: { freshness: "user_uploaded" }, valuation: {}, quality: {}, banking: {}, operating: {}, qualitative: {}, portfolio: {}, red_flags: [], sources: [], analyst_notes: [] };
    Object.entries(flat).forEach(([rawKey, rawValue]) => {
      const key = String(rawKey).trim().toLowerCase().replace(/[\s/-]+/g, "_");
      const path = rawKey.includes(".") ? rawKey : aliases[key];
      if (!path) return;
      const numeric = num(rawValue);
      setPath(output, path, numeric === null ? String(rawValue).trim() || null : numeric);
    });
    return output;
  }

  function alphaToInput(symbol, daily, overview) {
    const series = daily && daily["Time Series (Daily)"];
    if (!series || typeof series !== "object") throw new Error(daily?.Note || daily?.Information || "No daily BSE data returned. Check the symbol and API limits.");
    const dates = Object.keys(series).sort().reverse();
    const latestDate = dates[0];
    const latest = series[latestDate] || {};
    const result = {
      company: {
        name: overview?.Name || symbol,
        symbol,
        exchange: overview?.Exchange || "BSE",
        security_type: "equity",
        sector: (overview?.Sector || "generic").toLowerCase(),
        subsector: overview?.Industry || null,
        market_cap_band: null,
        currency: overview?.Currency || "INR"
      },
      dates: {
        price_as_of: latestDate,
        fundamentals_as_of: overview?.LatestQuarter || null,
        freshness: "end_of_day"
      },
      valuation: {
        price: num(latest["4. close"]),
        market_cap_cr: num(overview?.MarketCapitalization) !== null ? num(overview.MarketCapitalization) / 1e7 : null,
        pe: num(overview?.PERatio),
        pb: num(overview?.PriceToBookRatio),
        ev_ebitda: num(overview?.EVToEBITDA),
        dividend_yield: num(overview?.DividendYield) !== null ? num(overview.DividendYield) * 100 : null,
        fcf_yield: null
      },
      quality: {
        roe: num(overview?.ReturnOnEquityTTM) !== null ? num(overview.ReturnOnEquityTTM) * 100 : null,
        roa: num(overview?.ReturnOnAssetsTTM) !== null ? num(overview.ReturnOnAssetsTTM) * 100 : null,
        roce: null,
        revenue_cagr_3y: null,
        profit_cagr_3y: num(overview?.QuarterlyEarningsGrowthYOY) !== null ? num(overview.QuarterlyEarningsGrowthYOY) * 100 : null,
        ocf_to_pat: null,
        fcf_positive_years_5: null,
        interest_coverage: null,
        debt_to_equity: null,
        net_debt_to_ebitda: null
      },
      banking: {},
      operating: {},
      qualitative: {
        governance: null,
        management_execution: null,
        capital_allocation: null,
        tangible_assets: null,
        understandability: null,
        india_tailwind: null,
        catalyst: null,
        regulatory_or_pipeline_quality: null,
        cyclicality: null,
        data_confidence: 35
      },
      portfolio: {},
      red_flags: [],
      sources: [{ title: "Alpha Vantage daily equity data", url: "https://www.alphavantage.co/", date: latestDate, type: "market_data" }],
      analyst_notes: ["Free API lookup supplied price and any available overview fields. Upload current filings or Skill JSON for a serious fundamental result."]
    };
    return result;
  }

  window.ShriScoring = { analyze, csvToObject, fromFlat, alphaToInput, get, num, clamp, DISCLAIMER };
}());
