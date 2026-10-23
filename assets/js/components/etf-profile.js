/* ETF information only. Price series and DataLab calculations are independent. */
window.GCEtfProfiles = (() => {
  const h = React.createElement;
  const text = (value) => typeof value === "string" && value.trim() ? value.trim() : "n/a";
  const sourceUrl = (url) => typeof url === "string" && /^https:\/\//i.test(url) ? url : null;
  const date = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : "n/a";
  const number = (value) => typeof value === "number" && Number.isFinite(value);
  function validIsin(value) {
    if (typeof value !== "string" || !/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(value)) return false;
    const digits = value.split("").map(c => /[A-Z]/.test(c) ? parseInt(c, 36) : c).join("");
    return digits.split("").reverse().reduce((sum, c, i) => {
      const n = Number(c) * (i % 2 ? 2 : 1);
      return sum + Math.floor(n / 10) + n % 10;
    }, 0) % 10 === 0;
  }
  function annualPercent(field) {
    return field?.unit === "fraction_per_year" && number(field.value) && field.value >= 0 && field.value <= .1
      ? `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(field.value * 100)}% p.a.` : "n/a";
  }
  function formatAssets(assets) {
    return number(assets?.value) && assets.value > 0 && /^[A-Z]{3}$/.test(assets.currency || "")
      ? `${assets.currency} ${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(assets.value)}` : "n/a";
  }
  const currencyNames = { USD: "USD — US dollar", EUR: "EUR — euro", GBP: "GBP — British pound", GBp: "GBp — British pence (100 GBp = GBP 1)", BRL: "BRL — Brazilian real" };
  function metadataNote(field, now = Date.now()) {
    if (field?.cadence === "event_driven" && field.status === "verified") {
      return { stale: false, note: `${field.source} · Verified ${date(field.verifiedAt)}${field.sourceAsOf ? ` · Source dated ${date(field.sourceAsOf)}` : ""}` };
    }
    const collected = Date.parse(field?.collectedAt);
    const stale = field?.status === "stale" || (Number.isFinite(collected) && now - collected > 14 * 86400000);
    return { stale, note: field?.value !== null && field?.value !== undefined
      ? `${field.source || "Source unavailable"} · Retrieved ${date(field.collectedAt)}${stale ? " · Last available value" : ""}` : "Not available from the current source" };
  }
  function buildProfile(item, fallback = {}) {
    const profile = item?.profile || {};
    const listing = profile.listing || fallback.listing || {};
    const metadata = item?.fundMetadata || {};
    // Reference data is verified against the specific listing and survives Yahoo refreshes.
    const reference = item?.fundReference || {};
    const verified = (field) => field?.status === "verified" && field.cadence === "event_driven"
      && field.quoteSymbol === item?.quoteSymbol && !!item?.quoteSymbol
      && sourceUrl(field.sourceUrl) && text(field.source) !== "n/a" && date(field.verifiedAt) !== "n/a";
    const provider = verified(reference.provider) && text(reference.provider.value) !== "n/a"
      && ["fund_provider", "fund_manager"].includes(reference.provider.role) ? reference.provider : metadata.provider;
    const isin = verified(reference.isin) && validIsin(reference.isin.value) ? reference.isin
      : validIsin(metadata.isin?.value) ? metadata.isin : undefined;
    const assets = item?.fundAssets;
    const row = (label, value, field) => ({ label, value: text(value), ...(field ? metadataNote(field) : {}) });
    const feeKind = metadata.annualFee?.kind;
    const fee = feeKind === "expense_ratio" ? annualPercent(metadata.annualFee) : "n/a";
    return {
      ticker: item?.ticker || fallback.ticker,
      name: text(item?.officialName || item?.name || fallback.name),
      identification: [
        row("Fund provider", provider?.value, provider),
        row("Exchange", listing.exchange || item?.exchange),
        row("Trading currency", currencyNames[listing.currency || item?.currency] || listing.currency || item?.currency),
        row("Listing", listing.symbol || item?.quoteSymbol),
        row("ISIN", isin?.value, isin),
        row("Net assets", formatAssets(assets), assets),
        row(item?.ticker === "VXX" ? "Reported annual charge" : "Expense ratio (annual)", fee, metadata.annualFee),
        row("Management fee (annual)", annualPercent(metadata.managementFee), metadata.managementFee),
      ],
      features: (profile.features || fallback.features || []).filter(r => r && typeof r.label === "string").map(r => row(r.label, r.value)),
      about: (profile.about || fallback.about || ["Fund description unavailable."]).filter(p => typeof p === "string" && p.trim()),
      notes: profile.notes,
      editorialSource: sourceUrl(profile.source || item?.sourceUrl),
      reviewedAt: date(profile.reviewedAt),
      metadataSources: Object.entries({ ...metadata, provider, isin })
        .filter(([, v]) => v?.value !== null && v?.value !== undefined)
        .map(([key, v]) => ({ ...v, label: { provider: "Fund provider", isin: "ISIN", annualFee: "Annual expense", managementFee: "Management fee" }[key] || key })),
      assets,
    };
  }
  function FieldGrid({ rows, className = "" }) {
    return h("dl", { className: `etf-facts-grid ${className}` }, rows.map(({ label, value, note, stale }) =>
      h("div", { className: "etf-fact", key: label }, h("dt", null, label),
        h("dd", { title: note }, value, stale && value !== "n/a" ? h("small", { className: "etf-last-value" }, "Last available") : null))));
  }
  function Profile({ item, fallback, showName, action }) {
    const p = buildProfile(item, fallback);
    const sources = p.metadataSources;
    return h(React.Fragment, null,
      action ? h("div", { className: "instrument-detail-heading etf-profile-name" },
        showName ? h("div", { className: "detail-role" }, p.name) : null, action)
        : showName ? h("div", { className: "detail-role etf-profile-name" }, p.name) : null,
      h("div", { className: "etf-information-cards", "data-etf": p.ticker },
        h("section", { className: "etf-information-card", "aria-label": "Identification" },
          h("h3", null, "Identification"), h(FieldGrid, { rows: p.identification }),
          h("p", { className: "etf-card-note" }, `Net assets retrieved: ${date(p.assets?.collectedAt)} · Assets reference date: ${date(p.assets?.asOf)}`)),
        h("section", { className: "etf-information-card", "aria-label": "Exposure and key features" },
          h("h3", null, "Exposure & Key Features"), p.features.length ? h(FieldGrid, { rows: p.features, className: "etf-exposure-grid" }) : h("p", null, "n/a"),
          p.notes ? h("p", { className: "etf-card-note" }, p.notes) : null),
        h("section", { className: "etf-information-card etf-about-card", "aria-label": "About the ETF" },
          h("h3", null, "About the ETF"), p.about.map((paragraph, index) => h("p", { key: index }, paragraph))),
        h("details", { className: "etf-profile-sources" }, h("summary", null, "Sources & data notes"),
          sources.map(s => h("p", { key: s.label }, `${s.label}: `,
            sourceUrl(s.sourceUrl) ? h("a", { href: s.sourceUrl, target: "_blank", rel: "noopener noreferrer" }, `${s.source || "Source"} ↗`) : s.source || "Source unavailable",
            s.cadence === "event_driven" ? ` · Verified ${date(s.verifiedAt)}${s.sourceAsOf ? ` · Source dated ${date(s.sourceAsOf)}` : ""}.`
              : ` · Retrieved ${date(s.collectedAt)}. The retrieval date is not the report reference date.`,
            s.scope ? ` ${s.scope}` : "")),
          p.assets?.sourceUrl ? h("p", null, h("a", { href: sourceUrl(p.assets.sourceUrl), target: "_blank", rel: "noopener noreferrer" }, "Net assets source ↗"), ` · Retrieved ${date(p.assets.collectedAt)}.`) : null,
          p.editorialSource ? h("p", null, h("a", { href: p.editorialSource, target: "_blank", rel: "noopener noreferrer" }, "Fund information ↗")) : null,
          h("p", null, `Exposure notes reviewed ${p.reviewedAt}. Descriptive characteristics are not live portfolio measurements.`),
          h("p", null, "Verified provider and ISIN records come from issuer or exchange documentation; the provider may be the fund brand or the named investment manager, as identified in the source. Administrator and distributor names are not substituted for the manager. Reference records are reviewed when the fund or share class changes, without a scheduled refresh. Where no verified provider is available, Yahoo's fund-family field is used."),
          h("p", null, "Expense ratio is the reported annual fund expense, not a separate management fee. An ETN's reported charge is not labelled as an ETF management fee. Management fee is shown only when separately identified. Do not add an included management fee to total expenses. Trading, brokerage and foreign-exchange costs are separate. Missing fields are shown as n/a.")))
    );
  }
  function Cards({ instruments, fallback = {}, showName = false, initialTicker = null, renderAction, contextGroup }) {
    const [catalog, setCatalog] = React.useState(null);
    const [failed, setFailed] = React.useState(false);
    const [selected, setSelected] = React.useState(initialTicker);
    const [vehicle, setVehicle] = React.useState("all");
    React.useEffect(() => {
      let cancelled = false;
      DataClient.load("etf-universe").then(r => {
        if (!cancelled) { setCatalog(r.ok ? (r.data?.instruments || []) : []); setFailed(!r.ok); }
      }).catch(() => { if (!cancelled) { setCatalog([]); setFailed(true); } });
      return () => { cancelled = true; };
    }, []);
    const requested = [...new Set(String(instruments || "").match(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*\b/g) || [])];
    const equityContext = window.GCInstrumentRegistry?.EQUITY_GROUPS.includes(contextGroup);
    const allChoices = (catalog || []).filter(i => requested.includes(i.ticker));
    const choices = allChoices.filter(i => !equityContext || window.GCInstrumentRegistry.matchesListingType(i, vehicle));
    choices.sort((a, b) => requested.indexOf(a.ticker) - requested.indexOf(b.ticker));
    const active = choices.find(i => i.ticker === selected) || choices[0];
    if (catalog === null) return h("p", { className: "data-note", role: "status" }, "Loading ETF information…");
    return h(React.Fragment, null,
      failed ? h("p", { className: "data-note", role: "status" }, "Fund information could not be loaded. Unavailable fields are shown as n/a.") : null,
      equityContext ? h("div", { className: "listing-type-controls" }, h(ListingTypeFilter, { vehicle, onChange: setVehicle })) : null,
      choices.length > 1 || (equityContext && choices.length) ? h("div", { className: "etf-profile-picker", "aria-label": "Select ETF information" }, choices.map(i =>
        h("button", { key: i.ticker, type: "button", className: equityContext ? "etf-listing-token" : undefined,
          "aria-label": equityContext ? `Select ${i.ticker} (${window.GCInstrumentRegistry.listingLabelFor(i)})` : undefined,
          "aria-pressed": (active?.ticker === i.ticker), onClick: () => setSelected(i.ticker) }, equityContext ? h(ListingLabel, { item: i }) : i.ticker))) : null,
      equityContext && !active && !failed ? h("p", { className: "data-note", role: "status" }, "No ETFs match these filters.")
        : h(Profile, { key: active?.ticker || instruments, item: active, fallback: { ...fallback, ticker: requested[0] },
          showName: showName || choices.length > 1, action: active && renderAction ? renderAction(active.ticker) : null }));
  }
  function ListingLabel({ item }) {
    return h(React.Fragment, null, h("strong", null, item.ticker.split("_")[0]),
      h("small", null, window.GCInstrumentRegistry.listingLabelFor(item)));
  }
  function ListingTypeFilter({ vehicle, onChange, label = "Equity listing type" }) {
    return h("nav", { className: "ucits-toggle", "aria-label": label },
      [["all", "All"], ["us", "US-listed"], ["ucits", "UCITS"]].map(([value, text]) =>
        h("button", { key: value, type: "button", "aria-pressed": vehicle === value, onClick: () => onChange(value) }, text)));
  }
  function FixedIncomeFilters({ category, segment, vehicle, onCategory, onSegment, onVehicle }) {
    const registry = window.GCInstrumentRegistry;
    const buttons = (choices, selected, change, className = "unified-instrument-button") => choices.map(([value, label]) => h("button", {
      key: value, type: "button", className, "aria-pressed": selected === value, onClick: () => change(value)
    }, label));
    return h("div", { className: "fixed-income-controls" },
      h("nav", { className: "etf-subtabs", "aria-label": "Fixed income categories" },
        buttons(registry.FIXED_INCOME_CATEGORIES.map(label => [label, label]), category, onCategory)),
      registry.FIXED_INCOME_SEGMENTS[category] ? h("nav", { className: "etf-subtabs", "aria-label": "Fixed income segments" },
        buttons(registry.FIXED_INCOME_SEGMENTS[category].map(label => [label, label]), segment, onSegment)) : null,
      h(ListingTypeFilter, { vehicle, onChange: onVehicle, label: "Fixed income listing type" }));
  }
  return { Cards, FixedIncomeFilters, ListingTypeFilter, ListingLabel, buildProfile, annualPercent, validIsin, formatAssets, metadataNote };
})();
