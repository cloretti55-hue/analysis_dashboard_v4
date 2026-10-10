from __future__ import annotations

import html
import json
import re
import sys
import urllib.request
from urllib.parse import urljoin, urlparse
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "data" / "sp500-valuation.json"
TOPIC_URL = "https://insight.factset.com/topic/earnings"
BASE_URL = "https://insight.factset.com"
USER_AGENT = "Mozilla/5.0 general-channels-dashboard/0.1"


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read().decode("utf-8", errors="replace")


def strip_html(raw_html: str) -> str:
    text = re.sub(r"(?is)<script.*?</script>|<style.*?</style>", " ", raw_html)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def load_previous() -> dict:
    if not OUTPUT_PATH.exists():
        return {}
    try:
        return json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def find_candidate_urls(topic_html: str) -> list[str]:
    candidates: list[str] = []
    for href, title in re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', topic_html, flags=re.I | re.S):
        clean_title = strip_html(title)
        url = urljoin(BASE_URL, html.unescape(href)).split('#')[0].split('?')[0]
        parts = urlparse(url)
        # Earnings reports change titles outside earnings season. Inspect article
        # links on the earnings index rather than three hard-coded title phrases.
        if parts.netloc != "insight.factset.com" or parts.path.count('/') != 1:
            continue
        if not parts.path.strip('/') or not clean_title or clean_title.lower() == "read more":
            continue
        if url not in candidates:
            candidates.append(url)
    return candidates


def parse_factset_post(url: str, raw_html: str) -> dict | None:
    text = strip_html(raw_html)
    pe_match = re.search(r"forward 12-month P/E ratio is ([0-9]+(?:\.[0-9]+)?)", text, flags=re.I)
    if not pe_match:
        return None

    date_match = re.search(
        r"By\s+John Butters\s+\|\s+([A-Z][a-z]+ \d{1,2}, \d{4})",
        text,
    )
    # Restrict averages to the P/E sentence, not earlier earnings-growth averages.
    pe_context = text[pe_match.start():pe_match.end() + 400]
    five_year = re.search(r"5-year average \(([0-9]+(?:\.[0-9]+)?)\)", pe_context, flags=re.I)
    ten_year = re.search(r"10-year average \(([0-9]+(?:\.[0-9]+)?)\)", pe_context, flags=re.I)

    def number(match: re.Match[str] | None) -> float | None:
        return float(match.group(1)) if match else None

    as_of = None
    if date_match:
        as_of = datetime.strptime(date_match.group(1), "%B %d, %Y").date().isoformat()

    return {
        "asOf": as_of,
        "sourceUrl": url,
        "forwardPE": number(pe_match),
        "averages": {
            "5y": number(five_year),
            "10y": number(ten_year),
        },
    }


def merged_payload(parsed: dict, previous: dict) -> dict:
    parsed_averages = parsed.get("averages", {})
    return {
        "asOf": parsed["asOf"],
        "updatedAt": datetime.now(timezone.utc).date().isoformat(),
        "status": "ok",
        "source": "FactSet Earnings Insight",
        "sourceUrl": parsed.get("sourceUrl"),
        "methodology": (
            "Automated extraction from public FactSet Insight earnings posts. "
            "Values refer to the dated source article. Unavailable fields are left null."
        ),
        "sp500": {
            "forwardPE": parsed.get("forwardPE"),
            "forwardEPS": None,
            "trailingPE": None,
            "averages": {
                "5y": parsed_averages.get("5y"),
                "10y": parsed_averages.get("10y"),
                "15y": None,
                "20y": None,
                "25y": None,
            },
        },
    }


def failure_payload(previous: dict, error: Exception) -> dict:
    payload = previous if previous else {
        "asOf": None,
        "source": "FactSet Earnings Insight",
        "sp500": {
            "forwardPE": None,
            "forwardEPS": None,
            "trailingPE": None,
            "averages": {"5y": None, "10y": None, "15y": None, "20y": None, "25y": None},
        },
    }
    payload["status"] = "fallback"
    payload["updatedAt"] = datetime.now(timezone.utc).date().isoformat()
    payload["refreshError"] = str(error)
    return payload


def select_latest(candidates: list[str], previous: dict, fetcher=fetch_text, today=None) -> dict:
    today = today or datetime.now(timezone.utc).date()
    parsed_posts = []
    for url in candidates[:24]:
        try:
            parsed = parse_factset_post(url, fetcher(url))
            if parsed and parsed.get("asOf"):
                parsed_posts.append(parsed)
        except Exception as exc:
            print(f"WARNING: Could not read {url}: {exc}")
    if not parsed_posts:
        raise ValueError("No dated FactSet article contained forward P/E data.")
    latest = max(parsed_posts, key=lambda item: item["asOf"])
    age = (today - datetime.strptime(latest["asOf"], "%Y-%m-%d").date()).days
    if not 0 <= age <= 14:
        raise ValueError(f"Latest usable FactSet article is dated {latest['asOf']} ({age} days); freshness limit is 14 days.")
    if previous.get("asOf") and latest["asOf"] < previous["asOf"]:
        raise ValueError("Refusing to replace a newer FactSet observation with an older one.")
    return latest


def main() -> None:
    previous = load_previous()
    try:
        topic_html = fetch_text(TOPIC_URL)
        candidates = find_candidate_urls(topic_html)
        if not candidates:
            raise ValueError("No candidate FactSet S&P 500 earnings posts found.")

        parsed = select_latest(candidates, previous)
        payload = merged_payload(parsed, previous)
    except Exception as exc:
        payload = failure_payload(previous, exc)

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)} with status={payload.get('status')} asOf={payload.get('asOf')}")
    if payload.get("status") != "ok":
        print(f"ERROR: {payload.get('refreshError')}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
