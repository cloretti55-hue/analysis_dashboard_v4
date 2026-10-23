import importlib.util
from datetime import date, timedelta
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('chart_periods', Path(__file__).resolve().parents[1] / 'scripts/update-etf-performance.py')
u = importlib.util.module_from_spec(spec)
spec.loader.exec_module(u)


def series(start, end, step=.1):
    rows = []
    day = start
    while day <= end:
        if day.weekday() < 5:
            rows.append({'date': day, 'close': 100 + step * len(rows)})
        day += timedelta(days=1)
    return rows


class ChartPeriodTests(unittest.TestCase):
    def setUp(self):
        self.history = series(date(2021, 9, 1), date(2026, 10, 21))
        self.benchmark = series(date(2021, 9, 1), date(2026, 10, 21), .02)

    def test_all_windows_use_exact_pre_sampling_bases_and_cumulative_returns(self):
        chart = u.normalized_chart_series(self.history, self.benchmark)
        self.assertEqual(set(chart['periods']), {'ytd', '1y', '3y', '5y'})
        for key, window in chart['periods'].items():
            with self.subTest(key=key):
                self.assertTrue(window['available'])
                base_day = date.fromisoformat(window['startDate'])
                base = next(r['close'] for r in self.history if r['date'] == base_day)
                ref = next(r['close'] for r in self.benchmark if r['date'] == base_day)
                self.assertEqual(window['points'][0]['etf'], 100)
                self.assertEqual(window['points'][0]['sp500'], 100)
                self.assertEqual(window['points'][-1]['etf'], round(self.history[-1]['close'] / base * 100, 2))
                self.assertEqual(window['points'][-1]['sp500'], round(self.benchmark[-1]['close'] / ref * 100, 2))
                self.assertLessEqual(len(window['points']), 180)
        self.assertEqual(chart['periods']['ytd']['startDate'], '2025-12-31')
        self.assertEqual(chart['periods']['3y']['startDate'], '2023-10-20')  # Saturday anniversary.
        self.assertEqual(chart['periods']['5y']['startDate'], '2021-10-21')

    def test_young_fund_keeps_available_chart_without_inventing_ytd(self):
        chart = u.normalized_chart_series(series(date(2026, 2, 24), date(2026, 10, 21)))
        self.assertGreater(len(chart['points']), 1)
        self.assertTrue(all(not p['available'] for p in chart['periods'].values()))

    def test_missing_base_more_than_seven_days_before_target_is_unavailable(self):
        history = [r for r in self.history if not date(2025, 12, 20) <= r['date'] <= date(2025, 12, 31)]
        self.assertFalse(u.normalized_chart_series(history)['periods']['ytd']['available'])

    def test_no_five_year_comparison_when_benchmark_is_shorter(self):
        chart = u.normalized_chart_series(self.history, [r for r in self.benchmark if r['date'] >= date(2023, 1, 1)])
        self.assertFalse(chart['periods']['5y']['available'])
        self.assertEqual(chart['periods']['5y']['reason'], 'Insufficient benchmark history')
        self.assertTrue(chart['periods']['3y']['available'])

    def test_large_gaps_disable_affected_periods(self):
        history = [r for r in self.history if not date(2024, 1, 1) <= r['date'] <= date(2024, 4, 1)]
        chart = u.normalized_chart_series(history)
        self.assertTrue(chart['periods']['1y']['available'])
        self.assertFalse(chart['periods']['3y']['available'])
        self.assertFalse(chart['periods']['5y']['available'])

    def test_fixed_income_uses_latest_continuous_shared_segment(self):
        history = [r for r in self.history if not date(2025, 1, 1) <= r['date'] <= date(2026, 1, 8)]
        chart = u.normalized_chart_series(history, self.benchmark, 'cash', align_common_window=True)
        self.assertFalse(chart['periods']['ytd']['available'])
        self.assertFalse(chart['periods']['1y']['available'])
        self.assertFalse(chart['periods']['5y']['available'])
        self.assertEqual(chart['points'][0]['etf'], chart['points'][0]['cash'])

    def test_leap_day_uses_calendar_anniversary_and_observed_common_end(self):
        history = series(date(2018, 1, 1), date(2024, 2, 29))
        chart = u.normalized_chart_series(history, history, 'cash', align_common_window=True)
        self.assertEqual(chart['periods']['1y']['targetDate'], '2023-02-28')
        self.assertEqual(chart['periods']['5y']['targetDate'], '2019-02-28')


if __name__ == '__main__': unittest.main()
