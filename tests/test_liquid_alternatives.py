import json
import math
import subprocess
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TICKERS = set("DBMF CTA FMF FFUT WTMF SDMF KMLM BTAL FTLS MNA HFGM GMAC SAMM".split())

class LiquidAlternativesTests(unittest.TestCase):
    def test_catalog_and_chart_coverage(self):
        universe = json.loads((ROOT / "data/etf-universe.json").read_text(encoding="utf-8"))
        rows = [x for x in universe["instruments"] if x.get("displayGroup") == "Liquid Alternatives"]
        self.assertEqual({x["ticker"] for x in rows}, TICKERS)
        self.assertEqual(len(rows), 13)
        performance = json.loads((ROOT / "data/etf-performance.json").read_text(encoding="utf-8"))
        data = {x["ticker"]: x for x in performance["instruments"]}
        for item in rows:
            self.assertEqual(item["currency"], "USD")
            self.assertEqual(item["quoteSymbol"], item["ticker"])
            record = data[item["ticker"]]
            self.assertEqual(record["status"], "ok")
            points = record["performanceChart"]["points"]
            self.assertGreaterEqual(len(points), 2)
            self.assertEqual(points[0]["etf"], 100)
            self.assertEqual(points[0]["sp500"], 100)
            self.assertEqual(points[0]["cash"], 100)
            self.assertEqual(record["cashBenchmarkStatus"], "ok")
            self.assertTrue(all(math.isfinite(p[k]) and p[k] > 0 for p in points for k in ("etf", "sp500", "cash")))

    def test_registry_and_round_trip_routes(self):
        script = r"""
const assert = require('node:assert/strict');
global.window = {}; global.React = {useEffect(){},useState(){}};
require('./assets/js/core/instrument-registry.js');
require('./assets/js/modules/etfs.js');
const r=window.GCInstrumentRegistry;
assert.equal(r.LIQUID_FAMILIES.length,4);
const tickers=r.LIQUID_FAMILIES.flatMap(f=>Object.values(f.subgroups).flat());
assert.equal(tickers.length,13);assert.equal(new Set(tickers).size,13);
assert.ok(r.GLOBAL_ASSET_CLASSES.find(x=>x.label==='Alternatives').tabs.includes('liquid'));
for(const item of require('./data/etf-universe.json').instruments.filter(x=>tickers.includes(x.ticker))){
 assert.equal(r.groupFor(item),'Liquid Alternatives');
 assert.deepEqual(r.chartBenchmarksFor(item,[{sp500:100,cash:100},{sp500:101,cash:100.01}]).map(x=>x.key),['sp500','cash']);
 assert.notEqual(r.subgroupTone(r.subgroupFor(item)),'#7fb8ff');
 assert.ok(r.DATA_LAB_SUBGROUP_ORDER['Liquid Alternatives'].includes(r.subgroupFor(item)));
 assert.equal(window.GCEtfs.etfHrefForTicker(item.ticker,'Liquid Alternatives'),'#etfs/liquid/'+item.ticker);
 assert.ok(r.metricsFor(item).some(([key])=>key==='correlation1yVsSp500'));
}
"""
        subprocess.run(["node", "-e", script], cwd=ROOT, check=True, capture_output=True)

if __name__ == "__main__":
    unittest.main()
