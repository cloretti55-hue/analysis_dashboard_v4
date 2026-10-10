from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
APP_CSS = ROOT / "assets" / "css" / "app.css"
APP_JS = ROOT / "assets" / "js" / "app.js"
DATA_CLIENT_JS = ROOT / "assets" / "js" / "core" / "data-client.js"
INSTRUMENT_REGISTRY_JS = ROOT / "assets" / "js" / "core" / "instrument-registry.js"
COMMON_JS = ROOT / "assets" / "js" / "components" / "common.js"
CURVES_FED_JS = ROOT / "assets" / "js" / "modules" / "curves-fed.js"
VALUATION_JS = ROOT / "assets" / "js" / "modules" / "valuation.js"
ETFS_JS = ROOT / "assets" / "js" / "modules" / "etfs.js"
DATA_LAB_JS = ROOT / "assets" / "js" / "modules" / "data-lab.js"
THEMES_JS = ROOT / "assets" / "js" / "modules" / "themes.js"
CSS_PARTS = (
    "base.css",
    "themes.css",
    "shell.css",
    "data-lab.css",
    "curves-fed.css",
    "valuation.css",
    "themes-cycles.css",
    "etfs.css",
    "components.css",
    "mobile.css",
    "responsive.css",
)


class FrontendStructureTests(unittest.TestCase):
    def test_global_styles_are_loaded_from_local_stylesheet(self):
        self.assertIn('href="assets/css/app.css"', INDEX)
        self.assertNotIn("<style>", INDEX)
        self.assertTrue(APP_CSS.is_file())
        manifest = APP_CSS.read_text(encoding="utf-8")
        previous_position = -1
        combined_css = ""
        for filename in CSS_PARTS:
            stylesheet = APP_CSS.parent / filename
            self.assertTrue(stylesheet.is_file())
            self.assertGreater(stylesheet.stat().st_size, 500)
            import_rule = f'@import url("./{filename}");'
            self.assertIn(import_rule, manifest)
            current_position = manifest.index(import_rule)
            self.assertGreater(current_position, previous_position)
            previous_position = current_position
            combined_css += stylesheet.read_text(encoding="utf-8")
        self.assertNotIn("home-market-background.png", combined_css)

    def test_application_script_is_loaded_from_local_file(self):
        self.assertIn('src="assets/js/app.js"', INDEX)
        self.assertIn('src="assets/js/core/data-client.js"', INDEX)
        self.assertIn('src="assets/js/core/instrument-registry.js"', INDEX)
        self.assertIn('src="assets/js/components/common.js"', INDEX)
        self.assertIn('src="assets/js/modules/curves-fed.js"', INDEX)
        self.assertIn('src="assets/js/modules/valuation.js"', INDEX)
        self.assertIn('src="assets/js/modules/etfs.js"', INDEX)
        self.assertIn('src="assets/js/modules/data-lab.js"', INDEX)
        self.assertIn('src="assets/js/modules/themes.js"', INDEX)
        self.assertNotIn("<script>", INDEX)
        self.assertTrue(APP_JS.is_file())
        self.assertTrue(DATA_CLIENT_JS.is_file())
        self.assertTrue(INSTRUMENT_REGISTRY_JS.is_file())
        self.assertTrue(COMMON_JS.is_file())
        self.assertTrue(CURVES_FED_JS.is_file())
        self.assertTrue(VALUATION_JS.is_file())
        self.assertTrue(ETFS_JS.is_file())
        self.assertTrue(DATA_LAB_JS.is_file())
        self.assertTrue(THEMES_JS.is_file())
        self.assertGreater(APP_JS.stat().st_size, 1_000)
        self.assertGreater(DATA_CLIENT_JS.stat().st_size, 1_000)
        self.assertGreater(INSTRUMENT_REGISTRY_JS.stat().st_size, 1_000)
        self.assertGreater(COMMON_JS.stat().st_size, 1_000)
        self.assertGreater(CURVES_FED_JS.stat().st_size, 1_000)
        self.assertGreater(VALUATION_JS.stat().st_size, 1_000)
        self.assertGreater(ETFS_JS.stat().st_size, 1_000)
        self.assertGreater(DATA_LAB_JS.stat().st_size, 1_000)
        self.assertGreater(THEMES_JS.stat().st_size, 1_000)
        self.assertLess(
            INDEX.index('src="assets/js/core/data-client.js"'),
            INDEX.index('src="assets/js/core/instrument-registry.js"'),
        )
        self.assertLess(
            INDEX.index('src="assets/js/core/instrument-registry.js"'),
            INDEX.index('src="assets/js/components/common.js"'),
        )
        self.assertLess(
            INDEX.index('src="assets/js/components/common.js"'),
            INDEX.index('src="assets/js/modules/curves-fed.js"'),
        )
        self.assertLess(
            INDEX.index('src="assets/js/modules/curves-fed.js"'),
            INDEX.index('src="assets/js/modules/valuation.js"'),
        )
        self.assertLess(
            INDEX.index('src="assets/js/modules/valuation.js"'),
            INDEX.index('src="assets/js/modules/etfs.js"'),
        )
        self.assertLess(
            INDEX.index('src="assets/js/modules/etfs.js"'),
            INDEX.index('src="assets/js/modules/data-lab.js"'),
        )
        self.assertLess(
            INDEX.index('src="assets/js/modules/data-lab.js"'),
            INDEX.index('src="assets/js/modules/themes.js"'),
        )
        self.assertLess(
            INDEX.index('src="assets/js/modules/themes.js"'),
            INDEX.index('src="assets/js/app.js"'),
        )


if __name__ == "__main__":
    unittest.main()
