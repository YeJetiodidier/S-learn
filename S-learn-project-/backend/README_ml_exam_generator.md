# ML Exam Generator

This Python project learns patterns from historical past papers, groups similar question themes using TF-IDF + K-Means, and produces a new exam paper automatically.

## What it does

- Reads PDF, DOCX, DOC, and TXT files from a folder of past papers
- Normalizes text and extracts useful vocabulary
- Uses TF-IDF vectorization to represent each paper
- Uses K-Means clustering to discover recurring topic patterns across subjects and years
- Generates a fresh exam paper with subject-specific questions

## Run it

```bash
python ml_exam_generator.py --folder ../documents/papers --subject Mathematics --count 10 --output generated_exam.json
```

## Example output

The script writes a JSON file like:

```json
{
  "subject": "Mathematics",
  "year_range": [2019, 2025],
  "total_questions": 10,
  "questions": [
    {
      "id": 1,
      "subject": "Mathematics",
      "question": "Explain the key idea of algebra in Mathematics and show why it matters.",
      "difficulty": "easy"
    }
  ]
}
```

## Suggested next improvement

For a stronger real grading model, replace the template-based generator with a fine-tuned LLM or a supervised question classifier trained on labelled exam items.
