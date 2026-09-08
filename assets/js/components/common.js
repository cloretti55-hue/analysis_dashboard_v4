window.GCCommon = (() => {
function formatDatePtBr(dateText) {
  if (!dateText) return "";
  const match = String(dateText).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(dateText);
}

function formatDatesInText(text) {
  return text == null
    ? ""
    : String(text).replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, year, month, day) => `${day}/${month}/${year}`);
}

const DATASET_STATUS_LABELS = {
  ok: "Current",
  stale: "Stale",
  partial: "Partial",
  manual: "Manual",
  error: "Error",
  unavailable: "Unavailable",
  unknown: "Available",
};

function DatasetStatusLine({ result, label }) {
  if (!result) {
    return React.createElement(
      "div",
      { className: "dataset-status-line" },
      React.createElement("strong", null, label),
      React.createElement("span", null, "Loading metadata...")
    );
  }

  const meta = result.meta || {};
  const status = result.ok ? (meta.status || "unknown") : "unavailable";
  const publicSource = meta.id === "etf-performance"
    ? "Yahoo Finance"
    : meta.id === "fixed-income-performance"
    ? "Yahoo Finance and Federal Reserve (FRED)"
    : meta.source;
  return React.createElement(
    "div",
    { className: "dataset-status-line" },
    React.createElement("strong", null, label || meta.id),
    React.createElement("span", { className: "dataset-status-badge", "data-status": status }, DATASET_STATUS_LABELS[status] || status),
    meta.asOf ? React.createElement("span", null, `Data as of ${formatDatePtBr(meta.asOf)}`) : null,
    publicSource ? React.createElement("span", null, `Source: ${publicSource}`) : null
  );
}

const MODULE_COPY = {
  home: {
    title: "Dashboard",
    lead: "",
    thesis: "Dashboard",
    subtitle: "Macro, valuation, themes and data",
  },
  curve: {
    title: "Yield Curves",
    lead: "",
    thesis: "Carry",
    subtitle: "Moderate duration (2.3y)",
  },
  equity: {
    title: "Stock Market Valuation",
    lead: "",
    thesis: "Concentration",
    subtitle: "Magnificent 7 premium",
  },
  tech: {
    title: "Themes",
    lead: "Thematic pages covering current themes, sector maps, technology cycles and structural change.",
    thesis: "Themes",
    subtitle: "Current pages",
  },
  core: {
    title: "The vehicle defines the portfolio's actual exposure",
    lead: "In global portfolios, an ETF is not just a cost: it defines liquidity, tax treatment, accumulation, hedging, concentration and operational efficiency.",
    thesis: "Implementation",
    subtitle: "Exposure, vehicle and role",
  },
};

MODULE_COPY.satellites = {
  title: "Satellite allocations combine convexity, vehicle and risk sizing",
  lead: "Satellite allocation is not a list of themes: every thesis must align an economic driver, instrument and implementation risk.",
  thesis: "Convexity",
  subtitle: "ETF vs basket",
};

MODULE_COPY.europe = {
  title: "In Europe, the core buys the continent — the basket buys the thesis",
  lead: "Broad exposure diversifies. The strongest theses require selection: defence, luxury, pharma, digital sovereignty and industrials.",
  thesis: "Selection",
    subtitle: "European themes",
};

MODULE_COPY.china = {
  title: "China remains relevant — but the exposure channel matters more",
  lead: "China's economy remains central to consumption, manufacturing, commodities and global supply chains. That does not mean the best way to capture China is to buy Chinese equities directly.",
  thesis: "Channel",
  subtitle: "Direct, indirect or China+1",
};

MODULE_COPY.hedges = {
  title: "Liquid hedging strategies",
  lead: "When Treasuries, TIPS, cash and gold are already addressed elsewhere, hedging becomes an exercise in payoff, beta and volatility engineering.",
  thesis: "Payoff",
  subtitle: "Options, beta and volatility",
};

MODULE_COPY.etfs = {
  title: "ETF Architecture",
  lead: "",
  thesis: "Implementation",
  subtitle: "Core, satellites and hedge",
};

MODULE_COPY.dataLab = {
  title: "Data Lab",
  lead: "",
  thesis: "Data",
  subtitle: "Return, risk and benchmark",
};

const HOME_CARDS = [
  ["curve", "Rates", "Yield Curves", "Nominal and real curves, implied inflation, Fed Funds and slopes.", "#48d6e9"],
  ["equity", "Valuation", "Equity Valuation", "Multiples, Magnificent 7, dispersion and the US market's relative premium.", "#6ee7b7"],
  ["etfs", "Vehicles", "ETFs", "Core equities, fixed income, sector, satellite, China, Europe and hedging exposures.", "#8db7ff"],
  ["dataLab", "Data", "Data Lab", "Return, volatility, drawdown, beta, correlation and ETF benchmarks.", "#6ee7b7"],
  ["tech", "Themes", "Thematic pages", "Current theses, sector maps, technology cycles and economic bottlenecks.", "#ffae6b"],
];

const MAIN_NAV = [
  ["home", "Home"],
  ["curve", "Rates"],
  ["equity", "Valuation"],
  ["etfs", "ETFs"],
  ["dataLab", "Data Lab"],
  ["tech", "Themes"],
];

const MODULE_KEYS = new Set(MAIN_NAV.map(([key]) => key));

function hashParts() {
  return window.location.hash.replace(/^#/, "").split("/").filter(Boolean);
}

function moduleFromHash() {
  const [module] = hashParts();
  return MODULE_KEYS.has(module) ? module : "home";
}

function themeFromHash() {
  const [module, theme] = hashParts();
  return module === "tech" && theme ? theme : null;
}

const MOBILE_MODULES = [
  ["curve", "Rates", "#48d6e9"],
  ["equity", "Equity Valuation", "#6ee7b7"],
  ["etfs", "ETFs", "#8db7ff"],
  ["dataLab", "Data Lab", "#6ee7b7"],
  ["tech", "Themes", "#ffae6b"],
];

function HomeCardIcon({ type }) {
  const iconProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.3,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };
  const path = (d, key = d) => React.createElement("path", { d, key });
  const circle = (cx, cy, r, key = `${cx}-${cy}-${r}`) => React.createElement("circle", { cx, cy, r, key });
  const shapes = {
    curve: [path("M4 18V6"), path("M4 18h16"), path("M6 15l4-5 4 2 4-6")],
    equity: [path("M5 18v-5h3v5"), path("M10.5 18V8h3v10"), path("M16 18V4h3v14")],
    etfs: [path("M5 7l7-3 7 3-7 3-7-3z"), path("M5 12l7 3 7-3"), path("M5 16l7 3 7-3")],
    dataLab: [path("M5 6c0-1.2 3.1-2.2 7-2.2S19 4.8 19 6s-3.1 2.2-7 2.2S5 7.2 5 6z"), path("M5 6v6c0 1.2 3.1 2.2 7 2.2s7-1 7-2.2V6"), path("M5 12v6c0 1.2 3.1 2.2 7 2.2s7-1 7-2.2v-6")],
    tech: [path("M12 3l1.5 4.4L18 9l-4.5 1.6L12 15l-1.5-4.4L6 9l4.5-1.6L12 3z"), circle(18.5, 16.5, 2), circle(6, 17.5, 1.2)],
  };
  return React.createElement(
    "span",
    { className: "home-card-icon" },
    React.createElement("svg", iconProps, shapes[type] || shapes.dataLab)
  );
}

const FULL_DISCLAIMER =
  "Data and analysis are provided for informational and educational purposes. They do not constitute investment, financial, tax or legal advice. Information may be delayed, approximate or differ across providers. Verify sources, prices, costs, risks and suitability before making any decision.";

const SHORT_DISCLAIMER =
  "Informational and educational content. It does not constitute investment or tax advice. Data may be delayed, approximate or subject to revision.";

const DATALAB_DISCLAIMER_EXTRA =
  "Approximate total return based on adjusted close; S&P 500 proxied by SPY and Nasdaq-100 by QQQ; data may be delayed or revised.";

function Disclaimer({ full = false, dataLab = false, methodNote = null }) {
  return React.createElement(
    "section",
    { className: "panel disclaimer-panel" },
    methodNote ? React.createElement("span", { className: "method-note" }, methodNote) : null,
    full ? React.createElement("strong", null, "Disclaimer") : null,
    React.createElement("span", null, full ? FULL_DISCLAIMER : `${SHORT_DISCLAIMER}${dataLab ? ` ${DATALAB_DISCLAIMER_EXTRA}` : ""}`)
  );
}

function ThemeToggleButton({ theme, setTheme, className }) {
  return React.createElement(
    "button",
    {
      className,
      type: "button",
      onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
    theme === "dark" ? "Light" : "Dark"
  );
}

function ThemeSwitch({ theme, setTheme }) {
  return React.createElement(
    "div",
    { className: "theme-switch" },
    React.createElement("span", null, "Theme"),
    React.createElement(ThemeToggleButton, { theme, setTheme })
  );
}

function MainNavigation({ activeModule, setActiveModule }) {
  return React.createElement(
    "nav",
    { className: "view-tabs", "aria-label": "Dashboard modules" },
    MAIN_NAV.map(([key, label]) =>
      React.createElement(
        "button",
        {
          className: "view-tab",
          type: "button",
          key,
          "aria-current": activeModule === key ? "page" : undefined,
          onClick: () => setActiveModule(key),
        },
        label
      )
    )
  );
}

function DesktopHeader({ activeModule, setActiveModule, theme, setTheme }) {
  const copy = MODULE_COPY[activeModule];
  return React.createElement(
    "header",
    { className: "topbar" },
    React.createElement(
      "section",
      null,
      React.createElement(MainNavigation, { activeModule, setActiveModule }),
      React.createElement("h1", null, copy.title),
      copy.lead ? React.createElement("p", { className: "lead" }, copy.lead) : null
    ),
    React.createElement(
      "aside",
      { className: "header-side" },
      React.createElement(ThemeSwitch, { theme, setTheme })
    )
  );
}

function BrandCredit() {
  return React.createElement(
    "div",
    { className: "brand-credit" },
    React.createElement("span", null, "© 2026 General Channels Co."),
    React.createElement("small", null, "All rights reserved.")
  );
}

function HalDataLogo({ as = "div" } = {}) {
  return React.createElement(
    as,
    { className: "hal-data-logo", "aria-label": "HAL DATA" },
    React.createElement("span", { className: "hal-data-mark", "aria-hidden": "true" }),
    React.createElement(
      "span",
      { className: "hal-data-wordmark", "aria-hidden": "true" },
      React.createElement("strong", null, "HAL"),
      " ",
      React.createElement("span", null, "DATA")
    )
  );
}

function HomeModule({ setActiveModule, theme, setTheme }) {
  return React.createElement(
    "main",
    { className: "home-layout" },
    React.createElement(
      "section",
      { className: "panel home-hero" },
      React.createElement(
        "div",
        null,
        React.createElement(HalDataLogo, { as: "h2" }),
        React.createElement("p", null, "Macro, valuation, themes and investment vehicles in one view.")
      ),
      React.createElement(ThemeSwitch, { theme, setTheme })
    ),
    React.createElement(
      "section",
      { className: "home-grid" },
      HOME_CARDS.map(([key, layer, title, text, color]) =>
        React.createElement(
          "button",
          {
            className: "home-card",
            key,
            type: "button",
            style: { "--home-accent": color },
            onClick: () => setActiveModule(key),
          },
          React.createElement(
            "div",
            { className: "home-card-body" },
            React.createElement(
              "div",
              { className: "home-card-head" },
              React.createElement(HomeCardIcon, { type: key }),
              React.createElement("span", null, layer)
            ),
            React.createElement("h3", null, title),
            React.createElement("p", null, text)
          ),
          React.createElement("small", null, "Open module")
        )
      )
    ),
    React.createElement(Disclaimer, { full: true }),
    React.createElement(BrandCredit)
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

return Object.freeze({
  formatDatePtBr,
  DATASET_STATUS_LABELS,
  DatasetStatusLine,
  MODULE_COPY,
  MOBILE_MODULES,
  moduleFromHash,
  themeFromHash,
  Disclaimer,
  HomeModule,
  useIsMobile,
  DesktopHeader,
  ThemeToggleButton,
  HomeCardIcon,
  BrandCredit,
  HalDataLogo,
});
})();
