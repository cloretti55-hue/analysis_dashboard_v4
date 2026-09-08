from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "scripts" / "update-fed-policy.py"
SPEC = importlib.util.spec_from_file_location("update_fed_policy", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Could not load {MODULE_PATH}")
FED_POLICY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(FED_POLICY)


class Response:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self) -> bytes:
        return b"ok"


class UpdateFedPolicyTests(unittest.TestCase):
    def test_fomc_statement_provides_official_target_range(self) -> None:
        feed = b"""<rss><channel><item><title>Federal Reserve issues FOMC statement</title><link>https://example.test/statement</link><pubDate>Wed, 29 Jul 2026 18:00:00 GMT</pubDate></item></channel></rss>"""
        statement = b"<p>The Committee decided to maintain the target range for the federal funds rate at 3-1/2 to 3-3/4 percent.</p>"
        with patch.object(FED_POLICY, "fetch_bytes", side_effect=[feed, statement]):
            as_of, lower, upper, source_url = FED_POLICY.latest_fomc_target_range()
        self.assertEqual(as_of.isoformat(), "2026-07-29")
        self.assertEqual((lower, upper), (3.5, 3.75))
        self.assertEqual(source_url, "https://example.test/statement")

    def test_fetch_retries_transient_timeouts(self) -> None:
        attempts = [TimeoutError("timeout 1"), TimeoutError("timeout 2"), Response()]

        def fake_urlopen(*_args, **_kwargs):
            result = attempts.pop(0)
            if isinstance(result, Exception):
                raise result
            return result

        with patch.object(FED_POLICY.urllib.request, "urlopen", side_effect=fake_urlopen), patch.object(
            FED_POLICY.time, "sleep", return_value=None
        ):
            self.assertEqual(FED_POLICY.fetch_bytes("https://example.test", "teste"), b"ok")
        self.assertEqual(attempts, [])

    def test_fetch_fails_after_all_attempts(self) -> None:
        with patch.object(
            FED_POLICY.urllib.request, "urlopen", side_effect=TimeoutError("timeout final")
        ), patch.object(FED_POLICY.time, "sleep", return_value=None):
            with self.assertRaisesRegex(RuntimeError, "após 3 tentativas"):
                FED_POLICY.fetch_bytes("https://example.test", "teste")


if __name__ == "__main__":
    unittest.main()
