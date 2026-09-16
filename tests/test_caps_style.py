import importlib.util
import json
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
UNIVERSE = json.loads((ROOT / 'data/etf-universe.json').read_text(encoding='utf-8'))
NEW = {item['ticker']: item for item in UNIVERSE['instruments'] if item['category'] == 'Caps / Style'}
spec = importlib.util.spec_from_file_location('caps_updater', ROOT / 'scripts/update-etf-performance.py')
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)


class CapsStyleTests(unittest.TestCase):
    def test_scope_and_distinct_listings(self):
        self.assertEqual(set(NEW), {'IJH', 'SPY4', 'IJR', 'IDP6', 'IWC', 'SCZ', 'VSS', 'WSML'})
        self.assertEqual(NEW['IDP6']['quoteSymbol'], 'IDP6.L')
        self.assertEqual(NEW['IDP6']['currency'], 'USD')
        self.assertEqual(NEW['WSML']['region'], 'Developed global')
        self.assertEqual(NEW['SCZ']['region'], 'Developed ex-US')
        self.assertEqual(NEW['VSS']['region'], 'Global ex-US')
        for item in NEW.values():
            self.assertTrue(item['sourceUrl'].startswith('https://'))
            self.assertTrue(item['trackedIndex'])
            self.assertEqual(item['quoteSource'], 'yahoo_chart')

    def test_existing_large_caps_share_records(self):
        for ticker in ('VOO', 'CSPX', 'VUAA'):
            matches = [item for item in UNIVERSE['instruments'] if item['ticker'] == ticker]
            self.assertEqual(len(matches), 1)
            self.assertEqual(matches[0]['category'], 'Core US equity')
            self.assertEqual(matches[0]['capsStyle']['size'], 'Large cap')

    def test_new_charts_have_finite_prices_and_benchmark(self):
        records = json.loads((ROOT / 'data/etf-performance.json').read_text(encoding='utf-8'))['instruments']
        for record in records:
            if record['ticker'] not in NEW: continue
            self.assertEqual(record['status'], 'ok')
            self.assertIsNone(updater.chart_problem(record, NEW[record['ticker']]))
            self.assertGreater(len(record['performanceChart']['points']), 100)
            self.assertTrue(all(point.get('sp500', 0) > 0 for point in record['performanceChart']['points']))

    def test_collector_discovers_new_instruments_and_retains_after_outage(self):
        history = [dict(date=date(2025, 1, 1)+timedelta(days=i), close=100+i*.1) for i in range(500)]
        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            catalog = directory / 'universe.json'
            output = directory / 'performance.json'
            catalog.write_text(json.dumps({**UNIVERSE, 'instruments': list(NEW.values())}), encoding='utf-8')
            with patch.object(updater, 'UNIVERSE_PATH', catalog), patch.object(updater, 'OUTPUT_PATH', output), \
                 patch.object(updater, 'FIXED_INCOME_FALLBACK_PATH', directory / 'fixed.json'), \
                 patch.object(updater, 'write_fixed_income_fallback'):
                with patch.object(updater, 'fetch_yahoo_chart_history', return_value=history) as fetch:
                    updater.main()
                requested = {call.args[0] for call in fetch.call_args_list}
                self.assertTrue({item['quoteSymbol'] for item in NEW.values()}.issubset(requested))
                self.assertIn('SPY', requested)
                before = json.loads(output.read_text(encoding='utf-8'))['instruments']
                self.assertTrue(all(item['status'] == 'ok' for item in before))
                with patch.object(updater, 'fetch_yahoo_chart_history', side_effect=TimeoutError('test outage')):
                    updater.main()
                after = json.loads(output.read_text(encoding='utf-8'))['instruments']
                for old, retained in zip(before, after):
                    self.assertTrue(retained['stale'])
                    self.assertEqual(retained['performanceChart'], old['performanceChart'])
                    self.assertEqual(retained['asOf'], old['asOf'])


if __name__ == '__main__': unittest.main()
