// src/pages/Result.jsx
import "./exam.css";
import { useLocation, useNavigate } from "react-router-dom";
import StatusBanner from "../components/StatusBanner";

const Result = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const result = (state && state.result) || { score: 0, total: 0, subject: "", topic: "", review: [], progressNotice: "" };
    const percentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    const review = Array.isArray(result.review) ? result.review : [];

    return (
        <div className="exam-result">
            <h2>Exam Result</h2>
            {result.progressNotice && <StatusBanner type="info" message={result.progressNotice} />}
            {(result.subject || result.topic) && (
                <p style={{ opacity: 0.85, marginBottom: "0.5rem" }}>
                    {[result.subject, result.topic].filter(Boolean).join(" — ")}
                </p>
            )}
            <p>
                You scored <strong>{result.score}</strong> out of <strong>{result.total}</strong> ({percentage}%)
            </p>

            {review.length > 0 && (
                <div className="exam-review-list">
                    {review.map((item, index) => (
                        <div
                            key={item.id || index}
                            className="exam-review-item"
                            style={{
                                background: item.isCorrect ? "rgba(16, 185, 129, 0.14)" : "rgba(239, 68, 68, 0.14)",
                                border: `1px solid ${item.isCorrect ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                            }}
                        >
                            <p style={{ fontSize: "0.95rem", marginBottom: "0.35rem" }}>
                                <strong>{index + 1}. {item.question_text}</strong>
                            </p>
                            <p style={{ fontSize: "0.85rem", margin: 0 }}>
                                Your answer: <strong>{item.selected || "Unanswered"}</strong> {item.isCorrect ? "✅" : "❌"}
                            </p>
                            {!item.isCorrect && (
                                <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
                                    Correct answer: <strong>{item.correctAnswer}</strong>
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="exam-result-actions">
                <button
                    className="secondary-btn"
                    onClick={() =>
                        navigate("/exam", {
                            state: { subject: result.subject, topic: result.topic },
                        })
                    }
                >
                    Practice Again
                </button>
                <button
                    className="primary-btn"
                    onClick={() => navigate("/dashboard")}
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default Result;
