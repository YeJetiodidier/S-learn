import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ExamModeModal from "../components/ExamModeModal";
import { EXAM_MODES } from "../data/examModes";
import "../dashboard.css";
import "./exam.css";

const ExamSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSelectorOpen, setIsSelectorOpen] = useState(true);

  const handleCloseSelector = useCallback(() => {
    setIsSelectorOpen(false);
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="db-layout">
      <Sidebar />

      <main className="db-main pe-main">
        <div className="pe-header">
          <button
            type="button"
            className="pe-back-link"
            onClick={() => navigate("/dashboard")}
          >
            ‹ Back to Dashboard
          </button>
          <div className="pe-title-row">
            <h1 className="pe-page-title">Practice Exam</h1>
            <button
              type="button"
              className="pe-choose-btn"
              onClick={() => setIsSelectorOpen(true)}
            >
              Choose Exam Mode
            </button>
          </div>
        </div>

        <section className="pe-preview-card" aria-hidden={isSelectorOpen}>
          <div className="pe-preview-banner">
            <h2>Exam Preparation Suite</h2>
            <p>Choose an exam mode to generate model answers, mark your scripts, simulate GCE papers, or launch a fresh syllabus quiz.</p>
          </div>
          <div className="pe-preview-body">
            <p className="pe-preview-section-label">AVAILABLE EXAM MODES</p>
            <div className="pe-mode-grid">
              {EXAM_MODES.map((mode) => {
                const ModeIcon = mode.Icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    className="pe-mode-tile"
                    onClick={() => navigate(mode.path, location.state ? { state: location.state } : undefined)}
                  >
                    <span className="exam-mode-icon-box">
                      <ModeIcon />
                    </span>
                    <span className="exam-mode-text">
                      <span className="exam-mode-title">{mode.title}</span>
                      <span className="exam-mode-desc">{mode.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <ExamModeModal
        isOpen={isSelectorOpen}
        onClose={handleCloseSelector}
        routeState={location.state || null}
      />
    </div>
  );
};

export default ExamSetup;
