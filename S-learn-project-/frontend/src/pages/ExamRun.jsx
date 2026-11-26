// src/pages/ExamRun.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { recordExamProgress } from "../firebase/dataService";
import "./exam.css";

const ExamRun = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const questions = (state && state.questions) || [];
    const subject = state?.subject || questions[0]?.subject || "";
    const topic = state?.topic || questions[0]?.topic || "";

    // Normalize options: backend may return them as a JSON string
    const normalizedQuestions = questions.map((q) => ({
        ...q,
        options:
            typeof q.options === "string"
                ? (() => {
                      try {
                          return JSON.parse(q.options);
                      } catch {
                          return [];
                      }
                  })()
                : q.options,
    }));

    const [answers, setAnswers] = useState(
        normalizedQuestions.map((q) => ({ questionId: q.id, answer: "" }))
    );

    const handleChange = (idx, value) => {
        const newAnswers = [...answers];
        newAnswers[idx].answer = value;
        setAnswers(newAnswers);
    };

    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        // Score locally: each question carries its correct `answer`.
        const total = normalizedQuestions.length;
        let score = 0;
        const review = normalizedQuestions.map((q, i) => {
            const selected = answers[i]?.answer || "";
            const isCorrect = selected === q.answer;
            if (isCorrect) score++;
            return {
                id: q.id,
                question_text: q.question_text,
                selected,
                correctAnswer: q.answer,
                isCorrect,
            };
        });
        let progressNotice = "";
        if (subject && topic) {
            try {
                await recordExamProgress({ subject, topic, score, total });
            } catch (error) {
                console.error("Could not save study progress:", error);
                progressNotice =
                    "Your score is ready, though we couldn't save your study progress right now.";
            }
        }
        navigate("/exam/result", {
            state: { result: { score, total, subject, topic, review, progressNotice } },
        });
    };

    if (!normalizedQuestions.length) return <p>No exam data.</p>;

    return (
        <div className="exam-run" style={{ padding: "2rem" }}>
            <img
                src="/slearn_logo.png"
                alt="S-Learn Logo"
                style={{
                    display: "block",
                    margin: "0 auto 1rem",
                    width: "80px",
                    height: "80px",
                    objectFit: "contain",
                }}
            />
            <h2>Exam</h2>
            <form onSubmit={handleSubmit}>
                {normalizedQuestions.map((q, i) => (
                    <div key={q.id} style={{ marginBottom: "1.5rem" }}>
                        <p>
                            <strong>
                                {i + 1}. {q.question_text}
                            </strong>
                        </p>
                        {Array.isArray(q.options) && q.options.length ? (
                            q.options.map((opt, idx) => (
                                <label key={idx} style={{ display: "block" }}>
                                    <input
                                        type="radio"
                                        name={`q${q.id}`}
                                        value={opt}
                                        checked={answers[i].answer === opt}
                                        onChange={(e) => handleChange(i, e.target.value)}
                                        required
                                    />
                                    {opt}
                                </label>
                            ))
                        ) : (
                            <input
                                type="text"
                                value={answers[i].answer}
                                onChange={(e) => handleChange(i, e.target.value)}
                                required
                                style={{ width: "100%" }}
                            />
                        )}
                    </div>
                ))}
                <button type="submit" className="primary-btn" disabled={submitting}>
                    {submitting ? "Saving..." : "Submit Answers"}
                </button>
            </form>
        </div>
    );
};

export default ExamRun;
