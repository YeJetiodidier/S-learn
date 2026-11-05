from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import List, Dict, Any, Iterable

import numpy as np
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer


DEFAULT_SUBJECTS = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "History",
    "Geography",
    "Economics",
    "Computer Science",
    "Accounting",
    "Agriculture",
]


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_text_from_pdf(pdf_path: Path) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(str(pdf_path))
        chunks = []
        for page in reader.pages:
            page_text = page.extract_text() or ""
            chunks.append(page_text)
        return "\n".join(chunks)
    except Exception:
        return ""


def extract_text_from_docx(docx_path: Path) -> str:
    try:
        from docx import Document

        doc = Document(str(docx_path))
        paragraphs = [p.text for p in doc.paragraphs]
        return "\n".join(paragraphs)
    except Exception:
        return ""


def extract_text_from_txt(txt_path: Path) -> str:
    try:
        return txt_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def infer_subject(path: Path) -> str:
    name = path.name.lower()
    parent = path.parent.name.lower()
    haystack = f"{name} {parent}"

    for subject in DEFAULT_SUBJECTS:
        if subject.lower() in haystack:
            return subject

    for token in [
        "math",
        "physics",
        "chemistry",
        "biology",
        "english",
        "history",
        "geography",
        "economics",
        "computer",
        "accounting",
        "agriculture",
    ]:
        if token in haystack:
            return token.replace("math", "Mathematics").replace("computer", "Computer Science").title()

    return "General"


def infer_year(path: Path) -> int:
    match = re.search(r"(19\d{2}|20\d{2})", path.name)
    if match:
        return int(match.group(1))
    match = re.search(r"(19\d{2}|20\d{2})", str(path.parent))
    if match:
        return int(match.group(1))
    return 0


def load_papers(folder: str | Path) -> List[Dict[str, Any]]:
    root = Path(folder)
    if not root.exists():
        raise FileNotFoundError(f"Paper folder not found: {root}")

    papers: List[Dict[str, Any]] = []
    allowed = {".pdf", ".doc", ".docx", ".txt"}

    for file_path in sorted(root.rglob("*")):
        if not file_path.is_file() or file_path.suffix.lower() not in allowed:
            continue

        if file_path.suffix.lower() == ".pdf":
            text = extract_text_from_pdf(file_path)
        elif file_path.suffix.lower() in {".doc", ".docx"}:
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
                "text": clean_text,
            }
        )

    return papers


class ExamPatternLearner:
    def __init__(self, papers: Iterable[Dict[str, Any]]):
        self.papers = list(papers)
        self.vectorizer = None
        self.model = None
        self.cluster_keywords: Dict[int, List[str]] = {}

    def fit(self) -> "ExamPatternLearner":
        if not self.papers:
            raise ValueError("No past papers were found to train the model.")

        texts = [paper["text"] for paper in self.papers]
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.90,
            strip_accents="unicode",
            lowercase=True,
        )
        matrix = self.vectorizer.fit_transform(texts)

        n_clusters = min(6, max(2, len(texts) // 3))
        self.model = KMeans(n_clusters=n_clusters, random_state=42, n_init=20)
        clusters = self.model.fit_predict(matrix)

        feature_names = np.asarray(self.vectorizer.get_feature_names_out())
        for cluster_id in sorted(set(int(c) for c in clusters)):
            cluster_indices = np.where(clusters == cluster_id)[0]
            centroid = matrix[cluster_indices].mean(axis=0)
            top_idx = np.argsort(centroid.toarray().ravel())[::-1][:10]
            keywords = [feature_names[i] for i in top_idx if feature_names[i]]
            self.cluster_keywords[cluster_id] = keywords

        for paper, cluster in zip(self.papers, clusters):
            paper["cluster"] = int(cluster)

        return self

    def get_subject_topics(self, subject: str) -> List[List[str]]:
        subject_papers = [paper for paper in self.papers if paper["subject"].lower() == subject.lower()]
        if not subject_papers:
            return []

        cluster_topics: Dict[int, List[str]] = defaultdict(list)
        for paper in subject_papers:
            for keyword in self.cluster_keywords.get(paper.get("cluster", 0), []):
                cluster_topics[paper.get("cluster", 0)].append(keyword)

        return [sorted(set(keywords), key=keywords.index)[:8] for _, keywords in sorted(cluster_topics.items())]

    def generate_question_bank(self, subject: str, topic: str = "", count: int = 10) -> List[Dict[str, Any]]:
        subject_papers = [
            paper for paper in self.papers
            if paper["subject"].lower() == subject.lower()
        ]
        if not subject_papers:
            return []

        topic_groups = self.get_subject_topics(subject)
        keywords = []
        for group in topic_groups:
            keywords.extend(group)

        if not keywords:
            keywords = [
                "concept",
                "theory",
                "application",
                "analysis",
                "problem solving",
                "evidence",
                "comparison",
            ]

        selected_keywords = [keyword for keyword in keywords if topic.lower() not in keyword.lower() or keyword]
        if not selected_keywords:
            selected_keywords = keywords

        source_names = [paper.get("source", "") for paper in subject_papers]
        source_name = Path(source_names[0]).name if source_names else "past paper"
        templates = [
            "In {subject}, explain the main idea of {keyword} as it applies to {topic} from {source_name}.",
            "For {subject}, compare how {keyword} is used in {topic} and justify the relevant application.",
            "Using the learned pattern from {source_name}, describe how {keyword} relates to {topic} in {subject}.",
            "Analyse the significance of {keyword} in {subject} when studying {topic} from {source_name}.",
            "Solve a short {subject} problem involving {keyword} and {topic}, then explain your reasoning.",
            "Evaluate the importance of {keyword} in {topic} for {subject} and support your answer with an example.",
        ]

        generated: List[Dict[str, Any]] = []
        seen: set[str] = set()
        for index in range(count):
            keyword = selected_keywords[index % len(selected_keywords)]
            template = templates[index % len(templates)]
            question = template.format(
                subject=subject,
                keyword=keyword,
                topic=topic or "the selected topic",
                source_name=source_name,
            )
            if question in seen:
                question = f"Using {source_name}, explain how {keyword} applies to {topic} in {subject}."
            seen.add(question)
            generated.append({
                "id": index + 1,
                "subject": subject,
                "topic": topic,
                "question_text": question,
                "options": [
                    f"A correct application of {keyword} in {subject} and {topic}.",
                    f"An unrelated statement about {subject} that does not use {keyword}.",
                    f"A claim that contradicts the learned {topic} pattern.",
                    f"A statement that ignores the {subject} concept of {keyword}.",
                ],
                "answer": f"A correct application of {keyword} in {subject} and {topic}.",
                "difficulty": ["easy", "medium", "hard"][index % 3],
            })

        return generated

    def generate_exam_paper(self, subject: str, topic: str = "", count: int = 10) -> Dict[str, Any]:
        questions = self.generate_question_bank(subject, topic=topic, count=count)
        years = sorted({paper["year"] for paper in self.papers if paper["subject"].lower() == subject.lower()})

        return {
            "subject": subject,
            "year_range": [min(years), max(years)] if years else [0, 0],
            "total_questions": len(questions),
            "questions": questions,
        }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Train an ML model on past papers and generate a new exam paper.")
    default_paper_folder = Path(__file__).resolve().parents[2] / "documents" / "papers"
    parser.add_argument("--folder", type=str, default=str(default_paper_folder), help="Folder containing past paper files")
    parser.add_argument("--subject", type=str, default="Mathematics", help="Subject to generate an exam for")
    parser.add_argument("--topic", type=str, default="", help="Specific topic to build questions around")
    parser.add_argument("--count", type=int, default=10, help="Number of questions to generate")
    parser.add_argument("--output", type=str, default="generated_exam.json", help="Output JSON file path")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    papers = load_papers(args.folder)
    learner = ExamPatternLearner(papers).fit()
    exam = learner.generate_exam_paper(args.subject, topic=args.topic, count=args.count)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(exam, indent=2), encoding="utf-8")

    print(json.dumps({
        "subject": exam["subject"],
        "total_questions": exam["total_questions"],
        "output_file": str(output_path),
        "year_range": exam["year_range"],
    }, indent=2))


if __name__ == "__main__":
    main()
