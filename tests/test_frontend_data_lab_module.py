from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
APP_JS = (ROOT / "assets" / "js" / "app.js").read_text(encoding="utf-8")
DATA_LAB_JS = (ROOT / "assets" / "js" / "modules" / "data-lab.js").read_text(encoding="utf-8")
INSTRUMENT_REGISTRY_JS = (ROOT / "assets" / "js" / "core" / "instrument-registry.js").read_text(encoding="utf-8")


class FrontendDataLabModuleTests(unittest.TestCase):
    def test_module_uses_an_explicit_namespace(self):
        self.assertIn("window.GCDataLab = {", DATA_LAB_JS)
        self.assertIn("} = window.GCDataLab;", APP_JS)

    def test_data_lab_components_live_outside_app(self):
        for component in ("DataLabLineChart", "DataLabModule"):
            self.assertIn(f"function {component}", DATA_LAB_JS)
            self.assertNotIn(f"function {component}", APP_JS)

    def test_data_loading_and_fallback_are_owned_by_module(self):
        self.assertIn('DataClient.loadMany(["etf-universe", "etf-performance", "fixed-income-performance"])', DATA_LAB_JS)
        self.assertIn("InstrumentRegistry.createCatalog", DATA_LAB_JS)
        self.assertIn('fallbackDataset: "fixed-income-performance"', DATA_LAB_JS)
        self.assertNotIn("category.includes", DATA_LAB_JS)
        self.assertNotIn('"etf-performance"', APP_JS)
        self.assertNotIn('"fixed-income-performance"', APP_JS)

    def test_direct_etf_links_select_the_requested_data_lab_instrument(self):
        self.assertIn("const requestedDataLabTicker", DATA_LAB_JS)
        self.assertIn('module !== "dataLab"', DATA_LAB_JS)
        self.assertIn("requestedInstrument ||", DATA_LAB_JS)
        self.assertIn("setSelectedGroup(dataLabGroupFor(requestedInstrument))", DATA_LAB_JS)

    def test_selected_data_lab_instrument_links_back_to_its_etf_context(self):
        self.assertIn("const { etfHrefForTicker } = window.GCEtfs", DATA_LAB_JS)
        self.assertIn("function EtfContextLink", DATA_LAB_JS)
        self.assertIn('"aria-label": `Open ${ticker} in ETFs`', DATA_LAB_JS)
        self.assertIn('"ETFs ↗"', DATA_LAB_JS)

    def test_filters_metrics_and_internal_provenance_are_preserved(self):
        for label in (
            "Fixed Income",
            "Core Equities",
            "Sectors",
            "Commodities",
            "US Satellites",
            "European Themes",
            "China / China+1",
            "Hedge",
        ):
            self.assertIn(label, DATA_LAB_JS + INSTRUMENT_REGISTRY_JS)
        for public_label in ("Data Lab provenance", "Primary dataset", "Fixed-income contingency", "Instrument source:"):
            self.assertNotIn(public_label, DATA_LAB_JS)
        self.assertIn('fallbackDataset: "fixed-income-performance"', DATA_LAB_JS)
        self.assertIn("dataStatus: fixedResult.meta.status", DATA_LAB_JS)
        for metric in (
            "returnYtdPct",
            "return1yPct",
            "return3yAnnPct",
            "return5yAnnPct",
            "vol1yAnnPct",
            "maxDrawdown1yPct",
            "beta1yVsSp500",
        ):
            self.assertIn(metric, INSTRUMENT_REGISTRY_JS)

    def test_commodity_charts_render_cpi_and_sp500_together(self):
        self.assertIn("chartBenchmarksFor", DATA_LAB_JS)
        self.assertIn('key: "cpi", label: "U.S. CPI", className: "is-cpi"', INSTRUMENT_REGISTRY_JS)
        self.assertIn('key: "sp500", label: "S&P 500", className: "is-spy"', INSTRUMENT_REGISTRY_JS)
        self.assertIn('benchmarks.map(({ key, className })', DATA_LAB_JS)
        self.assertIn("U.S. CPI + S&P 500", INSTRUMENT_REGISTRY_JS)


if __name__ == "__main__":
    unittest.main()
