#!/usr/bin/env python3
"""Fetch open-licensed academic exam datasets across ALL Cameroon GCE Board streams:
Science, Arts, and Commercial (O-Level & A-Level) via Hugging Face Datasets Server.

Saves a normalized, deduplicated corpus to backend/ml_datasets/open_exam_datasets.json.
"""
from __future__ import annotations

import hashlib
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, List

HF_ROWS_API = "https://datasets-server.huggingface.co/rows"

# (mmlu_config, canonical_gce_subject, stream, level, max_rows)
MMLU_CONFIGS = [
    # ── COMMERCIAL ──
    ("professional_accounting", "Accounting", "Commercial", "A-Level", 280),
    ("high_school_macroeconomics", "Economics", "Commercial", "A-Level", 200),
    ("high_school_microeconomics", "Economics", "Commercial", "O-Level", 200),
    ("marketing", "Commerce", "Commercial", "O-Level", 160),
    ("management", "Commerce", "Commercial", "A-Level", 100),
    ("business_ethics", "Commerce", "Commercial", "O-Level", 100),
    # ── SCIENCE ──
    ("high_school_chemistry", "Chemistry", "Science", "O-Level", 200),
    ("high_school_physics", "Physics", "Science", "O-Level", 150),
    ("high_school_biology", "Biology", "Science", "O-Level", 300),
    ("anatomy", "Human Biology", "Science", "O-Level", 135),
    ("nutrition", "Food and Nutrition", "Science", "O-Level", 160),
    ("high_school_mathematics", "Mathematics", "Science", "O-Level", 270),
    ("college_mathematics", "Pure Mathematics with Mechanics", "Science", "A-Level", 100),
    ("high_school_statistics", "Pure Mathematics with Statistics", "Science", "A-Level", 200),
    ("abstract_algebra", "Further Mathematics", "Science", "A-Level", 100),
    ("high_school_computer_science", "Computer Science", "Science", "A-Level", 100),
    ("computer_security", "Information and Communication Technology (ICT)", "Science", "A-Level", 100),
    ("high_school_geography", "Geography", "Science", "O-Level", 190),
    ("astronomy", "Geology", "Science", "O-Level", 150),
    # ── ARTS & HUMANITIES ──
    ("high_school_world_history", "History", "Arts", "O-Level", 200),
    ("high_school_european_history", "History", "Arts", "A-Level", 165),
    ("philosophy", "Philosophy", "Arts", "A-Level", 200),
    ("formal_logic", "Logic", "Arts", "O-Level", 125),
    ("logical_fallacies", "Logic", "Arts", "O-Level", 125),
    ("world_religions", "Religious Studies", "Arts", "O-Level", 170),
    ("high_school_government_and_politics", "Citizenship Education", "Arts", "O-Level", 190),
    ("sociology", "Literature in English", "Arts", "A-Level", 150),
]

SCIQ_KEYWORDS = {
    "Chemistry": [
        "atom", "molecule", "chemical", "acid", "base", "ph ", "ion", "electron",
        "proton", "neutron", "element", "compound", "periodic", "reaction", "mole",
        "isotope", "covalent", "ionic", "alkane", "polymer", "catalyst", "oxide",
    ],
    "Physics": [
        "force", "velocity", "acceleration", "energy", "momentum", "gravity", "wave",
        "frequency", "wavelength", "electric", "current", "voltage", "resistor",
        "magnet", "optic", "lens", "newton", "joule", "watt", "thermodynamic", "motion",
    ],
    "Biology": [
        "cell", "dna", "rna", "gene", "protein", "enzyme", "photosynthesis", "mitosis",
        "meiosis", "organ", "tissue", "bacteria", "virus", "ecosystem", "species",
        "evolution", "blood", "heart", "plant", "animal", "chromosome", "osmosis",
    ],
    "Geology": [
        "earthquake", "volcano", "tectonic", "mineral", "sedimentary", "igneous",
        "metamorphic", "crust", "mantle", "fossil", "rock", "magma", "plate", "fault",
    ],
    "Geography": [
        "climate", "weather", "erosion", "glacier", "atmosphere", "ocean", "river",
        "delta", "monsoon", "latitude", "longitude", "biome", "precipitation",
    ],
}


def fetch_hf_rows(dataset: str, config: str, split: str, max_rows: int) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    offset = 0
    page_size = 100

    while offset < max_rows:
        length = min(page_size, max_rows - offset)
        params = urllib.parse.urlencode(
            {
                "dataset": dataset,
                "config": config,
                "split": split,
                "offset": offset,
                "length": length,
            }
        )
        url = f"{HF_ROWS_API}?{params}"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "S-Learn-GCE-ML-Builder/2.0"},
        )
        payload = None
        for attempt in range(4):
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    payload = json.loads(resp.read().decode("utf-8"))
                break
            except Exception as err:
                if attempt == 3:
                    print(f"  [warn] {dataset}/{config} offset={offset} failed after retries: {err}")
                else:
                    time.sleep(0.8 * (attempt + 1))

        if payload is None:
            break

        batch = payload.get("rows") or []
        if not batch:
            break
        rows.extend(item.get("row", {}) for item in batch if isinstance(item, dict))
        if len(batch) < length:
            break
        offset += len(batch)
        time.sleep(0.45)

    return rows


def infer_sciq_subject(question: str, support: str) -> str:
    text = f" {question} {support} ".lower()
    scores = {
        subject: sum(1 for kw in kws if kw in text)
        for subject, kws in SCIQ_KEYWORDS.items()
    }
    best_subject, best_score = max(scores.items(), key=lambda kv: kv[1])
    return best_subject if best_score > 0 else "Biology"


def clean_str(val: Any) -> str:
    return re.sub(r"\s+", " ", str(val or "")).strip()


def build_datasets(output_path: Path) -> Dict[str, Any]:
    records: List[Dict[str, Any]] = []
    seen_hashes: set[str] = set()
    dataset_counts: Dict[str, int] = {}

    if output_path.exists():
        try:
            existing = json.loads(output_path.read_text(encoding="utf-8"))
            for item in existing.get("questions", []):
                q = clean_str(item.get("question_text"))
                subj = clean_str(item.get("subject"))
                if q and subj:
                    digest = hashlib.sha256(f"{subj.lower()}::{q.lower()}".encode("utf-8")).hexdigest()[:16]
                    if digest not in seen_hashes:
                        seen_hashes.add(digest)
                        records.append(item)
            dataset_counts.update(existing.get("sources") or {})
        except Exception:
            pass

    def add_record(rec: Dict[str, Any]) -> None:
        q = clean_str(rec.get("question_text"))
        opts = [clean_str(o) for o in (rec.get("options") or []) if clean_str(o)]
        ans = clean_str(rec.get("answer"))
        if len(q) < 12 or len(opts) < 2 or ans not in opts:
            return
        digest = hashlib.sha256(f"{rec['subject'].lower()}::{q.lower()}".encode("utf-8")).hexdigest()[:16]
        if digest in seen_hashes:
            return
        seen_hashes.add(digest)
        rec["id"] = f"ds-{digest}"
        rec["question_text"] = q
        rec["options"] = opts[:4]
        rec["answer"] = ans
        rec["explanation"] = clean_str(rec.get("explanation"))
        records.append(rec)

    # 1. Fetch MMLU across Science, Arts, and Commercial GCE subjects (skip already fetched configs)
    for config, subject, stream, level, limit in MMLU_CONFIGS:
        source_key = f"cais/mmlu:{config}"
        if dataset_counts.get(source_key, 0) > 0:
            print(f"Skipping already fetched {source_key} ({dataset_counts[source_key]} questions)")
            continue
        print(f"Fetching {source_key} -> {subject} [{stream}]...")
        rows = fetch_hf_rows("cais/mmlu", config, "test", limit)
        added_before = len(records)
        for row in rows:
            choices = row.get("choices") or []
            ans_idx = row.get("answer")
            if not isinstance(choices, list) or not isinstance(ans_idx, int):
                continue
            if not (0 <= ans_idx < len(choices)):
                continue
            add_record(
                {
                    "subject": subject,
                    "stream": stream,
                    "level": level,
                    "topic": config.replace("high_school_", "").replace("professional_", "").replace("_", " ").title(),
                    "question_text": row.get("question", ""),
                    "options": choices,
                    "answer": choices[ans_idx],
                    "explanation": "",
                    "source": source_key,
                }
            )
        count_added = len(records) - added_before
        dataset_counts[source_key] = dataset_counts.get(source_key, 0) + count_added
        print(f"  + {count_added} new questions")

    # 2. Fetch RACE (High School English reading comprehension & language)
    if dataset_counts.get("ehovy/race:high", 0) == 0:
        print("Fetching ehovy/race (high) -> English Language [Arts]...")
        race_rows = fetch_hf_rows("ehovy/race", "high", "test", 220)
        added_before = len(records)
        letter_map = {"A": 0, "B": 1, "C": 2, "D": 3}
        for row in race_rows:
            q_raw = clean_str(row.get("question"))
            article = clean_str(row.get("article"))
            opts = row.get("options") or []
            ans_letter = clean_str(row.get("answer")).upper()
            if ans_letter not in letter_map or len(opts) < 4:
                continue
            ans_idx = letter_map[ans_letter]
            excerpt = article[:320] + ("..." if len(article) > 320 else "")
            full_q = f"Passage excerpt: \"{excerpt}\" — {q_raw}" if excerpt else q_raw
            add_record(
                {
                    "subject": "English Language",
                    "stream": "Arts",
                    "level": "O-Level",
                    "topic": "Comprehension and Directed Reading",
                    "question_text": full_q,
                    "options": opts,
                    "answer": opts[ans_idx],
                    "explanation": "Evaluate context clues, tone, and factual evidence in the passage.",
                    "source": "ehovy/race:high",
                }
            )
        race_added = len(records) - added_before
        dataset_counts["ehovy/race:high"] = dataset_counts.get("ehovy/race:high", 0) + race_added
        print(f"  + {race_added} English Language questions")

    # 3. Fetch SciQ (skip if already populated)
    if dataset_counts.get("allenai/sciq", 0) < 500:
        print("Fetching allenai/sciq (validation + test)...")
        sciq_rows = fetch_hf_rows("allenai/sciq", "default", "validation", 600)
        sciq_rows += fetch_hf_rows("allenai/sciq", "default", "test", 400)
        added_before = len(records)
        for row in sciq_rows:
            correct = clean_str(row.get("correct_answer"))
            distractors = [
                clean_str(row.get("distractor1")),
                clean_str(row.get("distractor2")),
                clean_str(row.get("distractor3")),
            ]
            options = [correct] + [d for d in distractors if d and d != correct]
            if len(options) < 4:
                continue
            q_text = clean_str(row.get("question"))
            support = clean_str(row.get("support"))
            subject = infer_sciq_subject(q_text, support)
            add_record(
                {
                    "subject": subject,
                    "stream": "Science",
                    "level": "O-Level",
                    "topic": subject,
                    "question_text": q_text,
                    "options": options[:4],
                    "answer": correct,
                    "explanation": support[:420],
                    "source": "allenai/sciq",
                }
            )
        sciq_added = len(records) - added_before
        dataset_counts["allenai/sciq"] = dataset_counts.get("allenai/sciq", 0) + sciq_added
        print(f"  + {sciq_added} SciQ questions")

    # Ensure every record has an accurate stream label
    stream_lookup = {subj: st for _, subj, st, _, _ in MMLU_CONFIGS}
    stream_lookup["English Language"] = "Arts"
    stream_lookup["Pure Mathematics"] = "Science"
    for r in records:
        if not r.get("stream"):
            r["stream"] = stream_lookup.get(r["subject"], "Science")

    per_subject: Dict[str, int] = {}
    per_stream: Dict[str, int] = {}
    for r in records:
        per_subject[r["subject"]] = per_subject.get(r["subject"], 0) + 1
        stream = r.get("stream") or "Science"
        per_stream[stream] = per_stream.get(stream, 0) + 1

    output_path.parent.mkdir(parents=True, exist_ok=True)
    bundle = {
        "schema_version": 2,
        "total_questions": len(records),
        "per_stream": dict(sorted(per_stream.items())),
        "per_subject": dict(sorted(per_subject.items())),
        "sources": dataset_counts,
        "questions": records,
    }
    output_path.write_text(json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8")
    return bundle


if __name__ == "__main__":
    out = Path(__file__).resolve().parents[1] / "ml_datasets" / "open_exam_datasets.json"
    summary = build_datasets(out)
    print(
        json.dumps(
            {
                "output": str(out),
                "total_questions": summary["total_questions"],
                "per_stream": summary["per_stream"],
                "per_subject": summary["per_subject"],
            },
            indent=2,
        )
    )
