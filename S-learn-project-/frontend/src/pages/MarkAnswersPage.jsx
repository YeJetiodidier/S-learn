import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatusBanner from "../components/StatusBanner";
import ExamModeModal from "../components/ExamModeModal";
import { MarkAnswersIcon } from "../components/ExamModeIcons";
import {
  ACADEMIC_LEVELS,
  GCE_STREAMS,
  getSubjectsForLevel,
  getTopicsForSubject,
} from "../data/syllabusCatalog";
import { backendRequest } from "../firebase/apiClient";
import { recordExamProgress } from "../firebase/dataService";
import { getFriendlyErrorMessage } from "../utils/friendlyError";
import "../dashboard.css";
import "./exam.css";

function MarkAnswersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [level, setLevel] = useState(location.state?.level || "O-Level");
  const [stream, setStream] = useState(location.state?.stream || "All");
  const levelSubjects = getSubjectsForLevel(level, stream);
  const [subject, setSubject] = useState(
    location.state?.subject || levelSubjects[0]?.name || "Accounting",
  );
  const availableTopics = getTopicsForSubject(level, subject);
  const [topic, setTopic] = useState(
    location.state?.topic || availableTopics[0]?.title || "",
  );
  const [workflowTab, setWorkflowTab] = useState("guided"); // "guided" | "custom"
  const [questionCount, setQuestionCount] = useState(3);

  const [guidedEntries, setGuidedEntries] = useState([]);
  const [customEntries, setCustomEntries] = useState([
    { id: "custom-1", question: "", studentAnswer: "", maxMarks: 5 },
  ]);

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [modeModalOpen, setModeModalOpen] = useState(false);

  const handleLevelChange = (nextLevel) => {
    setLevel(nextLevel);
    const nextSubjects = getSubjectsForLevel(nextLevel, stream);
    const nextSubject = nextSubjects[0]?.name || "";
    setSubject(nextSubject);
    const nextTopics = getTopicsForSubject(nextLevel, nextSubject);
    setTopic(nextTopics[0]?.title || "");
  };

  const handleStreamChange = (nextStream) => {
    setStream(nextStream);
    const nextSubjects = getSubjectsForLevel(level, nextStream);
    const nextSubject = nextSubjects[0]?.name || "";
    setSubject(nextSubject);
    const nextTopics = getTopicsForSubject(level, nextSubject);
    setTopic(nextTopics[0]?.title || "");
  };

  const handleSubjectChange = (nextSubject) => {
    setSubject(nextSubject);
    const nextTopics = getTopicsForSubject(level, nextSubject);
    setTopic(nextTopics[0]?.title || "");
  };

  const handleGenerateQuestions = async (event) => {
    event.preventDefault();
    if (!subject.trim()) {
      setError("Please select a subject first.");
      return;
    }
    setError("");
    setReport(null);
    setLoadingQuestions(true);
    try {
      const data = await backendRequest("/api/exam/mark-questions", {
        method: "POST",
        body: {
          level,
          subject: subject.trim(),
          topic: topic.trim() || "Core Syllabus",
          count: Number(questionCount) || 3,
        },
      });
      const qs = (data?.questions || []).map((q, idx) => ({
        id: q.id || `g-${idx + 1}`,
        question: q.question,
        maxMarks: q.marks || 4,
        hint: q.hint || "",
        studentAnswer: "",
      }));
      setGuidedEntries(qs);
    } catch (err) {
      console.error(err);
      setError(
        getFriendlyErrorMessage(err, "We couldn't generate exam questions right now."),
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  const updateGuidedAnswer = (id, value) => {
    setGuidedEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, studentAnswer: value } : item)),
    );
  };

  const updateCustomEntry = (id, field, value) => {
    setCustomEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const addCustomRow = () => {
    setCustomEntries((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, question: "", studentAnswer: "", maxMarks: 5 },
    ]);
  };

  const removeCustomRow = (id) => {
    setCustomEntries((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const handleMarkSubmit = async (event) => {
    event.preventDefault();
    const activeList = workflowTab === "guided" ? guidedEntries : customEntries;
    const valid = activeList.filter((item) => item.question.trim());
    if (!valid.length) {
      setError("Please enter at least one question and your written answer.");
      return;
    }

    setError("");
    setMarking(true);
    try {
      const data = await backendRequest("/api/exam/mark-answers", {
        method: "POST",
        body: {
          level,
          subject: subject.trim() || "General",
          topic: topic.trim() || "General",
          entries: valid,
        },
      });
      setReport(data);

      // Persist score to S-Learn progress tracker (best-effort)
      if (data?.totalMax > 0) {
        recordExamProgress({
          subject: subject.trim() || "General",
          topic: topic.trim() || "AI Marked Practice",
          score: data.totalScore,
          total: data.totalMax,
        }).catch(() => {});
      }
    } catch (err) {
      console.error(err);
      setError(
        getFriendlyErrorMessage(err, "We couldn't mark your answers right now. Please try again."),
      );
    } finally {
      setMarking(false);
    }
  };

  const gradeClass = (grade) => {
    if (grade === "A" || grade === "B") return "excellent";
    if (grade === "C" || grade === "D") return "good";
    return "needs-work";
  };

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

          <div className="pe-hero-card">
            <span className="exam-mode-icon-box pe-hero-icon">
              <MarkAnswersIcon />
            </span>
            <div>
              <span className="pe-mode-pill">Exam Mode · AI Marking & Feedback</span>
              <h1 className="pe-page-title">Mark My Answers</h1>
              <p className="pe-hero-sub">
                Answer structured syllabus questions—or paste your own exam answers—and get
                instant AI scoring, missing marking-point analysis, and exam-standard model replies.
              </p>
            </div>
          </div>
        </div>

        <StatusBanner type="error" message={error} onDismiss={() => setError("")} />

        <div className="pe-card">
          <div className="pe-section-head">
            <div className="pe-tab-bar" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={workflowTab === "guided"}
                className={`pe-tab-btn${workflowTab === "guided" ? " active" : ""}`}
                onClick={() => setWorkflowTab("guided")}
              >
                Guided Exam Questions
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={workflowTab === "custom"}
                className={`pe-tab-btn${workflowTab === "custom" ? " active" : ""}`}
                onClick={() => setWorkflowTab("custom")}
              >
                Paste My Own Q&amp;A
              </button>
            </div>

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
                list="mark-subjects"
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                placeholder="Select or type subject"
              />
              <datalist id="mark-subjects">
                {levelSubjects.map((s) => (
                  <option key={s.id} value={s.name}>{s.code} · {s.stream}</option>
                ))}
              </datalist>
            </label>

            <label className="pe-field">
              <span>Topic</span>
              <input
                type="text"
                list="mark-topics"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Accounting Environment"
              />
              <datalist id="mark-topics">
                {availableTopics.map((t) => (
                  <option key={t.id} value={t.title} />
                ))}
              </datalist>
            </label>

            {workflowTab === "guided" && (
              <label className="pe-field">
                <span>Questions</span>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                >
                  <option value={2}>2 Questions</option>
                  <option value={3}>3 Questions</option>
                  <option value={4}>4 Questions</option>
                  <option value={5}>5 Questions</option>
                </select>
              </label>
            )}
          </div>

          {workflowTab === "guided" ? (
            <div className="pe-guided-wrap">
              <div className="pe-form-actions">
                <button
                  type="button"
                  className="pe-primary-btn"
                  disabled={loadingQuestions}
                  onClick={handleGenerateQuestions}
                >
                  {loadingQuestions
                    ? "Generating Structured Questions…"
                    : guidedEntries.length
                      ? "↻ Generate New Question Set"
                      : "✦ Generate Questions to Answer"}
                </button>
              </div>

              {guidedEntries.length > 0 && (
                <form className="pe-qa-form" onSubmit={handleMarkSubmit}>
                  {guidedEntries.map((item, idx) => (
                    <div key={item.id} className="pe-qa-card">
                      <div className="pe-qa-card-head">
                        <span className="pe-q-badge">Q{idx + 1}</span>
                        <h3>{item.question}</h3>
                        <span className="pe-marks-badge">{item.maxMarks} marks</span>
                      </div>
                      {item.hint && <p className="pe-qa-hint">💡 Hint: {item.hint}</p>}
                      <textarea
                        rows={4}
                        value={item.studentAnswer}
                        onChange={(e) => updateGuidedAnswer(item.id, e.target.value)}
                        placeholder="Write your exam answer clearly here..."
                      />
                    </div>
                  ))}
                  <div className="pe-form-actions">
                    <button type="submit" className="pe-primary-btn" disabled={marking}>
                      {marking ? "AI Examiner is Marking…" : "✓ Submit & Mark My Answers"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form className="pe-qa-form" onSubmit={handleMarkSubmit}>
              {customEntries.map((item, idx) => (
                <div key={item.id} className="pe-qa-card">
                  <div className="pe-qa-custom-top">
                    <span className="pe-q-badge">Question {idx + 1}</span>
                    <div className="pe-qa-custom-controls">
                      <label className="pe-inline-marks">
                        <span>Max Marks</span>
                        <input
                          type="number"
                          min={1}
                          max={25}
                          value={item.maxMarks}
                          onChange={(e) =>
                            updateCustomEntry(item.id, "maxMarks", Number(e.target.value) || 1)
                          }
                        />
                      </label>
                      {customEntries.length > 1 && (
                        <button
                          type="button"
                          className="pe-ghost-btn"
                          onClick={() => removeCustomRow(item.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <label className="pe-field">
                    <span>Exam Question</span>
                    <textarea
                      rows={2}
                      value={item.question}
                      onChange={(e) => updateCustomEntry(item.id, "question", e.target.value)}
                      placeholder="Paste or type the exam question..."
                      required
                    />
                  </label>
                  <label className="pe-field">
                    <span>Your Answer</span>
                    <textarea
                      rows={4}
                      value={item.studentAnswer}
                      onChange={(e) =>
                        updateCustomEntry(item.id, "studentAnswer", e.target.value)
                      }
                      placeholder="Write or paste your answer to be scored and analysed..."
                    />
                  </label>
                </div>
              ))}

              <div className="pe-form-actions">
                <button type="button" className="pe-secondary-btn" onClick={addCustomRow}>
                  + Add Another Question
                </button>
                <button type="submit" className="pe-primary-btn" disabled={marking}>
                  {marking ? "AI Examiner is Marking…" : "✓ Mark My Answers"}
                </button>
              </div>
            </form>
          )}
        </div>

        {report && (
          <section className="pe-results-section" aria-live="polite">
            <div className="pe-score-summary-card">
              <div className={`pe-grade-ring ${gradeClass(report.grade)}`}>
                <span className="pe-grade-letter">{report.grade}</span>
                <span className="pe-grade-pct">{report.percentage}%</span>
              </div>
              <div className="pe-score-copy">
                <span className="pe-mode-pill">
                  AI Examiner Report · {report.totalScore} / {report.totalMax} Marks
                </span>
                <h2>Performance Analysis</h2>
                <p>{report.overallSummary}</p>
                {report.studyRecommendations?.length > 0 && (
                  <ul className="pe-reco-list">
                    {report.studyRecommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="pe-answer-list">
              {report.evaluations.map((ev, idx) => (
                <article key={ev.id} className="pe-eval-card">
                  <div className="pe-eval-head">
                    <div className="pe-answer-q-head">
                      <span className="pe-q-badge">Q{idx + 1}</span>
                      <h3>{ev.question}</h3>
                    </div>
                    <div className="pe-answer-meta">
                      <span className="pe-score-pill">
                        {ev.score} / {ev.maxMarks} marks
                      </span>
                      <span className="pe-verdict-pill">{ev.verdict}</span>
                    </div>
                  </div>

                  <div className="pe-student-quote">
                    <strong>Your Answer:</strong>
                    <p>{ev.studentAnswer || <em>No answer submitted.</em>}</p>
                  </div>

                  <p className="pe-eval-feedback">{ev.feedback}</p>

                  <div className="pe-eval-columns">
                    <div className="pe-eval-col strengths">
                      <h4>✓ What You Got Right</h4>
                      {ev.strengths?.length ? (
                        <ul>
                          {ev.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="pe-muted-small">No full credit points detected yet.</p>
                      )}
                    </div>
                    <div className="pe-eval-col gaps">
                      <h4>⚠ Missing Points &amp; Improvements</h4>
                      {ev.missingPoints?.length ? (
                        <ul>
                          {ev.missingPoints.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="pe-muted-small">All key marking points covered!</p>
                      )}
                    </div>
                  </div>

                  {ev.modelAnswer && (
                    <div className="pe-model-box">
                      <h4>Full-Marks Model Answer</h4>
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

export default MarkAnswersPage;
