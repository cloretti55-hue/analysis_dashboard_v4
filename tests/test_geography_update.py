from __future__ import annotations

import html
import importlib.util
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_script(name: str, filename: str):
    path = ROOT / "scripts" / filename
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


GEOGRAPHY = load_script("update_etf_geography", "update-etf-geography.py")
SUMMARY = load_script("write_action_summary", "write-action-summary.py")


class GeographyUpdateTests(unittest.TestCase):
    def test_vanguard_fact_sheet_section_and_date_are_parsed(self) -> None:
        text = """
        As of June 30, 2026
        Ten largest market allocations as %of common stock
        Japan 21.0 %
        United Kingdom 10.9 %
        Canada 10.5 %
        Korea 10.2 %
        Switzerland 6.9 %
        France 6.9 %
        """
        weights = GEOGRAPHY.parse_pdf_countries(text, "Ten largest market allocations")
        self.assertEqual(GEOGRAPHY.parse_pdf_date(text), "2026-06-30")
        self.assertEqual(weights[0], ["Japão", 21.0])
        self.assertIn(["Coreia do Sul", 10.2], weights)

    def test_ishares_structured_geography_is_parsed(self) -> None:
        component = {
            "containersByNameMap": {
                "geography": {
                    "subContainersByNameMap": {
                        "countries": {
                            "dataPointsByNameMap": {
                                "type": {"value": ["United States", "Japan", "France", "Cash"]},
                                "fund": {"value": [70.0, 10.0, 5.0, 15.0]},
                                "asOf": {"formattedValue": "31/Jul/2026"},
                            }
                        }
                    }
                }
            }
        }
        encoded = html.escape(json.dumps(component), quote=True)
        source = f'<div componentprops="{encoded}" componentkey="exposureBreakdowns"></div>'
        original_fetch = GEOGRAPHY.fetch_text
        GEOGRAPHY.fetch_text = lambda _url: source
        try:
            weights, as_of = GEOGRAPHY.parse_ishares_page("https://example.test")
        finally:
            GEOGRAPHY.fetch_text = original_fetch
        self.assertEqual(as_of, "2026-07-31")
        self.assertEqual(weights, [["EUA", 70.0], ["Japão", 10.0], ["França", 5.0]])

    def test_previous_valid_weights_survive_provider_failure(self) -> None:
        previous = {
            "instruments": {
                "TEST": {
                    "weights": [["Brasil", 60.0], ["México", 25.0], ["Chile", 15.0]],
                    "asOf": "2026-06-30",
                    "status": "ok",
                }
            }
        }
        result = GEOGRAPHY.preserve_previous(
            "TEST", "Provedor", "https://example.test", previous, RuntimeError("timeout")
        )
        self.assertEqual(result["weights"], previous["instruments"]["TEST"]["weights"])
        self.assertEqual(result["asOf"], "2026-06-30")
        self.assertEqual(result["status"], "stale")
        self.assertIn("timeout", result["refreshError"])

    def test_action_summary_is_portuguese_and_operational_only(self) -> None:
        manifest = {
            "summary": {"blockingErrorCount": 0},
            "datasets": [
                {
                    "id": "etf-geography",
                    "status": "partial",
                    "asOf": "2026-06-30",
                    "issues": [{"severity": "warning", "code": "geography_fallback"}],
                }
            ],
        }
        result = SUMMARY.build_summary(manifest)
        self.assertIn("Diagnóstico dos dados", result)
        self.assertIn("última composição geográfica válida", result)
        self.assertNotIn("instrument(s)", result)


if __name__ == "__main__":
    unittest.main()
