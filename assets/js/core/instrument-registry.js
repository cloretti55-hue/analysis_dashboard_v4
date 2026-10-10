window.GCInstrumentRegistry = (() => {
const DATA_LAB_METRICS = [
  ["returnYtdPct", "YTD"],
  ["return1yPct", "1 year"],
  ["return3yAnnPct", "3-year annualised return"],
  ["return5yAnnPct", "5-year annualised return"],
  ["vol1yAnnPct", "1-year annualised volatility"],
  ["maxDrawdown1yPct", "1-year maximum drawdown"],
  ["beta1yVsSp500", "1-year beta"],
];

const DATA_LAB_GROUPS = ["Fixed Income", "Core Equities", "Caps/Style", "Sectors", "US Satellites", "European Themes", "China / China+1", "Commodities", "Hedges & Overlays", "Liquid Alternatives"];
const GLOBAL_ASSET_CLASSES = [
  { label: "Fixed Income", tabs: ["fixed"], groups: ["Fixed Income"] },
  { label: "Equities", tabs: ["core", "caps", "sectors", "satellites", "europe", "china"], groups: ["Core Equities", "Caps/Style", "Sectors", "US Satellites", "European Themes", "China / China+1"] },
  { label: "Alternatives", tabs: ["commodities", "hedges", "liquid"], groups: ["Commodities", "Hedges & Overlays", "Liquid Alternatives"] },
];
const LIQUID_FAMILIES = [
  {
    "name": "Managed Futures / CTA",
    "summary": "Uses long and short futures positions to seek returns across changing market conditions.",
    "subgroups": {
      "Broad Managed Futures": [
        "DBMF",
        "CTA",
        "FMF",
        "FFUT",
        "WTMF",
        "SDMF"
      ],
      "Trend Following": [
        "KMLM"
      ]
    }
  },
  {
    "name": "Equity Hedge",
    "summary": "Combines stock purchases and short positions to change exposure to equity-market risk.",
    "subgroups": {
      "Market Neutral / Anti-Beta": [
        "BTAL"
      ],
      "Long/Short Equity": [
        "FTLS"
      ]
    }
  },
  {
    "name": "Event Driven",
    "summary": "Seeks returns linked to corporate events rather than broad market direction.",
    "subgroups": {
      "Merger Arbitrage": [
        "MNA"
      ]
    }
  },
  {
    "name": "Global Macro",
    "summary": "Adjusts investments across markets using economic themes or momentum signals.",
    "subgroups": {
      "Broad / Absolute Return Macro": [
        "HFGM",
        "GMAC"
      ],
      "Macro Momentum / Tactical": [
        "SAMM"
      ]
    }
  }
];
const HEDGE_GROUPS = {"Option Income": ["JEPI", "JEPQ", "XYLD", "QYLD"], "Buffered / Defined Outcome": ["BJAN", "FJUN", "UJAN", "GJAN", "KJAN"], "Beta Reduction": ["USMV", "SPLV"], "Deconcentration": ["RSP", "EQWL", "QQEW"], "Volatility Hedge": ["VIXY", "VXX", "UVXY"], "Tail Risk / Crash Protection": ["TAIL"], "Directional Hedge": ["SH", "PSQ", "RWM", "EUM"], "Leveraged Inverse Hedge": ["SDS", "QID", "SQQQ", "SPXU"], "Currency / Safe Haven": ["FXF"]};
const HEDGE_SUMMARIES = {
  "Option Income": "Combines stocks with option strategies to generate income, while giving up some potential gains.",
  "Buffered / Defined Outcome": "Cushions a defined range of losses over a set period, in exchange for a limit on gains.",
  "Beta Reduction": "Keeps stock-market exposure while seeking smaller price swings.",
  "Deconcentration": "Spreads investment more evenly to reduce dependence on the largest companies.",
  "Volatility Hedge": "Uses VIX futures to respond to rising market stress; holding costs can be high.",
  "Tail Risk / Crash Protection": "Combines defensive assets with put options to help cushion severe stock-market declines.",
  "Directional Hedge": "Targets the opposite of an index's daily return, without additional leverage.",
  "Leveraged Inverse Hedge": "Targets two or three times the opposite of an index's daily return, amplifying gains and losses.",
  "Currency / Safe Haven": "Adds currency exposure that may diversify equity risk, without guaranteed protection."
};
const BRAZIL_GROUPS = ["Fixed Income Brazil", "Brazilian Equities", "Global Equities", "Alternatives", "Crypto"];
const marketFor = (item) => item?.market === "Brazil" ? "Brazil" : "Global";

const DATA_LAB_SUBGROUP_ORDER = {
  "Brazilian Equities": ["Core", "Small caps", "Dividends / style", "Financials"],
  "Global Equities": ["S&P 500", "Nasdaq-100"],
  "Fixed Income Brazil": ["Floating rate", "Target duration", "Fixed rate", "Short inflation-linked", "Broad inflation-linked", "Long inflation-linked", "Private credit"],
  "Alternatives": ["Gold"],
  "Crypto": ["Crypto basket", "Bitcoin"],
  "Fixed Income": ["USD liquidity", "Treasuries by duration", "TIPS / inflation", "USD credit", "Core aggregate bonds"],
  "Core Equities": ["Broad US", "Growth / Nasdaq", "Developed global core", "Developed ex-US", "European core", "Emerging markets"],
  "Caps/Style": ["Large cap", "Mid cap", "Small cap", "Micro cap"],
  Sectors: ["Growth / communication", "Cyclicals", "Defensives / yield", "Other sectors"],
  Commodities: ["Precious metals", "Industrial metals", "Strategic materials", "Energy", "Agriculture & livestock", "Timber & water", "Broad baskets"],
  "US Satellites": ["AI / semiconductors", "Security / defence", "Infrastructure / energy", "Onshoring / reindustrialisation", "Technology optionality", "Constrained economy"],
  "European Themes": ["Defence", "Luxury / indirect China", "Pharma / healthcare", "Industrials / electrification", "Digital sovereignty"],
  "China / China+1": ["Direct China", "Indirect China", "China+1", "EM ex-China"],
  "Hedges & Overlays": Object.keys(HEDGE_GROUPS),
  "Liquid Alternatives": LIQUID_FAMILIES.flatMap((family) => Object.keys(family.subgroups).map((sub) => `${family.name} / ${sub}`)),
};

const SUBGROUP_TONES = {
  "Large cap": "#54b6ff",
  "Mid cap": "#45c98f",
  "Small cap": "#9ea7ff",
  "Micro cap": "#c5a35a",
  "USD liquidity": "#42d1b7",
  "Treasuries by duration": "#7fb8ff",
  "TIPS / inflation": "#77d38b",
  "USD credit": "#9ea7ff",
  "Core aggregate bonds": "#8bc7ff",
  "Broad US": "#54b6ff",
  "Growth / Nasdaq": "#6f8cff",
  "Developed global core": "#45c98f",
  "Developed ex-US": "#7ac6ff",
  "European core": "#86a8ff",
  "Emerging markets": "#4fd6a8",
  "Growth / communication": "#5d8cff",
  Cyclicals: "#4eb7e8",
  "Defensives / yield": "#55c891",
  "Other sectors": "#9da8b8",
  "Precious metals": "#d3ad45",
  "Industrial metals": "#bd7654",
  "Strategic materials": "#8679d6",
  Energy: "#d68345",
  "Agriculture & livestock": "#65b879",
  "Timber & water": "#45a7a3",
  "Broad baskets": "#8191a8",
  "AI / semiconductors": "#5d8cff",
  "Security / defence": "#50c7d8",
  "Infrastructure / energy": "#58c489",
  "Onshoring / reindustrialisation": "#7aa7ff",
  "Technology optionality": "#8c7dff",
  "Constrained economy": "#4ec0a8",
  Defence: "#54b5d8",
  "Luxury / indirect China": "#c5a35a",
  "Pharma / healthcare": "#5ec08b",
  "Industrials / electrification": "#62b6d8",
  "Digital sovereignty": "#8a9cff",
  "Direct China": "#5d8cff",
  "Indirect China": "#63c7d2",
  "China+1": "#65bf8b",
  "EM ex-China": "#8aa4ff",
  "Option income": "#7fa8ff",
  "Beta reduction": "#62c2d8",
  Volatility: "#9d8cff",
  "Directional hedge": "#e08585",
  Deconcentration: "#6cc4a0",
  Macro: "#c8a85a",
};

const categoryOf = (item) => (item?.category || "").toLowerCase();

const rawGroupFor = (item) => {
  if (marketFor(item) === "Brazil") return item.displayGroup;
  if (item?.displayGroup === "Liquid Alternatives" || LIQUID_FAMILIES.some((family) => Object.values(family.subgroups).flat().includes(item?.ticker))) return "Liquid Alternatives";
  if (Object.values(HEDGE_GROUPS).some((tickers) => tickers.includes(item?.ticker))) return "Hedges & Overlays";
  const category = categoryOf(item);
  if (category === "caps / style") return "Caps/Style";
  if (category.includes("gics sector")) return "Sectors";
  if (category.startsWith("commodity / ") || category.startsWith("commodity producers / ")) return "Commodities";
  if (category.includes("covered call") || category.includes("minimum volatility") || category.includes("vix") || category.includes("inverse") || category.includes("concentration hedge") || category.includes("gold") || category.includes("swiss franc")) return "Hedges & Overlays";
  if (category.includes("treasuries") || category.includes("treasury bills") || category.includes("inflation usd") || category.includes("credit") || category.includes("high yield") || category.includes("core bond")) return "Fixed Income";
  if (category.includes("china") || category.includes("em ex-china") || category.includes("china+1") || category.includes("asia technology") || category.includes("copper miners") || category.includes("metals and mining")) return "China / China+1";
  if (category.includes("luxury") || category.includes("europe healthcare") || category.includes("global healthcare")) return "European Themes";
  if (category.startsWith("core") || category.includes("s&p 500 benchmark") || category.includes("us growth") || category.includes("nasdaq-100")) return "Core Equities";
  return "US Satellites";
};

const groupFor = (item) => item?.registry?.group || rawGroupFor(item);

const rawSubgroupFor = (item) => {
  if (marketFor(item) === "Brazil") return item.displaySubgroup;
  const category = categoryOf(item);
  const ticker = item?.ticker || "";
  const group = rawGroupFor(item);

  if (group === "Liquid Alternatives") return item.displaySubgroup || "Other";
  if (group === "Caps/Style") return item?.capsStyle?.size || "Other styles";

  if (group === "Fixed Income") {
    if (category.includes("treasury bills") || category.includes("liquidity")) return "USD liquidity";
    if (category.includes("treasuries")) return "Treasuries by duration";
    if (category.includes("inflation")) return "TIPS / inflation";
    if (category.includes("credit") || category.includes("high yield")) return "USD credit";
    return "Core aggregate bonds";
  }

  if (group === "Core Equities") {
    if (category.includes("s&p 500 benchmark") || category.includes("core us equity")) return "Broad US";
    if (category.includes("nasdaq") || category.includes("us growth")) return "Growth / Nasdaq";
    if (category.includes("global developed")) return "Developed global core";
    if (category.includes("developed ex-us")) return "Developed ex-US";
    if (category.includes("core europe")) return "European core";
    if (category.includes("emerging")) return "Emerging markets";
    return "Broad US";
  }

  if (group === "Sectors") {
    if (["information technology", "communication services", "consumer discretionary"].some((sector) => category.includes(sector))) return "Growth / communication";
    if (["financials", "industrials", "materials", "energy"].some((sector) => category.includes(sector))) return "Cyclicals";
    if (["health care", "consumer staples", "utilities", "real estate"].some((sector) => category.includes(sector))) return "Defensives / yield";
    return "Other sectors";
  }

  if (group === "Commodities") {
    if (category.includes("precious metals") || category.includes("precious-metal miners")) return "Precious metals";
    if (category.includes("industrial metals")) return "Industrial metals";
    if (category.includes("strategic materials")) return "Strategic materials";
    if (category.includes("energy")) return "Energy";
    if (category.includes("agriculture & livestock")) return "Agriculture & livestock";
    if (category.includes("timber & water")) return "Timber & water";
    if (category.includes("broad baskets")) return "Broad baskets";
    return "Broad baskets";
  }

  if (group === "US Satellites") {
    if (category.includes("semiconductor") || category.includes("ai")) return "AI / semiconductors";
    if (category.includes("defense") || category.includes("cyber")) return "Security / defence";
    if (category.includes("grid") || category.includes("infrastructure") || category.includes("energy")) return "Infrastructure / energy";
    if (category.includes("onshoring") || category.includes("reindustrialization")) return "Onshoring / reindustrialisation";
    if (category.includes("robot") || category.includes("quantum")) return "Technology optionality";
    return "Constrained economy";
  }

  if (group === "European Themes") {
    if (category.includes("defense")) return "Defence";
    if (category.includes("luxury")) return "Luxury / indirect China";
    if (category.includes("healthcare")) return "Pharma / healthcare";
    if (category.includes("industrial") || category.includes("electrification")) return "Industrials / electrification";
    return "Digital sovereignty";
  }

  if (group === "China / China+1") {
    if (category.includes("direct") || category.includes("china equity")) return "Direct China";
    if (category.includes("china+1")) return "China+1";
    if (category.includes("ex-china")) return "EM ex-China";
    if (category.includes("copper") || category.includes("metals and mining")) return "Indirect China";
    return "Indirect China";
  }

  if (group === "Hedges & Overlays") {
    return Object.entries(HEDGE_GROUPS).find(([, tickers]) => tickers.includes(item?.ticker))?.[0] || "Other";
  }

  return "Other";
};

const belongsToGroup = (item, group) => (group === "Hedges & Overlays" ? Object.values(HEDGE_GROUPS).some((tickers) => tickers.includes(item?.ticker)) : groupFor(item) === group) || (group === "Caps/Style" && Boolean(item?.capsStyle));
const subgroupFor = (item, group = groupFor(item)) => group === "Caps/Style"
  ? item?.capsStyle?.size || "Other styles"
  : item?.registry?.subgroup || rawSubgroupFor(item);
const FAMILY_TONES = {"Option Income": "#2F4B66", "Buffered / Defined Outcome": "#9A7B3F", "Beta Reduction": "#526D82", "Deconcentration": "#526B5D", "Volatility Hedge": "#625B71", "Tail Risk / Crash Protection": "#7A3E3E", "Directional Hedge": "#8A5A44", "Leveraged Inverse Hedge": "#814A4A", "Currency / Safe Haven": "#66717E", "Managed Futures / CTA": "#3F6663", "Equity Hedge": "#4C5874", "Event Driven": "#887341", "Global Macro": "#283B50"};
const subgroupTone = (subgroup) => FAMILY_TONES[subgroup] || Object.entries(FAMILY_TONES).find(([family]) => subgroup?.startsWith(family + " / "))?.[1] || SUBGROUP_TONES[subgroup] || "#7fb8ff";

const benchmarkCodeFor = (item) => {
  if (marketFor(item) === "Brazil") return item.benchmark;
  if (item?.assetClass === "volatility") return null;
  if (item?.assetClass === "fixed_income") return "FED_FUNDS";
  if (groupFor(item) === "Commodities") return "CPI_SPY";
  return item?.benchmark || "SPY";
};

const benchmarkLabelFor = (item) => {
  if (["BOVA11", "IVVB11"].includes(item?.ticker)) return "";
  if (marketFor(item) === "Brazil") return item.benchmarkDisplay || "";
  if (item?.registry?.benchmark?.display !== undefined) return item.registry.benchmark.display;
  const benchmarkCode = benchmarkCodeFor(item);
  if (!benchmarkCode) return "";
  if (benchmarkCode === "FED_FUNDS") return "Fed Funds";
  if (benchmarkCode === "CPI_SPY") return "U.S. CPI + S&P 500";
  if (benchmarkCode === "QQQ") return "Nasdaq-100";
  return "S&P 500";
};

const referenceLabelFor = (item) => {
  if (["BOVA11", "IVVB11"].includes(item?.ticker)) return "";
  if (marketFor(item) === "Brazil") return item.assetClass === "fixed_income" ? "CDI accumulated return" : "BRL market comparison";
  if (item?.registry?.referenceLabel !== undefined) return item.registry.referenceLabel;
  if (item?.assetClass === "volatility") return "";
  if (item?.assetClass === "fixed_income") return "Fed Funds";
  if (["Commodities", "Liquid Alternatives"].includes(groupFor(item))) return "Correlation vs S&P 500";
  if (["commodity", "currency", "inverse_equity"].includes(item?.assetClass)) return "Correlation";
  return "Beta";
};

const metricsFor = (item) => {
  if (["BOVA11", "IVVB11"].includes(item?.ticker)) return DATA_LAB_METRICS.filter(([key]) => key !== "beta1yVsSp500");
  if (marketFor(item) === "Brazil") {
    const metrics = DATA_LAB_METRICS.filter(([key]) => key !== "beta1yVsSp500");
    return [...metrics, item.assetClass === "fixed_income"
      ? ["correlation1yVsCash", "Correlation vs CDI"]
      : ["correlation1yVsSp500", `Correlation vs ${item.benchmarkDisplay}`]];
  }
  const assetClass = item?.assetClass || "";
  const category = categoryOf(item);
  const isMacro = ["commodity", "currency", "inverse_equity"].includes(assetClass);
  const isFixedIncome = assetClass === "fixed_income";
  const isHedge = ["Hedges & Overlays", "Liquid Alternatives"].includes(groupFor(item));
  const baseMetrics = DATA_LAB_METRICS.filter(([key]) => key !== "beta1yVsSp500");
  if (isFixedIncome) return [...baseMetrics, ["correlation1yVsCash", "Correlation vs Fed Funds"]];
  if (assetClass === "volatility") return baseMetrics;
  if (groupFor(item) === "Commodities" || isMacro || isHedge || category.includes("gold") || category.includes("swiss franc")) {
    return [...baseMetrics, ["correlation1yVsSp500", benchmarkCodeFor(item) === "QQQ" ? "Correlation vs Nasdaq-100" : "Correlation vs S&P 500"]];
  }
  return DATA_LAB_METRICS;
};

const metricIsSuppressed = (item, key) =>
  (item?.ticker === "IB7A" && ["return3yAnnPct", "return5yAnnPct"].includes(key)) ||
  (item?.ticker === "TI5A" && key === "return5yAnnPct") ||
  (item?.ticker === "JEPQ" && key === "return5yAnnPct");

const chartBenchmarkFor = (item, points = []) => {
  if (marketFor(item) === "Brazil") return { key: item.assetClass === "fixed_income" ? "cash" : "sp500", label: item.benchmarkDisplay };
  if (benchmarkCodeFor(item) === "CPI_SPY") return { key: "sp500", label: "S&P 500" };
  const benchmarkCode = benchmarkCodeFor(item);
  if (!benchmarkCode) return { key: null, label: "" };
  if (benchmarkCode === "FED_FUNDS") {
    const available = points.filter((point) => Number.isFinite(point.cash)).length >= 2;
    return { key: available ? "cash" : null, label: "Fed Funds" };
  }
  if (benchmarkCode === "QQQ") return { key: "qqq", label: "Nasdaq-100" };
  return { key: "sp500", label: "S&P 500" };
};

const chartBenchmarksFor = (item, points = []) => {
  if (groupFor(item) === "Liquid Alternatives") return [
    { key: "sp500", label: "S&P 500", className: "is-spy" },
    { key: "cash", label: "Fed Funds", className: "is-cpi" },
  ].filter(({key}) => points.filter(point => Number.isFinite(point[key])).length >= 2);
  if (["BOVA11", "IVVB11"].includes(item?.ticker)) return [];
  if (benchmarkCodeFor(item) === "CPI_SPY") {
    return [
      { key: "sp500", label: "S&P 500", className: "is-spy" },
      { key: "cpi", label: "U.S. CPI", className: "is-cpi" },
    ].filter(({ key }) => points.some((point) => typeof point[key] === "number"));
  }
  const benchmark = chartBenchmarkFor(item, points);
  return benchmark.key ? [{ ...benchmark, className: "is-spy" }] : [];
};

const instrumentTypeFor = (item) => {
  if (item?.instrumentType) return item.instrumentType;
  const wrapper = (item?.wrapper || "").toLowerCase();
  if (wrapper.includes("etn")) return "etn";
  if (wrapper.includes("etf")) return "etf";
  if (item?.maturityDate || item?.expiryDate) return "fixed_income_security";
  return item?.assetClass || "instrument";
};

const enrichInstrument = (item, catalogItem = null) => {
  const merged = { ...(catalogItem || {}), ...(item || {}) };
  const group = rawGroupFor(merged);
  const subgroup = rawSubgroupFor(merged);
  const benchmarkCode = benchmarkCodeFor(merged);
  const explicitCapabilities = merged.capabilities || {};
  const capabilities = {
    performance: explicitCapabilities.performance !== false,
    risk: explicitCapabilities.risk !== false,
    comparison: explicitCapabilities.comparison !== false && Boolean(benchmarkCode),
    maturity: explicitCapabilities.maturity === true || Boolean(merged.maturityDate || merged.expiryDate),
    yield: explicitCapabilities.yield === true,
  };

  return {
    ...merged,
    instrumentId: merged.instrumentId || merged.ticker,
    registry: {
      schemaVersion: 1,
      instrumentType: instrumentTypeFor(merged),
      dataFamily: merged.dataFamily || "market_instrument",
      group,
      subgroup,
      subgroupTone: subgroupTone(subgroup),
      benchmark: {
        code: benchmarkCode,
        display: benchmarkLabelFor(merged),
      },
      referenceLabel: referenceLabelFor(merged),
      updateFrequency: merged.updateFrequency || null,
      maturityDate: merged.maturityDate || merged.expiryDate || null,
      capabilities,
    },
  };
};

const createCatalog = (payload) => {
  const items = Array.isArray(payload) ? payload : payload?.instruments || [];
  const byTicker = new Map(items.map((item) => [item.ticker, item]));
  return {
    size: byTicker.size,
    get: (ticker) => byTicker.get(ticker) || null,
    enrich: (item) => enrichInstrument(item, byTicker.get(item?.ticker) || null),
  };
};

return {
  LIQUID_FAMILIES,
  HEDGE_GROUPS,
  HEDGE_SUMMARIES,
  GLOBAL_ASSET_CLASSES,
  BRAZIL_GROUPS,
  marketFor,
  DATA_LAB_GROUPS,
  DATA_LAB_SUBGROUP_ORDER,
  createCatalog,
  enrichInstrument,
  groupFor,
  belongsToGroup,
  subgroupFor,
  subgroupTone,
  metricsFor,
  metricIsSuppressed,
  benchmarkLabelFor,
  referenceLabelFor,
  chartBenchmarkFor,
  chartBenchmarksFor,
};
})();
