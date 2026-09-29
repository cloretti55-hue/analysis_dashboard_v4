import importlib.util
import unittest
from pathlib import Path
from datetime import date

spec = importlib.util.spec_from_file_location('brazil_updater', Path(__file__).resolve().parents[1] / 'scripts/update-etf-performance.py')
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)


class BrazilTests(unittest.TestCase):
    def test_cdi_is_daily_percent_not_annualized_or_weekend_filled(self):
        rows = [{'data': '25/09/2026', 'valor': '0.05'}, {'data': '28/09/2026', 'valor': '0.06'}]
        result = updater.cdi_accumulated_history(rows)
        self.assertEqual(len(result), 2)
        self.assertAlmostEqual(result[-1]['close'] / result[0]['close'], 1.0006)
        self.assertAlmostEqual(result[0]['close'], 100.05)
        self.assertEqual(updater.cdi_accumulated_history(rows + [rows[0]]), result)

    def test_conflicting_or_nonfinite_cdi_is_rejected(self):
        for value in ['nan', '-100', '0.06']:
            with self.assertRaises(ValueError):
                updater.cdi_accumulated_history([{'data': '25/09/2026', 'valor': '0.05'}, {'data': '25/09/2026', 'valor': value}])

    def test_brazil_cash_cannot_seed_us_fallback(self):
        records = {'BR': {'market': 'Brazil', 'assetClass': 'fixed_income', 'performanceChart': {'points': [
            {'date': '2026-09-24', 'cash': 100}, {'date': '2026-09-25', 'cash': 101}]}}}
        self.assertEqual(updater.best_previous_benchmark_history(records, 'cash', 'fixed_income'), [])


if __name__ == '__main__':
    unittest.main()
