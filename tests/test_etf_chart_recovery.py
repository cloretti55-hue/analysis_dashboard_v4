import importlib.util
import json
from datetime import date
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('etf_recovery', Path(__file__).resolve().parents[1] / 'scripts/update-etf-performance.py')
updater = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(updater)


class ChartRecoveryTests(unittest.TestCase):
    def simulate(self, ticker, previous_valid=True, prior_symbol=None):
        commodity = ticker == 'CATL'
        item = dict(ticker=ticker, name=ticker, assetClass='commodity' if commodity else 'equity',
                    category='test', wrapper='ETF', currency='USD', quoteSource='yahoo_chart',
                    quoteSymbol='CATL.L' if commodity else 'VPN', benchmark='SPY',
                    compareToSp500=False, comparisonBenchmarks=['CPI', 'SPY'] if commodity else [])
        points = [dict(date='2026-09-10', etf=100., cpi=100., sp500=100.),
                  dict(date='2026-09-11', etf=101., cpi=100.1, sp500=102.)]
        previous = dict(item, status='ok', asOf='2026-09-11', lastClose=101.,
                        performanceChart={'points': points} if previous_valid else None)
        if prior_symbol: previous['quoteSymbol'] = prior_symbol
        history = [dict(date=date(2026, 9, 14), close=100.)]
        if commodity: history.append(dict(date=date(2026, 9, 15), close=101.))
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            universe = root/'universe.json'; output = root/'performance.json'
            universe.write_text(json.dumps({'instruments': [item], 'benchmarkDefaults': {'sp500': {'quoteSymbol': 'SPY'}, 'cpi': {'series': 'CPIAUCSL'}}}))
            output.write_text(json.dumps({'instruments': [previous]}))
            # CATL's CPI begins after the first ETF point, so normalization cannot
            # establish the CPI base. VPN has only one source observation.
            with patch.multiple(updater, UNIVERSE_PATH=universe, OUTPUT_PATH=output), \
                 patch.object(updater, 'write_fixed_income_fallback'), \
                 patch.object(updater, 'fetch_yahoo_chart_history', return_value=history), \
                 patch.object(updater, 'fetch_fred_index_history', return_value=[dict(date=date(2026, 9, 15), close=100.)]), \
                 patch.object(updater, 'metrics_for_history', return_value={'asOf': '2026-09-15', 'lastClose': 102.}):
                updater.main()
            payload = json.loads(output.read_text())
        return payload, previous

    def test_vpn_single_observation_retains_entire_previous_record(self):
        payload, previous = self.simulate('VPN')
        record = payload['instruments'][0]
        self.assertTrue(record['stale'])
        for key in ('asOf', 'lastClose', 'performanceChart'):
            self.assertEqual(record[key], previous[key])
        self.assertEqual(payload['asOf'], previous['asOf'])

    def test_catl_missing_cpi_retains_complete_previous_chart(self):
        payload, previous = self.simulate('CATL')
        record = payload['instruments'][0]
        self.assertTrue(record['stale'])
        self.assertIn('cpi', record['refreshError'])
        self.assertEqual(record['performanceChart'], previous['performanceChart'])

    def test_invalid_previous_is_not_promoted_to_ok(self):
        payload, _ = self.simulate('VPN', previous_valid=False)
        self.assertEqual(payload['instruments'][0]['status'], 'error')
        self.assertIsNone(payload['asOf'])

    def test_changed_listing_cannot_reuse_old_chart(self):
        payload, _ = self.simulate('VPN', prior_symbol='OTHER')
        self.assertEqual(payload['instruments'][0]['status'], 'error')

    def test_invalid_numeric_points_are_rejected(self):
        self.assertIsNotNone(updater.chart_problem({'performanceChart': {'points': [{'etf': 100}, {'etf': float('nan')}]}}, {}))


if __name__ == '__main__': unittest.main()
