(function () {
const { useEffect, useState } = React;
const { formatDatePtBr } = window.GCCommon;

function datasetFallbackResult(result, data, reason) {
  return {
    ...(result || {}),
    ok: true,
    data,
    fallback: true,
    meta: {
      ...(result?.meta || {}),
      status: "stale",
      asOf: data?.asOf || result?.meta?.asOf || null,
      source: `Embedded snapshot (${result?.meta?.path || "interface"})`,
      issues: [{ severity: "warning", code: "runtime_fallback", message: reason }],
    },
    error: result?.error || null,
  };
}

const EQUITY_PE = [
  { name: "Magnificent 7", value: 24.7, tone: "#4f7cff", note: "Main source of the premium." },
  { name: "S&P 500", value: 19.9, tone: "#48d6e9", note: "Broad-index benchmark." },
  { name: "S&P 400 MidCap", value: 16.2, tone: "#ffae6b", note: "More moderate valuation." },
  { name: "S&P 600 SmallCap", value: 15.9, tone: "#8ea0b8", note: "Discount with greater cyclicality." },
];

const EQUITY_PE_META = {
  "Magnificent 7": { tone: "#4f7cff", note: "Main source of the premium." },
  "S&P 500 Information Technology": { tone: "#5bbcff", note: "S&P 500 technology sector." },
  "S&P 500": { tone: "#48d6e9", note: "Broad-index benchmark." },
  "S&P 400 MidCap": { tone: "#ffae6b", note: "More moderate valuation." },
  "S&P 600 SmallCap": { tone: "#8ea0b8", note: "Discount with greater cyclicality." },
};

const EQUITY_VALUATION_SNAPSHOT = {
  asOf: "2026-07-21",
  source: "Yardeni Research / LSEG Datastream",
  methodology: "Approximate forward P/E manually read from the public chart Forward P/E Ratios: LargeCap, MidCap, SmallCap & Mag-7.",
  items: [
    { name: "Magnificent 7", forwardPE: 24.7 },
    { name: "S&P 500", forwardPE: 19.9 },
    { name: "S&P 400 MidCap", forwardPE: 16.2 },
    { name: "S&P 600 SmallCap", forwardPE: 15.9 },
  ],
};

const SP500_VALUATION_SNAPSHOT = {
  asOf: "2026-07-17",
  updatedAt: "2026-07-23",
  status: "ok",
  source: "FactSet Earnings Insight",
  methodology: "Automated extraction from public FactSet Insight earnings posts.",
  sp500: {
    forwardPE: 20.3,
    forwardEPS: null,
    trailingPE: null,
    averages: { "5y": 19.9, "10y": 19.0, "15y": null, "20y": null, "25y": null },
  },
};

function normalizeEquityPeData(payload) {
  const items = payload?.items?.map((item) => {
    const value = Number(item.forwardPE ?? item.value);
    if (!item.name || !Number.isFinite(value)) return null;
    const meta = EQUITY_PE_META[item.name] || {};
    return {
      name: item.name,
      value,
      tone: item.tone || meta.tone || "#48d6e9",
      note: item.note || meta.note || "Approximate forward P/E.",
    };
  }).filter(Boolean);
  if (!items?.length) return null;
  return {
    items,
    asOf: payload.asOf,
    source: payload.source,
    methodology: payload.methodology,
  };
}

function normalizeSp500ValuationData(payload) {
  const sp500 = payload?.sp500 || {};
  const cleanNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };
  return {
    asOf: payload?.asOf || null,
    source: payload?.source || "FactSet Earnings Insight",
    methodology: payload?.methodology || "Manual update based on the weekly report.",
    sp500: {
      forwardPE: cleanNumber(sp500.forwardPE),
      forwardEPS: cleanNumber(sp500.forwardEPS),
      trailingPE: cleanNumber(sp500.trailingPE),
      averages: {
        "5y": cleanNumber(sp500.averages?.["5y"]),
        "10y": cleanNumber(sp500.averages?.["10y"]),
        "15y": cleanNumber(sp500.averages?.["15y"]),
        "20y": cleanNumber(sp500.averages?.["20y"]),
        "25y": cleanNumber(sp500.averages?.["25y"]),
      },
    },
  };
}

function isAtLeastDate(value, minimum) {
  if (!value || !minimum) return false;
  return String(value) >= String(minimum);
}

function formatMultiple(value) {
  return `${value.toFixed(1).replace(".", ",")}x`;
}

function formatOptionalMultiple(value) {
  return Number.isFinite(value) ? formatMultiple(value) : "not available";
}

function formatOptionalNumber(value) {
  return Number.isFinite(value) ? value.toFixed(1).replace(".", ",") : "not available";
}

function formatMarketCap(value) {
  if (!Number.isFinite(value)) return "n/a";
  if (value >= 1_000_000_000_000) return `US$ ${(value / 1_000_000_000_000).toFixed(2).replace(".", ",")}tn`;
  if (value >= 1_000_000_000) return `US$ ${(value / 1_000_000_000).toFixed(0).replace(".", ",")}bn`;
  return `US$ ${value.toFixed(0).replace(".", ",")}`;
}

const FORWARD_PE_METHOD_NOTE =
  "Forward P/E can vary across providers because of differences in reference date, universe, treatment of non-recurring earnings, weighting and projected-EPS consensus definitions.";

function EquityPeChart({ valuationData }) {
  const activeItems = valuationData?.items?.length ? valuationData.items : EQUITY_PE;
  const maxPe = Math.max(...activeItems.map((item) => item.value));
  const mag7 = activeItems.find((item) => item.name === "Magnificent 7")?.value || activeItems[0]?.value;
  const premium = (base) => Math.round(((mag7 / base) - 1) * 100);
  const premiumItems = activeItems
    .filter((item) => item.name !== "Magnificent 7")
    .map((item) => [`Premium vs ${item.name.replace("S&P 500 Information Technology", "Technology").replace("S&P 400 ", "").replace("S&P 600 ", "")}`, `+${premium(item.value)}%`, item.tone]);
  const sourceText = valuationData?.source
    ? `Source: ${valuationData.source}, ${formatDatePtBr(valuationData.asOf) || "date not provided"}. Approximate values; proprietary chart.`
    : "Source: Yardeni Research, LSEG Datastream and S&P, 22/06/26. Approximate values; proprietary chart.";

  return React.createElement(
    "div",
    { className: "equity-pe-chart" },
    React.createElement("h2", null, "Market segments"),
    React.createElement(
      "div",
      { className: "pe-bars" },
      activeItems.map((item) =>
        React.createElement(
          "div",
          { className: "pe-bar-row", key: item.name, style: { "--tone": item.tone } },
          React.createElement("span", null, item.name),
          React.createElement(
            "div",
            { className: "pe-bar-track" },
            React.createElement("div", { className: "pe-bar-fill", style: { width: `${(item.value / maxPe) * 100}%` } }, formatMultiple(item.value))
          )
        )
      )
    ),
    React.createElement(
      "div",
      { className: "pe-premium-grid" },
      premiumItems.map(([label, value, tone]) =>
        React.createElement(
          "div",
          { className: "pe-premium", key: label, style: { "--tone": tone } },
          React.createElement("span", null, label),
          React.createElement("strong", null, value)
        )
      )
    ),
    React.createElement("p", { className: "data-note" }, sourceText)
  );
}

function Sp500ValuationContext({ data, relativeData }) {
  const fallbackSp500 = (relativeData?.items || EQUITY_PE).find((item) => item.name === "S&P 500")?.value || null;
  const sp500 = data?.sp500 || {};
  const forwardPE = Number.isFinite(sp500.forwardPE) ? sp500.forwardPE : fallbackSp500;
  const averages = Object.entries(sp500.averages || {}).filter(([, value]) => Number.isFinite(value));
  const barItems = [
    { label: "Current", value: forwardPE, tone: "#4f7cff" },
    { label: "5Y average", value: sp500.averages?.["5y"], tone: "#48d6e9" },
    { label: "10Y average", value: sp500.averages?.["10y"], tone: "#8ea0b8" },
  ].filter((item) => Number.isFinite(item.value));
  const maxBar = Math.max(...barItems.map((item) => item.value), 1);
  const averageComparisons = averages.map(([label, value]) => {
    const spread = Number.isFinite(forwardPE) ? forwardPE - value : null;
    const spreadPct = Number.isFinite(forwardPE) ? ((forwardPE / value) - 1) * 100 : null;
    const direction = spread >= 0 ? "above" : "below";
    return {
      label,
      value,
      spread,
      spreadPct,
      direction,
      text: Number.isFinite(spread)
        ? `${Math.abs(spread).toFixed(1).replace(".", ",")}x ${direction} (${spreadPct >= 0 ? "+" : "-"}${Math.abs(spreadPct).toFixed(1).replace(".", ",")}%)`
        : formatMultiple(value),
    };
  });
  const sourceText = data?.asOf
    ? `Source: ${data.source}, ${formatDatePtBr(data.asOf)}. Providers may differ by date, universe and methodology.`
    : "FactSet data is not yet populated; using the S&P 500 from the manual valuation as a temporary reference.";

  return React.createElement(
    "div",
    { className: "valuation-context" },
    React.createElement("span", { className: "control-title" }, "Forward P/E history"),
    React.createElement("h2", null, "S&P 500 vs averages"),
    React.createElement(
      "div",
      { className: "forward-average-chart" },
      React.createElement(
        "div",
        { className: "forward-bar-grid" },
        barItems.map((item) =>
          React.createElement(
            "div",
            { className: "forward-bar-item", key: item.label, style: { "--tone": item.tone } },
            React.createElement("strong", { className: "forward-bar-value" }, formatMultiple(item.value)),
            React.createElement("div", { className: "forward-bar-track" }, React.createElement("div", { className: "forward-bar-fill", style: { height: `${Math.max(8, (item.value / maxBar) * 100)}%` } })),
            React.createElement("span", null, item.label)
          )
        )
      ),
      averageComparisons.length
        ? React.createElement(
            "div",
            { className: "forward-chart-note" },
            averageComparisons.map((item) =>
              React.createElement("span", { key: item.label }, `Vs ${item.label.toUpperCase()} average: ${item.text}. `)
            )
          )
        : React.createElement("p", { className: "data-note" }, "Historical averages are not yet available in the FactSet JSON.")
    ),
    Number.isFinite(sp500.forwardEPS)
      ? React.createElement(
          "div",
          { className: "valuation-metric" },
          React.createElement("span", null, "Forward EPS"),
          React.createElement("strong", null, formatOptionalNumber(sp500.forwardEPS))
        )
      : null,
    React.createElement("p", { className: "data-note" }, sourceText)
  );
}

function Sp500PeHistoryChart({ data }) {
  const series = data?.yearEnd?.filter((point) => point.date >= "1926-01-01" && Number.isFinite(point.pe)) || [];
  if (!series.length) {
    return null;
  }

  const width = 920;
  const height = 300;
  const pad = { left: 44, right: 20, top: 18, bottom: 34 };
  const maxPe = Math.max(40, Math.ceil(Math.max(...series.map((point) => point.pe)) / 10) * 10);
  const minYear = Number(series[0].date.slice(0, 4));
  const maxYear = Number(series[series.length - 1].date.slice(0, 4));
  const xFor = (date) => {
    const year = Number(date.slice(0, 4));
    return pad.left + ((year - minYear) / Math.max(1, maxYear - minYear)) * (width - pad.left - pad.right);
  };
  const yFor = (value) => pad.top + (1 - value / maxPe) * (height - pad.top - pad.bottom);
  const path = series.map((point, index) => `${index ? "L" : "M"} ${xFor(point.date).toFixed(1)} ${yFor(point.pe).toFixed(1)}`).join(" ");
  const average = data?.stats?.averageSince1950 || data?.stats?.longTermAverage;
  const median = data?.stats?.medianSince1950;
  const latest = series[series.length - 1];
  const yTicks = [10, 20, 30, 40, 50, 60].filter((tick) => tick <= maxPe);
  const xTicks = [1930, 1950, 1970, 1990, 2010, maxYear].filter((tick, index, arr) => tick >= minYear && arr.indexOf(tick) === index);

  return React.createElement(
    "section",
    { className: "panel pe-history-chart" },
    React.createElement("span", { className: "control-title" }, "TTM P/E history"),
    React.createElement("h2", null, "S&P 500: updated P/E"),
    React.createElement(
      "div",
      { className: "pe-history-kpis" },
      [
        ["Latest", formatMultiple(latest.pe)],
        ["Since", String(minYear)],
        ["Through", latest.date.slice(0, 7)],
        ["Average since 1950", formatMultiple(data?.stats?.averageSince1950 || average)],
        Number.isFinite(median) ? ["Median since 1950", formatMultiple(median)] : null,
      ].filter(Boolean).map(([label, value]) =>
        React.createElement(
          "div",
          { className: "valuation-metric", key: label },
          React.createElement("span", null, label),
          React.createElement("strong", null, value)
        )
      )
    ),
    React.createElement(
      "div",
      { className: "pe-history-legend" },
      Number.isFinite(average) ? React.createElement("span", { className: "avg" }, React.createElement("i", null), `Average since 1950: ${formatMultiple(average)}`) : null,
      Number.isFinite(median) ? React.createElement("span", { className: "med" }, React.createElement("i", null), `Median since 1950: ${formatMultiple(median)}`) : null
    ),
    React.createElement(
      "svg",
      { className: "pe-history-svg", viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": "S&P 500 TTM P/E history" },
      yTicks.map((tick) =>
        React.createElement(
          React.Fragment,
          { key: `y-${tick}` },
          React.createElement("line", { className: "pe-history-gridline", x1: pad.left, x2: width - pad.right, y1: yFor(tick), y2: yFor(tick) }),
          React.createElement("text", { className: "pe-history-axis-label", x: 10, y: yFor(tick) + 4 }, `${tick}x`)
        )
      ),
      xTicks.map((tick) =>
        React.createElement("text", { className: "pe-history-axis-label", key: `x-${tick}`, x: xFor(`${tick}-01-01`), y: height - 8, textAnchor: "middle" }, tick)
      ),
      Number.isFinite(average) ? React.createElement("line", { className: "pe-history-average", x1: pad.left, x2: width - pad.right, y1: yFor(average), y2: yFor(average) }) : null,
      Number.isFinite(median) ? React.createElement("line", { className: "pe-history-median", x1: pad.left, x2: width - pad.right, y1: yFor(median), y2: yFor(median) }) : null,
      React.createElement("path", { className: "pe-history-line", d: path }),
      React.createElement("circle", { className: "pe-history-latest", cx: xFor(latest.date), cy: yFor(latest.pe), r: 5 }),
      React.createElement("text", { className: "pe-history-axis-label", x: xFor(latest.date) - 8, y: yFor(latest.pe) - 10, textAnchor: "end" }, formatMultiple(latest.pe))
    ),
    React.createElement("p", null, `Source: ${data?.source || "Multpl"}. Reported/trailing P/E; not forward P/E. The most recent value may be estimated by the source.`)
  );
}

const EQUITY_CARDS = [
  {
    title: "Magnificent 7",
    tone: "#4f7cff",
    bullets: ["Concentrates the index premium.", "Delivers superior growth and margins.", "Carries elevated expectations."],
    message: "The premium requires near-perfect execution.",
  },
  {
    title: "Broad index",
    tone: "#48d6e9",
    bullets: ["The aggregate multiple mixes very different companies.", "The Magnificent 7 lifts the overall reading."],
    message: "Owning the S&P 500 today also means accepting concentration.",
  },
  {
    title: "Mid and small caps",
    tone: "#ffae6b",
    bullets: ["Trade at lower multiples.", "Are more sensitive to rates, credit and the cycle."],
    message: "The discount exists, but it has a reason.",
  },
];

const MAGNIFICENT_ROWS = [
  {
    company: "S&P 500",
    pe: "19,9x",
    recent: "Q1 2026 earnings between approximately 27%-29% YoY.",
    outlook: "Goldman expects 2026 EPS growth of 24%; Wells Fargo and UBS raised their forecasts.",
    read: "Benchmark: strong earnings, but a significant share comes from AI, semiconductors, energy and mega-caps.",
    benchmark: true,
  },
  {
    company: "Nvidia",
    pe: "~20x-25x",
    recent: "Q4 FY26 revenue +73% YoY; net income +94% YoY.",
    outlook: "Q1 FY27 guidance of US$78bn in revenue.",
    read: "The group's most explosive driver; the main direct beneficiary of AI CAPEX.",
  },
  {
    company: "Meta",
    pe: "~22x-26x",
    recent: "Q1 2026: revenue of US$56.3bn; EPS +62% YoY.",
    outlook: "2026 CAPEX raised to US$125-145bn.",
    read: "AI monetisation through ads is strong, but CAPEX has become a focus of scrutiny.",
  },
  {
    company: "Amazon",
    pe: "~30x-40x",
    recent: "Q1 2026: revenue +16.6%; net income +76.7%; AWS +28%.",
    outlook: "CAPEX may approach US$200bn in 2026.",
    read: "Earnings are growing well, but the market expects returns from AWS, AI and free cash flow.",
  },
  {
    company: "Alphabet",
    pe: "~22x-26x",
    recent: "Q1 2026 revenue +22%; Google Cloud +63%.",
    outlook: "Search, Cloud and Gemini support the thesis despite high CAPEX.",
    read: "It is no longer only an advertising business and is gaining an AI infrastructure/platform profile.",
  },
  {
    company: "Microsoft",
    pe: "~20x-25x",
    recent: "Revenue for the March 2026 quarter +18%; Microsoft Cloud +29%.",
    outlook: "The market is focused on whether AI CAPEX converts into sustainable margins.",
    read: "One of the strongest profiles: cloud, recurring software and enterprise AI.",
  },
  {
    company: "Apple",
    pe: "~28x-32x",
    recent: "Fiscal Q2 2026 revenue +17% YoY; EPS approximately +22% YoY.",
    outlook: "Depends more on the iPhone, services and China than on pure AI infrastructure.",
    read: "Strong, but less connected to AI CAPEX than the rest of the group.",
  },
  {
    company: "Tesla",
    pe: ">100x / distorcido",
    recent: "Q1 2026: revenue +16%; net income +17%.",
    outlook: "The narrative depends on robotaxis, Optimus, AI and estimated CAPEX of US$25bn.",
    read: "The most speculative: current earnings do not support the narrative on their own.",
  },
];

const MAG7_VALUATION_FALLBACK = {
  asOf: "2026-07-23",
  status: "snapshot",
  source: "Yahoo Finance via yfinance",
  group: { marketCap: 21744600088576, trailingPE: 26.82, forwardPE: 22.05 },
  companies: [
    { ticker: "NVDA", company: "Nvidia", weight: 23.25, trailingPE: 31.97, forwardPE: 16.22, marketCap: 5056375554048 },
    { ticker: "MSFT", company: "Microsoft", weight: 13.04, trailingPE: 22.74, forwardPE: 19.69, marketCap: 2834542100480 },
    { ticker: "AAPL", company: "Apple", weight: 21.73, trailingPE: 38.99, forwardPE: 33.36, marketCap: 4724335050752 },
    { ticker: "AMZN", company: "Amazon", weight: 11.56, trailingPE: 27.98, forwardPE: 23.56, marketCap: 2513506402304 },
    { ticker: "GOOGL", company: "Alphabet", weight: 17.83, trailingPE: 15.93, forwardPE: 21.53, marketCap: 3876635279360 },
    { ticker: "META", company: "Meta", weight: 7.08, trailingPE: 22.06, forwardPE: 16.38, marketCap: 1538538340352 },
    { ticker: "TSLA", company: "Tesla", weight: 5.52, trailingPE: 296.01, forwardPE: 142.48, marketCap: 1200667361280 },
  ],
};

function EquityValuationModule() {
  const [equityView, setEquityView] = useState("broad");
  const [valuationData, setValuationData] = useState(() => normalizeEquityPeData(EQUITY_VALUATION_SNAPSHOT));
  const [sp500ValuationData, setSp500ValuationData] = useState(() => normalizeSp500ValuationData(SP500_VALUATION_SNAPSHOT));
  const [peHistoryData, setPeHistoryData] = useState(null);
  const [mag7ValuationData, setMag7ValuationData] = useState(MAG7_VALUATION_FALLBACK);
  const [valuationResults, setValuationResults] = useState({});
  const [valuationReady, setValuationReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    DataClient.loadMany([
      "equity-valuation",
      "sp500-valuation",
      "sp500-pe-history",
      "mag7-valuation",
    ]).then(([equityResult, sp500Result, historyResult, mag7Result]) => {
      if (cancelled) return;

      let effectiveEquityResult = equityResult;
      if (equityResult.ok) {
        const normalized = normalizeEquityPeData(equityResult.data);
        const useRemote = normalized && isAtLeastDate(normalized.asOf, EQUITY_VALUATION_SNAPSHOT.asOf);
        setValuationData(
          useRemote ? normalized : normalizeEquityPeData(EQUITY_VALUATION_SNAPSHOT)
        );
        if (!useRemote) effectiveEquityResult = datasetFallbackResult(equityResult, EQUITY_VALUATION_SNAPSHOT, "The local file predates the embedded snapshot.");
      } else {
        effectiveEquityResult = datasetFallbackResult(equityResult, EQUITY_VALUATION_SNAPSHOT, "The local file could not be loaded.");
      }

      let effectiveSp500Result = sp500Result;
      if (sp500Result.ok) {
        const normalized = normalizeSp500ValuationData(sp500Result.data);
        const useRemote = isAtLeastDate(normalized.asOf, SP500_VALUATION_SNAPSHOT.asOf);
        setSp500ValuationData(
          useRemote ? normalized : normalizeSp500ValuationData(SP500_VALUATION_SNAPSHOT)
        );
        if (!useRemote) effectiveSp500Result = datasetFallbackResult(sp500Result, SP500_VALUATION_SNAPSHOT, "The local file predates the embedded snapshot.");
      } else {
        effectiveSp500Result = datasetFallbackResult(sp500Result, SP500_VALUATION_SNAPSHOT, "The local file could not be loaded.");
      }

      setPeHistoryData(historyResult.ok ? historyResult.data : null);
      const effectiveMag7Result = mag7Result.ok && mag7Result.data?.companies?.length
        ? mag7Result
        : datasetFallbackResult(mag7Result, MAG7_VALUATION_FALLBACK, "The local file could not be loaded or contains no companies.");
      setMag7ValuationData(effectiveMag7Result.data);
      setValuationResults({
        equity: effectiveEquityResult,
        sp500: effectiveSp500Result,
        history: historyResult,
        mag7: effectiveMag7Result,
      });
      setValuationReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!valuationReady) {
    return React.createElement(
      "section",
      { className: "panel source-card" },
      React.createElement("span", { className: "control-title" }, "Valuation"),
      React.createElement("h2", null, "Loading valuation data"),
      React.createElement("p", { className: "data-note" }, "Updating local datasets before rendering the view.")
    );
  }

  const filter = React.createElement(
    "section",
    { className: "equity-filter" },
    React.createElement(
      "div",
      { className: "segmented", "aria-label": "Equity Valuation view" },
      React.createElement(
        "button",
        {
          type: "button",
          "aria-pressed": equityView === "broad",
          onClick: () => setEquityView("broad"),
        },
        "Broad market"
      ),
      React.createElement(
        "button",
        {
          type: "button",
          "aria-pressed": equityView === "mega",
          onClick: () => setEquityView("mega"),
        },
        "Magnificent 7"
      )
    )
  );

  const broadView = React.createElement(
    React.Fragment,
    null,
    React.createElement(Sp500PeHistoryChart, { data: peHistoryData }),
    React.createElement(
      "section",
      { className: "equity-grid" },
      React.createElement(
        "article",
        { className: "panel source-card" },
        React.createElement(
          "div",
          { className: "section-head" },
          React.createElement(
            "div",
            null,
            React.createElement("span", { className: "control-title" }, "Forward P/E")
          )
        ),
        React.createElement(EquityPeChart, { valuationData })
      ),
      React.createElement(
        "article",
        { className: "panel" },
        React.createElement(Sp500ValuationContext, { data: sp500ValuationData, relativeData: valuationData })
      )
    )
  );

  const activeMag7Valuation = mag7ValuationData?.companies?.length ? mag7ValuationData : MAG7_VALUATION_FALLBACK;
  const mag7TableRows = activeMag7Valuation.companies;
  const mag7SourceText = activeMag7Valuation.status === "ok"
    ? `Source: ${activeMag7Valuation.source}, ${formatDatePtBr(activeMag7Valuation.asOf)}. TTM P/E and forward P/E by company; aggregate calculated by the dashboard. ${FORWARD_PE_METHOD_NOTE}`
    : `Local snapshot: ${activeMag7Valuation.source}, ${formatDatePtBr(activeMag7Valuation.asOf)}. Automatic updates begin when data/mag7-valuation.json loads. ${FORWARD_PE_METHOD_NOTE}`;

  const megaView = React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "section",
      { className: "panel mega-table-card" },
      React.createElement(
        "div",
        { className: "section-head" },
        React.createElement(
          "div",
          null,
          React.createElement("span", { className: "control-title" }, "Magnificent 7"),
          React.createElement("h2", null, "Multiple vs growth")
        )
      ),
      React.createElement(
        "div",
        { className: "mega-table-wrap" },
        React.createElement(
          "table",
          { className: "mega-table" },
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              null,
              React.createElement("th", null, "Company"),
              React.createElement("th", null, "P/E TTM"),
              React.createElement("th", null, "Forward P/E"),
              React.createElement("th", null, "Reading")
            )
          ),
          React.createElement(
            "tbody",
            null,
            mag7TableRows.map((row) =>
              React.createElement(
                "tr",
                { key: row.ticker || row.company, className: row.benchmark ? "benchmark-row" : undefined },
                React.createElement("td", null, row.company),
                React.createElement("td", null, Number.isFinite(row.trailingPE) ? formatMultiple(row.trailingPE) : "n/a"),
                React.createElement("td", null, Number.isFinite(row.forwardPE) ? formatMultiple(row.forwardPE) : (row.pe || "n/a")),
                React.createElement("td", null, row.read || (row.marketCap ? `Market cap: ${formatMarketCap(row.marketCap)}.` : "Update after the data job runs."))
              )
            )
          )
        )
      ),
      React.createElement("p", { className: "data-note" }, mag7SourceText)
    )
  );

  return React.createElement(
    "main",
    { className: "equity-layout work-surface" },
    filter,
    equityView === "broad" ? broadView : megaView
  );
}

window.GCValuation = {
  EquityValuationModule,
  FORWARD_PE_METHOD_NOTE,
};
})();
