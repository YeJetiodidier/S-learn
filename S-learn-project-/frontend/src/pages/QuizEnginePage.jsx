import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatusBanner from "../components/StatusBanner";
import ExamModeModal from "../components/ExamModeModal";
import { QuizEngineIcon } from "../components/ExamModeIcons";
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

const SEEN_STORAGE_KEY = "slearn_quiz_seen_stems_v1";

const loadSeenQuestions = (key) => {
  try {
    const raw = JSON.parse(sessionStorage.getItem(SEEN_STORAGE_KEY) || "{}");
    return Array.isArray(raw[key]) ? raw[key] : [];
  } catch {
    return [];
  }
};

const saveSeenQuestions = (key, stems) => {
  try {
    const raw = JSON.parse(sessionStorage.getItem(SEEN_STORAGE_KEY) || "{}");
    const existing = Array.isArray(raw[key]) ? raw[key] : [];
    raw[key] = [...new Set([...existing, ...stems])].slice(-60);
    sessionStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(raw));
  } catch {
    // ignore storage errors
  }
};

function QuizEnginePage() {
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
    location.state?.topic || availableTopics[0]?.title || "General",
  );
  const [difficulty, setDifficulty] = useState("standard");
  const [count, setCount] = useState(8);
  const [instantFeedback, setInstantFeedback] = useState(true);

  const [phase, setPhase] = useState("setup"); // "setup" | "playing" | "done"
  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modeModalOpen, setModeModalOpen] = useState(false);

  const handleLevelChange = (nextLevel) => {
    setLevel(nextLevel);
    const nextSubjects = getSubjectsForLevel(nextLevel, stream);
    const nextSub = nextSubjects[0]?.name || "";
    setSubject(nextSub);
    const nextTopics = getTopicsForSubject(nextLevel, nextSub);
    setTopic(nextTopics[0]?.title || "General");
  };

  const handleStreamChange = (nextStream) => {
    setStream(nextStream);
    const nextSubjects = getSubjectsForLevel(level, nextStream);
    const nextSub = nextSubjects[0]?.name || "";
    setSubject(nextSub);
    const nextTopics = getTopicsForSubject(level, nextSub);
    setTopic(nextTopics[0]?.title || "General");
  };

  const handleSubjectChange = (nextSub) => {
    setSubject(nextSub);
    const nextTopics = getTopicsForSubject(level, nextSub);
    setTopic(nextTopics[0]?.title || "General");
  };

  const launchFreshQuiz = async (event) => {
    if (event) event.preventDefault();
    if (!subject.trim()) {
      setError("Please select a subject to draw a fresh syllabus quiz.");
      return;
    }

    setError("");
    setLoading(true);
    const historyKey = `${level}::${subject.trim().toLowerCase()}::${topic.trim().toLowerCase()}`;
    const seen = loadSeenQuestions(historyKey);

    try {
      const papers = await getPapers().catch(() => []);
      const data = await backendRequest("/api/exam/quiz-engine", {
        method: "POST",
        body: {
          level,
          subject: subject.trim(),
          topic: topic.trim() || "General",
          difficulty,
          count: Number(count) || 8,
          excludeQuestions: seen,
          papers: Array.isArray(papers) ? papers.slice(0, 20) : [],
        },
      });
      const questions = data?.questions || [];
      if (!questions.length) {
        throw new Error("No quiz questions were returned. Please try again.");
      }
      saveSeenQuestions(
        historyKey,
        questions.map((q) => q.question_text),
      );
      setQuiz(data);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setStreak(0);
      setBestStreak(0);
      setPhase("playing");
    } catch (err) {
      console.error(err);
      setError(
        getFriendlyErrorMessage(
          err,
          "We couldn't generate a fresh quiz right now. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = quiz?.questions?.[currentIndex] || null;
  const currentChoice = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;

  const handleSelectOption = (option) => {
    if (!currentQuestion) return;
    if (instantFeedback && currentChoice !== undefined) return;

    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
    if (instantFeedback) {
      if (option === currentQuestion.answer) {
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
      } else {
        setStreak(0);
      }
    }
  };

  const handleNextOrFinish = () => {
    if (!quiz) return;
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    const total = quiz.questions.length;
    const score = quiz.questions.filter((q) => selectedAnswers[q.id] === q.answer).length;
    setPhase("done");
    recordExamProgress({
      subject: quiz.subject,
      topic: quiz.topic || "Quiz Engine",
      score,
      total,
    }).catch(() => {});
  };

  const totalQuestions = quiz?.questions?.length || 0;
  const finalScore = quiz
    ? quiz.questions.filter((q) => selectedAnswers[q.id] === q.answer).length
    : 0;
  const finalPct = totalQuestions > 0 ? Math.round((finalScore / totalQuestions) * 100) : 0;

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
                <QuizEngineIcon />
              </span>
              <div>
                <span className="pe-mode-pill">Exam Mode · Fresh Syllabus Drills</span>
                <h1 className="pe-page-title">Quiz Engine</h1>
                <p className="pe-hero-sub">
                  Every quiz is drawn fresh directly from the syllabus—no repeats, no static
                  question bank. Track streaks and learn immediately from clear explanations.
                </p>
              </div>
            </div>
          )}
        </div>

        <StatusBanner type="error" message={error} onDismiss={() => setError("")} />

        {phase === "setup" && (
          <form className="pe-card" onSubmit={launchFreshQuiz}>
            <div className="pe-section-head">
              <h2>Draw a Fresh Syllabus Quiz</h2>
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
                  list="quiz-subjects"
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  required
                />
                <datalist id="quiz-subjects">
                  {levelSubjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.code} · {s.stream}</option>
                  ))}
                </datalist>
              </label>

              <label className="pe-field">
                <span>Syllabus Topic</span>
                <input
                  type="text"
                  list="quiz-topics"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter or pick a syllabus topic"
                  required
                />
                <datalist id="quiz-topics">
                  {availableTopics.map((t) => (
                    <option key={t.id} value={t.title} />
                  ))}
                </datalist>
              </label>

              <label className="pe-field">
                <span>Difficulty</span>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="foundational">Foundational</option>
                  <option value="standard">Standard GCE</option>
                  <option value="challenging">Challenging / Distinction</option>
                </select>
              </label>

              <label className="pe-field">
                <span>Questions</span>
                <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                  <option value={5}>5 Fresh Questions</option>
                  <option value={8}>8 Fresh Questions</option>
                  <option value={10}>10 Fresh Questions</option>
                  <option value={15}>15 Fresh Questions</option>
                </select>
              </label>
            </div>

            {availableTopics.length > 0 && (
              <div className="pe-quick-topics">
                <span className="pe-quick-label">Quick-pick syllabus topics:</span>
                <div className="pe-pill-wrap">
                  {availableTopics.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`pe-concept-pill${topic === t.title ? " active" : ""}`}
                      onClick={() => setTopic(t.title)}
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="pe-checkbox-row">
              <input
                type="checkbox"
                checked={instantFeedback}
                onChange={(e) => setInstantFeedback(e.target.checked)}
              />
              <span>Show instant explanation &amp; streak feedback after each question</span>
            </label>

            <div className="pe-form-actions">
              <button type="submit" className="pe-primary-btn" disabled={loading}>
                {loading ? "Drawing Fresh Syllabus Questions…" : "✦ Start Fresh Quiz"}
              </button>
            </div>
          </form>
        )}

        {phase === "playing" && quiz && currentQuestion && (
          <section className="pe-card pe-quiz-runner">
            <div className="pe-quiz-head">
              <div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <span className="pe-mode-pill">
                    {quiz.level} · {quiz.subject} · {quiz.difficulty}
                  </span>
                  {quiz.engine && <span className="pe-topic-chip">🤖 {quiz.engine}</span>}
                </div>
                <h2>{quiz.quizTitle}</h2>
              </div>
              <div className="pe-quiz-stats">
                {instantFeedback && (
                  <span className="pe-streak-badge">🔥 Streak: {streak}</span>
                )}
                <span className="pe-q-badge">
                  {currentIndex + 1} / {totalQuestions}
                </span>
              </div>
            </div>

            <div className="pe-progress-track">
              <div
                className="pe-progress-fill"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            {currentQuestion.concept && (
              <span className="pe-topic-chip">Concept: {currentQuestion.concept}</span>
            )}

            <h3 className="pe-sim-q-text">{currentQuestion.question_text}</h3>

            <div className="pe-options-stack">
              {currentQuestion.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = currentChoice === opt;
                const isRevealed = instantFeedback && currentChoice !== undefined;
                const isCorrectOpt = opt === currentQuestion.answer;

                let stateClass = "";
                if (isRevealed) {
                  if (isCorrectOpt) stateClass = " correct";
                  else if (isSelected) stateClass = " wrong";
                } else if (isSelected) {
                  stateClass = " selected";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    className={`pe-option-card${stateClass}`}
                    onClick={() => handleSelectOption(opt)}
                  >
                    <span className="pe-opt-letter">{letter}</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {instantFeedback && currentChoice !== undefined && (
              <div
                className={`pe-feedback-banner ${
                  currentChoice === currentQuestion.answer ? "correct" : "wrong"
                }`}
              >
                <strong>
                  {currentChoice === currentQuestion.answer
                    ? "✓ Spot on!"
                    : `✕ Correct answer: ${currentQuestion.answer}`}
                </strong>
                {currentQuestion.explanation && <p>{currentQuestion.explanation}</p>}
              </div>
            )}

            <div className="pe-sim-nav-row">
              <button
                type="button"
                className="pe-ghost-btn"
                onClick={() => setPhase("setup")}
              >
                Exit Quiz
              </button>
              <button
                type="button"
                className="pe-primary-btn"
                disabled={currentChoice === undefined}
                onClick={handleNextOrFinish}
              >
                {currentIndex < totalQuestions - 1 ? "Next Question ›" : "View Quiz Results"}
              </button>
            </div>
          </section>
        )}

        {phase === "done" && quiz && (
          <section className="pe-results-section" aria-live="polite">
            <div className="pe-score-summary-card">
              <div
                className={`pe-grade-ring ${
                  finalPct >= 75 ? "excellent" : finalPct >= 50 ? "good" : "needs-work"
                }`}
              >
                <span className="pe-grade-pct">{finalPct}%</span>
                <span className="pe-grade-sub">
                  {finalScore}/{totalQuestions}
                </span>
              </div>
              <div className="pe-score-copy">
                <span className="pe-mode-pill">
                  Quiz Complete {bestStreak > 1 ? `· Best Streak 🔥 ${bestStreak}` : ""}
                </span>
                <h2>{quiz.quizTitle}</h2>
                <p>
                  {finalPct >= 80
                    ? "Outstanding mastery! Ready for a brand-new non-repeating set or a Pre-GCE simulation?"
                    : "Solid work! Review the syllabus explanations below, then draw another fresh quiz."}
                </p>
                <div className="pe-selected-actions">
                  <button
                    type="button"
                    className="pe-primary-btn"
                    disabled={loading}
                    onClick={() => launchFreshQuiz()}
                  >
                    {loading ? "Drawing Fresh Set…" : "✦ Draw Another Fresh Quiz (No Repeats)"}
                  </button>
                  <button
                    type="button"
                    className="pe-secondary-btn"
                    onClick={() => setPhase("setup")}
                  >
                    Change Topic
                  </button>
                  <button
                    type="button"
                    className="pe-secondary-btn"
                    onClick={() => navigate("/learn", { state: { level, subject } })}
                  >
                    Study Notes
                  </button>
                </div>
              </div>
            </div>

            <div className="pe-answer-list">
              {quiz.questions.map((q, idx) => {
                const picked = selectedAnswers[q.id];
                const ok = picked === q.answer;
                return (
                  <article key={q.id} className={`pe-review-card ${ok ? "correct" : "wrong"}`}>
                    <div className="pe-eval-head">
                      <div className="pe-answer-q-head">
                        <span className="pe-q-badge">Q{idx + 1}</span>
                        <h3>{q.question_text}</h3>
                      </div>
                      <span className="pe-verdict-pill">{ok ? "✓ Correct" : "✕ Missed"}</span>
                    </div>
                    <p className="pe-review-line">
                      <strong>Your answer:</strong> {picked || "Unanswered"}
                    </p>
                    {!ok && (
                      <p className="pe-review-line correct-text">
                        <strong>Correct answer:</strong> {q.answer}
                      </p>
                    )}
                    {q.explanation && (
                      <div className="pe-tip-box">
                        <strong>Syllabus Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </article>
                );
              })}
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

export default QuizEnginePage;
