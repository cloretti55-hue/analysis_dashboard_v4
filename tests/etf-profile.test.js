const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const context = { window: {}, React: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/js/components/etf-profile.js', 'utf8'), context);
const api = context.window.GCEtfProfiles;
const catalog = JSON.parse(fs.readFileSync('data/etf-universe.json', 'utf8')).instruments;
test('all catalog instruments have individual cards with unique labelled facts', () => {
  assert.equal(new Set(catalog.map(i => i.ticker)).size, catalog.length);
  for (const item of catalog) {
    const p = api.buildProfile(item);
    assert.equal(p.identification.length, 8, item.ticker);
    assert.ok(p.features.length >= 2, item.ticker);
    assert.equal(new Set(p.features.map(r => r.label)).size, p.features.length, item.ticker);
    assert.ok(p.about.length > 0, item.ticker);
    for (const row of [...p.identification, ...p.features]) {
      assert.ok(typeof row.value === 'string' && row.value.length > 0, item.ticker);
      assert.ok(!/\b(?:NaN|Infinity|undefined|null)\b/.test(row.value), `${item.ticker}: ${row.value}`);
    }
  }
});
test('fees distinguish fractional annual expense from management fee', () => {
  assert.equal(api.annualPercent({ value: .0003, unit: 'fraction_per_year' }), '0.03% p.a.');
  assert.equal(api.annualPercent({ value: 0, unit: 'fraction_per_year' }), '0% p.a.');
  for (const value of [null, -1, Infinity, NaN, true, '0.03']) {
    assert.equal(api.annualPercent({ value, unit: 'fraction_per_year' }), 'n/a');
  }
  assert.equal(api.annualPercent({ value: .03 }), 'n/a');
  const item = catalog.find(i => i.ticker === 'VOO');
  const p = api.buildProfile(item);
  assert.equal(p.identification.find(r => r.label === 'Expense ratio (annual)').value, '0.03% p.a.');
  assert.equal(p.identification.find(r => r.label === 'Management fee (annual)').value, 'n/a');
});
test('trading currency is independent from net-assets currency', () => {
  const p = api.buildProfile({ ticker: 'TEST', currency: 'USD', profile: { listing: { currency: 'GBp' } }, fundAssets: { value: 12e9, currency: 'USD' } });
  assert.match(p.identification.find(r => r.label === 'Trading currency').value, /British pence/);
  assert.equal(p.identification.find(r => r.label === 'Net assets').value, 'USD 12B');
  assert.equal(api.formatAssets({ value: Infinity, currency: 'USD' }), 'n/a');
  assert.equal(api.formatAssets({ value: 100, currency: null }), 'n/a');
});
test('ISIN requires an explicit checksum-valid identifier; listing is never used as ISIN', () => {
  assert.equal(api.validIsin('US9229083632'), true);
  for (const isin of ['VOO', 'US9229083633', null, '123456789012', '']) assert.equal(api.validIsin(isin), false);
  const p = api.buildProfile({ ticker: 'VOO', quoteSymbol: 'VOO' });
  assert.equal(p.identification.find(r => r.label === 'ISIN').value, 'n/a');
});
test('stale fields retain value with a visible last-available label', () => {
  assert.equal(api.metadataNote({ status: 'stale', value: 0, collectedAt: '2026-10-20' }, Date.parse('2026-10-21')).stale, true);
  assert.equal(api.metadataNote({ value: 20, collectedAt: '2026-09-01' }, Date.parse('2026-10-21')).stale, true);
  assert.equal(api.metadataNote({ value: 20, collectedAt: '2026-10-20' }, Date.parse('2026-10-21')).stale, false);
});

test('verified reference fields override Yahoo without expiring after 14 days', () => {
  const item = catalog.find(i => i.ticker === 'LFTB11');
  const p = api.buildProfile({ ...item, fundMetadata: { provider: { value: 'Different Yahoo family' } } });
  assert.equal(p.identification.find(r => r.label === 'Fund provider').value, 'Investo Gestão de Recursos Ltda.');
  assert.equal(p.identification.find(r => r.label === 'ISIN').value, 'BRLFTBCTF002');
  const note = api.metadataNote(item.fundReference.provider, Date.parse('2028-10-22'));
  assert.equal(note.stale, false);
  assert.match(note.note, /Verified 2026-10-22/);
  assert.doesNotMatch(note.note, /Retrieved|Last available/);
  assert.ok(p.metadataSources.some(s => s.label === 'Fund provider' && s.source === 'Investo'));
});

test('reference records require verified provenance and the same listing', () => {
  const base = catalog.find(i => i.ticker === 'LFTB11');
  const yahoo = { provider: { value: 'Yahoo fallback' }, isin: { value: 'US9229083632' } };
  for (const invalid of [{ quoteSymbol: 'LFTS11.SA' }, { sourceUrl: 'http://example.com' },
    { status: 'needs_review' }, { verifiedAt: null }, { source: '' }, { cadence: 'weekly' }]) {
    const item = { ...base, fundMetadata: yahoo, fundReference: {
      provider: { ...base.fundReference.provider, ...invalid },
      isin: { ...base.fundReference.isin, ...invalid },
    } };
    const p = api.buildProfile(item);
    assert.equal(p.identification.find(r => r.label === 'Fund provider').value, 'Yahoo fallback');
    assert.equal(p.identification.find(r => r.label === 'ISIN').value, 'US9229083632');
  }
  const p = api.buildProfile({ ...base, fundMetadata: {}, fundReference: {
    provider: { ...base.fundReference.provider, role: 'administrator' },
    isin: { ...base.fundReference.isin, value: 'BRLFTBCTF003' },
  } });
  assert.equal(p.identification.find(r => r.label === 'Fund provider').value, 'n/a');
  assert.equal(p.identification.find(r => r.label === 'ISIN').value, 'n/a');
});

test('every reference record has provenance and a checksum-valid ISIN', () => {
  let referenceIsins = 0;
  for (const item of catalog) {
    for (const [key, field] of Object.entries(item.fundReference || {})) {
      assert.ok(['provider', 'isin'].includes(key), item.ticker);
      assert.equal(field.quoteSymbol, item.quoteSymbol, item.ticker);
      assert.equal(field.status, 'verified', item.ticker);
      assert.equal(field.cadence, 'event_driven', item.ticker);
      assert.ok(/^https:\/\//.test(field.sourceUrl), item.ticker);
      assert.ok(field.source && /^\d{4}-\d{2}-\d{2}$/.test(field.verifiedAt), item.ticker);
      if (key === 'isin') {
        referenceIsins++;
        assert.equal(api.validIsin(field.value), true, `${item.ticker}: ${field.value}`);
        assert.equal(api.buildProfile(item).identification.find(r => r.label === 'ISIN').value, field.value);
      }
    }
    assert.notEqual(api.buildProfile(item).identification.find(r => r.label === 'Fund provider').value, 'n/a', item.ticker);
  }
  assert.ok(referenceIsins >= 67);
  const brazil = catalog.filter(i => i.market === 'Brazil');
  assert.equal(brazil.length, 22);
  assert.ok(brazil.every(i => i.fundReference?.provider && i.fundReference?.isin));
  // Keep the US VPN separate from the European UCITS product with the same ticker.
  assert.equal(catalog.find(i => i.ticker === 'VPN').fundReference.isin.value, 'US37954Y2366');
  assert.equal(catalog.find(i => i.ticker === 'CATL').fundReference.isin.value, 'GB00B15KY096');
});
test('failed catalog supports the existing listing and a useful fallback description', () => {
  const p = api.buildProfile(undefined, { ticker: 'IB01', name: 'Treasury ETF', listing: { symbol: 'IB01.L', exchange: 'London Stock Exchange', currency: 'USD' }, about: ['Holds short-term Treasuries.'] });
  assert.equal(p.ticker, 'IB01');
  assert.equal(p.identification.find(r => r.label === 'Listing').value, 'IB01.L');
  assert.equal(p.identification.find(r => r.label === 'Net assets').value, 'n/a');
  assert.equal(p.about[0], 'Holds short-term Treasuries.');
});
test('fixed-income duration is not inferred from maturity or a repricing target', () => {
  const p = api.buildProfile(catalog.find(i => i.ticker === 'LFTB11'));
  assert.match(p.features.find(r => r.label === 'Duration').value, /unavailable/);
  assert.match(p.features.find(r => r.label === 'Target repricing term').value, /not modified duration/);
});
test('ETN charges do not become an ETF management fee', () => {
  const p = api.buildProfile(catalog.find(i => i.ticker === 'VXX'));
  assert.ok(p.identification.find(r => r.label === 'Reported annual charge'));
  assert.equal(p.identification.find(r => r.label === 'Management fee (annual)').value, 'n/a');
});
test('the full ETF module loads and each description area can initialise', () => {
  const c = { window: {}, React: {
    useState: initial => [initial, () => {}], useEffect: () => {}, createElement: () => null,
  } };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync('assets/js/core/instrument-registry.js', 'utf8'), c);
  vm.runInContext(fs.readFileSync('assets/js/components/etf-profile.js', 'utf8'), c);
  const source = fs.readFileSync('assets/js/modules/etfs.js', 'utf8').replace('window.GCEtfs = {',
    'window.TestAreas = { CoreModule, FixedIncomeModule, SectorGicsModule, HedgeModule, SatelliteModule, EuropeModule, ChinaModule, CommodityModule, LiquidAlternativesModule, BrazilEtfsModule }; window.GCEtfs = {');
  vm.runInContext(source, c);
  for (const [name, component] of Object.entries(c.window.TestAreas)) {
    const props = { items: catalog.filter(i => name === 'BrazilEtfsModule' ? i.market === 'Brazil' : i.liquidFamily), dataLabTickers: new Set() };
    assert.doesNotThrow(() => component(props), name);
  }
});

function navigationRuntime() {
  const c = { window: { location: { hash: '' }, GCCommon: {} }, React: {
    useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: () => {}, createElement: (type, props, ...children) => ({ type, props, children }),
  } };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync('assets/js/core/instrument-registry.js', 'utf8'), c);
  vm.runInContext(fs.readFileSync('assets/js/modules/etfs.js', 'utf8').replace('window.GCEtfs = {',
    'window.TestThemes = { SatelliteModule, EuropeModule, ChinaModule, themeForTicker }; window.GCEtfs = {'), c);
  vm.runInContext(fs.readFileSync('assets/js/modules/data-lab.js', 'utf8').replace('window.GCDataLab = {',
    'window.TestDataLab = { EtfContextLink }; window.GCDataLab = {'), c);
  return c;
}

test('both hedge views remain accessible, reloadable and retain all five payoff images', () => {
  let states = [], hook = 0;
  const c = { window: {
    location: { hash: '#etfs/hedges/ideas' },
    history: { replaceState: (_state, _title, hash) => { c.window.location.hash = hash; } },
    matchMedia: () => ({ matches: false }),
  }, React: {
    useState: initial => {
      const index = hook++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], value => { states[index] = value; }];
    },
    useEffect: () => {}, createElement: (type, props, ...children) => ({ type, props, children }),
  } };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync('assets/js/core/instrument-registry.js', 'utf8'), c);
  vm.runInContext(fs.readFileSync('assets/js/modules/etfs.js', 'utf8').replace('window.GCEtfs = {',
    'window.TestHedge = HedgeModule; window.GCEtfs = {'), c);
  const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.children || [])] : [];
  const render = () => { hook = 0; return nodes(c.window.TestHedge({ initialTheme: 'ideas' })); };
  let tree = render();
  const views = tree.filter(n => n.type === 'button');
  assert.deepEqual(views.map(n => n.children[0]), ['ETF Strategies', 'Hedge Ideas/Structures']);
  assert.equal(views[1].props['aria-pressed'], true);
  assert.ok(tree.some(n => n.type === c.window.GCEtfs.HedgeIdeasModule));
  views[0].props.onClick();
  assert.equal(c.window.location.hash, '#etfs/hedges/JEPI');
  tree = render();
  assert.equal(tree.find(n => n.type === 'button').props['aria-pressed'], true);
  tree.filter(n => n.type === 'button')[1].props.onClick();
  assert.equal(c.window.location.hash, '#etfs/hedges/ideas');
  states = [];
  const renderIdeas = () => { hook = 0; return nodes(c.window.GCEtfs.HedgeIdeasModule()); };
  const families = renderIdeas().filter(n => n.type === 'button');
  assert.equal(families.length, 5);
  const images = new Set();
  for (const family of families) {
    family.props.onClick();
    const image = renderIdeas().find(n => n.type === 'img');
    assert.ok(fs.existsSync(image.props.src), image.props.src);
    images.add(image.props.src);
  }
  assert.equal(images.size, 5);
});

test('thematic return links select the exact ETF and respect shared-fund context', () => {
  const c = navigationRuntime();
  const cases = [
    ['SOXX', 'US Satellites', 'satellites', 'Semiconductors / AI hardware'],
    ['HACK', 'US Satellites', 'satellites', 'Cybersecurity'],
    ['GLUX', 'European Themes', 'europe', 'Luxury / indirect China'],
    ['XDWH', 'European Themes', 'europe', 'Pharma / healthcare'],
    ['SOXX', 'European Themes', 'europe', 'European semiconductors'],
    ['PAVE', 'European Themes', 'europe', 'Electrification / industrials'],
    ['KBA', 'China / China+1', 'china', 'Direct China'],
    ['FLIN', 'China / China+1', 'china', 'China+1'],
    ['EXCH', 'China / China+1', 'china', 'EM ex-China'],
  ];
  for (const [ticker, group, tab, theme] of cases) {
    const expected = `#etfs/${tab}/${ticker}`;
    assert.equal(c.window.GCEtfs.etfHrefForTicker(ticker, group), expected);
    assert.equal(c.window.TestThemes.themeForTicker(tab, ticker), theme);
    c.window.location.hash = `#dataLab/${ticker}/${tab}`;
    // Even when DataLab groups a shared proxy elsewhere, return to the originating theme.
    const link = c.window.TestDataLab.EtfContextLink({ ticker, group: 'Sectors' });
    assert.equal(link.props.href, expected);
    assert.equal(link.props['aria-label'], `Open ${ticker} in ETFs`);
  }
  c.window.location.hash = '#dataLab/SOXX/europe';
  assert.equal(c.window.TestDataLab.EtfContextLink({ ticker: 'KBA', group: 'China / China+1' }).props.href, '#etfs/china/KBA');
  assert.equal(c.window.GCEtfs.etfHrefForTicker('VOO', 'Caps/Style'), '#etfs/caps/VOO');
  assert.equal(c.window.GCEtfs.etfHrefForTicker('SDS', 'Hedges & Overlays'), '#etfs/hedges/SDS');
  assert.equal(c.window.GCEtfs.etfHrefForTicker('unknown', 'European Themes'), null);
});

test('the thematic card action follows the selected ETF, not the first family member', () => {
  const c = navigationRuntime();
  let selected = 'SOXX';
  let stateIndex = 0;
  c.React.useState = initial => {
    const index = stateIndex++;
    return index === 0 ? [catalog, () => {}] : index === 1 ? [false, () => {}]
      : [selected || initial, value => { selected = value; }];
  };
  vm.runInContext(fs.readFileSync('assets/js/components/etf-profile.js', 'utf8'), c);
  const props = { instruments: 'SMH / SOXX', initialTicker: 'SOXX', showName: true,
    renderAction: ticker => ({ ticker, href: `#dataLab/${ticker}/satellites` }) };
  let tree = c.window.GCEtfProfiles.Cards(props);
  let profile = tree.children.find(node => node?.props?.item);
  assert.equal(profile.props.item.ticker, 'SOXX');
  assert.equal(profile.props.action.href, '#dataLab/SOXX/satellites');
  tree.children.find(node => node?.props?.className === 'etf-profile-picker').children[0].find(button => button.children[0] === 'SMH').props.onClick();
  stateIndex = 0;
  tree = c.window.GCEtfProfiles.Cards(props);
  profile = tree.children.find(node => node?.props?.item);
  assert.equal(profile.props.item.ticker, 'SMH');
  assert.equal(profile.props.action.href, '#dataLab/SMH/satellites');
});

test('chart period selection uses prepared windows with a safe short-history fallback', () => {
  const c = navigationRuntime();
  const { chartWindowFor, chartPeriodChoices } = c.window.GCDataLab;
  const window = end => ({ available: true, points: [
    { date: '2025-12-31', etf: 100, sp500: 100 }, { date: '2026-10-21', etf: end, sp500: 105 },
  ] });
  const active = { ticker: 'VOO', performanceChart: { points: window(110).points, periods: {
    ytd: window(110), '1y': window(120), '3y': window(140), '5y': window(160),
  } } };
  assert.equal(chartWindowFor(active).selected.key, '3y');
  assert.equal(chartWindowFor(active, '5y').chart.points[1].etf, 160);
  assert.equal(chartPeriodChoices(active).filter(p => p.available).length, 4);
  active.performanceChart.periods['5y'] = { available: false, reason: 'Insufficient history' };
  assert.equal(chartWindowFor(active, '5y').selected.key, '3y');
  assert.equal(chartPeriodChoices(active)[3].reason, 'Insufficient history');
  const short = { ticker: 'VOO', performanceChart: { points: window(102).points } };
  assert.equal(chartWindowFor(short).selected, undefined);
  assert.equal(chartWindowFor(short).chart, short.performanceChart);
  assert.ok(chartPeriodChoices(short).every(p => !p.available));
});

test('invalid or mismatched period levels never enable a period button', () => {
  const c = navigationRuntime();
  const valid = [ {date:'2025-12-31', etf:100, cash:100}, {date:'2026-10-21', etf:110, cash:104} ];
  for (const points of [
    [{ ...valid[0], etf:99 }, valid[1]], [valid[0], { ...valid[1], etf:NaN }],
    [valid[0], { ...valid[1], cash:undefined }], [valid[0], { ...valid[1], date:valid[0].date }],
    [{ ...valid[0], cash:99 }, valid[1]],
  ]) {
    const active = {ticker:'IB01',assetClass:'fixed_income',performanceChart:{ points:valid,
      periods: {ytd:{available:true,points}} }};
    assert.equal(c.window.GCDataLab.chartPeriodChoices(active)[0].available, false);
  }
});
