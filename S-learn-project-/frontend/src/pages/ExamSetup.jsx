import "./exam.css";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StatusBanner from "../components/StatusBanner";
import { getFriendlyErrorMessage } from "../utils/friendlyError";
import {
  getSubjects,
  getTopics,
  getQuestions,
  getPapers,
  generateSmartExamFromPapers,
} from "../firebase/dataService";
import { backendRequest } from "../firebase/apiClient";

const shuffleOptions = (options) => {
  const copy = [...options];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Subject-specific fallback built from the actual past-paper metadata.
const generateFallback = (subject, topic, count, papers = []) => {
  const sourcePapers = papers.filter((paper) => {
    const text = [paper.subject, paper.specialty, paper.topic, paper.paper_name, paper.title, paper.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return text.includes(subject.toLowerCase()) || text.includes(topic.toLowerCase());
  });

  const sourceNames = sourcePapers.map((paper) => paper.paper_name || paper.title || paper.name || "past paper");
  const sourceName = sourceNames[0] || "available past paper";
  const concepts = sourcePapers
    .flatMap((paper) => [
      paper.subject,
      paper.specialty,
      paper.topic,
      paper.paper_name,
      paper.title,
      paper.name,
    ])
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter((value, index, values) => values.indexOf(value) === index);

  const templates = [
    (concept) => `Using the learned pattern from ${sourceName}, explain the main idea of ${concept} in ${subject} and its application to ${topic}.`,
    (concept) => `In ${subject}, compare the use of ${concept} in ${topic}. Explain the relevant method and justify your answer.`,
    (concept) => `Based on the past-paper pattern from ${sourceName}, describe how ${concept} relates to ${topic} in ${subject}.`,
    (concept) => `Analyse the significance of ${concept} in ${subject} for ${topic} and support your answer with an example from the past paper.`,
  ];

  const out = [];
  for (let i = 0; i < count; i++) {
    const concept = concepts[i % concepts.length] || topic || subject;
    const template = templates[i % templates.length];
    const question_text = template(concept);
    const rawOptions = [
      `A correct application of ${concept} in ${subject} and ${topic}.`,
      `An unrelated statement that does not use ${concept}.`,
      `A claim that contradicts the learned ${topic} pattern.`,
      `A statement that ignores the ${subject} concept of ${concept}.`,
    ];
    const answer = rawOptions[0];
    out.push({ id: `paper-${i}`, question_text, options: shuffleOptions(rawOptions), answer });
  }
  return out;
};

const ExamSetup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialSubject = location.state?.subject || "";
    const initialTopic = location.state?.topic || "";
    const [subjects, setSubjects] = useState([]);
    const [subject, setSubject] = useState(initialSubject);
    const [topics, setTopics] = useState([]);
    const [topic, setTopic] = useState(initialTopic);
    const [count, setCount] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [generating, setGenerating] = useState(false);

    // Load available subjects dynamically from Postgres questions & approved papers
    useEffect(() => {
        let active = true;
        getSubjects()
            .then((data) => {
                if (active && Array.isArray(data)) setSubjects(data);
            })
            .catch(() => {
                getPapers()
                    .then((papers) => {
                        if (!active || !Array.isArray(papers)) return;
                        const unique = [...new Set(papers.map((p) => p.subject).filter(Boolean))].sort();
                        setSubjects(unique);
                    })
                    .catch((err) => console.error("Failed to load subjects:", err));
            });
        return () => {
            active = false;
        };
    }, []);

    // Load topics when a subject is entered
    useEffect(() => {
        if (!subject) return;
        let active = true;
        getTopics(subject)
            .then((data) => {
                if (!active) return;
                setTopics(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch((err) => {
                if (!active) return;
                console.error("Failed to load topics:", err);
                setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [subject]);

    const buildExam = async (subj, top, cnt) => {
        const papers = await getPapers();

        try {
            const data = await backendRequest("/api/exam/generate", {
                method: "POST",
                body: {
                    subject: subj,
                    topic: top,
                    count: Number(cnt),
                    papers: papers.slice(0, 40),
                },
            });
            if (Array.isArray(data?.questions) && data.questions.length) {
                return data.questions;
            }
        } catch (err) {
            console.warn("Backend exam generation unavailable, falling back locally:", err.message);
        }

        const [fetched, localPapers] = await Promise.all([
            getQuestions(subj, top, Number(cnt)),
            Promise.resolve(papers),
        ]);

        const smartQuestions = await generateSmartExamFromPapers({
            subject: subj,
            topic: top,
            count: Number(cnt),
            papers: localPapers,
        });

        const merged = [...fetched, ...smartQuestions];

        if (merged.length >= Number(cnt)) {
            return merged.slice(0, Number(cnt));
        }

        // Pad with subject-specific questions derived from the available past papers.
        return [
            ...merged,
            ...generateFallback(subj, top, Number(cnt) - merged.length, localPapers),
        ];
    };

    const handleStart = async (e) => {
        e.preventDefault();
        if (!subject || !topic || !count || generating) return;
        setError("");
        setGenerating(true);
        try {
            const questions = await buildExam(subject, topic, count);
            navigate("/exam/run", { state: { questions, subject, topic } });
        } catch (err) {
            console.error(err);
            setError(
                getFriendlyErrorMessage(
                    err,
                    "We couldn't generate your practice exam right now. Please try again.",
                ),
            );
        } finally {
            setGenerating(false);
        }
    };

    // Generate a paper-aware exam using the selected topic and the learner's past-paper history.
    const handleAIGenerate = async () => {
        if (!subject || !count || generating) return;
        setError("");
        setGenerating(true);
        try {
            const questions = await buildExam(subject, topic || "General", count);
            navigate("/exam/run", {
                state: { questions, subject, topic: topic || "General" },
            });
        } catch (err) {
            console.error(err);
            setError(
                getFriendlyErrorMessage(
                    err,
                    "We couldn't generate an exam from past papers right now. Please try again.",
                ),
            );
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="exam-setup">
            <h2 className="exam-title">Start Exam</h2>
            <StatusBanner type="error" message={error} onDismiss={() => setError("")} />
            <form onSubmit={handleStart} className="exam-form">
                <label className="exam-label">
                    Subject
                    <input
                        type="text"
                        list="subjects-list"
                        value={subject}
                        placeholder="Enter or select a subject"
                        onChange={(e) => {
                            const nextSubject = e.target.value;
                            setSubject(nextSubject);
                            setTopics([]);
                            setTopic("");
                            setLoading(Boolean(nextSubject));
                        }}
                        required
                        className="exam-input"
                    />
                    <datalist id="subjects-list">
                        {subjects.map((s) => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>
                </label>
                <label className="exam-label">
                    Topic
                    <input
                        type="text"
                        list="topics-list"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required
                        className="exam-input"
                        placeholder="Enter or select a topic"
                        disabled={loading}
                    />
                    <datalist id="topics-list">
                        {topics.map((t) => (
                            <option key={t} value={t} />
                        ))}
                    </datalist>
                </label>
                <label className="exam-label">
                    Number of Questions
                    <input
                        type="number"
                        min="1"
                        max="50"
                        value={count}
                        onChange={(e) => setCount(e.target.value)}
                        required
                        className="exam-input"
                    />
                </label>
                <div className="exam-actions">
                    <button type="submit" className="primary-btn" disabled={generating}>
                        {generating ? "Generating..." : "Start Exam"}
                    </button>
                    <button type="button" className="secondary-btn" onClick={handleAIGenerate} disabled={generating}>
                        Generate from Past Papers
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExamSetup;
