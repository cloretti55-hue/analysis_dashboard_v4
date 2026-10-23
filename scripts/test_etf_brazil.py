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

    def test_correlation_matches_both_interval_endpoints(self):
        from datetime import timedelta
        a = date(2026, 1, 1)
        levels = [{"date": a + timedelta(days=i), "close": 100 + i + (i % 3)} for i in range(100)]
        sparse = levels[::2]
        details = updater.correlation_details(sparse, levels)
        self.assertEqual(details["value"], 1.0)
        self.assertEqual(details["observations"], 49)
        self.assertEqual(details["startDate"], "2026-01-01")

    def test_constant_returns_have_no_correlation(self):
        from datetime import timedelta
        rows = [{"date": date(2026, 1, 1) + timedelta(days=i), "close": 100 * 1.001 ** i} for i in range(60)]
        self.assertIsNone(updater.correlation_1y(rows, rows))

    def test_zero_volume_alone_does_not_remove_prices(self):
        self.assertEqual(updater.suspicious_flat_prices("LFTS11.SA", [100 + i / 10 for i in range(60)], [0] * 60), set())

    def test_repeated_placeholder_with_large_jump_is_quarantined(self):
        self.assertEqual(updater.suspicious_flat_prices("IMAB11.SA", [79.5] * 30 + [108.25], [0] * 30 + [22657]), {79.5})
        self.assertEqual(updater.suspicious_flat_prices("IMAB11.SA", [100] * 30 + [100.1], [0] * 30 + [200]), set())

    def test_chart_keeps_actual_dates_across_price_gaps(self):
        history = [{"date": date(2026, 1, 8), "close": 108.25}, {"date": date(2026, 4, 8), "close": 110}]
        chart = updater.normalized_chart_series(history, history, benchmark_key="cash")
        self.assertEqual(chart["startDate"], "2026-01-08")
        self.assertEqual(chart["endDate"], "2026-04-08")
        self.assertEqual(chart["points"][0]["etf"], 100)
        self.assertEqual(chart["points"][-1]["cash"], chart["points"][-1]["etf"])

    def test_brazil_cash_cannot_seed_us_fallback(self):
        records = {'BR': {'market': 'Brazil', 'assetClass': 'fixed_income', 'performanceChart': {'points': [
            {'date': '2026-09-24', 'cash': 100}, {'date': '2026-09-25', 'cash': 101}]}}}
        self.assertEqual(updater.best_previous_benchmark_history(records, 'cash', 'fixed_income'), [])


if __name__ == '__main__':
    unittest.main()
