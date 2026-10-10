(function () {
const { useEffect, useState } = React;

function scrollToMobileDetail(selector) {
  if (!window.matchMedia("(max-width: 720px)").matches) return;
  window.setTimeout(() => {
    const title = document.querySelector(selector);
    if (!title) return;
    const top = title.getBoundingClientRect().top + window.scrollY - 78;
    window.scrollTo({ top, behavior: "smooth" });
  }, 60);
}

const CORE_FUNCTIONS = [
  { fn: "US structural beta", why: "Low cost, efficient replication and long-term exposure.", tickers: ["VOO", "CSPX", "VUAA"], note: "UCITS Acc may suit non-US offshore portfolios where tax treatment is appropriate." },
  { fn: "US execution / hedge", why: "Liquidity, options and market depth.", tickers: ["SPY"], note: "Frequently used for puts, collars, overlays and tactical rebalancing." },
  { fn: "Structural growth", why: "Nasdaq-100 at lower cost or through a UCITS version.", tickers: ["QQQM", "CNDX", "EQQQ"], note: "QQQ is more execution-oriented; QQQM/UCITS are generally better suited to carry." },
  { fn: "Tactical growth / hedge", why: "Deep options markets and superior liquidity.", tickers: ["QQQ"], note: "A trading instrument, not necessarily the best tax vehicle." },
  { fn: "Concentration reduction", why: "Reduces mega-cap dominance.", tickers: ["RSP"], note: "Increases exposure to cyclicals and interest-rate risk." },
  { fn: "Developed global core", why: "MSCI World with a significant US weight.", tickers: ["IWDA", "SWDA"], note: "Simplifies a global core but does not reduce US exposure." },
  { fn: "Developed ex-US core", why: "Developed-market diversification outside the US.", tickers: ["VEA", "IEFA"], note: "VEA includes Canada; IEFA follows EAFE and excludes the US and Canada." },
  { fn: "European core", why: "Regional exposure.", tickers: ["VGK", "IEUR", "FEZ", "IMEU"], note: "A broad ETF does not capture defence, luxury and digital sovereignty well." },
  { fn: "Broad emerging markets", why: "Diversified EM beta.", tickers: ["VWO", "IEMG", "EIMI"], note: "China can dominate the risk profile." },
  { fn: "Emerging markets ex-China", why: "Reduces China risk.", tickers: ["EMXC", "EXCH"], note: "Useful for China+1 and geopolitical diversification." },
  { fn: "Treasury liquidity", why: "These funds hold US Treasury securities with very short remaining maturities.", tickers: ["SGOV", "IB01"], note: "SGOV covers 0–3 months; IB01 covers 0–1 year, so the maturity ranges are close but not identical." },
  { fn: "Treasury 1–3 years", why: "These funds hold short-term US Treasuries, with less interest-rate sensitivity than longer-maturity funds.", tickers: ["SHY", "IBTA"], note: "The vehicles differ in listing, distribution policy and wrapper." },
  { fn: "Treasury 3–7 years", why: "These funds provide exposure to US Treasuries in the 3–7 year maturity range.", tickers: ["IEI", "CBU7"], note: "Duration and price sensitivity are higher than in short Treasury vehicles." },
  { fn: "Treasury 7–10 years", why: "These funds focus on US Treasuries with 7–10 years remaining to maturity.", tickers: ["IEF", "IB7A"], note: "This maturity range carries greater sensitivity to changes in medium-term yields." },
  { fn: "Treasury 20+ years", why: "These funds hold long-maturity US Treasuries and are highly sensitive to changes in long-term yields.", tickers: ["TLT", "DTLA"], note: "Long maturities bring materially greater sensitivity to changes in long-term yields." },
  { fn: "TIPS 0–5 years", why: "Short-maturity TIPS combine inflation adjustments with less real-rate sensitivity than longer-maturity TIPS.", tickers: ["STIP", "TI5A"], note: "Both focus on short-maturity US TIPS through different listing and distribution structures." },
  { fn: "Broad TIPS", why: "These funds hold inflation-linked Treasuries across a broader range of maturities.", tickers: ["TIP", "IDTP"], note: "The broader basket carries more real-rate sensitivity than short-duration TIPS." },
  { fn: "Investment-grade credit", why: "These funds invest in US dollar-denominated corporate bonds rated investment grade.", tickers: ["LQD", "LQDA"], note: "Credit spreads and duration both influence performance." },
  { fn: "High-yield credit", why: "These funds invest in US dollar-denominated high-yield bonds, which carry greater credit risk.", tickers: ["HYG", "IHYA"], note: "Higher spreads come with greater default and economic-cycle sensitivity." },
  { fn: "Aggregate bonds", why: "These funds combine government and corporate bonds within a diversified fixed-income portfolio.", tickers: ["AGG", "AGGU"], note: "AGG is US aggregate; AGGU is global aggregate with USD currency hedging, so they are functional counterparts rather than identical benchmarks." },
  { fn: "Macro hedge", why: "Regime protection, strong currency and store of value.", tickers: ["GLD", "IAU", "FXF / CHF"], note: "Physical gold and the Swiss franc as macro diversifiers." },
];

const FIXED_INCOME_TICKERS = new Set(["SGOV", "IB01", "SHY", "IBTA", "IEI", "CBU7", "IEF", "IB7A", "TLT", "DTLA", "STIP", "TI5A", "TIP", "IDTP", "LQD", "LQDA", "HYG", "IHYA", "AGG", "AGGU"]);
const HEDGE_MACRO_TICKERS = new Set(["GLD", "IAU", "FXF / CHF"]);
const FIXED_INCOME_FUNCTIONS = CORE_FUNCTIONS.filter((row) => row.tickers.some((ticker) => FIXED_INCOME_TICKERS.has(ticker)));
const CORE_EQUITY_FUNCTIONS = CORE_FUNCTIONS.filter((row) => !row.tickers.some((ticker) => FIXED_INCOME_TICKERS.has(ticker) || HEDGE_MACRO_TICKERS.has(ticker)));

const CAPS_FUNCTIONS = [{"fn": "US large caps", "why": "S&P 500 exposure through US-listed and UCITS vehicles.", "tickers": ["VOO", "CSPX", "VUAA"], "note": "These instruments also remain available in Core Equities."}, {"fn": "US mid caps", "why": "S&P MidCap 400 exposure.", "tickers": ["IJH", "SPY4"], "note": "US-listed and accumulating UCITS vehicles tracking the same equity index."}, {"fn": "US small caps", "why": "S&P SmallCap 600 exposure.", "tickers": ["IJR", "IDP6"], "note": "Both follow the S&P small-cap universe, including its earnings eligibility rules."}, {"fn": "US micro caps", "why": "Russell Microcap exposure.", "tickers": ["IWC"], "note": "This selection currently includes a US-listed vehicle."}, {"fn": "International small caps", "why": "Small companies outside the United States.", "tickers": ["SCZ", "VSS"], "note": "SCZ covers EAFE; VSS also includes Canada and emerging markets. They are not equivalent portfolios."}, {"fn": "Global small caps · UCITS", "why": "Small companies across developed markets, including the United States.", "tickers": ["WSML"], "note": "MSCI World Small Cap exposure with income reinvested."}];

const CORE_TOKEN_GROUPS = {
  WSML: "etf-global",
  VSS: "etf-developed",
  SCZ: "etf-developed",
  IWC: "etf-us",
  IDP6: "etf-us",
  IJR: "etf-us",
  SPY4: "etf-us",
  IJH: "etf-us",
  VOO: "etf-us",
  CSPX: "etf-us",
  VUAA: "etf-us",
  SPY: "etf-us",
  QQQM: "etf-us",
  CNDX: "etf-us",
  EQQQ: "etf-us",
  QQQ: "etf-us",
  RSP: "etf-us",
  VEA: "etf-developed",
  IEFA: "etf-developed",
  IWDA: "etf-global",
  SWDA: "etf-global",
  VGK: "etf-developed",
  IEUR: "etf-developed",
  FEZ: "etf-developed",
  IMEU: "etf-developed",
  VWO: "etf-emerging",
  IEMG: "etf-emerging",
  EIMI: "etf-emerging",
  EMXC: "etf-emerging",
  EXCH: "etf-emerging",
  IB01: "etf-treasury",
  IBTA: "etf-treasury",
  CBU7: "etf-treasury",
  IB7A: "etf-treasury",
  DTLA: "etf-treasury",
  TI5A: "etf-inflation",
  IDTP: "etf-inflation",
  LQDA: "etf-credit",
  IHYA: "etf-credit",
  AGGU: "etf-aggregate",
  SGOV: "etf-treasury",
  SHY: "etf-treasury",
  IEI: "etf-treasury",
  IEF: "etf-treasury",
  TLT: "etf-treasury",
  STIP: "etf-inflation",
  TIP: "etf-inflation",
  LQD: "etf-credit",
  HYG: "etf-credit",
  AGG: "etf-aggregate",
  GLD: "etf-other",
  IAU: "etf-other",
  "FXF / CHF": "etf-other",
};

const UCITS_TICKERS = new Set([
  "WSML",
  "IDP6",
  "SPY4",
  "CSPX",
  "VUAA",
  "CNDX",
  "EQQQ",
  "IUIT",
  "IUCM",
  "IUCD",
  "IUCS",
  "IUES",
  "IUFS",
  "IUHC",
  "IUIS",
  "IUMS",
  "IUUS",
  "IWDA",
  "SWDA",
  "IMEU",
  "EIMI",
  "EXCH",
  "IB01",
  "IBTA",
  "CBU7",
  "IB7A",
  "DTLA",
  "TI5A",
  "IDTP",
  "LQDA",
  "IHYA",
  "AGGU",
]);

const tickerMatchesVehicleView = (ticker, vehicleView) =>
  vehicleView === "all" ||
  (vehicleView === "ucits" && UCITS_TICKERS.has(ticker)) ||
  (vehicleView === "us" && !UCITS_TICKERS.has(ticker));

const coreTokenClass = (ticker, vehicleView) => {
  const classes = ["etf-token", CORE_TOKEN_GROUPS[ticker] || "etf-other"];
  if (vehicleView !== "all" && !tickerMatchesVehicleView(ticker, vehicleView)) {
    classes.push("is-muted");
  }
  return classes.join(" ");
};

const CORE_COUNTRY_WEIGHTS = {
  VEA: [
    ["Japão", 21.0],
    ["Reino Unido", 12.0],
    ["Canadá", 9.0],
    ["França", 8.0],
    ["Suíça", 7.5],
    ["Alemanha", 7.0],
  ],
  IEFA: [
    ["Japão", 25.7],
    ["Reino Unido", 13.9],
    ["França", 9.0],
    ["Suíça", 8.7],
    ["Alemanha", 8.0],
    ["Austrália", 7.1],
  ],
  IWDA: [
    ["EUA", 72.0],
    ["Japão", 5.5],
    ["Reino Unido", 3.5],
    ["Canadá", 3.0],
    ["França", 2.8],
    ["Suíça", 2.6],
  ],
  SWDA: [
    ["EUA", 72.0],
    ["Japão", 5.5],
    ["Reino Unido", 3.5],
    ["Canadá", 3.0],
    ["França", 2.8],
    ["Suíça", 2.6],
  ],
  VGK: [
    ["Reino Unido", 23.0],
    ["França", 17.0],
    ["Suíça", 15.0],
    ["Alemanha", 13.0],
    ["Holanda", 7.0],
    ["Suécia", 6.0],
  ],
  IEUR: [
    ["Reino Unido", 21.5],
    ["França", 18.2],
    ["Suíça", 16.5],
    ["Alemanha", 13.6],
    ["Holanda", 7.3],
    ["Dinamarca", 5.4],
  ],
  FEZ: [
    ["França", 34.0],
    ["Alemanha", 31.0],
    ["Holanda", 14.0],
    ["Espanha", 8.0],
    ["Itália", 7.0],
    ["Bélgica", 3.0],
  ],
  IMEU: [
    ["Reino Unido", 22.0],
    ["França", 18.0],
    ["Suíça", 16.2],
    ["Alemanha", 13.8],
    ["Holanda", 7.2],
    ["Dinamarca", 5.1],
  ],
  VWO: [
    ["Taiwan", 29.0],
    ["China", 29.0],
    ["Índia", 19.0],
    ["Brasil", 4.0],
    ["Arábia Saudita", 3.0],
    ["África do Sul", 3.0],
  ],
  IEMG: [
    ["Taiwan", 28.1],
    ["Coreia do Sul", 21.7],
    ["China", 17.9],
    ["Índia", 12.2],
    ["Brasil", 3.7],
    ["África do Sul", 3.0],
  ],
  EIMI: [
    ["Taiwan", 28.0],
    ["Coreia do Sul", 21.5],
    ["China", 18.0],
    ["Índia", 12.0],
    ["Brasil", 3.7],
    ["África do Sul", 3.0],
  ],
  EMXC: [
    ["Taiwan", 34.6],
    ["Coreia do Sul", 28.2],
    ["Índia", 13.6],
    ["Brasil", 4.6],
    ["África do Sul", 3.6],
    ["Arábia Saudita", 3.0],
  ],
  EXCH: [
    ["Taiwan", 34.5],
    ["Coreia do Sul", 28.0],
    ["Índia", 13.5],
    ["Brasil", 4.5],
    ["África do Sul", 3.5],
    ["Arábia Saudita", 3.0],
  ],
};

const CORE_DETAILS = {
  WSML: ["Small cap", "Tracks the MSCI World Small Cap Index through an accumulating UCITS fund, covering small companies across developed markets, including the United States.", "This is global developed-market exposure, not an ex-US portfolio. The selected London listing trades in US dollars, while the fund’s underlying holdings retain their local-currency exposure.", [], "https://www.ishares.com/uk/individual/en/products/296576/ishares-msci-world-small-cap-ucits-etf-usd-(acc"],
  VSS: ["Small cap", "Tracks the FTSE Global Small Cap ex US Index, covering small companies across developed and emerging markets outside the United States.", "The broader geographic universe distinguishes VSS from EAFE-only small-cap funds. A US-dollar trading price does not hedge the currencies of the underlying international holdings.", [], "https://advisors.vanguard.com/investments/products/vss/vanguard-ftse-all-world-ex-us-small-cap-etf"],
  SCZ: ["Small cap", "Tracks small companies in developed markets outside the United States and Canada through the MSCI EAFE Small Cap Index.", "The ETF trades in US dollars on Nasdaq, but its portfolio spans multiple local currencies. Its geographic coverage differs from VSS, which also includes emerging markets, and WSML, which includes the United States.", [], "https://www.ishares.com/us/products/239627/ishares-msci-eafe-smallcap-etf"],
  IWC: ["Micro cap", "Tracks the Russell Microcap Index, providing exposure to very small publicly traded US companies.", "The underlying shares generally have less trading liquidity than larger companies. Micro-cap and small-cap universes can overlap; these labels do not imply mutually exclusive portfolios or fixed dollar thresholds.", [], "https://www.ishares.com/us/products/239716/ishares-microcap-etf"],
  IDP6: ["Small cap", "Tracks the S&P SmallCap 600 through a distributing UCITS fund. It provides exposure to the same underlying US small-cap index as IJR.", "IDP6 is the London listing traded in US dollars. Income is distributed, and the fund remains exposed to US small-company equity risk regardless of the investor’s home currency.", [], "https://www.ishares.com/uk/individual/en/products/251920/ishares-s-p-smallcap-600-ucits-etf"],
  IJR: ["Small cap", "Tracks the S&P SmallCap 600, a portfolio of small US companies selected under S&P index eligibility rules.", "The earnings requirements distinguish this universe from broader small-cap benchmarks such as the Russell 2000. Returns can therefore differ materially even when both are described as small-cap exposure.", [], "https://www.ishares.com/us/products/239774/ishares-core-sp-smallcap-etf"],
  SPY4: ["Mid cap", "Tracks the S&P MidCap 400 through an accumulating UCITS fund. It provides US mid-cap exposure using the same underlying equity index as IJH.", "This selection uses the London listing in US dollars. The fund reinvests income; its wrapper, fees and trading hours differ from the US-listed vehicle.", [], "https://www.ssga.com/uk/en_gb/institutional/etfs/state-street-spdr-sp-400-us-mid-cap-ucits-etf-acc-spy4-gy"],
  IJH: ["Mid cap", "Tracks the S&P MidCap 400, providing exposure to medium-sized US companies outside the S&P 500.", "The index applies its own eligibility rules, including earnings requirements. Its sector composition and company mix differ from both large-cap and small-cap benchmarks.", [], "https://www.ishares.com/us/products/239763/ishares-core-sp-midcap-etf"],
  VOO: [
    "US structural beta",
    "Tracks the S&P 500, providing broad exposure to large US companies.",
    "It can serve as a core US equity holding, with market-cap weighting giving the largest companies the greatest influence on returns.",
    []
  ],
  CSPX: [
    "US structural beta",
    "Tracks the S&P 500 through an accumulating UCITS ETF, reinvesting income within the fund.",
    "It provides large-cap US equity exposure; the UCITS wrapper changes the investment vehicle, not the concentration of the underlying index.",
    []
  ],
  VUAA: [
    "US structural beta",
    "Tracks the S&P 500 through an accumulating UCITS ETF, reinvesting income rather than paying cash distributions.",
    "Its domicile and trading arrangements distinguish it from US-listed alternatives, while the underlying exposure remains large-cap US equities.",
    []
  ],
  SPY: [
    "US execution / hedge",
    "Tracks the S&P 500 and has an established market for share trading and options.",
    "Its options can be used for puts, collars and other strategies. Trading liquidity, costs and distribution policy are relevant when comparing it with other S&P 500 vehicles.",
    []
  ],
  QQQ: [
    "Tactical growth / hedge",
    "Tracks the Nasdaq-100, with a portfolio concentrated in large growth and technology-related companies.",
    "An established options market supports trading and hedging strategies. QQQM and UCITS funds offer alternative vehicles for the same index exposure.",
    []
  ],
  QQQM: [
    "Structural growth",
    "Tracks the Nasdaq-100 in a vehicle positioned for long-term index holdings.",
    "It follows the same index as QQQ, so the underlying company concentration remains. Costs and trading liquidity distinguish the two vehicles.",
    []
  ],
  CNDX: [
    "Structural growth",
    "Tracks the Nasdaq-100 through an accumulating UCITS ETF, reinvesting income within the fund.",
    "Its wrapper and distribution policy differ from QQQ, while its concentration remains tied to the same growth-oriented index.",
    []
  ],
  EQQQ: [
    "Structural growth",
    "Provides Nasdaq-100 exposure through a distributing UCITS ETF.",
    "Income is paid out rather than accumulated. Distribution policy, costs and the currency of the selected listing distinguish it from accumulating alternatives such as CNDX.",
    []
  ],
  RSP: [
    "Concentration reduction",
    "Tracks an equal-weighted version of the S&P 500, reducing the dominance of its largest companies.",
    "Smaller index constituents receive greater weight than in the market-cap-weighted index. This also changes sector exposure and sensitivity to the economic cycle; lower concentration does not ensure protection in a market decline.",
    []
  ],
  VEA: [
    "Developed ex-US core",
    "Provides diversified exposure to developed equity markets outside the United States, including Canada, Europe, Japan and the Pacific.",
    "Its geographic and sector mix differs from a US equity allocation. Combining it with regional funds can duplicate holdings.",
    []
  ],
  IEFA: [
    "Developed ex-US core",
    "Provides broad developed-market equity exposure outside the United States and Canada.",
    "Its holdings can overlap with European and other regional funds. The exclusion of Canada is one distinction from VEA.",
    []
  ],
  IWDA: [
    "Developed global core",
    "Tracks the MSCI World Index through a UCITS ETF, combining developed equity markets in one portfolio.",
    "Country weights are unequal, and the US allocation can overlap substantially with separate S&P 500 holdings.",
    []
  ],
  SWDA: [
    "Developed global core",
    "Provides accumulating UCITS exposure to the MSCI World Index, reinvesting income across a developed-market portfolio.",
    "It includes a substantial US allocation. Adding a separate US equity fund increases exposure to companies already held in the portfolio.",
    []
  ],
  VGK: [
    "European core",
    "Provides broad European equity exposure across companies and sectors.",
    "It can overlap with global and developed ex-US funds, and does not isolate themes such as defence, luxury or digital infrastructure.",
    []
  ],
  IEUR: [
    "European core",
    "Provides broad European equity exposure through an iShares ETF.",
    "It can form the regional component of a developed-market allocation, but overlaps with the European holdings of funds such as VEA and IEFA.",
    []
  ],
  FEZ: [
    "European core",
    "Tracks the EURO STOXX 50, a portfolio of large eurozone companies.",
    "Its narrower universe gives individual constituents greater influence than in a broad European fund and excludes European markets outside the eurozone.",
    []
  ],
  IMEU: [
    "European core",
    "Tracks MSCI Europe through a distributing UCITS share class, covering developed European equities.",
    "The share-class currency and the trading currency of a particular listing are separate characteristics. Its index coverage also differs from the eurozone-only universe of FEZ.",
    []
  ],
  VWO: [
    "Broad emerging markets",
    "Provides diversified emerging-market equity exposure, including China.",
    "Country and sector weights shape the risk profile. Adding country funds can increase existing concentrations, alongside currency, political and economic risks.",
    []
  ],
  IEMG: [
    "Broad emerging markets",
    "Provides emerging-market equity exposure across large, mid-sized and small companies, including China.",
    "Its coverage extends beyond the largest companies. An ex-China fund changes the country allocation rather than providing equivalent exposure.",
    []
  ],
  EIMI: [
    "Broad emerging markets",
    "Provides broad emerging-market equity exposure through a UCITS ETF.",
    "Diversification across countries does not eliminate country-specific risks. The share class and selected listing determine how income is handled and in which currency shares trade.",
    []
  ],
  EMXC: [
    "Emerging markets ex-China",
    "Provides emerging-market equity exposure excluding China.",
    "The exclusion raises the relative weights of other markets, including India and Taiwan. Economic links with China and geopolitical risks remain.",
    []
  ],
  EXCH: [
    "Emerging markets ex-China",
    "Provides emerging-market exposure excluding China through an accumulating UCITS ETF.",
    "Income is reinvested. Combining the fund with VWO, IEMG or EIMI creates overlapping holdings and changes the overall country mix.",
    []
  ],
  IB01: [
    "USD liquidity",
    "Holds US Treasuries with up to one year remaining to maturity through an accumulating UCITS share class.",
    "Short maturities limit interest-rate sensitivity relative to longer Treasury funds, although the share price can still fluctuate. Income is reinvested.",
    []
  ],
  IBTA: [
    "Short duration",
    "Holds US Treasuries in the 1–3 year maturity range through an accumulating UCITS share class.",
    "Returns combine reinvested income with price changes. Interest-rate sensitivity sits above Treasury bills and below longer-maturity Treasury exposure.",
    []
  ],
  CBU7: [
    "Short-intermediate duration",
    "Holds US Treasuries in the 3–7 year maturity range through an accumulating UCITS share class.",
    "Returns combine reinvested income with price movements: falling Treasury yields support bond prices, while rising yields can produce losses.",
    []
  ],
  IB7A: [
    "Intermediate duration",
    "Holds US Treasuries in the 7–10 year maturity range through an accumulating UCITS share class.",
    "This segment carries greater interest-rate sensitivity than short-term Treasuries. Returns reflect reinvested income and changes in the relevant yields.",
    []
  ],
  DTLA: [
    "Long duration",
    "Holds US Treasuries with more than 20 years remaining to maturity through an accumulating UCITS share class.",
    "Long duration makes prices highly sensitive to long-term yields. Government-bond holdings can therefore experience substantial price volatility even as income is reinvested.",
    []
  ],
  TI5A: [
    "Short inflation",
    "Holds US inflation-linked Treasuries with maturities of up to five years through an accumulating UCITS share class.",
    "Returns reflect inflation adjustments, reinvested income and real-yield movements. Shorter maturities reduce real-rate sensitivity relative to longer TIPS funds, but do not prevent losses.",
    []
  ],
  IDTP: [
    "Broad inflation",
    "Provides broad US inflation-linked Treasury exposure through an accumulating UCITS share class.",
    "The wider maturity range adds real-rate sensitivity compared with short-term TIPS. Inflation adjustments and reinvested income do not eliminate price losses when real yields rise.",
    []
  ],
  LQDA: [
    "USD investment-grade credit",
    "Holds US dollar-denominated investment-grade corporate bonds through an accumulating UCITS share class.",
    "Returns reflect reinvested income, Treasury yields, credit spreads and issuer financial strength. Corporate-credit exposure distinguishes it from a Treasury allocation.",
    []
  ],
  IHYA: [
    "USD high yield",
    "Holds high-yield corporate bonds through an accumulating UCITS share class.",
    "Reinvested income comes with greater default and recovery risk than investment-grade debt. Widening credit spreads can cause losses, especially when economic conditions weaken.",
    []
  ],
  AGGU: [
    "Global core bonds",
    "Combines global government and corporate bonds in a UCITS portfolio with USD currency hedging and income accumulation.",
    "Its global universe differs from AGG’s US-only allocation. Duration, credit composition and the currency hedge all affect returns.",
    []
  ],
  SGOV: [
    "USD liquidity",
    "Holds US Treasury bills with maturities of up to three months and distributes income monthly.",
    "Its very short maturity profile limits interest-rate sensitivity, although the fund’s market price can still vary.",
    []
  ],
  SHY: [
    "Short duration",
    "Holds US Treasuries with maturities of 1–3 years and distributes income monthly.",
    "It adds interest-rate exposure beyond Treasury bills, with less price sensitivity than intermediate- and long-maturity Treasury funds.",
    []
  ],
  IEI: [
    "Short-intermediate duration",
    "Holds US Treasuries with maturities of 3–7 years and distributes income monthly.",
    "Its intermediate maturity range brings greater price sensitivity to yield changes than shorter Treasury holdings.",
    []
  ],
  IEF: [
    "Intermediate duration",
    "Holds US Treasuries with maturities of 7–10 years and distributes income monthly.",
    "Returns depend on changes in medium-term yields as well as bond income, giving it a different risk profile from both Treasury bills and long-duration funds.",
    []
  ],
  TLT: [
    "Long duration",
    "Holds US Treasuries with more than 20 years remaining to maturity and distributes income monthly.",
    "Long duration creates substantial sensitivity to long-term yields, so prices can fluctuate sharply despite the government-bond holdings.",
    []
  ],
  STIP: [
    "Short inflation",
    "Holds US inflation-linked Treasuries with maturities of up to five years and distributes income monthly.",
    "Inflation adjustments contribute to returns, while real-yield changes affect prices. Its shorter maturity range limits duration relative to broad TIPS funds.",
    []
  ],
  TIP: [
    "Broad inflation",
    "Provides broad US inflation-linked Treasury exposure and distributes income monthly.",
    "It carries more duration than a short-maturity TIPS fund. Returns reflect inflation adjustments, bond income and changes in real yields.",
    []
  ],
  LQD: [
    "USD investment-grade credit",
    "Holds US dollar-denominated investment-grade corporate bonds and distributes income monthly.",
    "Both Treasury yields and credit spreads affect prices, adding corporate-credit risk to the portfolio’s duration exposure.",
    []
  ],
  HYG: [
    "USD high yield",
    "Holds US dollar-denominated below-investment-grade corporate bonds and distributes income monthly.",
    "Default risk and sensitivity to the credit cycle are greater than in investment-grade funds; its behaviour can be more cyclical than government-bond exposure.",
    []
  ],
  AGG: [
    "US core bonds",
    "Combines US Treasuries, agency mortgages and investment-grade corporate bonds, with monthly income distributions.",
    "It covers the US investment-grade bond market; AGGU instead has a global universe with USD currency hedging.",
    []
  ],
  GLD: [
    "Macro hedge",
    "SPDR Gold Shares.",
    "A highly liquid physical-gold ETF.",
    ["Functions as a real/monetary asset.", "Helps during confidence shocks and adverse regimes.", "Most useful when liquidity and depth matter."]
  ],
  IAU: [
    "Macro hedge",
    "iShares Gold Trust.",
    "A competitively priced physical-gold ETF.",
    ["An efficient alternative for holding gold exposure.", "Useful as a long-term macro diversifier.", "Less focused on heavy trading than GLD."]
  ],
  "FXF / CHF": [
    "Macro hedge",
    "Invesco CurrencyShares Swiss Franc Trust.",
    "Swiss-franc exposure against the US dollar.",
    ["A historical haven during confidence shocks.", "Low carry, lower liquidity than large ETFs and risk of SNB intervention.", "The dollar is the natural hedge against Brazil. The Swiss franc represents monetary quality; gold is a regime hedge."]
  ]
};

const SATELLITE_FILTERS = {
  zone: [
    ["all", "All"],
    ["resolve", "ETF fits"],
    ["partial", "Partial ETF"],
    ["basket", "Basket required"],
  ],
  aggression: [
    ["all", "All"],
    ["high", "High convexity"],
    ["medium", "Medium convexity"],
    ["defensive", "Defensive"],
  ],
  motor: [
    ["all", "All"],
    ["ai", "AI hardware"],
    ["energy", "Energy & grid"],
    ["defense", "Defence"],
    ["cyber", "Cyber"],
    ["industry", "Reindustrialisation"],
    ["housing", "Housing"],
    ["demography", "Demographics"],
  ],
  vehicle: [
    ["all", "All"],
    ["etf", "ETF"],
    ["hybrid", "ETF + basket"],
    ["basket", "Basket"],
  ],
};

const SATELLITES = [
  {
    theme: "Semiconductors / AI hardware",
    icon: "chip",
    zone: "resolve",
    aggression: "high",
    motor: "ai",
    vehicle: "hybrid",
    etfs: "SMH / SOXX",
    quality: "High",
    implementation: "ETF + basket",
    reading: "Semiconductor companies supply the hardware used in AI systems, while their earnings remain sensitive to investment cycles.",
    names: ["Nvidia", "TSMC", "Broadcom", "ASML", "AMD"],
    extraTitle: "Strategic companies outside the ETF",
    extraCompanies: ["Samsung Electronics: HBM, DRAM and NAND memory.", "SK Hynix: a leader in HBM for AI.", "Tokyo Electron: chip-manufacturing equipment.", "Advantest: advanced-chip testing."],
    points: ["The ETFs provide exposure to several parts of the semiconductor value chain, with different weights across companies.", "Valuation and the semiconductor cycle need to be monitored."]
  },
  {
    theme: "US defence",
    icon: "shield",
    zone: "resolve",
    aggression: "medium",
    motor: "defense",
    vehicle: "etf",
    etfs: "ITA / PPA",
    quality: "High",
    implementation: "ETF",
    reading: "Geopolitics, public budgets and dual-use technology support structural demand.",
    names: ["Lockheed Martin", "RTX", "Northrop Grumman", "General Dynamics"],
    points: ["The ETFs provide exposure to major US aerospace and defence contractors.", "Government demand reduces dependence on consumers."]
  },
  {
    theme: "Cybersecurity",
    icon: "network",
    zone: "resolve",
    aggression: "medium",
    motor: "cyber",
    vehicle: "etf",
    etfs: "CIBR / HACK",
    quality: "Medium/high",
    implementation: "ETF",
    reading: "Cybersecurity demand is supported by recurring protection needs, although spending and valuations still vary across companies.",
    names: ["Palo Alto", "CrowdStrike", "Fortinet", "Zscaler"],
    points: ["The ETF represents the theme, but its composition should be monitored.", "The risks depend on software demand, competition and execution rather than on a single technological breakthrough."]
  },
  {
    theme: "Robotics / automation",
    icon: "robotics",
    zone: "partial",
    aggression: "high",
    motor: "industry",
    vehicle: "hybrid",
    etfs: "BOTZ / ROBO",
    quality: "Medium",
    implementation: "ETF + basket",
    reading: "Robotics and automation ETFs combine companies whose demand, customers and investment cycles can differ substantially.",
    names: ["Rockwell", "ABB", "Fanuc", "Teradyne"],
    points: ["An ETF provides a broad starting universe for examining robotics and automation exposure.", "A selected equity basket can distinguish industrial automation from other businesses included in the ETFs.", "Industrial automation is a relevant subtheme of reindustrialisation."]
  },
  {
    theme: "Energy / grid",
    icon: "energy",
    zone: "partial",
    aggression: "medium",
    motor: "energy",
    vehicle: "hybrid",
    etfs: "XLE / GRID / PAVE / XLU",
    quality: "Partial",
    implementation: "ETF + basket",
    reading: "The thesis is electrification, transmission and equipment, not only traditional energy.",
    names: ["Eaton", "Hubbell", "Quanta Services", "Constellation", "NextEra"],
    points: ["A broad fund may include businesses whose revenues are only partly linked to grid investment.", "Selecting individual companies can distinguish utility operations from equipment manufacturing and engineering services.", "Data-centre development depends on available power and grid connections, which can constrain project delivery."]
  },
  {
    theme: "Infrastructure / utilities",
    icon: "grid",
    zone: "partial",
    aggression: "defensive",
    motor: "energy",
    vehicle: "hybrid",
    etfs: "XLU / PAVE / GRID",
    quality: "Medium",
    implementation: "ETF + basket",
    reading: "The theme combines essential-service demand with investment in physical infrastructure and exposure to regulation.",
    names: ["Duke Energy", "Southern Company", "NextEra", "Quanta Services"],
    points: ["Higher interest rates can affect financing costs and the valuation of long-lived assets.", "A broad ETF combines a defensive profile with interest-rate sensitivity."]
  },
  {
    theme: "Residential construction",
    icon: "home",
    zone: "resolve",
    aggression: "medium",
    motor: "housing",
    vehicle: "etf",
    etfs: "ITB / XHB",
    quality: "High",
    implementation: "ETF",
    reading: "The theme examines how constraints on housing supply, land and construction capacity affect homebuilders.",
    names: ["D.R. Horton", "Lennar", "PulteGroup", "NVR"],
    points: ["Housing demand is structural but interest-rate sensitive.", "The ETF helps capture the homebuilder cycle.", "The thesis strengthens when new supply remains constrained."]
  },
  {
    theme: "Construction materials and infrastructure",
    icon: "factory",
    zone: "resolve",
    aggression: "medium",
    motor: "housing",
    vehicle: "etf",
    etfs: "PKB",
    quality: "Medium/high",
    implementation: "ETF",
    reading: "These businesses supply materials, equipment and services used in housing and infrastructure construction.",
    names: ["Builders FirstSource", "Vulcan Materials", "Martin Marietta", "Masco"],
    points: ["Demand reflects construction activity and can weaken even when long-term infrastructure needs remain."]
  },
  {
    theme: "Senior care",
    icon: "home",
    zone: "basket",
    aggression: "defensive",
    motor: "demography",
    vehicle: "basket",
    etfs: "No pure-play ETF",
    quality: "Low",
    implementation: "Basket",
    reading: "Ageing increases demand for assisted living, nursing and long-term care services.",
    names: ["Brookdale Senior Living", "The Ensign Group", "Option Care Health"],
    points: ["Supply grows slowly because of labour constraints and regulation.", "A selected equity basket can focus on care providers, but leaves greater exposure to individual companies."]
  },
  {
    theme: "Pharmaceutical distribution",
    icon: "pulse",
    zone: "basket",
    aggression: "defensive",
    motor: "demography",
    vehicle: "basket",
    etfs: "No clean ETF",
    quality: "Low",
    implementation: "Equity basket",
    reading: "Pharmaceutical distributors connect medicine manufacturers with pharmacies and healthcare providers in a concentrated US market.",
    names: ["McKesson", "Cencora", "Cardinal Health"],
    points: ["The business model combines recurring distribution activity with large-scale logistics networks.", "Population ageing and medicine use influence the long-term demand for distribution services.", "Risks include thin margins, regulatory pressure, reimbursement-system changes and customer concentration."]
  },
  {
    theme: "Physical data centres",
    icon: "server",
    zone: "basket",
    aggression: "high",
    motor: "ai",
    vehicle: "basket",
    etfs: "SRVR / VPN / proxies",
    quality: "Low",
    implementation: "Basket",
    reading: "The ETFs listed here cover only parts of the power, cooling, equipment and networking value chain.",
    names: ["Vertiv", "Eaton", "Schneider", "Equinix", "Digital Realty", "Arista", "Broadcom"],
    points: ["A selected equity basket can target parts of that value chain that the listed ETFs cover only partially."]
  },
  {
    theme: "Onshoring / reindustrialisation",
    icon: "factory",
    zone: "basket",
    aggression: "medium",
    motor: "industry",
    vehicle: "basket",
    etfs: "XLI / AIRR",
    quality: "Partial",
    implementation: "Basket",
    reading: "Broad industrial funds include businesses with varying exposure to domestic manufacturing investment.",
    names: ["Rockwell", "Emerson", "Honeywell", "Caterpillar", "Nucor", "Union Pacific"],
    points: ["Automation, transport, steel and capital-goods companies participate in different stages of the investment cycle.", "Existing index weights need not match the businesses that receive future manufacturing investment.", "A selected basket can target particular activities, with greater dependence on company selection."]
  },
  {
    theme: "Quantum / frontier computing",
    icon: "atom",
    zone: "basket",
    aggression: "high",
    motor: "ai",
    vehicle: "basket",
    etfs: "QTUM / baskets",
    quality: "Low/medium",
    implementation: "Small basket",
    reading: "Commercial outcomes remain uncertain, and companies can follow very different development paths.",
    names: ["IBM", "IonQ", "Rigetti", "D-Wave", "Microsoft"],
    points: ["An ETF may include companies with little exposure to the actual driver."]
  }
];

function SatelliteIcon({ type }) {
  const iconProps = { viewBox: "0 0 24 24", fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };
  const path = (d) => React.createElement("path", { d, key: d });
  const line = (x1, y1, x2, y2) => React.createElement("line", { x1, y1, x2, y2, key: `${x1}-${y1}-${x2}-${y2}` });
  const circle = (cx, cy, r) => React.createElement("circle", { cx, cy, r, key: `${cx}-${cy}-${r}` });
  const rect = (x, y, width, height, rx = 2) => React.createElement("rect", { x, y, width, height, rx, key: `${x}-${y}-${width}-${height}` });

  const shapes = {
    chip: [
      rect(7, 7, 10, 10, 2),
      line(4, 9, 7, 9),
      line(4, 15, 7, 15),
      line(17, 9, 20, 9),
      line(17, 15, 20, 15),
      line(9, 4, 9, 7),
      line(15, 4, 15, 7),
      line(9, 17, 9, 20),
      line(15, 17, 15, 20),
    ],
    shield: [path("M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3z"), path("M9 12l2 2 4-5")],
    network: [circle(7, 8, 2), circle(17, 8, 2), circle(12, 17, 2), line(9, 9, 15, 9), line(8, 10, 11, 15), line(16, 10, 13, 15)],
    phone: [rect(8, 3, 8, 18, 2), line(10, 6, 14, 6), circle(12, 18, 0.7), path("M18 8c1.5 2.5 1.5 5.5 0 8"), path("M6 8c-1.5 2.5-1.5 5.5 0 8")],
    robotics: [path("M5 18h8"), path("M8 18v-5l4-4 3 3-4 4"), circle(16, 7, 2), path("M14 19l4-4"), path("M18 15l2 2")],
    energy: [path("M13 2L5 14h6l-1 8 8-12h-6l1-8z")],
    oil: [path("M5 20h14"), path("M8 20V8l4-4 4 4v12"), path("M8 10h8"), path("M10 20v-7h4v7"), path("M16 9l4 2v5"), circle(20, 17, 1.3)],
    grid: [path("M12 3l7 18H5l7-18z"), line(8, 13, 16, 13), line(9.5, 17, 14.5, 17), line(12, 3, 12, 21)],
    faucet: [path("M9 6h8a3 3 0 013 3v1"), path("M4 10h13"), path("M7 10v7"), path("M5 17h4"), path("M15 10v3"), path("M17 16c0 1.2-.8 2-2 2s-2-.8-2-2c0-1.4 2-3.5 2-3.5s2 2.1 2 3.5z"), path("M10 6V4h4v2")],
    server: [rect(5, 5, 14, 5, 1), rect(5, 14, 14, 5, 1), circle(8, 7.5, 0.7), circle(8, 16.5, 0.7), line(11, 7.5, 16, 7.5), line(11, 16.5, 16, 16.5)],
    factory: [path("M4 20V9l5 3V9l5 3V5h6v15H4z"), line(7, 16, 7, 16), line(11, 16, 11, 16), line(15, 16, 15, 16)],
    home: [path("M4 11l8-7 8 7"), path("M6 10v10h12V10"), path("M10 20v-6h4v6")],
    book: [path("M5 5.5A3.5 3.5 0 018.5 2H20v17H8.5A3.5 3.5 0 005 22V5.5z"), path("M5 5.5A3.5 3.5 0 018.5 9H20")],
    diamond: [path("M6 4h12l3 5-9 11L3 9l3-5z"), path("M3 9h18"), path("M8 4l4 16 4-16")],
    money: [rect(4, 6, 16, 12, 2), circle(12, 12, 3), path("M8 9h.01"), path("M16 15h.01"), path("M12 9v6"), path("M10.5 10.5c.6-.7 2.4-.7 3 0"), path("M10.5 13.5c.6.7 2.4.7 3 0")],
    pulse: [path("M20 12h-4l-2 5-4-10-2 5H4"), path("M12 21C7 17.5 4 14.5 4 10a4 4 0 017-2.6A4 4 0 0118 10c0 4.5-3 7.5-6 11z")],
    atom: [circle(12, 12, 1.5), React.createElement("ellipse", { cx: 12, cy: 12, rx: 8, ry: 3.2, key: "e1" }), React.createElement("ellipse", { cx: 12, cy: 12, rx: 8, ry: 3.2, transform: "rotate(60 12 12)", key: "e2" }), React.createElement("ellipse", { cx: 12, cy: 12, rx: 8, ry: 3.2, transform: "rotate(120 12 12)", key: "e3" })],
  };

  return React.createElement("span", { className: "satellite-icon" }, React.createElement("svg", iconProps, shapes[type] || shapes.chip));
}

function SatelliteModule({ initialTheme = "Semiconductors / AI hardware" } = {}) {
  const riskOrder = { high: 0, medium: 1, defensive: 2 };
  const [filters, setFilters] = useState({ aggression: "all", motor: "all" });
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);
  const filtered = SATELLITES.filter((item) =>
    Object.entries(filters).every(([key, value]) => value === "all" || item[key] === value)
  ).sort((a, b) => riskOrder[a.aggression] - riskOrder[b.aggression] || a.theme.localeCompare(b.theme, "pt-BR"));
  const active = filtered.find((item) => item.theme === selectedTheme) || filtered[0] || SATELLITES[0];

  const filterRow = (key, label, extraClass = "") =>
    React.createElement(
      "div",
      { className: `filter-row ${extraClass}`.trim(), key },
      React.createElement("span", { className: "filter-label" }, label),
      SATELLITE_FILTERS[key].map(([value, text]) =>
        React.createElement(
          "button",
          {
            className: "filter-chip",
            type: "button",
            key: value,
            "aria-pressed": filters[key] === value,
            onClick: () => setFilters({ ...filters, [key]: value }),
          },
          text
        )
      )
    );

  return React.createElement(
    "main",
    { className: "satellite-layout" },
    React.createElement(
      "article",
      { className: "panel" },
      React.createElement("div", { className: "section-head" }, React.createElement("div", null, React.createElement("span", { className: "control-title" }, "Thematic satellites"))),
      React.createElement(
        "div",
        { className: "satellite-filters" },
        filterRow("aggression", "Convexity"),
        filterRow("motor", "Driver", "satellite-mobile-hide"),
        React.createElement(
          "div",
          { className: "risk-legend" },
          React.createElement("span", { className: "sat-risk-high" }, "High convexity"),
          React.createElement("span", { className: "sat-risk-medium" }, "Medium convexity"),
          React.createElement("span", { className: "sat-risk-defensive" }, "Defensive")
        )
      ),
      React.createElement(
        "div",
        { className: "satellite-grid" },
        filtered.map((item) =>
          React.createElement(
            "button",
            { className: `satellite-card sat-risk-${item.aggression}`, type: "button", key: item.theme, "aria-pressed": active.theme === item.theme, onClick: () => { setSelectedTheme(item.theme); scrollToMobileDetail(".satellite-detail h2"); } },
            React.createElement(
              "div",
              null,
              React.createElement("div", { className: "satellite-title-row" }, React.createElement(SatelliteIcon, { type: item.icon }), React.createElement("h3", null, item.theme)),
              React.createElement("p", null, item.reading)
            )
          )
        )
      )
    ),
    React.createElement(
      "aside",
      { className: "panel satellite-detail" },
      React.createElement("div", { className: `satellite-detail-head sat-risk-${active.aggression}` }, React.createElement(SatelliteIcon, { type: active.icon }), React.createElement("h2", null, active.theme)),
      React.createElement(EtfFullNames, { instruments: active.etfs || active.instruments }),
      React.createElement(EtfTradingDetails, { instruments: active.etfs || active.instruments }),
      React.createElement(
        "div",
        { className: "detail-grid" },
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Possible ETF"), React.createElement("strong", null, active.etfs)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Alternative"), React.createElement("strong", null, active.implementation)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "ETF quality"), React.createElement("strong", null, active.quality))
      ),
      active.reading ? React.createElement("p", null, active.reading) : null,
      active.theme === "Direct China" ? React.createElement("ul", { className: "satellite-list" }, active.points.map((point) => React.createElement("li", { key: point }, point))) : React.createElement("p", null, active.points.join(" ")),
      active.extraCompanies
        ? React.createElement(
            "div",
            { className: "detail-box proxy-box" },
            React.createElement("span", null, active.extraTitle),
            React.createElement("ul", { className: "satellite-list" }, active.extraCompanies.map((point) => React.createElement("li", { key: point }, point)))
          )
        : null,
      React.createElement("div", { className: "detail-box proxy-box" }, React.createElement("span", null, "Examples"), React.createElement("strong", null, active.names.join(" · "))),
      React.createElement("p", { className: "data-note" }, "Source: sector examples and proxies, June 2026. Non-exhaustive list.")
    )
  );
}
const EUROPE_THEMES = [
  {
    theme: "European defence",
    icon: "shield",
    status: "No",
    quality: "No ETF available",
    tone: "sat-risk-high",
    implementation: "Basket",
    etfs: "A broad European ETF dilutes the thesis",
    tag: "No clean ETF",
    why: "Demand is linked to defence spending, NATO commitments and efforts to strengthen military capabilities.",
    thesis: "European defence exposure is spread across countries and contractors whose revenues depend on different procurement programmes.",
    names: ["Rheinmetall", "BAE Systems", "Leonardo", "Saab", "Thales", "Dassault Aviation", "Airbus", "Safran", "Rolls-Royce", "Hensoldt", "Kongsberg", "Indra"],
    points: ["A broad ETF dilutes defence exposure.", "A selected equity basket can focus on national defence contractors and their specific business activities."]
  },
  {
    theme: "Digital sovereignty",
    icon: "network",
    status: "No",
    quality: "No ETF available",
    tone: "sat-risk-high",
    implementation: "Basket",
    etfs: "No clean ETF for the thesis",
    tag: "No clean ETF",
    why: "The theme covers local cloud services, telecommunications, software, cybersecurity and data infrastructure.",
    thesis: "The theme examines European control over digital infrastructure, software and security, including the role of regulation and local providers.",
    names: ["SAP", "OVHcloud", "Deutsche Telekom", "Orange", "Telefónica", "Capgemini", "Dassault Systèmes", "Sopra Steria", "Thales", "Schneider", "Siemens", "Legrand"],
    points: ["The theme centres on control over data and digital infrastructure rather than an assumption of rapid revenue growth.", "Regulatory requirements influence demand for local infrastructure, software and security services.", "Holding several companies spreads company-specific exposure, although it does not remove sector risk."]
  },
  {
    theme: "Luxury / indirect China",
    icon: "diamond",
    status: "Partial",
    quality: "Partial ETF",
    tone: "sat-risk-medium",
    implementation: "Basket",
    etfs: "LUXU / GLUX (UCITS) for simple exposure; LUXY as a US-listed alternative",
    tag: "LUXU / GLUX",
    why: "Luxury businesses connect brand pricing power with demand from consumers in Asia and other markets.",
    thesis: "European luxury companies differ in brand strength, product mix and customer exposure. A sector ETF combines these businesses, while a selected basket focuses on particular brands.",
    names: ["LVMH", "Hermès", "Ferrari", "Richemont", "Moncler", "Prada", "Kering", "L’Oréal", "EssilorLuxottica", "Pernod Ricard"],
    points: ["Selecting individual holdings changes the mix of brands and increases the importance of company analysis."]
  },
  {
    theme: "Pharma / healthcare",
    icon: "pulse",
    status: "Partial",
    quality: "Partial ETF",
    tone: "sat-risk-defensive",
    implementation: "Basket or sector ETF",
    etfs: "EXV4 / XDWH / global healthcare as a first layer; a basket improves precision",
    tag: "EXV4 / XDWH",
    why: "The theme combines relatively stable healthcare demand with research-driven products and revenue from multiple markets.",
    thesis: "European pharma combines research, global scale and lower dependence on the economic cycle.",
    names: ["Novo Nordisk", "Roche", "Novartis", "AstraZeneca", "Sanofi", "GSK", "Merck KGaA", "Lonza", "Genmab", "UCB"],
    points: ["These characteristics can reduce cyclicality, although company-specific and regulatory risks remain."]
  },
  {
    theme: "Electrification / industrials",
    icon: "energy",
    status: "Partial",
    quality: "Partial ETF",
    tone: "sat-risk-high",
    implementation: "Basket",
    etfs: "GRID / PAVE / a European industrial ETF as a first layer",
    tag: "GRID / PAVE",
    why: "The theme focuses on companies that supply grids, industrial automation and electrical equipment.",
    thesis: "Europe has leaders in electrical equipment, automation and critical components for infrastructure, AI and data centres.",
    names: ["Schneider Electric", "Siemens", "ABB", "Legrand", "Prysmian", "Assa Abloy", "Atlas Copco", "Sandvik", "Infineon", "STMicroelectronics", "ASML"],
    points: ["A broad industrial ETF includes businesses with different levels of exposure to electrification.", "A selected basket can focus specifically on equipment and automation suppliers."]
  },
  {
    theme: "European semiconductors",
    icon: "chip",
    status: "Partial",
    quality: "Partial ETF",
    tone: "sat-risk-high",
    implementation: "Basket",
    etfs: "SMH / SOXX as global proxies; a basket for pure European exposure",
    tag: "SMH / SOXX",
    why: "The theme covers semiconductor equipment and specialist chip businesses, including power semiconductors.",
    thesis: "Europe does not dominate the entire chain, but it controls critical elements in equipment, analogue and power semiconductors.",
    names: ["ASML", "Infineon", "STMicroelectronics", "ASM International", "BE Semiconductor", "Soitec"],
    points: ["ASML provides specialised exposure to semiconductor manufacturing equipment.", "A small number of companies account for much of the exposure to this theme.", "A selected equity basket can focus on these companies instead of including unrelated businesses."]
  }
];

function EuropeModule({ initialTheme = "European defence" } = {}) {
  const legendOrder = { "sat-risk-high": 0, "sat-risk-defensive": 1, "sat-risk-medium": 2 };
  const sortedThemes = [...EUROPE_THEMES].sort((a, b) => legendOrder[a.tone] - legendOrder[b.tone] || a.theme.localeCompare(b.theme, "pt-BR"));
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);
  const active = EUROPE_THEMES.find((item) => item.theme === selectedTheme) || EUROPE_THEMES[0];

  return React.createElement(
    "main",
    { className: "satellite-layout" },
    React.createElement(
      "article",
      { className: "panel" },
      React.createElement(
        "div",
        { className: "risk-legend", style: { padding: "14px 16px 0" } },
        React.createElement("span", { className: "sat-risk-high" }, "Local growth strategy"),
        React.createElement("span", { className: "sat-risk-defensive" }, "Defensive theme"),
        React.createElement("span", { className: "sat-risk-medium" }, "China exposure")
      ),
      React.createElement(
        "div",
        { className: "satellite-grid", style: { paddingTop: 16 } },
        sortedThemes.map((item) =>
          React.createElement(
            "button",
            { className: `satellite-card ${item.tone}`, type: "button", key: item.theme, "aria-pressed": active.theme === item.theme, onClick: () => { setSelectedTheme(item.theme); scrollToMobileDetail(".satellite-detail h2"); } },
            React.createElement(
              "div",
              null,
              React.createElement("div", { className: "satellite-title-row" }, React.createElement(SatelliteIcon, { type: item.icon }), React.createElement("h3", null, item.theme)),
              React.createElement("p", null, item.why)
            )
          )
        )
      )
    ),
    React.createElement(
      "aside",
      { className: "panel satellite-detail" },
      React.createElement("div", { className: `satellite-detail-head ${active.tone}` }, React.createElement(SatelliteIcon, { type: active.icon }), React.createElement("h2", null, active.theme)),
      React.createElement(EtfFullNames, { instruments: active.etfs }),
      React.createElement(EtfTradingDetails, { instruments: active.etfs }),
      React.createElement(
        "div",
        { className: "detail-grid" },
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Broad ETF"), React.createElement("strong", null, active.status)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Alternative"), React.createElement("strong", null, active.implementation)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Vehicle assessment"), React.createElement("strong", null, active.quality)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "First layer"), React.createElement("strong", null, active.etfs))
      ),
      React.createElement("p", null, active.thesis),
      active.theme === "Direct China" ? React.createElement("ul", { className: "satellite-list" }, active.points.map((point) => React.createElement("li", { key: point }, point))) : React.createElement("p", null, active.points.join(" ")),
      React.createElement("div", { className: "detail-box proxy-box" }, React.createElement("span", null, "Examples"), React.createElement("strong", null, active.names.join(" · "))),
      React.createElement("p", { className: "data-note" }, "Source: ETF examples and proxies, June 2026. Non-exhaustive list.")
    )
  );
}

const CHINA_FILTERS = {
  channel: [
    ["all", "All"],
    ["direct", "Direct China"],
    ["indirect", "Indirect China"],
    ["china1", "China+1"],
  ],
  motor: [
    ["all", "All"],
    ["market", "Market"],
    ["consumer", "Consumer"],
    ["physical", "Physical demand"],
    ["technology", "Technology"],
    ["chain", "Supply chain"],
  ],
};

const CHINA_CHANNELS = [
  {
    theme: "Direct China",
    icon: "network",
    channel: "direct",
    motor: "market",
    tone: "sat-risk-high",
    instruments: "MCHI, FXI, KWEB, ASHR, KBA",
    captures: "The funds provide different combinations of Chinese equities, including internet companies and onshore A-shares.",
    risk: "Risks include corporate governance, state intervention, geopolitical developments, variable-interest-entity structures and deflationary pressure.",
    reading: "",
    points: ["MCHI provides broad China exposure.", "FXI concentrates on large caps and Hong Kong.", "KWEB provides exposure to Chinese internet companies.", "ASHR/KBA provide exposure to onshore A-shares."],
    names: ["Alibaba", "Tencent", "PDD", "Baidu", "A-shares", "large caps Hong Kong"]
  },
  {
    theme: "Indirect China — luxury",
    icon: "diamond",
    channel: "indirect",
    motor: "consumer",
    tone: "sat-risk-medium",
    instruments: "LVMH, Hermès, Ferrari, Richemont, Moncler, Prada, L'Oréal",
    captures: "Premium Chinese consumers and Asian demand without directly buying Chinese equities.",
    risk: "The Chinese consumption cycle, tourism, confidence and slowing income growth.",
    reading: "Global luxury companies provide indirect exposure to Asian consumers while retaining company-specific, valuation and demand risks.",
    points: ["The theme focuses on global brands whose profitability depends partly on pricing power.", "The holdings provide indirect exposure to Chinese demand, with different legal and political risks from Chinese-listed companies.", "A luxury-sector ETF provides broad exposure, while a selected basket can focus on specific brands."],
    names: ["LVMH", "Hermès", "Ferrari", "Richemont", "Moncler", "Prada", "L'Oréal", "EssilorLuxottica"]
  },
  {
    theme: "Indirect China — commodities",
    icon: "energy",
    channel: "indirect",
    motor: "physical",
    tone: "sat-risk-medium",
    instruments: "BHP, Rio Tinto, Freeport, Glencore, Vale, COPX, PICK",
    captures: "The holdings are exposed to Chinese demand for industrial materials and infrastructure inputs.",
    risk: "Returns depend on industrial activity, construction demand, government stimulus and changes in commodity prices.",
    reading: "",
    points: ["Producer earnings also depend on operating costs and company execution, so these equity funds differ from direct commodity exposure."],
    names: ["BHP", "Rio Tinto", "Freeport-McMoRan", "Glencore", "Vale", "COPX", "PICK"]
  },
  {
    theme: "Indirect China — technology",
    icon: "chip",
    channel: "indirect",
    motor: "technology",
    tone: "sat-risk-high",
    instruments: "ASML, TSMC, Applied Materials, Lam, KLA, Nvidia, Broadcom",
    captures: "The companies supply technology and equipment within global value chains that include Chinese demand.",
    risk: "Sanctions, export controls and tensions involving Taiwan can affect sales and supply-chain access.",
    reading: "The theme combines technology demand with substantial exposure to export policy and geopolitical developments.",
    points: ["The theme focuses on specialised semiconductor and equipment suppliers within the technology value chain.", "Company revenues also depend on business investment and demand from other markets.", "Export controls can change the thesis quickly."],
    names: ["ASML", "TSMC", "Applied Materials", "Lam Research", "KLA", "Nvidia", "Broadcom"]
  },
  {
    theme: "China+1",
    icon: "factory",
    channel: "china1",
    motor: "chain",
    tone: "sat-risk-defensive",
    instruments: "INDA, FLIN, EWW, VNM, EWT, EWY",
    captures: "The theme examines countries that participate in supply-chain diversification and the relocation of production.",
    risk: "Outcomes depend on valuations and on each country’s infrastructure, execution and institutional capacity.",
    reading: "",
    points: ["India combines a domestic market, services and demographic scale.", "Mexico is exposed to manufacturing investment linked to proximity to the US market.", "Vietnam and other Southeast Asian economies participate in the diversification of manufacturing locations."],
    names: ["India", "Mexico", "Vietnam", "Indonesia", "Taiwan", "South Korea"]
  },
  {
    theme: "EM ex-China",
    icon: "grid",
    channel: "china1",
    motor: "chain",
    tone: "sat-risk-defensive",
    instruments: "EMXC / EXCH",
    captures: "The funds provide emerging-market equity exposure while excluding direct Chinese equity holdings.",
    risk: "The funds do not directly participate in Chinese equity gains and may not isolate particular supply-chain themes.",
    reading: "",
    points: ["The remaining holdings retain economic links with China. Excluding Chinese equities changes geopolitical exposure rather than eliminating it."],
    names: ["India", "Taiwan", "South Korea", "Brazil", "Mexico", "Southeast Asia"]
  }
];

function ChinaModule({ initialTheme = "Direct China" } = {}) {
  const [filters, setFilters] = useState({ channel: "all", motor: "all" });
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);
  const order = { direct: 0, indirect: 1, china1: 2 };
  const filtered = CHINA_CHANNELS.filter((item) =>
    Object.entries(filters).every(([key, value]) => value === "all" || item[key] === value)
  ).sort((a, b) => order[a.channel] - order[b.channel] || a.theme.localeCompare(b.theme, "pt-BR"));
  const active = filtered.find((item) => item.theme === selectedTheme) || filtered[0] || CHINA_CHANNELS[0];

  const filterRow = (key, label, extraClass = "") =>
    React.createElement(
      "div",
      { className: `filter-row ${extraClass}`.trim(), key },
      React.createElement("span", { className: "filter-label" }, label),
      CHINA_FILTERS[key].map(([value, text]) =>
        React.createElement(
          "button",
          {
            className: "filter-chip",
            type: "button",
            key: value,
            "aria-pressed": filters[key] === value,
            onClick: () => setFilters({ ...filters, [key]: value }),
          },
          text
        )
      )
    );

  return React.createElement(
    "main",
    { className: "satellite-layout" },
    React.createElement(
      "article",
      { className: "panel" },
      React.createElement(
        "div",
        { className: "section-head" },
        React.createElement("div", null, React.createElement("span", { className: "control-title" }, "Exposure matrix"), React.createElement("h2", null, "Direct, indirect or partial substitute"))
      ),
      React.createElement(
        "div",
        { className: "satellite-filters" },
        filterRow("channel", "Channel", "satellite-mobile-hide"),
        filterRow("motor", "Driver", "satellite-mobile-hide"),
        React.createElement(
          "div",
          { className: "risk-legend" },
          React.createElement("span", { className: "sat-risk-high" }, "Direct geopolitical risk"),
          React.createElement("span", { className: "sat-risk-medium" }, "Indirect Chinese demand"),
          React.createElement("span", { className: "sat-risk-defensive" }, "China+1 / reduced dependence")
        )
      ),
      React.createElement(
        "div",
        { className: "satellite-grid" },
        filtered.map((item) =>
          React.createElement(
            "button",
            { className: `satellite-card ${item.tone}`, type: "button", key: item.theme, "aria-pressed": active.theme === item.theme, onClick: () => { setSelectedTheme(item.theme); scrollToMobileDetail(".satellite-detail h2"); } },
            React.createElement(
              "div",
              null,
              React.createElement("div", { className: "satellite-title-row" }, React.createElement(SatelliteIcon, { type: item.icon }), React.createElement("h3", null, item.theme))
            )
          )
        )
      )
    ),
    React.createElement(
      "aside",
      { className: "panel satellite-detail" },
      React.createElement("div", { className: `satellite-detail-head ${active.tone}` }, React.createElement(SatelliteIcon, { type: active.icon }), React.createElement("h2", null, active.theme)),
      React.createElement(EtfFullNames, { instruments: active.etfs || active.instruments }),
      React.createElement(EtfTradingDetails, { instruments: active.etfs || active.instruments }),
      React.createElement(
        "div",
        { className: "detail-grid" },
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Instruments"), React.createElement("strong", null, active.instruments)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Exposure captured"), React.createElement("strong", null, active.captures)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Main risk"), React.createElement("strong", null, active.risk))
      ),
      active.reading ? React.createElement("p", null, active.reading) : null,
      active.theme === "Direct China" ? React.createElement("ul", { className: "satellite-list" }, active.points.map((point) => React.createElement("li", { key: point }, point))) : React.createElement("p", null, active.points.join(" ")),
      React.createElement("div", { className: "detail-box proxy-box" }, React.createElement("span", null, "Examples"), React.createElement("strong", null, active.names.join(" · "))),
      React.createElement("p", { className: "data-note" }, "Source: channel and instrument examples, June 2026. Holdings should be checked with the provider.")
    )
  );
}

const HEDGE_FILTERS = {
  objective: [
    ["all", "All"],
    ["income", "Income"],
    ["beta", "Beta"],
    ["stress", "Stress"],
    ["payoff", "Payoff"],
  ],
};

const HEDGE_IDEAS = [
  {
    "id": "covered-call-overlay",
    "name": "Covered Call",
    "sections": [
      [
        "What it does",
        [
          "Generates additional income by selling call options against an existing equity position."
        ]
      ],
      [
        "Example",
        [
          "Long SPY + Short SPY Call"
        ]
      ],
      [
        "Strike notation (K)",
        [
          "K_call is the strike price of the call option sold against the SPY position. A strike is the agreed price at which the option can be exercised; it is not the option premium."
        ]
      ],
      [
        "Objective",
        [
          "Earn option premium while keeping equity exposure, in exchange for giving up part of the upside if the market rises strongly."
        ]
      ],
      [
        "How it works",
        [
          "The investor holds SPY and sells a call option on SPY.",
          "If SPY stays below the call strike, the investor keeps the option premium.",
          "If SPY rises above the strike, gains on the SPY position are increasingly offset by losses on the short call, so the portfolio\u2019s upside becomes capped.",
          "The premium received also provides a small cushion against market declines."
        ]
      ],
      [
        "Typical use",
        [
          "Useful when the investor expects the market to be stable, moderately bullish or range-bound and wants to generate additional income from an existing equity position."
        ]
      ],
      [
        "Trade-off",
        [
          "The premium provides only limited downside protection, while the short call limits gains in a strong market rally."
        ]
      ],
      [
        "Key Decisions",
        [
          "Call Strike \u00b7 Expiration \u00b7 Hedge Ratio \u00b7 Premium Target \u00b7 Roll Frequency..."
        ]
      ]
    ],
    "alt": "Supplied illustration of SPY and a covered call overlay at expiration, with gains capped above the call strike.",
    "width": 1448,
    "height": 1086,
    "title": "COVERED CALL OVERLAY"
  },
  {
    "id": "protective-put",
    "name": "Protective Put",
    "sections": [
      [
        "What it does",
        [
          "Adds explicit downside protection to an existing equity position through the purchase of put options."
        ]
      ],
      [
        "Example",
        [
          "Long SPY + Long SPY Put"
        ]
      ],
      [
        "Strike notation (K)",
        [
          "K is the strike price of the purchased put option. A strike is the agreed price at which the option can be exercised; it is not the option premium."
        ]
      ],
      [
        "Objective",
        [
          "Protect an equity portfolio against a significant market decline while preserving participation in market upside."
        ]
      ],
      [
        "How it works",
        [
          "The investor holds SPY and purchases a put option with a selected strike price and expiration. If SPY falls below the strike, gains on the put increasingly offset losses on the underlying position, creating a downside floor.",
          "If SPY rises, the investor continues to participate in the upside, less the premium paid for the put."
        ]
      ],
      [
        "Typical use",
        [
          "Portfolio protection during periods of elevated downside risk, uncertainty or when the investor wants to maintain equity exposure without accepting the full downside risk."
        ]
      ],
      [
        "Trade-off",
        [
          "Protection is not free. The put premium reduces portfolio returns when the hedge is maintained, particularly if protection is repeatedly purchased and the options expire worthless."
        ]
      ],
      [
        "Key Decisions",
        [
          "Strike Price \u00b7 Expiration \u00b7 Hedge Ratio \u00b7 Premium Budget"
        ]
      ]
    ],
    "alt": "Illustrative profit and loss at expiration: unhedged SPY in blue; SPY plus a protective put in orange, with a downside floor and upside reduced by the put premium."
  },
  {
    "id": "collar",
    "name": "Protective Collar",
    "sections": [
      [
        "What it does",
        [
          "Protects an existing equity position against downside risk by buying a put and helps finance that protection by selling a call."
        ]
      ],
      [
        "Example",
        [
          "Long SPY + Long OTM SPY Put + Short OTM SPY Call"
        ]
      ],
      [
        "Strike notation (K)",
        [
          "K_put is the strike price of the purchased put. K_call is the strike price of the sold call. A strike is the agreed price at which the option can be exercised; it is not the option premium."
        ]
      ],
      [
        "Objective",
        [
          "Create a downside floor while keeping some upside participation at a lower hedging cost than a standalone Protective Put."
        ]
      ],
      [
        "How it works",
        [
          "The investor holds SPY, buys a put with a strike below the current SPY price and sells a call with a strike above the current SPY price.",
          "Put Strike < SPY Price < Call Strike",
          "The put strike defines the downside floor. If SPY falls below that level, gains on the put offset additional losses on the underlying position.",
          "The call strike defines the upside cap. If SPY rises above that level, gains on SPY are increasingly offset by losses on the short call.",
          "The premium received from the short call helps reduce the cost of the protective put."
        ]
      ],
      [
        "Typical use",
        [
          "Useful when the investor wants to remain invested in equities, reduce downside risk and is willing to give up part of the upside in exchange for cheaper protection."
        ]
      ],
      [
        "Trade-off",
        [
          "The strategy limits gains above the call strike. The cost of the hedge depends on the selected strikes, expiration and implied volatility.",
          "A collar can sometimes be structured as a Zero-Cost Collar when the premium received from the short call approximately offsets the cost of the put."
        ]
      ],
      [
        "Key Decisions",
        [
          "Put Strike \u00b7 Call Strike \u00b7 Expiration \u00b7 Hedge Ratio \u00b7 Net Premium"
        ]
      ]
    ],
    "alt": "Illustrative profit and loss at expiration: unhedged SPY in blue; SPY plus a collar in orange, with a downside floor below the put strike and capped gains above the call strike.",
    "title": "PROTECTIVE COLLAR"
  },
  {
    "id": "put-spread",
    "name": "Protective Put Spread",
    "sections": [
      [
        "What it does",
        [
          "Provides partial downside protection to an existing equity position by buying one put and selling another put at a lower strike."
        ]
      ],
      [
        "Example",
        [
          "Long SPY + Long OTM SPY Put at Higher Strike + Short OTM SPY Put at Lower Strike"
        ]
      ],
      [
        "Strike notation (K)",
        [
          "K_low is the lower strike price of the sold put. K_high is the higher strike price of the purchased put. A strike is the agreed price at which the option can be exercised; it is not the option premium."
        ]
      ],
      [
        "Objective",
        [
          "Protect the portfolio against a defined range of market losses while reducing the cost of the hedge compared with a standalone Protective Put."
        ]
      ],
      [
        "How it works",
        [
          "The investor holds SPY, buys a put with a strike below the current SPY price and sells another put with a lower strike.",
          "Lower Put Strike < Higher Put Strike < SPY Price",
          "The higher put strike marks the level where downside protection begins.",
          "As SPY falls below that strike, gains on the long put offset further losses on the underlying position.",
          "Once SPY falls below the lower put strike, losses on the short put offset additional gains on the long put, so the hedge stops providing further protection."
        ]
      ],
      [
        "Payoff Outcomes at Expiration",
        [
          {
            "label": "SPY Above Higher Put Strike",
            "text": "Both puts expire worthless and the portfolio follows SPY, less the net premium paid for the spread."
          },
          {
            "label": "SPY Between the Put Strikes",
            "text": "The long put offsets further losses in SPY, creating the protected range."
          },
          {
            "label": "SPY Below Lower Put Strike",
            "text": "The put spread reaches its maximum value. Additional declines in SPY are again reflected in the portfolio because the hedge no longer provides incremental protection."
          }
        ]
      ],
      [
        "Typical use",
        [
          "Useful when the investor wants protection against a moderate market decline but is willing to remain exposed to more severe losses in exchange for a lower hedging cost."
        ]
      ],
      [
        "Trade-off",
        [
          "The short put reduces the cost of protection but limits the maximum value of the hedge. Losses below the lower put strike remain possible."
        ]
      ],
      [
        "Key Decisions",
        [
          "Higher Put Strike \u00b7 Lower Put Strike \u00b7 Expiration \u00b7 Hedge Ratio \u00b7 Net Premium"
        ]
      ]
    ],
    "alt": "Illustrative profit and loss at expiration: unhedged SPY in blue; SPY plus a put spread in orange, with protection limited to the range between the two put strikes and further losses below the lower strike.",
    "width": 1448,
    "height": 1086,
    "title": "PROTECTIVE PUT SPREAD"
  },
  {
    "id": "put-spread-collar",
    "name": "Put Spread Collar",
    "sections": [
      [
        "What it does",
        [
          "Combines partial downside protection with an upside cap in order to reduce the net cost of hedging an existing equity position."
        ]
      ],
      [
        "Example",
        [
          "Long SPY + Long SPY Put at Higher Strike + Short SPY Put at Lower Strike + Short SPY Call"
        ]
      ],
      [
        "Strike notation (K)",
        [
          "K_put low is the lower strike price of the sold put. K_put high is the higher strike price of the purchased put. K_call is the strike price of the sold call.",
          "A strike is the agreed price at which the option can be exercised; it is not the option premium.",
          {
            "emphasis": "K_put low < K_put high < Current SPY Price < K_call"
          }
        ]
      ],
      [
        "Objective",
        [
          "Protect the portfolio against a defined range of market losses while using both the short put and short call premiums to reduce the cost of the hedge."
        ]
      ],
      [
        "How it works",
        [
          "The investor holds SPY, buys a put at a higher strike, sells a put at a lower strike and sells a call above the current SPY price.",
          "Between the two put strikes, the put spread offsets losses in SPY, creating a protected range.",
          "Below the lower put strike, the protection is exhausted and the portfolio becomes exposed again to further declines in SPY.",
          "Above the call strike, gains in the underlying are offset by losses on the short call, creating an upside cap."
        ]
      ],
      [
        "Typical use",
        [
          "Portfolio protection when the investor wants to reduce hedging cost significantly and is willing to accept both limited downside protection and limited upside participation."
        ]
      ],
      [
        "Trade-off",
        [
          "The strategy provides protection only within a predefined downside range and caps gains above the call strike. Severe losses below the lower put strike remain possible."
        ]
      ],
      [
        "Key Decisions",
        [
          "Long Put Strike \u00b7 Short Put Strike \u00b7 Call Strike \u00b7 Expiration \u00b7 Hedge Ratio \u00b7 Net Premium"
        ]
      ]
    ],
    "alt": "Illustrative profit and loss at expiration: unhedged SPY in blue; SPY plus a put spread collar in orange, with protection between the put strikes, renewed downside below the lower put strike and gains capped above the call strike.",
    "width": 1448,
    "height": 1086
  }
];

function HedgeIdeasModule() {
  const [selectedIdea, setSelectedIdea] = useState(HEDGE_IDEAS[0].id);
  const active = HEDGE_IDEAS.find((idea) => idea.id === selectedIdea) || HEDGE_IDEAS[0];
  const imagePath = `assets/hedges/${active.id}.png`;
  return React.createElement("section", { className: "hedge-ideas", "aria-label": "Hedge ideas and structures" },
    React.createElement("nav", { className: "panel hedge-idea-families", "aria-label": "Hedge strategy families" },
      HEDGE_IDEAS.map((idea) => React.createElement("button", {
        key: idea.id, type: "button", className: "hedge-idea-family",
        "aria-pressed": active.id === idea.id,
        onClick: () => { setSelectedIdea(idea.id); scrollToMobileDetail(".hedge-idea-detail h2"); }
      }, React.createElement("strong", null, idea.name),
         React.createElement("span", null, idea.sections.find(([title]) => title === "What it does")[1][0])))),
    React.createElement("article", { className: "panel hedge-idea-detail" },
      React.createElement("h2", null, active.title || active.name.toUpperCase()),
      React.createElement("div", { className: "hedge-idea-layout" },
        React.createElement("div", { className: "hedge-idea-copy" }, active.sections.map(([title, paragraphs]) =>
          React.createElement("section", { key: title, className: title === "Example" ? "hedge-idea-example" : undefined },
            React.createElement("h3", null, title),
            paragraphs.map((paragraph, index) => typeof paragraph === "string"
              ? React.createElement("p", { key: index }, paragraph)
              : paragraph.emphasis ? React.createElement("p", { key: index }, React.createElement("strong", null, paragraph.emphasis))
              : React.createElement("div", { key: index },
                  React.createElement("p", null, React.createElement("strong", null, paragraph.label)),
                  React.createElement("p", null, paragraph.text)))))),
        React.createElement("figure", { className: "hedge-idea-payoff" },
          React.createElement("a", { href: imagePath, target: "_blank", rel: "noopener noreferrer", "aria-label": `Open ${active.name} payoff image at full size` },
            React.createElement("img", { src: imagePath, width: active.width || 1536, height: active.height || 1024, loading: "lazy", alt: active.alt })),
          React.createElement("figcaption", { className: "data-note" }, "Illustrative payoff at expiration. Select the image to view it at full size.")))));
}

function HedgeModule({ initialTheme = "Option Income", dataLabTickers = new Set() } = {}) {
  const groups = window.GCInstrumentRegistry.HEDGE_GROUPS;
  const initialTicker = Object.values(groups).flat().includes(initialTheme) ? initialTheme : (groups[initialTheme] || groups["Option Income"])[0];
  const [view, setView] = useState("ETF Strategies");
  const [selectedEtf, setSelectedEtf] = useState(initialTicker);
  const descriptions = {
  "JEPI": {
    "description": "Holds shares in large-cap US companies and uses options-related strategies to generate income. In exchange for that income, the fund may capture less of the upside when stocks rise strongly. Income payments can vary and do not protect investors from losses when stock prices fall.",
    "usage": "Best suited for investors seeking recurring income in sideways or moderately rising equity markets, particularly when option premiums are attractive. Its main limitation is reduced participation in strong market rallies, while remaining exposed to equity market declines."
  },
  "FXF": {
    "description": "Follows the Swiss franc against the US dollar. It generally gains value when the franc strengthens and loses value when the franc weakens. It adds a different currency to a portfolio, but the franc will not necessarily rise when stocks fall."
  },
  "JEPQ": {
    "description": "Holds shares in large-cap US companies, primarily in technology and growth-oriented sectors, and uses options-related strategies to generate income. In exchange for that income, the fund may capture less of the upside when growth stocks rise strongly. Income payments can vary and do not protect investors from losses when stock prices fall.",
    "usage": "Best suited for investors seeking recurring income with exposure to technology and growth stocks, particularly in sideways or moderately rising markets. Its main limitation is reduced participation in strong technology rallies, while remaining exposed to significant declines in growth stocks."
  },
  "XYLD": {
    "description": "Holds shares in companies included in the S&P 500 and systematically sells call options on the index to generate income. In exchange for that income, the fund gives up most of the gains above the options' strike price. Income payments can vary and provide only limited protection against falling stock prices.",
    "usage": "Best suited for investors prioritizing recurring income over capital appreciation, particularly in sideways markets with relatively high option premiums. Its main limitation is substantially restricted upside during strong market rallies, while remaining exposed to significant equity market losses."
  },
  "QYLD": {
    "description": "Holds shares in companies included in the Nasdaq-100 and systematically sells call options on the index to generate income. In exchange for that income, the fund gives up most of the gains above the options' strike price. Income payments can vary and provide only limited protection against falling stock prices.",
    "usage": "Best suited for investors prioritizing recurring income over capital appreciation, particularly in sideways technology and growth-oriented markets with relatively high option premiums. Its main limitation is substantially restricted upside during strong Nasdaq rallies, while remaining exposed to significant declines in technology and growth stocks."
  },
  "BJAN": {
    "description": "Provides exposure to the S&P 500 through options, seeking to absorb the first 9% of market losses over an annual outcome period while allowing participation in gains up to a predetermined cap. The protection applies to the full outcome period and does not eliminate losses beyond the buffer.",
    "usage": "Best suited for investors seeking broad US equity exposure with a modest cushion against market declines, particularly in moderately rising or mildly declining markets. Its main limitation is capped upside and exposure to losses beyond the 9% buffer. Buying after the outcome period begins may substantially change the protection and return potential."
  },
  "FJUN": {
    "description": "Provides exposure to the S&P 500 through options, seeking to absorb the first 10% of market losses over an annual outcome period while allowing participation in gains up to a predetermined cap. The protection applies to the full outcome period and does not eliminate losses beyond the buffer.",
    "usage": "Best suited for investors seeking US equity participation with moderate downside protection, particularly when expecting modest market gains or limited declines. Its main limitation is capped upside and exposure to losses beyond the 10% buffer. Investors entering or exiting during the outcome period may experience substantially different results."
  },
  "UJAN": {
    "description": "Provides exposure to the S&P 500 through options, seeking to protect against market losses between 5% and 35% over an annual outcome period while allowing participation in gains up to a predetermined cap. Investors remain exposed to the first 5% of losses and to losses exceeding 35%.",
    "usage": "Best suited for defensive investors seeking equity participation with substantial protection against moderate to severe market declines, particularly when market uncertainty is elevated. Its main limitation is a relatively restrictive upside cap, while the first 5% of losses remains unprotected. Protection depends on holding through the full outcome period."
  },
  "GJAN": {
    "description": "Provides exposure to the S&P 500 through options, seeking to absorb the first 15% of market losses over an annual outcome period while allowing participation in gains up to a predetermined cap. The protection applies to the full outcome period and does not eliminate losses beyond the buffer.",
    "usage": "Best suited for investors seeking US equity exposure with a stronger cushion against moderate market declines, particularly in uncertain or moderately bearish environments. Its main limitation is reduced participation in strong market rallies, while losses exceeding the 15% buffer remain unprotected. Investors entering after the outcome period begins may receive different protection and return potential."
  },
  "KJAN": {
    "description": "Provides exposure to US small-cap stocks through options linked to the Russell 2000, seeking to absorb the first 15% of market losses over an annual outcome period while allowing participation in gains up to a predetermined cap. The protection applies to the full outcome period and does not eliminate losses beyond the buffer.",
    "usage": "Best suited for investors seeking participation in smaller US companies while limiting exposure to moderate market declines, particularly when small-cap recovery potential is attractive but uncertainty remains elevated. Its main limitation is capped upside during strong small-cap rallies, while losses beyond the 15% buffer remain unprotected. Investors entering during the outcome period may experience substantially different results."
  },
  "USMV": {
    "description": "Holds a diversified portfolio of US stocks selected and weighted to reduce overall portfolio volatility. Rather than simply choosing the least volatile companies, the strategy considers how stocks behave together to construct a lower-risk equity portfolio. It seeks to provide a smoother investment experience but does not protect against market losses.",
    "usage": "Best suited for investors seeking long-term US equity exposure with lower volatility, particularly during uncertain or moderately declining markets. Its main limitation is potential underperformance during strong market rallies, while remaining exposed to significant losses during broad market selloffs."
  },
  "SPLV": {
    "description": "Holds the 100 least volatile stocks in the S&P 500, based on their price fluctuations over the previous 12 months. The portfolio is rebalanced quarterly and seeks to reduce volatility by emphasizing historically stable companies. However, low historical volatility does not guarantee protection against future market declines.",
    "usage": "Best suited for defensive investors seeking US equity exposure with reduced volatility, particularly during uncertain, sideways, or moderately declining markets. Its main limitation is potential underperformance during strong market rallies and concentration in traditionally defensive sectors, which can become vulnerable to changing interest rates and market conditions."
  },
  "RSP": {
    "description": "Holds the same companies as the S&P 500 but assigns approximately equal weight to each stock instead of giving larger companies greater influence. The portfolio is rebalanced quarterly, reducing concentration in the largest companies and providing broader participation across the US equity market. However, equal weighting does not protect against market declines.",
    "usage": "Best suited for investors seeking diversified US equity exposure with less dependence on mega-cap stocks, particularly when market gains are broadening beyond the largest companies. Its main limitation is potential underperformance when a small group of mega-cap stocks dominates market returns, alongside greater exposure to smaller and more cyclical companies within the S&P 500."
  },
  "EQWL": {
    "description": "Holds the companies included in the S&P 100, representing some of the largest and most established US businesses, and assigns approximately equal weight to each stock. The portfolio is rebalanced quarterly, reducing dependence on the largest companies while maintaining a focus on major US corporations. However, equal weighting does not eliminate equity market risk.",
    "usage": "Best suited for investors seeking exposure to established US large-cap companies without excessive concentration in a few market leaders, particularly when performance is broadening across major corporations. Its main limitation is potential underperformance when the largest mega-cap stocks lead the market, while offering less diversification across company sizes than broader equal-weight strategies."
  },
  "QQEW": {
    "description": "Holds 50 companies selected from the Nasdaq-100 based on a combination of financial quality and growth characteristics, assigning approximately equal weight to each. The portfolio is rebalanced quarterly, reducing dependence on the largest Nasdaq companies while maintaining exposure to innovative and growth-oriented businesses. However, equal weighting does not eliminate technology-sector concentration or market risk.",
    "usage": "Best suited for investors seeking Nasdaq growth exposure with less reliance on mega-cap technology leaders and greater emphasis on companies with strong quality and growth characteristics. Its main limitation is potential underperformance when the largest technology stocks dominate market returns, while remaining exposed to significant declines in growth stocks and technology-related sectors."
  },
  "VIXY": {
    "description": "Provides exposure to short-term VIX futures, seeking to benefit from increases in expected US equity market volatility. The fund can rise sharply during market stress, potentially offsetting some equity portfolio losses. However, it does not track the spot VIX directly and can lose substantial value when volatility remains stable or declines.",
    "usage": "Best suited for short-term tactical hedging when a significant increase in market volatility is anticipated. Its main limitation is persistent value erosion when VIX futures are in contango, as rolling futures contracts creates recurring costs. It is generally unsuitable as a permanent portfolio hedge."
  },
  "VXX": {
    "description": "Provides exposure to an index of short-term VIX futures through an exchange-traded note issued by Barclays. It seeks to benefit from rising expected equity market volatility and may appreciate sharply during sudden market stress. Unlike a traditional ETF, it is an unsecured debt instrument and carries issuer credit risk in addition to volatility-related risks.",
    "usage": "Best suited for short-term volatility trading or tactical equity hedging during periods of anticipated market stress. Its main limitations are persistent losses from futures contango and exposure to Barclays' credit risk. Its ETN structure also introduces potential trading-price distortions, making it unsuitable for long-term defensive allocations."
  },
  "UVXY": {
    "description": "Provides leveraged exposure to short-term VIX futures, targeting 1.5 times the daily performance of a VIX futures index. It can generate substantial gains during sudden volatility spikes but is highly sensitive to market reversals. Daily leverage resets can cause returns over longer periods to differ significantly from 1.5 times the index's cumulative return.",
    "usage": "Best suited for highly experienced investors seeking aggressive, very short-term protection or speculative exposure to sudden volatility spikes. Its main limitations are amplified losses, futures contango and daily leverage compounding, which can rapidly erode investment value. It is unsuitable for long-term holding or permanent portfolio protection."
  },
  "TAIL": {
    "description": "Invests primarily in intermediate-term US Treasury bonds while purchasing out-of-the-money put options on the S&P 500 to protect against severe equity market declines. The strategy combines potential gains from falling interest rates with protection against sharp stock market selloffs. However, recurring option costs and rising Treasury yields can significantly reduce returns.",
    "usage": "Best suited for investors anticipating a deflationary recession or financial crisis, when equity markets may fall sharply, volatility may rise, and Treasury yields may decline. Its main limitation is vulnerability to inflationary shocks or rising interest rates, which can cause Treasury losses while option premiums erode over time. The strategy can perform poorly when stocks and bonds decline simultaneously, making it costly as a permanent portfolio hedge."
  },
  "SH": {
    "description": "Provides inverse exposure to the S&P 500, seeking to deliver approximately the opposite of the index's daily performance. The fund generally gains when large US stocks decline and loses value when they rise. It offers a way to hedge broad equity market exposure without directly short-selling stocks.",
    "usage": "Best suited for short-term protection against anticipated declines in the broad US equity market, particularly during bearish market conditions. Its main limitation is daily rebalancing, which can cause returns to diverge from the inverse of the index's cumulative performance over longer periods, especially in volatile markets. Sustained market rallies can generate substantial losses."
  },
  "PSQ": {
    "description": "Provides inverse exposure to the Nasdaq-100, seeking to deliver approximately the opposite of the index's daily performance. The fund generally gains when large Nasdaq-listed companies decline, particularly technology and growth-oriented stocks. It allows investors to reduce or offset Nasdaq exposure without directly short-selling securities.",
    "usage": "Best suited for short-term hedging against expected declines in technology and growth stocks, particularly when valuations are under pressure or market sentiment deteriorates. Its main limitation is daily rebalancing and sensitivity to sharp Nasdaq recoveries, which can erode returns. Performance over longer periods may differ significantly from the inverse of the index's cumulative return."
  },
  "RWM": {
    "description": "Provides inverse exposure to the Russell 2000, seeking to deliver approximately the opposite of the index's daily performance. The fund generally gains when US small-cap stocks decline and loses value when they rise. It offers a direct way to hedge exposure to smaller US companies without short-selling individual stocks.",
    "usage": "Best suited for short-term protection against expected weakness in US small-cap stocks, particularly during periods of tightening financial conditions, recession concerns, or deteriorating credit availability. Its main limitation is daily rebalancing and sensitivity to sharp small-cap recoveries, while returns over longer periods may diverge from the inverse of the index's cumulative performance."
  },
  "EUM": {
    "description": "Provides inverse exposure to the MSCI Emerging Markets Index, seeking to deliver approximately the opposite of the index's daily performance. The fund generally gains when emerging market equities decline and loses value when they rise. It offers a way to hedge broad emerging market equity exposure without directly short-selling international stocks.",
    "usage": "Best suited for short-term protection against anticipated emerging market weakness, particularly during periods of US dollar strength, global financial tightening, or deteriorating risk appetite. Its main limitation is daily rebalancing, alongside sensitivity to emerging market recoveries and currency-related movements. Returns over longer periods may differ significantly from the inverse of the index's cumulative performance."
  },
  "SDS": {
    "description": "Provides leveraged inverse exposure to the S&P 500, seeking to deliver approximately twice the opposite (-2x) of the index's daily performance. The fund can generate amplified gains during equity market declines but also experiences amplified losses when stocks rise. Its exposure resets daily, making performance highly dependent on market movements and volatility.",
    "usage": "Best suited for experienced investors seeking aggressive, short-term protection against significant declines in the broad US equity market. Its main limitation is daily leverage compounding, which can erode returns in volatile or sideways markets and cause substantial deviations from -2x the index's cumulative performance. Sharp market recoveries can produce rapid losses."
  },
  "QID": {
    "description": "Provides leveraged inverse exposure to the Nasdaq-100, seeking to deliver approximately twice the opposite (-2x) of the index's daily performance. The fund can generate amplified gains when large Nasdaq-listed technology and growth stocks decline, while experiencing amplified losses during market advances. Daily leverage resets make returns highly sensitive to market volatility.",
    "usage": "Best suited for experienced investors seeking aggressive, short-term protection against anticipated declines in technology and growth stocks. Its main limitation is daily leverage compounding, which can rapidly erode returns during volatile or sideways markets. Strong Nasdaq recoveries can generate substantial losses, making the fund unsuitable for permanent portfolio hedging."
  },
  "SQQQ": {
    "description": "Provides highly leveraged inverse exposure to the Nasdaq-100, seeking to deliver approximately three times the opposite (-3x) of the index's daily performance. The fund can generate substantial gains during sharp Nasdaq declines but also experiences significant losses when technology and growth stocks rise. Daily leverage resets create considerable sensitivity to market volatility and sudden reversals.",
    "usage": "Best suited for highly experienced investors seeking very short-term, aggressive protection or speculative exposure to sharp declines in the Nasdaq-100. Its main limitation is the combination of extreme leverage, daily compounding and sensitivity to market reversals, which can rapidly destroy investment value. It is unsuitable for long-term holding or permanent portfolio protection."
  },
  "SPXU": {
    "description": "Provides highly leveraged inverse exposure to the S&P 500, seeking to deliver approximately three times the opposite (-3x) of the index's daily performance. The fund can generate substantial gains during sharp US equity market declines but also experiences significant losses when stocks rise. Daily leverage resets make performance highly sensitive to volatility and sudden market reversals.",
    "usage": "Best suited for highly experienced investors seeking very short-term, aggressive protection or speculative exposure to severe declines in the broad US equity market. Its main limitation is extreme sensitivity to market recoveries and daily leverage compounding, which can rapidly erode investment value. The fund is unsuitable for long-term holding or permanent portfolio hedging."
  }
};
  return React.createElement(React.Fragment, null,
    React.createElement("nav", { className: "panel etf-subtabs", "aria-label": "Hedges and overlays views" },
      ["ETF Strategies", "Hedge Ideas/Structures"].map((label) => React.createElement("button", { key: label, type: "button", "aria-pressed": view === label, onClick: () => setView(label) }, label))),
    view === "ETF Strategies" ? React.createElement("div", { className: "core-layout commodity-layout" },
      React.createElement("article", { className: "panel" },
        React.createElement("div", { className: "core-function-grid" }, Object.entries(groups).map(([label, tickers]) =>
          React.createElement("section", { className: "core-function hedge-function", style: { "--family-accent": window.GCInstrumentRegistry.subgroupTone(label) }, key: label },
            React.createElement("div", null,
              React.createElement("h3", null, label),
              React.createElement("p", null, window.GCInstrumentRegistry.HEDGE_SUMMARIES[label])),
            React.createElement("div", { className: "etf-token-grid" }, tickers.map((ticker) =>
              React.createElement("button", { key: ticker, type: "button", className: "etf-token etf-us", "aria-pressed": selectedEtf === ticker,
                onClick: () => { setSelectedEtf(ticker); scrollToMobileDetail(".hedge-detail h2"); }
              }, ticker))))))),
      React.createElement("aside", { className: "panel core-detail hedge-detail" },
        React.createElement("div", { className: "instrument-detail-heading" },
          React.createElement("h2", null, selectedEtf),
          React.createElement(DataLabTickerLink, { ticker: selectedEtf, availableTickers: dataLabTickers, group: "Hedges & Overlays", label: "DataLabs" })),
        React.createElement(EtfFullNames, { instruments: selectedEtf }),
        React.createElement(EtfTradingDetails, { instruments: selectedEtf }),
        React.createElement("p", null, descriptions[selectedEtf].description),
        descriptions[selectedEtf].usage ? React.createElement(React.Fragment, null,
          React.createElement("p", null, React.createElement("strong", null, "When to Use & Key Limitation")),
          React.createElement("p", null, descriptions[selectedEtf].usage)) : null)) : React.createElement(HedgeIdeasModule));
}

// Trading listings verified against Yahoo Finance chart metadata on 14/09/2026.
const ETF_TRADING_LISTINGS = {
  BJAN: ["BJAN", "Cboe BZX", "USD"],
  FJUN: ["FJUN", "Cboe BZX", "USD"],
  UJAN: ["UJAN", "Cboe BZX", "USD"],
  GJAN: ["GJAN", "Cboe BZX", "USD"],
  KJAN: ["KJAN", "Cboe BZX", "USD"],
  TAIL: ["TAIL", "Cboe BZX", "USD"],

  WSML: ["WSML.L", "London Stock Exchange", "USD"],
  VSS: ["VSS", "NYSE Arca", "USD"],
  SCZ: ["SCZ", "Nasdaq", "USD"],
  IWC: ["IWC", "NYSE Arca", "USD"],
  IDP6: ["IDP6.L", "London Stock Exchange", "USD"],
  IJR: ["IJR", "NYSE Arca", "USD"],
  SPY4: ["SPY4.L", "London Stock Exchange", "USD"],
  IJH: ["IJH", "NYSE Arca", "USD"],
  SPY: ["SPY", "NYSE Arca", "USD"],
  VOO: ["VOO", "NYSE Arca", "USD"],
  QQQ: ["QQQ", "Nasdaq", "USD"],
  RSP: ["RSP", "NYSE Arca", "USD"],
  EQWL: ["EQWL", "NYSE Arca", "USD"],
  SMH: ["SMH", "Nasdaq", "USD"],
  SOXX: ["SOXX", "Nasdaq", "USD"],
  CIBR: ["CIBR", "Nasdaq", "USD"],
  ITA: ["ITA", "Cboe US", "USD"],
  GLD: ["GLD", "NYSE Arca", "USD"],
  XLK: ["XLK", "NYSE Arca", "USD"],
  IUIT: ["IUIT.L", "London Stock Exchange", "USD"],
  XLC: ["XLC", "NYSE Arca", "USD"],
  IUCM: ["IUCM.L", "London Stock Exchange", "USD"],
  XLY: ["XLY", "NYSE Arca", "USD"],
  IUCD: ["IUCD.L", "London Stock Exchange", "USD"],
  XLV: ["XLV", "NYSE Arca", "USD"],
  IUHC: ["IUHC.L", "London Stock Exchange", "USD"],
  XLF: ["XLF", "NYSE Arca", "USD"],
  IUFS: ["IUFS.L", "London Stock Exchange", "USD"],
  XLI: ["XLI", "NYSE Arca", "USD"],
  IUIS: ["IUIS.L", "London Stock Exchange", "USD"],
  XLE: ["XLE", "NYSE Arca", "USD"],
  IUES: ["IUES.L", "London Stock Exchange", "USD"],
  XLP: ["XLP", "NYSE Arca", "USD"],
  IUCS: ["IUCS.L", "London Stock Exchange", "USD"],
  XLU: ["XLU", "NYSE Arca", "USD"],
  IUUS: ["IUUS.L", "London Stock Exchange", "USD"],
  XLB: ["XLB", "NYSE Arca", "USD"],
  IUMS: ["IUMS.L", "London Stock Exchange", "USD"],
  XLRE: ["XLRE", "NYSE Arca", "USD"],
  VEA: ["VEA", "NYSE Arca", "USD"],
  IEFA: ["IEFA", "Cboe US", "USD"],
  IWDA: ["IWDA.L", "London Stock Exchange", "USD"],
  SWDA: ["SWDA.L", "London Stock Exchange", "GBp"],
  VGK: ["VGK", "NYSE Arca", "USD"],
  IEUR: ["IEUR", "NYSE Arca", "USD"],
  FEZ: ["FEZ", "NYSE Arca", "USD"],
  IMEU: ["IMEU.L", "London Stock Exchange", "GBp"],
  VWO: ["VWO", "NYSE Arca", "USD"],
  IEMG: ["IEMG", "NYSE Arca", "USD"],
  EIMI: ["EIMI.L", "London Stock Exchange", "USD"],
  EMXC: ["EMXC", "Nasdaq", "USD"],
  EXCH: ["EXCH.AS", "Euronext Amsterdam", "USD"],
  LUXU: ["LUXU.PA", "Euronext Paris", "USD"],
  IB01: ["IB01.L", "London Stock Exchange", "USD"],
  CSPX: ["CSPX.L", "London Stock Exchange", "USD"],
  VUAA: ["VUAA.L", "London Stock Exchange", "USD"],
  QQQM: ["QQQM", "Nasdaq", "USD"],
  CNDX: ["CNDX.L", "London Stock Exchange", "USD"],
  EQQQ: ["EQQQ.L", "London Stock Exchange", "GBp"],
  IAU: ["IAU", "NYSE Arca", "USD"],
  FXF: ["FXF", "NYSE Arca", "USD"],
  IBTA: ["IBTA.L", "London Stock Exchange", "USD"],
  CBU7: ["CBU7.L", "London Stock Exchange", "USD"],
  IB7A: ["IB7A.AS", "Euronext Amsterdam", "USD"],
  DTLA: ["DTLA.L", "London Stock Exchange", "USD"],
  TIP5: ["TIP5.L", "London Stock Exchange", "USD"],
  IDTP: ["IDTP.L", "London Stock Exchange", "USD"],
  TI5A: ["TI5A.AS", "Euronext Amsterdam", "USD"],
  LQDA: ["LQDA.L", "London Stock Exchange", "USD"],
  IHYA: ["IHYA.L", "London Stock Exchange", "USD"],
  AGGU: ["AGGU.L", "London Stock Exchange", "USD"],
  SGOV: ["SGOV", "New York Stock Exchange", "USD"],
  SHY: ["SHY", "Nasdaq", "USD"],
  IEI: ["IEI", "Nasdaq", "USD"],
  IEF: ["IEF", "Nasdaq", "USD"],
  TLT: ["TLT", "Nasdaq", "USD"],
  STIP: ["STIP", "NYSE Arca", "USD"],
  TIP: ["TIP", "NYSE Arca", "USD"],
  LQD: ["LQD", "NYSE Arca", "USD"],
  HYG: ["HYG", "NYSE Arca", "USD"],
  AGG: ["AGG", "NYSE Arca", "USD"],
  PPA: ["PPA", "NYSE Arca", "USD"],
  HACK: ["HACK", "NYSE Arca", "USD"],
  BOTZ: ["BOTZ", "Nasdaq", "USD"],
  ROBO: ["ROBO", "NYSE Arca", "USD"],
  GRID: ["GRID", "Nasdaq", "USD"],
  PAVE: ["PAVE", "Cboe US", "USD"],
  ITB: ["ITB", "Cboe US", "USD"],
  XHB: ["XHB", "NYSE Arca", "USD"],
  PKB: ["PKB", "NYSE Arca", "USD"],
  SRVR: ["SRVR", "NYSE Arca", "USD"],
  VPN: ["VPN", "Nasdaq", "USD"],
  AIRR: ["AIRR", "Nasdaq", "USD"],
  QTUM: ["QTUM", "Nasdaq", "USD"],
  GLUX: ["GLUX.PA", "Euronext Paris", "EUR"],
  EXV4: ["EXV4.DE", "Xetra", "EUR"],
  XDWH: ["XDWH.DE", "Xetra", "EUR"],
  MCHI: ["MCHI", "Nasdaq", "USD"],
  FXI: ["FXI", "NYSE Arca", "USD"],
  KWEB: ["KWEB", "NYSE Arca", "USD"],
  ASHR: ["ASHR", "NYSE Arca", "USD"],
  KBA: ["KBA", "NYSE Arca", "USD"],
  COPX: ["COPX", "NYSE Arca", "USD"],
  PICK: ["PICK", "Cboe US", "USD"],
  INDA: ["INDA", "Cboe US", "USD"],
  FLIN: ["FLIN", "NYSE Arca", "USD"],
  EWW: ["EWW", "NYSE Arca", "USD"],
  VNM: ["VNM", "Cboe US", "USD"],
  EWT: ["EWT", "NYSE Arca", "USD"],
  EWY: ["EWY", "NYSE Arca", "USD"],
  JEPI: ["JEPI", "NYSE Arca", "USD"],
  JEPQ: ["JEPQ", "Nasdaq", "USD"],
  XYLD: ["XYLD", "NYSE Arca", "USD"],
  QYLD: ["QYLD", "Nasdaq", "USD"],
  USMV: ["USMV", "Cboe US", "USD"],
  SPLV: ["SPLV", "NYSE Arca", "USD"],
  VIXY: ["VIXY", "Cboe US", "USD"],
  VXX: ["VXX", "Cboe US", "USD"],
  UVXY: ["UVXY", "Cboe US", "USD"],
  SH: ["SH", "NYSE Arca", "USD"],
  PSQ: ["PSQ", "NYSE Arca", "USD"],
  RWM: ["RWM", "NYSE Arca", "USD"],
  EUM: ["EUM", "NYSE Arca", "USD"],
  SDS: ["SDS", "NYSE Arca", "USD"],
  QID: ["QID", "NYSE Arca", "USD"],
  SQQQ: ["SQQQ", "Nasdaq", "USD"],
  SPXU: ["SPXU", "NYSE Arca", "USD"],
  QQEW: ["QQEW", "Nasdaq", "USD"],
  GLDM: ["GLDM", "NYSE Arca", "USD"],
  SIVR: ["SIVR", "NYSE Arca", "USD"],
  SLV: ["SLV", "NYSE Arca", "USD"],
  PPLT: ["PPLT", "NYSE Arca", "USD"],
  PALL: ["PALL", "NYSE Arca", "USD"],
  USO: ["USO", "NYSE Arca", "USD"],
  BNO: ["BNO", "NYSE Arca", "USD"],
  UNG: ["UNG", "NYSE Arca", "USD"],
  CPER: ["CPER", "NYSE Arca", "USD"],
  DBA: ["DBA", "NYSE Arca", "USD"],
  CORN: ["CORN", "NYSE Arca", "USD"],
  WEAT: ["WEAT", "NYSE Arca", "USD"],
  SOYB: ["SOYB", "NYSE Arca", "USD"],
  CATL: ["CATL.L", "London Stock Exchange", "USD"],
  PDBC: ["PDBC", "Nasdaq", "USD"],
  COMT: ["COMT", "Nasdaq", "USD"],
  MOO: ["MOO", "NYSE Arca", "USD"],
  GDX: ["GDX", "NYSE Arca", "USD"],
  GDXJ: ["GDXJ", "NYSE Arca", "USD"],
  SIL: ["SIL", "NYSE Arca", "USD"],
  SILJ: ["SILJ", "NYSE Arca", "USD"],
  VDE: ["VDE", "NYSE Arca", "USD"],
  URA: ["URA", "NYSE Arca", "USD"],
  URNM: ["URNM", "NYSE Arca", "USD"],
  LIT: ["LIT", "NYSE Arca", "USD"],
  REMX: ["REMX", "NYSE Arca", "USD"],
  WOOD: ["WOOD", "Nasdaq", "USD"],
  PHO: ["PHO", "Nasdaq", "USD"],
};

// Full instrument names from the ETF catalog.
const ETF_FULL_NAMES = {
  BJAN: "Innovator U.S. Equity Buffer ETF - January",
  FJUN: "FT Vest U.S. Equity Buffer ETF - June",
  UJAN: "Innovator U.S. Equity Ultra Buffer ETF - January",
  GJAN: "FT Vest U.S. Equity Moderate Buffer ETF - January",
  KJAN: "Innovator U.S. Small Cap Power Buffer ETF - January",
  TAIL: "Cambria Tail Risk ETF",

  WSML: "iShares MSCI World Small Cap UCITS ETF USD (Acc)",
  VSS: "Vanguard FTSE All-World ex-US Small-Cap ETF",
  SCZ: "iShares MSCI EAFE Small-Cap ETF",
  IWC: "iShares Micro-Cap ETF",
  IDP6: "iShares S&P SmallCap 600 UCITS ETF USD (Dist)",
  IJR: "iShares Core S&P Small-Cap ETF",
  SPY4: "State Street SPDR S&P 400 U.S. Mid Cap UCITS ETF (Acc)",
  IJH: "iShares Core S&P Mid-Cap ETF",
  "SPY": "SPDR S&P 500 ETF Trust",
  "VOO": "Vanguard S&P 500 ETF",
  "QQQ": "Invesco QQQ Trust",
  "RSP": "Invesco S&P 500 Equal Weight ETF",
  "EQWL": "Invesco S&P 100 Equal Weight ETF",
  "SMH": "VanEck Semiconductor ETF",
  "SOXX": "iShares Semiconductor ETF",
  "CIBR": "First Trust Nasdaq Cybersecurity ETF",
  "ITA": "iShares U.S. Aerospace & Defense ETF",
  "GLD": "SPDR Gold Shares",
  "XLK": "Technology Select Sector SPDR Fund",
  "IUIT": "iShares S&P 500 Information Technology Sector UCITS ETF USD Acc",
  "XLC": "Communication Services Select Sector SPDR Fund",
  "IUCM": "iShares S&P 500 Communication Sector UCITS ETF USD Acc",
  "XLY": "Consumer Discretionary Select Sector SPDR Fund",
  "IUCD": "iShares S&P 500 Consumer Discretionary Sector UCITS ETF USD Acc",
  "XLV": "Health Care Select Sector SPDR Fund",
  "IUHC": "iShares S&P 500 Health Care Sector UCITS ETF USD Acc",
  "XLF": "Financial Select Sector SPDR Fund",
  "IUFS": "iShares S&P 500 Financials Sector UCITS ETF USD Acc",
  "XLI": "Industrial Select Sector SPDR Fund",
  "IUIS": "iShares S&P 500 Industrials Sector UCITS ETF USD Acc",
  "XLE": "Energy Select Sector SPDR Fund",
  "IUES": "iShares S&P 500 Energy Sector UCITS ETF USD Acc",
  "XLP": "Consumer Staples Select Sector SPDR Fund",
  "IUCS": "iShares S&P 500 Consumer Staples Sector UCITS ETF USD Acc",
  "XLU": "Utilities Select Sector SPDR Fund",
  "IUUS": "iShares S&P 500 Utilities Sector UCITS ETF USD Acc",
  "XLB": "Materials Select Sector SPDR Fund",
  "IUMS": "iShares S&P 500 Materials Sector UCITS ETF USD Acc",
  "XLRE": "Real Estate Select Sector SPDR Fund",
  "VEA": "Vanguard FTSE Developed Markets ETF",
  "IEFA": "iShares Core MSCI EAFE ETF",
  "IWDA": "iShares Core MSCI World UCITS ETF USD Acc",
  "SWDA": "iShares Core MSCI World UCITS ETF",
  "VGK": "Vanguard FTSE Europe ETF",
  "IEUR": "iShares Core MSCI Europe ETF",
  "FEZ": "SPDR EURO STOXX 50 ETF",
  "IMEU": "iShares Core MSCI Europe UCITS ETF EUR Dist",
  "VWO": "Vanguard FTSE Emerging Markets ETF",
  "IEMG": "iShares Core MSCI Emerging Markets ETF",
  "EIMI": "iShares Core MSCI EM IMI UCITS ETF USD Acc",
  "EMXC": "iShares MSCI Emerging Markets ex China ETF",
  "EXCH": "iShares MSCI EM ex-China UCITS ETF USD Acc",
  "LUXU": "Amundi Global Luxury UCITS ETF USD Acc",
  "IB01": "iShares $ Treasury Bond 0-1yr UCITS ETF USD Acc",
  "CSPX": "iShares Core S&P 500 UCITS ETF USD Acc",
  "VUAA": "Vanguard S&P 500 UCITS ETF USD Acc",
  "QQQM": "Invesco NASDAQ 100 ETF",
  "CNDX": "iShares NASDAQ 100 UCITS ETF USD Acc",
  "EQQQ": "Invesco EQQQ NASDAQ-100 UCITS ETF Dist",
  "IAU": "iShares Gold Trust",
  "FXF": "Invesco CurrencyShares Swiss Franc Trust",
  "IBTA": "iShares $ Treasury Bond 1-3yr UCITS ETF USD Acc",
  "CBU7": "iShares $ Treasury Bond 3-7yr UCITS ETF USD Acc",
  "IB7A": "iShares $ Treasury Bond 7-10yr UCITS ETF USD Acc",
  "DTLA": "iShares $ Treasury Bond 20+yr UCITS ETF USD Acc",
  "TIP5": "iShares $ TIPS 0-5 UCITS ETF USD Dist",
  "IDTP": "iShares $ TIPS UCITS ETF USD Acc",
  "TI5A": "iShares $ TIPS 0-5 UCITS ETF USD Acc",
  "LQDA": "iShares $ Corp Bond UCITS ETF USD Acc",
  "IHYA": "iShares $ High Yield Corp Bond UCITS ETF USD Acc",
  "AGGU": "iShares Core Global Aggregate Bond UCITS ETF USD Hedged Acc",
  "SGOV": "iShares 0-3 Month Treasury Bond ETF",
  "SHY": "iShares 1-3 Year Treasury Bond ETF",
  "IEI": "iShares 3-7 Year Treasury Bond ETF",
  "IEF": "iShares 7-10 Year Treasury Bond ETF",
  "TLT": "iShares 20+ Year Treasury Bond ETF",
  "STIP": "iShares 0-5 Year TIPS Bond ETF",
  "TIP": "iShares TIPS Bond ETF",
  "LQD": "iShares iBoxx $ Investment Grade Corporate Bond ETF",
  "HYG": "iShares iBoxx $ High Yield Corporate Bond ETF",
  "AGG": "iShares Core U.S. Aggregate Bond ETF",
  "PPA": "Invesco Aerospace & Defense ETF",
  "HACK": "Amplify Cybersecurity ETF",
  "BOTZ": "Global X Robotics & Artificial Intelligence ETF",
  "ROBO": "ROBO Global Robotics and Automation Index ETF",
  "GRID": "First Trust NASDAQ Clean Edge Smart Grid Infrastructure Index Fund",
  "PAVE": "Global X U.S. Infrastructure Development ETF",
  "ITB": "iShares U.S. Home Construction ETF",
  "XHB": "SPDR S&P Homebuilders ETF",
  "PKB": "Invesco Building & Construction ETF",
  "SRVR": "Pacer Data & Infrastructure Real Estate ETF",
  "VPN": "Global X Data Center & Digital Infrastructure ETF",
  "AIRR": "First Trust RBA American Industrial Renaissance ETF",
  "QTUM": "Defiance Quantum ETF",
  "GLUX": "Amundi Global Luxury UCITS ETF EUR Acc",
  "EXV4": "iShares STOXX Europe 600 Health Care UCITS ETF (DE) Dist",
  "XDWH": "Xtrackers MSCI World Health Care UCITS ETF 1C USD Acc",
  "MCHI": "iShares MSCI China ETF",
  "FXI": "iShares China Large-Cap ETF",
  "KWEB": "KraneShares CSI China Internet ETF",
  "ASHR": "Xtrackers Harvest CSI 300 China A-Shares ETF",
  "KBA": "KraneShares Bosera MSCI China A 50 Connect Index ETF",
  "COPX": "Global X Copper Miners ETF",
  "PICK": "iShares MSCI Global Metals & Mining Producers ETF",
  "INDA": "iShares MSCI India ETF",
  "FLIN": "Franklin FTSE India ETF",
  "EWW": "iShares MSCI Mexico ETF",
  "VNM": "VanEck Vietnam ETF",
  "EWT": "iShares MSCI Taiwan ETF",
  "EWY": "iShares MSCI South Korea ETF",
  "JEPI": "JPMorgan Equity Premium Income ETF",
  "JEPQ": "JPMorgan Nasdaq Equity Premium Income ETF",
  "XYLD": "Global X S&P 500 Covered Call ETF",
  "QYLD": "Global X Nasdaq 100 Covered Call ETF",
  "USMV": "iShares MSCI USA Min Vol Factor ETF",
  "SPLV": "Invesco S&P 500 Low Volatility ETF",
  "VIXY": "ProShares VIX Short-Term Futures ETF",
  "VXX": "iPath Series B S&P 500 VIX Short-Term Futures ETN",
  "UVXY": "ProShares Ultra VIX Short-Term Futures ETF",
  "SH": "ProShares Short S&P500",
  "PSQ": "ProShares Short QQQ",
  "RWM": "ProShares Short Russell2000",
  "EUM": "ProShares Short MSCI Emerging Markets",
  "SDS": "ProShares UltraShort S&P500",
  "QID": "ProShares UltraShort QQQ",
  "SQQQ": "ProShares UltraPro Short QQQ",
  "SPXU": "ProShares UltraPro Short S&P500",
  "QQEW": "First Trust NASDAQ-100 Equal Weighted Index Fund",
  "GLDM": "SPDR Gold MiniShares Trust",
  "SIVR": "abrdn Physical Silver Shares ETF",
  "SLV": "iShares Silver Trust",
  "PPLT": "abrdn Physical Platinum Shares ETF",
  "PALL": "abrdn Physical Palladium Shares ETF",
  "USO": "United States Oil Fund",
  "BNO": "United States Brent Oil Fund",
  "UNG": "United States Natural Gas Fund",
  "CPER": "United States Copper Index Fund",
  "DBA": "Invesco DB Agriculture Fund",
  "CORN": "Teucrium Corn Fund",
  "WEAT": "Teucrium Wheat Fund",
  "SOYB": "Teucrium Soybean Fund",
  "CATL": "WisdomTree Live Cattle",
  "PDBC": "Invesco Optimum Yield Diversified Commodity Strategy No K-1 ETF",
  "COMT": "iShares GSCI Commodity Dynamic Roll Strategy ETF",
  "MOO": "VanEck Agribusiness ETF",
  "GDX": "VanEck Gold Miners ETF",
  "GDXJ": "VanEck Junior Gold Miners ETF",
  "SIL": "Global X Silver Miners ETF",
  "SILJ": "Amplify Junior Silver Miners ETF",
  "VDE": "Vanguard Energy ETF",
  "URA": "Global X Uranium ETF",
  "URNM": "Sprott Uranium Miners ETF",
  "LIT": "Global X Lithium & Battery Tech ETF",
  "REMX": "VanEck Rare Earth and Strategic Metals ETF",
  "WOOD": "iShares Global Timber & Forestry ETF",
  "PHO": "Invesco Water Resources ETF",
  "MVOL": "iShares Edge MSCI World Minimum Volatility UCITS ETF USD Acc"
};

function EtfFullNames({ instruments }) {
  const tickers = [...new Set(String(instruments || "").match(/\b[A-Z][A-Z0-9]*\b/g) || [])].filter((ticker) => ETF_FULL_NAMES[ticker]);
  if (!tickers.length) return null;
  return React.createElement("div", { className: "etf-full-names" },
    tickers.map((ticker) => React.createElement("div", { className: "detail-role", key: ticker }, `${tickers.length > 1 ? `${ticker} — ` : ""}${ETF_FULL_NAMES[ticker]}`))
  );
}

function EtfFundAssets({ instruments }) {
  const [records, setRecords] = useState(null);
  useEffect(() => {
    let cancelled = false;
    DataClient.load("etf-universe").then(result => {
      if (!cancelled) setRecords(result.ok ? Object.fromEntries((result.data?.instruments || []).map(item => [item.ticker, item.fundAssets])) : {});
    }).catch(() => { if (!cancelled) setRecords({}); });
    return () => { cancelled = true; };
  }, []);
  const tickers = [...new Set(String(instruments || "").match(/\b[A-Z][A-Z0-9]*\b/g) || [])];
  return React.createElement("div", { className: "data-note etf-fund-assets" }, tickers.map(ticker => {
    const row = records?.[ticker];
    const valid = Number.isFinite(row?.value) && row.value > 0 && row.currency;
    const amount = valid ? `${row.currency} ${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(row.value)}` : records === null ? "Loading…" : "n/a";
    return React.createElement("div", { key: ticker },
      `${tickers.length > 1 ? ticker + " — " : ""}Net assets: ${amount}`,
      valid ? React.createElement("span", null, ` · Retrieved ${row.collectedAt.slice(0,10)}${row.status === "stale" ? " · Last available value" : ""}`) : null,
      valid ? React.createElement("a", { href: row.sourceUrl, target: "_blank", rel: "noopener noreferrer" }, " · Source: Yahoo Finance ↗") : null);
  }));
}

function EtfTradingDetails({ instruments }) {
  const tickers = [...new Set(String(instruments || "").match(/\b[A-Z][A-Z0-9]*\b/g) || [])]
    .filter((ticker) => ETF_TRADING_LISTINGS[ticker]);
  if (!tickers.length) return null;
  const currencies = { USD: "USD (US dollar)", EUR: "EUR (euro)", GBp: "GBp (British pence; 100 GBp = GBP 1)" };
  return React.createElement("div", { className: "etf-trading-details", "aria-label": "Exchange and trading currency" },
    tickers.map((ticker) => {
      const [symbol, exchange, currency] = ETF_TRADING_LISTINGS[ticker];
      return React.createElement("p", { className: "data-note", key: ticker },
        `${tickers.length > 1 ? `${ticker} — ` : ""}Exchange: ${exchange} · Trading currency: ${currencies[currency] || currency} · Listing: ${symbol}`);
    }),
    React.createElement(EtfFundAssets, { instruments: tickers.join(" ") })
  );
}

function DataLabTickerLink({ ticker, availableTickers, group, label = "Data Lab ↗" }) {
  if (!availableTickers?.has(ticker)) return null;
  return React.createElement(
    "a",
    {
      className: "data-lab-direct-link",
      href: `#dataLab/${encodeURIComponent(ticker)}${group === "Caps/Style" ? "/caps" : group === "Hedges & Overlays" ? "/hedges" : ""}`,
      "aria-label": `Open ${ticker} in Data Lab`,
    },
    label
  );
}

function CoreModule({ contextGroup = null, functions = CORE_EQUITY_FUNCTIONS, initialEtf = "VOO", legendMode = "equity", showVehicleToggle = true, dataLabTickers = new Set() } = {}) {
  const [selectedEtf, setSelectedEtf] = useState(initialEtf);
  const [vehicleView, setVehicleView] = useState("all");
  const [geoData, setGeoData] = useState(null);
  const [geoResult, setGeoResult] = useState(null);
  useEffect(() => {
    let cancelled = false;
    DataClient.load("etf-geography")
      .then((result) => {
        if (cancelled) return;
        setGeoResult(result);
        setGeoData(result.ok ? result.data : null);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const selectCoreEtf = (ticker) => {
    setSelectedEtf(ticker);
    if (window.matchMedia("(max-width: 720px)").matches) {
      window.setTimeout(() => {
        const title = document.querySelector(".core-detail h2");
        if (!title) return;
        const top = title.getBoundingClientRect().top + window.scrollY - 78;
        window.scrollTo({ top, behavior: "smooth" });
      }, 60);
    }
  };
  const setCoreVehicleView = (nextView) => {
    setVehicleView(nextView);
    if (!tickerMatchesVehicleView(selectedEtf, nextView)) {
      const fallback = functions.flatMap((row) => row.tickers).find((ticker) => tickerMatchesVehicleView(ticker, nextView)) || "VOO";
      setSelectedEtf(fallback);
    }
  };
  const detail = CORE_DETAILS[selectedEtf] || CORE_DETAILS.VOO;
  const geography = geoData?.instruments?.[selectedEtf];
  const countryWeights = geography?.weights || CORE_COUNTRY_WEIGHTS[selectedEtf];
  const maxCountryWeight = countryWeights ? Math.max(...countryWeights.map((row) => row[1])) : 0;

  return React.createElement(
    "main",
    { className: "tech-layout" },
    React.createElement(
      "section",
      { className: "core-layout" },
      React.createElement(
        "article",
        { className: "panel" },
        legendMode !== "fixed" || showVehicleToggle
          ? React.createElement(
              "div",
              { className: "core-legend-row" },
              React.createElement(
                    "div",
                    { className: "core-legend" },
                    legendMode === "fixed"
                      ? [
                          React.createElement("span", { className: "etf-token etf-treasury", key: "treasury" }, "Nominal Treasuries"),
                          React.createElement("span", { className: "etf-token etf-inflation", key: "inflation" }, "Inflation-linked"),
                          React.createElement("span", { className: "etf-token etf-credit", key: "credit" }, "Corporate credit"),
                          React.createElement("span", { className: "etf-token etf-aggregate", key: "aggregate" }, "Aggregate bonds"),
                        ]
                      : [
                          React.createElement("span", { className: "etf-token etf-us", key: "us" }, "US"),
                          React.createElement("span", { className: "etf-token etf-global", key: "global" }, "Developed global"),
                          React.createElement("span", { className: "etf-token etf-developed", key: "developed" }, "Developed ex-US"),
                          React.createElement("span", { className: "etf-token etf-emerging", key: "emerging" }, "Emerging markets"),
                        ]
                  ),
              showVehicleToggle
                ? React.createElement(
                    "div",
                    { className: "ucits-toggle", "aria-label": "Filter ETFs by listing type" },
                    React.createElement("button", { type: "button", "aria-pressed": vehicleView === "all", onClick: () => setCoreVehicleView("all") }, "All"),
                    React.createElement("button", { type: "button", "aria-pressed": vehicleView === "us", onClick: () => setCoreVehicleView("us") }, "US-listed"),
                    React.createElement("button", { type: "button", "aria-pressed": vehicleView === "ucits", onClick: () => setCoreVehicleView("ucits") }, "UCITS")
                  )
                : null
            )
          : null,
        React.createElement(
          "div",
          { className: "core-function-grid" },
          functions.map((row) =>
            React.createElement(
              "div",
              { className: ["equity", "fixed"].includes(legendMode) ? "core-function core-equity-family" : "core-function", key: row.fn },
              React.createElement("div", null, React.createElement("h3", null, row.fn), React.createElement("p", null, row.why), React.createElement("p", null, row.note)),
              React.createElement(
                "div",
                { className: "etf-token-grid" },
                row.tickers.map((ticker) =>
                  React.createElement("button", { className: coreTokenClass(ticker, vehicleView), type: "button", key: `${row.fn}-${ticker}`, "aria-pressed": selectedEtf === ticker, disabled: !tickerMatchesVehicleView(ticker, vehicleView), onClick: () => selectCoreEtf(ticker) }, ticker)
                )
              )
            )
          )
        )
      ),
      React.createElement(
        "aside",
        { className: "panel core-detail" },
        React.createElement(
          "div",
          { className: "instrument-detail-heading" },
          React.createElement("h2", null, selectedEtf),
          React.createElement(DataLabTickerLink, { ticker: selectedEtf, availableTickers: dataLabTickers, group: contextGroup })
        ),
        React.createElement(EtfFullNames, { instruments: selectedEtf }),
        React.createElement(EtfTradingDetails, { instruments: selectedEtf }),
        React.createElement("p", null, detail[1]),
        React.createElement("p", null, detail[2]),
        contextGroup === "Caps/Style" ? React.createElement("p", { className: "data-note" }, "Size definitions follow each index provider. S&P 500 is the common market comparison in Data Lab, not necessarily the fund’s tracked index.") : null,
        detail[4] ? React.createElement("p", { className: "data-note" }, React.createElement("a", { href: detail[4], target: "_blank", rel: "noopener noreferrer" }, "Fund information ↗")) : null,
        countryWeights
          ? React.createElement(
              "div",
              { className: "mini-country-chart" },
              React.createElement("h3", null, "Approximate geographic composition"),
              countryWeights.map(([country, weight]) =>
                React.createElement(
                  "div",
                  { className: "mini-country-row", key: `${selectedEtf}-${country}` },
                  React.createElement("span", null, country),
                  React.createElement("div", { className: "mini-country-track" }, React.createElement("div", { className: "mini-country-bar", style: { width: `${(weight / maxCountryWeight) * 100}%` } })),
                  React.createElement("span", null, `${weight.toFixed(1).replace(".", ",")}%`)
                )
              ),
              React.createElement(
                "p",
                { className: "data-note" },
                geography
                  ? `Source: ${geography.source}.`
                  : "Approximate weights by country. Source: provider factsheets and benchmarks, June 2026."
              )
            )
          : null,
        detail[3].length ? React.createElement("ul", { className: "core-detail-list" }, detail[3].map((point) => React.createElement("li", { key: point }, point))) : null
      )
    )
  );
}

function FixedIncomeModule({ dataLabTickers, initialEtf = "IB01" }) {
  return React.createElement(CoreModule, { functions: FIXED_INCOME_FUNCTIONS, initialEtf, legendMode: "fixed", showVehicleToggle: true, dataLabTickers });
}

const SECTOR_GICS_ETFS = [
  {
    tickers: ["XLK", "IUIT"],
    sector: "Information Technology",
    icon: "chip",
    tone: "sat-risk-high",
    role: "Growth / quality",
    why: "The sector covers software, semiconductors and technology infrastructure businesses.",
    limit: "Large holdings can dominate returns, and valuations are sensitive to changes in expected growth.",
    points: ["These funds isolate the information technology sector within the S&P 500.", "Its returns can be compared with the broader index to examine the contribution of technology exposure."]
  },
  {
    tickers: ["XLC", "IUCM"],
    sector: "Communication Services",
    icon: "phone",
    tone: "sat-risk-high",
    role: "Platforms / media",
    why: "The sector brings together digital platforms, media, streaming services and telecommunications.",
    limit: "Combines very different businesses and may be concentrated in a few names.",
    points: ["It captures communication-services businesses that sit outside the information technology sector.", "Company revenues depend on activities such as advertising, content subscriptions and distribution.", "The inclusion of telecoms does not make the whole portfolio defensive, because its other businesses have different risks."]
  },
  {
    tickers: ["XLY", "IUCD"],
    sector: "Consumer Discretionary",
    icon: "diamond",
    tone: "sat-risk-high",
    role: "Cyclical consumption",
    why: "The sector includes e-commerce, automobiles and other businesses dependent on discretionary consumer spending.",
    limit: "Carries economic-cycle, consumer-confidence and concentration risks.",
    points: ["The portfolio can include premium-consumption businesses and large retail platforms.", "Slower economic activity and higher financing costs can weigh on consumer demand."]
  },
  {
    tickers: ["XLB", "IUMS"],
    sector: "Materials",
    icon: "factory",
    tone: "sat-risk-medium",
    role: "Cycle / commodities",
    why: "The sector covers chemicals, metals and other materials used in industrial production.",
    limit: "Closely linked to the global cycle, the US dollar and commodity demand.",
    points: ["Company earnings are influenced by industrial production and demand for materials.", "Its exposure differs from energy producers and industrial businesses, even though their cycles can overlap.", "These funds own company shares, so returns also reflect operating costs and equity-market conditions."]
  },
  {
    tickers: ["XLE", "IUES"],
    sector: "Energy",
    icon: "oil",
    tone: "sat-risk-medium",
    role: "Traditional energy",
    why: "The sector includes oil and gas businesses whose earnings depend on energy markets and operating performance.",
    limit: "Sensitive to oil prices, geopolitics and CAPEX discipline.",
    points: ["Rising energy prices can support some producers, but their shares do not provide guaranteed protection against an energy shock.", "Shareholder returns can include distributions and the effects of company share repurchases.", "The portfolio primarily represents traditional energy businesses rather than a dedicated energy-transition strategy."]
  },
  {
    tickers: ["XLF", "IUFS"],
    sector: "Financials",
    icon: "money",
    tone: "sat-risk-medium",
    role: "Rates / credit",
    why: "The sector includes banks, insurers, payment businesses, brokers and capital-market firms.",
    limit: "Depends on the yield curve, credit conditions and the default cycle.",
    points: ["A steeper yield curve can support some financial businesses, although its effects differ across holdings."]
  },
  {
    tickers: ["XLI", "IUIS"],
    sector: "Industrials",
    icon: "factory",
    tone: "sat-risk-medium",
    role: "Cycle / CAPEX",
    why: "The sector spans industrial production, transport, defence, machinery and infrastructure-related businesses.",
    limit: "A broad ETF dilutes specific theses such as defence or reindustrialisation.",
    points: ["Company revenues are linked to investment in equipment, construction and other physical assets.", "Some holdings participate in domestic manufacturing investment and infrastructure projects.", "A selected equity basket can narrow the exposure to a specific industry, while increasing company-selection risk."]
  },
  {
    tickers: ["XLP", "IUCS"],
    sector: "Consumer Staples",
    icon: "home",
    tone: "sat-risk-defensive",
    role: "Defensive / essential consumption",
    why: "The sector includes food, beverages, household products and retailers focused on essential consumption.",
    limit: "May lag during a growth-led bull market.",
    points: ["Margins depend on input costs and on how customers respond to price changes."]
  },
  {
    tickers: ["XLV", "IUHC"],
    sector: "Health Care",
    icon: "pulse",
    tone: "sat-risk-defensive",
    role: "Defensive quality",
    why: "The sector includes pharmaceuticals, healthcare services, medical equipment and managed-care businesses.",
    limit: "Combines defensive characteristics with regulatory risk and innovation-pipeline risk.",
    points: ["Healthcare demand can be less cyclical, but profitability and business quality vary across companies.", "Demographics, research outcomes and operating scale influence the performance of the holdings.", "The broader healthcare portfolio does not isolate biotechnology or pharmaceutical exposure."]
  },
  {
    tickers: ["XLRE"],
    sector: "Real Estate",
    icon: "home",
    tone: "sat-risk-defensive",
    role: "Listed real estate",
    why: "The sector provides exposure to real-estate investment trusts and other listed property businesses.",
    limit: "Sensitive to interest rates, credit, capitalisation rates and vacancy.",
    points: ["Investors obtain property-related exposure through shares traded on an exchange.", "Financing costs, property income and valuation changes are important drivers of listed real-estate returns.", "Listed property shares have liquidity and market-price characteristics that differ from directly held property."]
  },
  {
    tickers: ["XLU", "IUUS"],
    sector: "Utilities",
    icon: "faucet",
    tone: "sat-risk-defensive",
    role: "Defensive / duration",
    why: "The sector covers utilities that provide electricity and other essential infrastructure services.",
    limit: "Sensitive to interest rates and regulation; it is not the same as a specific grid exposure.",
    points: ["Essential-service demand can be relatively stable, although utility shares remain exposed to market losses.", "Electrification and data-centre development can influence electricity demand and investment requirements.", "A utility ETF alone may not cover the equipment and engineering businesses involved in grid expansion."]
  }
];

function SectorGicsModule({ dataLabTickers, initialSector = "XLK" }) {
  const [selectedSector, setSelectedSector] = useState(initialSector);
  const [vehicleView, setVehicleView] = useState("all");
  const activeMeta = SECTOR_GICS_ETFS.find((item) => item.tickers.includes(selectedSector)) || SECTOR_GICS_ETFS[0];
  const setSectorVehicleView = (nextView) => {
    setVehicleView(nextView);
    if (!tickerMatchesVehicleView(selectedSector, nextView)) {
      const fallback = SECTOR_GICS_ETFS.flatMap((item) => item.tickers).find((ticker) => tickerMatchesVehicleView(ticker, nextView));
      if (fallback) setSelectedSector(fallback);
    }
  };

  return React.createElement(
    "main",
    { className: "core-layout sector-layout" },
    React.createElement(
      "article",
      { className: "panel" },
      React.createElement(
        "div",
        { className: "section-head" },
        React.createElement("div", null, React.createElement("span", { className: "control-title" }, "GICS sectors / S&P 500"))
      ),
      React.createElement(
        "div",
        { className: "core-legend-row sector-legend-row" },
        React.createElement(
          "div",
          { className: "risk-legend" },
          React.createElement("span", { className: "sat-risk-high" }, "Growth / concentration"),
          React.createElement("span", { className: "sat-risk-medium" }, "Cyclical / macro"),
          React.createElement("span", { className: "sat-risk-defensive" }, "Defensive / rates")
        ),
        React.createElement(
          "div",
          { className: "ucits-toggle", "aria-label": "Filter sector ETFs by listing type" },
          React.createElement("button", { type: "button", "aria-pressed": vehicleView === "all", onClick: () => setSectorVehicleView("all") }, "All"),
          React.createElement("button", { type: "button", "aria-pressed": vehicleView === "us", onClick: () => setSectorVehicleView("us") }, "US-listed"),
          React.createElement("button", { type: "button", "aria-pressed": vehicleView === "ucits", onClick: () => setSectorVehicleView("ucits") }, "UCITS")
        )
      ),
      React.createElement(
        "div",
        { className: "core-function-grid sector-function-grid" },
        SECTOR_GICS_ETFS.map((item) =>
          React.createElement(
            "div",
            {
              className: `core-function sector-function ${item.tone}`,
              key: item.sector,
            },
            React.createElement(
              "div",
              null,
              React.createElement("div", { className: "satellite-title-row" }, React.createElement(SatelliteIcon, { type: item.icon }), React.createElement("h3", null, item.sector)),
              React.createElement("p", null, item.role),
              React.createElement("p", null, item.why)
            ),
            React.createElement(
              "div",
              { className: "etf-token-grid sector-token-wrap" },
              item.tickers.map((ticker) =>
                React.createElement(
                  "button",
                  {
                    className: `etf-token sector-token ${item.tone}${vehicleView !== "all" && !tickerMatchesVehicleView(ticker, vehicleView) ? " is-muted" : ""}`,
                    type: "button",
                    key: `${item.sector}-${ticker}`,
                    "aria-pressed": selectedSector === ticker,
                    disabled: !tickerMatchesVehicleView(ticker, vehicleView),
                    onClick: () => {
                      setSelectedSector(ticker);
                      scrollToMobileDetail(".satellite-detail h2");
                    },
                  },
                  ticker
                )
              )
            )
          )
        )
      ),
      React.createElement("p", { className: "data-note" }, "Sector proxies: US-listed Select Sector SPDRs and comparable USD accumulating UCITS vehicles. UCITS indices may apply concentration caps. Real Estate is currently US-listed only. Numerical data is available in Data Lab.")
    ),
    React.createElement(
      "aside",
      { className: "panel satellite-detail core-detail" },
      React.createElement(
        "div",
        { className: `satellite-detail-head ${activeMeta.tone}` },
        React.createElement(SatelliteIcon, { type: activeMeta.icon }),
        React.createElement(
          "div",
          { className: "instrument-detail-heading" },
          React.createElement("h2", null, selectedSector),
          React.createElement(DataLabTickerLink, { ticker: selectedSector, availableTickers: dataLabTickers })
        )
      ),
      React.createElement("p", null, activeMeta.sector),
      React.createElement(EtfFullNames, { instruments: selectedSector }),
      React.createElement(EtfTradingDetails, { instruments: selectedSector }),
      React.createElement(
        "div",
        { className: "detail-grid" },
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Role"), React.createElement("strong", null, activeMeta.role)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "What it captures"), React.createElement("strong", null, activeMeta.why)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Limitation"), React.createElement("strong", null, activeMeta.limit))
      ),
      React.createElement("p", null, activeMeta.points.join(" "))
    )
  );
}

const COMMODITY_GROUPS = [
  {
    title: "Precious metals",
    icon: "diamond",
    tone: "commodity-precious",
    structure: "Physical holdings and mining equities",
    risk: "Returns depend on metal prices and vehicle structure; mining shares also reflect operating costs and company performance.",
    points: ["Physical vehicles track bullion, while miner ETFs own operating companies.", "Gold, silver, platinum and palladium respond to different monetary and industrial drivers."],
    instruments: [
      ["GLD", "SPDR Gold Shares", "Physical gold trust", "Gold"],
      ["IAU", "iShares Gold Trust", "Physical gold trust", "Gold"],
      ["GLDM", "SPDR Gold MiniShares Trust", "Physical gold trust", "Gold"],
      ["SLV", "iShares Silver Trust", "Physical silver trust", "Silver"],
      ["SIVR", "abrdn Physical Silver Shares ETF", "Physical silver trust", "Silver"],
      ["PPLT", "abrdn Physical Platinum Shares ETF", "Physical metal trust", "Platinum"],
      ["PALL", "abrdn Physical Palladium Shares ETF", "Physical metal trust", "Palladium"],
      ["GDX", "VanEck Gold Miners ETF", "US-listed equity ETF", "Global gold miners"],
      ["GDXJ", "VanEck Junior Gold Miners ETF", "US-listed equity ETF", "Junior gold miners"],
      ["SIL", "Global X Silver Miners ETF", "US-listed equity ETF", "Global silver miners"],
      ["SILJ", "Amplify Junior Silver Miners ETF", "US-listed equity ETF", "Junior silver miners"]
    ]
  },
  {
    title: "Industrial metals",
    icon: "factory",
    tone: "commodity-metals",
    structure: "Copper futures and mining equities",
    risk: "Industrial demand and inventories influence copper prices, while contract rolling and producer performance affect the respective vehicles.",
    points: ["Copper is widely used as an industrial-cycle indicator.", "CPER follows copper futures, while COPX owns copper-mining companies."],
    instruments: [
      ["CPER", "United States Copper Index Fund", "US-listed commodity pool", "Copper futures"],
      ["COPX", "Global X Copper Miners ETF", "US-listed equity ETF", "Global copper miners"]
    ]
  },
  {
    title: "Strategic materials",
    icon: "atom",
    tone: "commodity-strategic",
    structure: "Mining and materials equity portfolios",
    risk: "The holdings are exposed to commodity cycles, project execution and geopolitical risks in concentrated supply chains.",
    points: ["The group spans uranium, lithium and rare-earth value chains.", "Company revenues can be diversified beyond the material named by the theme.", "Current strategic narratives do not by themselves imply attractive investment outcomes."],
    instruments: [
      ["URA", "Global X Uranium ETF", "US-listed equity ETF", "Uranium value chain"],
      ["URNM", "Sprott Uranium Miners ETF", "US-listed equity ETF", "Uranium miners"],
      ["LIT", "Global X Lithium & Battery Tech ETF", "US-listed equity ETF", "Lithium and battery chain"],
      ["REMX", "VanEck Rare Earth and Strategic Metals ETF", "US-listed equity ETF", "Rare earths and strategic metals"]
    ]
  },
  {
    title: "Energy",
    icon: "energy",
    tone: "commodity-energy",
    structure: "Futures exposure and producer equities",
    risk: "Futures-based vehicles reflect energy prices and contract rolling; producer shares also depend on investment decisions and regulation.",
    points: ["USO, BNO and UNG obtain exposure through futures contracts.", "VDE owns energy-producing companies rather than commodity futures.", "WTI, Brent, natural gas and producer equities have different drivers and risk profiles."],
    instruments: [
      ["USO", "United States Oil Fund", "US-listed commodity pool", "WTI crude-oil futures"],
      ["BNO", "United States Brent Oil Fund", "US-listed commodity pool", "Brent crude-oil futures"],
      ["UNG", "United States Natural Gas Fund", "US-listed commodity pool", "Natural-gas futures"],
      ["VDE", "Vanguard Energy ETF", "US-listed equity ETF", "US energy producers"]
    ]
  },
  {
    title: "Agriculture & livestock",
    icon: "home",
    tone: "commodity-agriculture",
    structure: "Futures exposure and agribusiness equities",
    risk: "Weather, harvests, disease and trade policy influence supply; contract rolling and equity-market conditions create additional vehicle-specific risks.",
    points: ["Single-crop funds isolate specific agricultural futures.", "CATL is an ETC linked to live-cattle futures; MOO owns agribusiness companies."],
    instruments: [
      ["DBA", "Invesco DB Agriculture Fund", "US-listed commodity pool", "Diversified agriculture futures"],
      ["CORN", "Teucrium Corn Fund", "US-listed commodity pool", "Corn futures"],
      ["WEAT", "Teucrium Wheat Fund", "US-listed commodity pool", "Wheat futures"],
      ["SOYB", "Teucrium Soybean Fund", "US-listed commodity pool", "Soybean futures"],
      ["CATL", "WisdomTree Live Cattle", "European-listed ETC", "Live-cattle futures"],
      ["MOO", "VanEck Agribusiness ETF", "US-listed equity ETF", "Global agribusiness companies"]
    ]
  },
  {
    title: "Timber & water",
    icon: "faucet",
    tone: "commodity-resources",
    structure: "Resource-linked equity portfolios",
    risk: "Returns reflect company operations and equity valuations, alongside regulation and financing conditions.",
    points: ["These funds own companies linked to resource infrastructure and production.", "They do not track a physical timber or water spot price.", "Business mix and valuation can dominate the resource narrative."],
    instruments: [
      ["WOOD", "iShares Global Timber & Forestry ETF", "US-listed equity ETF", "Global timber and forestry companies"],
      ["PHO", "Invesco Water Resources ETF", "US-listed equity ETF", "US water infrastructure and technology"]
    ]
  },
  {
    title: "Broad baskets",
    icon: "network",
    tone: "commodity-broad",
    structure: "Diversified commodity strategies",
    risk: "Performance depends on the commodity mix, futures curves, contract-rolling rules and collateral management.",
    points: ["A single vehicle combines several commodity groups.", "Dynamic-roll rules can differ materially between products.", "Broad exposure can reduce single-commodity concentration but does not remove cyclicality."],
    instruments: [
      ["PDBC", "Invesco Optimum Yield Diversified Commodity Strategy No K-1 ETF", "US-listed ETF", "Broad commodity futures"],
      ["COMT", "iShares GSCI Commodity Dynamic Roll Strategy ETF", "US-listed ETF", "Broad commodity futures"]
    ]
  }
];

const COMMODITY_INSTRUMENTS = COMMODITY_GROUPS.flatMap((group) =>
  group.instruments.map(([ticker, name, wrapper, exposure]) => ({ ticker, name, wrapper, exposure, group }))
);

function CommodityModule({ dataLabTickers, initialEtf = "GLD" }) {
  const initial = COMMODITY_INSTRUMENTS.some((item) => item.ticker === initialEtf) ? initialEtf : "GLD";
  const [selectedEtf, setSelectedEtf] = useState(initial);
  const active = COMMODITY_INSTRUMENTS.find((item) => item.ticker === selectedEtf) || COMMODITY_INSTRUMENTS[0];

  return React.createElement(
    "main",
    { className: "core-layout commodity-layout" },
    React.createElement(
      "article",
      { className: "panel" },
      React.createElement(
        "div",
        { className: "core-function-grid commodity-function-grid" },
        COMMODITY_GROUPS.map((group) =>
          React.createElement(
            "section",
            { className: `core-function commodity-function ${group.tone}`, key: group.title },
            React.createElement(
              "div",
              null,
              React.createElement("div", { className: "satellite-title-row" }, React.createElement(SatelliteIcon, { type: group.icon }), React.createElement("h3", null, group.title)),
              React.createElement("p", null, group.structure),
              React.createElement("p", null, group.risk)
            ),
            React.createElement(
              "div",
              { className: "etf-token-grid" },
              group.instruments.map(([ticker]) =>
                React.createElement(
                  "button",
                  {
                    className: `etf-token ${group.tone}`,
                    type: "button",
                    key: `${group.title}-${ticker}`,
                    "aria-pressed": selectedEtf === ticker,
                    onClick: () => {
                      setSelectedEtf(ticker);
                      scrollToMobileDetail(".commodity-detail h2");
                    },
                  },
                  ticker
                )
              )
            )
          )
        )
      ),
      React.createElement("p", { className: "data-note" }, "Instrument map for educational comparison. Commodity vehicles can use physical holdings, futures or producer equities; those structures are not interchangeable.")
    ),
    React.createElement(
      "aside",
      { className: "panel core-detail commodity-detail" },
      React.createElement(
        "div",
        { className: "instrument-detail-heading" },
        React.createElement("h2", null, active.ticker),
        React.createElement(DataLabTickerLink, { ticker: active.ticker, availableTickers: dataLabTickers })
      ),
      React.createElement(EtfFullNames, { instruments: active.ticker }),
      React.createElement(EtfTradingDetails, { instruments: active.ticker }),
      React.createElement(
        "div",
        { className: "detail-grid" },
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Exposure"), React.createElement("strong", null, active.exposure)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Vehicle"), React.createElement("strong", null, active.wrapper)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Structure"), React.createElement("strong", null, active.group.structure)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Main distinction"), React.createElement("strong", null, active.group.risk))
      ),
      React.createElement("ul", { className: "core-detail-list" }, active.group.points.map((point) => React.createElement("li", { key: point }, point))),
      React.createElement("p", { className: "data-note" }, "Data Lab compares each instrument with U.S. CPI and the S&P 500. Informational and educational only; not investment advice.")
    )
  );
}

const ETF_SUBMODULES = [
  ["br-fixed", "Fixed Income Brazil"],
  ["br-equity", "Local Equities"],
  ["br-global", "Global Equities"],
  ["br-alternatives", "Alternatives"],
  ["br-crypto", "Crypto"],
  ["fixed", "Fixed Income"],
  ["core", "Core"],
  ["caps", "Cap/Style"],
  ["sectors", "Sectors"],
  ["satellites", "US Satellites"],
  ["europe", "European Themes"],
  ["china", "China / China+1"],
  ["commodities", "Commodities"],
  ["hedges", "Hedges & Overlays"],
  ["liquid", "Liquid Alternatives"],
];

const ETF_DESTINATIONS = new Map();

const registerEtfDestination = (ticker, tab, target) => {
  const normalizedTicker = String(ticker || "").trim().toUpperCase();
  if (!normalizedTicker || ETF_DESTINATIONS.has(normalizedTicker)) return;
  ETF_DESTINATIONS.set(normalizedTicker, { tab, target });
};

COMMODITY_INSTRUMENTS.forEach((item) => registerEtfDestination(item.ticker, "commodities", item.ticker));
FIXED_INCOME_FUNCTIONS.forEach((row) => row.tickers.forEach((ticker) => registerEtfDestination(ticker, "fixed", ticker)));
registerEtfDestination("TIP5", "fixed", "TI5A");
CAPS_FUNCTIONS.forEach((row) => row.tickers.forEach((ticker) => {
  if (!["VOO", "CSPX", "VUAA"].includes(ticker)) registerEtfDestination(ticker, "caps", ticker);
}));
CORE_EQUITY_FUNCTIONS.forEach((row) => row.tickers.forEach((ticker) => registerEtfDestination(ticker, "core", ticker)));
SECTOR_GICS_ETFS.forEach((item) => item.tickers.forEach((ticker) => registerEtfDestination(ticker, "sectors", ticker)));

[
  [["SMH", "SOXX"], "satellites", "Semiconductors / AI hardware"],
  [["ITA", "PPA"], "satellites", "US defence"],
  [["CIBR", "HACK"], "satellites", "Cybersecurity"],
  [["BOTZ", "ROBO"], "satellites", "Robotics / automation"],
  [["XLE", "GRID", "PAVE", "XLU"], "satellites", "Energy / grid"],
  [["ITB", "XHB"], "satellites", "Residential construction"],
  [["PKB"], "satellites", "Construction materials and infrastructure"],
  [["SRVR", "VPN"], "satellites", "Physical data centres"],
  [["XLI", "AIRR"], "satellites", "Onshoring / reindustrialisation"],
  [["QTUM"], "satellites", "Quantum / frontier computing"],
  [["LUXU", "GLUX"], "europe", "Luxury / indirect China"],
  [["EXV4", "XDWH"], "europe", "Pharma / healthcare"],
  [["MCHI", "FXI", "KWEB", "ASHR", "KBA"], "china", "Direct China"],
  [["COPX", "PICK"], "china", "Indirect China — commodities"],
  [["INDA", "FLIN", "EWW", "VNM", "EWT", "EWY"], "china", "China+1"],
  [["EMXC", "EXCH"], "china", "EM ex-China"],
].forEach(([tickers, tab, target]) => tickers.forEach((ticker) => registerEtfDestination(ticker, tab, target)));

Object.entries(window.GCInstrumentRegistry.HEDGE_GROUPS).forEach(([group, tickers]) => tickers.forEach((ticker) => registerEtfDestination(ticker, "hedges", ticker)));

window.GCInstrumentRegistry.LIQUID_FAMILIES.forEach((family) => Object.values(family.subgroups).flat().forEach((ticker) => registerEtfDestination(ticker, "liquid", ticker)));

const etfDestinationForTicker = (ticker) => ETF_DESTINATIONS.get(String(ticker || "").trim().toUpperCase()) || null;

const etfHrefForTicker = (ticker, group) => {
  const brazilIndex = window.GCInstrumentRegistry.BRAZIL_GROUPS.indexOf(group);
  if (brazilIndex >= 0) return `#etfs/${ETF_SUBMODULES[brazilIndex][0]}/${encodeURIComponent(ticker)}`;
  if (group === "Caps/Style" && CAPS_FUNCTIONS.some((row) => row.tickers.includes(ticker))) return `#etfs/caps/${encodeURIComponent(ticker)}`;
  if (group === "Hedges & Overlays") { const match = Object.entries(window.GCInstrumentRegistry.HEDGE_GROUPS).find(([, tickers]) => tickers.includes(ticker)); if (match) return `#etfs/hedges/${encodeURIComponent(ticker)}`; }
  const destination = etfDestinationForTicker(ticker);
  return destination ? `#etfs/${destination.tab}/${encodeURIComponent(destination.target)}` : null;
};

const requestedEtfDestination = () => {
  const [module, tab, encodedTarget] = window.location.hash.replace(/^#/, "").split("/").filter(Boolean);
  if (module !== "etfs" || !ETF_SUBMODULES.some(([key]) => key === tab)) return null;
  if (!encodedTarget) return { tab, target: null };
  try {
    return { tab, target: decodeURIComponent(encodedTarget) };
  } catch (_error) {
    return { tab, target: null };
  }
};

const BRAZIL_FAMILIES = {
  "Core": ["Broad Brazilian equity exposure through the Ibovespa.", "Index weights can concentrate exposure in large companies and sectors."],
  "Small caps": ["Smaller Brazilian listed companies, following the B3 Small Cap index.", "A distinct size exposure with greater sensitivity to domestic business conditions."],
  "Dividends / style": ["Brazilian companies selected through the B3 Dividend index.", "Dividend-oriented selection remains an equity strategy, not a fixed-income substitute."],
  "Financials": ["Brazilian financial-sector exposure through the IFNC index.", "A sector allocation rather than a diversified Brazilian equity core."],
  "S&P 500": ["Large US companies through a B3-listed vehicle.", "Returns in reais combine underlying equity performance and currency exposure."],
  "Nasdaq-100": ["Large non-financial Nasdaq companies with a substantial growth and technology allocation.", "The portfolio is more concentrated than a broad US equity benchmark."],
  "Floating rate": ["Brazilian Treasury Selic securities with low interest-rate sensitivity.", "CDI provides a comparison reference; fund returns include costs and market-price effects."],
  "Target duration": ["A mix of Selic-linked and inflation-linked Treasury securities targeting a 760-day repricing term.", "The PMR target is not the same as modified duration or the fund's maturity date."],
  "Fixed rate": ["Brazilian fixed-rate government bonds through IRF-M P2, IRF-M P3 and the Teva five-year repricing strategy.", "Portfolio term rules differ by index. Prices respond to changes in nominal yields before the underlying bonds mature."],
  "Short inflation-linked": ["IPCA-linked Treasury bonds with maturities up to five years.", "Shorter maturities moderate exposure to changes in real interest rates."],
  "Broad inflation-linked": ["IPCA-linked Treasury exposure across the maturity curve.", "The broad basket combines inflation adjustment with sensitivity to real yields."],
  "Long inflation-linked": ["Long and ultra-long IPCA-linked Treasury exposure, with different maturity and weighting rules by fund.", "IB5M11 follows IMA-B5+; PACB11 concentrates on the three longest-dated eligible bonds. Both are sensitive to real-rate movements."],
  "Private credit": ["DI-linked corporate debentures and eligible Treasury Selic securities.", "Credit spreads and issuer risk distinguish this exposure from government bonds."],
  "Gold": ["Gold exposure through a B3-listed vehicle.", "Returns in reais reflect the metal and currency exposure, rather than mining-company earnings."],
  "Crypto basket": ["A rules-based basket of cryptoassets through the Nasdaq CME Crypto Index.", "Holdings and weights evolve with index reviews; diversification does not remove crypto volatility."],
  "Bitcoin": ["Dedicated Bitcoin exposure through a B3-listed fund.", "The exchange session is shorter than the continuous trading week of the underlying asset."]
};

const LIQUID_SUBFAMILY_SUMMARIES = {
  "Broad Managed Futures": "Systematic long/short strategies across multiple futures markets, seeking diversified returns from trends and other market signals.",
  "Trend Following": "Systematic long/short strategies designed to capture persistent price trends across markets.",
  "Market Neutral / Anti-Beta": "Equity strategies designed to reduce broad market exposure and generate returns from relative stock performance.",
  "Long/Short Equity": "Strategies combining long and short equity positions to pursue alpha while controlling overall market exposure.",
  "Merger Arbitrage": "Event-driven strategies seeking to capture the spread between a target company’s market price and its announced acquisition price.",
  "Broad / Absolute Return Macro": "Flexible cross-asset strategies seeking positive returns from macroeconomic trends, policy divergence and market dislocations.",
  "Macro Momentum / Tactical": "Dynamic strategies that rotate exposures using momentum, trend and macroeconomic signals."
};

function LiquidAlternativesModule({ items, initialEtf, dataLabTickers }) {
  const [selected, setSelected] = useState(initialEtf || "DBMF");
  const active = items.find((item) => item.ticker === selected) || items[0];
  if (!active) return React.createElement("p", { className: "data-note" }, "Loading Liquid Alternatives...");
  return React.createElement("div", { className: "core-layout" },
    React.createElement("article", { className: "panel" },
      React.createElement("div", { className: "core-function-grid" }, window.GCInstrumentRegistry.LIQUID_FAMILIES.map((family) =>
        React.createElement("section", { className: "core-function hedge-function", style: { "--family-accent": window.GCInstrumentRegistry.subgroupTone(family.name) }, key: family.name },
          React.createElement("div", null, React.createElement("h3", null, family.name), React.createElement("p", null, family.summary)),
          React.createElement("div", null, Object.entries(family.subgroups).map(([sub, tickers]) =>
            React.createElement("div", { key: sub, className: "liquid-subfamily-block" },
              React.createElement("p", { className: "liquid-subfamily" }, sub),
              React.createElement("p", { className: "liquid-subfamily-summary" }, LIQUID_SUBFAMILY_SUMMARIES[sub]),
              React.createElement("div", { className: "etf-token-grid" }, tickers.map((ticker) =>
                React.createElement("button", { key: ticker, type: "button", className: "etf-token etf-us", "aria-pressed": active.ticker === ticker,
                  onClick: () => { setSelected(ticker); scrollToMobileDetail(".liquid-detail h2"); } }, ticker)))))))))),
    React.createElement("aside", { className: "panel core-detail liquid-detail" },
      React.createElement("div", { className: "instrument-detail-heading" }, React.createElement("h2", null, active.ticker),
        React.createElement(DataLabTickerLink, { ticker: active.ticker, availableTickers: dataLabTickers, label: "DataLabs" })),
      React.createElement("div", { className: "detail-role" }, active.name),
      React.createElement("div", { className: "etf-trading-details data-note" }, `Exchange: ${active.exchange} · Trading currency: USD (US dollar) · Listing: ${active.quoteSymbol}`),
      React.createElement(EtfFundAssets, { instruments: active.ticker }),
      React.createElement("p", null, active.description), React.createElement("p", null, active.detail),
      React.createElement("p", { className: "data-note" }, "DataLab compares the strategy with the S&P 500 and accrued Fed Funds. These are comparison references, not tracked indices. Fed Funds represents a synthetic cash return compounded daily before fees and taxes."),
      React.createElement("a", { className: "data-note", href: active.sourceUrl, target: "_blank", rel: "noopener noreferrer" }, "Fund information ↗")));
}

function BrazilEtfsModule({ items, initialEtf, dataLabTickers }) {
  const [selected, setSelected] = useState(initialEtf || items[0]?.ticker);
  const active = items.find((item) => item.ticker === selected) || items[0];
  if (!active) return React.createElement("p", { className: "data-note" }, "Loading Brazil ETFs...");
  const groups = [...new Set(items.map((item) => item.displaySubgroup))];
  return React.createElement("div", { className: "tech-layout" }, React.createElement("section", { className: "core-layout" },
    React.createElement("article", { className: "panel" },
      React.createElement("div", { className: "core-function-grid" }, groups.map((group) =>
        React.createElement("div", { className: "core-function", key: group },
          React.createElement("div", null, React.createElement("h3", null, group),
            (BRAZIL_FAMILIES[group] || []).map((text) => React.createElement("p", { key: text }, text))),
          React.createElement("div", { className: "etf-token-grid" }, items.filter((item) => item.displaySubgroup === group).map((item) =>
            React.createElement("button", { type: "button", key: item.ticker, className: "etf-token etf-emerging", "aria-pressed": active.ticker === item.ticker,
              onClick: () => { setSelected(item.ticker); scrollToMobileDetail(".core-detail"); } }, item.ticker))))))),
    React.createElement("aside", { className: "panel core-detail" },
      React.createElement("div", { className: "instrument-detail-heading" }, React.createElement("h2", null, active.ticker),
        React.createElement(DataLabTickerLink, { ticker: active.ticker, availableTickers: dataLabTickers, group: active.displayGroup })),
      React.createElement("div", { className: "detail-role" }, active.name),
      React.createElement("div", { className: "etf-trading-details data-note" }, `Exchange: B3 · Trading currency: BRL (Brazilian real) · Listing: ${active.quoteSymbol}`),
      React.createElement(EtfFundAssets, { instruments: active.ticker }),
      React.createElement("p", null, active.description), React.createElement("p", null, active.detail),
      active.durationNote ? React.createElement("p", null, active.durationNote) : null,
      React.createElement("p", { className: "data-note" }, `Tracked index: ${active.trackedIndex}`),
      React.createElement("a", { className: "data-note", href: active.sourceUrl, target: "_blank", rel: "noopener noreferrer" }, "Fund information ↗"))));
}


const STRATEGY_GLOSSARY = [
  {
    "title": "Broad Managed Futures",
    "paragraphs": [
      "Systematic strategies that take long and short positions across futures markets such as equities, government bonds, currencies and commodities. Portfolio exposures may be driven by trend, momentum, carry and other quantitative signals rather than by a single directional market view.",
      "**Primary objective:** Generate diversified absolute returns with low dependence on traditional equity and bond markets.",
      "**Typically works best when:** Strong and persistent cross-asset trends develop.",
      "**Can struggle when:** Markets are range-bound, highly volatile without direction, or repeatedly reverse trends."
    ]
  },
  {
    "title": "Trend Following",
    "paragraphs": [
      "A systematic investment approach that increases long exposure to markets exhibiting persistent upward trends and short exposure to markets exhibiting persistent downward trends. Signals are generally derived from price behavior over multiple time horizons.",
      "Unlike broader managed futures strategies, trend following is specifically focused on exploiting the persistence of directional market moves.",
      "**Primary objective:** Capture sustained trends regardless of whether markets are rising or falling.",
      "**Typically works best when:** Clear and durable directional trends exist across multiple markets.",
      "**Can struggle when:** Trends reverse rapidly or markets remain choppy and directionless."
    ]
  },
  {
    "title": "Market Neutral / Anti-Beta",
    "paragraphs": [
      "Equity strategies designed to minimize exposure to the overall direction of the stock market. Market-neutral portfolios generally balance long and short positions, while anti-beta strategies may systematically favor lower-beta stocks and short higher-beta stocks.",
      "Returns are therefore intended to depend more on relative security performance than on whether the equity market rises or falls.",
      "**Primary objective:** Generate equity-related returns with limited broad-market beta.",
      "**Typically works best when:** Stock dispersion is high and relative winners and losers can be differentiated.",
      "**Can struggle when:** Markets move sharply in a highly synchronized manner or factor relationships reverse abruptly."
    ]
  },
  {
    "title": "Long/Short Equity",
    "paragraphs": [
      "Strategies that hold long positions in equities expected to outperform while shorting equities expected to underperform. Net market exposure can vary substantially depending on the strategy and investment process.",
      "Unlike market-neutral strategies, long/short equity portfolios may deliberately retain meaningful positive or negative equity beta.",
      "**Primary objective:** Generate alpha from stock selection while reducing dependence on overall market direction.",
      "**Typically works best when:** Fundamental or factor dispersion between companies is significant.",
      "**Can struggle when:** Markets become highly correlated and stock-specific differentiation weakens."
    ]
  },
  {
    "title": "Merger Arbitrage",
    "paragraphs": [
      "An event-driven strategy focused on announced corporate acquisitions. The strategy typically buys shares of the acquisition target below the announced transaction price and seeks to earn the remaining deal spread if the transaction closes successfully.",
      "The return reflects compensation for deal timing, financing uncertainty, regulatory risk and the possibility that the transaction fails.",
      "**Primary objective:** Capture acquisition spreads with relatively low sensitivity to broad equity markets.",
      "**Typically works best when:** M&A activity is strong and announced transactions close as expected.",
      "**Can struggle when:** Deals break, regulatory intervention increases, financing conditions deteriorate or spreads become excessively compressed."
    ]
  },
  {
    "title": "Broad / Absolute Return Macro",
    "paragraphs": [
      "Flexible strategies that take positions across equities, bonds, currencies, commodities and interest rates based on macroeconomic conditions, monetary policy, valuation, relative value and regime changes.",
      "Positions may be directional or relative-value and can differ substantially across countries and asset classes.",
      "**Primary objective:** Generate positive absolute returns across different market environments rather than track a traditional benchmark.",
      "**Typically works best when:** Economic regimes, monetary policies and asset-class behavior diverge meaningfully.",
      "**Can struggle when:** Volatility is suppressed, macro conditions are highly synchronized or market moves repeatedly invalidate macro views."
    ]
  },
  {
    "title": "Macro Momentum / Tactical",
    "paragraphs": [
      "Dynamic strategies that adjust or rotate market exposures according to momentum, trend, relative strength and macroeconomic signals. Allocations may shift materially as market leadership and economic conditions evolve.",
      "Compared with broad global macro, these strategies generally rely more heavily on systematic tactical signals and may retain significant exposure to traditional market beta.",
      "**Primary objective:** Participate in strengthening market trends while reducing exposure to deteriorating assets or regimes.",
      "**Typically works best when:** Market leadership is persistent and tactical signals remain stable.",
      "**Can struggle when:** Leadership changes rapidly, signals whipsaw or markets experience sharp reversals."
    ]
  }
];
function StrategyGlossary() {
  const dialog = React.useRef(null);
  const trigger = React.useRef(null);
  const close = () => { dialog.current.close(); trigger.current.focus(); };
  return React.createElement(React.Fragment, null,
    React.createElement("div", { className: "strategy-glossary-toolbar" },
      React.createElement("button", { type: "button", ref: trigger, "aria-haspopup": "dialog", onClick: () => dialog.current.showModal() }, "Strategy Glossary")),
    React.createElement("dialog", { ref: dialog, className: "strategy-glossary-panel", "aria-labelledby": "strategy-glossary-title", onClick: (event) => { if (event.target === dialog.current) close(); } },
      React.createElement("div", { className: "strategy-glossary-content" },
        React.createElement("header", { className: "strategy-glossary-header" },
          React.createElement("h2", { id: "strategy-glossary-title" }, "Strategy Glossary"),
          React.createElement("button", { type: "button", onClick: close, "aria-label": "Close strategy glossary", autoFocus: true }, "Close")),
        React.createElement("p", { className: "data-note" }, "Liquid Alternatives — strategy definitions"),
        STRATEGY_GLOSSARY.map(({title, paragraphs}) => React.createElement("section", { key: title, className: "strategy-glossary-entry" },
          React.createElement("h3", null, title),
          paragraphs.map((text, index) => {
            const labelled = text.match(/^\*\*(.+?)\*\*\s*(.*)$/);
            return React.createElement("p", { key: index }, labelled ? React.createElement("strong", null, labelled[1] + " ") : null, labelled ? labelled[2] : text);
          }))))));
}

function EtfsModule() {
  const [routeDestination, setRouteDestination] = useState(() => requestedEtfDestination());
  const [activeEtfTab, setActiveEtfTab] = useState(() => routeDestination?.tab || "fixed");
  const [dataLabTickers, setDataLabTickers] = useState(() => new Set());
  const [catalogItems, setCatalogItems] = useState([]);
  const brazilMarket = activeEtfTab.startsWith("br-");
  const assetClasses = window.GCInstrumentRegistry.GLOBAL_ASSET_CLASSES;
  const activeAssetClass = assetClasses.find((item) => item.tabs.includes(activeEtfTab)) || assetClasses[0];

  useEffect(() => {
    const syncEtfRoute = () => {
      const nextDestination = requestedEtfDestination();
      if (!nextDestination) return;
      setRouteDestination(nextDestination);
      setActiveEtfTab(nextDestination.tab);
    };
    window.addEventListener("hashchange", syncEtfRoute);
    return () => window.removeEventListener("hashchange", syncEtfRoute);
  }, []);

  useEffect(() => {
    let cancelled = false;
    DataClient.load("etf-universe").then((result) => {
      if (cancelled || !result.ok) return;
      setDataLabTickers(new Set((result.data?.instruments || []).map((item) => item.ticker)));
      setCatalogItems(result.data?.instruments || []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const renderActive = () => {
    const requestedTarget = routeDestination?.tab === activeEtfTab ? routeDestination.target : null;
    if (brazilMarket) {
      const group = window.GCInstrumentRegistry.BRAZIL_GROUPS[ETF_SUBMODULES.findIndex(([key]) => key === activeEtfTab)];
      return React.createElement(BrazilEtfsModule, { key: `${activeEtfTab}-${requestedTarget || "default"}`, items: catalogItems.filter((item) => item.market === "Brazil" && item.displayGroup === group), initialEtf: requestedTarget, dataLabTickers });
    }
    if (activeEtfTab === "liquid") return React.createElement(LiquidAlternativesModule, { key: `liquid-${requestedTarget || "default"}`, items: catalogItems.filter((item) => item.displayGroup === "Liquid Alternatives"), initialEtf: requestedTarget, dataLabTickers });
    if (activeEtfTab === "caps") return React.createElement(CoreModule, { key: `caps-${requestedTarget || "default"}`, functions: CAPS_FUNCTIONS, contextGroup: "Caps/Style", dataLabTickers, initialEtf: CAPS_FUNCTIONS.some((row) => row.tickers.includes(requestedTarget)) ? requestedTarget : "VOO" });
    if (activeEtfTab === "core") return React.createElement(CoreModule, { key: `core-${requestedTarget || "default"}`, dataLabTickers, initialEtf: requestedTarget || "VOO" });
    if (activeEtfTab === "fixed") return React.createElement(FixedIncomeModule, { key: `fixed-${requestedTarget || "default"}`, dataLabTickers, initialEtf: requestedTarget || "IB01" });
    if (activeEtfTab === "sectors") return React.createElement(SectorGicsModule, { key: `sectors-${requestedTarget || "default"}`, dataLabTickers, initialSector: requestedTarget || "XLK" });
    if (activeEtfTab === "commodities") return React.createElement(CommodityModule, { key: `commodities-${requestedTarget || "default"}`, dataLabTickers, initialEtf: requestedTarget || "GLD" });
    if (activeEtfTab === "satellites") return React.createElement(SatelliteModule, { key: `satellites-${requestedTarget || "default"}`, initialTheme: requestedTarget || "Semiconductors / AI hardware" });
    if (activeEtfTab === "europe") return React.createElement(EuropeModule, { key: `europe-${requestedTarget || "default"}`, initialTheme: requestedTarget || "European defence" });
    if (activeEtfTab === "china") return React.createElement(ChinaModule, { key: `china-${requestedTarget || "default"}`, initialTheme: requestedTarget || "Direct China" });
    return React.createElement(HedgeModule, { key: `hedges-${requestedTarget || "default"}`, initialTheme: requestedTarget || "Option Income", dataLabTickers });
  };

  return React.createElement(
    "main",
    { className: "etf-shell work-surface" },
    React.createElement("nav", { className: "panel etf-subtabs market-tabs", "aria-label": "Listing market" },
      ["Global", "Brazil"].map((market) => React.createElement("button", { key: market, type: "button", "aria-pressed": (brazilMarket ? "Brazil" : "Global") === market,
        onClick: () => { const tab = market === "Brazil" ? "br-fixed" : "fixed"; setActiveEtfTab(tab); setRouteDestination({ tab, target: null }); window.history.replaceState(null, "", `#etfs/${tab}`); }
      }, market === "Brazil" ? "BRAZILIAN ETFS" : "GLOBAL ETFS"))),
    !brazilMarket ? React.createElement("nav", { className: "panel etf-subtabs", "aria-label": "Asset classes" },
      assetClasses.map((item) => React.createElement("button", {
        key: item.label, type: "button", "aria-pressed": activeAssetClass === item,
        onClick: () => { const tab = item.tabs[0]; setActiveEtfTab(tab); setRouteDestination({ tab, target: null }); window.history.replaceState(null, "", `#etfs/${tab}`); }
      }, item.label))) : null,
    (brazilMarket || activeAssetClass.tabs.length > 1) ? React.createElement(
      "nav",
      { className: "panel etf-subtabs", "aria-label": "ETF submodules" },
      ETF_SUBMODULES.filter(([key]) => brazilMarket ? key.startsWith("br-") : activeAssetClass.tabs.includes(key)).map(([key, label]) =>
        React.createElement(
          "button",
          {
            key,
            type: "button",
            "aria-pressed": activeEtfTab === key,
            onClick: () => {
              setActiveEtfTab(key);
              setRouteDestination({ tab: key, target: null });
              window.history.replaceState({ module: "etfs", etfTab: key }, "", `#etfs/${key}`);
            },
          },
          label
        )
      )
    ) : null,
    activeEtfTab === "liquid" ? React.createElement(StrategyGlossary) : null,
    renderActive()
  );
}

window.GCEtfs = {
  EtfsModule,
  HedgeIdeasModule,
  etfDestinationForTicker,
  etfHrefForTicker,
};
})();
