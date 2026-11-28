import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatusBanner from "../components/StatusBanner";
import ExamModeModal from "../components/ExamModeModal";
import { ACADEMIC_LEVELS, GCE_STREAMS, getSubjectsForLevel } from "../data/syllabusCatalog";
import { backendRequest } from "../firebase/apiClient";
import { getFriendlyErrorMessage } from "../utils/friendlyError";
import "../dashboard.css";
import "./learn.css";

const NOTES_CACHE_KEY = "slearn_generated_notes_v1";

const loadNotesCache = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTES_CACHE_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
};

const persistNotesCache = (cache) => {
  try {
    localStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage quota errors
  }
};

const SparkleSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
  </svg>
);

function LearningPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialLevel = location.state?.level || "O-Level";
  const initialSubjectName = location.state?.subject || "";

  const [level, setLevel] = useState(initialLevel);
  const [stream, setStream] = useState(location.state?.stream || "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [notesCache, setNotesCache] = useState(() => loadNotesCache());
  const [selectedSubjectId, setSelectedSubjectId] = useState(() => {
    if (!initialSubjectName) return null;
    const match = getSubjectsForLevel(initialLevel).find(
      (s) => s.name.toLowerCase() === initialSubjectName.toLowerCase(),
    );
    return match ? match.id : null;
  });

  const [collapsedModules, setCollapsedModules] = useState({});
  const [activeNotesKey, setActiveNotesKey] = useState(null);
  const [activeTopicMeta, setActiveTopicMeta] = useState(null);
  const [generatingKey, setGeneratingKey] = useState(null);
  const [revealedChecks, setRevealedChecks] = useState({});
  const [error, setError] = useState("");
  const [modeModalOpen, setModeModalOpen] = useState(false);

  // Custom topic generator state
  const [customOpen, setCustomOpen] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [customTopic, setCustomTopic] = useState("");

  // Trained ML Study Assistant state
  const [assistQuery, setAssistQuery] = useState("");
  const [assistLoading, setAssistLoading] = useState(false);
  const [assistResult, setAssistResult] = useState(null);
  const [revealedAssistAnswers, setRevealedAssistAnswers] = useState({});

  const subjectsForLevel = useMemo(() => getSubjectsForLevel(level, "All"), [level]);

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subjectsForLevel.filter((s) => {
      if (stream !== "All" && s.stream !== stream) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.stream.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.papers || []).some((p) => p.toLowerCase().includes(q)) ||
        s.modules.some((m) =>
          m.sections.some((sec) =>
            sec.topics.some(
              (t) =>
                t.title.toLowerCase().includes(q) ||
                t.concepts.some((c) => c.toLowerCase().includes(q)),
            ),
          ),
        )
      );
    });
  }, [subjectsForLevel, stream, searchQuery]);

  const selectedSubject = useMemo(
    () => subjectsForLevel.find((s) => s.id === selectedSubjectId) || null,
    [subjectsForLevel, selectedSubjectId],
  );

  const activeNotes = activeNotesKey ? notesCache[activeNotesKey] : null;

  const countTopicsInSubject = (subj) => {
    let total = 0;
    let studied = 0;
    subj.modules.forEach((m) =>
      m.sections.forEach((sec) =>
        sec.topics.forEach((t) => {
          total += 1;
          if (notesCache[`${level}::${subj.name}::${t.id}`]) studied += 1;
        }),
      ),
    );
    return { total, studied };
  };

  const handleLevelSwitch = (nextLevel) => {
    setLevel(nextLevel);
    setSelectedSubjectId(null);
    setActiveNotesKey(null);
    setActiveTopicMeta(null);
    setAssistResult(null);
    setError("");
  };

  const toggleModule = (moduleId) => {
    setCollapsedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleGenerateTopicNotes = async (
    { subjectName, moduleTitle, topic },
    { forceRegenerate = false } = {},
  ) => {
    const cacheKey = `${level}::${subjectName}::${topic.id}`;
    if (!forceRegenerate && notesCache[cacheKey]) {
      setActiveNotesKey(cacheKey);
      setActiveTopicMeta({ subjectName, moduleTitle, topic });
      setRevealedChecks({});
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setError("");
    setGeneratingKey(cacheKey);
    try {
      const generated = await backendRequest("/api/exam/generate-notes", {
        method: "POST",
        body: {
          level,
          subject: subjectName,
          moduleTitle,
          topicTitle: topic.title,
          concepts: topic.concepts || [],
          objectives: topic.objectives || [],
        },
      });
      const updated = { ...notesCache, [cacheKey]: generated };
      setNotesCache(updated);
      persistNotesCache(updated);
      setActiveNotesKey(cacheKey);
      setActiveTopicMeta({ subjectName, moduleTitle, topic });
      setRevealedChecks({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setError(
        getFriendlyErrorMessage(
          err,
          "We couldn't generate topic notes right now. Please try again.",
        ),
      );
    } finally {
      setGeneratingKey(null);
    }
  };

  const handleGenerateCustomNotes = async (event) => {
    event.preventDefault();
    if (!customSubject.trim() || !customTopic.trim()) {
      setError("Enter both a subject and topic title to generate notes.");
      return;
    }
    const syntheticTopic = {
      id: `custom-${customTopic.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      number: "★",
      title: customTopic.trim(),
      concepts: [customTopic.trim()],
      objectives: [`Master the core principles and exam applications of ${customTopic.trim()}`],
    };
    await handleGenerateTopicNotes(
      {
        subjectName: customSubject.trim(),
        moduleTitle: `${level} Custom Study Module`,
        topic: syntheticTopic,
      },
      { forceRegenerate: true },
    );
    setCustomOpen(false);
  };

  const handleAskMlAssistant = async (event, overrideQuery = null) => {
    if (event) event.preventDefault();
    const q = String(overrideQuery !== null ? overrideQuery : assistQuery).trim();
    if (!q) return;
    setError("");
    setAssistLoading(true);
    setRevealedAssistAnswers({});
    try {
      const data = await backendRequest("/api/exam/ml-assist", {
        method: "POST",
        body: {
          level,
          subject: selectedSubject?.name || activeTopicMeta?.subjectName || "",
          topic: activeTopicMeta?.topic?.title || "",
          query: q,
        },
      });
      setAssistResult(data);
    } catch (err) {
      console.error(err);
      setError(
        getFriendlyErrorMessage(err, "We couldn't reach the ML Study Assistant right now."),
      );
    } finally {
      setAssistLoading(false);
    }
  };

  const renderMlAssistantPanel = (contextSubject, contextTopic = "") => {
    const quickPrompts = contextTopic
      ? [
          `Explain ${contextTopic} simply`,
          `Common GCE exam questions on ${contextTopic}`,
          `Key definitions to memorize for ${contextTopic}`,
        ]
      : [
          `Key exam concepts in ${contextSubject}`,
          `How to score an A in ${level} ${contextSubject}`,
          `Important definitions in ${contextSubject}`,
        ];

    return (
      <section className="lrn-ml-assistant">
        <div className="lrn-ml-assistant-head">
          <div>
            <span className="lrn-badge-blue">🤖 Trained ML Study Assistant</span>
            <h3>Ask the S-Learn ML Tutor</h3>
            <p>
              Ask any question about {contextTopic || contextSubject || `${level} GCE subjects`} —
              powered by our trained GCE exam model (5,642+ questions across Science, Arts &amp; Commercial).
            </p>
          </div>
        </div>

        <form className="lrn-ml-form" onSubmit={handleAskMlAssistant}>
          <input
            type="text"
            value={assistQuery}
            onChange={(e) => setAssistQuery(e.target.value)}
            placeholder={`Ask about ${contextTopic || contextSubject || "any GCE topic"}...`}
          />
          <button type="submit" className="lrn-generate-btn" disabled={assistLoading}>
            <SparkleSvg />
            <span>{assistLoading ? "Thinking…" : "Ask ML Tutor"}</span>
          </button>
        </form>

        <div className="lrn-ml-quick-chips">
          {quickPrompts.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              className="lrn-concept-chip lrn-chip-btn"
              disabled={assistLoading}
              onClick={() => {
                setAssistQuery(promptText);
                handleAskMlAssistant(null, promptText);
              }}
            >
              {promptText}
            </button>
          ))}
        </div>

        {assistResult && (
          <div className="lrn-ml-response" aria-live="polite">
            <div className="lrn-ml-response-meta">
              <span className="lrn-badge-blue">{assistResult.engine}</span>
              <span className="lrn-badge-soft">
                Detected Subject: {assistResult.predictedSubject}
              </span>
            </div>

            <p className="lrn-lesson-prose">{assistResult.answer}</p>

            {assistResult.keyTakeaways?.length > 0 && (
              <ul className="lrn-lesson-bullets">
                {assistResult.keyTakeaways.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            )}

            {assistResult.examTip && (
              <div className="lrn-example-box">
                <strong>GCE Exam Tip</strong>
                <p>{assistResult.examTip}</p>
              </div>
            )}

            {assistResult.relatedQuestions?.length > 0 && (
              <div className="lrn-ml-related">
                <h4>Matched Practice Questions from Trained ML Model</h4>
                <div className="lrn-check-list">
                  {assistResult.relatedQuestions.slice(0, 3).map((rq, idx) => {
                    const isShown = Boolean(revealedAssistAnswers[idx]);
                    return (
                      <div key={rq.id || idx} className="lrn-check-card">
                        <p className="lrn-check-q">
                          <strong>Q{idx + 1}.</strong> {rq.question_text}
                        </p>
                        {isShown ? (
                          <div className="lrn-check-a">
                            <strong>Answer:</strong> {rq.answer}
                            {rq.explanation && <p style={{ marginTop: "4px" }}>{rq.explanation}</p>}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="lrn-reveal-btn"
                            onClick={() =>
                              setRevealedAssistAnswers((prev) => ({ ...prev, [idx]: true }))
                            }
                          >
                            Reveal Model Answer
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="db-layout">
      <Sidebar />

      <main className="db-main lrn-main">
        <StatusBanner type="error" message={error} onDismiss={() => setError("")} />

        {/* ── VIEW 3: GENERATED STUDY NOTES READER ── */}
        {activeNotes && activeTopicMeta ? (
          <div className="lrn-reader-wrap">
            <div className="lrn-top-bar">
              <button
                type="button"
                className="lrn-back-link"
                onClick={() => {
                  setActiveNotesKey(null);
                  setActiveTopicMeta(null);
                }}
              >
                ‹ Back to {activeTopicMeta.subjectName}
              </button>
              <div className="lrn-top-actions">
                <button
                  type="button"
                  className="lrn-outline-btn"
                  disabled={generatingKey === activeNotesKey}
                  onClick={() =>
                    handleGenerateTopicNotes(activeTopicMeta, { forceRegenerate: true })
                  }
                >
                  {generatingKey === activeNotesKey ? "Regenerating…" : "↻ Regenerate"}
                </button>
                <button
                  type="button"
                  className="lrn-outline-btn"
                  onClick={() => window.print()}
                >
                  Print / PDF
                </button>
              </div>
            </div>

            <article className="lrn-notes-article">
              <header className="lrn-notes-header">
                <div className="lrn-notes-badges">
                  <span className="lrn-badge-blue">{activeNotes.level}</span>
                  <span className="lrn-badge-soft">{activeNotes.subject}</span>
                  <span className="lrn-badge-soft">
                    ⏱ {activeNotes.readingTimeMinutes || 6} min read
                  </span>
                </div>
                {activeNotes.moduleTitle && (
                  <p className="lrn-notes-module">{activeNotes.moduleTitle}</p>
                )}
                <h1 className="lrn-notes-title">{activeNotes.topicTitle}</h1>
                <p className="lrn-notes-overview">{activeNotes.overview}</p>
              </header>

              {activeNotes.keyDefinitions?.length > 0 && (
                <section className="lrn-notes-block">
                  <h2 className="lrn-block-heading">Key Concepts &amp; Definitions</h2>
                  <div className="lrn-def-grid">
                    {activeNotes.keyDefinitions.map((item, idx) => (
                      <div key={idx} className="lrn-def-card">
                        <strong>{item.term}</strong>
                        <p>{item.definition}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeNotes.sections?.length > 0 && (
                <section className="lrn-notes-block">
                  <h2 className="lrn-block-heading">Detailed Lesson Notes</h2>
                  <div className="lrn-sections-stack">
                    {activeNotes.sections.map((sec, idx) => (
                      <div key={idx} className="lrn-lesson-section">
                        <h3>{sec.heading}</h3>
                        <p className="lrn-lesson-prose">{sec.content}</p>
                        {sec.bulletPoints?.length > 0 && (
                          <ul className="lrn-lesson-bullets">
                            {sec.bulletPoints.map((pt, pIdx) => (
                              <li key={pIdx}>{pt}</li>
                            ))}
                          </ul>
                        )}
                        {sec.workedExample && (
                          <div className="lrn-example-box">
                            <strong>Worked Example</strong>
                            <p>{sec.workedExample}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeNotes.examTips?.length > 0 && (
                <section className="lrn-tips-card">
                  <h2>GCE Exam Tips &amp; Watch-Outs</h2>
                  <ul>
                    {activeNotes.examTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </section>
              )}

              {activeNotes.quickCheck?.length > 0 && (
                <section className="lrn-notes-block">
                  <h2 className="lrn-block-heading">Quick Self-Check</h2>
                  <div className="lrn-check-list">
                    {activeNotes.quickCheck.map((item, idx) => {
                      const shown = Boolean(revealedChecks[idx]);
                      return (
                        <div key={idx} className="lrn-check-card">
                          <p className="lrn-check-q">
                            <strong>Q{idx + 1}.</strong> {item.question}
                          </p>
                          {shown ? (
                            <p className="lrn-check-a">{item.answer}</p>
                          ) : (
                            <button
                              type="button"
                              className="lrn-reveal-btn"
                              onClick={() =>
                                setRevealedChecks((prev) => ({ ...prev, [idx]: true }))
                              }
                            >
                              Reveal Answer
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {activeNotes.mlRelatedQuestions?.length > 0 && (
                <section className="lrn-notes-block">
                  <h2 className="lrn-block-heading">
                    🤖 Trained ML Model Practice Questions
                  </h2>
                  <div className="lrn-check-list">
                    {activeNotes.mlRelatedQuestions.slice(0, 3).map((item, idx) => {
                      const key = `ml-${idx}`;
                      const shown = Boolean(revealedChecks[key]);
                      return (
                        <div key={item.id || idx} className="lrn-check-card">
                          <p className="lrn-check-q">
                            <strong>GCE Practice {idx + 1}.</strong> {item.question_text}
                          </p>
                          {shown ? (
                            <div className="lrn-check-a">
                              <strong>Answer:</strong> {item.answer}
                              {item.explanation && (
                                <p style={{ marginTop: "4px" }}>{item.explanation}</p>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="lrn-reveal-btn"
                              onClick={() =>
                                setRevealedChecks((prev) => ({ ...prev, [key]: true }))
                              }
                            >
                              Reveal Verified Answer
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {renderMlAssistantPanel(activeNotes.subject, activeNotes.topicTitle)}

              <footer className="lrn-next-actions">
                <div>
                  <h3>Ready to test what you just learned?</h3>
                  <p>Launch a GCE Paper 1, Paper 2, Paper 3 simulation or fresh ML quiz on this topic.</p>
                </div>
                <div className="lrn-next-btns">
                  <button
                    type="button"
                    className="lrn-generate-btn"
                    onClick={() =>
                      navigate("/exam/quiz-engine", {
                        state: {
                          level: activeNotes.level,
                          subject: activeNotes.subject,
                          topic: activeNotes.topicTitle,
                        },
                      })
                    }
                  >
                    <SparkleSvg /> Practice Fresh Quiz
                  </button>
                  <button
                    type="button"
                    className="lrn-outline-btn"
                    onClick={() =>
                      navigate("/exam/pre-gce", {
                        state: {
                          level: activeNotes.level,
                          subject: activeNotes.subject,
                          topic: activeNotes.topicTitle,
                          paperType: "paper1",
                        },
                      })
                    }
                  >
                    Paper 1 (MCQ)
                  </button>
                  <button
                    type="button"
                    className="lrn-outline-btn"
                    onClick={() =>
                      navigate("/exam/pre-gce", {
                        state: {
                          level: activeNotes.level,
                          subject: activeNotes.subject,
                          topic: activeNotes.topicTitle,
                          paperType: "paper2",
                        },
                      })
                    }
                  >
                    Paper 2 (Structured)
                  </button>
                  <button
                    type="button"
                    className="lrn-outline-btn"
                    onClick={() =>
                      navigate("/exam/pre-gce", {
                        state: {
                          level: activeNotes.level,
                          subject: activeNotes.subject,
                          topic: activeNotes.topicTitle,
                          paperType: "paper3",
                        },
                      })
                    }
                  >
                    Paper 3 (Practical)
                  </button>
                </div>
              </footer>
            </article>
          </div>
        ) : selectedSubject ? (
          /* ── VIEW 2: SUBJECT SYLLABUS VIEW ── */
          <div className="lrn-syllabus-wrap">
            <div className="lrn-top-bar">
              <button
                type="button"
                className="lrn-back-link"
                onClick={() => {
                  setSelectedSubjectId(null);
                  setAssistResult(null);
                }}
              >
                ‹ All subjects
              </button>
              <button
                type="button"
                className="lrn-exam-pill"
                onClick={() => setModeModalOpen(true)}
              >
                🎓 Exam Modes
              </button>
            </div>

            <div className="lrn-subject-heading-row">
              <div>
                <h1 className="lrn-subject-title">{selectedSubject.name}</h1>
                <p className="lrn-subject-meta">
                  {level} · {selectedSubject.stream} · GCE Code {selectedSubject.code} ·{" "}
                  {(() => {
                    const { studied, total } = countTopicsInSubject(selectedSubject);
                    return `${studied} of ${total} topic${total === 1 ? "" : "s"} studied`;
                  })()}
                </p>
                {selectedSubject.papers?.length > 0 && (
                  <div className="lrn-paper-tags">
                    {selectedSubject.papers.map((paperLabel, idx) => {
                      const pType = idx === 0 ? "paper1" : idx === 1 ? "paper2" : "paper3";
                      return (
                        <button
                          key={idx}
                          type="button"
                          className="lrn-paper-chip lrn-paper-btn"
                          title={`Launch ${paperLabel} GCE simulation`}
                          onClick={() =>
                            navigate("/exam/pre-gce", {
                              state: {
                                level,
                                stream: selectedSubject.stream,
                                subject: selectedSubject.name,
                                paperType: pType,
                              },
                            })
                          }
                        >
                          ✦ {paperLabel}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lrn-modules-stack">
              {selectedSubject.modules.map((mod) => {
                const isCollapsed = Boolean(collapsedModules[mod.id]);
                return (
                  <section key={mod.id} className="lrn-module-card">
                    <button
                      type="button"
                      className="lrn-module-header"
                      aria-expanded={!isCollapsed}
                      onClick={() => toggleModule(mod.id)}
                    >
                      <span className="lrn-module-title">{mod.title}</span>
                      <span className="lrn-module-chevron" aria-hidden="true">
                        {isCollapsed ? "▼" : "▲"}
                      </span>
                    </button>

                    {!isCollapsed && (
                      <div className="lrn-module-body">
                        {mod.sections.map((sec, secIdx) => (
                          <div
                            key={`${mod.id}-sec-${secIdx}`}
                            className={`lrn-section-block${secIdx > 0 ? " with-divider" : ""}`}
                          >
                            <h2 className="lrn-section-label">{sec.title}</h2>

                            <div className="lrn-topics-list">
                              {sec.topics.map((topic) => {
                                const cacheKey = `${level}::${selectedSubject.name}::${topic.id}`;
                                const hasNotes = Boolean(notesCache[cacheKey]);
                                const isGenerating = generatingKey === cacheKey;

                                return (
                                  <div key={topic.id} className="lrn-topic-block">
                                    <div className="lrn-topic-row">
                                      <span
                                        className={`lrn-status-dot${hasNotes ? " done" : ""}`}
                                        title={hasNotes ? "Notes generated" : "Not studied yet"}
                                      />
                                      <div className="lrn-topic-content">
                                        <div className="lrn-topic-head">
                                          <h3 className="lrn-topic-title">
                                            {topic.number}. {topic.title}
                                          </h3>
                                          {topic.periods && (
                                            <span className="lrn-period-tag">{topic.periods}</span>
                                          )}
                                        </div>

                                        {topic.concepts?.length > 0 && (
                                          <div className="lrn-concept-pills">
                                            {topic.concepts.map((concept, cIdx) => (
                                              <span key={cIdx} className="lrn-concept-chip">
                                                {concept}
                                              </span>
                                            ))}
                                          </div>
                                        )}

                                        {topic.objectives?.length > 0 && (
                                          <ul className="lrn-objectives-list">
                                            {topic.objectives.map((obj, oIdx) => (
                                              <li key={oIdx}>{obj}</li>
                                            ))}
                                          </ul>
                                        )}

                                        <div className="lrn-topic-actions">
                                          <button
                                            type="button"
                                            className="lrn-generate-btn"
                                            disabled={Boolean(generatingKey)}
                                            onClick={() =>
                                              handleGenerateTopicNotes({
                                                subjectName: selectedSubject.name,
                                                moduleTitle: mod.title,
                                                topic,
                                              })
                                            }
                                          >
                                            <SparkleSvg />
                                            <span>
                                              {isGenerating
                                                ? "Generating Notes…"
                                                : hasNotes
                                                  ? "Open Generated Notes"
                                                  : "Generate Notes"}
                                            </span>
                                          </button>

                                          {hasNotes && !isGenerating && (
                                            <button
                                              type="button"
                                              className="lrn-regen-link"
                                              disabled={Boolean(generatingKey)}
                                              onClick={() =>
                                                handleGenerateTopicNotes(
                                                  {
                                                    subjectName: selectedSubject.name,
                                                    moduleTitle: mod.title,
                                                    topic,
                                                  },
                                                  { forceRegenerate: true },
                                                )
                                              }
                                            >
                                              ↻ Regenerate
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            {renderMlAssistantPanel(selectedSubject.name)}
          </div>
        ) : (
          /* ── VIEW 1: SUBJECT SELECTION LIST VIEW BY LEVEL & STREAM ── */
          <div className="lrn-catalog-wrap">
            <div className="lrn-catalog-header">
              <div>
                <span className="lrn-badge-blue">Auto-Generated Syllabus Notes · ML Tutor</span>
                <h1 className="lrn-subject-title">Learning Center</h1>
                <p className="lrn-subject-meta">
                  Choose your academic level and GCE stream to browse official subjects in list
                  view, generate structured notes, and get help from the trained ML tutor.
                </p>
              </div>
              <button
                type="button"
                className="lrn-exam-pill"
                onClick={() => setModeModalOpen(true)}
              >
                🎓 Practice Exam Modes
              </button>
            </div>

            <div className="lrn-controls-bar">
              <div className="lrn-level-switcher" role="tablist" aria-label="Academic level">
                {ACADEMIC_LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    role="tab"
                    aria-selected={level === lvl.id}
                    className={`lrn-level-tab${level === lvl.id ? " active" : ""}`}
                    onClick={() => handleLevelSwitch(lvl.id)}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>

              <div className="lrn-search-box">
                <span aria-hidden="true">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${level} subjects, GCE codes, or topics...`}
                />
              </div>
            </div>

            <div className="lrn-stream-bar" role="tablist" aria-label="GCE stream filter">
              {GCE_STREAMS.map((st) => {
                const countInStream =
                  st.id === "All"
                    ? subjectsForLevel.length
                    : subjectsForLevel.filter((s) => s.stream === st.id).length;
                return (
                  <button
                    key={st.id}
                    type="button"
                    role="tab"
                    aria-selected={stream === st.id}
                    className={`lrn-stream-pill${stream === st.id ? " active" : ""}`}
                    onClick={() => setStream(st.id)}
                  >
                    <span>{st.label}</span>
                    <span className="lrn-stream-count">{countInStream}</span>
                  </button>
                );
              })}
            </div>

            <div className="lrn-subjects-list" role="list">
              {filteredSubjects.map((subj) => {
                const { studied, total } = countTopicsInSubject(subj);
                const pct = total > 0 ? Math.round((studied / total) * 100) : 0;
                return (
                  <button
                    key={subj.id}
                    type="button"
                    role="listitem"
                    className="lrn-subject-row"
                    onClick={() => {
                      setSelectedSubjectId(subj.id);
                      setAssistResult(null);
                    }}
                  >
                    <span
                      className="lrn-subject-icon"
                      style={{ background: `${subj.accent}1a`, color: subj.accent }}
                    >
                      {subj.icon}
                    </span>
                    <div className="lrn-subject-row-main">
                      <div className="lrn-subject-row-title-line">
                        <h2 className="lrn-subject-card-title">{subj.name}</h2>
                        <span className="lrn-code-pill">{subj.code}</span>
                        <span className={`lrn-stream-badge stream-${subj.stream.toLowerCase()}`}>
                          {subj.stream}
                        </span>
                      </div>
                      <p className="lrn-subject-card-sub">
                        {subj.papers?.join(" · ")} · {subj.modules.length} module
                        {subj.modules.length === 1 ? "" : "s"} · {total} topic
                        {total === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="lrn-row-right">
                      <div className="lrn-row-progress">
                        <div className="lrn-card-progress-bar">
                          <div
                            className="lrn-card-progress-fill"
                            style={{ width: `${pct}%`, background: subj.accent }}
                          />
                        </div>
                        <span>
                          {studied}/{total}
                        </span>
                      </div>
                      <span className="lrn-row-chevron" aria-hidden="true">›</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredSubjects.length === 0 && (
              <div className="lrn-empty-state">
                <p>No {level} subjects matched &ldquo;{searchQuery}&rdquo;.</p>
                <button
                  type="button"
                  className="lrn-outline-btn"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </button>
              </div>
            )}

            {renderMlAssistantPanel(`${level} GCE`)}

            <section className="lrn-custom-card">
              <div className="lrn-custom-head">
                <div>
                  <h3>Need notes for another topic?</h3>
                  <p>
                    Enter any {level} subject and topic—the engine will build structured
                    study notes automatically.
                  </p>
                </div>
                <button
                  type="button"
                  className="lrn-outline-btn"
                  onClick={() => setCustomOpen((o) => !o)}
                >
                  {customOpen ? "Close" : "+ Custom Topic"}
                </button>
              </div>

              {customOpen && (
                <form className="lrn-custom-form" onSubmit={handleGenerateCustomNotes}>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Subject (e.g. Geography, History, Literature)"
                    required
                  />
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Topic (e.g. Plate Tectonics and Volcanism)"
                    required
                  />
                  <button
                    type="submit"
                    className="lrn-generate-btn"
                    disabled={Boolean(generatingKey)}
                  >
                    <SparkleSvg />
                    <span>{generatingKey ? "Generating…" : "Generate Notes"}</span>
                  </button>
                </form>
              )}
            </section>
          </div>
        )}
      </main>

      <ExamModeModal
        isOpen={modeModalOpen}
        onClose={() => setModeModalOpen(false)}
        routeState={{
          level,
          subject: selectedSubject?.name || activeTopicMeta?.subjectName || "",
          topic: activeTopicMeta?.topic?.title || "",
        }}
      />
    </div>
  );
}

export default LearningPage;
