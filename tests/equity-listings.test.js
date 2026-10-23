const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const catalog = JSON.parse(fs.readFileSync('data/etf-universe.json', 'utf8')).instruments;
const performance = JSON.parse(fs.readFileSync('data/etf-performance.json', 'utf8')).instruments;

function runtime(firstState) {
  let states = [], hook = 0;
  const c = { window: {
    location: { hash: '#dataLab/VOO' }, matchMedia: () => ({ matches: false }),
    GCCommon: { formatDatePtBr: value => value, DATASET_STATUS_LABELS: {} },
  }, React: {
    useState(initial) {
      const i = hook++;
      if (!(i in states)) states[i] = i === 0 && firstState !== undefined ? firstState
        : typeof initial === 'function' ? initial() : initial;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
    },
    useEffect: () => {}, createElement: (type, props, ...children) => ({ type, props, children }),
  } };
  vm.createContext(c);
  for (const name of ['core/instrument-registry.js', 'components/etf-profile.js', 'modules/etfs.js', 'modules/data-lab.js']) {
    let source = fs.readFileSync('assets/js/' + name, 'utf8');
    if (name.endsWith('/etfs.js')) source = source.replace('window.GCEtfs = {',
      'window.EquityTest = { CoreModule, SectorGicsModule, CAPS_FUNCTIONS }; window.GCEtfs = {');
    vm.runInContext(source, c);
  }
  return { c, render(component, props) { hook = 0; return component(props); } };
}
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes)
  : tree && typeof tree === 'object' ? [tree, ...nodes(tree.children || [])] : [];
const tokens = tree => nodes(tree).filter(n => n.type === 'button' && n.props.className?.includes('etf-listing-token'));
const tickerOf = node => node.props['aria-label'].match(/^Select (\S+)/)[1];

test('listing classification uses explicit wrapper data and never guesses unknown wrappers', () => {
  const { c } = runtime();
  const r = c.window.GCInstrumentRegistry;
  assert.equal(r.listingLabelFor(catalog.find(i => i.ticker === 'VOO')), 'US-listed');
  assert.equal(r.listingLabelFor(catalog.find(i => i.ticker === 'CSPX')), 'UCITS');
  assert.equal(r.listingLabelFor({ ticker: 'UNKNOWN' }), 'n/a');
  assert.equal(r.matchesListingType({ wrapper: 'B3-listed ETF' }, 'us'), false);
});

test('Core, Cap/Style and Sectors hide nonmatching ETFs instead of disabling them', () => {
  for (const area of ['core', 'caps', 'sectors']) {
    const { c, render } = runtime();
    const component = area === 'sectors' ? c.window.EquityTest.SectorGicsModule : c.window.EquityTest.CoreModule;
    const props = { items: catalog, dataLabTickers: new Set(), ...(area === 'caps' ? {
      functions: c.window.EquityTest.CAPS_FUNCTIONS, contextGroup: 'Caps/Style', initialEtf: 'IWC',
    } : {}) };
    const all = tokens(render(component, props)).map(tickerOf);
    const subsets = [];
    for (const vehicle of ['ucits', 'us', 'all']) {
      const filter = nodes(render(component, props)).find(n => n.type === c.window.GCEtfProfiles.ListingTypeFilter);
      filter.props.onChange(vehicle);
      const visible = tokens(render(component, props));
      assert.ok(visible.length, area + '/' + vehicle);
      assert.ok(visible.every(n => !n.props.disabled));
      if (vehicle === 'all') assert.deepEqual(visible.map(tickerOf), all);
      else {
        assert.ok(visible.every(n => c.window.GCInstrumentRegistry.matchesListingType(catalog.find(i => i.ticker === tickerOf(n)), vehicle)));
        subsets.push(...visible.map(tickerOf));
      }
    }
    assert.deepEqual(subsets.sort(), [...all].sort());
  }
});

test('thematic ETF selectors filter the actual fund and never show a wrong-wrapper fallback', () => {
  const { c, render } = runtime(catalog);
  const component = c.window.GCEtfProfiles.Cards;
  const props = { instruments: 'EMXC / EXCH', contextGroup: 'China / China+1', initialTicker: 'EXCH',
    renderAction: ticker => ({ ticker }) };
  for (const [vehicle, expected] of [['us', 'EMXC'], ['ucits', 'EXCH']]) {
    nodes(render(component, props)).find(n => n.type === c.window.GCEtfProfiles.ListingTypeFilter).props.onChange(vehicle);
    const tree = render(component, props);
    assert.deepEqual(tokens(tree).map(tickerOf), [expected]);
    const profile = nodes(tree).find(n => n.props?.item && n.props?.action);
    assert.equal(profile.props.item.ticker, expected);
    assert.equal(profile.props.action.ticker, expected);
  }
  const usOnly = { ...props, instruments: 'SMH / SOXX', contextGroup: 'US Satellites' };
  const empty = render(component, usOnly);
  assert.equal(tokens(empty).length, 0);
  assert.ok(!nodes(empty).some(n => n.props?.item));
  assert.ok(nodes(empty).some(n => n.children?.includes('No ETFs match these filters.')));
});

test('exposure and listing filters intersect without resetting the requested exposure', () => {
  const { c, render } = runtime();
  const component = c.window.EquityTest.CoreModule;
  const props = { items: catalog };
  nodes(render(component, props)).find(n => n.type === 'button' && n.children[0] === 'Developed global').props.onClick();
  nodes(render(component, props)).find(n => n.type === c.window.GCEtfProfiles.ListingTypeFilter).props.onChange('us');
  const empty = render(component, props);
  assert.equal(tokens(empty).length, 0);
  assert.ok(nodes(empty).some(n => n.children?.includes('No ETFs match these filters.')));
  nodes(empty).find(n => n.type === c.window.GCEtfProfiles.ListingTypeFilter).props.onChange('all');
  assert.deepEqual(tokens(render(component, props)).map(tickerOf), ['IWDA', 'SWDA']);
});

test('all six Data Lab equity families filter listing types and keep each selected detail in scope', () => {
  const seed = runtime();
  const registry = seed.c.window.GCInstrumentRegistry;
  const lookup = registry.createCatalog(catalog);
  const payload = { instruments: performance.map(item => lookup.enrich(item)) };
  const { c, render } = runtime(payload);
  const component = c.window.GCDataLab.DataLabModule;
  let tree = render(component);
  nodes(tree).find(n => n.type === 'button' && n.children[0] === 'Equities').props.onClick();
  for (const group of c.window.GCInstrumentRegistry.EQUITY_GROUPS) {
    const label = group === 'Core Equities' ? 'Core' : group === 'Caps/Style' ? 'Cap/Style' : group;
    tree = render(component);
    nodes(tree).find(n => n.props?.className === 'data-lab-filter' && n.children[0].startsWith(label + ' ')).props.onClick();
    for (const vehicle of ['ucits', 'us', 'all']) {
      tree = render(component);
      nodes(tree).find(n => n.type === c.window.GCEtfProfiles.ListingTypeFilter).props.onChange(vehicle);
      tree = render(component);
      const buttons = nodes(tree).filter(n => n.props?.className?.startsWith('data-lab-chip '));
      const expected = payload.instruments.filter(i => registry.belongsToGroup(i, group) && registry.matchesListingType(i, vehicle));
      assert.equal(buttons.length, expected.length, group + '/' + vehicle);
      assert.ok(buttons.every(n => !n.props.disabled));
      assert.deepEqual(buttons.map(n => n.props.key).sort(), expected.map(i => i.ticker).sort());
      const displayed = nodes(tree).find(n => n.type === 'h2');
      if (!expected.length) assert.ok(nodes(tree).some(n => n.children?.includes('No ETFs match these filters.')));
      else assert.ok(displayed && expected.some(i => displayed.children.includes(registry.instrumentLabel(i))));
    }
  }
});
