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

const CORE_TOKEN_GROUPS = {
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
  VOO: ["US structural beta", "Tracks the S&P 500 and provides broad exposure to large US companies.", "Its role as a long-term equity holding differs from using SPY for frequent options trades.", ["The fund provides index exposure within a single US-listed vehicle.", "Its US listing and distribution policy are relevant when comparing it with UCITS alternatives.", "Holding the fund leaves the portfolio exposed to changes in US equity prices."]],
  CSPX: ["US structural beta", "Provides S&P 500 exposure through an accumulating UCITS ETF.", "Income is reinvested within the fund rather than paid out as cash distributions.", ["The fund offers a UCITS structure for exposure to large US companies.", "Accumulation changes how income is handled; it does not remove equity-market risk.", "Its trading and options markets differ from those available for SPY."]],
  VUAA: ["US structural beta", "Tracks the S&P 500 through an accumulating UCITS ETF.", "The fund reinvests income and provides ongoing exposure to large US companies.", ["The accumulating structure keeps distributions invested within the fund.", "Its domicile and listing distinguish it from US-listed S&P 500 ETFs.", "It remains exposed to the same broad US equity-market movements as its benchmark."]],
  SPY: ["US execution / hedge", "Provides S&P 500 exposure through an ETF with an established market for trading and options.", "The fund can be used for equity exposure or as the underlying instrument for options strategies.", ["Puts, collars and other options structures can be implemented using SPY options.", "Trading liquidity matters when entering, adjusting or closing a position.", "Its listing, distributions and costs should be distinguished from those of accumulating UCITS funds."]],
  QQQ: ["Tactical growth / hedge", "Tracks the Nasdaq-100 and has an established market for trading and options.", "Its growth-oriented composition creates a different exposure from a broad US equity index.", ["The ETF can be traded directly or used as the underlying instrument for options strategies.", "QQQM and UCITS alternatives offer other structures for Nasdaq-100 exposure.", "Concentration in large growth and technology-related companies is a defining feature of the exposure."]],
  QQQM: ["Structural growth", "Provides Nasdaq-100 exposure in a vehicle positioned for long-term index holdings.", "Its trading profile differs from QQQ, even though both follow the same index.", ["The fund retains the growth and company concentration of the Nasdaq-100.", "Costs and trading liquidity are separate considerations when comparing it with QQQ.", "A longer holding period does not remove the risk of losses in the underlying equities."]],
  CNDX: ["Structural growth", "Provides Nasdaq-100 exposure through an accumulating UCITS ETF.", "The fund reinvests income within a UCITS structure.", ["It offers another vehicle for holding the growth-oriented Nasdaq-100 index.", "Its listing and distribution policy differ from those of QQQ.", "The UCITS structure does not reduce the concentration inherent in the index."]],
  EQQQ: ["Structural growth", "Invesco EQQQ NASDAQ-100 UCITS ETF Dist.", "Distribution, cost and trading currency differ from accumulating alternatives.", ["A European alternative for Nasdaq-100 exposure.", "Distributes income rather than reinvesting it within the fund.", "Compare with CNDX according to domicile and distribution policy."]],
  RSP: ["Concentration reduction", "Tracks an equal-weighted version of the S&P 500.", "Equal weighting reduces the dominance of the largest companies while changing the portfolio composition.", ["Smaller index constituents receive more weight than in the market-cap-weighted S&P 500.", "Sector weights and sensitivity to the economic cycle can consequently differ.", "Lower concentration does not guarantee higher returns or protection during a market decline."]],
  VEA: ["Developed ex-US core", "Provides exposure to developed equity markets outside the United States.", "Its geographic and sector mix differs from that of a US equity portfolio.", ["The portfolio covers developed markets including Europe, Japan and the Pacific.", "It adds international exposure rather than replicating the S&P 500.", "Combining it with regional funds can create overlapping holdings."]],
  IEFA: ["Developed ex-US core", "Provides broad exposure to developed equity markets outside the United States and Canada.", "Geographic diversification also changes the mix of sectors and companies in the portfolio.", ["The fund offers a broad allocation across its developed-market universe.", "It can overlap with European and other regional equity ETFs.", "Index coverage, costs and listing are relevant when comparing it with other international funds."]],
  IWDA: ["Developed global core", "Tracks the MSCI World Index through a UCITS ETF.", "The index includes US companies, so it can overlap substantially with an S&P 500 allocation.", ["The fund brings several developed equity markets into one vehicle.", "A global label does not imply equal weights across countries.", "Its US holdings should be considered alongside any separate VOO, CSPX or VUAA position."]],
  SWDA: ["Developed global core", "Provides accumulating UCITS exposure to the MSCI World Index.", "The portfolio includes a substantial US allocation and is not an ex-US fund.", ["Income is reinvested within the fund.", "The portfolio covers developed markets through one index-based vehicle.", "Combining it with US equity funds increases overlap with its existing US holdings."]],
  VGK: ["European core", "Provides broad exposure to European equities.", "A regional index combines businesses with different sector and economic drivers.", ["The fund offers a single vehicle for European equity exposure.", "Its holdings can overlap with global and developed ex-US ETFs.", "It does not isolate specific themes such as luxury goods, defence or digital infrastructure."]],
  IEUR: ["European core", "Provides broad European equity exposure through an iShares ETF.", "Its role is regional diversification across companies and sectors.", ["The fund can form part of a broader developed-market allocation.", "It can overlap with the European holdings of VEA and IEFA.", "Costs, listing and trading liquidity distinguish it from other European equity vehicles."]],
  FEZ: ["European core", "Tracks the EURO STOXX 50, which represents large companies in the eurozone.", "Its narrower universe creates a more concentrated exposure than a broad European equity fund.", ["The portfolio focuses on eurozone blue-chip companies.", "Large individual constituents can have a significant influence on returns.", "Eurozone exposure does not cover the whole European equity market."]],
  IMEU: ["European core", "Provides MSCI Europe exposure through the iShares Core MSCI Europe UCITS ETF EUR Dist.", "The share class distributes income and is available through listings in different trading currencies.", ["The fund holds a broad portfolio of developed European equities.", "The trading currency of the selected listing is shown separately from the share-class currency.", "Its UCITS structure and index coverage distinguish it from VGK, IEUR and FEZ."]],
  VWO: ["Broad emerging markets", "Provides diversified exposure to emerging-market equities.", "Country weights, including the allocation to China, influence the overall risk profile.", ["The fund combines companies across several emerging markets.", "It can overlap with funds focused on individual countries or regions.", "Currency, political and economic developments in those markets affect returns."]],
  IEMG: ["Broad emerging markets", "Provides emerging-market equity exposure across large, mid-sized and small companies.", "The portfolio includes China rather than excluding it from the investment universe.", ["Its coverage extends beyond the largest emerging-market companies.", "Country and sector weights determine the sources of concentration.", "An ex-China fund represents a different allocation rather than an equivalent substitute."]],
  EIMI: ["Broad emerging markets", "Provides broad emerging-market equity exposure through a UCITS ETF.", "Country concentration and differences from the benchmark remain relevant to its performance.", ["The UCITS structure offers an alternative to US-listed emerging-market funds.", "A broad portfolio still carries risks associated with individual countries.", "The share class and trading currency are separate characteristics of the vehicle."]],
  EMXC: ["Emerging markets ex-China", "Provides emerging-market equity exposure while excluding China from the index.", "Removing Chinese equities changes the portfolio weights; it does not eliminate geopolitical risk.", ["Other markets, including India and Taiwan, receive a greater relative weight.", "The portfolio can still be affected by trade and economic links with China.", "Its returns can differ materially from those of an emerging-market index that includes China."]],
  EXCH: ["Emerging markets ex-China", "Provides emerging-market exposure excluding China through an accumulating UCITS ETF.", "The allocation separates direct Chinese equity exposure from the rest of the emerging-market universe.", ["Income is reinvested within the fund.", "The remaining countries retain their own market, currency and geopolitical risks.", "Combining it with VWO, IEMG or EIMI changes the portfolio country weights and creates overlap."]],
  IB01: ["USD liquidity", "iShares $ Treasury Bond 0-1yr UCITS ETF USD Acc.", "The fund holds very short-dated US Treasuries, with lower interest-rate sensitivity than longer-maturity bond funds.", ["The underlying Treasury holdings generate income while maintaining a short maturity profile.", "Short maturities limit interest-rate sensitivity, although the ETF price can still fluctuate.", "The accumulating share class reinvests income within the fund."]],
  IBTA: ["Short duration", "iShares $ Treasury Bond 1-3yr UCITS ETF USD Acc.", "Short-maturity bonds generally respond less to interest-rate changes than longer-maturity bonds.", ["The 1–3 year maturity range adds interest-rate exposure beyond Treasury bills.", "Income and price movements both contribute to the return on these short-term bonds.", "This maturity range sits between Treasury bills and intermediate-term Treasury exposure."]],
  CBU7: ["Short-intermediate duration", "iShares $ Treasury Bond 3-7yr UCITS ETF USD Acc.", "The fund focuses on the 3–7 year segment of the US Treasury market.", ["Returns combine bond income with price changes as Treasury yields move.", "Falling yields can support prices, while rising yields can cause losses.", "The maturity range can be combined with shorter and longer Treasury exposures."]],
  IB7A: ["Intermediate duration", "iShares $ Treasury Bond 7-10yr UCITS ETF USD Acc.", "The fund provides intermediate-maturity Treasury exposure, whose price generally rises when the relevant yields fall.", ["Price movements reflect changes in yields across the 7–10 year maturity range.", "A decline in the relevant yields can generate price gains in addition to bond income.", "The longer maturity range brings more price sensitivity than short-term Treasury holdings."]],
  DTLA: ["Long duration", "iShares $ Treasury Bond 20+yr UCITS ETF USD Acc.", "Long-maturity Treasuries carry substantial exposure to changes in long-term interest rates.", ["Small changes in long-term yields can produce large changes in the fund price.", "Falling long-term yields support bond prices, while rising yields have the opposite effect.", "The fund can experience substantial price volatility despite holding government bonds."]],
  TI5A: ["Short inflation", "iShares $ TIPS 0-5 UCITS ETF USD Acc.", "The fund holds shorter-maturity inflation-linked Treasuries, combining inflation adjustments with exposure to real yields.", ["The return reflects inflation adjustments, bond income and changes in real yields.", "Its shorter maturity range limits real-rate sensitivity relative to longer-duration TIPS funds.", "Inflation linkage does not prevent losses when real yields rise."]],
  IDTP: ["Broad inflation", "iShares $ TIPS UCITS ETF USD Acc.", "A broader TIPS maturity range adds real-rate sensitivity alongside inflation adjustments.", ["The underlying Treasury securities adjust for measured inflation.", "Changes in real yields can have a significant effect on the fund price.", "The broader maturity range creates a different risk profile from a short-term TIPS fund."]],
  LQDA: ["USD investment-grade credit", "iShares $ Corp Bond UCITS ETF USD Acc.", "The fund holds investment-grade corporate bonds denominated in US dollars.", ["Corporate bonds add exposure to credit spreads alongside interest-rate risk.", "Does not replace Treasuries as a crisis hedge.", "Prices depend on Treasury yields, credit spreads and the financial condition of the issuers."]],
  IHYA: ["USD high yield", "iShares $ High Yield Corp Bond UCITS ETF USD Acc.", "The fund holds high-yield corporate bonds, which carry greater credit risk than investment-grade debt.", ["Higher credit spreads compensate for greater default risk and uncertainty about recoveries.", "Stronger credit conditions can support prices, while widening spreads can reduce returns.", "It is not usually treated as defensive fixed income."]],
  AGGU: ["Global core bonds", "iShares Core Global Aggregate Bond UCITS ETF USD Hedged Acc.", "The fund combines global bond exposure with currency hedging to the US dollar.", ["Its portfolio includes government bonds and credit exposure from global markets.", "The broad investment universe differs from a fund focused on one country or bond segment.", "Currency hedging, duration and composition change its role as a core holding."]],
  SGOV: ["USD liquidity", "iShares 0-3 Month Treasury Bond ETF.", "Very short US Treasury exposure in a US-listed distributing vehicle.", ["Tracks Treasury bills with minimal duration.", "Monthly distributions differ from an accumulating UCITS structure.", "Market price can still vary even with very short maturity exposure."]],
  SHY: ["Short duration", "iShares 1-3 Year Treasury Bond ETF.", "Short US Treasury exposure through a US-listed vehicle.", ["Adds limited duration beyond Treasury bills.", "Distributes income monthly.", "Rate sensitivity is lower than in intermediate and long Treasury funds."]],
  IEI: ["Short-intermediate duration", "iShares 3-7 Year Treasury Bond ETF.", "The fund holds US Treasuries in the 3–7 year maturity range through a US-listed vehicle.", ["Combines more duration with government-credit exposure.", "Distributes income monthly.", "Price sensitivity rises as maturity extends."]],
  IEF: ["Intermediate duration", "iShares 7-10 Year Treasury Bond ETF.", "Intermediate US Treasury exposure through a US-listed vehicle.", ["Has greater sensitivity to changes in medium-term yields.", "Distributes income monthly.", "Its role differs from both cash-like and long-duration Treasury funds."]],
  TLT: ["Long duration", "iShares 20+ Year Treasury Bond ETF.", "Long US Treasury exposure through a US-listed vehicle.", ["Carries substantial sensitivity to long-term yields.", "Distributes income monthly.", "Price volatility can be material despite the government-bond holdings."]],
  STIP: ["Short inflation", "iShares 0-5 Year TIPS Bond ETF.", "Short-maturity US inflation-linked bonds in a US-listed vehicle.", ["Combines realised-inflation exposure with lower duration.", "Distributes income monthly.", "Real-rate changes still affect market value."]],
  TIP: ["Broad inflation", "iShares TIPS Bond ETF.", "Broad US inflation-linked Treasury exposure in a US-listed vehicle.", ["Includes more duration than a short TIPS fund.", "Distributes income monthly.", "Performance reflects both inflation adjustments and changes in real yields."]],
  LQD: ["USD investment-grade credit", "iShares iBoxx $ Investment Grade Corporate Bond ETF.", "US dollar investment-grade corporate-bond exposure.", ["Adds corporate spread exposure to fixed income.", "Distributes income monthly.", "Credit spreads and duration both affect performance."]],
  HYG: ["USD high yield", "iShares iBoxx $ High Yield Corporate Bond ETF.", "US dollar below-investment-grade corporate-bond exposure.", ["Carries greater credit and default risk than investment-grade funds.", "Distributes income monthly.", "Its behaviour is more cyclical than government-bond exposure."]],
  AGG: ["US core bonds", "iShares Core U.S. Aggregate Bond ETF.", "Broad US investment-grade bond-market exposure.", ["Combines US Treasuries, agency mortgages and investment-grade credit.", "Distributes income monthly.", "Its US-only scope differs from AGGU's global USD-hedged universe."]],
  GLD: ["Macro hedge", "SPDR Gold Shares.", "A highly liquid physical-gold ETF.", ["Functions as a real/monetary asset.", "Helps during confidence shocks and adverse regimes.", "Most useful when liquidity and depth matter."]],
  IAU: ["Macro hedge", "iShares Gold Trust.", "A competitively priced physical-gold ETF.", ["An efficient alternative for holding gold exposure.", "Useful as a long-term macro diversifier.", "Less focused on heavy trading than GLD."]],
  "FXF / CHF": ["Macro hedge", "Invesco CurrencyShares Swiss Franc Trust.", "Swiss-franc exposure against the US dollar.", ["A historical haven during confidence shocks.", "Low carry, lower liquidity than large ETFs and risk of SNB intervention.", "The dollar is the natural hedge against Brazil. The Swiss franc represents monetary quality; gold is a regime hedge."]],
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
    extraCompanies: [
      "Samsung Electronics: HBM, DRAM and NAND memory.",
      "SK Hynix: a leader in HBM for AI.",
      "Tokyo Electron: chip-manufacturing equipment.",
      "Advantest: advanced-chip testing.",
    ],
    points: ["The ETFs provide exposure to several parts of the semiconductor value chain, with different weights across companies.", "Valuation and the semiconductor cycle need to be monitored.", "The funds cover semiconductor businesses within the broader AI infrastructure theme."],
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
    points: ["The ETFs provide exposure to major US aerospace and defence contractors.", "Government demand reduces dependence on consumers.", "The holdings span different aerospace and defence activities, with a business mix that varies by fund."],
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
    points: ["The ETF represents the theme, but its composition should be monitored.", "Businesses require ongoing security services as their systems and threats evolve.", "The risks depend on software demand, competition and execution rather than on a single technological breakthrough."],
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
    points: ["An ETF provides a broad starting universe for examining robotics and automation exposure.", "A selected equity basket can distinguish industrial automation from other businesses included in the ETFs.", "Industrial automation is a relevant subtheme of reindustrialisation."],
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
    points: ["A broad fund may include businesses whose revenues are only partly linked to grid investment.", "Selecting individual companies can distinguish utility operations from equipment manufacturing and engineering services.", "Data-centre development depends on available power and grid connections, which can constrain project delivery."],
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
    points: ["Essential-service revenues can behave differently from those of more cyclical industries.", "Higher interest rates can affect financing costs and the valuation of long-lived assets.", "A broad ETF combines a defensive profile with interest-rate sensitivity."],
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
    points: ["Housing demand is structural but interest-rate sensitive.", "The ETF helps capture the homebuilder cycle.", "The thesis strengthens when new supply remains constrained."],
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
    points: ["The fund includes businesses that supply the construction industry beyond homebuilders themselves.", "The exposure connects housing demand with infrastructure activity and construction materials.", "Demand reflects construction activity and can weaken even when long-term infrastructure needs remain."],
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
    points: ["Population ageing can support long-term demand for care services.", "Supply grows slowly because of labour constraints and regulation.", "A selected equity basket can focus on care providers, but leaves greater exposure to individual companies."],
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
    points: ["The business model combines recurring distribution activity with large-scale logistics networks.", "Population ageing and medicine use influence the long-term demand for distribution services.", "Risks include thin margins, regulatory pressure, reimbursement-system changes and customer concentration."],
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
    points: ["The value chain spans buildings, power systems, cooling, networking and equipment.", "REITs and proxies do not capture the full value chain.", "A selected equity basket can target parts of that value chain that the listed ETFs cover only partially."],
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
    points: ["Automation, transport, steel and capital-goods companies participate in different stages of the investment cycle.", "Existing index weights need not match the businesses that receive future manufacturing investment.", "A selected basket can target particular activities, with greater dependence on company selection."],
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
    points: ["Uncertain commercial timelines make position size and company-specific risk important considerations.", "The eventual commercial leaders are not yet established.", "An ETF may include companies with little exposure to the actual driver."],
  },
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
      React.createElement("span", { className: "detail-role" }, "Selected theme"),
      React.createElement("div", { className: `satellite-detail-head sat-risk-${active.aggression}` }, React.createElement(SatelliteIcon, { type: active.icon }), React.createElement("h2", null, active.theme)),
      React.createElement(EtfTradingDetails, { instruments: active.etfs || active.instruments }),
      React.createElement(
        "div",
        { className: "detail-grid" },
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Possible ETF"), React.createElement("strong", null, active.etfs)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Alternative"), React.createElement("strong", null, active.implementation)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "ETF quality"), React.createElement("strong", null, active.quality))
      ),
      React.createElement("p", null, active.reading),
      React.createElement("ul", { className: "satellite-list" }, active.points.map((point) => React.createElement("li", { key: point }, point))),
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
    points: ["Military spending has become a priority.", "A broad ETF dilutes defence exposure.", "A selected equity basket can focus on national defence contractors and their specific business activities."],
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
    points: ["The theme centres on control over data and digital infrastructure rather than an assumption of rapid revenue growth.", "Regulatory requirements influence demand for local infrastructure, software and security services.", "Holding several companies spreads company-specific exposure, although it does not remove sector risk."],
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
    points: ["LUXU/GLUX provide straightforward exposure.", "A sector ETF combines many brands, while a selected equity basket can focus on particular businesses.", "Selecting individual holdings changes the mix of brands and increases the importance of company analysis."],
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
    points: ["Many of these companies earn revenue across several geographic markets.", "Demand for healthcare is generally less dependent on discretionary consumer spending.", "These characteristics can reduce cyclicality, although company-specific and regulatory risks remain."],
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
    points: ["These businesses supply infrastructure and equipment used in energy systems and data centres.", "A broad industrial ETF includes businesses with different levels of exposure to electrification.", "A selected basket can focus specifically on equipment and automation suppliers."],
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
    points: ["ASML provides specialised exposure to semiconductor manufacturing equipment.", "A small number of companies account for much of the exposure to this theme.", "A selected equity basket can focus on these companies instead of including unrelated businesses."],
  },
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
      React.createElement("span", { className: "detail-role" }, "Selected theme"),
      React.createElement("div", { className: `satellite-detail-head ${active.tone}` }, React.createElement(SatelliteIcon, { type: active.icon }), React.createElement("h2", null, active.theme)),
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
      React.createElement("ul", { className: "satellite-list" }, active.points.map((point) => React.createElement("li", { key: point }, point))),
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
    reading: "These ETFs cover different segments of Chinese equities. Broad-market, internet and onshore A-share funds have different holdings and risks.",
    points: ["MCHI provides broad China exposure.", "FXI concentrates on large caps and Hong Kong.", "KWEB provides exposure to Chinese internet companies.", "ASHR/KBA provide exposure to onshore A-shares."],
    names: ["Alibaba", "Tencent", "PDD", "Baidu", "A-shares", "large caps Hong Kong"],
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
    names: ["LVMH", "Hermès", "Ferrari", "Richemont", "Moncler", "Prada", "L'Oréal", "EssilorLuxottica"],
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
    reading: "Here China appears as a physical buyer rather than an equity market.",
    points: ["The link to China comes through demand for physical resources and its effect on producer earnings.", "Demand and company earnings can respond strongly to the industrial cycle and government stimulus.", "The exposure comes through commodity demand rather than direct ownership of Chinese equities."],
    names: ["BHP", "Rio Tinto", "Freeport-McMoRan", "Glencore", "Vale", "COPX", "PICK"],
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
    names: ["ASML", "TSMC", "Applied Materials", "Lam Research", "KLA", "Nvidia", "Broadcom"],
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
    reading: "China+1 describes the diversification of production across additional countries to reduce dependence on a single supply chain.",
    points: ["India combines a domestic market, services and demographic scale.", "Mexico is exposed to manufacturing investment linked to proximity to the US market.", "Vietnam and other Southeast Asian economies participate in the diversification of manufacturing locations."],
    names: ["India", "Mexico", "Vietnam", "Indonesia", "Taiwan", "South Korea"],
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
    reading: "A structural way to reduce China risk without abandoning emerging markets.",
    points: ["The allocation excludes direct Chinese equity holdings but retains indirect economic links to China.", "It changes the sources of geopolitical exposure rather than eliminating them.", "The principal distinction is the long-term country mix of the emerging-market allocation."],
    names: ["India", "Taiwan", "South Korea", "Brazil", "Mexico", "Southeast Asia"],
  },
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
      React.createElement("span", { className: "detail-role" }, "Selected channel"),
      React.createElement("div", { className: `satellite-detail-head ${active.tone}` }, React.createElement(SatelliteIcon, { type: active.icon }), React.createElement("h2", null, active.theme)),
      React.createElement(EtfTradingDetails, { instruments: active.etfs || active.instruments }),
      React.createElement(
        "div",
        { className: "detail-grid" },
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Instruments"), React.createElement("strong", null, active.instruments)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Exposure captured"), React.createElement("strong", null, active.captures)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Main risk"), React.createElement("strong", null, active.risk))
      ),
      React.createElement("p", null, active.reading),
      React.createElement("ul", { className: "satellite-list" }, active.points.map((point) => React.createElement("li", { key: point }, point))),
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

const HEDGE_STRATEGIES = [
  {
    theme: "Macro hedge",
    icon: "diamond",
    objective: "stress",
    tone: "sat-risk-defensive",
    instruments: "GLD, IAU, FXF / CHF",
    does: "The examples provide exposure to gold and the Swiss franc, which respond to different monetary and market conditions.",
    use: "These exposures are used to diversify currency and macroeconomic risks, with results that depend on the nature of the shock.",
    limit: "Not a perfect hedge against equity declines; it may remain flat in a bull market.",
    reading: "For a portfolio measured in Brazilian reais, dollar exposure changes currency risk. Swiss-franc and gold positions add different monetary exposures, without guaranteeing protection in every crisis.",
    examples: ["GLD provides gold exposure through a trust backed by physical bullion.", "IAU also provides physical-gold exposure, with a different cost and trading profile from GLD.", "FXF provides exposure to the Swiss franc relative to the US dollar."],
  },
  {
    theme: "Option income",
    icon: "network",
    objective: "income",
    tone: "sat-risk-medium",
    instruments: "JEPI, JEPQ, XYLD, QYLD",
    does: "Sells calls to convert part of the expected upside into current income.",
    use: "The strategy prioritises distributions from option premiums while retaining exposure to equity-market movements.",
    limit: "Equity losses remain possible, and sold calls can limit participation in strong market rallies.",
    reading: "Option premiums contribute to current distributions, while sold calls limit participation in some market gains.",
    examples: ["JEPI: defensive equity + options", "JEPQ: Nasdaq/growth + options", "XYLD: S&P 500 covered call", "QYLD: Nasdaq 100 covered call"],
  },
  {
    theme: "Defensive equity / min-vol",
    icon: "shield",
    objective: "beta",
    tone: "sat-risk-defensive",
    instruments: "USMV, SPLV, MVOL / Min Vol UCITS",
    does: "Replaces aggressive equity exposure with a basket that has historically been less volatile.",
    use: "The strategy seeks lower equity volatility while keeping the portfolio invested in stocks.",
    limit: "It can still decline during a crisis and may lag in a concentrated bull market.",
    reading: "The portfolio remains invested in equities, with a construction method intended to reduce volatility.",
    examples: ["USMV: US minimum volatility", "SPLV: low volatility within the S&P 500", "MVOL / UCITS: global or regional versions"],
  },
  {
    theme: "Volatility / VIX",
    icon: "pulse",
    objective: "stress",
    tone: "sat-risk-high",
    instruments: "VIXY, VXX, UVXY",
    does: "Long exposure to short-term VIX futures. Returns depend on futures prices and contract rolling, and can differ substantially from changes in the spot VIX.",
    use: "Tactical exposure to volatility futures around market stress or specific events; protection is not guaranteed.",
    limit: "Contango can erode returns through contract rolling. UVXY adds daily leverage and compounding risk; VXX adds Barclays issuer credit risk.",
    reading: "These products reference first- and second-month VIX futures with a weighted average maturity of approximately one month. They do not directly track the spot VIX or provide a fixed inverse return to equities.",
    examples: [
      "VIXY — ProShares VIX Short-Term Futures ETF: unleveraged (1x) exposure to the S&P 500 VIX Short-Term Futures Index, before fees and expenses.",
      "VXX — iPath Series B S&P 500 VIX Short-Term Futures ETN: unleveraged exposure linked to the S&P 500 VIX Short-Term Futures Index Total Return, less applicable fees. An unsecured debt obligation of Barclays Bank PLC, subject to issuer credit risk.",
      "UVXY — ProShares Ultra VIX Short-Term Futures ETF: targets 1.5x the DAILY return of the S&P 500 VIX Short-Term Futures Index, before fees and expenses. The target resets daily; returns over longer periods can differ significantly from 1.5x the index return.",
    ],
  },
  {
    theme: "Tactical directional hedge",
    icon: "shield",
    objective: "stress",
    tone: "sat-risk-high",
    instruments: "SH, PSQ, RWM, EUM, SDS, QID, SQQQ, SPXU",
    does: "These funds target an inverse multiple of an index’s daily return, before fees and expenses.",
    use: "An inverse position can offset some short-term market exposure while the original holdings remain in place.",
    limit: "Daily compounding means returns over several days can differ substantially from the stated inverse multiple of the index’s cumulative return.",
    reading: "The return target applies to a single day; compounding can change the result over longer holding periods.",
    examples: ["SH: -1x S&P 500", "PSQ: -1x Nasdaq-100", "RWM: -1x small caps", "EUM: -1x emerging markets", "SDS / QID / SQQQ / SPXU: leveraged"],
  },
  {
    theme: "Buffered / defined outcome",
    icon: "server",
    objective: "payoff",
    tone: "sat-risk-medium",
    instruments: "Innovator Buffer ETFs, FT Vest Buffer ETFs, AllianzIM Buffered Outcome ETFs",
    does: "Options define a buffer against a specified range of losses while placing a cap on gains over an outcome period.",
    use: "The structure exchanges some potential upside for a defined range of downside protection.",
    limit: "The effective protection depends on the outcome period, the buffer and cap, and the price and date at which shares are bought.",
    reading: "The buffer covers a defined range of losses over a specified outcome period; losses beyond that range remain possible.",
    examples: ["Innovator Buffer ETFs: series such as BJAN/BJUN/BJUL", "FT Vest Buffer ETFs: families such as FJAN/FJUN/FJUL", "AllianzIM Buffered Outcome ETFs: defined buffers and caps", "Collars/put spreads: structures rather than ready-made ETFs"],
  },
  {
    theme: "Deconcentration",
    icon: "grid",
    objective: "beta",
    tone: "sat-risk-defensive",
    instruments: "RSP, EQWL, QQEW, USMV",
    does: "Reduces dependence on mega-caps and narrow market leadership.",
    use: "The approach changes the portfolio weights when exposure is dominated by a small number of companies.",
    limit: "It does not usually mitigate a broad market decline.",
    reading: "Reducing the weight of the largest companies changes concentration but does not provide direct protection against a broad market decline.",
    examples: ["RSP: S&P 500 equal weight", "EQWL: S&P 100 equal weight", "QQEW: Nasdaq 100 equal weight", "USMV: min-vol with a defensive bias"],
  },
  {
    theme: "Direct index options",
    icon: "shield",
    objective: "payoff",
    tone: "sat-risk-high",
    instruments: "SPY puts, QQQ puts, put spreads, collars",
    does: "The chosen options structure determines the range of downside protection, its expiry and the remaining upside participation.",
    use: "Options on SPY, QQQ or liquid indices allow the protection range and expiry to be selected explicitly.",
    limit: "Protection involves a premium, a limit on potential gains, a limit on loss coverage, or a combination of these trade-offs.",
    reading: "The strike prices, expiry dates and option premiums determine the range and cost of protection.",
    examples: ["A protective put establishes protection below its strike price until expiry, in exchange for the premium paid.", "A put spread limits protection to the interval between two strike prices.", "A collar combines a purchased put with a sold call, limiting both downside exposure and upside participation over its term.", "Selling a call can help finance a put spread, while capping upside and keeping downside protection limited to the spread."],
  },
];

function HedgeModule({ initialTheme = "Option income" } = {}) {
  const [filters, setFilters] = useState({ objective: "all" });
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);
  const toneOrder = { "sat-risk-high": 0, "sat-risk-medium": 1, "sat-risk-defensive": 2 };
  const filtered = HEDGE_STRATEGIES.filter((item) =>
    Object.entries(filters).every(([key, value]) => value === "all" || item[key] === value)
  ).sort((a, b) => toneOrder[a.tone] - toneOrder[b.tone] || a.theme.localeCompare(b.theme, "pt-BR"));
  const active = filtered.find((item) => item.theme === selectedTheme) || filtered[0] || HEDGE_STRATEGIES[0];

  const filterRow = (key, label) =>
    React.createElement(
      "div",
      { className: "filter-row", key },
      React.createElement("span", { className: "filter-label" }, label),
      HEDGE_FILTERS[key].map(([value, text]) =>
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
        React.createElement("div", null, React.createElement("span", { className: "control-title" }, "Hedging strategies"), React.createElement("h2", null, "Payoff, beta, volatility and currency"))
      ),
      React.createElement(
        "div",
        { className: "satellite-filters" },
        filterRow("objective", "Objective"),
        React.createElement(
          "div",
          { className: "risk-legend" },
          React.createElement("span", { className: "sat-risk-high" }, "Tactical / high carrying cost"),
          React.createElement("span", { className: "sat-risk-medium" }, "Payoff / income"),
          React.createElement("span", { className: "sat-risk-defensive" }, "Beta reduction")
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
      React.createElement("span", { className: "detail-role" }, "Selected hedge"),
      React.createElement("div", { className: `satellite-detail-head ${active.tone}` }, React.createElement(SatelliteIcon, { type: active.icon }), React.createElement("h2", null, active.theme)),
      React.createElement(EtfTradingDetails, { instruments: active.etfs || active.instruments }),
      React.createElement(
        "div",
        { className: "detail-grid" },
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Instruments"), React.createElement("strong", null, active.instruments)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "What it does"), React.createElement("strong", null, active.does)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Typical use"), React.createElement("strong", null, active.use)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Limitation"), React.createElement("strong", null, active.limit))
      ),
      React.createElement("p", null, active.reading),
      React.createElement("ul", { className: "satellite-list" }, active.examples.map((point) => React.createElement("li", { key: point }, point))),
      React.createElement("p", { className: "data-note" }, "Source: liquid instruments and common structures, June 2026. Tactical products require checks of term, liquidity, cost and daily reset rules.")
    )
  );
}

// Trading listings verified against Yahoo Finance chart metadata on 14/09/2026.
const ETF_TRADING_LISTINGS = {
  "SPY": ["SPY", "NYSE Arca", "USD"],
  "VOO": ["VOO", "NYSE Arca", "USD"],
  "QQQ": ["QQQ", "Nasdaq", "USD"],
  "RSP": ["RSP", "NYSE Arca", "USD"],
  "EQWL": ["EQWL", "NYSE Arca", "USD"],
  "SMH": ["SMH", "Nasdaq", "USD"],
  "SOXX": ["SOXX", "Nasdaq", "USD"],
  "CIBR": ["CIBR", "Nasdaq", "USD"],
  "ITA": ["ITA", "Cboe US", "USD"],
  "GLD": ["GLD", "NYSE Arca", "USD"],
  "XLK": ["XLK", "NYSE Arca", "USD"],
  "IUIT": ["IUIT.L", "London Stock Exchange", "USD"],
  "XLC": ["XLC", "NYSE Arca", "USD"],
  "IUCM": ["IUCM.L", "London Stock Exchange", "USD"],
  "XLY": ["XLY", "NYSE Arca", "USD"],
  "IUCD": ["IUCD.L", "London Stock Exchange", "USD"],
  "XLV": ["XLV", "NYSE Arca", "USD"],
  "IUHC": ["IUHC.L", "London Stock Exchange", "USD"],
  "XLF": ["XLF", "NYSE Arca", "USD"],
  "IUFS": ["IUFS.L", "London Stock Exchange", "USD"],
  "XLI": ["XLI", "NYSE Arca", "USD"],
  "IUIS": ["IUIS.L", "London Stock Exchange", "USD"],
  "XLE": ["XLE", "NYSE Arca", "USD"],
  "IUES": ["IUES.L", "London Stock Exchange", "USD"],
  "XLP": ["XLP", "NYSE Arca", "USD"],
  "IUCS": ["IUCS.L", "London Stock Exchange", "USD"],
  "XLU": ["XLU", "NYSE Arca", "USD"],
  "IUUS": ["IUUS.L", "London Stock Exchange", "USD"],
  "XLB": ["XLB", "NYSE Arca", "USD"],
  "IUMS": ["IUMS.L", "London Stock Exchange", "USD"],
  "XLRE": ["XLRE", "NYSE Arca", "USD"],
  "VEA": ["VEA", "NYSE Arca", "USD"],
  "IEFA": ["IEFA", "Cboe US", "USD"],
  "IWDA": ["IWDA.L", "London Stock Exchange", "USD"],
  "SWDA": ["SWDA.L", "London Stock Exchange", "GBp"],
  "VGK": ["VGK", "NYSE Arca", "USD"],
  "IEUR": ["IEUR", "NYSE Arca", "USD"],
  "FEZ": ["FEZ", "NYSE Arca", "USD"],
  "IMEU": ["IMEU.L", "London Stock Exchange", "GBp"],
  "VWO": ["VWO", "NYSE Arca", "USD"],
  "IEMG": ["IEMG", "NYSE Arca", "USD"],
  "EIMI": ["EIMI.L", "London Stock Exchange", "USD"],
  "EMXC": ["EMXC", "Nasdaq", "USD"],
  "EXCH": ["EXCH.AS", "Euronext Amsterdam", "USD"],
  "LUXU": ["LUXU.PA", "Euronext Paris", "USD"],
  "IB01": ["IB01.L", "London Stock Exchange", "USD"],
  "CSPX": ["CSPX.L", "London Stock Exchange", "USD"],
  "VUAA": ["VUAA.L", "London Stock Exchange", "USD"],
  "QQQM": ["QQQM", "Nasdaq", "USD"],
  "CNDX": ["CNDX.L", "London Stock Exchange", "USD"],
  "EQQQ": ["EQQQ.L", "London Stock Exchange", "GBp"],
  "IAU": ["IAU", "NYSE Arca", "USD"],
  "FXF": ["FXF", "NYSE Arca", "USD"],
  "IBTA": ["IBTA.L", "London Stock Exchange", "USD"],
  "CBU7": ["CBU7.L", "London Stock Exchange", "USD"],
  "IB7A": ["IB7A.AS", "Euronext Amsterdam", "USD"],
  "DTLA": ["DTLA.L", "London Stock Exchange", "USD"],
  "TIP5": ["TIP5.L", "London Stock Exchange", "USD"],
  "IDTP": ["IDTP.L", "London Stock Exchange", "USD"],
  "TI5A": ["TI5A.AS", "Euronext Amsterdam", "USD"],
  "LQDA": ["LQDA.L", "London Stock Exchange", "USD"],
  "IHYA": ["IHYA.L", "London Stock Exchange", "USD"],
  "AGGU": ["AGGU.L", "London Stock Exchange", "USD"],
  "SGOV": ["SGOV", "New York Stock Exchange", "USD"],
  "SHY": ["SHY", "Nasdaq", "USD"],
  "IEI": ["IEI", "Nasdaq", "USD"],
  "IEF": ["IEF", "Nasdaq", "USD"],
  "TLT": ["TLT", "Nasdaq", "USD"],
  "STIP": ["STIP", "NYSE Arca", "USD"],
  "TIP": ["TIP", "NYSE Arca", "USD"],
  "LQD": ["LQD", "NYSE Arca", "USD"],
  "HYG": ["HYG", "NYSE Arca", "USD"],
  "AGG": ["AGG", "NYSE Arca", "USD"],
  "PPA": ["PPA", "NYSE Arca", "USD"],
  "HACK": ["HACK", "NYSE Arca", "USD"],
  "BOTZ": ["BOTZ", "Nasdaq", "USD"],
  "ROBO": ["ROBO", "NYSE Arca", "USD"],
  "GRID": ["GRID", "Nasdaq", "USD"],
  "PAVE": ["PAVE", "Cboe US", "USD"],
  "ITB": ["ITB", "Cboe US", "USD"],
  "XHB": ["XHB", "NYSE Arca", "USD"],
  "PKB": ["PKB", "NYSE Arca", "USD"],
  "SRVR": ["SRVR", "NYSE Arca", "USD"],
  "VPN": ["VPN", "Nasdaq", "USD"],
  "AIRR": ["AIRR", "Nasdaq", "USD"],
  "QTUM": ["QTUM", "Nasdaq", "USD"],
  "GLUX": ["GLUX.PA", "Euronext Paris", "EUR"],
  "EXV4": ["EXV4.DE", "Xetra", "EUR"],
  "XDWH": ["XDWH.DE", "Xetra", "EUR"],
  "MCHI": ["MCHI", "Nasdaq", "USD"],
  "FXI": ["FXI", "NYSE Arca", "USD"],
  "KWEB": ["KWEB", "NYSE Arca", "USD"],
  "ASHR": ["ASHR", "NYSE Arca", "USD"],
  "KBA": ["KBA", "NYSE Arca", "USD"],
  "COPX": ["COPX", "NYSE Arca", "USD"],
  "PICK": ["PICK", "Cboe US", "USD"],
  "INDA": ["INDA", "Cboe US", "USD"],
  "FLIN": ["FLIN", "NYSE Arca", "USD"],
  "EWW": ["EWW", "NYSE Arca", "USD"],
  "VNM": ["VNM", "Cboe US", "USD"],
  "EWT": ["EWT", "NYSE Arca", "USD"],
  "EWY": ["EWY", "NYSE Arca", "USD"],
  "JEPI": ["JEPI", "NYSE Arca", "USD"],
  "JEPQ": ["JEPQ", "Nasdaq", "USD"],
  "XYLD": ["XYLD", "NYSE Arca", "USD"],
  "QYLD": ["QYLD", "Nasdaq", "USD"],
  "USMV": ["USMV", "Cboe US", "USD"],
  "SPLV": ["SPLV", "NYSE Arca", "USD"],
  "VIXY": ["VIXY", "Cboe US", "USD"],
  "VXX": ["VXX", "Cboe US", "USD"],
  "UVXY": ["UVXY", "Cboe US", "USD"],
  "SH": ["SH", "NYSE Arca", "USD"],
  "PSQ": ["PSQ", "NYSE Arca", "USD"],
  "RWM": ["RWM", "NYSE Arca", "USD"],
  "EUM": ["EUM", "NYSE Arca", "USD"],
  "SDS": ["SDS", "NYSE Arca", "USD"],
  "QID": ["QID", "NYSE Arca", "USD"],
  "SQQQ": ["SQQQ", "Nasdaq", "USD"],
  "SPXU": ["SPXU", "NYSE Arca", "USD"],
  "QQEW": ["QQEW", "Nasdaq", "USD"],
  "GLDM": ["GLDM", "NYSE Arca", "USD"],
  "SIVR": ["SIVR", "NYSE Arca", "USD"],
  "SLV": ["SLV", "NYSE Arca", "USD"],
  "PPLT": ["PPLT", "NYSE Arca", "USD"],
  "PALL": ["PALL", "NYSE Arca", "USD"],
  "USO": ["USO", "NYSE Arca", "USD"],
  "BNO": ["BNO", "NYSE Arca", "USD"],
  "UNG": ["UNG", "NYSE Arca", "USD"],
  "CPER": ["CPER", "NYSE Arca", "USD"],
  "DBA": ["DBA", "NYSE Arca", "USD"],
  "CORN": ["CORN", "NYSE Arca", "USD"],
  "WEAT": ["WEAT", "NYSE Arca", "USD"],
  "SOYB": ["SOYB", "NYSE Arca", "USD"],
  "CATL": ["CATL.L", "London Stock Exchange", "USD"],
  "PDBC": ["PDBC", "Nasdaq", "USD"],
  "COMT": ["COMT", "Nasdaq", "USD"],
  "MOO": ["MOO", "NYSE Arca", "USD"],
  "GDX": ["GDX", "NYSE Arca", "USD"],
  "GDXJ": ["GDXJ", "NYSE Arca", "USD"],
  "SIL": ["SIL", "NYSE Arca", "USD"],
  "SILJ": ["SILJ", "NYSE Arca", "USD"],
  "VDE": ["VDE", "NYSE Arca", "USD"],
  "URA": ["URA", "NYSE Arca", "USD"],
  "URNM": ["URNM", "NYSE Arca", "USD"],
  "LIT": ["LIT", "NYSE Arca", "USD"],
  "REMX": ["REMX", "NYSE Arca", "USD"],
  "WOOD": ["WOOD", "Nasdaq", "USD"],
  "PHO": ["PHO", "Nasdaq", "USD"],
};

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
    })
  );
}

function DataLabTickerLink({ ticker, availableTickers }) {
  if (!availableTickers?.has(ticker)) return null;
  return React.createElement(
    "a",
    {
      className: "data-lab-direct-link",
      href: `#dataLab/${encodeURIComponent(ticker)}`,
      "aria-label": `Open ${ticker} in Data Lab`,
    },
    "Data Lab ↗"
  );
}

function CoreModule({ functions = CORE_EQUITY_FUNCTIONS, initialEtf = "VOO", legendMode = "equity", showVehicleToggle = true, dataLabTickers = new Set() } = {}) {
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
              { className: "core-function", key: row.fn },
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
          React.createElement(DataLabTickerLink, { ticker: selectedEtf, availableTickers: dataLabTickers })
        ),
        React.createElement("span", { className: "detail-role" }, detail[0]),
        React.createElement(EtfTradingDetails, { instruments: selectedEtf }),
        React.createElement("p", null, detail[1]),
        React.createElement("p", null, detail[2]),
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
        React.createElement("ul", { className: "core-detail-list" }, detail[3].map((point) => React.createElement("li", { key: point }, point)))
      )
    )
  );
}

function FixedIncomeModule({ dataLabTickers, initialEtf = "IB01" }) {
  return React.createElement(CoreModule, { functions: FIXED_INCOME_FUNCTIONS, initialEtf, legendMode: "fixed", showVehicleToggle: true, dataLabTickers });
}

const SECTOR_GICS_ETFS = [
  { tickers: ["XLK", "IUIT"], sector: "Information Technology", icon: "chip", tone: "sat-risk-high", role: "Growth / quality", why: "The sector covers software, semiconductors and technology infrastructure businesses.", limit: "Large holdings can dominate returns, and valuations are sensitive to changes in expected growth.", points: ["These funds isolate the information technology sector within the S&P 500.", "Large technology companies can account for a substantial share of the portfolio.", "Its returns can be compared with the broader index to examine the contribution of technology exposure."] },
  { tickers: ["XLC", "IUCM"], sector: "Communication Services", icon: "phone", tone: "sat-risk-high", role: "Platforms / media", why: "The sector brings together digital platforms, media, streaming services and telecommunications.", limit: "Combines very different businesses and may be concentrated in a few names.", points: ["It captures communication-services businesses that sit outside the information technology sector.", "Company revenues depend on activities such as advertising, content subscriptions and distribution.", "The inclusion of telecoms does not make the whole portfolio defensive, because its other businesses have different risks."] },
  { tickers: ["XLY", "IUCD"], sector: "Consumer Discretionary", icon: "diamond", tone: "sat-risk-high", role: "Cyclical consumption", why: "The sector includes e-commerce, automobiles and other businesses dependent on discretionary consumer spending.", limit: "Carries economic-cycle, consumer-confidence and concentration risks.", points: ["Demand depends partly on household confidence and the willingness to make discretionary purchases.", "The portfolio can include premium-consumption businesses and large retail platforms.", "Slower economic activity and higher financing costs can weigh on consumer demand."] },
  { tickers: ["XLB", "IUMS"], sector: "Materials", icon: "factory", tone: "sat-risk-medium", role: "Cycle / commodities", why: "The sector covers chemicals, metals and other materials used in industrial production.", limit: "Closely linked to the global cycle, the US dollar and commodity demand.", points: ["Company earnings are influenced by industrial production and demand for materials.", "Its exposure differs from energy producers and industrial businesses, even though their cycles can overlap.", "These funds own company shares, so returns also reflect operating costs and equity-market conditions."] },
  { tickers: ["XLE", "IUES"], sector: "Energy", icon: "oil", tone: "sat-risk-medium", role: "Traditional energy", why: "The sector includes oil and gas businesses whose earnings depend on energy markets and operating performance.", limit: "Sensitive to oil prices, geopolitics and CAPEX discipline.", points: ["Rising energy prices can support some producers, but their shares do not provide guaranteed protection against an energy shock.", "Shareholder returns can include distributions and the effects of company share repurchases.", "The portfolio primarily represents traditional energy businesses rather than a dedicated energy-transition strategy."] },
  { tickers: ["XLF", "IUFS"], sector: "Financials", icon: "money", tone: "sat-risk-medium", role: "Rates / credit", why: "The sector includes banks, insurers, payment businesses, brokers and capital-market firms.", limit: "Depends on the yield curve, credit conditions and the default cycle.", points: ["The portfolio reflects several channels through which credit and financial activity affect company earnings.", "A steeper yield curve can support some financial businesses, although its effects differ across holdings.", "Risk rises when credit deteriorates."] },
  { tickers: ["XLI", "IUIS"], sector: "Industrials", icon: "factory", tone: "sat-risk-medium", role: "Cycle / CAPEX", why: "The sector spans industrial production, transport, defence, machinery and infrastructure-related businesses.", limit: "A broad ETF dilutes specific theses such as defence or reindustrialisation.", points: ["Company revenues are linked to investment in equipment, construction and other physical assets.", "Some holdings participate in domestic manufacturing investment and infrastructure projects.", "A selected equity basket can narrow the exposure to a specific industry, while increasing company-selection risk."] },
  { tickers: ["XLP", "IUCS"], sector: "Consumer Staples", icon: "home", tone: "sat-risk-defensive", role: "Defensive / essential consumption", why: "The sector includes food, beverages, household products and retailers focused on essential consumption.", limit: "May lag during a growth-led bull market.", points: ["Essential demand can make these businesses less cyclical than discretionary-consumption businesses.", "Essential-consumption businesses can have steadier demand, but their margins still depend on input costs and pricing.", "Margins depend on input costs and on how customers respond to price changes."] },
  { tickers: ["XLV", "IUHC"], sector: "Health Care", icon: "pulse", tone: "sat-risk-defensive", role: "Defensive quality", why: "The sector includes pharmaceuticals, healthcare services, medical equipment and managed-care businesses.", limit: "Combines defensive characteristics with regulatory risk and innovation-pipeline risk.", points: ["Healthcare demand can be less cyclical, but profitability and business quality vary across companies.", "Demographics, research outcomes and operating scale influence the performance of the holdings.", "The broader healthcare portfolio does not isolate biotechnology or pharmaceutical exposure."] },
  { tickers: ["XLRE"], sector: "Real Estate", icon: "home", tone: "sat-risk-defensive", role: "Listed real estate", why: "The sector provides exposure to real-estate investment trusts and other listed property businesses.", limit: "Sensitive to interest rates, credit, capitalisation rates and vacancy.", points: ["Investors obtain property-related exposure through shares traded on an exchange.", "Financing costs, property income and valuation changes are important drivers of listed real-estate returns.", "Listed property shares have liquidity and market-price characteristics that differ from directly held property."] },
  { tickers: ["XLU", "IUUS"], sector: "Utilities", icon: "faucet", tone: "sat-risk-defensive", role: "Defensive / duration", why: "The sector covers utilities that provide electricity and other essential infrastructure services.", limit: "Sensitive to interest rates and regulation; it is not the same as a specific grid exposure.", points: ["Essential-service demand can be relatively stable, although utility shares remain exposed to market losses.", "Electrification and data-centre development can influence electricity demand and investment requirements.", "A utility ETF alone may not cover the equipment and engineering businesses involved in grid expansion."] },
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
      React.createElement("span", { className: "detail-role" }, "Selected sector"),
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
      React.createElement(EtfTradingDetails, { instruments: selectedSector }),
      React.createElement(
        "div",
        { className: "detail-grid" },
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Role"), React.createElement("strong", null, activeMeta.role)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "What it captures"), React.createElement("strong", null, activeMeta.why)),
        React.createElement("div", { className: "detail-box" }, React.createElement("span", null, "Limitation"), React.createElement("strong", null, activeMeta.limit))
      ),
      React.createElement("ul", { className: "satellite-list" }, activeMeta.points.map((point) => React.createElement("li", { key: point }, point)))
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
    points: ["Physical vehicles track bullion, while miner ETFs own operating companies.", "Gold, silver, platinum and palladium respond to different monetary and industrial drivers.", "Mining shares add exposure to production costs, reserves, operating jurisdictions and company execution."],
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
      ["SILJ", "Amplify Junior Silver Miners ETF", "US-listed equity ETF", "Junior silver miners"],
    ],
  },
  {
    title: "Industrial metals",
    icon: "factory",
    tone: "commodity-metals",
    structure: "Copper futures and mining equities",
    risk: "Industrial demand and inventories influence copper prices, while contract rolling and producer performance affect the respective vehicles.",
    points: ["Copper is widely used as an industrial-cycle indicator.", "CPER follows copper futures, while COPX owns copper-mining companies.", "Copper futures reflect contract prices and rolling effects, while mining shares also depend on company costs and operating performance."],
    instruments: [
      ["CPER", "United States Copper Index Fund", "US-listed commodity pool", "Copper futures"],
      ["COPX", "Global X Copper Miners ETF", "US-listed equity ETF", "Global copper miners"],
    ],
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
      ["REMX", "VanEck Rare Earth and Strategic Metals ETF", "US-listed equity ETF", "Rare earths and strategic metals"],
    ],
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
      ["VDE", "Vanguard Energy ETF", "US-listed equity ETF", "US energy producers"],
    ],
  },
  {
    title: "Agriculture & livestock",
    icon: "home",
    tone: "commodity-agriculture",
    structure: "Futures exposure and agribusiness equities",
    risk: "Weather, harvests, disease and trade policy influence supply; contract rolling and equity-market conditions create additional vehicle-specific risks.",
    points: ["Single-crop funds isolate specific agricultural futures.", "CATL is an ETC linked to live-cattle futures; MOO owns agribusiness companies.", "Futures returns depend on contract prices and rolling effects; producer shares also reflect company earnings and equity-market conditions."],
    instruments: [
      ["DBA", "Invesco DB Agriculture Fund", "US-listed commodity pool", "Diversified agriculture futures"],
      ["CORN", "Teucrium Corn Fund", "US-listed commodity pool", "Corn futures"],
      ["WEAT", "Teucrium Wheat Fund", "US-listed commodity pool", "Wheat futures"],
      ["SOYB", "Teucrium Soybean Fund", "US-listed commodity pool", "Soybean futures"],
      ["CATL", "WisdomTree Live Cattle", "European-listed ETC", "Live-cattle futures"],
      ["MOO", "VanEck Agribusiness ETF", "US-listed equity ETF", "Global agribusiness companies"],
    ],
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
      ["PHO", "Invesco Water Resources ETF", "US-listed equity ETF", "US water infrastructure and technology"],
    ],
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
      ["COMT", "iShares GSCI Commodity Dynamic Roll Strategy ETF", "US-listed ETF", "Broad commodity futures"],
    ],
  },
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
        { className: "core-legend commodity-legend" },
        COMMODITY_GROUPS.map((group) => React.createElement("span", { className: `etf-token ${group.tone}`, key: group.title }, group.title))
      ),
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
      React.createElement("span", { className: "detail-role" }, active.group.title),
      React.createElement(
        "div",
        { className: "instrument-detail-heading" },
        React.createElement("h2", null, active.ticker),
        React.createElement(DataLabTickerLink, { ticker: active.ticker, availableTickers: dataLabTickers })
      ),
      React.createElement("p", null, active.name),
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
  ["fixed", "Fixed Income"],
  ["core", "Core Equities"],
  ["sectors", "Sectors"],
  ["satellites", "US Satellites"],
  ["europe", "European Themes"],
  ["china", "China / China+1"],
  ["commodities", "Commodities"],
  ["hedges", "Hedge"],
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
  [["GLD", "IAU", "FXF"], "hedges", "Macro hedge"],
  [["JEPI", "JEPQ", "XYLD", "QYLD"], "hedges", "Option income"],
  [["USMV", "SPLV"], "hedges", "Defensive equity / min-vol"],
  [["VIXY", "VXX", "UVXY"], "hedges", "Volatility / VIX"],
  [["SH", "PSQ", "RWM", "EUM", "SDS", "QID", "SQQQ", "SPXU"], "hedges", "Tactical directional hedge"],
  [["RSP", "EQWL", "QQEW", "USMV"], "hedges", "Deconcentration"],
  [["SPY", "QQQ"], "hedges", "Direct index options"],
].forEach(([tickers, tab, target]) => tickers.forEach((ticker) => registerEtfDestination(ticker, tab, target)));

const etfDestinationForTicker = (ticker) => ETF_DESTINATIONS.get(String(ticker || "").trim().toUpperCase()) || null;

const etfHrefForTicker = (ticker) => {
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

function EtfsModule() {
  const [routeDestination, setRouteDestination] = useState(() => requestedEtfDestination());
  const [activeEtfTab, setActiveEtfTab] = useState(() => routeDestination?.tab || "fixed");
  const [dataLabTickers, setDataLabTickers] = useState(() => new Set());

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
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const renderActive = () => {
    const requestedTarget = routeDestination?.tab === activeEtfTab ? routeDestination.target : null;
    if (activeEtfTab === "core") return React.createElement(CoreModule, { key: `core-${requestedTarget || "default"}`, dataLabTickers, initialEtf: requestedTarget || "VOO" });
    if (activeEtfTab === "fixed") return React.createElement(FixedIncomeModule, { key: `fixed-${requestedTarget || "default"}`, dataLabTickers, initialEtf: requestedTarget || "IB01" });
    if (activeEtfTab === "sectors") return React.createElement(SectorGicsModule, { key: `sectors-${requestedTarget || "default"}`, dataLabTickers, initialSector: requestedTarget || "XLK" });
    if (activeEtfTab === "commodities") return React.createElement(CommodityModule, { key: `commodities-${requestedTarget || "default"}`, dataLabTickers, initialEtf: requestedTarget || "GLD" });
    if (activeEtfTab === "satellites") return React.createElement(SatelliteModule, { key: `satellites-${requestedTarget || "default"}`, initialTheme: requestedTarget || "Semiconductors / AI hardware" });
    if (activeEtfTab === "europe") return React.createElement(EuropeModule, { key: `europe-${requestedTarget || "default"}`, initialTheme: requestedTarget || "European defence" });
    if (activeEtfTab === "china") return React.createElement(ChinaModule, { key: `china-${requestedTarget || "default"}`, initialTheme: requestedTarget || "Direct China" });
    return React.createElement(HedgeModule, { key: `hedges-${requestedTarget || "default"}`, initialTheme: requestedTarget || "Option income" });
  };

  return React.createElement(
    "main",
    { className: "etf-shell work-surface" },
    React.createElement(
      "nav",
      { className: "panel etf-subtabs", "aria-label": "ETF submodules" },
      ETF_SUBMODULES.map(([key, label]) =>
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
    ),
    renderActive()
  );
}

window.GCEtfs = {
  EtfsModule,
  etfDestinationForTicker,
  etfHrefForTicker,
};
})();
