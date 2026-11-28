# S-Learn ML Exam Engine

Trains and persists a scikit-learn exam model (`ml_models/slearn_exam_model.joblib`) combining:
1. Local GCE past papers in `documents/` (deduplicated via SHA-256 + TF-IDF & K-Means topic pattern clustering).
2. Open-licensed academic exam datasets (**MMLU** high-school & accounting subjects + **SciQ** science MCQs with explanations) downloaded via `scripts/fetch_ml_datasets.py`.
3. A supervised **TF-IDF + LinearSVC** subject classifier evaluated with an 80/20 stratified hold-out split (`ml_models/model_metrics.json`).
4. A **TF-IDF cosine-similarity question retriever** for fast (<0.5s) subject & topic question generation.

## Commands

```bash
# 1. Fetch open academic datasets (MMLU + SciQ)
.venv-ml/bin/python scripts/fetch_ml_datasets.py

# 2. Train & save the persisted .joblib model + metrics
.venv-ml/bin/python ml_exam_generator.py --train

# 3. Verify the saved model (hold-out metrics, live subject probes, retrieval checks)
.venv-ml/bin/python ml_exam_generator.py --verify

# 4. Generate a sample exam paper
.venv-ml/bin/python ml_exam_generator.py --subject Chemistry --topic "acids and molarity" --count 5 --output generated_exam.json
```
