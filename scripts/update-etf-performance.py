from __future__ import annotations

import json
import argparse
import math
import statistics
import time
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
UNIVERSE_PATH = ROOT / "data" / "etf-universe.json"
OUTPUT_PATH = ROOT / "data" / "etf-performance.json"
FIXED_INCOME_FALLBACK_PATH = ROOT / "data" / "fixed-income-performance.json"
YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?period1={start}&period2={end}&interval=1d&events=history"
FRED_CSV_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id={series}"
TRADING_DAYS = 252
REQUEST_ATTEMPTS = 3
REQUEST_RETRY_SECONDS = 5


def cdi_accumulated_history(rows: list[dict]) -> list[dict]:
    """SGS 12 is percent per business day: compound once per dated observation."""
    observations = {}
    for row in rows:
        day = datetime.strptime(row["data"], "%d/%m/%Y").date()
        rate = float(str(row["valor"]).replace(",", "."))
        if not math.isfinite(rate) or rate <= -100:
            raise ValueError("Invalid CDI daily rate")
        if day in observations and observations[day] != rate:
            raise ValueError("Conflicting CDI dates")
        observations[day] = rate
    level, history = 100.0, []
    for day, rate in sorted(observations.items()):
        level *= 1 + rate / 100
        history.append({"date": day, "close": level})
    if len(history) < 2:
        raise ValueError("Insufficient CDI history")
    return history


def fetch_cdi_history() -> list[dict]:
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=5 * 366 + 14)
    url = ("https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json"
           f"&dataInicial={start:%d/%m/%Y}&dataFinal={today:%d/%m/%Y}")
    for attempt in range(REQUEST_ATTEMPTS):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 GeneralChannels"})
            with urllib.request.urlopen(request, timeout=45) as response:
                return cdi_accumulated_history(json.load(response))
        except Exception:
            if attempt == REQUEST_ATTEMPTS - 1:
                raise
            time.sleep(REQUEST_RETRY_SECONDS * (attempt + 1))


def pct(value: float | None) -> float | None:
    if value is None or not math.isfinite(value):
        return None
    return round(value * 100, 2)


def suspicious_flat_prices(symbol: str, values: list, volumes: list) -> set:
    """Quarantine repeated zero-volume levels with a >20% adjacent discontinuity.

    Zero/missing volume alone does not invalidate a historical price.
    This is a source-quality screen, not a reconstruction of missing prices.
    """
    if not symbol.upper().endswith(".SA"):
        return set()
    counts = {}
    jumps = set()
    previous = None
    for i, value in enumerate(values):
        if value is None or not math.isfinite(value) or value <= 0:
            continue
        volume = volumes[i] if i < len(volumes) else None
        if not volume:
            counts[value] = counts.get(value, 0) + 1
        if previous is not None and abs(value / previous - 1) > 0.20:
            jumps.update([previous, value])
        previous = value
    return {value for value, count in counts.items() if count >= 20 and value in jumps}


def fetch_yahoo_chart_history(symbol: str) -> list[dict]:
    now = datetime.now(timezone.utc)
    # Include a buffer before the five-year anniversary for weekends/holidays.
    url = YAHOO_CHART_URL.format(symbol=symbol.upper(),
        start=int((now - timedelta(days=5 * 366 + 14)).timestamp()), end=int(now.timestamp()))
    last_error: Exception | None = None
    for attempt in range(1, REQUEST_ATTEMPTS + 1):
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 general-channels-dashboard/0.1"},
        )
        try:
            with urllib.request.urlopen(request, timeout=75) as response:
                payload = json.loads(response.read().decode("utf-8"))
            break
        except Exception as exc:
            last_error = exc
            if attempt < REQUEST_ATTEMPTS:
                time.sleep(REQUEST_RETRY_SECONDS * attempt)
    else:
        raise last_error or TimeoutError(f"Could not fetch {symbol}")

    result = payload.get("chart", {}).get("result", [])
    if not result:
        error = payload.get("chart", {}).get("error")
        raise ValueError(f"No Yahoo chart result for {symbol}: {error}")

    series = result[0]
    if symbol.upper().endswith(".SA"):
        meta = series.get("meta", {})
        if meta.get("symbol", "").upper() != symbol.upper() or meta.get("currency") != "BRL":
            raise ValueError(f"Unexpected Yahoo identity/currency for {symbol}")
    timestamps = series.get("timestamp") or []
    indicators = series.get("indicators", {})
    adjclose = (indicators.get("adjclose") or [{}])[0].get("adjclose") or []
    close = (indicators.get("quote") or [{}])[0].get("close") or []
    values = adjclose if adjclose else close
    volumes = (indicators.get("quote") or [{}])[0].get("volume") or []
    regular = series.get("meta", {}).get("currentTradingPeriod", {}).get("regular", {})
    session_start, session_end = regular.get("start"), regular.get("end")

    rejected_prices = suspicious_flat_prices(symbol, values, volumes)
    history = []
    for index, (timestamp, price) in enumerate(zip(timestamps, values)):
        if price in rejected_prices:
            continue
        if price is None or not math.isfinite(float(price)) or float(price) <= 0:
            continue
        # A daily candle may still be live. Allow 15 minutes after session close.
        if session_start and session_end and timestamp >= session_start and now.timestamp() < session_end + 900:
            continue
        if not session_end and datetime.fromtimestamp(timestamp, timezone.utc).date() >= now.date():
            continue
        history.append(
            {
                "date": datetime.fromtimestamp(timestamp, timezone.utc).date(),
                "close": float(price),
            }
        )

    if not history:
        raise ValueError(f"No price history returned for {symbol}")
    return history


def fetch_fred_csv(series: str) -> str:
    url = FRED_CSV_URL.format(series=series.upper())
    last_error: Exception | None = None
    for attempt in range(1, REQUEST_ATTEMPTS + 1):
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 general-channels-dashboard/0.1"},
        )
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read().decode("utf-8")
        except Exception as exc:
            last_error = exc
            if attempt < REQUEST_ATTEMPTS:
                time.sleep(REQUEST_RETRY_SECONDS * attempt)
    raise last_error or TimeoutError(f"Could not fetch FRED series {series}")


def fetch_nyfed_rate_history() -> list[dict]:
    """Official EFFR observations; no API key required."""
    url = "https://markets.newyorkfed.org/api/rates/unsecured/effr/search.json?startDate=2000-01-01&endDate=" + date.today().isoformat()
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 general-channels-dashboard/0.1"})
    with urllib.request.urlopen(request, timeout=25) as response:
        payload = json.load(response)
    rows = [{"date": date.fromisoformat(row["effectiveDate"]), "rate": float(row["percentRate"]),
             "source": "Federal Reserve Bank of New York EFFR"}
            for row in payload.get("refRates", []) if row.get("type") == "EFFR"]
    if not rows or any(not math.isfinite(row["rate"]) or row["rate"] <= -100 for row in rows):
        raise ValueError("Invalid or empty NY Fed EFFR history")
    return sorted(rows, key=lambda row: row["date"])


def fetch_fred_rate_history(series: str) -> list[dict]:
    if series.upper() in {"DFF", "EFFR"}:
        try:
            return fetch_nyfed_rate_history()
        except Exception as exc:
            print(f"WARNING: NY Fed unavailable; trying FRED: {exc}")
    text = fetch_fred_csv(series)

    history = []
    for line in text.splitlines()[1:]:
        if not line.strip():
            continue
        date_text, value_text = line.split(",", 1)
        if value_text.strip() in {"", "."}:
            continue
        history.append(
            {
                "date": datetime.strptime(date_text, "%Y-%m-%d").date(),
                "rate": float(value_text),
            }
        )

    if not history:
        raise ValueError(f"No FRED history returned for {series}")
    return history


def fetch_fred_index_history(series: str) -> list[dict]:
    text = fetch_fred_csv(series)
    history = []
    for line in text.splitlines()[1:]:
        if not line.strip():
            continue
        date_text, value_text = line.split(",", 1)
        if value_text.strip() in {"", "."}:
            continue
        history.append(
            {
                "date": datetime.strptime(date_text, "%Y-%m-%d").date(),
                "close": float(value_text),
            }
        )
    if not history:
        raise ValueError(f"No FRED history returned for {series}")
    return history


def accrued_rate_index(rate_history: list[dict], start_date: date, end_date: date) -> list[dict]:
    # Synthetic cash return: daily reinvestment, annual simple rate / 360.
    # Carry the last published effective rate across weekends/holidays only
    # inside the observed range. Never extend beyond the last rate date.
    ordered = sorted(rate_history, key=lambda row: row["date"])
    if not ordered or end_date < start_date:
        return []
    start_date = max(start_date, ordered[0]["date"])
    end_date = min(end_date, ordered[-1]["date"])
    if start_date > end_date:
        return []
    if any(not math.isfinite(row["rate"]) or row["rate"] <= -100 for row in ordered):
        raise ValueError("Invalid annual cash rate")
    level, cursor = 100.0, 0
    day = start_date
    result = [{"date": day, "close": level}]
    while day < end_date:
        while cursor + 1 < len(ordered) and ordered[cursor + 1]["date"] <= day:
            cursor += 1
        level *= 1 + ordered[cursor]["rate"] / 100 / 360
        day += timedelta(days=1)
        result.append({"date": day, "close": level})
    return result


def nearest_on_or_after(history: list[dict], target: date) -> dict | None:
    for row in history:
        if row["date"] >= target:
            return row
    return None


def nearest_on_or_before(history: list[dict], target: date) -> dict | None:
    candidate = None
    for row in history:
        if row["date"] <= target:
            candidate = row
        else:
            break
    return candidate


def cumulative_return(history: list[dict], start: date, end_close: float) -> float | None:
    start_row = nearest_on_or_after(history, start)
    if not start_row or start_row["close"] <= 0:
        return None
    return end_close / start_row["close"] - 1


def annualized_return(history: list[dict], years: int, end_date: date, end_close: float) -> float | None:
    start_row = period_start(history, years_before(end_date, years))
    if not start_row or end_close <= 0:
        return None
    elapsed_days = max((end_date - start_row["date"]).days, 1)
    total = end_close / start_row["close"] - 1
    return (1 + total) ** (365 / elapsed_days) - 1


def years_before(day: date, years: int) -> date:
    try:
        return day.replace(year=day.year - years)
    except ValueError:  # Feb 29 maps to Feb 28 in a non-leap year.
        return day.replace(year=day.year - years, day=28)


def period_start(history: list[dict], target: date) -> dict | None:
    row = nearest_on_or_before(history, target)
    # No extrapolation from inception or from a distant/stale observation.
    if not row or row["close"] <= 0 or (target - row["date"]).days > 7:
        return None
    return row


def period_return(history: list[dict], target: date, end_close: float) -> float | None:
    row = period_start(history, target)
    return end_close / row["close"] - 1 if row else None


def trailing_daily_returns(history: list[dict], end_date: date, days: int = 365) -> list[float]:
    start_date = end_date - timedelta(days=days)
    rows = [row for row in history if row["date"] >= start_date]
    returns = []
    for prev, cur in zip(rows, rows[1:]):
        if prev["close"] > 0 and 0 < (cur["date"] - prev["date"]).days <= 7:
            returns.append(cur["close"] / prev["close"] - 1)
    return returns


def daily_returns_by_date(history: list[dict], start_date: date) -> dict[date, float]:
    rows = [row for row in sorted(history, key=lambda item: item["date"]) if row["date"] >= start_date]
    returns = {}
    for prev, cur in zip(rows, rows[1:]):
        if prev["close"] > 0:
            returns[cur["date"]] = cur["close"] / prev["close"] - 1
    return returns


def annualized_volatility(history: list[dict], end_date: date) -> float | None:
    returns = trailing_daily_returns(history, end_date)
    if len(returns) < 30:
        return None
    return statistics.stdev(returns) * math.sqrt(TRADING_DAYS)


def max_drawdown_1y(history: list[dict], end_date: date) -> float | None:
    start_date = end_date - timedelta(days=365)
    rows = [row for row in history if row["date"] >= start_date]
    if len(rows) < 2:
        return None
    peak = rows[0]["close"]
    max_dd = 0.0
    for row in rows:
        peak = max(peak, row["close"])
        if peak > 0:
            max_dd = min(max_dd, row["close"] / peak - 1)
    return max_dd


def beta_1y(history: list[dict], benchmark_history: list[dict] | None) -> float | None:
    if not benchmark_history:
        return None
    history = sorted(history, key=lambda row: row["date"])
    benchmark_history = sorted(benchmark_history, key=lambda row: row["date"])
    if len(history) < 40 or len(benchmark_history) < 40:
        return None

    end_date = min(history[-1]["date"], benchmark_history[-1]["date"])
    start_date = end_date - timedelta(days=365)
    left = daily_returns_by_date(history, start_date)
    right = daily_returns_by_date(benchmark_history, start_date)
    common_dates = sorted(set(left) & set(right))
    if len(common_dates) < 30:
        return None

    x = [right[day] for day in common_dates]
    y = [left[day] for day in common_dates]
    mean_x = statistics.mean(x)
    mean_y = statistics.mean(y)
    variance_x = sum((value - mean_x) ** 2 for value in x)
    if variance_x == 0:
        return None
    covariance = sum((a - mean_y) * (b - mean_x) for a, b in zip(y, x))
    return round(covariance / variance_x, 2)


def correlation_details(history: list[dict], benchmark_history: list[dict] | None) -> dict:
    result = {"value": None, "startDate": None, "endDate": None, "observations": 0,
              "methodology": "Pearson correlation of returns over identical observed start/end dates; trailing 365 days or available history; gaps over 7 days excluded."}
    if not history or not benchmark_history:
        return result
    history = sorted(history, key=lambda row: row["date"])
    reference = {row["date"]: row["close"] for row in benchmark_history}
    end = min(history[-1]["date"], max(reference))
    start = end - timedelta(days=365)
    pairs = []
    for prev, cur in zip(history, history[1:]):
        a, b = prev["date"], cur["date"]
        if not (start <= a < b <= end) or (b - a).days > 7:
            continue
        if a not in reference or b not in reference:
            continue
        prices = [prev["close"], cur["close"], reference[a], reference[b]]
        if not all(math.isfinite(v) and v > 0 for v in prices):
            continue
        pairs.append((a, b, cur["close"] / prev["close"] - 1, reference[b] / reference[a] - 1))
    if not pairs:
        return result
    result.update(startDate=pairs[0][0].isoformat(), endDate=pairs[-1][1].isoformat(), observations=len(pairs))
    if len(pairs) < 30:
        return result
    x, y = [p[2] for p in pairs], [p[3] for p in pairs]
    if statistics.pstdev(x) < 1e-12 or statistics.pstdev(y) < 1e-12:
        return result
    result["value"] = round(max(-1.0, min(1.0, statistics.correlation(x, y))), 2)
    return result


def correlation_1y(history: list[dict], benchmark_history: list[dict] | None) -> float | None:
    return correlation_details(history, benchmark_history)["value"]


def metrics_for_history(history: list[dict]) -> dict:
    history = sorted(history, key=lambda row: row["date"])
    last = history[-1]
    end_date = last["date"]
    end_close = last["close"]
    ytd_start = date(end_date.year, 1, 1) - timedelta(days=1)

    return {
      "asOf": end_date.isoformat(),
      "lastClose": round(end_close, 4),
      "historyStartDate": history[0]["date"].isoformat(),
      "historyObservationCount": len(history),
      "returnYtdPct": pct(period_return(history, ytd_start, end_close)),
      "return1yPct": pct(period_return(history, years_before(end_date, 1), end_close)),
      "return3yAnnPct": pct(annualized_return(history, 3, end_date, end_close)),
      "return5yAnnPct": pct(annualized_return(history, 5, end_date, end_close)),
      "vol1yAnnPct": pct(annualized_volatility(history, end_date)),
      "maxDrawdown1yPct": pct(max_drawdown_1y(history, end_date)),
    }


def brazil_available_return(history: list[dict], metrics: dict) -> dict:
    """Keep full-period metrics strict; explain missing bases and offer a dated return."""
    ordered = sorted(history, key=lambda row: row["date"])
    last_gap = max((i for i in range(1, len(ordered)) if (ordered[i]["date"] - ordered[i-1]["date"]).days > 30), default=0)
    segment = ordered[last_gap:]
    notes = {}
    for key, label in [("returnYtdPct", "prior year-end"), ("return1yPct", "one-year"), ("return3yAnnPct", "three-year"), ("return5yAnnPct", "five-year")]:
        if metrics.get(key) is None:
            notes[key] = f"No valid {label} base price in the available Yahoo history."
    result = {"metricNotes": notes, "continuousHistoryStartDate": segment[0]["date"].isoformat()}
    if metrics.get("returnYtdPct") is None and len(segment) >= 2:
        result.update(returnAvailablePct=pct(segment[-1]["close"] / segment[0]["close"] - 1),
                      returnAvailableStartDate=segment[0]["date"].isoformat(),
                      returnAvailableEndDate=segment[-1]["date"].isoformat())
    return result


def active_metrics(item_metrics: dict, benchmark_metrics: dict | None) -> dict | None:
    if not benchmark_metrics:
        return None
    fields = ["returnYtdPct", "return1yPct", "return3yAnnPct", "return5yAnnPct", "vol1yAnnPct"]
    active = {}
    for field in fields:
        left = item_metrics.get(field)
        right = benchmark_metrics.get(field)
        active[field.replace("Pct", "VsBenchmarkPct")] = (
            round(left - right, 2) if left is not None and right is not None else None
        )
    return active


def downsample(rows: list[dict], max_points: int = 180) -> list[dict]:
    if len(rows) <= max_points:
        return rows
    step = (len(rows) - 1) / (max_points - 1)
    sampled = [rows[round(i * step)] for i in range(max_points)]
    return sampled


def normalized_chart_series(
    history: list[dict],
    benchmark_history: list[dict] | None = None,
    benchmark_key: str = "sp500",
    years: int = 3,
    additional_benchmarks: dict[str, list[dict]] | None = None,
    align_common_window: bool = False,
) -> dict | None:
    history = sorted(history, key=lambda row: row["date"])
    if not history:
        return None

    end_date = history[-1]["date"]
    start_date = max(history[0]["date"], end_date - timedelta(days=365 * years))
    rows = [row for row in history if row["date"] >= start_date]
    if len(rows) < 2 or rows[0]["close"] <= 0:
        return None

    benchmark_inputs = dict(additional_benchmarks or {})
    if benchmark_history:
        benchmark_inputs[benchmark_key] = benchmark_history

    original_start = rows[0]["date"]
    if align_common_window and benchmark_inputs:
        # Compare observed dates only: never carry CDI beyond its last observation.
        common_dates = set.intersection(*({r["date"] for r in series} for series in benchmark_inputs.values()))
        rows = [row for row in rows if row["date"] in common_dates]
        # Use the latest continuous segment; an isolated old quote must not set
        # the base of a chart whose visible ETF line starts months later.
        last_gap = max((i for i in range(1, len(rows))
                        if (rows[i]["date"] - rows[i - 1]["date"]).days > 30), default=0)
        rows = rows[last_gap:]
        if len(rows) < 2:
            return None

    benchmark_states = {}
    for key, benchmark_rows in benchmark_inputs.items():
        ordered = sorted(benchmark_rows, key=lambda row: row["date"])
        start = nearest_on_or_before(ordered, rows[0]["date"])
        if not start or start["close"] <= 0:
            continue
        benchmark_states[key] = {
            "rows": ordered,
            "index": ordered.index(start),
            "last": start,
            "base": start["close"],
        }

    chart_rows = []
    base = rows[0]["close"]

    for row in rows:
        for state in benchmark_states.values():
            while state["index"] + 1 < len(state["rows"]) and state["rows"][state["index"] + 1]["date"] <= row["date"]:
                state["index"] += 1
                state["last"] = state["rows"][state["index"]]

        point = {
            "date": row["date"].isoformat(),
            "etf": round((row["close"] / base) * 100, 2),
        }
        for key, state in benchmark_states.items():
            point[key] = round((state["last"]["close"] / state["base"]) * 100, 2)
        chart_rows.append(point)

    return {
        "base": 100,
        "period": "3y_or_available",
        "alignment": "common_dates_latest_continuous_segment" if align_common_window else "etf_dates",
        "availableStartDate": original_start.isoformat(),
        "startDate": chart_rows[0]["date"],
        "endDate": chart_rows[-1]["date"],
        "points": downsample(chart_rows),
    }


def previous_benchmark_history(previous: dict | None, benchmark_key: str) -> list[dict]:
    if not previous:
        return []
    chart = previous.get("performanceChart")
    if not isinstance(chart, dict):
        return []
    points = chart.get("points")
    if not isinstance(points, list):
        return []
    return [
        {"date": date.fromisoformat(point["date"]), "close": point[benchmark_key]}
        for point in points
        if isinstance(point, dict)
        and isinstance(point.get("date"), str)
        and isinstance(point.get(benchmark_key), (int, float))
    ]


def best_previous_benchmark_history(
    previous_by_ticker: dict[str, dict],
    benchmark_key: str,
    asset_class: str | None = None,
) -> list[dict]:
    candidates = []
    for item in previous_by_ticker.values():
        if item.get("market") == "Brazil":
            continue  # Never reuse BRL/CDI as a USD/SPY/Fed Funds fallback.
        if asset_class and item.get("assetClass") != asset_class:
            continue
        history = previous_benchmark_history(item, benchmark_key)
        if history:
            candidates.append(history)
    if not candidates:
        return []
    return max(candidates, key=lambda history: (history[-1]["date"], len(history)))


def load_previous_by_ticker() -> dict[str, dict]:
    previous_by_ticker: dict[str, dict] = {}
    # The dedicated fixed-income snapshot seeds instruments that may not yet
    # have a successful record in the primary ETF payload. Successful records
    # from the primary payload take precedence when both files contain a ticker.
    for path in (FIXED_INCOME_FALLBACK_PATH, OUTPUT_PATH):
        if not path.exists():
            continue
        try:
            previous_payload = json.loads(path.read_text(encoding="utf-8"))
            for item in previous_payload.get("instruments", []):
                if item.get("ticker") and item.get("status") == "ok" and item.get("performanceChart"):
                    previous_by_ticker[item["ticker"]] = item
        except Exception:
            continue
    return previous_by_ticker


def write_fixed_income_fallback(output_items: list[dict], expected_count: int) -> None:
    fixed_income_items = [
        item
        for item in output_items
        if item.get("assetClass") == "fixed_income" and item.get("market") != "Brazil"
        and item.get("status") == "ok"
        and item.get("performanceChart", {}).get("points")
    ]
    live_items = [item for item in fixed_income_items if not item.get("stale")]

    # Never replace a complete fallback with a partial or entirely stale set.
    if len(fixed_income_items) != expected_count or not live_items:
        print(
            "Keeping existing fixed-income fallback "
            f"(complete={len(fixed_income_items)}/{expected_count}, live={len(live_items)})."
        )
        return

    as_of_dates = [item["asOf"] for item in fixed_income_items if item.get("asOf")]
    payload = {
        "version": 1,
        "asOf": max(as_of_dates) if as_of_dates else None,
        "oldestComponentAsOf": min(as_of_dates) if as_of_dates else None,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "Fixed income instruments from the ETF performance pipeline; benchmark is synthetic accrued Fed Funds from NY Fed EFFR or FRED DFF.",
        "methodology": (
            "Return metrics use adjusted close from Yahoo Finance chart data when available. "
            "Charts use a synthetic Fed Funds cash benchmark from NY Fed EFFR or FRED DFF, compounded daily on an ACT/360 basis, before taxes and costs. ETF and benchmark start at 100 on a common observation date. "
            "A prior valid instrument may be retained and marked stale when refresh fails."
        ),
        "instruments": fixed_income_items,
    }
    FIXED_INCOME_FALLBACK_PATH.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {FIXED_INCOME_FALLBACK_PATH}")


def chart_problem(record: dict, item: dict) -> str | None:
    chart = record.get("performanceChart")
    points = chart.get("points") if isinstance(chart, dict) else None
    if not isinstance(points, list) or len(points) < 2:
        return "Performance chart requires at least two valid observations."
    required = ["etf"]
    if item.get("assetClass") == "fixed_income" and item.get("market") != "Brazil":
        required.append("cash")
    if set(item.get("comparisonBenchmarks", [])) == {"CPI", "SPY"}:
        required.extend(["cpi", "sp500"])
    for point in points:
        if not isinstance(point, dict):
            return "Invalid performance chart observation."
        for key in required:
            value = point.get(key)
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value <= 0:
                return f"Performance chart has missing or invalid {key} observations."
    return None


def retain_valid_record(result: dict, previous: dict | None, item: dict, reason: str) -> dict:
    compatible = previous and all(
        previous.get(key) == item.get(key)
        for key in ("ticker", "quoteSymbol", "currency", "assetClass")
    )
    if compatible and previous.get("status") == "ok" and not chart_problem(previous, item):
        # Preserve metrics, chart and observation dates together; never relabel
        # an old chart with a new quote date or combine inconsistent snapshots.
        retained = {**previous, "stale": True, "refreshError": reason}
        print(f"WARNING: {item['ticker']}: retaining valid data as of {previous.get('asOf')}: {reason}")
        return retained
    print(f"WARNING: {item['ticker']}: no compatible valid prior chart: {reason}")
    return {**result, "status": "error", "error": reason}


def main(argv=()) -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--market", choices=("Brazil", "Global"), help="Refresh only this listing market; preserve other saved records")
    parser.add_argument("--fixed-income", action="store_true", help="Refresh only global fixed income; preserve other records")
    parser.add_argument("--group", help="Refresh a displayGroup only; preserve other records")
    args = parser.parse_args(argv)
    if sum(bool(x) for x in (args.fixed_income, args.market, args.group)) > 1:
        parser.error("Use only one of --fixed-income, --market or --group")
    universe = json.loads(UNIVERSE_PATH.read_text(encoding="utf-8"))
    previous_by_ticker = load_previous_by_ticker()
    previous_fed_funds_history = best_previous_benchmark_history(
        previous_by_ticker,
        "cash",
        asset_class="fixed_income",
    )
    previous_sp500_history = best_previous_benchmark_history(previous_by_ticker, "sp500")
    previous_cpi_history = best_previous_benchmark_history(previous_by_ticker, "cpi")

    benchmark_cache: dict[str, dict] = {}
    benchmark_history_cache: dict[str, list[dict]] = {}
    fed_funds_history = None
    fed_funds_error: str | None = None
    cpi_history = None
    cpi_error: str | None = None
    cdi_history, cdi_error = None, None
    output_by_ticker: dict[str, dict] = {}
    if (args.market or args.fixed_income or args.group) and OUTPUT_PATH.exists():
        output_by_ticker = {row["ticker"]: row for row in json.loads(OUTPUT_PATH.read_text(encoding="utf-8")).get("instruments", [])}
    as_of_dates = []

    universe_items = universe["instruments"]
    processing_items = sorted(
        universe_items,
        key=lambda item: item.get("assetClass") != "fixed_income",
    )

    for item in processing_items:
        if (args.group and item.get("displayGroup") != args.group) or (args.market and item.get("market", "Global") != args.market) or (args.fixed_income and not (item["assetClass"] == "fixed_income" and item.get("market") != "Brazil")):
            if item["ticker"] not in output_by_ticker:
                raise ValueError(f"Missing saved instrument outside selected market: {item['ticker']}")
            continue
        result = {
            "ticker": item["ticker"],
            "name": item["name"],
            "assetClass": item["assetClass"],
            "category": item["category"],
            "wrapper": item["wrapper"],
            "currency": item["currency"],
            "quoteSource": item["quoteSource"],
            "quoteSymbol": item.get("quoteSymbol"),
            "benchmark": item.get("benchmark"),
            "compareToSp500": item.get("compareToSp500", False),
            "comparisonBenchmarks": item.get("comparisonBenchmarks", []),
            "status": "pending",
        }
        for field in ("market", "displayGroup", "displaySubgroup", "benchmarkDisplay", "trackedIndex"):
            if field in item:
                result[field] = item[field]

        if item["quoteSource"] != "yahoo_chart" or not item.get("quoteSymbol"):
            result["status"] = "manual_required"
            result["note"] = item.get("notes", "No automated quote mapping yet.")
            output_by_ticker[item["ticker"]] = result
            continue

        try:
            history = fetch_yahoo_chart_history(item["quoteSymbol"])
            item_metrics = metrics_for_history(history)
        except Exception as exc:
            previous = previous_by_ticker.get(item["ticker"])
            result = retain_valid_record(result, previous, item, str(exc))
            output_by_ticker[item["ticker"]] = result
            continue

        result.update(item_metrics)
        if item.get("market") == "Brazil":
            result.update(brazil_available_return(history, item_metrics))
        result["status"] = "ok"
        as_of_dates.append(item_metrics["asOf"])

        benchmark_symbol = item.get("benchmark") or universe["benchmarkDefaults"]["sp500"]["quoteSymbol"]
        benchmark_history = None
        benchmark_key = "qqq" if benchmark_symbol.upper() == "QQQ" else "sp500"
        benchmark_error = None
        previous = previous_by_ticker.get(item["ticker"])
        is_commodity = set(item.get("comparisonBenchmarks", [])) == {"CPI", "SPY"}

        if item.get("market") == "Brazil" and item["assetClass"] == "fixed_income":
            benchmark_key = "cash"
            if cdi_history is None and cdi_error is None:
                try:
                    cdi_history = fetch_cdi_history()
                except Exception as exc:
                    cdi_error = str(exc)
            benchmark_history = cdi_history
            benchmark_error = cdi_error
            result["benchmarkSource"] = "Banco Central do Brasil SGS 12; daily CDI compounded before taxes and costs"
            result["benchmarkSourceUrl"] = "https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?method=consultarSeries&series=12"
        elif item["assetClass"] == "fixed_income":
            benchmark_key = "cash"
            result["benchmark"] = universe["benchmarkDefaults"]["fedFunds"]["display"]
            if fed_funds_history is None and fed_funds_error is None:
                try:
                    fed_funds_history = fetch_fred_rate_history(
                        universe["benchmarkDefaults"]["fedFunds"]["series"]
                    )
                except Exception as exc:
                    fed_funds_error = str(exc)
            if fed_funds_history:
                result["benchmarkSource"] = fed_funds_history[-1].get("source", "FRED DFF")
                result["benchmarkSourceUrl"] = "https://www.newyorkfed.org/markets/reference-rates/effr" if "New York" in result["benchmarkSource"] else "https://fred.stlouisfed.org/series/DFF"
                result["benchmarkMethodology"] = "Synthetic cash index, daily compounding of the effective annual Fed Funds rate / 360, before fees and taxes. Last effective rate carried across non-publication days within the observed range. Not a Treasury index or an investable fund."
                benchmark_history = accrued_rate_index(
                    fed_funds_history,
                    history[0]["date"],
                    history[-1]["date"],
                )
            else:
                benchmark_error = fed_funds_error or "Fed Funds benchmark unavailable"
        elif item["quoteSymbol"].upper() == benchmark_symbol.upper():
            benchmark_history = history
        else:
            try:
                if benchmark_symbol not in benchmark_history_cache:
                    benchmark_history_cache[benchmark_symbol] = fetch_yahoo_chart_history(benchmark_symbol)
                benchmark_history = benchmark_history_cache[benchmark_symbol]
                result["benchmark"] = benchmark_symbol
            except Exception as exc:
                benchmark_error = str(exc)

        if benchmark_error:
            benchmark_history = previous_benchmark_history(previous, benchmark_key)
            if (
                not benchmark_history
                and item["assetClass"] == "fixed_income" and item.get("market") != "Brazil"
                and previous_fed_funds_history
            ):
                benchmark_history = previous_fed_funds_history
            if not benchmark_history and benchmark_key == "sp500" and previous_sp500_history and item.get("market") != "Brazil":
                benchmark_history = previous_sp500_history
            result["benchmarkStatus"] = "stale" if benchmark_history else "error"
            result["benchmarkError"] = benchmark_error
            result["benchmarkAsOf"] = (
                benchmark_history[-1]["date"].isoformat() if benchmark_history else None
            )
        elif benchmark_history:
            result["benchmarkStatus"] = "ok"
            result["benchmarkAsOf"] = benchmark_history[-1]["date"].isoformat()

        additional_benchmarks = {}
        if item.get("displayGroup") == "Liquid Alternatives":
            if fed_funds_history is None and fed_funds_error is None:
                try:
                    fed_funds_history = fetch_fred_rate_history(universe["benchmarkDefaults"]["fedFunds"]["series"])
                except Exception as exc:
                    fed_funds_error = str(exc)
            cash_history = accrued_rate_index(fed_funds_history, history[0]["date"], history[-1]["date"]) if fed_funds_history else previous_benchmark_history(previous, "cash")
            if cash_history:
                additional_benchmarks["cash"] = cash_history
            result["cashBenchmarkStatus"] = "ok" if fed_funds_history else ("stale" if cash_history else "error")
            result["cashBenchmarkSource"] = fed_funds_history[-1].get("source", "FRED DFF") if fed_funds_history else previous.get("cashBenchmarkSource")
            result["cashBenchmarkAsOf"] = cash_history[-1]["date"].isoformat() if cash_history else None
            result["cashBenchmarkMethodology"] = "Synthetic accrued Fed Funds, daily compounding at annual rate / 360, before taxes and costs."
            if fed_funds_error:
                result["cashBenchmarkError"] = fed_funds_error
        if is_commodity:
            if cpi_history is None and cpi_error is None:
                try:
                    cpi_history = fetch_fred_index_history(
                        universe["benchmarkDefaults"]["cpi"]["series"]
                    )
                except Exception as exc:
                    cpi_error = str(exc)

            active_cpi_history = cpi_history
            if not active_cpi_history:
                active_cpi_history = previous_benchmark_history(previous, "cpi") or previous_cpi_history
            if active_cpi_history:
                additional_benchmarks["cpi"] = active_cpi_history
                result["cpiAsOf"] = active_cpi_history[-1]["date"].isoformat()

            if cpi_error:
                result["benchmarkStatus"] = "stale" if active_cpi_history and benchmark_history else "error"
                result["benchmarkError"] = "; ".join(
                    value for value in [result.get("benchmarkError"), f"CPI: {cpi_error}"] if value
                )
            elif benchmark_history and active_cpi_history and result.get("benchmarkStatus") != "stale":
                result["benchmarkStatus"] = "ok"

            result["benchmark"] = "U.S. CPI + S&P 500"

        result["performanceChart"] = normalized_chart_series(
            history,
            benchmark_history,
            benchmark_key=benchmark_key,
            additional_benchmarks=additional_benchmarks,
            align_common_window=item["assetClass"] == "fixed_income" or item.get("displayGroup") == "Liquid Alternatives",
        )
        problem = chart_problem(result, item)
        if problem:
            output_by_ticker[item["ticker"]] = retain_valid_record(result, previous, item, problem)
            continue
        result["correlationPeriod"] = correlation_details(history, benchmark_history)
        if item["assetClass"] == "fixed_income":
            result["correlation1yVsCash"] = (
                correlation_1y(history, benchmark_history) if benchmark_history else None
            )
        else:
            result["beta1yVsSp500"] = (
                beta_1y(history, benchmark_history) if benchmark_history else None
            )
            result["correlation1yVsSp500"] = (
                correlation_1y(history, benchmark_history) if benchmark_history else None
            )

        if item.get("compareToSp500") and benchmark_history:
            if benchmark_symbol not in benchmark_cache:
                benchmark_cache[benchmark_symbol] = metrics_for_history(benchmark_history)
            result["activeVsBenchmark"] = active_metrics(
                item_metrics,
                benchmark_cache[benchmark_symbol],
            )

        output_by_ticker[item["ticker"]] = result

    output_items = [output_by_ticker[item["ticker"]] for item in universe_items]
    as_of_dates = [item["asOf"] for item in output_items if item.get("status") == "ok" and item.get("asOf")]

    payload = {
        "version": 1,
        "asOf": max(as_of_dates) if as_of_dates else None,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "Yahoo Finance chart adjusted close where available; manual_required for unmapped instruments.",
        "methodology": (
            "Return metrics use adjusted close from Yahoo Finance chart data when available. 3Y and 5Y returns are annualized. "
            "YTD starts at the last available close of the prior year. Trailing returns require a valid observation "
            "on or within seven calendar days before the anniversary; insufficient history returns null. "
            "Current-session candles are excluded until 15 minutes after the regular close. "
            "Volatility is annualized from trailing daily returns. Benchmark failures do not discard current instrument prices; "
            "the prior benchmark series may be retained and explicitly marked stale. "
            "Public/free data may differ from licensed index-provider total return data."
        ),
        "benchmarkPolicy": "Global listings retain their configured SPY, QQQ, Fed Funds or CPI comparisons. Brazil listings use BRL comparisons: Brazilian equities, gold and crypto versus BOVA11; international equities versus IVVB11; Brazilian fixed income versus compounded daily CDI from Banco Central do Brasil SGS 12. Comparison references are not necessarily tracked indices. Returns are in each listing's trading currency, not converted to a common currency.",
        "instruments": output_items,
    }

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")
    expected_fixed_income_count = sum(
        item.get("assetClass") == "fixed_income" and item.get("market") != "Brazil"
        for item in universe_items
    )
    if args.market != "Brazil" and not args.group:
        write_fixed_income_fallback(output_items, expected_fixed_income_count)


if __name__ == "__main__":
    main(None)
