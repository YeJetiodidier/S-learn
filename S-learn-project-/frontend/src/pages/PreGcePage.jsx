import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatusBanner from "../components/StatusBanner";
import ExamModeModal from "../components/ExamModeModal";
import { SparklesIcon } from "../components/ExamModeIcons";
import {
  ACADEMIC_LEVELS,
  GCE_STREAMS,
  getSubjectsForLevel,
  getTopicsForSubject,
} from "../data/syllabusCatalog";
import { backendRequest } from "../firebase/apiClient";
import { getPapers, recordExamProgress } from "../firebase/dataService";
import { getFriendlyErrorMessage } from "../utils/friendlyError";
import "../dashboard.css";
import "./exam.css";

const formatTimer = (totalSeconds) => {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const gradeFromPct = (pct) => {
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  if (pct >= 40) return "E";
  return "U";
};

function PreGcePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [level, setLevel] = useState(location.state?.level || "O-Level");
  const [stream, setStream] = useState(location.state?.stream || "All");
  const levelSubjects = getSubjectsForLevel(level, stream);
  const [subject, setSubject] = useState(
    location.state?.subject || levelSubjects[0]?.name || "Chemistry",
  );
  const availableTopics = getTopicsForSubject(level, subject);
  const [topic, setTopic] = useState(location.state?.topic || "Full Syllabus");
  const initialPaperType = ["paper1", "paper2", "paper3"].includes(location.state?.paperType)
    ? location.state.paperType
    : "paper1";
  const [paperType, setPaperType] = useState(initialPaperType); // "paper1" | "paper2" | "paper3"
  const [count, setCount] = useState(initialPaperType === "paper1" ? 10 : 4);
  const [durationMinutes, setDurationMinutes] = useState(
    initialPaperType === "paper3" ? 45 : initialPaperType === "paper2" ? 30 : 20,
  );

  const [phase, setPhase] = useState("setup"); // "setup" | "running" | "summary"
  const [paperViewMode, setPaperViewMode] = useState("board"); // "board" (Official GCE Paper) | "focus" (One-by-One)
  const [simulation, setSimulation] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [modeModalOpen, setModeModalOpen] = useState(false);

  const handleLevelChange = (nextLevel) => {
    setLevel(nextLevel);
    const nextList = getSubjectsForLevel(nextLevel, stream);
    setSubject(nextList[0]?.name || "");
    setTopic("Full Syllabus");
  };

  const handleStreamChange = (nextStream) => {
    setStream(nextStream);
    const nextList = getSubjectsForLevel(level, nextStream);
    setSubject(nextList[0]?.name || "");
    setTopic("Full Syllabus");
  };

  const handleSubjectChange = (nextSubject) => {
    setSubject(nextSubject);
    setTopic("Full Syllabus");
  };

  const handlePaperTypeChange = (nextType) => {
    setPaperType(nextType);
    setCount(nextType === "paper1" ? 10 : nextType === "paper3" ? 3 : 4);
    setDurationMinutes(nextType === "paper3" ? 45 : nextType === "paper2" ? 30 : 20);
  };

  const handleFinishSimulation = useCallback(async () => {
    if (!simulation || grading) return;
    setGrading(true);
    setError("");

    const questions = simulation.questions || [];
    try {
      if (simulation.paperType === "paper1") {
        let score = 0;
        const review = questions.map((q) => {
          const selected = answers[q.id] || "";
          const isCorrect = selected === q.answer;
          if (isCorrect) score += 1;
          return {
            id: q.id,
            topicTag: q.topicTag,
            question_text: q.question_text,
            selected,
            correctAnswer: q.answer,
            isCorrect,
            explanation: q.explanation || "",
          };
        });
        const total = questions.length;
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
        const resultData = {
          paperType: "paper1",
          score,
          total,
          percentage,
          grade: gradeFromPct(percentage),
          timeTaken: elapsedSeconds,
          review,
        };
        setSummary(resultData);
        setPhase("summary");

        recordExamProgress({
          subject: simulation.subject,
          topic: simulation.topic || "Pre-GCE Simulation",
          score,
          total,
        }).catch(() => {});
      } else {
        const entries = questions.map((q) => ({
          id: q.id,
          question: q.question_text,
          studentAnswer: answers[q.id] || "",
          maxMarks: q.marks || 5,
        }));
        const marked = await backendRequest("/api/exam/mark-answers", {
          method: "POST",
          body: {
            level: simulation.level,
            subject: simulation.subject,
            topic: simulation.topic,
            entries,
          },
        });
        setSummary({
          paperType: simulation.paperType,
          score: marked.totalScore,
          total: marked.totalMax,
          percentage: marked.percentage,
          grade: marked.grade,
          timeTaken: elapsedSeconds,
          overallSummary: marked.overallSummary,
          evaluations: marked.evaluations || [],
        });
        setPhase("summary");

        if (marked.totalMax > 0) {
          recordExamProgress({
            subject: simulation.subject,
            topic:
              simulation.topic ||
              (simulation.paperType === "paper3" ? "Pre-GCE Paper 3" : "Pre-GCE Paper 2"),
            score: marked.totalScore,
            total: marked.totalMax,
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        getFriendlyErrorMessage(err, "We couldn't grade your simulation right now."),
      );
    } finally {
      setGrading(false);
    }
  }, [answers, elapsedSeconds, grading, simulation]);

  useEffect(() => {
    if (phase !== "running" || !simulation) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
      if (simulation.durationMinutes > 0) {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleFinishSimulation();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, simulation, handleFinishSimulation]);

  const handleStartSimulation = async (event) => {
    event.preventDefault();
    if (!subject.trim()) {
      setError("Please select a subject to simulate.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const papers = await getPapers().catch(() => []);
      const data = await backendRequest("/api/exam/pre-gce", {
        method: "POST",
        body: {
          level,
          subject: subject.trim(),
          paperType,
          topic: topic.trim() || "Full Syllabus",
          count: Number(count),
          durationMinutes: Number(durationMinutes),
          papers: Array.isArray(papers) ? papers.slice(0, 20) : [],
        },
      });
      setSimulation(data);
      setAnswers({});
      setFlagged({});
      setCurrentIndex(0);
      setElapsedSeconds(0);
      setSecondsLeft((Number(durationMinutes) || 0) * 60);
      setSummary(null);
      setPhase("running");
    } catch (err) {
      console.error(err);
      setError(
        getFriendlyErrorMessage(
          err,
          "We couldn't launch your Pre-GCE simulation right now. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = simulation?.questions?.[currentIndex] || null;
  const answeredCount = simulation
    ? simulation.questions.filter((q) => String(answers[q.id] || "").trim().length > 0).length
    : 0;

  return (
    <div className="db-layout">
      <Sidebar />

      <main className="db-main pe-main">
        <div className="pe-header">
          <div className="pe-top-row">
            <button
              type="button"
              className="pe-back-link"
              onClick={() => navigate("/dashboard")}
            >
              ‹ Back to Dashboard
            </button>
            <button
              type="button"
              className="pe-mode-switch-pill"
              onClick={() => setModeModalOpen(true)}
            >
              Switch Exam Mode ▾
            </button>
          </div>

          {phase === "setup" && (
            <div className="pe-hero-card">
              <span className="exam-mode-icon-box pe-hero-icon">
                <SparklesIcon />
              </span>
              <div>
                <span className="pe-mode-pill">Exam Mode · Trained ML Model · Paper 1, 2 &amp; 3</span>
                <h1 className="pe-page-title">Pre-GCE Question Generator</h1>
                <p className="pe-hero-sub">
                  Generate authentic Cameroon GCE Paper 1 (MCQ), Paper 2 (Structured/Essay),
                  and Paper 3 (Practical / Applied / Case Study) simulations powered by S-Learn&apos;s
                  trained ML exam model.
                </p>
              </div>
            </div>
          )}
        </div>

        <StatusBanner type="error" message={error} onDismiss={() => setError("")} />

        {phase === "setup" && (
          <form className="pe-card" onSubmit={handleStartSimulation}>
            <div className="pe-section-head">
              <h2>Configure GCE Simulation</h2>
              <div className="pe-level-pills">
                {ACADEMIC_LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    className={`pe-level-pill${level === lvl.id ? " active" : ""}`}
                    onClick={() => handleLevelChange(lvl.id)}
                  >
                    {lvl.short}
                  </button>
                ))}
              </div>
            </div>

            <div className="pe-format-grid">
              <button
                type="button"
                className={`pe-format-card${paperType === "paper1" ? " active" : ""}`}
                onClick={() => handlePaperTypeChange("paper1")}
              >
                <strong>Paper 1 · Multiple Choice (MCQ)</strong>
                <span>Timed GCE objective questions drawn from our trained ML corpus</span>
              </button>
              <button
                type="button"
                className={`pe-format-card${paperType === "paper2" ? " active" : ""}`}
                onClick={() => handlePaperTypeChange("paper2")}
              >
                <strong>Paper 2 · Structured / Essay</strong>
                <span>Written structured exam questions with automatic examiner marking</span>
              </button>
              <button
                type="button"
                className={`pe-format-card${paperType === "paper3" ? " active" : ""}`}
                onClick={() => handlePaperTypeChange("paper3")}
              >
                <strong>Paper 3 · Practical / Applied</strong>
                <span>Lab practicals, coding tasks, financial case studies, or critical analysis</span>
              </button>
            </div>

            <div className="pe-form-grid">
              <label className="pe-field">
                <span>GCE Stream</span>
                <select value={stream} onChange={(e) => handleStreamChange(e.target.value)}>
                  {GCE_STREAMS.map((st) => (
                    <option key={st.id} value={st.id}>{st.label}</option>
                  ))}
                </select>
              </label>

              <label className="pe-field">
                <span>Subject ({levelSubjects.length})</span>
                <input
                  type="text"
                  list="gce-subjects"
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  required
                />
                <datalist id="gce-subjects">
                  {levelSubjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.code} · {s.stream}</option>
                  ))}
                </datalist>
              </label>

              <label className="pe-field">
                <span>Syllabus Scope</span>
                <input
                  type="text"
                  list="gce-topics"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Full Syllabus or pick a topic"
                />
                <datalist id="gce-topics">
                  <option value="Full Syllabus" />
                  {availableTopics.map((t) => (
                    <option key={t.id} value={t.title} />
                  ))}
                </datalist>
              </label>

              <label className="pe-field">
                <span>Questions</span>
                <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                  {paperType === "paper1" ? (
                    <>
                      <option value={5}>5 Questions (Quick Drill)</option>
                      <option value={10}>10 Questions (Mini Paper)</option>
                      <option value={15}>15 Questions (Standard)</option>
                      <option value={20}>20 Questions (Full Mock)</option>
                    </>
                  ) : paperType === "paper3" ? (
                    <>
                      <option value={2}>2 Practical / Case Tasks</option>
                      <option value={3}>3 Practical / Case Tasks</option>
                      <option value={4}>4 Practical / Case Tasks</option>
                    </>
                  ) : (
                    <>
                      <option value={3}>3 Structured Questions</option>
                      <option value={4}>4 Structured Questions</option>
                      <option value={5}>5 Structured Questions</option>
                    </>
                  )}
                </select>
              </label>

              <label className="pe-field">
                <span>Timer</span>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                >
                  <option value={10}>10 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                  <option value={0}>Untimed Practice</option>
                </select>
              </label>
            </div>

            <div className="pe-form-actions">
              <button type="submit" className="pe-primary-btn" disabled={loading}>
                {loading ? "Generating GCE Paper…" : "✦ Launch Real-Time GCE Simulation"}
              </button>
            </div>
          </form>
        )}

        {phase === "running" && simulation && currentQuestion && (
          <section className="pe-sim-shell">
            <div className="pe-sim-topbar pe-no-print">
              <div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <span className="pe-mode-pill">{simulation.paperCode}</span>
                  {simulation.engine && (
                    <span className="pe-topic-chip">🤖 {simulation.engine}</span>
                  )}
                </div>
                <h2>
                  {simulation.subject} — {simulation.topic}
                </h2>
              </div>

              <div className="pe-sim-controls-right">
                <div className="pe-tab-bar" role="tablist" aria-label="Exam paper view mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={paperViewMode === "board"}
                    className={`pe-tab-btn${paperViewMode === "board" ? " active" : ""}`}
                    onClick={() => setPaperViewMode("board")}
                  >
                    📄 GCE Paper Format
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={paperViewMode === "focus"}
                    className={`pe-tab-btn${paperViewMode === "focus" ? " active" : ""}`}
                    onClick={() => setPaperViewMode("focus")}
                  >
                    🎯 One-by-One
                  </button>
                </div>

                <button
                  type="button"
                  className="pe-secondary-btn"
                  onClick={() => window.print()}
                >
                  🖨️ Print / PDF
                </button>

                <div className="pe-sim-metrics">
                  {simulation.durationMinutes > 0 && (
                    <div className={`pe-timer-box${secondsLeft <= 120 ? " urgent" : ""}`}>
                      <span>Time Left</span>
                      <strong>{formatTimer(secondsLeft)}</strong>
                    </div>
                  )}
                  <div className="pe-timer-box">
                    <span>Answered</span>
                    <strong>
                      {answeredCount} / {simulation.questions.length}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {paperViewMode === "board" ? (
              /* ── OFFICIAL CAMEROON GCE BOARD EXAMINATION PAPER LAYOUT ── */
              <article className="gce-board-sheet">
                <header className="gce-board-masthead">
                  <div className="gce-board-top-strip">
                    <span>{simulation.gceBoardMeta?.subjectCode || simulation.paperCode}</span>
                    <span>{simulation.gceBoardMeta?.session || "JUNE GCE SIMULATION"}</span>
                  </div>

                  <h1 className="gce-board-org">
                    {simulation.gceBoardMeta?.boardTitle ||
                      "CAMEROON GENERAL CERTIFICATE OF EDUCATION BOARD"}
                  </h1>
                  <p className="gce-board-exam">
                    {simulation.gceBoardMeta?.examTitle ||
                      "General Certificate of Education Examination"}
                  </p>

                  <div className="gce-board-meta-table">
                    <div>
                      <span className="gce-meta-lbl">LEVEL</span>
                      <strong>
                        {simulation.gceBoardMeta?.levelTitle ||
                          (simulation.level === "A-Level" ? "ADVANCED LEVEL" : "ORDINARY LEVEL")}
                      </strong>
                    </div>
                    <div>
                      <span className="gce-meta-lbl">SUBJECT TITLE</span>
                      <strong>
                        {simulation.gceBoardMeta?.subjectTitle ||
                          String(simulation.subject || "").toUpperCase()}
                      </strong>
                    </div>
                    <div>
                      <span className="gce-meta-lbl">SUBJECT CODE</span>
                      <strong>{simulation.gceBoardMeta?.subjectCode || "0500"}</strong>
                    </div>
                    <div>
                      <span className="gce-meta-lbl">PAPER NUMBER</span>
                      <strong>
                        {simulation.gceBoardMeta?.paperNumber ||
                          simulation.paperType.toUpperCase()}
                      </strong>
                    </div>
                    <div>
                      <span className="gce-meta-lbl">TIME ALLOWED</span>
                      <strong>
                        {simulation.durationMinutes > 0
                          ? `${simulation.durationMinutes} MINUTES`
                          : "UNTIMED"}
                      </strong>
                    </div>
                    <div>
                      <span className="gce-meta-lbl">TOTAL MARKS</span>
                      <strong>
                        {simulation.gceBoardMeta?.totalMarks || simulation.questions.length} MARKS
                      </strong>
                    </div>
                  </div>

                  <div className="gce-candidate-strip">
                    <div>
                      <span>Candidate Name:</span>
                      <span className="gce-blank-line" />
                    </div>
                    <div>
                      <span>Centre No.:</span>
                      <span className="gce-blank-line short" />
                    </div>
                    <div>
                      <span>Candidate No.:</span>
                      <span className="gce-blank-line short" />
                    </div>
                  </div>

                  <div className="gce-rubric-box">
                    <h3>
                      {simulation.gceBoardMeta?.paperSubtitle || "INSTRUCTIONS TO CANDIDATES"}
                    </h3>
                    <ul>
                      {(simulation.gceBoardMeta?.rubric || [simulation.instructions]).map(
                        (line, idx) => (
                          <li key={idx}>{line}</li>
                        ),
                      )}
                    </ul>
                  </div>
                </header>

                <div className="gce-paper-body">
                  {simulation.questions.map((q, idx) => {
                    const prevSection = idx > 0 ? simulation.questions[idx - 1]?.section : null;
                    const showSectionBanner = q.section && q.section !== prevSection;

                    return (
                      <div key={q.id} className="gce-paper-q-wrap">
                        {showSectionBanner && (
                          <div className="gce-section-divider">
                            <span>{q.section}</span>
                          </div>
                        )}

                        <div className="gce-paper-question">
                          <div className="gce-paper-q-top">
                            <span className="gce-paper-q-num">{idx + 1}.</span>
                            <div className="gce-paper-q-stem">{q.question_text}</div>
                            <span className="gce-paper-marks">
                              [{simulation.paperType === "paper1" ? "1 mark" : `${q.marks || 6} marks`}]
                            </span>
                          </div>

                          {simulation.paperType === "paper1" ? (
                            <div className="gce-paper-mcq-grid">
                              {q.options.map((opt, optIdx) => {
                                const letter = String.fromCharCode(65 + optIdx);
                                const isSelected = answers[q.id] === opt;
                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    className={`gce-paper-opt${isSelected ? " selected" : ""}`}
                                    onClick={() =>
                                      setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                    }
                                  >
                                    <span className="gce-paper-opt-ltr">{letter}</span>
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="gce-paper-answer-area">
                              <textarea
                                className="gce-paper-lines-input"
                                rows={6}
                                value={answers[q.id] || ""}
                                onChange={(e) =>
                                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                                }
                                placeholder={`Write your answer for Question ${idx + 1} here...`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <footer className="gce-board-footer">
                  <p className="gce-end-notice">
                    END OF EXAMINATION — STOP! GO BACK AND CHECK YOUR WORK.
                  </p>
                  <div className="gce-footer-actions pe-no-print">
                    <button
                      type="button"
                      className="pe-secondary-btn"
                      onClick={() => window.print()}
                    >
                      🖨️ Print / Save Official GCE PDF
                    </button>
                    <button
                      type="button"
                      className="pe-primary-btn"
                      disabled={grading}
                      onClick={handleFinishSimulation}
                    >
                      {grading ? "Grading GCE Script…" : "✓ Submit Examination Script"}
                    </button>
                  </div>
                </footer>
              </article>
            ) : (
              <div className="pe-sim-layout">
                <div className="pe-sim-question-card">
                  <div className="pe-sim-q-meta">
                    <span className="pe-q-badge">
                      Question {currentIndex + 1} of {simulation.questions.length}
                    </span>
                    <div className="pe-sim-q-right">
                      {currentQuestion.topicTag && (
                        <span className="pe-topic-chip">{currentQuestion.topicTag}</span>
                      )}
                      {currentQuestion.marks && (
                        <span className="pe-marks-badge">{currentQuestion.marks} marks</span>
                      )}
                      <button
                        type="button"
                        className={`pe-flag-btn${flagged[currentQuestion.id] ? " active" : ""}`}
                        onClick={() =>
                          setFlagged((prev) => ({
                            ...prev,
                            [currentQuestion.id]: !prev[currentQuestion.id],
                          }))
                        }
                      >
                        {flagged[currentQuestion.id] ? "⚑ Flagged" : "⚐ Flag"}
                      </button>
                    </div>
                  </div>

                  <h3 className="pe-sim-q-text" style={{ whiteSpace: "pre-line" }}>
                    {currentQuestion.question_text}
                  </h3>

                  {simulation.paperType === "paper1" ? (
                    <div className="pe-options-stack">
                      {currentQuestion.options.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isSelected = answers[currentQuestion.id] === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            className={`pe-option-card${isSelected ? " selected" : ""}`}
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, [currentQuestion.id]: opt }))
                            }
                          >
                            <span className="pe-opt-letter">{letter}</span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <textarea
                      className="pe-sim-textarea"
                      rows={7}
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))
                      }
                      placeholder="Write your full structured GCE answer here, showing all steps clearly..."
                    />
                  )}

                  <div className="pe-sim-nav-row">
                    <button
                      type="button"
                      className="pe-secondary-btn"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    >
                      ‹ Previous
                    </button>
                    {currentIndex < simulation.questions.length - 1 ? (
                      <button
                        type="button"
                        className="pe-primary-btn"
                        onClick={() =>
                          setCurrentIndex((i) => Math.min(simulation.questions.length - 1, i + 1))
                        }
                      >
                        Next Question ›
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="pe-primary-btn"
                        disabled={grading}
                        onClick={handleFinishSimulation}
                      >
                        {grading ? "Submitting Paper…" : "Submit Exam Paper"}
                      </button>
                    )}
                  </div>
                </div>

                <aside className="pe-sim-palette">
                  <h4>Question Navigator</h4>
                  <div className="pe-palette-grid">
                    {simulation.questions.map((q, idx) => {
                      const isCurrent = idx === currentIndex;
                      const isDone = String(answers[q.id] || "").trim().length > 0;
                      const isFlag = Boolean(flagged[q.id]);
                      return (
                        <button
                          key={q.id}
                          type="button"
                          className={`pe-palette-dot${isCurrent ? " current" : ""}${isDone ? " answered" : ""}${isFlag ? " flagged" : ""}`}
                          onClick={() => setCurrentIndex(idx)}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pe-palette-legend">
                    <span><i className="dot answered" /> Answered</span>
                    <span><i className="dot flagged" /> Flagged</span>
                  </div>
                  <button
                    type="button"
                    className="pe-primary-btn pe-full-width"
                    disabled={grading}
                    onClick={handleFinishSimulation}
                  >
                    {grading ? "Grading Simulation…" : "Finish & Submit"}
                  </button>
                </aside>
              </div>
            )}
          </section>
        )}

        {phase === "summary" && summary && simulation && (
          <section className="pe-results-section" aria-live="polite">
            <div className="pe-score-summary-card">
              <div
                className={`pe-grade-ring ${
                  summary.percentage >= 70
                    ? "excellent"
                    : summary.percentage >= 50
                      ? "good"
                      : "needs-work"
                }`}
              >
                <span className="pe-grade-letter">{summary.grade}</span>
                <span className="pe-grade-pct">{summary.percentage}%</span>
              </div>
              <div className="pe-score-copy">
                <span className="pe-mode-pill">
                  {simulation.paperCode} · Completed in {formatTimer(summary.timeTaken)}
                </span>
                <h2>
                  You scored {summary.score} / {summary.total}
                </h2>
                <p>
                  {summary.overallSummary ||
                    (summary.percentage >= 70
                      ? "Strong GCE readiness! Review any missed items below to lock in an A grade."
                      : "Good simulation run. Study the explanations below and retake to boost your score.")}
                </p>
                <div className="pe-selected-actions">
                  <button
                    type="button"
                    className="pe-primary-btn"
                    onClick={() => setPhase("setup")}
                  >
                    New GCE Simulation
                  </button>
                  <button
                    type="button"
                    className="pe-secondary-btn"
                    onClick={() => navigate("/learn", { state: { level, subject } })}
                  >
                    Revise {subject} Notes
                  </button>
                </div>
              </div>
            </div>

            <div className="pe-answer-list">
              {summary.paperType === "paper1"
                ? summary.review.map((item, idx) => (
                    <article
                      key={item.id}
                      className={`pe-review-card ${item.isCorrect ? "correct" : "wrong"}`}
                    >
                      <div className="pe-eval-head">
                        <div className="pe-answer-q-head">
                          <span className="pe-q-badge">Q{idx + 1}</span>
                          <h3>{item.question_text}</h3>
                        </div>
                        <span className="pe-verdict-pill">
                          {item.isCorrect ? "✓ Correct" : "✕ Incorrect"}
                        </span>
                      </div>
                      <p className="pe-review-line">
                        <strong>Your answer:</strong> {item.selected || "Unanswered"}
                      </p>
                      {!item.isCorrect && (
                        <p className="pe-review-line correct-text">
                          <strong>Correct answer:</strong> {item.correctAnswer}
                        </p>
                      )}
                      {item.explanation && (
                        <div className="pe-tip-box">
                          <strong>Explanation:</strong> {item.explanation}
                        </div>
                      )}
                    </article>
                  ))
                : summary.evaluations.map((ev, idx) => (
                    <article key={ev.id} className="pe-eval-card">
                      <div className="pe-eval-head">
                        <div className="pe-answer-q-head">
                          <span className="pe-q-badge">Q{idx + 1}</span>
                          <h3>{ev.question}</h3>
                        </div>
                        <span className="pe-score-pill">
                          {ev.score} / {ev.maxMarks} marks
                        </span>
                      </div>
                      <p className="pe-eval-feedback">{ev.feedback}</p>
                      {ev.modelAnswer && (
                        <div className="pe-model-box">
                          <h4>Model Answer</h4>
                          <p className="pe-preserve-lines">{ev.modelAnswer}</p>
                        </div>
                      )}
                    </article>
                  ))}
            </div>
          </section>
        )}
      </main>

      <ExamModeModal
        isOpen={modeModalOpen}
        onClose={() => setModeModalOpen(false)}
        routeState={{ level, subject, topic }}
      />
    </div>
  );
}

export default PreGcePage;
