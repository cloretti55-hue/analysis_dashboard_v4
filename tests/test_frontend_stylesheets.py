from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
CSS_ROOT = ROOT / "assets" / "css"
APP_CSS = (CSS_ROOT / "app.css").read_text(encoding="utf-8")


class FrontendStylesheetTests(unittest.TestCase):
    def test_app_css_is_only_the_ordered_stylesheet_manifest(self):
        self.assertNotIn("{", APP_CSS)
        imports = [line for line in APP_CSS.splitlines() if line.strip()]
        self.assertEqual(len(imports), 11)
        self.assertTrue(all(line.startswith('@import url("./') for line in imports))

    def test_each_analytical_area_owns_its_primary_selectors(self):
        expected = {
            "themes.css": ".themes-layout {",
            "data-lab.css": ".data-lab-layout {",
            "curves-fed.css": ".controls {",
            "valuation.css": ".equity-layout {",
            "themes-cycles.css": ".tech-layout {",
            "etfs.css": ".core-layout {",
        }
        for filename, selector in expected.items():
            css = (CSS_ROOT / filename).read_text(encoding="utf-8")
            self.assertIn(selector, css)

    def test_shared_mobile_and_responsive_layers_are_explicit(self):
        self.assertIn(".dataset-status-line {", (CSS_ROOT / "components.css").read_text(encoding="utf-8"))
        self.assertIn(".mobile-shell {", (CSS_ROOT / "mobile.css").read_text(encoding="utf-8"))
        responsive = (CSS_ROOT / "responsive.css").read_text(encoding="utf-8")
        self.assertIn("@media (min-width: 721px)", responsive)
        self.assertIn("@media (max-width: 720px)", responsive)


if __name__ == "__main__":
    unittest.main()
