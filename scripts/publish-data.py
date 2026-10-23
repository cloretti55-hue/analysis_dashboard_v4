"""Commit generated datasets; rebuild the derived manifest after concurrent updates."""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


def run(*args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(args, check=check, text=True, capture_output=True,
                          env={**os.environ, "GIT_EDITOR": "true"})


def refresh_manifest(paths: list[str]) -> None:
    scope = [arg for path in paths for arg in ("--fail-on", Path(path).stem)]
    result = run(sys.executable, "scripts/validate-data.py", "--write-manifest", *scope)
    print(result.stdout)


def publish(message: str, paths: list[str], attempts: int = 3) -> None:
    if not paths or any(Path(p).parent != Path("data") or not p.endswith(".json")
                        or p == "data/manifest.json" for p in paths):
        raise ValueError("Specify generated data/*.json files; the manifest is rebuilt separately.")
    run("git", "config", "user.name", "github-actions[bot]")
    run("git", "config", "user.email", "github-actions[bot]@users.noreply.github.com")
    refresh_manifest(paths)
    run("git", "add", "--", *paths, "data/manifest.json")
    if run("git", "diff", "--cached", "--quiet", check=False).returncode == 0:
        print("No data changes to commit.")
        return
    run("git", "commit", "-m", message)
    for attempt in range(attempts):
        run("git", "fetch", "origin", "main")
        result = run("git", "rebase", "origin/main", check=False)
        if result.returncode:
            conflicts = run("git", "diff", "--name-only", "--diff-filter=U").stdout.splitlines()
            try:
                if conflicts != ["data/manifest.json"]:
                    raise RuntimeError("Concurrent change outside the derived manifest: " + ", ".join(conflicts))
                # All datasets already include the remote changes and this run's patch.
                # Only this derived file can be regenerated instead of choosing a side.
                refresh_manifest(paths)
                run("git", "add", "data/manifest.json")
                run("git", "rebase", "--continue")
            except Exception:
                run("git", "rebase", "--abort", check=False)
                raise
        # Recompute even after a clean rebase: the remote may have added another dataset.
        refresh_manifest(paths)
        run("git", "add", "data/manifest.json")
        if run("git", "diff", "--cached", "--quiet", check=False).returncode:
            if run("git", "rev-parse", "HEAD").stdout == run("git", "rev-parse", "origin/main").stdout:
                run("git", "commit", "-m", message)
            else:
                run("git", "commit", "--amend", "--no-edit")
        pushed = run("git", "push", "origin", "HEAD:main", check=False)
        if pushed.returncode == 0:
            print("Published datasets and regenerated manifest.")
            return
        if "[rejected]" not in pushed.stderr or not any(
            word in pushed.stderr for word in ("fetch first", "non-fast-forward")
        ):
            raise RuntimeError(pushed.stderr)
        print(f"Remote changed during publication; retry {attempt + 1}/{attempts}.")
    raise RuntimeError("Remote kept changing; publication stopped without forcing a push.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--message", required=True)
    parser.add_argument("paths", nargs="+")
    args = parser.parse_args()
    try:
        publish(args.message, args.paths)
    except subprocess.CalledProcessError as exc:
        print(exc.stdout, exc.stderr, file=sys.stderr)
        raise
