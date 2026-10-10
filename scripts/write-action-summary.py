from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "manifest.json"

DATASET_NAMES = {
    "curve-us": "Curva de juros dos EUA",
    "fed-policy": "Política monetária do Fed",
    "equity-valuation": "Valuation de ações",
    "equity-valuation-history": "Histórico de valuation",
    "sp500-valuation": "Valuation do S&P 500",
    "sp500-pe-history": "Histórico de P/L do S&P 500",
    "mag7-valuation": "Valuation das Magnificent 7",
    "etf-universe": "Cadastro de ETFs",
    "etf-performance": "Desempenho de ETFs",
    "fixed-income-performance": "Contingência de renda fixa",
    "etf-geography": "Composição geográfica dos ETFs",
}

STATUS_LABELS = {
    "ok": "Atual",
    "stale": "Defasado",
    "partial": "Parcial",
    "error": "Erro",
    "manual": "Atualização manual",
}

ISSUE_LABELS = {
    "stale_dataset": "A data de referência ultrapassou o limite de atualização definido.",
    "instrument_errors": "Um ou mais instrumentos falharam na tentativa de atualização.",
    "stale_instruments": "Um ou mais instrumentos mantiveram o último dado válido.",
    "stale_benchmarks": "Um ou mais instrumentos mantiveram a última série válida do benchmark.",
    "benchmark_errors": "Um ou mais instrumentos estão sem série de benchmark disponível.",
    "geography_fallback": "Um ou mais ETFs mantiveram a última composição geográfica válida.",
    "unreadable_json": "O arquivo não pôde ser lido como JSON.",
    "missing_key": "O arquivo não contém todos os campos obrigatórios.",
    "invalid_as_of": "A data de referência é inválida.",
    "invalid_instruments": "A lista de instrumentos está ausente ou inválida.",
    "missing_weights": "Um ETF está sem pesos geográficos válidos.",
}


def build_summary(manifest: dict[str, Any]) -> str:
    datasets = manifest.get("datasets", [])
    lines = [
        "## Diagnóstico dos dados",
        "",
        "Este relatório é operacional e aparece somente no GitHub Actions; não é exibido no site.",
        "",
        "| Base | Situação | Data de referência |",
        "|---|---|---|",
    ]
    for item in datasets:
        dataset_id = str(item.get("id", "desconhecido"))
        lines.append(
            f"| {DATASET_NAMES.get(dataset_id, dataset_id)} | "
            f"{STATUS_LABELS.get(str(item.get('status')), str(item.get('status', 'n/d')))} | "
            f"{item.get('asOf') or 'não se aplica'} |"
        )

    issues = [
        (str(item.get("id", "desconhecido")), issue)
        for item in datasets
        for issue in item.get("issues", [])
    ]
    lines.extend(["", "### Pontos de atenção", ""])
    if not issues:
        lines.append("Nenhum ponto de atenção registrado.")
    else:
        for dataset_id, issue in issues:
            code = str(issue.get("code", "unknown"))
            severity = "Erro" if issue.get("severity") == "error" else "Aviso"
            description = ISSUE_LABELS.get(code, f"Ocorrência técnica registrada ({code}).")
            lines.append(f"- **{severity} — {DATASET_NAMES.get(dataset_id, dataset_id)}:** {description}")

    blocking = manifest.get("summary", {}).get("blockingErrorCount", 0)
    lines.extend(["", f"Erros estruturais bloqueadores: **{blocking}**.", ""])
    return "\n".join(lines)


def main() -> None:
    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        summary = build_summary(manifest)
    except Exception as exc:
        summary = (
            "## Diagnóstico dos dados\n\n"
            "Não foi possível ler o manifesto nesta execução. "
            f"Detalhe técnico: `{type(exc).__name__}`.\n"
        )

    target = os.environ.get("GITHUB_STEP_SUMMARY")
    if target:
        with Path(target).open("a", encoding="utf-8") as output:
            output.write(summary)
    else:
        print(summary)


if __name__ == "__main__":
    main()
