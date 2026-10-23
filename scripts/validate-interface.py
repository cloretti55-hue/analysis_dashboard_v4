from __future__ import annotations

import re
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import Page, sync_playwright


PROJECT_ROOT = Path(__file__).resolve().parents[1]

VIEWPORTS = {
    "computador": {"width": 1440, "height": 900},
    "celular": {"width": 390, "height": 844},
}

MODULES = (
    (r"(Yield Curves|Rates)", "curve", "Yield Curves"),
    ("Equity Valuation", "equity", "Stock Market Valuation"),
    ("ETFs", "etfs", "ETF Architecture"),
    ("Data Lab", "dataLab", "Data Lab"),
    (r"(Thematic pages|Themes)", "tech", "Themes"),
)


class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PROJECT_ROOT), **kwargs)

    def log_message(self, _format: str, *args) -> None:
        return

    def do_GET(self) -> None:
        # Browsers request this implicitly; the local test server has no favicon.
        if self.path == "/favicon.ico" and not (PROJECT_ROOT / "favicon.ico").exists():
            self.send_response(204)
            self.end_headers()
            return
        super().do_GET()


def assert_no_horizontal_overflow(page: Page, context: str) -> None:
    has_overflow = page.evaluate(
        "document.documentElement.scrollWidth > window.innerWidth + 1"
    )
    if has_overflow:
        raise AssertionError(f"Rolagem horizontal inesperada em {context}")


def wait_for_home(page: Page, base_url: str) -> None:
    page.goto(base_url, wait_until="domcontentloaded")
    page.locator('[aria-label="HAL DATA"]').wait_for(
        state="visible", timeout=30_000
    )


def check_instrument_registry(page: Page, label: str) -> None:
    # DataClient loads asynchronously; an empty filter list passes every().
    # Require rendered instruments before evaluating catalog coverage.
    page.locator(".data-lab-chip").first.wait_for(state="visible", timeout=30_000)
    page.wait_for_function(
        r"""
        () => window.GCInstrumentRegistry &&
          document.querySelectorAll(".data-lab-chip").length > 0 &&
          Array.from(document.querySelectorAll('.data-lab-filter'))
            .every((button) => /\(\d+\)/.test(button.textContent || ''))
        """,
        timeout=15_000,
    )
    state = page.evaluate(
        """
        () => ({
          hasCatalogFactory: typeof window.GCInstrumentRegistry.createCatalog === 'function',
          assetClasses: Array.from(document.querySelectorAll('nav[aria-label="Asset classes"] button'))
            .map((button) => button.textContent.trim()),
          filters: Array.from(document.querySelectorAll('.data-lab-filter'))
            .map((button) => button.textContent || ''),
          visibleInstrumentCount: document.querySelectorAll('.data-lab-chip').length,
        })
        """
    )
    counts = [int(value) for text in state["filters"] for value in re.findall(r"\((\d+)\)", text)]
    if not state["hasCatalogFactory"]:
        raise AssertionError(f"Registro de instrumentos indisponível em {label}")
    if state["assetClasses"] != ["Fixed Income", "Equities", "Alternatives"]:
        raise AssertionError(f"Classes de ativos incorretas em {label}: {state['assetClasses']}")
    # Fixed Income has a single subgroup, so its redundant filter is hidden.
    # Other asset classes expose only their own filters, not the old flat list.
    if state["filters"] and (not counts or any(count <= 0 for count in counts)):
        raise AssertionError(f"Filtros sem cobertura em {label}: {state['filters']}")
    if state["visibleInstrumentCount"] < 1:
        raise AssertionError(f"Nenhum instrumento visível no Data Lab em {label}")


def check_viewport(browser, base_url: str, label: str, viewport: dict[str, int]) -> None:
    context = browser.new_context(viewport=viewport)
    page = context.new_page()
    runtime_errors: list[str] = []

    page.on("pageerror", lambda error: runtime_errors.append(str(error)))
    page.on(
        "console",
        lambda message: runtime_errors.append(f"console: {message.text}")
        if message.type == "error"
        else None,
    )

    try:
        wait_for_home(page, base_url)
        assert_no_horizontal_overflow(page, f"Home ({label})")

        theme_button = page.get_by_role(
            "button", name=re.compile(r"^(Light|Dark)$", re.IGNORECASE)
        ).first
        theme_before = theme_button.inner_text()
        theme_button.click()
        theme_after = theme_button.inner_text()
        if theme_before == theme_after:
            raise AssertionError(f"O seletor de tema não respondeu em {label}")

        for card_pattern, module_hash, module_title in MODULES:
            wait_for_home(page, base_url)
            page.get_by_role(
                "button", name=re.compile(card_pattern, re.IGNORECASE)
            ).first.click()
            page.wait_for_url(re.compile(rf"#{re.escape(module_hash)}$"), timeout=15_000)
            page.get_by_text(module_title, exact=True).first.wait_for(
                state="visible", timeout=15_000
            )
            if module_hash == "dataLab":
                check_instrument_registry(page, label)
            assert_no_horizontal_overflow(page, f"{module_title} ({label})")

        check_caps_style(page, base_url, label)
        check_fixed_income(page, base_url, label)

        if runtime_errors:
            details = "\n".join(f"- {error}" for error in runtime_errors)
            raise AssertionError(f"Erros no navegador em {label}:\n{details}")
    finally:
        context.close()


def check_etf_information(page: Page, ticker: str, label: str) -> None:
    """Check the current information cards, including essential listing fields."""
    cards = page.locator(f'.etf-information-cards[data-etf="{ticker}"]')
    for name in ("Identification", "Exposure and key features", "About the ETF"):
        cards.get_by_role("region", name=name, exact=True).wait_for()

    identification = cards.get_by_role("region", name="Identification", exact=True)
    for field in ("Exchange", "Trading currency", "Listing"):
        value = identification.locator(".etf-fact").filter(
            has=page.get_by_text(field, exact=True)
        ).locator("dd").inner_text().strip()
        if not value or value.lower() in ("n/a", "nan", "infinity", "undefined"):
            raise AssertionError(f"{field} indisponível para {ticker} ({label})")


def check_caps_style(page: Page, base_url: str, label: str) -> None:
    """Exercise every caps listing, both directions, against the actual data."""
    tickers = ("VOO", "CSPX", "VUAA", "IJH", "SPY4", "IJR", "IDP6", "IWC", "SCZ", "VSS", "WSML")
    for ticker in tickers:
        page.goto(f"{base_url}#etfs/caps/{ticker}", wait_until="domcontentloaded")
        page.locator(".core-detail h2").filter(has_text=re.compile(rf"^{ticker}$")).wait_for()
        page.locator(".etf-full-names .detail-role").wait_for()
        check_etf_information(page, ticker, label)
        page.get_by_role("link", name=f"Open {ticker} in Data Lab", exact=True).click()
        page.locator('.data-lab-filter[aria-pressed="true"]').filter(has_text="Cap/Style").wait_for()
        page.locator(f'svg[aria-label="{ticker} chart versus S&P 500"]').wait_for()
        path = page.locator(".data-lab-line.is-etf").get_attribute("d") or ""
        if path.count("L") < 2 or "NaN" in path or "Infinity" in path:
            raise AssertionError(f"Gráfico inválido para {ticker} ({label})")
        assert_no_horizontal_overflow(page, f"Cap/Style {ticker} ({label})")
        page.get_by_role("link", name=f"Open {ticker} in ETFs", exact=True).click()
        page.wait_for_url(f"**/#etfs/caps/{ticker}")
        check_etf_information(page, ticker, label)
        print(f"OK: Cap/Style {ticker}, cards e navegação de ida e volta ({label}).", flush=True)

    page.goto(f"{base_url}#etfs/caps/IWC", wait_until="domcontentloaded")
    listing_type = page.get_by_role("navigation", name="Equity listing type", exact=True)
    listing_type.get_by_role("button", name="UCITS", exact=True).click()
    check_equity_listing_selection(page, "UCITS", label)
    if page.get_by_role("button", name="Select IWC (US-listed)", exact=True).count():
        raise AssertionError("IWC deve ser ocultado no filtro UCITS")
    listing_type.get_by_role("button", name="US-listed", exact=True).click()
    check_equity_listing_selection(page, "US-listed", label)
    listing_type.get_by_role("button", name="All", exact=True).click()
    check_equity_listing_selection(page, "All", label)


def check_equity_listing_selection(page: Page, listing: str, label: str) -> None:
    """Validate the filter contract without requiring an arbitrary fallback ticker."""
    page.wait_for_function(
        """
        (expected) => {
          const filter = document.querySelector('nav[aria-label="Equity listing type"]');
          const selectedFilter = filter?.querySelector('button[aria-pressed="true"]');
          const buttons = [...document.querySelectorAll('.core-function-grid button.etf-listing-token')];
          const selected = buttons.filter(button => button.getAttribute('aria-pressed') === 'true');
          const heading = document.querySelector('.core-detail h2')?.textContent.trim();
          return selectedFilter?.textContent.trim() === expected && buttons.length > 0 &&
            buttons.every(button => !button.disabled &&
              (expected === 'All' || button.querySelector('small')?.textContent.trim() === expected)) &&
            selected.length === 1 && selected[0].querySelector('strong')?.textContent.trim() === heading;
        }
        """,
        arg=listing,
        timeout=15_000,
    )
    ticker = page.locator(".core-detail h2").inner_text().strip()
    check_etf_information(page, ticker, label)
    assert_no_horizontal_overflow(page, f"Cap/Style {listing} ({label})")
    print(f"OK: Cap/Style {listing}, produtos e seleção compatíveis: {ticker} ({label}).", flush=True)


def check_fixed_income(page: Page, base_url: str, label: str) -> None:
    """Check the new bond filters and listings most exposed to identity mistakes."""
    page.goto(f"{base_url}#etfs/fixed", wait_until="domcontentloaded")
    page.locator(".fixed-income-token").first.wait_for()
    categories = page.get_by_role("navigation", name="Fixed income categories", exact=True)
    listing_type = page.get_by_role("navigation", name="Fixed income listing type", exact=True)
    for category, us_count, ucits_count in (
        ("Government", 9, 9), ("Corporate IG", 13, 7), ("High Yield", 10, 7),
        ("Emerging Markets", 10, 3), ("Structured Credit", 4, 6), ("Aggregate", 1, 1),
    ):
        categories.get_by_role("button", name=category, exact=True).click()
        for vehicle, expected in (("US-listed", us_count), ("UCITS", ucits_count)):
            listing_type.get_by_role("button", name=vehicle, exact=True).click()
            actual = page.locator(".fixed-income-token").count()
            if actual != expected:
                raise AssertionError(f"{category}/{vehicle}: {actual} ETFs, esperado {expected} ({label})")
            assert_no_horizontal_overflow(page, f"{category}/{vehicle} ({label})")

    for ticker in ("JAAA", "JAAA_UCITS", "FLOT", "FLOT_UCITS", "CLOR", "ZPR5", "PCY", "VDET", "XHW0", "TFRN"):
        page.goto(f"{base_url}#etfs/fixed/{ticker}", wait_until="domcontentloaded")
        check_etf_information(page, ticker, label)
        page.get_by_role("link", name=f"Open {ticker} in Data Lab", exact=True).click()
        page.locator(f'svg[aria-label="{ticker} chart versus Fed Funds"]').wait_for()
        path = page.locator(".data-lab-line.is-etf").get_attribute("d") or ""
        if path.count("L") < 2 or "NaN" in path or "Infinity" in path:
            raise AssertionError(f"Gráfico inválido para {ticker} ({label})")
        page.get_by_role("navigation", name="Fixed income listing type", exact=True).wait_for()
        assert_no_horizontal_overflow(page, f"Fixed Income {ticker} ({label})")
        page.get_by_role("link", name=f"Open {ticker} in ETFs", exact=True).click()
        page.wait_for_url(f"**/#etfs/fixed/{ticker}")
        check_etf_information(page, ticker, label)
    print(f"OK: Fixed Income, filtros, listagens distintas e navegação ({label}).", flush=True)


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    base_url = f"http://127.0.0.1:{server.server_port}/"

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                for label, viewport in VIEWPORTS.items():
                    check_viewport(browser, base_url, label, viewport)
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
        server_thread.join(timeout=5)

    print(
        "OK: Home, cinco áreas, temas e responsividade validados "
        "em computador e celular."
    )


if __name__ == "__main__":
    main()
