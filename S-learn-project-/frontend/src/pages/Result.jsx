// src/pages/Result.jsx
import "./exam.css";
import { useLocation, useNavigate } from "react-router-dom";

const Result = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const result = (state && state.result) || { score: 0, total: 0 };

    return (
        <div className="exam-result" style={{ padding: "2rem", textAlign: "center" }}>
            <h2>Exam Result</h2>
            <p>
                You scored <strong>{result.score}</strong> out of <strong>{result.total}</strong>
            </p>
            <button
                className="primary-btn"
                onClick={() => navigate("/dashboard")}
                style={{ marginTop: "1rem" }}
            >
                Back to Dashboard
            </button>
        </div>
    );
};

export default Result;
