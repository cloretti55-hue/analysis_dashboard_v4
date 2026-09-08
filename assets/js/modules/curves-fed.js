(function () {
const { useEffect, useState } = React;
const {
  formatDatePtBr,
  DATASET_STATUS_LABELS,
} = window.GCCommon;

const MATURITIES = [
  { key: "2Y", years: 2 },
  { key: "5Y", years: 5 },
  { key: "7Y", years: 7 },
  { key: "10Y", years: 10 },
  { key: "30Y", years: 30 },
];

const CURVES = {
  nominal: {
    label: "Nominal Curve",
    short: "Nominal",
    color: "#48d6e9",
    unit: "%",
    values: { "2Y": 4.23, "5Y": 4.28, "7Y": 4.38, "10Y": 4.51, "30Y": 4.95 },
    reading:
      "The curve has returned to a positive slope, but most of the move is concentrated at the long end. The market requires a rising premium to finance the US government over longer horizons.",
  },
  real: {
    label: "Real Curve - TIPS",
    short: "Real",
    color: "#c49bff",
    unit: "%",
    values: { "2Y": 1.82, "5Y": 1.96, "7Y": 2.07, "10Y": 2.21, "30Y": 2.7 },
    reading:
      "The main source of steepness in the US curve is real rates. Investors are again receiving meaningful real compensation without taking corporate risk.",
  },
  inflation: {
    label: "Implied Inflation",
    short: "Implied",
    color: "#ffae6b",
    unit: "%",
    values: { "2Y": 2.37, "5Y": 2.28, "7Y": 2.27, "10Y": 2.25, "30Y": 2.19 },
    reading:
      "Inflation expectations remain well anchored. Implied inflation declines gradually along the curve, suggesting confidence in convergence toward levels close to the Federal Reserve's target.",
  },
};

const LIGHT_CHART_COLORS = {
  nominal: "#026f88",
  real: "#6548b8",
  inflation: "#a85d19",
};

const DEFAULT_CURVE_META = {
  source: "Atlanta Fed",
  asOf: "2026-06-22",
};

const COMPARISON_PERIODS = [
  { key: "current", label: "Current", opacity: 1, dash: "", width: 3.8, color: null, lightColor: null },
  { key: "1m", label: "1 month ago", opacity: 1, dash: "2 6", width: 4, color: "#ffcf6b", lightColor: "#b45309" },
];

const DELTA_PERIODS = [
  { key: "1m", label: "1 Month" },
  { key: "3m", label: "3 Months" },
  { key: "1y", label: "1 Year" },
];


function curveSourceText(meta) {
  const asOf = formatDatePtBr(meta.asOf || DEFAULT_CURVE_META.asOf);
  const updatedAt = meta.updatedAt ? formatDatePtBr(meta.updatedAt.slice(0, 10)) : null;
  const real2yAsOf = meta.componentAsOf?.real?.["2Y"] ? formatDatePtBr(meta.componentAsOf.real["2Y"]) : null;
  const componentNote = real2yAsOf && real2yAsOf !== asOf ? `Nominal through ${asOf}; real 2Y/TIPSPY02 through ${real2yAsOf}.` : `Data through ${asOf}.`;
  const state = meta.datasetStatus && meta.datasetStatus !== "ok"
    ? ` Status: ${DATASET_STATUS_LABELS[meta.datasetStatus] || meta.datasetStatus}.`
    : "";
  return updatedAt
    ? `${componentNote} Updated ${updatedAt}. Source: ${meta.source || DEFAULT_CURVE_META.source}.${state}`
    : `${componentNote} Source: ${meta.source || DEFAULT_CURVE_META.source}.${state}`;
}

const DEFAULT_FED_POLICY = {
  source: "Atlanta Fed",
  targetRange: {
    label: "3,50%–3,75%",
    asOf: "2026-06-22",
  },
  marketProbability: {
    label: "through 16/09/26",
    hike: 76.7,
    steady: 20.8,
    cut: 2.5,
    asOf: "2026-06-22",
  },
};

function pctOne(value) {
  return `${Number(value).toFixed(1).replace(".", ",")}%`;
}

function defaultCurveComparisons() {
  const currentCurves = Object.fromEntries(Object.entries(CURVES).map(([key, curve]) => [key, { ...curve.values }]));
  return {
    current: {
      label: "Current",
      asOf: "2026-07-17",
      curves: currentCurves,
    },
    "1m": {
      label: "1 month ago",
      asOf: "2026-06-17",
      curves: {
        nominal: { "2Y": 4.2, "5Y": 4.27, "7Y": 4.37, "10Y": 4.49, "30Y": 4.93 },
        real: { "2Y": 1.84, "5Y": 1.96, "7Y": 2.09, "10Y": 2.23, "30Y": 2.73 },
        inflation: { "2Y": 2.31, "5Y": 2.27, "7Y": 2.23, "10Y": 2.21, "30Y": 2.14 },
      },
    },
    "3m": {
      label: "3 months ago",
      asOf: "2026-04-17",
      curves: {
        nominal: { "2Y": 3.71, "5Y": 3.84, "7Y": 4.04, "10Y": 4.26, "30Y": 4.88 },
        real: { "2Y": 0.88, "5Y": 1.28, "7Y": 1.61, "10Y": 1.9, "30Y": 2.65 },
        inflation: { "2Y": 2.81, "5Y": 2.53, "7Y": 2.39, "10Y": 2.32, "30Y": 2.17 },
      },
    },
    "1y": {
      label: "1 year ago",
      asOf: "2025-07-17",
      curves: {
        nominal: { "2Y": 3.91, "5Y": 4.01, "7Y": 4.22, "10Y": 4.47, "30Y": 5.01 },
        real: { "2Y": 1.08, "5Y": 1.48, "7Y": 1.77, "10Y": 2.04, "30Y": 2.64 },
        inflation: { "2Y": 2.8, "5Y": 2.49, "7Y": 2.41, "10Y": 2.38, "30Y": 2.31 },
      },
    },
  };
}

const READING_BULLETS = {
  nominal: [
    "The curve has steepened again.",
    "The long end leads the move.",
    "Term premium matters again.",
  ],
  real: [
    "Real rates explain the steepness.",
    "Real carry has become relevant again.",
    "Less need for corporate risk.",
  ],
  inflation: [
    "Expectations remain anchored.",
    "Implied inflation declines along the curve.",
    "No sign of de-anchoring.",
  ],
};

const SPREADS = [
  { label: "5s2s", from: "2Y", to: "5Y" },
  { label: "7s2s", from: "2Y", to: "7Y" },
  { label: "10s2s", from: "2Y", to: "10Y" },
  { label: "30s10s", from: "10Y", to: "30Y" },
];

function pct(value) {
  return `${value.toFixed(2).replace(".", ",")}%`;
}

function bps(value) {
  const rounded = Math.round(value * 100);
  return `${rounded > 0 ? "+" : ""}${rounded} bps`;
}

function curveRows(activeCurves, maturities) {
  return maturities.map((maturity) => {
    const row = { maturity: maturity.key };
    activeCurves.forEach((curveKey) => {
      row[curveKey] = CURVES[curveKey].values[maturity.key];
    });
    return row;
  });
}

function spreadValue(curveKey, spread) {
  return CURVES[curveKey].values[spread.to] - CURVES[curveKey].values[spread.from];
}

function curveDeltaBps(curveComparisons, periodKey, curveKey, maturityKey) {
  const current = curveComparisons.current?.curves?.[curveKey]?.[maturityKey] ?? CURVES[curveKey].values[maturityKey];
  const previous = curveComparisons[periodKey]?.curves?.[curveKey]?.[maturityKey];
  return typeof previous === "number" ? Math.round((current - previous) * 100) : 0;
}

function deltaBarStyle(value, maxAbs) {
  const width = Math.min(50, Math.abs(value / maxAbs) * 50);
  return {
    "--left": value >= 0 ? "50%" : `${50 - width}%`,
    "--w": `${width}%`,
    "--tone": value >= 0 ? "var(--positive)" : "var(--negative)",
  };
}

function pointLabelOffset(point, curveKey, periodKey, comparisonPeriods, curveComparisons) {
  if (periodKey !== "current") return 0;
  if (!comparisonPeriods.length) return curveKey === "real" ? 26 : -18;
  const historicalValues = comparisonPeriods
    .map((key) => curveComparisons[key]?.curves?.[curveKey]?.[point.maturity])
    .filter((value) => typeof value === "number");
  if (!historicalValues.length) return curveKey === "real" ? 26 : -22;
  const current = point.value;
  const hasHistoricalAbove = historicalValues.some((value) => value > current);
  const hasHistoricalBelow = historicalValues.some((value) => value < current);
  if (hasHistoricalAbove && !hasHistoricalBelow) return 26;
  if (hasHistoricalBelow && !hasHistoricalAbove) return -22;
  return curveKey === "real" ? 30 : -26;
}


function Chart({ activeCurves, filteredMaturities, mode, theme, comparisonPeriods = [], curveComparisons = defaultCurveComparisons() }) {
  const width = 920;
  const height = 360;
  const margin = { top: 22, right: 126, bottom: 42, left: 54 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const selectedPeriods = [
    COMPARISON_PERIODS.find((period) => period.key === "current"),
    ...COMPARISON_PERIODS.filter((period) => period.key !== "current" && comparisonPeriods.includes(period.key)),
  ].filter(Boolean);

  const allValues = selectedPeriods.flatMap((period) =>
    activeCurves.flatMap((curveKey) =>
      filteredMaturities.map((m) => curveComparisons[period.key]?.curves?.[curveKey]?.[m.key] ?? CURVES[curveKey].values[m.key])
    )
  );
  const min = Math.min(...allValues, 0);
  const max = Math.max(...allValues, 1);
  const visibleRange = Math.max(0.01, max - min);
  const hasHistoricalComparison = selectedPeriods.some((period) => period.key !== "current");
  const pad = Math.max(0.04, visibleRange * (hasHistoricalComparison ? 0.06 : 0.12));
  const yMin = hasHistoricalComparison ? min - pad : Math.min(1.5, min - pad);
  const yMax = max + pad;

  const x = (index) =>
    filteredMaturities.length === 1
      ? margin.left + plotW / 2
      : margin.left + (index / (filteredMaturities.length - 1)) * plotW;
  const y = (value) => margin.top + (1 - (value - yMin) / (yMax - yMin)) * plotH;
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + ((yMax - yMin) / 4) * index);

  return React.createElement(
    "svg",
    { className: "chart", viewBox: `0 0 ${width} ${height}`, role: "img" },
    yTicks.map((tick) =>
      React.createElement(
        "g",
        { key: tick },
        React.createElement("line", {
          className: "grid-line",
          x1: margin.left,
          x2: width - margin.right,
          y1: y(tick),
          y2: y(tick),
        })
      )
    ),
    filteredMaturities.map((maturity, index) =>
      React.createElement(
        "text",
        {
          key: maturity.key,
          className: "tick",
          x: x(index),
          y: height - 24,
          textAnchor: "middle",
          fontWeight: 700,
        },
        maturity.key
      )
    ),
    selectedPeriods.flatMap((period) =>
      activeCurves.map((curveKey) => {
      const baseCurveColor = theme === "light" ? LIGHT_CHART_COLORS[curveKey] : CURVES[curveKey].color;
      const curveColor = period.key === "current" ? baseCurveColor : (theme === "light" ? period.lightColor : period.color);
      const points = filteredMaturities.map((m, index) => ({
        maturity: m.key,
        value: curveComparisons[period.key]?.curves?.[curveKey]?.[m.key] ?? CURVES[curveKey].values[m.key],
        x: x(index),
        y: y(curveComparisons[period.key]?.curves?.[curveKey]?.[m.key] ?? CURVES[curveKey].values[m.key]),
      }));
      const d = points.map((p, index) => `${index ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
      return React.createElement(
        "g",
        { key: `${period.key}-${curveKey}` },
        React.createElement("path", {
          className: "curve-line",
          d,
          stroke: curveColor,
          opacity: period.opacity,
          strokeDasharray: period.dash,
          strokeWidth: period.width,
        }),
        points.map((point) =>
          React.createElement(
            "g",
            { key: `${period.key}-${curveKey}-${point.maturity}` },
            React.createElement("circle", {
              className: "point",
              cx: point.x,
              cy: point.y,
              r: period.key === "current" ? 6 : 5.5,
              fill: curveColor,
              opacity: period.opacity,
            }),
            period.key === "current"
              ? React.createElement(
                  "text",
                  {
                    className: "point-value-label",
                    x: point.x,
                    y: point.y + pointLabelOffset(point, curveKey, period.key, comparisonPeriods, curveComparisons),
                    fill: curveColor,
                    opacity: 1,
                    textAnchor: "middle",
                  },
                  pct(point.value)
                )
              : null,
            React.createElement("circle", {
              className: "point-hotspot",
              cx: point.x,
              cy: point.y,
              r: 18,
            })
          )
        )
      );
      })
    )
  );
}

function useCurvesFedModel() {
  const [mode, setMode] = useState("nominal");
  const [curveMeta, setCurveMeta] = useState(DEFAULT_CURVE_META);
  const [curveComparisons, setCurveComparisons] = useState(defaultCurveComparisons);
  const [comparisonPeriods, setComparisonPeriods] = useState([]);
  const [deltaPeriod, setDeltaPeriod] = useState("1m");
  const [fedPolicy, setFedPolicy] = useState(DEFAULT_FED_POLICY);

  useEffect(() => {
    let cancelled = false;

    DataClient.load("curve-us")
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setCurveMeta({
            ...DEFAULT_CURVE_META,
            datasetStatus: "unavailable",
            datasetError: result.error?.message || "falha desconhecida",
          });
          return;
        }
        const payload = result.data;
        ["nominal", "real", "inflation"].forEach((key) => {
          if (payload.curves[key]) {
            CURVES[key].values = { ...CURVES[key].values, ...payload.curves[key] };
          }
        });
        setCurveMeta({
          source: payload.source || DEFAULT_CURVE_META.source,
          asOf: payload.asOf || DEFAULT_CURVE_META.asOf,
          updatedAt: payload.updatedAt,
          componentAsOf: payload.componentAsOf || payload.comparisons?.current?.componentAsOf,
          datasetStatus: result.meta.status,
          datasetError: null,
        });
        setCurveComparisons(payload.comparisons || defaultCurveComparisons());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    DataClient.load("fed-policy")
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setFedPolicy({
            ...DEFAULT_FED_POLICY,
            _datasetMeta: {
              ...result.meta,
              status: "unavailable",
              error: result.error?.message || "falha desconhecida",
            },
          });
          return;
        }
        setFedPolicy({ ...result.data, _datasetMeta: result.meta });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    mode,
    setMode,
    curveMeta,
    curveComparisons,
    comparisonPeriods,
    setComparisonPeriods,
    deltaPeriod,
    setDeltaPeriod,
    fedPolicy,
  };
}

function MobileCurveModule({ theme, model }) {
  const { mode, setMode, curveMeta, fedPolicy } = model;
  const activeCurves = [mode];
  const current = CURVES[mode];

  return React.createElement(
    "main",
    { className: "mobile-curve" },
    React.createElement(
      "section",
      { className: "panel controls" },
        React.createElement("div", { className: "control-title" }, "View"),
      React.createElement(
        "div",
        {
          className: "segmented",
          style: {
            "--active-color": current.color,
            "--active-soft":
              mode === "nominal"
                ? "var(--nominal-soft)"
                : mode === "real"
                  ? "var(--real-soft)"
                  : "var(--inflation-soft)",
          },
        },
        ["nominal", "real", "inflation"].map((key) =>
          React.createElement(
            "button",
            {
              key,
              type: "button",
              style: { "--button-color": CURVES[key].color },
              "aria-pressed": mode === key,
              onClick: () => setMode(key),
            },
            key === "inflation" ? "Implied" : CURVES[key].short
          )
        )
      )
    ),
    React.createElement(
      "section",
      { className: "mobile-curve-stats" },
      SPREADS.map((spread) =>
        React.createElement(
          "article",
          { className: "mobile-stat", key: spread.label },
          React.createElement("span", null, spread.label),
          React.createElement("strong", null, bps(spreadValue(mode, spread)))
        )
      )
    ),
    React.createElement(
      "section",
      { className: "panel" },
      React.createElement(
        "div",
        { className: "chart-wrap" },
        React.createElement(Chart, {
          activeCurves,
          filteredMaturities: MATURITIES,
          mode,
          theme,
        })
      ),
      React.createElement("p", { className: "data-note" }, curveSourceText(curveMeta))
    ),
    React.createElement(
      "section",
      { className: "mobile-card-stack" },
      React.createElement(
        "article",
        { className: "panel mobile-summary-card" },
        React.createElement("h2", null, `${current.label} · 5 maturities`),
        React.createElement(
          "ul",
          null,
          READING_BULLETS[mode].map((item) => React.createElement("li", { key: item }, item))
        )
      ),
      React.createElement(
        "article",
        { className: "panel mobile-summary-card" },
        React.createElement("h2", null, "Current Fed Funds"),
        React.createElement("strong", null, fedPolicy.targetRange.label),
        React.createElement(
          "p",
          null,
          `Range set on ${formatDatePtBr(fedPolicy.targetRange.asOf)}`
        ),
        React.createElement(
          "p",
          { className: "fed-source-note" },
          `Source: Federal Reserve FOMC statement · ${DATASET_STATUS_LABELS[fedPolicy._datasetMeta?.status] || fedPolicy._datasetMeta?.status || "Current"}`
        )
      )
    )
  );
}

function CurvesFedModule({ theme, model }) {
  const {
    mode,
    setMode,
    curveMeta,
    curveComparisons,
    comparisonPeriods,
    setComparisonPeriods,
    deltaPeriod,
    setDeltaPeriod,
    fedPolicy,
  } = model;
  const activeCurves = [mode];
  const filteredMaturities = MATURITIES;
  const toggleComparisonPeriod = (periodKey) => {
    setComparisonPeriods((current) =>
      current.includes(periodKey)
        ? current.filter((key) => key !== periodKey)
        : [...current, periodKey]
    );
  };

return React.createElement(
      "main",
      { className: "layout work-surface" },
      React.createElement(
        "aside",
        { className: "controls panel" },
        React.createElement(
          "div",
          { className: "country-subtabs", "aria-label": "Curve country" },
          React.createElement("button", { type: "button", "aria-pressed": true }, "US")
        ),
        React.createElement(
          "div",
          { className: "control-block" },
          React.createElement("div", { className: "control-title" }, "View"),
          React.createElement(
            "div",
            {
              className: "segmented curve-view-segmented",
              style: {
                "--active-color": CURVES[mode].color,
                "--active-soft":
                  mode === "nominal"
                    ? "var(--nominal-soft)"
                      : mode === "real"
                        ? "var(--real-soft)"
                        : "var(--inflation-soft)",
              },
            },
            ["nominal", "real", "inflation"].map((key) =>
              React.createElement(
                "button",
                {
                  key,
                  type: "button",
                  style: { "--button-color": CURVES[key].color },
                  "aria-pressed": mode === key,
                  onClick: () => setMode(key),
                },
                key === "inflation" ? "Implied Inflation" : CURVES[key].short
              )
            )
          )
        ),
        React.createElement(
          "div",
          { className: "control-block" },
          React.createElement("div", { className: "control-title" }, "Comparison"),
          React.createElement(
            "div",
            {
              className: "segmented curve-view-segmented",
              style: {
                "--active-color": "var(--comparison-filter)",
                "--active-soft": "color-mix(in srgb, var(--comparison-filter) 14%, transparent)",
              },
            },
            COMPARISON_PERIODS.filter((item) => item.key !== "current").map((item) =>
              React.createElement(
                "button",
                {
                  key: item.key,
                  type: "button",
                  "aria-pressed": comparisonPeriods.includes(item.key),
                  onClick: () => toggleComparisonPeriod(item.key),
                },
                item.label
              )
            )
          )
        ),
        React.createElement(
          "div",
          { className: "control-block" },
          React.createElement("div", { className: "control-title" }, "Change"),
          React.createElement(
            "div",
            {
              className: "segmented curve-view-segmented",
              style: {
                "--active-color": "var(--change-filter)",
                "--active-soft": "color-mix(in srgb, var(--change-filter) 14%, transparent)",
              },
            },
            DELTA_PERIODS.map((item) =>
              React.createElement(
                "button",
                {
                  key: item.key,
                  type: "button",
                  "aria-pressed": deltaPeriod === item.key,
                  onClick: () => setDeltaPeriod(item.key),
                },
                item.label
              )
            )
          )
        )
      ),
      React.createElement(
        "section",
        { className: "content" },
        React.createElement(
          "section",
          { className: "kpis curve-fed-kpis" },
          React.createElement(
            "article",
            { className: "kpi panel" },
            React.createElement("span", null, "Current Fed Funds"),
            React.createElement("strong", null, fedPolicy.targetRange.label),
            React.createElement(
              "p",
              null,
              `Range set on ${formatDatePtBr(fedPolicy.targetRange.asOf)}`
            ),
            React.createElement(
              "p",
              { className: "fed-source-note" },
              `Source: Federal Reserve FOMC statement · ${DATASET_STATUS_LABELS[fedPolicy._datasetMeta?.status] || fedPolicy._datasetMeta?.status || "Current"}`
            )
          )
        ),
        React.createElement(
          "section",
          { className: "main-grid curve-main-grid" },
          React.createElement(
            "article",
            { className: "panel" },
            React.createElement(
              "div",
              { className: "section-head" },
              React.createElement(
                "div",
                null,
                React.createElement("h2", null, `${CURVES[mode].label} · 5 maturities`)
              )
            ),
            React.createElement(
              "div",
              { className: "chart-wrap" },
              React.createElement(Chart, {
                activeCurves,
                filteredMaturities,
                mode,
                theme,
                comparisonPeriods,
                curveComparisons,
              })
            ),
            comparisonPeriods.length > 0
              ? React.createElement(
                  "div",
                  { className: "comparison-legend" },
                  COMPARISON_PERIODS.filter((period) => period.key === "current" || comparisonPeriods.includes(period.key)).map((period) =>
                    React.createElement(
                      "span",
                      {
                        key: period.key,
                        style: {
                          color:
                            period.key === "current"
                              ? (theme === "light" ? LIGHT_CHART_COLORS[mode] : CURVES[mode].color)
                              : (theme === "light" ? period.lightColor : period.color),
                          "--line-opacity": period.opacity,
                        },
                      },
                      period.label
                    )
                  )
                )
              : null,
            React.createElement("p", { className: "data-note" }, curveSourceText(curveMeta))
          ),
          React.createElement(
            "article",
            { className: "panel" },
            React.createElement(
              "div",
              { className: "section-head" },
              React.createElement(
                "div",
                null,
                React.createElement("span", { className: "control-title" }, "Slopes"),
                React.createElement("h2", null, "Spreads in bps")
              )
            ),
            React.createElement(
              "div",
              { className: "spread-list" },
              activeCurves.flatMap((curveKey) =>
                SPREADS.map((spread) => {
                  const value = spreadValue(curveKey, spread);
                  const maxAbs = 0.55;
                  return React.createElement(
                    "div",
                    { className: "spread-row", key: `${curveKey}-${spread.label}` },
                    React.createElement("strong", null, `${CURVES[curveKey].short} ${spread.label}`),
                    React.createElement(
                      "div",
                      { className: "spread-track" },
                      React.createElement("div", {
                        className: "spread-fill",
                        style: {
                          "--w": `${Math.min(100, Math.abs(value / maxAbs) * 100)}%`,
                          "--tone": value >= 0 ? "var(--positive)" : "var(--negative)",
                        },
                      })
                    ),
                    React.createElement(
                      "span",
                      {
                        className: "spread-value",
                        style: { "--tone": value >= 0 ? "var(--positive)" : "var(--negative)" },
                      },
                      `${Math.round(value * 100) > 0 ? "+" : ""}${Math.round(value * 100)}`
                    )
                  );
                })
              )
            ),
            React.createElement("div", { className: "side-divider" }),
            React.createElement(
              "div",
              { className: "section-head" },
              React.createElement(
                "div",
                null,
                React.createElement("span", { className: "control-title" }, "Change"),
                React.createElement("h2", null, `Current vs ${DELTA_PERIODS.find((item) => item.key === deltaPeriod)?.label} in bps`)
              )
            ),
            React.createElement(
              "div",
              { className: "delta-bars" },
              (() => {
                const values = filteredMaturities.map((maturity) => ({
                  maturity: maturity.key,
                  value: curveDeltaBps(curveComparisons, deltaPeriod, mode, maturity.key),
                }));
                const maxAbs = Math.max(8, ...values.map((item) => Math.abs(item.value)));
                return values.map((item) =>
                  React.createElement(
                    "div",
                    { className: "delta-row", key: item.maturity },
                    React.createElement("strong", null, item.maturity),
                    React.createElement(
                      "div",
                      { className: "delta-track" },
                      React.createElement("div", {
                        className: "delta-fill",
                        style: deltaBarStyle(item.value, maxAbs),
                      })
                    ),
                    React.createElement(
                      "span",
                      {
                        className: "delta-value",
                        style: { "--tone": item.value >= 0 ? "var(--positive)" : "var(--negative)" },
                      },
                      `${item.value > 0 ? "+" : ""}${item.value}`
                    )
                  )
                );
              })()
            )
          )
        )
      )
    );
}

window.GCCurvesFed = {
  useCurvesFedModel,
  MobileCurveModule,
  CurvesFedModule,
};
})();
