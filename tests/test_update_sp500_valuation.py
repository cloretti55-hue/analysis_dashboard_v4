import importlib.util
from datetime import date
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('factset', Path(__file__).resolve().parents[1] / 'scripts/update-sp500-valuation.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def article(day, pe=22):
    return f'By John Butters | September {day}, 2026 <p>5-year average (99.9)</p><p>The forward 12-month P/E ratio is {pe}, above the 5-year average (20.1) and 10-year average (19.0).</p>'


class FactSetTests(unittest.TestCase):
    def test_changed_titles_and_nested_markup_are_discovered(self):
        links = module.find_candidate_urls('<a href="/analysts-increasing-eps"><span>Analysts Increasing EPS Estimates</span></a><a href="/topic/earnings">Earnings</a><a href="https://evil.example/post">S&amp;P 500</a>')
        self.assertEqual(links, ['https://insight.factset.com/analysts-increasing-eps'])

    def test_latest_dated_post_wins_despite_order_and_fetch_failure(self):
        def fetch(url):
            if url == 'broken': raise OSError('unavailable')
            return article(4 if url == 'old' else 11)
        result = module.select_latest(['old', 'broken', 'new'], {}, fetch, date(2026, 9, 15))
        self.assertEqual(result['asOf'], '2026-09-11')
        self.assertEqual(result['averages']['5y'], 20.1)

    def test_stale_source_fails(self):
        with self.assertRaisesRegex(ValueError, 'freshness'):
            module.select_latest(['old'], {}, lambda _: article(1), date(2026, 9, 16))

    def test_regression_fails(self):
        with self.assertRaisesRegex(ValueError, 'newer'):
            module.select_latest(['old'], {'asOf': '2026-09-12'}, lambda _: article(11), date(2026, 9, 15))

    def test_undated_source_fails(self):
        with self.assertRaisesRegex(ValueError, 'dated'):
            module.select_latest(['bad'], {}, lambda _: 'forward 12-month P/E ratio is 22', date(2026, 9, 15))

    def test_new_date_does_not_relabel_old_fields(self):
        result = module.merged_payload({'asOf': '2026-09-11', 'forwardPE': 22, 'averages': {}}, {'sp500': {'forwardEPS': 99, 'averages': {'5y': 10}}})
        self.assertIsNone(result['sp500']['forwardEPS'])
        self.assertIsNone(result['sp500']['averages']['5y'])
