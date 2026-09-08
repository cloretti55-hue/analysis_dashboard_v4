const { useEffect, useState } = React;
const {
  MODULE_COPY,
  MOBILE_MODULES,
  moduleFromHash,
  Disclaimer,
  HomeModule,
  useIsMobile,
  DesktopHeader,
  ThemeToggleButton,
  HomeCardIcon,
  BrandCredit,
  HalDataLogo,
} = window.GCCommon;
const {
  useCurvesFedModel,
  MobileCurveModule,
  CurvesFedModule,
} = window.GCCurvesFed;
const {
  EquityValuationModule,
  FORWARD_PE_METHOD_NOTE,
} = window.GCValuation;
const { EtfsModule } = window.GCEtfs;
const { DataLabModule } = window.GCDataLab;
const { ThemesModule } = window.GCThemes;

function MobileModuleContent({ activeModule, theme, curvesFed }) {
  if (activeModule === "curve") {
    return React.createElement(MobileCurveModule, { theme, model: curvesFed });
  }
  if (activeModule === "equity") return React.createElement(EquityValuationModule);
  if (activeModule === "tech") return React.createElement(ThemesModule);
  if (activeModule === "etfs") return React.createElement(EtfsModule);
  if (activeModule === "dataLab") return React.createElement(DataLabModule);
  return React.createElement(EtfsModule);
}

function MobileDashboard({ activeModule, setActiveModule, theme, setTheme, curvesFed }) {
  const [mobileModule, setMobileModule] = useState(() => activeModule === "home" ? null : activeModule);
  const selectedModule = mobileModule || activeModule;
  const selectedCopy = MODULE_COPY[selectedModule];

  useEffect(() => {
    setMobileModule(activeModule === "home" ? null : activeModule);
  }, [activeModule]);

  const openModule = (key) => {
    setActiveModule(key);
    setMobileModule(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeModule = () => {
    setMobileModule(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return React.createElement(
    "div",
    { className: "mobile-shell" },
    React.createElement(
      "header",
      { className: "mobile-top" },
      React.createElement(
        "div",
        { className: "mobile-brand" },
        React.createElement("span", null, mobileModule ? "Module" : "Dashboard"),
        React.createElement("strong", null, mobileModule ? MOBILE_MODULES.find(([key]) => key === selectedModule)?.[1] : "Dashboard")
      ),
      React.createElement(
        "div",
        { style: { display: "flex", gap: "8px" } },
        mobileModule
          ? React.createElement("button", { className: "mobile-icon-btn", type: "button", onClick: closeModule }, "Back")
          : null,
        React.createElement(ThemeToggleButton, { theme, setTheme, className: "mobile-icon-btn" })
      )
    ),
    mobileModule
      ? React.createElement(
          "section",
          { className: "mobile-module-view" },
          React.createElement(
            "article",
            { className: "panel mobile-module-head" },
            React.createElement("h1", null, selectedCopy.title),
            React.createElement("p", null, selectedCopy.lead)
          ),
React.createElement(MobileModuleContent, { activeModule: selectedModule, theme, curvesFed }),
          React.createElement(Disclaimer, { dataLab: selectedModule === "dataLab", methodNote: selectedModule === "equity" ? FORWARD_PE_METHOD_NOTE : null })
        )
      : React.createElement(
          React.Fragment,
          null,
          React.createElement(
            "section",
            { className: "mobile-hero" },
            React.createElement(HalDataLogo, { as: "h1" }),
            React.createElement("p", null, "Macro, valuation, themes and investment vehicles in one view.")
          ),
          React.createElement(
            "section",
            { className: "mobile-module-grid" },
            MOBILE_MODULES.map(([key, label, color]) =>
              React.createElement(
                "button",
                {
                  className: "mobile-module-card",
                  key,
                  type: "button",
                  style: { "--mobile-accent": color },
                  onClick: () => openModule(key),
                },
                React.createElement(
                  "div",
                  null,
                  React.createElement("h2", null, label),
                  React.createElement("p", null, MODULE_COPY[key].lead)
                ),
                React.createElement(HomeCardIcon, { type: key })
              )
            )
          ),
          React.createElement(Disclaimer, { full: true }),
          React.createElement(BrandCredit)
        )
  );
}

function App() {
  const [activeModule, setActiveModuleState] = useState(() => moduleFromHash());
  const [theme, setTheme] = useState("dark");
  const curvesFed = useCurvesFedModel();
  const isMobile = useIsMobile();

  const setActiveModule = (key) => {
    setActiveModuleState(key);
    window.history.pushState({ module: key }, "", key === "home" ? `${window.location.pathname}${window.location.search}` : `#${key}`);
  };

  useEffect(() => {
    const syncModuleFromHistory = () => {
      setActiveModuleState(moduleFromHash());
    };
    window.addEventListener("popstate", syncModuleFromHistory);
    window.addEventListener("hashchange", syncModuleFromHistory);
    return () => {
      window.removeEventListener("popstate", syncModuleFromHistory);
      window.removeEventListener("hashchange", syncModuleFromHistory);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("theme-light", theme === "light");
    return () => document.body.classList.remove("theme-light");
  }, [theme]);


  if (isMobile) {
    return React.createElement(MobileDashboard, {
      activeModule,
      setActiveModule,
      theme,
      setTheme,
      curvesFed,
    });
  }

  return React.createElement(
    "div",
    { className: "app" },
    activeModule === "home"
      ? null
      : React.createElement(DesktopHeader, { activeModule, setActiveModule, theme, setTheme }),
    activeModule === "home"
      ? React.createElement(HomeModule, { setActiveModule, theme, setTheme })
      : activeModule === "curve"
      ? React.createElement(CurvesFedModule, { theme, model: curvesFed })
      : activeModule === "equity"
        ? React.createElement(EquityValuationModule)
        : activeModule === "tech"
          ? React.createElement(ThemesModule)
          : activeModule === "etfs"
            ? React.createElement(EtfsModule)
            : activeModule === "dataLab"
              ? React.createElement(DataLabModule)
              : React.createElement(EtfsModule),
    activeModule === "home" ? null : React.createElement(Disclaimer, { dataLab: activeModule === "dataLab", methodNote: activeModule === "equity" ? FORWARD_PE_METHOD_NOTE : null })
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
