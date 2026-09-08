(function () {
const { useEffect, useState } = React;
const {
  formatDatePtBr,
  DATASET_STATUS_LABELS,
} = window.GCCommon;

const InstrumentRegistry = window.GCInstrumentRegistry;
const { etfHrefForTicker } = window.GCEtfs;
const {
  DATA_LAB_GROUPS,
  DATA_LAB_SUBGROUP_ORDER,
  groupFor: dataLabGroupFor,
  subgroupFor: dataLabSubgroupFor,
  subgroupTone: dataLabSubgroupTone,
  metricsFor: dataLabMetricsFor,
  metricIsSuppressed,
  benchmarkLabelFor: dataLabBenchmarkLabel,
  referenceLabelFor: dataLabReferenceLabel,
  chartBenchmarksFor,
} = InstrumentRegistry;

const renderMetricLabel = (label) =>
  label === "1-year annualised volatility"
    ? React.createElement(React.Fragment, null, "Annualised volatility", React.createElement("span", null, "1 year"))
    : label;

const fmtMetric = (value, suffix = "%") =>
  typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}${suffix}` : "n/d";

const fmtDataLabMetric = (key, value) =>
  key === "beta1yVsSp500"
    ? typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "n/d"
    : key === "correlation1yVsSp500"
    ? typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "n/d"
    : key.toLowerCase().includes("pe")
      ? typeof value === "number" && Number.isFinite(value)
        ? `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}x`
        : "n/d"
    : fmtMetric(value);

const valueAtPath = (object, path) =>
  path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), object);

const requestedDataLabTicker = () => {
  const [module, ticker] = window.location.hash.replace(/^#/, "").split("/").filter(Boolean);
  if (module !== "dataLab" || !ticker) return null;
  try {
    return decodeURIComponent(ticker).toUpperCase();
  } catch (_error) {
    return null;
  }
};

function EtfContextLink({ ticker }) {
  const href = etfHrefForTicker?.(ticker);
  if (!href) return null;
  return React.createElement(
    "a",
    {
      className: "data-lab-direct-link",
      href,
      "aria-label": `Open ${ticker} in ETFs`,
    },
    "ETFs ↗"
  );
}

function DataLabLineChart({ active }) {
  const rawPoints = active?.performanceChart?.points || [];
  const benchmarks = chartBenchmarksFor(active, rawPoints);
  const benchmarkLabels = benchmarks.map(({ label }) => label).join(" and ");
  const points = rawPoints.filter((point) => {
    const hasEtf = typeof point.etf === "number" && Number.isFinite(point.etf);
    if (!hasEtf) return false;
    return benchmarks.every(({ key }) => typeof point[key] === "number" && Number.isFinite(point[key]));
  });
  const values = points.flatMap((point) => [point.etf, ...benchmarks.map(({ key }) => point[key])]).filter((value) => typeof value === "number" && Number.isFinite(value));
  const minValue = Math.floor(Math.min(...values, 95) / 5) * 5;
  const maxValue = Math.ceil(Math.max(...values, 105) / 5) * 5;
  const width = 720;
  const height = 310;
  const pad = { top: 22, right: 24, bottom: 34, left: 44 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const x = (index) => pad.left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * plotW);
  const y = (value) => pad.top + ((maxValue - value) / Math.max(1, maxValue - minValue)) * plotH;
  const pathFor = (key) =>
    points
      .map((point, index) => {
        const value = point[key];
        if (typeof value !== "number" || !Number.isFinite(value)) return "";
        return `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(value).toFixed(1)}`;
      })
      .filter(Boolean)
      .join(" ");
  const endPoint = points[points.length - 1];
  const yStep = Math.max(5, Math.ceil((maxValue - minValue) / 6 / 5) * 5);
  const yTicks = [];
  for (let tick = minValue; tick <= maxValue; tick += yStep) yTicks.push(tick);
  if (!yTicks.includes(100)) yTicks.push(100);
  yTicks.sort((a, b) => a - b);
  const xTickCount = Math.min(5, points.length);
  const xTicks = Array.from({ length: xTickCount }, (_, index) => Math.round((index / Math.max(1, xTickCount - 1)) * (points.length - 1)));
  const shortDate = (value) => {
    if (!value) return "";
    const [year, month] = value.split("-");
    return `${month}/${year.slice(2)}`;
  };
  const primaryBenchmark = benchmarks[0] || null;
  const excessValue = primaryBenchmark && endPoint ? endPoint.etf - endPoint[primaryBenchmark.key] : null;
  const excessText = typeof excessValue === "number" && Number.isFinite(excessValue) ? `Excess return: ${fmtMetric(excessValue)} vs ${primaryBenchmark.label}` : null;

  return React.createElement(
    "article",
    { className: "data-lab-chart data-lab-line-card" },
    React.createElement(
      "div",
      { className: "data-lab-chart-head" },
      React.createElement("h3", null, benchmarks.length ? `Performance: ${active.ticker || "ETF"} vs ${benchmarkLabels}` : `Performance: ${active.ticker || "ETF"}`),
      React.createElement(
        "div",
        { className: "data-lab-legend" },
        React.createElement("span", { className: "is-etf" }, active.ticker || "ETF"),
        benchmarks.map(({ key, label, className }) => React.createElement("span", { className, key }, label))
      )
    ),
    points.length > 1
      ? React.createElement(
          "svg",
          { className: "data-lab-line-chart", viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": benchmarks.length ? `${active.ticker || "ETF"} chart versus ${benchmarkLabels}` : `${active.ticker || "ETF"} chart` },
          yTicks.map((tick) =>
            React.createElement(
              "g",
              { key: `y-${tick}` },
              React.createElement("line", { x1: pad.left, x2: width - pad.right, y1: y(tick), y2: y(tick), className: "chart-grid" }),
              React.createElement("text", { x: 8, y: y(tick) + 4, className: "data-lab-axis-label" }, tick)
            )
          ),
          xTicks.map((index) =>
            React.createElement(
              "g",
              { key: `x-${index}` },
              React.createElement("line", { x1: x(index), x2: x(index), y1: pad.top, y2: height - pad.bottom, className: "chart-grid" }),
              React.createElement("text", { x: x(index), y: height - 8, className: `data-lab-date-label ${index === points.length - 1 ? "is-end" : ""}` }, shortDate(points[index].date))
            )
          ),
          React.createElement("path", { d: pathFor("etf"), className: "data-lab-line is-etf" }),
          benchmarks.map(({ key, className }) => React.createElement("path", { d: pathFor(key), className: `data-lab-line ${className}`, key })),
          endPoint ? React.createElement("circle", { cx: x(points.length - 1), cy: y(endPoint.etf), r: 4.5, className: "data-lab-dot is-etf" }) : null,
          endPoint ? benchmarks.map(({ key, className }) => React.createElement("circle", { cx: x(points.length - 1), cy: y(endPoint[key]), r: 4.5, className: `data-lab-dot ${className}`, key })) : null,
          endPoint
            ? React.createElement(
                "g",
                { transform: `translate(${pad.left + 8} ${pad.top + 8})` },
                React.createElement("rect", { className: "data-lab-result-card", width: 184, height: 48 + benchmarks.length * 21 + (excessText ? 21 : 0), rx: 8 }),
                React.createElement("text", { x: 12, y: 22, className: "data-lab-end-label" }, `${active.ticker}: ${fmtMetric(endPoint.etf - 100)}`),
                benchmarks.map(({ key, label }, index) => React.createElement("text", { x: 12, y: 43 + index * 21, className: "data-lab-end-label", key }, `${label}: ${fmtMetric(endPoint[key] - 100)}`)),
                excessText ? React.createElement("text", { x: 12, y: 43 + benchmarks.length * 21, className: "data-lab-end-label" }, `Excess return: ${fmtMetric(excessValue)}`) : null
              )
            : null
        )
      : React.createElement("p", { className: "data-note" }, "Historical series is not yet available for this instrument."),
    React.createElement("p", { className: "data-note" }, "Approximate total return based on adjusted close; data may be delayed or revised.")
  );
}

function DataLabModule() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selectedTicker, setSelectedTicker] = useState(() => requestedDataLabTicker() || "IB01");
  const [selectedGroup, setSelectedGroup] = useState("Fixed Income");

  useEffect(() => {
    let cancelled = false;
    DataClient.loadMany(["etf-universe", "etf-performance", "fixed-income-performance"])
      .then(([universeResult, mainResult, fixedResult]) => {
        if (cancelled) return;
        if (!mainResult.ok) {
          setError(mainResult.error?.message || "Could not load the primary dataset.");
          return;
        }

        const catalog = InstrumentRegistry.createCatalog(universeResult.ok ? universeResult.data : null);
        const fixedByTicker = new Map((fixedResult.ok ? fixedResult.data?.instruments : []).map((item) => [item.ticker, item]));
        const payload = {
          ...mainResult.data,
          instruments: (mainResult.data.instruments || []).map((item) => {
            const registeredItem = catalog.enrich(item);
            const replacement = fixedByTicker.get(item.ticker);
            const needsFallback = dataLabGroupFor(registeredItem) === "Fixed Income" && (!registeredItem.performanceChart?.points?.length || registeredItem.status !== "ok");
            if (!needsFallback || !replacement) {
              return {
                ...registeredItem,
                dataStatus: registeredItem.status || mainResult.meta.status,
                dataSource: registeredItem.quoteSource || mainResult.meta.source,
                dataAsOf: registeredItem.asOf || mainResult.meta.asOf,
              };
            }
            return catalog.enrich({
              ...registeredItem,
              ...replacement,
              registry: undefined,
              status: fixedResult.meta.status === "ok" ? "ok" : "stale",
              dataStatus: fixedResult.meta.status,
              dataSource: fixedResult.meta.source,
              dataAsOf: replacement.asOf || fixedResult.meta.asOf,
              fallbackDataset: "fixed-income-performance",
            });
          }),
        };

        setData(payload);
        const requestedInstrument = payload.instruments.find((item) => item.ticker === requestedDataLabTicker());
        const firstOk = requestedInstrument || payload.instruments.find((item) => item.status === "ok" && dataLabGroupFor(item) === "Fixed Income" && item.performanceChart?.points?.length > 1) || payload.instruments.find((item) => item.status === "ok" && item.performanceChart?.points?.length > 1) || payload.instruments?.[0];
        if (firstOk) {
          setSelectedTicker(firstOk.ticker);
          if (requestedInstrument) setSelectedGroup(dataLabGroupFor(requestedInstrument));
        }
      })
    return () => {
      cancelled = true;
    };
  }, []);

  const instruments = data?.instruments || [];
  const filteredInstruments = instruments.filter((item) => dataLabGroupFor(item) === selectedGroup);
  const groupCounts = DATA_LAB_GROUPS.reduce((acc, group) => {
    acc[group] = instruments.filter((item) => dataLabGroupFor(item) === group).length;
    return acc;
  }, {});
  const subgroupMap = filteredInstruments.reduce((acc, item) => {
    const subgroup = dataLabSubgroupFor(item);
    if (!acc[subgroup]) acc[subgroup] = [];
    acc[subgroup].push(item);
    return acc;
  }, {});
  const subgroupOrder = DATA_LAB_SUBGROUP_ORDER[selectedGroup] || [];
  const subgroupEntries = Object.entries(subgroupMap).sort(([a], [b]) => {
    const aIndex = subgroupOrder.indexOf(a);
    const bIndex = subgroupOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  useEffect(() => {
    if (!filteredInstruments.length) return;
    const selectedInGroup = filteredInstruments.find((item) => item.ticker === selectedTicker);
    if (!selectedInGroup || !selectedInGroup.performanceChart?.points?.length) {
      const firstWithChart = filteredInstruments.find((item) => item.performanceChart?.points?.length > 1) || filteredInstruments[0];
      setSelectedTicker(firstWithChart.ticker);
    }
  }, [selectedGroup, data]);

  const active = instruments.find((item) => item.ticker === selectedTicker) || instruments[0];
  const activeBenchmarkLabel = dataLabBenchmarkLabel(active);
  const activeReferenceLabel = dataLabReferenceLabel(active);

  return React.createElement(
    "main",
    { className: "data-lab-layout work-surface" },
    React.createElement(
      "section",
      { className: "panel data-lab-list" },
      error ? React.createElement("p", { className: "data-note" }, "Data is temporarily unavailable. Please try again later.") : null,
      !data && !error ? React.createElement("p", { className: "data-note" }, "Loading data...") : null,
      React.createElement(
        "div",
        { className: "data-lab-filters" },
        DATA_LAB_GROUPS.map((group) =>
          React.createElement(
            "button",
            {
              className: "data-lab-filter",
              type: "button",
              key: group,
              "aria-pressed": selectedGroup === group,
              onClick: () => setSelectedGroup(group),
            },
            `${group} ${groupCounts[group] ? `(${groupCounts[group]})` : ""}`
          )
        )
      ),
      React.createElement(
        "div",
        { className: "data-lab-instruments" },
        subgroupEntries.map(([subgroup, items]) =>
          React.createElement(
            "section",
            { className: "data-lab-subgroup", key: subgroup },
            React.createElement("span", { className: "data-lab-subgroup-title" }, subgroup),
            React.createElement(
              "div",
              { className: "data-lab-chip-grid" },
              items.map((item) =>
                React.createElement(
                  "button",
                  {
                    className: "data-lab-chip",
                    type: "button",
                    key: item.ticker,
                    "data-subgroup-tone": subgroup,
                    style: { "--subgroup-color": dataLabSubgroupTone(subgroup) },
                    "aria-pressed": active.ticker === item.ticker,
                    onClick: () => setSelectedTicker(item.ticker),
                  },
                  React.createElement("strong", null, item.ticker),
                  React.createElement("span", null, item.status === "ok" ? item.category : (DATASET_STATUS_LABELS[item.dataStatus || item.status] || item.status || "unavailable"))
                )
              )
            )
          )
        )
      ),
      React.createElement("p", { className: "data-note" }, data?.methodology || "The dashboard uses embedded data while the JSON is unavailable.")
    ),
    React.createElement(
      "section",
      { className: "panel data-lab-active" },
      active
        ? React.createElement(
            React.Fragment,
            null,
            React.createElement(
              "div",
              null,
              React.createElement("span", { className: "control-title" }, "Selected instrument"),
              React.createElement(
                "div",
                { className: "instrument-detail-heading" },
                React.createElement("h2", null, active.ticker),
                React.createElement(EtfContextLink, { ticker: active.ticker })
              ),
              React.createElement("p", null, active.name || active.category)
            ),
            React.createElement(
              "div",
              { className: "data-lab-badges" },
              React.createElement("span", null, "Vehicle", React.createElement("b", null, active.wrapper || "n/a")),
              React.createElement("span", null, "Currency", React.createElement("b", null, active.currency || "n/a")),
              activeBenchmarkLabel ? React.createElement("span", null, "Benchmark", React.createElement("b", null, activeBenchmarkLabel)) : null,
              activeReferenceLabel ? React.createElement("span", null, "Reference", React.createElement("b", null, activeReferenceLabel)) : null,
              active.performanceChart?.startDate ? React.createElement("span", null, "History", React.createElement("b", null, formatDatePtBr(active.performanceChart.startDate))) : null,
              React.createElement("span", null, "Data", React.createElement("b", null, active.dataAsOf ? formatDatePtBr(active.dataAsOf) : "n/a")),
              React.createElement("span", null, "Status", React.createElement("b", null, DATASET_STATUS_LABELS[active.dataStatus || active.status] || active.dataStatus || active.status || "n/a"))
            ),
            React.createElement(
              "div",
              { className: "data-lab-metrics" },
              dataLabMetricsFor(active).filter(([key]) => !key.startsWith("correlation") || valueAtPath(active, key) !== undefined).map(([key, label]) =>
                {
                  const metricValue = metricIsSuppressed(active, key) ? undefined : valueAtPath(active, key);
                  return React.createElement(
                    "div",
                    { className: "data-lab-metric", key },
                    React.createElement("span", null, renderMetricLabel(label)),
                    React.createElement("strong", null, fmtDataLabMetric(key, metricValue))
                  );
                }
              )
            ),
            React.createElement(
              React.Fragment,
              null,
              React.createElement(DataLabLineChart, { active })
            )
          )
        : React.createElement("p", { className: "data-note" }, "No instruments loaded yet.")
    )
  );
}


window.GCDataLab = {
  DataLabModule,
};
})();
