from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
APP_JS = (ROOT / "assets" / "js" / "app.js").read_text(encoding="utf-8")
CURVES_FED_JS = (ROOT / "assets" / "js" / "modules" / "curves-fed.js").read_text(encoding="utf-8")


class FrontendCurvesFedModuleTests(unittest.TestCase):
    def test_module_uses_an_explicit_namespace(self):
        self.assertIn("window.GCCurvesFed = {", CURVES_FED_JS)
        self.assertIn("} = window.GCCurvesFed;", APP_JS)

    def test_curve_components_live_outside_app(self):
        for component in (
            "Chart",
            "MobileCurveModule",
            "CurvesFedModule",
            "useCurvesFedModel",
        ):
            self.assertIn(f"function {component}", CURVES_FED_JS)
            self.assertNotIn(f"function {component}", APP_JS)

    def test_curve_data_loading_is_owned_by_module(self):
        for dataset in ("curve-us", "fed-policy"):
            load_call = f'DataClient.load("{dataset}")'
            self.assertIn(load_call, CURVES_FED_JS)
            self.assertNotIn(load_call, APP_JS)

    def test_public_fed_card_omits_misleading_probability_labels(self):
        for label in ("Probabilidades para a reunião", "Rate hike", "Steady", "Rate cut"):
            self.assertNotIn(label, CURVES_FED_JS)


if __name__ == "__main__":
    unittest.main()
