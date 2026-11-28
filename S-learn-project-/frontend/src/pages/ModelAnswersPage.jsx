import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatusBanner from "../components/StatusBanner";
import ExamModeModal from "../components/ExamModeModal";
import { RobotIcon } from "../components/ExamModeIcons";
import { ACADEMIC_LEVELS, GCE_STREAMS, getSubjectsForLevel } from "../data/syllabusCatalog";
import { backendFormRequest } from "../firebase/apiClient";
import { getPapers } from "../firebase/dataService";
import { getFriendlyErrorMessage } from "../utils/friendlyError";
import "../dashboard.css";
import "./exam.css";

function ModelAnswersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [level, setLevel] = useState(location.state?.level || "O-Level");
  const [stream, setStream] = useState(location.state?.stream || "All");
  const levelSubjects = getSubjectsForLevel(level, stream);
  const [subject, setSubject] = useState(
    location.state?.subject || levelSubjects[0]?.name || "Accounting",
  );
  const [paperTitle, setPaperTitle] = useState("");
  const [questionsText, setQuestionsText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [savedPapers, setSavedPapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState(null);
  const [expandedIds, setExpandedIds] = useState({});
  const [modeModalOpen, setModeModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getPapers()
      .then((list) => {
        if (active && Array.isArray(list)) setSavedPapers(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleLevelChange = (nextLevel) => {
    setLevel(nextLevel);
    const nextList = getSubjectsForLevel(nextLevel, stream);
    if (!nextList.some((s) => s.name === subject)) {
      setSubject(nextList[0]?.name || "");
    }
  };

  const handleStreamChange = (nextStream) => {
    setStream(nextStream);
    const nextList = getSubjectsForLevel(level, nextStream);
    if (!nextList.some((s) => s.name === subject)) {
      setSubject(nextList[0]?.name || "");
    }
  };

  const handlePickSavedPaper = (id) => {
    setSelectedPaperId(id);
    const found = savedPapers.find((p) => String(p.id) === String(id));
    if (found) {
      if (found.subject) setSubject(found.subject);
      setPaperTitle(
        [found.paper_name || found.title, found.year].filter(Boolean).join(" · "),
      );
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Please upload a file smaller than 10 MB.");
      return;
    }
    setError("");
    setSelectedFile(file);
    if (!paperTitle) {
      setPaperTitle(file.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!subject.trim() && !selectedFile && !questionsText.trim()) {
      setError("Select a subject, upload an exam paper, or paste questions to continue.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("level", level);
      formData.append("subject", subject.trim() || "General");
      formData.append("paperTitle", paperTitle.trim());
      formData.append("questionsText", questionsText.trim());
      if (selectedFile) {
        formData.append("paper", selectedFile);
      }

      const data = await backendFormRequest("/api/exam/model-answers", formData);
      setResult(data);
      const openMap = {};
      (data?.items || []).forEach((item) => {
        openMap[item.id] = true;
      });
      setExpandedIds(openMap);
    } catch (err) {
      console.error(err);
      setError(
        getFriendlyErrorMessage(
          err,
          "We couldn't generate model answers right now. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = async () => {
    if (!result?.items?.length) return;
    const formatted = [
      `${result.paperTitle} (${result.level} ${result.subject})`,
      result.paperSummary,
      "",
      ...result.items.map(
        (item) =>
          `Q${item.questionNumber} [${item.marks} marks]: ${item.question}\n\nModel Answer:\n${item.modelAnswer}\n\nMarking Points:\n${item.markingPoints.map((p) => `- ${p}`).join("\n")}\n\nExaminer Tip: ${item.examinerTip}`,
      ),
    ].join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Could not copy automatically. You can still print or select text directly.");
    }
  };

  const toggleItem = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
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
              <RobotIcon />
            </span>
            <div>
              <span className="pe-mode-pill">Exam Mode · Model Solutions</span>
              <h1 className="pe-page-title">Get Model Answers</h1>
              <p className="pe-hero-sub">
                Upload a past paper (PDF, image, or text) or paste questions to receive
                GCE exam-standard solutions, marking scheme breakdowns, and examiner tips.
              </p>
            </div>
          </div>
        </div>

        <StatusBanner type="error" message={error} onDismiss={() => setError("")} />

        <form className="pe-card" onSubmit={handleGenerate}>
          <div className="pe-section-head">
            <h2>1. Paper Details & Upload</h2>
            <div className="pe-level-pills" role="group" aria-label="Select exam level">
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
              <span>Subject ({levelSubjects.length} GCE subjects)</span>
              <input
                type="text"
                list="ma-subjects"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Accounting, Chemistry, Philosophy"
                required
              />
              <datalist id="ma-subjects">
                {levelSubjects.map((s) => (
                  <option key={s.id} value={s.name}>{s.code} · {s.stream}</option>
                ))}
              </datalist>
            </label>

            <label className="pe-field">
              <span>Paper Title / Session (optional)</span>
              <input
                type="text"
                value={paperTitle}
                onChange={(e) => setPaperTitle(e.target.value)}
                placeholder="e.g. GCE June 2024 Paper 2"
              />
            </label>
          </div>

          {savedPapers.length > 0 && (
            <label className="pe-field">
              <span>Or pick from S-Learn Past Papers (optional)</span>
              <select
                value={selectedPaperId}
                onChange={(e) => handlePickSavedPaper(e.target.value)}
              >
                <option value="">-- Choose an approved past paper --</option>
                {savedPapers.slice(0, 40).map((p) => (
                  <option key={p.id} value={p.id}>
                    {[p.subject, p.paper_name || p.title, p.level, p.year]
                      .filter(Boolean)
                      .join(" · ")}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="pe-upload-zone">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
              className="pe-file-hidden"
              onChange={handleFileChange}
            />
            <div className="pe-upload-inner">
              <span className="pe-upload-emoji" aria-hidden="true">📄</span>
              <div>
                <strong>
                  {selectedFile ? selectedFile.name : "Upload Exam Paper (PDF, Image, or TXT)"}
                </strong>
                <p>
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB ready for analysis`
                    : "Supports photos of question papers, PDF scripts, or plain text (max 10 MB)"}
                </p>
              </div>
              <div className="pe-upload-btns">
                <button
                  type="button"
                  className="pe-secondary-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? "Change File" : "Browse File"}
                </button>
                {selectedFile && (
                  <button
                    type="button"
                    className="pe-ghost-btn"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <label className="pe-field">
            <span>Paste Exam Questions (optional — great for specific questions)</span>
            <textarea
              rows={5}
              value={questionsText}
              onChange={(e) => setQuestionsText(e.target.value)}
              placeholder={"Paste one or more questions here, e.g.\n1(a) Define double entry bookkeeping. [2 marks]\n1(b) Distinguish between capital and revenue expenditure with examples. [6 marks]"}
            />
          </label>

          <div className="pe-form-actions">
            <button type="submit" className="pe-primary-btn" disabled={loading}>
              {loading ? "Generating Exam-Standard Answers…" : "✦ Get Model Answers"}
            </button>
          </div>
        </form>

        {result && (
          <section className="pe-results-section" aria-live="polite">
            <div className="pe-result-banner">
              <div>
                <span className="pe-mode-pill">
                  {result.level} · {result.subject} · {result.totalMarks} Marks Total
                </span>
                <h2>{result.paperTitle}</h2>
                <p>{result.paperSummary}</p>
              </div>
              <div className="pe-result-tools">
                <button type="button" className="pe-secondary-btn" onClick={handleCopyAll}>
                  {copied ? "✓ Copied" : "Copy All"}
                </button>
                <button
                  type="button"
                  className="pe-secondary-btn"
                  onClick={() => window.print()}
                >
                  Print / Save PDF
                </button>
              </div>
            </div>

            <div className="pe-answer-list">
              {result.items.map((item) => {
                const isOpen = Boolean(expandedIds[item.id]);
                return (
                  <article key={item.id} className="pe-answer-card">
                    <button
                      type="button"
                      className="pe-answer-toggle"
                      aria-expanded={isOpen}
                      onClick={() => toggleItem(item.id)}
                    >
                      <div className="pe-answer-q-head">
                        <span className="pe-q-badge">Q{item.questionNumber}</span>
                        <h3>{item.question}</h3>
                      </div>
                      <div className="pe-answer-meta">
                        <span className="pe-marks-badge">{item.marks} marks</span>
                        <span className="pe-chevron">{isOpen ? "▲" : "▼"}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="pe-answer-body">
                        <div className="pe-answer-block">
                          <h4>Exam-Standard Model Answer</h4>
                          <p className="pe-preserve-lines">{item.modelAnswer}</p>
                        </div>

                        {item.markingPoints?.length > 0 && (
                          <div className="pe-marking-box">
                            <h4>Marking Scheme Breakdown</h4>
                            <ul>
                              {item.markingPoints.map((pt, i) => (
                                <li key={i}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.examinerTip && (
                          <div className="pe-tip-box">
                            <strong>Examiner Tip:</strong> {item.examinerTip}
                          </div>
                        )}
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
        routeState={{ level, subject }}
      />
    </div>
  );
}

export default ModelAnswersPage;
