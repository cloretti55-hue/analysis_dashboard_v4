from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
APP_JS = (ROOT / "assets" / "js" / "app.js").read_text(encoding="utf-8")
VALUATION_JS = (ROOT / "assets" / "js" / "modules" / "valuation.js").read_text(encoding="utf-8")


class FrontendValuationModuleTests(unittest.TestCase):
    def test_module_uses_an_explicit_namespace(self):
        self.assertIn("window.GCValuation = {", VALUATION_JS)
        self.assertIn("} = window.GCValuation;", APP_JS)

    def test_valuation_components_live_outside_app(self):
        for component in (
            "EquityPeChart",
            "Sp500ValuationContext",
            "Sp500PeHistoryChart",
            "EquityValuationModule",
        ):
            self.assertIn(f"function {component}", VALUATION_JS)
            self.assertNotIn(f"function {component}", APP_JS)

    def test_valuation_data_loading_is_owned_by_module(self):
        for dataset in (
            "equity-valuation",
            "sp500-valuation",
            "sp500-pe-history",
            "mag7-valuation",
        ):
            self.assertIn(f'"{dataset}"', VALUATION_JS)
            self.assertNotIn(f'"{dataset}"', APP_JS)

    def test_method_note_is_exported_for_public_disclaimer(self):
        self.assertIn("FORWARD_PE_METHOD_NOTE,", VALUATION_JS)
        self.assertIn("methodNote: selectedModule === \"equity\" ? FORWARD_PE_METHOD_NOTE : null", APP_JS)


if __name__ == "__main__":
    unittest.main()
