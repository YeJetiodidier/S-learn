from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import random
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import joblib
import numpy as np
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

DEFAULT_SUBJECTS = [
    "Accounting",
    "Commerce",
    "Economics",
    "Mathematics",
    "Additional Mathematics",
    "Pure Mathematics with Mechanics",
    "Pure Mathematics with Statistics",
    "Further Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Human Biology",
    "Food and Nutrition",
    "Food Science and Nutrition",
    "Geography",
    "Geology",
    "Computer Science",
    "Information and Communication Technology (ICT)",
    "English Language",
    "Literature in English",
    "French",
    "Special Bilingual Education French",
    "History",
    "Citizenship Education",
    "Religious Studies",
    "Logic",
    "Philosophy",
]

SUBJECT_ALIASES = {
    "accounting (ohada)": "Accounting",
    "ohada accounting": "Accounting",
    "english": "English Language",
    "literature": "Literature in English",
    "pmaths": "Pure Mathematics with Mechanics",
    "pure math": "Pure Mathematics with Mechanics",
    "pure mathematics": "Pure Mathematics with Mechanics",
    "pure math mechanics": "Pure Mathematics with Mechanics",
    "pure math statistics": "Pure Mathematics with Statistics",
    "additional math": "Additional Mathematics",
    "additional mathematics": "Mathematics",
    "maths": "Mathematics",
    "math": "Mathematics",
    "cs": "Computer Science",
    "ict": "Information and Communication Technology (ICT)",
    "food science and nutrition": "Food and Nutrition",
    "citizenship": "Citizenship Education",
    "special bilingual education french": "French",
}

BACKEND_ROOT = Path(__file__).resolve().parent
DEFAULT_DOCUMENTS_DIR = BACKEND_ROOT.parents[1] / "documents"
DEFAULT_DATASETS_DIR = BACKEND_ROOT / "ml_datasets"
DEFAULT_MODEL_PATH = BACKEND_ROOT / "ml_models" / "slearn_exam_model.joblib"
DEFAULT_RUNTIME_MODEL_PATH = BACKEND_ROOT / "ml_models" / "slearn_exam_model_runtime.json.gz"
DEFAULT_METRICS_PATH = BACKEND_ROOT / "ml_models" / "model_metrics.json"


def canonical_subject(name: str) -> str:
    cleaned = re.sub(r"\s+", " ", str(name or "")).strip()
    if not cleaned:
        return "General"
    low = cleaned.lower()
    if low in SUBJECT_ALIASES:
        return SUBJECT_ALIASES[low]
    for subj in DEFAULT_SUBJECTS:
        if subj.lower() == low or subj.lower() in low:
            return subj
    return cleaned


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_text_from_pdf(pdf_path: Path) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(str(pdf_path))
        chunks = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(chunks)
    except Exception:
        return ""


def extract_text_from_docx(docx_path: Path) -> str:
    try:
        from docx import Document

        doc = Document(str(docx_path))
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception:
        return ""


def extract_text_from_txt(txt_path: Path) -> str:
    try:
        return txt_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def infer_subject(path: Path) -> str:
    haystack = f"{path.name.lower()} {path.parent.name.lower()}"
    if "pmath" in haystack or "pure math" in haystack:
        return "Pure Mathematics"
    for subject in DEFAULT_SUBJECTS:
        if subject.lower() in haystack:
            return subject
    for token, mapped in [
        ("math", "Mathematics"),
        ("physics", "Physics"),
        ("chem", "Chemistry"),
        ("bio", "Biology"),
        ("english", "English"),
        ("hist", "History"),
        ("geo", "Geography"),
        ("econ", "Economics"),
        ("computer", "Computer Science"),
        ("account", "Accounting"),
        ("agric", "Agriculture"),
    ]:
        if token in haystack:
            return mapped
    return "General"


def infer_year(path: Path) -> int:
    for candidate in (path.name, str(path.parent)):
        match = re.search(r"(19\d{2}|20\d{2})", candidate)
        if match:
            return int(match.group(1))
    return 0


def load_papers(folder: str | Path) -> List[Dict[str, Any]]:
    root = Path(folder)
    if not root.exists():
        return []

    papers: List[Dict[str, Any]] = []
    seen_hashes: set[str] = set()
    allowed = {".pdf", ".doc", ".docx", ".txt"}

    for file_path in sorted(root.rglob("*")):
        if not file_path.is_file() or file_path.suffix.lower() not in allowed:
            continue

        # Deduplicate identical PDFs across folders (e.g., documents/ vs documents/papers/)
        try:
            file_hash = hashlib.sha256(file_path.read_bytes()).hexdigest()
        except Exception:
            continue
        if file_hash in seen_hashes:
            continue
        seen_hashes.add(file_hash)

        suffix = file_path.suffix.lower()
        if suffix == ".pdf":
            text = extract_text_from_pdf(file_path)
        elif suffix in {".doc", ".docx"}:
            text = extract_text_from_docx(file_path)
        else:
            text = extract_text_from_txt(file_path)

        clean_text = normalize_text(text)
        if len(clean_text) < 200:
            continue

        papers.append(
            {
                "subject": infer_subject(file_path),
                "year": infer_year(file_path),
                "source": str(file_path),
                "file_name": file_path.name,
                "text": clean_text,
            }
        )

    return papers


def load_open_datasets(datasets_dir: str | Path) -> List[Dict[str, Any]]:
    root = Path(datasets_dir)
    if not root.exists():
        return []

    questions: List[Dict[str, Any]] = []
    seen: set[str] = set()
    for json_path in sorted(root.glob("*.json")):
        try:
            payload = json.loads(json_path.read_text(encoding="utf-8"))
        except Exception:
            continue
        raw_items = payload.get("questions", []) if isinstance(payload, dict) else payload
        if not isinstance(raw_items, list):
            continue

        for item in raw_items:
            if not isinstance(item, dict):
                continue
            q_text = str(item.get("question_text") or "").strip()
            options = [str(o).strip() for o in (item.get("options") or []) if str(o).strip()]
            answer = str(item.get("answer") or "").strip()
            subject = canonical_subject(item.get("subject") or "General")
            if not q_text or len(options) < 2 or answer not in options:
                continue
            key = f"{subject.lower()}::{q_text.lower()}"
            if key in seen:
                continue
            seen.add(key)
            questions.append(
                {
                    "id": item.get("id") or f"mlq-{len(questions) + 1}",
                    "subject": subject,
                    "level": str(item.get("level") or "O-Level"),
                    "topic": str(item.get("topic") or subject),
                    "question_text": q_text,
                    "options": options[:4],
                    "answer": answer,
                    "explanation": str(item.get("explanation") or ""),
                    "source": str(item.get("source") or json_path.name),
                }
            )

    return questions


def train_and_save_model(
    papers_folder: str | Path = DEFAULT_DOCUMENTS_DIR,
    datasets_dir: str | Path = DEFAULT_DATASETS_DIR,
    model_path: str | Path = DEFAULT_MODEL_PATH,
    metrics_path: str | Path = DEFAULT_METRICS_PATH,
) -> Dict[str, Any]:
    papers = load_papers(papers_folder)
    dataset_questions = load_open_datasets(datasets_dir)

    if not papers and not dataset_questions:
        raise ValueError("No local past papers or online exam datasets found to train the model.")

    # 1. Past-Paper TF-IDF + KMeans topic pattern discovery
    paper_vectorizer = None
    paper_kmeans = None
    cluster_keywords: Dict[int, List[str]] = {}
    subject_paper_keywords: Dict[str, List[str]] = defaultdict(list)
    subject_years: Dict[str, List[int]] = defaultdict(list)

    if len(papers) >= 2:
        paper_texts = [p["text"] for p in papers]
        min_df = 2 if len(paper_texts) >= 4 else 1
        paper_vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            min_df=min_df,
            max_df=0.92,
            max_features=8000,
            strip_accents="unicode",
            lowercase=True,
        )
        p_matrix = paper_vectorizer.fit_transform(paper_texts)
        n_clusters = min(6, max(2, len(paper_texts) // 3))
        paper_kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=20)
        clusters = paper_kmeans.fit_predict(p_matrix)

        feature_names = np.asarray(paper_vectorizer.get_feature_names_out())
        for cid in sorted(set(int(c) for c in clusters)):
            idxs = np.where(clusters == cid)[0]
            centroid = p_matrix[idxs].mean(axis=0)
            top_idx = np.argsort(np.asarray(centroid).ravel())[::-1][:12]
            cluster_keywords[cid] = [str(feature_names[i]) for i in top_idx if feature_names[i]]

        for paper, cid in zip(papers, clusters):
            paper["cluster"] = int(cid)
            subj = paper["subject"]
            if paper["year"] > 0:
                subject_years[subj].append(paper["year"])
            subject_paper_keywords[subj].extend(cluster_keywords.get(int(cid), []))

        for subj, kws in list(subject_paper_keywords.items()):
            subject_paper_keywords[subj] = list(dict.fromkeys(kws))[:16]

    # 2. Supervised Subject Classifier (TF-IDF + LinearSVC) with stratified hold-out validation
    classifier: Optional[Pipeline] = None
    eval_metrics: Dict[str, Any] = {}

    if len(dataset_questions) >= 20:
        X = [
            f"{q['question_text']} {' '.join(q['options'])} {q['explanation']}"
            for q in dataset_questions
        ]
        y = [q["subject"] for q in dataset_questions]
        class_counts = Counter(y)
        valid_classes = {c for c, n in class_counts.items() if n >= 5}

        X_valid = [text for text, label in zip(X, y) if label in valid_classes]
        y_valid = [label for label in y if label in valid_classes]

        if len(valid_classes) >= 2 and len(X_valid) >= 20:
            X_train, X_test, y_train, y_test = train_test_split(
                X_valid,
                y_valid,
                test_size=0.2,
                random_state=42,
                stratify=y_valid,
            )
            eval_pipe = Pipeline(
                [
                    (
                        "tfidf",
                        TfidfVectorizer(
                            stop_words="english",
                            ngram_range=(1, 2),
                            sublinear_tf=True,
                            max_features=25000,
                        ),
                    ),
                    ("clf", LinearSVC(class_weight="balanced", random_state=42)),
                ]
            )
            eval_pipe.fit(X_train, y_train)
            y_pred = eval_pipe.predict(X_test)

            report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
            eval_metrics = {
                "train_samples": len(X_train),
                "test_samples": len(X_test),
                "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
                "macro_f1": round(float(f1_score(y_test, y_pred, average="macro", zero_division=0)), 4),
                "weighted_f1": round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
                "per_subject_f1": {
                    label: round(float(report[label]["f1-score"]), 4)
                    for label in sorted(valid_classes)
                    if label in report
                },
            }

            # Refit final classifier on 100% of verified data for production inference
            classifier = Pipeline(
                [
                    (
                        "tfidf",
                        TfidfVectorizer(
                            stop_words="english",
                            ngram_range=(1, 2),
                            sublinear_tf=True,
                            max_features=25000,
                        ),
                    ),
                    ("clf", LinearSVC(class_weight="balanced", random_state=42)),
                ]
            )
            classifier.fit(X_valid, y_valid)

    # 3. TF-IDF Question Retrieval Index over all verified MCQs
    retrieval_vectorizer = None
    retrieval_matrix = None
    if dataset_questions:
        corpus_docs = [
            f"{q['subject']} {q['topic']} {q['question_text']} {' '.join(q['options'])} {q['explanation']}"
            for q in dataset_questions
        ]
        retrieval_vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True,
            max_features=30000,
        )
        retrieval_matrix = retrieval_vectorizer.fit_transform(corpus_docs)

    subject_counts = Counter(q["subject"] for q in dataset_questions)
    trained_at = datetime.now(timezone.utc).isoformat()

    artifact = {
        "schema_version": 2,
        "trained_at": trained_at,
        "local_papers_count": len(papers),
        "local_paper_files": [p["file_name"] for p in papers],
        "local_paper_subjects": dict(Counter(p["subject"] for p in papers)),
        "subject_years": {k: [min(v), max(v)] for k, v in subject_years.items() if v},
        "subject_paper_keywords": dict(subject_paper_keywords),
        "cluster_keywords": cluster_keywords,
        "paper_vectorizer": paper_vectorizer,
        "paper_kmeans": paper_kmeans,
        "subject_classifier": classifier,
        "classifier_metrics": eval_metrics,
        "retrieval_vectorizer": retrieval_vectorizer,
        "retrieval_matrix": retrieval_matrix,
        "question_bank": dataset_questions,
        "dataset_subject_counts": dict(sorted(subject_counts.items())),
    }

    model_file = Path(model_path)
    model_file.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, model_file, compress=3)

    runtime_file = export_runtime_model(artifact, DEFAULT_RUNTIME_MODEL_PATH)

    metrics_summary = {
        "schema_version": 2,
        "trained_at": trained_at,
        "model_file": str(model_file),
        "model_size_mb": round(model_file.stat().st_size / (1024 * 1024), 2),
        "runtime_model_file": str(runtime_file),
        "runtime_model_size_mb": round(runtime_file.stat().st_size / (1024 * 1024), 2),
        "local_papers_indexed": len(papers),
        "local_paper_subjects": artifact["local_paper_subjects"],
        "online_questions_indexed": len(dataset_questions),
        "dataset_subject_counts": artifact["dataset_subject_counts"],
        "subject_years": artifact["subject_years"],
        "classifier_evaluation": eval_metrics,
    }
    metrics_file = Path(metrics_path)
    metrics_file.parent.mkdir(parents=True, exist_ok=True)
    metrics_file.write_text(json.dumps(metrics_summary, indent=2), encoding="utf-8")

    return metrics_summary


def export_runtime_model(
    artifact: Dict[str, Any],
    runtime_path: str | Path = DEFAULT_RUNTIME_MODEL_PATH,
) -> Path:
    """Export trained scikit-learn LinearSVC + TF-IDF retrieval weights to a portable
    gzipped JSON artifact that executes natively in Node.js (e.g. Vercel serverless)
    with zero Python runtime dependency.
    """
    clf_payload: Optional[Dict[str, Any]] = None
    classifier = artifact.get("subject_classifier")
    if classifier is not None:
        vec = classifier.named_steps["tfidf"]
        svc = classifier.named_steps["clf"]
        vocab = {str(term): int(idx) for term, idx in vec.vocabulary_.items()}
        idf = [round(float(v), 4) for v in vec.idf_]
        classes = [str(c) for c in svc.classes_]
        intercept = [round(float(b), 4) for b in svc.intercept_]

        # Store sparse significant weights per class (|w| >= 0.02) to keep runtime compact & fast
        sparse_coefs: List[List[Any]] = []
        coef_matrix = svc.coef_
        for row_idx in range(coef_matrix.shape[0]):
            row = coef_matrix[row_idx]
            entries = [
                [int(col_idx), round(float(val), 4)]
                for col_idx, val in enumerate(row)
                if abs(float(val)) >= 0.02
            ]
            sparse_coefs.append(entries)

        clf_payload = {
            "vocab": vocab,
            "idf": idf,
            "classes": classes,
            "intercept": intercept,
            "sparse_coefs": sparse_coefs,
        }

    ret_payload: Optional[Dict[str, Any]] = None
    ret_vec = artifact.get("retrieval_vectorizer")
    ret_mat = artifact.get("retrieval_matrix")
    if ret_vec is not None and ret_mat is not None:
        ret_vocab = {str(term): int(idx) for term, idx in ret_vec.vocabulary_.items()}
        ret_idf = [round(float(v), 4) for v in ret_vec.idf_]
        doc_vectors: List[List[Any]] = []
        csr = ret_mat.tocsr()
        for row_idx in range(csr.shape[0]):
            start, end = csr.indptr[row_idx], csr.indptr[row_idx + 1]
            cols = csr.indices[start:end]
            vals = csr.data[start:end]
            # Keep top 28 weighted TF-IDF terms per question (already L2-normalized)
            if len(vals) > 28:
                top = np.argsort(vals)[::-1][:28]
                cols = cols[top]
                vals = vals[top]
            doc_vectors.append(
                [[int(c), round(float(v), 4)] for c, v in zip(cols, vals)]
            )

        ret_payload = {
            "vocab": ret_vocab,
            "idf": ret_idf,
            "doc_vectors": doc_vectors,
        }

    runtime_bundle = {
        "schema_version": 2,
        "trained_at": artifact.get("trained_at"),
        "local_papers_count": artifact.get("local_papers_count", 0),
        "subject_years": artifact.get("subject_years", {}),
        "subject_paper_keywords": artifact.get("subject_paper_keywords", {}),
        "dataset_subject_counts": artifact.get("dataset_subject_counts", {}),
        "classifier_metrics": artifact.get("classifier_metrics", {}),
        "classifier": clf_payload,
        "retrieval": ret_payload,
        "question_bank": artifact.get("question_bank") or [],
    }

    out_path = Path(runtime_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    raw_bytes = json.dumps(runtime_bundle, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    with gzip.open(out_path, "wb", compresslevel=9) as fh:
        fh.write(raw_bytes)
    return out_path


def _paper3_style_for_subject(subject: str) -> str:
    low = subject.lower()
    if any(k in low for k in ("accounting", "economics", "commerce")):
        return "commercial_case"
    if any(k in low for k in ("computer", "ict")):
        return "computing_practical"
    if any(k in low for k in ("literature", "english", "french", "history", "philosophy", "religious", "logic", "citizenship")):
        return "arts_applied"
    return "science_practical"


def _build_structured_or_practical_items(
    selected_mcqs: List[Dict[str, Any]],
    subject: str,
    level: str,
    topic: str,
    paper_type: str,
    paper_keywords: List[str],
) -> List[Dict[str, Any]]:
    style = _paper3_style_for_subject(subject)
    is_paper3 = paper_type == "paper3"
    items: List[Dict[str, Any]] = []

    for idx, mcq in enumerate(selected_mcqs):
        stem = mcq["question_text"]
        correct = mcq["answer"]
        expl = mcq.get("explanation") or ""
        subtopic = mcq.get("topic") or topic or subject
        kw = paper_keywords[idx % len(paper_keywords)] if paper_keywords else subtopic

        if not is_paper3:
            marks = [6, 8, 6, 10][idx % 4]
            q_text = (
                f"(a) {stem}\n"
                f"(b) Explain the underlying {level} {subject} principle behind your answer, "
                f"illustrating with a clear syllabus example or calculation related to {subtopic}."
            )
            model_ans = (
                f"(a) {correct}.\n\n"
                f"(b) {expl if expl else f'In {level} {subject}, this principle directly governs {subtopic} (linked to {kw}). State the formal syllabus rule, show step-by-step reasoning, and conclude with a concrete exam example.'}"
            )
            key_points = [
                f"2 marks for accurately identifying/stating: {correct}",
                f"2 marks for clear {subject} conceptual explanation tied to {subtopic}",
                f"{max(2, marks - 4)} marks for worked illustration, diagram, or syllabus application",
            ]
        else:
            marks = [10, 12, 10, 15][idx % 4]
            if style == "science_practical":
                q_text = (
                    f"Practical & Experimental Analysis ({level} {subject} · {subtopic}):\n"
                    f"Context: {stem}\n"
                    f"(a) State the expected scientific outcome/principle.\n"
                    f"(b) Design a concise laboratory procedure (apparatus, variables, safety precautions, and observations) to verify this principle.\n"
                    f"(c) Explain one likely source of experimental error and how to minimise it."
                )
                model_ans = (
                    f"(a) Expected principle/result: {correct}.\n"
                    f"(b) Procedure: Set up standard {subject} apparatus relevant to {subtopic}, control independent and dependent variables, record repeat measurements cleanly in a table, and follow lab safety rules. {expl}\n"
                    f"(c) Error & Precaution: Minimise parallax/measurement error by repeating readings and averaging results."
                )
                key_points = [
                    f"2 marks for stating core finding: {correct}",
                    "4 marks for valid apparatus, step-by-step experimental method, and variables",
                    "2 marks for safety precautions and data recording table",
                    "2 marks for realistic error analysis and improvement",
                ]
            elif style == "computing_practical":
                q_text = (
                    f"Practical Task ({level} {subject} · {subtopic}):\n"
                    f"Scenario: {stem}\n"
                    f"(a) Identify the correct technical solution.\n"
                    f"(b) Write clean pseudocode, SQL, or structured implementation steps demonstrating this solution.\n"
                    f"(c) Provide test cases (normal, boundary, and erroneous data) to validate your solution."
                )
                model_ans = (
                    f"(a) Correct solution: {correct}.\n"
                    f"(b) Implementation: Structure clear inputs, processing logic, and outputs aligned with {subtopic}. {expl}\n"
                    f"(c) Testing: Verify with standard inputs, edge/boundary cases, and invalid inputs with error handling."
                )
                key_points = [
                    f"2 marks for accurate technical answer: {correct}",
                    "5 marks for logically correct pseudocode/implementation steps",
                    "3 marks for complete test-plan coverage (normal, boundary, invalid)",
                ]
            elif style == "commercial_case":
                q_text = (
                    f"Applied Case Study ({level} {subject} · {subtopic}):\n"
                    f"Case Prompt: {stem}\n"
                    f"(a) Determine the correct accounting/economic conclusion.\n"
                    f"(b) Show the supporting OHADA/financial workings, schedules, or economic diagrams.\n"
                    f"(c) Advise management on two practical strategic decisions based on your findings."
                )
                model_ans = (
                    f"(a) Conclusion: {correct}.\n"
                    f"(b) Workings & Analysis: Apply {level} {subject} standards for {subtopic}. {expl}\n"
                    f"(c) Management Advice: Provide two concrete, financially justified recommendations weighing risks and liquidity/efficiency."
                )
                key_points = [
                    f"2 marks for correct core determination: {correct}",
                    "5 marks for accurate workings, schedules, or labelled diagrams",
                    "3 marks for practical, justified business/policy recommendations",
                ]
            else:
                q_text = (
                    f"Applied Critical Analysis ({level} {subject} · {subtopic}):\n"
                    f"Extract / Prompt: {stem}\n"
                    f"(a) Identify the central thesis or factual anchor.\n"
                    f"(b) Critically evaluate this issue using two distinct arguments supported by historical, textual, or philosophical evidence.\n"
                    f"(c) State a balanced, well-reasoned conclusion."
                )
                model_ans = (
                    f"(a) Core anchor: {correct}.\n"
                    f"(b) Critical Discussion: Examine multiple perspectives related to {subtopic} with concrete textual/historical references. {expl}\n"
                    f"(c) Conclusion: Synthesise the strongest evidence into a clear final judgement."
                )
                key_points = [
                    f"2 marks for identifying key anchor: {correct}",
                    "5 marks for two developed critical arguments with specific evidence",
                    "3 marks for coherence, counter-argument evaluation, and conclusion",
                ]

        items.append(
            {
                "id": f"ml-{paper_type}-{idx + 1}-{mcq.get('id', idx)}",
                "subject": subject,
                "topic": subtopic,
                "topicTag": subtopic,
                "question_text": q_text,
                "marks": marks,
                "modelAnswer": model_ans,
                "keyPoints": key_points,
                "source": mcq.get("source") or "slearn-ml",
            }
        )

    return items


def generate_from_saved_model(
    artifact: Dict[str, Any],
    subject: str,
    topic: str = "",
    count: int = 10,
    paper_type: str = "paper1",
    level: str = "O-Level",
    exclude_questions: Optional[Iterable[str]] = None,
) -> Dict[str, Any]:
    target_subject = canonical_subject(subject)
    safe_count = max(1, min(50, int(count or 10)))
    excluded = {str(s).strip().lower() for s in (exclude_questions or []) if str(s).strip()}

    bank: List[Dict[str, Any]] = artifact.get("question_bank") or []
    vectorizer = artifact.get("retrieval_vectorizer")
    matrix = artifact.get("retrieval_matrix")

    matching_indices = [
        idx
        for idx, q in enumerate(bank)
        if q["subject"].lower() == target_subject.lower()
        and q["question_text"].lower() not in excluded
    ]

    # Broaden to same-stream or semantic retrieval if exact subject isn't in corpus yet (e.g. French)
    subject_matched = bool(matching_indices)
    if not matching_indices and bank:
        matching_indices = [
            idx for idx, q in enumerate(bank) if q["question_text"].lower() not in excluded
        ]

    selected_mcqs: List[Dict[str, Any]] = []
    if matching_indices and vectorizer is not None and matrix is not None:
        query_text = f"{target_subject} {topic}".strip()
        if (topic and topic.lower() not in {"general", "full syllabus"}) or not subject_matched:
            q_vec = vectorizer.transform([query_text])
            sub_matrix = matrix[matching_indices]
            sims = cosine_similarity(q_vec, sub_matrix).ravel()
            ranked_order = np.argsort(sims)[::-1]
            pool_size = min(len(ranked_order), max(safe_count, int(safe_count * 2.5)))
            top_pool = [matching_indices[int(i)] for i in ranked_order[:pool_size]]
            random.shuffle(top_pool)
            chosen = top_pool[:safe_count]
        else:
            chosen = random.sample(matching_indices, min(safe_count, len(matching_indices)))

        for i, idx in enumerate(chosen):
            item = bank[idx]
            opts = list(item["options"])
            random.shuffle(opts)
            selected_mcqs.append(
                {
                    "id": item.get("id") or f"ml-{i + 1}",
                    "subject": target_subject,
                    "topic": topic or item.get("topic") or target_subject,
                    "topicTag": item.get("topic") or topic or target_subject,
                    "question_text": item["question_text"],
                    "options": opts,
                    "answer": item["answer"],
                    "explanation": item.get("explanation") or "",
                    "source": item.get("source") or "slearn-ml",
                    "difficulty": ["easy", "medium", "hard"][i % 3],
                }
            )

    paper_keywords = artifact.get("subject_paper_keywords", {}).get(target_subject, [])[:8]
    year_range = artifact.get("subject_years", {}).get(target_subject, [0, 0])

    if paper_type in {"paper2", "paper3"}:
        final_questions = _build_structured_or_practical_items(
            selected_mcqs=selected_mcqs,
            subject=target_subject,
            level=level,
            topic=topic,
            paper_type=paper_type,
            paper_keywords=paper_keywords,
        )
    else:
        final_questions = selected_mcqs

    return {
        "subject": target_subject,
        "level": level,
        "paper_type": paper_type,
        "topic": topic,
        "subject_matched": subject_matched,
        "year_range": year_range,
        "model_trained_at": artifact.get("trained_at"),
        "paper_keywords": paper_keywords,
        "total_questions": len(final_questions),
        "questions": final_questions,
    }


def assist_student_with_model(
    artifact: Dict[str, Any],
    query: str,
    subject: str = "",
    topic: str = "",
    level: str = "O-Level",
    count: int = 4,
) -> Dict[str, Any]:
    clean_query = re.sub(r"\s+", " ", str(query or "")).strip()
    target_subject = canonical_subject(subject) if subject else ""
    classifier = artifact.get("subject_classifier")

    predicted_subject = target_subject or "General"
    if classifier is not None and clean_query:
        try:
            predicted_subject = str(classifier.predict([f"{subject} {topic} {clean_query}".strip()])[0])
        except Exception:
            pass

    effective_subject = target_subject or predicted_subject
    bank: List[Dict[str, Any]] = artifact.get("question_bank") or []
    vectorizer = artifact.get("retrieval_vectorizer")
    matrix = artifact.get("retrieval_matrix")

    candidate_indices = [
        idx for idx, q in enumerate(bank) if q["subject"].lower() == effective_subject.lower()
    ]
    if not candidate_indices:
        candidate_indices = list(range(len(bank)))

    related_items: List[Dict[str, Any]] = []
    if candidate_indices and vectorizer is not None and matrix is not None:
        search_text = f"{effective_subject} {topic} {clean_query}".strip()
        q_vec = vectorizer.transform([search_text])
        sub_matrix = matrix[candidate_indices]
        sims = cosine_similarity(q_vec, sub_matrix).ravel()
        top_order = np.argsort(sims)[::-1][: max(1, min(8, int(count or 4)))]

        for rank_idx in top_order:
            score = float(sims[int(rank_idx)])
            item = bank[candidate_indices[int(rank_idx)]]
            related_items.append(
                {
                    "id": item.get("id"),
                    "subject": item.get("subject"),
                    "topic": item.get("topic") or effective_subject,
                    "relevance": round(score, 3),
                    "question_text": item.get("question_text"),
                    "options": item.get("options") or [],
                    "answer": item.get("answer"),
                    "explanation": item.get("explanation") or "",
                    "source": item.get("source") or "slearn-ml",
                }
            )

    keywords = artifact.get("subject_paper_keywords", {}).get(effective_subject, [])[:8]
    return {
        "level": level,
        "requested_subject": target_subject or effective_subject,
        "predicted_subject": predicted_subject,
        "topic": topic,
        "query": clean_query,
        "model_trained_at": artifact.get("trained_at"),
        "paper_keywords": keywords,
        "related_questions": related_items,
    }


def verify_saved_model(model_path: str | Path = DEFAULT_MODEL_PATH) -> Dict[str, Any]:
    path = Path(model_path)
    if not path.exists():
        raise FileNotFoundError(f"Saved model not found at {path}. Run with --train first.")

    artifact = joblib.load(path)
    classifier = artifact.get("subject_classifier")

    probe_samples = [
        ("Calculate the molarity of a 0.5 mol NaOH solution in 250 cm3 of water.", "Chemistry"),
        ("Prepare the trial balance and classify capital versus revenue expenditure under OHADA.", "Accounting"),
        ("A block of mass 4 kg accelerates at 3 m/s^2 under a net horizontal force.", "Physics"),
        ("During mitosis, sister chromatids separate and move to opposite poles of the cell.", "Biology"),
        ("Solve the quadratic equation 2x^2 - 5x + 2 = 0 for real roots.", "Mathematics"),
        ("What is the worst-case time complexity of binary search on a sorted array?", "Computer Science"),
        ("If price elasticity of demand is greater than 1, how does a price cut affect total revenue?", "Economics"),
    ]

    probe_results = []
    probe_correct = 0
    if classifier is not None:
        for text, expected in probe_samples:
            predicted = str(classifier.predict([text])[0])
            ok = predicted == expected
            if ok:
                probe_correct += 1
            probe_results.append({"expected": expected, "predicted": predicted, "ok": ok})

    retrieval_checks = {}
    for subj, topic in [
        ("Accounting", "balance sheet"),
        ("Commerce", "marketing management"),
        ("Economics", "supply demand inflation"),
        ("Chemistry", "acids and molarity"),
        ("Physics", "electricity and force"),
        ("Biology", "cell division DNA"),
        ("Mathematics", "algebra probability"),
        ("Pure Mathematics with Statistics", "normal distribution hypothesis"),
        ("Computer Science", "algorithms binary"),
        ("Information and Communication Technology (ICT)", "network security"),
        ("History", "revolution war"),
        ("English Language", "comprehension passage"),
        ("Logic", "syllogism fallacy"),
        ("Religious Studies", "ethics scripture"),
        ("Citizenship Education", "constitution democracy"),
    ]:
        gen = generate_from_saved_model(artifact, subject=subj, topic=topic, count=3)
        retrieval_checks[subj] = {
            "returned": gen["total_questions"],
            "sample_question": gen["questions"][0]["question_text"][:110] if gen["questions"] else "",
        }

    return {
        "status": "verified",
        "model_file": str(path),
        "model_size_mb": round(path.stat().st_size / (1024 * 1024), 2),
        "trained_at": artifact.get("trained_at"),
        "local_papers_indexed": artifact.get("local_papers_count", 0),
        "online_questions_indexed": len(artifact.get("question_bank") or []),
        "dataset_subject_counts": artifact.get("dataset_subject_counts", {}),
        "classifier_holdout_metrics": artifact.get("classifier_metrics", {}),
        "live_probe_accuracy": f"{probe_correct}/{len(probe_samples)}",
        "live_probes": probe_results,
        "live_retrieval_checks": retrieval_checks,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="S-Learn ML Exam Engine: train, verify, and generate exam questions from a persisted scikit-learn model."
    )
    parser.add_argument("--train", action="store_true", help="Train and persist the ML model bundle")
    parser.add_argument("--export-runtime", action="store_true", help="Export portable Node.js runtime model from saved .joblib")
    parser.add_argument("--verify", action="store_true", help="Verify the saved ML model bundle")
    parser.add_argument("--assist", action="store_true", help="Assist a learner with ML classification and syllabus retrieval")
    parser.add_argument("--query", type=str, default="", help="Student question or topic query for --assist mode")
    parser.add_argument("--folder", type=str, default=str(DEFAULT_DOCUMENTS_DIR), help="Folder containing local past papers")
    parser.add_argument("--datasets", type=str, default=str(DEFAULT_DATASETS_DIR), help="Folder containing open exam JSON datasets")
    parser.add_argument("--model", type=str, default=str(DEFAULT_MODEL_PATH), help="Path to persisted .joblib model")
    parser.add_argument("--level", type=str, default="O-Level", help="GCE level (O-Level or A-Level)")
    parser.add_argument("--paper-type", type=str, default="paper1", choices=["paper1", "paper2", "paper3"], help="GCE paper format")
    parser.add_argument("--subject", type=str, default="Chemistry", help="Subject to generate questions for")
    parser.add_argument("--topic", type=str, default="", help="Topic focus for semantic retrieval")
    parser.add_argument("--count", type=int, default=10, help="Number of questions to generate")
    parser.add_argument("--exclude-file", type=str, default="", help="Optional JSON file listing question stems to exclude")
    parser.add_argument("--output", type=str, default="generated_exam.json", help="Output JSON file path")
    return parser


def main() -> None:
    args = build_parser().parse_args()

    if args.train:
        metrics = train_and_save_model(
            papers_folder=args.folder,
            datasets_dir=args.datasets,
            model_path=args.model,
        )
        print(json.dumps(metrics, indent=2))
        return

    if args.export_runtime:
        artifact = joblib.load(args.model)
        out = export_runtime_model(artifact, DEFAULT_RUNTIME_MODEL_PATH)
        print(
            json.dumps(
                {
                    "runtime_model_file": str(out),
                    "size_mb": round(out.stat().st_size / (1024 * 1024), 2),
                    "questions": len(artifact.get("question_bank") or []),
                },
                indent=2,
            )
        )
        return

    if args.verify:
        report = verify_saved_model(model_path=args.model)
        print(json.dumps(report, indent=2))
        return

    model_path = Path(args.model)
    if not model_path.exists():
        train_and_save_model(
            papers_folder=args.folder,
            datasets_dir=args.datasets,
            model_path=model_path,
        )

    artifact = joblib.load(model_path)

    if args.assist:
        result = assist_student_with_model(
            artifact,
            query=args.query or args.topic or args.subject,
            subject=args.subject,
            topic=args.topic,
            level=args.level,
            count=args.count,
        )
        if args.output and args.output != "generated_exam.json":
            output_path = Path(args.output)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return

    excluded: List[str] = []
    if args.exclude_file:
        ex_path = Path(args.exclude_file)
        if ex_path.exists():
            try:
                loaded = json.loads(ex_path.read_text(encoding="utf-8"))
                if isinstance(loaded, list):
                    excluded = [str(item) for item in loaded]
            except Exception:
                pass

    exam = generate_from_saved_model(
        artifact,
        subject=args.subject,
        topic=args.topic,
        count=args.count,
        paper_type=args.paper_type,
        level=args.level,
        exclude_questions=excluded,
    )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(exam, indent=2, ensure_ascii=False), encoding="utf-8")

    print(
        json.dumps(
            {
                "subject": exam["subject"],
                "paper_type": exam["paper_type"],
                "total_questions": exam["total_questions"],
                "output_file": str(output_path),
                "year_range": exam["year_range"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
