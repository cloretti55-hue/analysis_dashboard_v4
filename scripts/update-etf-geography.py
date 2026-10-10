from __future__ import annotations

import html
import json
import re
import time
import urllib.request
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Any

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "data" / "etf-geography.json"
USER_AGENT = "Mozilla/5.0 (compatible; GeneralChannelsData/1.0)"


ISHARES_US_PDFS = {
    "IEFA": "https://www.ishares.com/us/literature/fact-sheet/iefa-ishares-core-msci-eafe-etf-fund-fact-sheet-en-us.pdf",
    "IEUR": "https://www.ishares.com/us/literature/fact-sheet/ieur-ishares-core-msci-europe-etf-fund-fact-sheet-en-us.pdf",
    "IEMG": "https://www.ishares.com/us/literature/fact-sheet/iemg-ishares-core-msci-emerging-markets-etf-fund-fact-sheet-en-us.pdf",
    "EMXC": "https://www.ishares.com/us/literature/fact-sheet/emxc-ishares-msci-emerging-markets-ex-china-etf-fund-fact-sheet-en-us.pdf",
}

ISHARES_UCITS_PAGES = {
    "IWDA": "https://www.ishares.com/uk/individual/en/products/251882/ishares-core-msci-world-ucits-etf-acc-fund",
    "SWDA": "https://www.ishares.com/uk/individual/en/products/251882/ishares-core-msci-world-ucits-etf-acc-fund",
    "IMEU": "https://www.ishares.com/uk/individual/en/products/251861/ishares-msci-europe-ucits-etf-inc-fund",
    "EIMI": "https://www.ishares.com/uk/individual/en/products/264659/ishares-core-msci-em-imi-ucits-etf",
    "EXCH": "https://www.ishares.com/uk/individual/en/products/315592/ishares-msci-em-ex-china-ucits-etf",
}

VANGUARD_PDFS = {
    "VEA": "https://institutional.vanguard.com/iippdf/pdfs/FS936.pdf",
    "VGK": "https://institutional.vanguard.com/iippdf/pdfs/FS963.pdf",
    "VWO": "https://institutional.vanguard.com/iippdf/pdfs/FS964.pdf",
}

SSGA_PDFS = {
    "FEZ": "https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-fez.pdf",
}

COUNTRY_TRANSLATION = {
    "United States": "EUA",
    "United Kingdom": "Reino Unido",
    "Japan": "Japão",
    "France": "França",
    "Switzerland": "Suíça",
    "Germany": "Alemanha",
    "Netherlands": "Holanda",
    "Sweden": "Suécia",
    "Spain": "Espanha",
    "Italy": "Itália",
    "Belgium": "Bélgica",
    "Denmark": "Dinamarca",
    "Finland": "Finlândia",
    "Australia": "Austrália",
    "Canada": "Canadá",
    "Korea": "Coreia do Sul",
    "Korea (South)": "Coreia do Sul",
    "South Korea": "Coreia do Sul",
    "India": "Índia",
    "China": "China",
    "Brazil": "Brasil",
    "South Africa": "África do Sul",
    "Saudi Arabia": "Arábia Saudita",
    "Taiwan": "Taiwan",
    "Mexico": "México",
    "United Arab Emirates": "Emirados Árabes Unidos",
    "Poland": "Polônia",
    "Thailand": "Tailândia",
    "Hong Kong": "Hong Kong",
    "Singapore": "Singapura",
    "Other": "Outros",
}


def fetch_bytes(url: str, attempts: int = 3) -> bytes:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read()
        except Exception as exc:  # provider failures are handled by the persistent fallback
            last_error = exc
            if attempt + 1 < attempts:
                time.sleep(2**attempt)
    raise RuntimeError(f"fonte indisponível após {attempts} tentativas: {last_error}")


def fetch_text(url: str) -> str:
    return fetch_bytes(url).decode("utf-8", errors="ignore")


def normalize_date(raw: str) -> str:
    value = raw.strip()
    for pattern in ("%m/%d/%Y", "%d/%b/%Y", "%d-%b-%Y", "%B %d, %Y"):
        try:
            return datetime.strptime(value, pattern).date().isoformat()
        except ValueError:
            continue
    raise ValueError(f"data não reconhecida: {raw}")


def top_weights(rows: list[tuple[str, float]], limit: int = 6) -> list[list[Any]]:
    cleaned: dict[str, float] = {}
    for country, value in rows:
        if country in {"Cash and/or Derivatives", "Cash", "Caixa"} or value < 0:
            continue
        translated = COUNTRY_TRANSLATION.get(country, country)
        cleaned[translated] = round(float(value), 2)
    if len(cleaned) < 3:
        raise ValueError("menos de três países válidos foram encontrados")
    return [[country, value] for country, value in sorted(cleaned.items(), key=lambda row: row[1], reverse=True)[:limit]]


def pdf_text(url: str) -> str:
    reader = PdfReader(BytesIO(fetch_bytes(url)))
    return "\n".join(page.extract_text(extraction_mode="layout") or "" for page in reader.pages)


def parse_pdf_date(text: str) -> str:
    patterns = (
        r"Fact Sheet as of ([A-Z][a-z]+ \d{1,2}, \d{4})",
        r"\bAs of ([A-Z][a-z]+ \d{1,2}, \d{4})",
        r"Portfolio Breakdowns[^\n]*?as at:\s*(\d{1,2}-[A-Z][a-z]{2}-\d{4})",
        r"\bAs of (\d{2}/\d{2}/\d{4})",
    )
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.I)
        if match:
            return normalize_date(match.group(1))
    raise ValueError("data de referência não encontrada no PDF")


def parse_pdf_countries(text: str, heading: str) -> list[list[Any]]:
    start = text.lower().find(heading.lower())
    if start < 0:
        raise ValueError(f"seção '{heading}' não encontrada no PDF")
    section = text[start : start + 8000]
    rows: list[tuple[str, float]] = []
    for country in sorted(COUNTRY_TRANSLATION, key=len, reverse=True):
        match = re.search(rf"(?<![A-Za-z]){re.escape(country)}\s+([0-9]+(?:\.[0-9]+)?)\b", section)
        if match:
            rows.append((country, float(match.group(1))))
    return top_weights(rows)


def parse_ishares_pdf(url: str) -> tuple[list[list[Any]], str]:
    text = pdf_text(url)
    return parse_pdf_countries(text, "GEOGRAPHIC BREAKDOWN (%)"), parse_pdf_date(text)


def parse_ssga_pdf(url: str) -> tuple[list[list[Any]], str]:
    text = pdf_text(url)
    return parse_pdf_countries(text, "Top Country Weights"), parse_pdf_date(text)


def parse_vanguard_pdf(url: str) -> tuple[list[list[Any]], str]:
    text = pdf_text(url)
    return parse_pdf_countries(text, "Ten largest market allocations"), parse_pdf_date(text)


def parse_ishares_page(url: str) -> tuple[list[list[Any]], str]:
    source = fetch_text(url)
    needle = 'componentkey="exposureBreakdowns"'
    position = source.find(needle)
    if position < 0:
        raise ValueError("componente oficial de exposição não encontrado")
    marker = 'componentprops="'
    start = source.rfind(marker, 0, position)
    end = source.find('" componentkey=', start)
    if start < 0 or end < 0:
        raise ValueError("JSON de exposição não encontrado")
    component = json.loads(html.unescape(source[start + len(marker) : end]))
    datapoints = (
        component["containersByNameMap"]["geography"]["subContainersByNameMap"]["countries"]["dataPointsByNameMap"]
    )
    countries = datapoints["type"]["value"]
    weights = datapoints["fund"]["value"]
    as_of = normalize_date(datapoints["asOf"]["formattedValue"])
    return top_weights(list(zip(countries, weights))), as_of


def read_previous() -> dict[str, Any]:
    try:
        return json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {"instruments": {}}


def refresh_instrument(ticker: str, provider: str, url: str) -> dict[str, Any]:
    if provider == "Vanguard":
        weights, as_of = parse_vanguard_pdf(url)
    elif provider == "iShares":
        weights, as_of = parse_ishares_pdf(url)
    elif provider == "iShares UCITS":
        weights, as_of = parse_ishares_page(url)
    elif provider == "SPDR":
        weights, as_of = parse_ssga_pdf(url)
    else:
        raise ValueError(f"provedor não suportado: {provider}")
    return {
        "weights": weights,
        "asOf": as_of,
        "source": provider,
        "sourceUrl": url,
        "status": "ok",
        "refreshError": None,
    }


def preserve_previous(
    ticker: str,
    provider: str,
    url: str,
    previous: dict[str, Any],
    error: Exception,
) -> dict[str, Any]:
    prior = previous.get("instruments", {}).get(ticker, {})
    weights = prior.get("weights")
    if not weights:
        raise RuntimeError(f"{ticker}: fonte falhou e não existe dado anterior válido: {error}") from error
    return {
        **prior,
        "weights": weights,
        "source": provider,
        "sourceUrl": url,
        "status": "stale",
        "refreshError": str(error),
    }


def main() -> None:
    previous = read_previous()
    attempted_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    instruments: dict[str, Any] = {}
    sources = [
        ("Vanguard", VANGUARD_PDFS),
        ("iShares", ISHARES_US_PDFS),
        ("iShares UCITS", ISHARES_UCITS_PAGES),
        ("SPDR", SSGA_PDFS),
    ]
    for provider, mapping in sources:
        for ticker, url in mapping.items():
            try:
                instruments[ticker] = refresh_instrument(ticker, provider, url)
                print(f"{ticker}: atualizado com referência {instruments[ticker]['asOf']}")
            except Exception as exc:
                instruments[ticker] = preserve_previous(ticker, provider, url, previous, exc)
                print(f"{ticker}: mantido dado anterior; motivo: {exc}")

    dates = [item.get("asOf") for item in instruments.values() if item.get("asOf")]
    payload = {
        "version": 2,
        "asOf": min(dates) if dates else None,
        "generatedAt": attempted_at,
        "methodology": (
            "Pesos por país atualizados mensalmente a partir das lâminas oficiais da Vanguard, iShares US e SPDR "
            "e das páginas oficiais estruturadas da iShares UCITS. Em falha temporária, o último dado válido é preservado e marcado como stale."
        ),
        "instruments": dict(sorted(instruments.items())),
    }
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Arquivo atualizado: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
