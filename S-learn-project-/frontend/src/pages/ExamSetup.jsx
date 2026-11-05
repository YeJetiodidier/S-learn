import "./exam.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTopics,
  getQuestions,
  getPapers,
  generateSmartExamFromPapers,
} from "../firebase/dataService";
import { backendRequest } from "../firebase/apiClient";

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
    const options = [
      `A correct application of ${concept} in ${subject} and ${topic}.`,
      `An unrelated statement that does not use ${concept}.`,
      `A claim that contradicts the learned ${topic} pattern.`,
      `A statement that ignores the ${subject} concept of ${concept}.`,
    ];
    out.push({ id: `paper-${i}`, question_text, options, answer: options[0] });
  }
  return out;
};

const ExamSetup = () => {
    const navigate = useNavigate();
    const [subject, setSubject] = useState("");
    const [topics, setTopics] = useState([]);
    const [topic, setTopic] = useState("");
    const [count, setCount] = useState(10);
    const [loading, setLoading] = useState(false);

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
        if (!subject || !topic || !count) return;
        try {
            const questions = await buildExam(subject, topic, count);
            navigate("/exam/run", { state: { questions, subject, topic } });
        } catch (err) {
            console.error(err);
            alert("Error generating exam");
        }
    };

    // Generate a paper-aware exam using the selected topic and the learner's past-paper history.
    const handleAIGenerate = async () => {
        if (!subject || !count) return;
        try {
            const questions = await buildExam(subject, topic || "General", count);
            navigate("/exam/run", {
                state: { questions, subject, topic: topic || "General" },
            });
        } catch (err) {
            console.error(err);
            alert("Error generating exam from past papers");
        }
    };

    return (
        <div className="exam-setup">
            <h2 className="exam-title">Start Exam</h2>
            <form onSubmit={handleStart} className="exam-form">
                <label className="exam-label">
                    Subject
                    <input
                        type="text"
                        value={subject}
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
                    <button type="submit" className="primary-btn">
                        Start Exam
                    </button>
                    <button type="button" className="secondary-btn" onClick={handleAIGenerate}>
                        Generate from Past Papers
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ExamSetup;
