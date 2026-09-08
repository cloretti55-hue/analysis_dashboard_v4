from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
MANIFEST_PATH = DATA_DIR / "manifest.json"
MATURITIES = ["2Y", "5Y", "7Y", "10Y", "30Y"]
ALLOWED_INSTRUMENT_STATUSES = {"ok", "error", "manual_required", "pending"}

DATASET_SPECS = [
    {
        "id": "curve-us",
        "path": "data/curve-us.json",
        "kind": "generated",
        "consumer": ["Yield Curves"],
        "producer": "scripts/update-us-yield-curves.py",
        "workflow": ".github/workflows/update-us-yield-curves.yml",
        "maxAgeDays": 5,
        "required": ["country", "asOf", "componentAsOf", "source", "methodology", "curves", "comparisons"],
    },
    {
        "id": "fed-policy",
        "path": "data/fed-policy.json",
        "kind": "generated",
        "consumer": ["Yield Curves"],
        "producer": "scripts/update-fed-policy.py",
        "workflow": ".github/workflows/update-fed-policy.yml",
        "maxAgeDays": 5,
        "required": ["asOf", "updatedAt", "source", "targetRange", "marketProbability"],
    },
    {
        "id": "equity-valuation",
        "path": "data/equity-valuation.json",
        "kind": "manual",
        "consumer": ["Equity Valuation"],
        "producer": None,
        "workflow": None,
        "maxAgeDays": 45,
        "required": ["asOf", "source", "methodology", "items"],
    },
    {
        "id": "equity-valuation-history",
        "path": "data/equity-valuation-history.json",
        "kind": "manual",
        "consumer": [],
        "producer": None,
        "workflow": None,
        "maxAgeDays": 90,
        "required": ["source", "methodology", "series"],
    },
    {
        "id": "sp500-valuation",
        "path": "data/sp500-valuation.json",
        "kind": "generated",
        "consumer": ["Equity Valuation"],
        "producer": "scripts/update-sp500-valuation.py",
        "workflow": ".github/workflows/update-sp500-valuation.yml",
        "maxAgeDays": 14,
        "required": ["asOf", "updatedAt", "status", "source", "methodology", "sp500"],
    },
    {
        "id": "sp500-pe-history",
        "path": "data/sp500-pe-history.json",
        "kind": "generated",
        "consumer": ["Equity Valuation"],
        "producer": "scripts/update-sp500-pe-history.py",
        "workflow": ".github/workflows/update-sp500-pe-history.yml",
        "maxAgeDays": 45,
        "required": ["asOf", "updatedAt", "status", "source", "methodology", "monthly", "yearEnd"],
    },
    {
        "id": "mag7-valuation",
        "path": "data/mag7-valuation.json",
        "kind": "generated",
        "consumer": ["Equity Valuation"],
        "producer": "scripts/update-mag7-valuation.py",
        "workflow": ".github/workflows/update-mag7-valuation.yml",
        "maxAgeDays": 5,
        "required": ["asOf", "updatedAt", "status", "source", "methodology", "group", "companies"],
    },
    {
        "id": "etf-universe",
        "path": "data/etf-universe.json",
        "kind": "config",
        "consumer": ["ETF performance pipeline"],
        "producer": None,
        "workflow": None,
        "maxAgeDays": None,
        "required": ["version", "benchmarkDefaults", "instruments"],
    },
    {
        "id": "etf-performance",
        "path": "data/etf-performance.json",
        "kind": "generated",
        "consumer": ["Data Lab"],
        "producer": "scripts/update-etf-performance.py",
        "workflow": ".github/workflows/update-etf-performance.yml",
        "maxAgeDays": 5,
        "required": ["version", "asOf", "generatedAt", "source", "methodology", "instruments"],
    },
    {
        "id": "fixed-income-performance",
        "path": "data/fixed-income-performance.json",
        "kind": "generated_fallback",
        "consumer": ["Data Lab"],
        "producer": "scripts/update-etf-performance.py",
        "workflow": ".github/workflows/update-etf-performance.yml",
        "maxAgeDays": 5,
        "required": ["version", "asOf", "generatedAt", "source", "instruments"],
    },
    {
        "id": "etf-geography",
        "path": "data/etf-geography.json",
        "kind": "generated",
        "consumer": ["ETFs"],
        "producer": "scripts/update-etf-geography.py",
        "workflow": ".github/workflows/update-etf-geography.yml",
        "maxAgeDays": 45,
        "required": ["version", "generatedAt", "methodology", "instruments"],
    },
]


def add_issue(issues: list[dict[str, str]], severity: str, code: str, message: str) -> None:
    issues.append({"severity": severity, "code": code, "message": message})


def parse_datetime(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        try:
            parsed = datetime.combine(date.fromisoformat(text), datetime.min.time())
        except ValueError:
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def payload_as_of(payload: dict[str, Any], dataset_id: str) -> str | None:
    if isinstance(payload.get("asOf"), str):
        return payload["asOf"]
    if dataset_id == "equity-valuation-history":
        dates = [
            row.get("asOf")
            for row in payload.get("series", [])
            if isinstance(row, dict) and isinstance(row.get("asOf"), str)
        ]
        return max(dates) if dates else None
    generated = parse_datetime(payload.get("generatedAt"))
    return generated.date().isoformat() if generated else None


def payload_timestamp(payload: dict[str, Any], as_of: str | None) -> datetime | None:
    candidates = [
        parse_datetime(payload.get("generatedAt")),
        parse_datetime(payload.get("updatedAt")),
        parse_datetime(as_of),
    ]
    valid = [value for value in candidates if value is not None]
    return max(valid) if valid else None


def file_sha256(path: Path) -> str:
    payload = json.loads(path.read_text(encoding="utf-8"))
    canonical_json = json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    )
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()


def require_keys(payload: dict[str, Any], required: list[str], issues: list[dict[str, str]]) -> None:
    for key in required:
        if key not in payload or payload[key] is None:
            add_issue(issues, "error", "missing_required_key", f"Missing required key: {key}")


def duplicate_values(rows: list[dict[str, Any]], key: str) -> list[str]:
    values = [str(row.get(key)) for row in rows if row.get(key) not in (None, "")]
    counts = Counter(values)
    return sorted(value for value, count in counts.items() if count > 1)


def is_finite_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def validate_curve(payload: dict[str, Any], issues: list[dict[str, str]]) -> dict[str, Any]:
    curves = payload.get("curves")
    component_as_of = payload.get("componentAsOf")
    if not isinstance(curves, dict):
        add_issue(issues, "error", "invalid_curves", "curves must be an object")
        return {}
    for curve_name in ("nominal", "real", "inflation"):
        curve = curves.get(curve_name)
        dates = component_as_of.get(curve_name) if isinstance(component_as_of, dict) else None
        if not isinstance(curve, dict):
            add_issue(issues, "error", "missing_curve", f"Missing curve: {curve_name}")
            continue
        for maturity in MATURITIES:
            if not is_finite_number(curve.get(maturity)):
                add_issue(issues, "error", "invalid_curve_value", f"{curve_name}.{maturity} must be finite")
            if not isinstance(dates, dict) or parse_datetime(dates.get(maturity)) is None:
                add_issue(issues, "error", "invalid_component_date", f"Missing component date: {curve_name}.{maturity}")
    comparisons = payload.get("comparisons")
    if not isinstance(comparisons, dict):
        add_issue(issues, "error", "invalid_comparisons", "comparisons must be an object")
    else:
        for period in ("current", "1m", "3m", "1y"):
            if period not in comparisons:
                add_issue(issues, "error", "missing_comparison", f"Missing comparison period: {period}")
    return {"maturities": len(MATURITIES), "curveCount": 3}


def validate_etf_universe(payload: dict[str, Any], issues: list[dict[str, str]]) -> dict[str, Any]:
    instruments = payload.get("instruments")
    if not isinstance(instruments, list) or not instruments:
        add_issue(issues, "error", "invalid_instruments", "instruments must be a non-empty array")
        return {"recordCount": 0}
    duplicates = duplicate_values(instruments, "ticker")
    if duplicates:
        add_issue(issues, "error", "duplicate_ticker", f"Duplicate tickers: {', '.join(duplicates)}")
    cpi_default = payload.get("benchmarkDefaults", {}).get("cpi", {})
    if cpi_default.get("series") != "CPIAUCSL":
        add_issue(issues, "error", "invalid_cpi_benchmark", "Commodity CPI benchmark must use FRED CPIAUCSL")
    required = ("ticker", "name", "assetClass", "category", "wrapper", "currency", "quoteSource")
    for index, item in enumerate(instruments):
        if not isinstance(item, dict):
            add_issue(issues, "error", "invalid_instrument", f"Instrument at index {index} must be an object")
            continue
        missing = [key for key in required if item.get(key) in (None, "")]
        if missing:
            add_issue(
                issues,
                "error",
                "incomplete_instrument",
                f"{item.get('ticker', index)} missing: {', '.join(missing)}",
            )
        category = str(item.get("category", ""))
        if category.startswith(("Commodity / ", "Commodity producers / ")) and set(item.get("comparisonBenchmarks", [])) != {"CPI", "SPY"}:
            add_issue(issues, "error", "missing_commodity_benchmarks", f"{item.get('ticker', index)} must compare with CPI and SPY")
    asset_classes = Counter(str(item.get("assetClass", "missing")) for item in instruments if isinstance(item, dict))
    return {"recordCount": len(instruments), "assetClassCounts": dict(sorted(asset_classes.items()))}


def validate_performance(
    payload: dict[str, Any],
    issues: list[dict[str, str]],
    universe: dict[str, Any],
    fixed_only: bool,
) -> dict[str, Any]:
    instruments = payload.get("instruments")
    if not isinstance(instruments, list) or not instruments:
        add_issue(issues, "error", "invalid_instruments", "instruments must be a non-empty array")
        return {"recordCount": 0}

    duplicates = duplicate_values(instruments, "ticker")
    if duplicates:
        add_issue(issues, "error", "duplicate_ticker", f"Duplicate tickers: {', '.join(duplicates)}")

    expected_items = universe.get("instruments", []) if isinstance(universe, dict) else []
    if fixed_only:
        expected_items = [item for item in expected_items if item.get("assetClass") == "fixed_income"]
    expected = {item.get("ticker") for item in expected_items if item.get("ticker")}
    expected_by_ticker = {item.get("ticker"): item for item in expected_items if item.get("ticker")}
    observed = {item.get("ticker") for item in instruments if isinstance(item, dict) and item.get("ticker")}
    missing = sorted(expected - observed)
    extra = sorted(observed - expected)
    if missing:
        add_issue(issues, "error", "missing_tickers", f"Missing tickers: {', '.join(missing)}")
    if extra:
        add_issue(issues, "warning", "unexpected_tickers", f"Unexpected tickers: {', '.join(extra)}")

    status_counts: Counter[str] = Counter()
    stale_count = 0
    stale_benchmark_count = 0
    error_benchmark_count = 0
    chart_count = 0
    for item in instruments:
        if not isinstance(item, dict):
            add_issue(issues, "error", "invalid_instrument", "Instrument must be an object")
            continue
        ticker = str(item.get("ticker", "missing"))
        status = str(item.get("status", "missing"))
        status_counts[status] += 1
        if status not in ALLOWED_INSTRUMENT_STATUSES:
            add_issue(issues, "error", "invalid_status", f"{ticker} has invalid status: {status}")
        if item.get("stale") is True:
            stale_count += 1
        benchmark_status = item.get("benchmarkStatus")
        if benchmark_status == "stale":
            stale_benchmark_count += 1
        elif benchmark_status == "error":
            error_benchmark_count += 1
        elif benchmark_status not in (None, "ok"):
            add_issue(
                issues,
                "error",
                "invalid_benchmark_status",
                f"{ticker} has invalid benchmarkStatus: {benchmark_status}",
            )
        points = item.get("performanceChart", {}).get("points") if isinstance(item.get("performanceChart"), dict) else None
        if isinstance(points, list) and len(points) >= 2:
            chart_count += 1
        if status == "ok" and not isinstance(points, list):
            add_issue(issues, "error", "missing_chart", f"{ticker} is ok but has no performance chart")
        expected_item = expected_by_ticker.get(ticker, {})
        if status == "ok" and set(expected_item.get("comparisonBenchmarks", [])) == {"CPI", "SPY"}:
            has_dual_benchmark = isinstance(points, list) and len(points) >= 2 and all(
                isinstance(point, dict)
                and isinstance(point.get("cpi"), (int, float))
                and isinstance(point.get("sp500"), (int, float))
                for point in points
            )
            if not has_dual_benchmark:
                add_issue(issues, "error", "missing_commodity_chart_benchmarks", f"{ticker} chart must contain CPI and S&P 500 series")

    if status_counts.get("error"):
        add_issue(
            issues,
            "warning",
            "instrument_errors",
            f"{status_counts['error']} instrument(s) failed refresh",
        )
    if stale_count:
        add_issue(issues, "warning", "stale_instruments", f"{stale_count} instrument(s) use prior valid data")
    if stale_benchmark_count:
        add_issue(
            issues,
            "warning",
            "stale_benchmarks",
            f"{stale_benchmark_count} instrument(s) use a prior benchmark series",
        )
    if error_benchmark_count:
        add_issue(
            issues,
            "warning",
            "benchmark_errors",
            f"{error_benchmark_count} instrument(s) have no available benchmark series",
        )
    if fixed_only and status_counts.get("ok", 0) != len(instruments):
        add_issue(issues, "error", "invalid_fallback", "Fixed-income fallback must contain only complete ok instruments")

    metrics = {
        "recordCount": len(instruments),
        "chartCoverage": round(chart_count / len(instruments), 4),
        "statusCounts": dict(sorted(status_counts.items())),
        "staleCount": stale_count,
    }
    if stale_benchmark_count:
        metrics["staleBenchmarkCount"] = stale_benchmark_count
    if error_benchmark_count:
        metrics["benchmarkErrorCount"] = error_benchmark_count
    return metrics


def validate_geography(payload: dict[str, Any], issues: list[dict[str, str]]) -> dict[str, Any]:
    instruments = payload.get("instruments")
    if not isinstance(instruments, dict) or not instruments:
        add_issue(issues, "error", "invalid_instruments", "instruments must be a non-empty object")
        return {"recordCount": 0}
    status_counts: Counter[str] = Counter()
    for ticker, item in instruments.items():
        if not isinstance(item, dict):
            add_issue(issues, "error", "invalid_instrument", f"{ticker} must be an object")
            continue
        status_counts[str(item.get("status", "missing"))] += 1
        weights = item.get("weights")
        if not isinstance(weights, (list, dict)) or not weights:
            add_issue(issues, "error", "missing_weights", f"{ticker} has no geography weights")
    fallback_count = sum(count for status, count in status_counts.items() if status != "ok")
    if fallback_count:
        add_issue(issues, "warning", "geography_fallback", f"{fallback_count} instrument(s) use fallback geography")
    return {"recordCount": len(instruments), "statusCounts": dict(sorted(status_counts.items()))}


def validate_simple_arrays(
    dataset_id: str,
    payload: dict[str, Any],
    issues: list[dict[str, str]],
) -> dict[str, Any]:
    if dataset_id == "equity-valuation":
        rows = payload.get("items")
        if not isinstance(rows, list) or not rows:
            add_issue(issues, "error", "invalid_items", "items must be a non-empty array")
            return {"recordCount": 0}
        return {"recordCount": len(rows)}
    if dataset_id == "equity-valuation-history":
        rows = payload.get("series")
        if not isinstance(rows, list) or not rows:
            add_issue(issues, "error", "invalid_series", "series must be a non-empty array")
            return {"recordCount": 0}
        return {"recordCount": len(rows)}
    if dataset_id == "mag7-valuation":
        rows = payload.get("companies")
        if not isinstance(rows, list) or len(rows) != 7:
            add_issue(issues, "error", "invalid_company_count", "companies must contain exactly 7 rows")
            return {"recordCount": len(rows) if isinstance(rows, list) else 0}
        duplicates = duplicate_values(rows, "ticker")
        if duplicates:
            add_issue(issues, "error", "duplicate_ticker", f"Duplicate tickers: {', '.join(duplicates)}")
        return {"recordCount": len(rows)}
    if dataset_id == "sp500-pe-history":
        monthly = payload.get("monthly")
        year_end = payload.get("yearEnd")
        if not isinstance(monthly, list) or not monthly:
            add_issue(issues, "error", "invalid_monthly", "monthly must be a non-empty array")
            monthly = []
        if not isinstance(year_end, list) or not year_end:
            add_issue(issues, "error", "invalid_year_end", "yearEnd must be a non-empty array")
            year_end = []
        duplicates = duplicate_values(monthly, "date")
        if duplicates:
            add_issue(issues, "error", "duplicate_date", f"Duplicate monthly dates: {', '.join(duplicates[:5])}")
        return {"recordCount": len(monthly), "yearEndCount": len(year_end)}
    return {}


def build_manifest() -> tuple[dict[str, Any], int]:
    loaded: dict[str, dict[str, Any]] = {}
    load_errors: dict[str, str] = {}
    for spec in DATASET_SPECS:
        path = ROOT / spec["path"]
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("top-level JSON value must be an object")
            loaded[spec["id"]] = payload
        except Exception as exc:
            load_errors[spec["id"]] = str(exc)

    universe = loaded.get("etf-universe", {})
    entries: list[dict[str, Any]] = []
    newest_timestamp: datetime | None = None
    error_count = 0

    for spec in DATASET_SPECS:
        dataset_id = spec["id"]
        path = ROOT / spec["path"]
        issues: list[dict[str, str]] = []
        payload = loaded.get(dataset_id)
        metrics: dict[str, Any] = {}

        if payload is None:
            add_issue(issues, "error", "unreadable_json", load_errors.get(dataset_id, "File could not be read"))
            as_of = None
            timestamp = None
            digest = None
        else:
            require_keys(payload, spec["required"], issues)
            as_of = payload_as_of(payload, dataset_id)
            timestamp = payload_timestamp(payload, as_of)
            digest = file_sha256(path)

            if as_of is not None and parse_datetime(as_of) is None:
                add_issue(issues, "error", "invalid_as_of", f"Invalid asOf date: {as_of}")

            if dataset_id == "curve-us":
                metrics = validate_curve(payload, issues)
            elif dataset_id == "etf-universe":
                metrics = validate_etf_universe(payload, issues)
            elif dataset_id == "etf-performance":
                metrics = validate_performance(payload, issues, universe, fixed_only=False)
            elif dataset_id == "fixed-income-performance":
                metrics = validate_performance(payload, issues, universe, fixed_only=True)
            elif dataset_id == "etf-geography":
                metrics = validate_geography(payload, issues)
            else:
                metrics = validate_simple_arrays(dataset_id, payload, issues)

            max_age = spec["maxAgeDays"]
            if max_age is not None and as_of is not None:
                parsed_as_of = parse_datetime(as_of)
                if parsed_as_of is not None:
                    age_days = (datetime.now(timezone.utc).date() - parsed_as_of.date()).days
                    if age_days > max_age:
                        add_issue(
                            issues,
                            "warning",
                            "stale_dataset",
                            f"Dataset asOf={as_of} exceeds maxAgeDays={max_age}",
                        )

            if timestamp is not None and (newest_timestamp is None or timestamp > newest_timestamp):
                newest_timestamp = timestamp

        has_error = any(item["severity"] == "error" for item in issues)
        has_partial = any(
            item["code"] in {"instrument_errors", "stale_instruments", "geography_fallback"}
            for item in issues
        )
        has_stale = any(item["code"] == "stale_dataset" for item in issues)
        if has_error:
            status = "error"
            error_count += 1
        elif has_partial:
            status = "partial"
        elif has_stale:
            status = "stale"
        elif spec["kind"] == "manual":
            status = "manual"
        else:
            status = "ok"

        entry = {
            "id": dataset_id,
            "path": spec["path"],
            "kind": spec["kind"],
            "status": status,
            "asOf": as_of,
            "maxAgeDays": spec["maxAgeDays"],
            "consumer": spec["consumer"],
            "producer": spec["producer"],
            "workflow": spec["workflow"],
            "sha256": digest,
            **metrics,
            "issues": issues,
        }
        entries.append(entry)

    status_counts = Counter(entry["status"] for entry in entries)
    manifest = {
        "schemaVersion": 1,
        "environment": "labs",
        "generatedAt": newest_timestamp.isoformat(timespec="seconds") if newest_timestamp else None,
        "summary": {
            "datasetCount": len(entries),
            "statusCounts": dict(sorted(status_counts.items())),
            "blockingErrorCount": error_count,
        },
        "datasets": entries,
    }
    return manifest, error_count


def serialized_manifest(manifest: dict[str, Any]) -> str:
    return json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"


def manifest_matches(path: Path, expected_manifest: dict[str, Any]) -> bool:
    if not path.exists():
        return False
    try:
        current_manifest = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return False
    return current_manifest == expected_manifest


def blocking_error_count(
    manifest: dict[str, Any],
    dataset_ids: set[str] | None = None,
) -> int:
    return sum(
        dataset["status"] == "error"
        for dataset in manifest["datasets"]
        if dataset_ids is None or dataset["id"] in dataset_ids
    )


def print_report(manifest: dict[str, Any]) -> None:
    for dataset in manifest["datasets"]:
        print(
            f"[{dataset['status'].upper():7}] {dataset['id']:<28} "
            f"asOf={dataset.get('asOf') or '-'}"
        )
        for issue in dataset["issues"]:
            print(f"  - {issue['severity'].upper()}: {issue['code']}: {issue['message']}")
    summary = manifest["summary"]
    print(
        "Summary: "
        f"datasets={summary['datasetCount']} "
        f"statuses={summary['statusCounts']} "
        f"blockingErrors={summary['blockingErrorCount']}"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate dashboard datasets and maintain data/manifest.json")
    parser.add_argument("--write-manifest", action="store_true", help="Write the normalized manifest after validation")
    parser.add_argument("--check-manifest", action="store_true", help="Fail when data/manifest.json is missing or outdated")
    parser.add_argument("--strict-freshness", action="store_true", help="Treat stale datasets as blocking")
    parser.add_argument(
        "--fail-on",
        action="append",
        choices=[spec["id"] for spec in DATASET_SPECS],
        help=(
            "Restrict blocking validation errors to this dataset. "
            "Repeat for workflows that produce more than one dataset."
        ),
    )
    args = parser.parse_args()

    manifest, _ = build_manifest()
    print_report(manifest)
    expected = serialized_manifest(manifest)
    scoped_ids = set(args.fail_on) if args.fail_on else None
    error_count = blocking_error_count(manifest, scoped_ids)

    if args.write_manifest:
        MANIFEST_PATH.write_text(expected, encoding="utf-8")
        print(f"Wrote {MANIFEST_PATH.relative_to(ROOT)}")

    if args.check_manifest:
        if not manifest_matches(MANIFEST_PATH, manifest):
            print("ERROR: data/manifest.json is missing or outdated", file=sys.stderr)
            error_count += 1

    if args.strict_freshness:
        stale_count = sum(
            dataset["status"] == "stale"
            for dataset in manifest["datasets"]
            if scoped_ids is None or dataset["id"] in scoped_ids
        )
        error_count += stale_count

    return 1 if error_count else 0


if __name__ == "__main__":
    raise SystemExit(main())
