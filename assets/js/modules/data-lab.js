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
  belongsToGroup,
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
  typeof value === "number" && Number.isFinite(value) ? `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}${suffix}` : "n/a";

const fmtDataLabMetric = (key, value) =>
  key === "beta1yVsSp500"
    ? typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "n/a"
    : key.startsWith("correlation")
    ? typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "n/a"
    : key.toLowerCase().includes("pe")
      ? typeof value === "number" && Number.isFinite(value)
        ? `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}x`
        : "n/a"
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

function EtfContextLink({ ticker, group }) {
  const href = etfHrefForTicker?.(ticker, group);
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
  const benchmarks = chartBenchmarksFor(active, rawPoints).filter(({ key }) =>
    rawPoints.filter((point) => Number.isFinite(point.etf) && Number.isFinite(point[key])).length > 1
  );
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
  const firstDate = Date.parse(points[0]?.date);
  const dateSpan = Math.max(1, Date.parse(points[points.length - 1]?.date) - firstDate);
  const x = (index) => pad.left + ((Date.parse(points[index]?.date) - firstDate) / dateSpan) * plotW;
  const y = (value) => pad.top + ((maxValue - value) / Math.max(1, maxValue - minValue)) * plotH;
  const pathFor = (key) =>
    points
      .map((point, index) => {
        const value = point[key];
        if (typeof value !== "number" || !Number.isFinite(value)) return "";
        return `${index === 0 || (Date.parse(point.date) - Date.parse(points[index - 1].date) > 30 * 86400000) ? "M" : "L"} ${x(index).toFixed(1)} ${y(value).toFixed(1)}`;
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
    React.createElement("p", { className: "data-note" }, `Window: up to 3 years, or available history (${points[0]?.date || "n/a"} to ${endPoint?.date || "n/a"}). Base 100. Approximate total return based on adjusted close; data may be delayed or revised. ${active.market === "Brazil" ? "Repeated stale price levels with extreme discontinuities are excluded; missing volume alone does not exclude a price. Gaps over 30 days are not connected. Comparison lines share the same base date. Brazilian fixed-income comparisons use common observed dates and the latest continuous segment; the window restarts after gaps over 30 days. Return cards retain their own stated periods." : ""}`)
  );
}

function DataLabModule() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selectedTicker, setSelectedTicker] = useState(() => requestedDataLabTicker() || "IB01");
  const [selectedGroup, setSelectedGroup] = useState("Fixed Income");
  const [selectedMarket, setSelectedMarket] = useState("Global");

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
            const needsFallback = dataLabGroupFor(registeredItem) === "Fixed Income" && (!registeredItem.performanceChart?.points?.length || registeredItem.status !== "ok" || registeredItem.performanceChart.points.filter((point) => Number.isFinite(point.cash)).length < 2);
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
          setSelectedMarket(InstrumentRegistry.marketFor(firstOk));
          if (requestedInstrument) {
            if (window.location.hash.endsWith("/caps") && belongsToGroup(requestedInstrument, "Caps/Style")) setSelectedGroup("Caps/Style");
            else if (window.location.hash.endsWith("/hedges") && belongsToGroup(requestedInstrument, "Hedges & Overlays")) setSelectedGroup("Hedges & Overlays");
            else setSelectedGroup(dataLabGroupFor(requestedInstrument));
          }
        }
      })
    return () => {
      cancelled = true;
    };
  }, []);

  const instruments = (data?.instruments || []).filter((item) => InstrumentRegistry.marketFor(item) === selectedMarket);
  const assetClasses = InstrumentRegistry.GLOBAL_ASSET_CLASSES;
  const activeAssetClass = assetClasses.find((item) => item.groups.includes(selectedGroup)) || assetClasses[0];
  const visibleGroups = selectedMarket === "Brazil" ? InstrumentRegistry.BRAZIL_GROUPS : activeAssetClass.groups;
  const filteredInstruments = instruments.filter((item) => belongsToGroup(item, selectedGroup));
  const groupCounts = visibleGroups.reduce((acc, group) => {
    acc[group] = instruments.filter((item) => belongsToGroup(item, group)).length;
    return acc;
  }, {});
  const subgroupMap = filteredInstruments.reduce((acc, item) => {
    const subgroup = dataLabSubgroupFor(item, selectedGroup);
    if (!acc[subgroup]) acc[subgroup] = [];
    acc[subgroup].push(item);
    return acc;
  }, {});
  const subgroupOrder = DATA_LAB_SUBGROUP_ORDER[selectedGroup] || [];
  const subgroupEntries = selectedGroup === "Hedges & Overlays" ? Object.entries(InstrumentRegistry.HEDGE_GROUPS).map(([label, tickers]) => [label, tickers.map((ticker) => filteredInstruments.find((item) => item.ticker === ticker)).filter(Boolean)]) : Object.entries(subgroupMap).sort(([a], [b]) => {
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
  }, [selectedGroup, selectedMarket, data]);

  const active = instruments.find((item) => item.ticker === selectedTicker) || instruments[0];
  const activeBenchmarkLabel = dataLabBenchmarkLabel(active);
  const activeReferenceLabel = dataLabReferenceLabel(active);

  return React.createElement(
    "main",
    { className: "data-lab-layout work-surface" },
    React.createElement("nav", { className: "panel etf-subtabs market-tabs", "aria-label": "Listing market", style: { gridColumn: "1 / -1" } },
      ["Global", "Brazil"].map((market) => React.createElement("button", {
        key: market, type: "button", "aria-pressed": selectedMarket === market,
        onClick: () => { setSelectedMarket(market); setSelectedGroup(market === "Brazil" ? "Fixed Income Brazil" : "Fixed Income"); }
      }, market === "Brazil" ? "BRAZILIAN ETFS" : "GLOBAL ETFS"))),
    selectedMarket === "Global" ? React.createElement("nav", { className: "panel etf-subtabs", "aria-label": "Asset classes", style: { gridColumn: "1 / -1" } },
      assetClasses.map((item) => React.createElement("button", {
        key: item.label, type: "button", "aria-pressed": activeAssetClass === item,
        onClick: () => setSelectedGroup(item.groups[0])
      }, item.label))) : null,
      (selectedMarket === "Brazil" || visibleGroups.length > 1) ? React.createElement(
        "nav",
        { className: "panel data-lab-filters", "aria-label": "ETF families", style: { gridColumn: "1 / -1" } },
        visibleGroups.map((group) =>
          React.createElement(
            "button",
            {
              className: "data-lab-filter",
              type: "button",
              key: group,
              "aria-pressed": selectedGroup === group,
              onClick: () => setSelectedGroup(group),
            },
            `${group === "Core Equities" ? "Core" : group === "Caps/Style" ? "Cap/Style" : group === "Brazilian Equities" ? "Local Equities" : group} ${groupCounts[group] ? `(${groupCounts[group]})` : ""}`
          )
        )
      ) : null,
    React.createElement(
      "section",
      { className: "panel data-lab-list" },
      error ? React.createElement("p", { className: "data-note" }, "Data is temporarily unavailable. Please try again later.") : null,
      !data && !error ? React.createElement("p", { className: "data-note" }, "Loading data...") : null,
      React.createElement(
        "div",
        { className: "data-lab-instruments" },
        subgroupEntries.map(([subgroup, items]) =>
          React.createElement(
            "section",
            { className: "data-lab-subgroup", key: subgroup, style: selectedGroup === "Caps/Style" ? { alignSelf: "start" } : undefined },
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
                  React.createElement("span", null, item.status === "ok" ? (selectedGroup === "Caps/Style" ? item.capsStyle?.market : item.category) : (DATASET_STATUS_LABELS[item.dataStatus || item.status] || item.status || "unavailable"))
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
                React.createElement(EtfContextLink, { ticker: active.ticker, group: selectedGroup })
              ),
              React.createElement("p", null, active.name || active.category)
            ),
            selectedMarket === "Brazil" ? React.createElement("p", { className: "data-note" },
              "Returns are measured in BRL. ", !activeBenchmarkLabel ? "" : active.assetClass === "fixed_income"
                ? "CDI is accumulated from Banco Central do Brasil daily rates, before taxes and costs. It is a comparison reference, not the fund's tracked index."
                : `${active.benchmarkDisplay} is a market comparison, not necessarily the fund's tracked index.`) : null,
            React.createElement(
              "div",
              { className: "data-lab-badges" },
              React.createElement("span", null, "Vehicle", React.createElement("b", null, active.wrapper || "n/a")),
              React.createElement("span", null, "Currency", React.createElement("b", null, active.currency || "n/a")),
              activeBenchmarkLabel ? React.createElement("span", null, "Benchmark", React.createElement("b", null, activeBenchmarkLabel)) : null,
              activeReferenceLabel ? React.createElement("span", null, "Reference", React.createElement("b", null, activeReferenceLabel)) : null,
              active.performanceChart?.startDate ? React.createElement("span", null, "History", React.createElement("b", null, formatDatePtBr(active.performanceChart.startDate))) : null,
              React.createElement("span", null, "Data", React.createElement("b", null, active.dataAsOf ? formatDatePtBr(active.dataAsOf) : "n/a")),
              selectedMarket === "Brazil" && activeBenchmarkLabel ? React.createElement("span", null, "Comparison data", React.createElement("b", null, active.benchmarkAsOf ? formatDatePtBr(active.benchmarkAsOf) : "n/a")) : null,
              React.createElement("span", null, "Status", React.createElement("b", null, DATASET_STATUS_LABELS[active.dataStatus || active.status] || active.dataStatus || active.status || "n/a"))
            ),
            React.createElement(
              "div",
              { className: "data-lab-metrics" },
              dataLabMetricsFor(active).filter(([key]) => !key.startsWith("correlation") || valueAtPath(active, key) !== undefined).map(([key, label]) =>
                {
                  const availableReturn = active.market === "Brazil" && key === "returnYtdPct" && active.returnYtdPct == null && Number.isFinite(active.returnAvailablePct);
                  const displayLabel = availableReturn ? `Since ${active.returnAvailableStartDate}` : label;
                  const metricValue = availableReturn ? active.returnAvailablePct : metricIsSuppressed(active, key) ? undefined : valueAtPath(active, key);
                  return React.createElement(
                    "div",
                    { className: "data-lab-metric", key },
                    React.createElement("span", null, renderMetricLabel(key.startsWith("correlation") ? label.replace("Correlation", "Daily return correlation") + " · 1Y" : displayLabel)),
                    React.createElement("strong", null, fmtDataLabMetric(key, metricValue)),
                    availableReturn ? React.createElement("small", { className: "data-note" }, "Available-period return, not full YTD. " + active.metricNotes?.returnYtdPct) :
                      metricValue == null && active.metricNotes?.[key] ? React.createElement("small", { className: "data-note" }, active.metricNotes[key]) : null,
                    key.startsWith("correlation") ? React.createElement("small", { className: "data-note" }, active.correlationPeriod?.observations ? `${active.correlationPeriod.startDate} to ${active.correlationPeriod.endDate} · ${active.correlationPeriod.observations} observations · ${Date.parse(active.correlationPeriod.endDate) - Date.parse(active.correlationPeriod.startDate) < 358 * 86400000 ? "Available history (<1Y)" : "Trailing year"}` : "Period and sample unavailable for this saved snapshot.") : null
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
