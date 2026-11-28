#!/usr/bin/env python3
"""Download genuine Cameroon GCE Board exam papers, sample papers, syllabuses,
and Chief Examiners' subject reports into documents/gce-board-papers/.
Explicitly filters out administrative rosters, results lists, and communiques.
"""
from __future__ import annotations

import hashlib
import json
import re
import ssl
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Dict, List, Set

REPO_ROOT = Path(__file__).resolve().parents[3]
OUTPUT_DIR = REPO_ROOT / "documents" / "gce-board-papers"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) S-Learn-Educational-Archiver/1.0",
    "Accept": "application/json,application/pdf,*/*;q=0.8",
}

EXCLUDE_TERMS = (
    "results",
    "result",
    "-ar-",
    "roster",
    "registration",
    "communique",
    "press",
    "notice",
    "accommodation",
    "centre",
    "centers",
    "circular",
    "fees",
    "form",
)

SEARCH_ENDPOINTS = [
    "https://camgceb.org/wp-json/wp/v2/media?mime_type=application/pdf&search=sample&per_page=30",
    "https://camgceb.org/wp-json/wp/v2/media?mime_type=application/pdf&search=question&per_page=30",
    "https://camgceb.org/wp-json/wp/v2/media?mime_type=application/pdf&search=paper&per_page=30",
    "https://camgceb.org/wp-json/wp/v2/media?mime_type=application/pdf&search=syllabus&per_page=30",
    "https://camgceb.org/wp-json/wp/v2/media?mime_type=application/pdf&search=report&per_page=30",
    "https://kamerpower.com/wp-json/wp/v2/media?mime_type=application/pdf&search=gce&per_page=40",
    "https://kamerpower.com/wp-json/wp/v2/media?mime_type=application/pdf&search=chemistry&per_page=20",
    "https://kamerpower.com/wp-json/wp/v2/media?mime_type=application/pdf&search=mathematics&per_page=20",
    "https://kamerpower.com/wp-json/wp/v2/media?mime_type=application/pdf&search=physics&per_page=20",
    "https://kamerpower.com/wp-json/wp/v2/media?mime_type=application/pdf&search=economics&per_page=20",
    "https://kamerpower.com/wp-json/wp/v2/media?mime_type=application/pdf&search=accounting&per_page=20",
    "https://kamerpower.com/wp-json/wp/v2/media?mime_type=application/pdf&search=biology&per_page=20",
    "https://kamerpower.com/wp-json/wp/v2/media?mime_type=application/pdf&search=history&per_page=20",
]

MAX_NEW_DOWNLOADS = 20


def fetch_url(url: str, timeout: int = 25) -> tuple[int, str, bytes]:
    req = urllib.request.Request(url, headers=HEADERS)
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        return resp.status, resp.headers.get("Content-Type", ""), resp.read()


def sanitize_filename(url: str) -> str:
    name = urllib.parse.unquote(Path(urllib.parse.urlparse(url).path).name)
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip("_")
    if not name.lower().endswith(".pdf"):
        name += ".pdf"
    return name[:120]


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    existing_hashes: Set[str] = set()
    for existing in (REPO_ROOT / "documents").rglob("*.pdf"):
        try:
            existing_hashes.add(hashlib.sha256(existing.read_bytes()).hexdigest())
        except Exception:
            pass

    candidates: List[str] = []
    for api_url in SEARCH_ENDPOINTS:
        try:
            status, ctype, body = fetch_url(api_url, timeout=20)
            if status != 200 or "json" not in ctype.lower():
                continue
            items = json.loads(body.decode("utf-8", errors="ignore"))
            if not isinstance(items, list):
                continue
            for item in items:
                src = str(item.get("source_url") or "")
                low = src.lower()
                if not low.endswith(".pdf"):
                    continue
                if any(ex in low for ex in EXCLUDE_TERMS):
                    continue
                if src not in candidates:
                    candidates.append(src)
        except Exception as err:
            print(f"[skip] {api_url}: {err}")

    saved: List[Dict[str, str]] = []
    for pdf_url in candidates:
        if len(saved) >= MAX_NEW_DOWNLOADS:
            break
        try:
            status, _ctype, data = fetch_url(pdf_url, timeout=30)
            if status != 200 or len(data) < 12_000 or not data[:5].startswith(b"%PDF-"):
                continue
            digest = hashlib.sha256(data).hexdigest()
            if digest in existing_hashes:
                continue
            existing_hashes.add(digest)
            fname = sanitize_filename(pdf_url)
            out_file = OUTPUT_DIR / fname
            if out_file.exists():
                out_file = OUTPUT_DIR / f"{digest[:6]}_{fname}"
            out_file.write_bytes(data)
            saved.append(
                {
                    "file": str(out_file.relative_to(REPO_ROOT)),
                    "size_kb": str(round(len(data) / 1024, 1)),
                    "source_url": pdf_url,
                }
            )
            print(f"[saved] {out_file.name} ({round(len(data) / 1024, 1)} KB)")
        except Exception as err:
            print(f"[failed] {pdf_url}: {err}")

    print(
        json.dumps(
            {
                "candidates_found": len(candidates),
                "new_pdfs_saved": len(saved),
                "files": saved,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
