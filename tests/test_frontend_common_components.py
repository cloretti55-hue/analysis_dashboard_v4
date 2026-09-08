from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
APP_JS = (ROOT / "assets" / "js" / "app.js").read_text(encoding="utf-8")
COMMON_JS = (ROOT / "assets" / "js" / "components" / "common.js").read_text(encoding="utf-8")


class FrontendCommonComponentTests(unittest.TestCase):
    def test_components_use_an_explicit_namespace(self):
        self.assertIn("window.GCCommon = (() =>", COMMON_JS)
        self.assertIn("} = window.GCCommon;", APP_JS)

    def test_shared_navigation_and_interface_live_outside_app(self):
        for component in (
            "DesktopHeader",
            "MainNavigation",
            "ThemeSwitch",
            "ThemeToggleButton",
            "Disclaimer",
            "BrandCredit",
            "HalDataLogo",
            "HomeModule",
        ):
            self.assertIn(f"function {component}", COMMON_JS)
            self.assertNotIn(f"function {component}", APP_JS)

    def test_app_uses_shared_components(self):
        self.assertIn("React.createElement(DesktopHeader", APP_JS)
        self.assertIn("React.createElement(ThemeToggleButton", APP_JS)
        self.assertIn("React.createElement(BrandCredit)", APP_JS)
        self.assertIn('React.createElement(HalDataLogo, { as: "h1" })', APP_JS)
        self.assertIn('React.createElement(HalDataLogo, { as: "h2" })', COMMON_JS)

    def test_dark_theme_is_default_and_hash_navigation_is_observed(self):
        self.assertIn('const [theme, setTheme] = useState("dark")', APP_JS)
        self.assertIn('window.addEventListener("hashchange", syncModuleFromHistory)', APP_JS)
        self.assertIn('window.removeEventListener("hashchange", syncModuleFromHistory)', APP_JS)
        self.assertIn('useState(() => activeModule === "home" ? null : activeModule)', APP_JS)
        self.assertIn('setMobileModule(activeModule === "home" ? null : activeModule)', APP_JS)

    def test_public_data_status_component_is_shared(self):
        self.assertIn("function DatasetStatusLine", COMMON_JS)
        self.assertIn("const DATASET_STATUS_LABELS", COMMON_JS)
        self.assertNotIn("function DatasetStatusLine", APP_JS)

    def test_home_credit_includes_copyright_notice(self):
        self.assertIn("© 2026 General Channels Co.", COMMON_JS)
        self.assertIn("All rights reserved.", COMMON_JS)


if __name__ == "__main__":
    unittest.main()
