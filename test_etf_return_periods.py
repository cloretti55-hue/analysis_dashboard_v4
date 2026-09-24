import importlib.util
import json
import unittest
from datetime import date, datetime, timezone
from pathlib import Path
from unittest.mock import patch, MagicMock

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('returns_updater', ROOT / 'scripts/update-etf-performance.py')
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)


def rows(*values):
    return [{'date': date.fromisoformat(day), 'close': price} for day, price in values]


class ReturnPeriodTests(unittest.TestCase):
    def test_ytd_includes_first_trading_day(self):
        history = rows(('2025-12-31', 100), ('2026-01-02', 110), ('2026-09-18', 120))
        self.assertEqual(updater.metrics_for_history(history)['returnYtdPct'], 20)

    def test_year_end_weekend_uses_prior_session(self):
        history = rows(('2023-12-29', 100), ('2024-01-02', 105), ('2024-09-18', 120))
        self.assertEqual(updater.metrics_for_history(history)['returnYtdPct'], 20)

    def test_new_fund_does_not_get_full_period_returns(self):
        metrics = updater.metrics_for_history(rows(('2026-01-02', 100), ('2026-09-18', 120)))
        for key in ('returnYtdPct', 'return1yPct', 'return3yAnnPct', 'return5yAnnPct'):
            self.assertIsNone(metrics[key], key)

    def test_three_year_history_is_not_five_year_history(self):
        history = rows(('2023-09-18', 100), ('2026-09-18', 133.1))
        metrics = updater.metrics_for_history(history)
        self.assertAlmostEqual(metrics['return3yAnnPct'], 10, delta=.02)
        self.assertIsNone(metrics['return5yAnnPct'])

    def test_five_year_anniversary_and_weekend(self):
        history = rows(('2021-09-17', 100), ('2026-09-18', 161.051))
        self.assertAlmostEqual(updater.metrics_for_history(history)['return5yAnnPct'], 10, delta=.02)

    def test_stale_baseline_is_not_used(self):
        history = rows(('2021-08-01', 100), ('2026-09-18', 160))
        self.assertIsNone(updater.metrics_for_history(history)['return5yAnnPct'])

    def test_leap_anniversary(self):
        self.assertEqual(updater.years_before(date(2024, 2, 29), 3), date(2021, 2, 28))

    def test_daily_candle_excluded_until_session_is_complete(self):
        start = int(datetime(2026, 9, 18, 13, 30, tzinfo=timezone.utc).timestamp())
        end = start + 23400
        payload = {'chart': {'result': [{'meta': {'currentTradingPeriod': {'regular': {'start': start, 'end': end}}},
            'timestamp': [start - 86400, start],
            'indicators': {'adjclose': [{'adjclose': [100, 110]}], 'quote': [{'close': [101, 111]}]}}]}}
        response = MagicMock()
        response.__enter__.return_value.read.return_value = json.dumps(payload).encode()
        for seconds, expected in [(end - 1, 1), (end + 899, 1), (end + 900, 2)]:
            with self.subTest(seconds=seconds), patch.object(updater.urllib.request, 'urlopen', return_value=response), patch.object(updater, 'datetime', wraps=datetime) as clock:
                clock.now.return_value = datetime.fromtimestamp(seconds, timezone.utc)
                history = updater.fetch_yahoo_chart_history('SPY')
                self.assertEqual(len(history), expected)
                self.assertEqual(history[0]['close'], 100)


if __name__ == '__main__':
    unittest.main()
