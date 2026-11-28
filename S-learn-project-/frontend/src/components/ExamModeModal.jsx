import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { EXAM_MODES } from "../data/examModes";
import "../pages/exam.css";

function ExamModeModal({ isOpen, onClose, routeState = null }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (mode) => {
    onClose?.();
    navigate(mode.path, routeState ? { state: routeState } : undefined);
  };

  return (
    <div
      className="exam-mode-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="choose-exam-mode-heading"
      onClick={onClose}
    >
      <div className="exam-mode-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="exam-mode-handle" aria-hidden="true" />

        <div className="exam-mode-header">
          <h2 id="choose-exam-mode-heading" className="exam-mode-heading">
            CHOOSE EXAM MODE
          </h2>
        </div>

        <div className="exam-mode-list" role="menu">
          {EXAM_MODES.map((mode) => {
            const ModeIcon = mode.Icon;
            const isActive = location.pathname === mode.path;
            return (
              <button
                key={mode.id}
                type="button"
                role="menuitem"
                className={`exam-mode-option${isActive ? " active" : ""}`}
                onClick={() => handleSelect(mode)}
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

        <div className="exam-mode-footer">
          <button type="button" className="exam-mode-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExamModeModal;
