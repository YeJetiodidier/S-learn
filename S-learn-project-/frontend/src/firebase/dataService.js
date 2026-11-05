// Service layer for app data stored in Neon Postgres.
import { apiRequest } from "./apiClient";

/* ───────────── PROFILE ───────────── */
export const getProfile = (uid) =>
  apiRequest(`/profile/${encodeURIComponent(uid)}`);

export const updateProfile = (uid, data) =>
  apiRequest(`/profile/${encodeURIComponent(uid)}`, { method: "PUT", body: data });

/* ───────────── SETTINGS ───────────── */
export const getSettings = (uid) =>
  apiRequest(`/settings/${encodeURIComponent(uid)}`);

export const updateSettings = (uid, data) =>
  apiRequest(`/settings/${encodeURIComponent(uid)}`, { method: "PUT", body: data });

export const getStudyProgress = (uid) =>
  apiRequest(`/progress/${encodeURIComponent(uid)}`);

export const recordExamProgress = (result) =>
  apiRequest("/progress/exam", { method: "POST", body: result });

/* ───────────── PAPERS ───────────── */
export const getPapers = () => apiRequest("/papers");

export const getPendingPapers = () => apiRequest("/papers/pending");

export const addPaper = (paper) =>
  apiRequest("/papers", { method: "POST", body: paper });

export const approvePaper = async (id) => {
  const paper = await apiRequest(`/papers/${encodeURIComponent(id)}/approve`, { method: "PATCH" });
  return {
    id,
    alreadyApproved: Boolean(paper?.alreadyApproved),
    status: paper?.status || null,
  };
};

export const deletePaper = (id) =>
  apiRequest(`/papers/${encodeURIComponent(id)}`, { method: "DELETE" });

/* ───────────── VIDEOS ───────────── */
export const getVideos = () => apiRequest("/videos");

export const getPendingVideos = () => apiRequest("/videos/pending");

export const addVideo = (video) =>
  apiRequest("/videos", { method: "POST", body: video });

export const approveVideo = async (id) => {
  const video = await apiRequest(`/videos/${encodeURIComponent(id)}/approve`, { method: "PATCH" });
  return {
    id,
    alreadyApproved: Boolean(video?.alreadyApproved),
    status: video?.status || null,
  };
};

export const deleteVideo = (id) =>
  apiRequest(`/videos/${encodeURIComponent(id)}`, { method: "DELETE" });


/* ───────────── QUESTIONS / EXAM ───────────── */
export const getTopics = (subject) =>
  apiRequest(`/questions/topics?subject=${encodeURIComponent(subject)}`);

export const getQuestions = (subject, topic, count) =>
  apiRequest(
    `/questions?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}&count=${encodeURIComponent(count)}`,
  );

const PAPER_STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "into", "paper", "papers", "exam",
  "test", "question", "questions", "year", "marking", "scheme", "revision",
  "study", "sample", "past", "final", "mock", "section", "semester"
]);

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractConceptsFromPapers = (papers, subject, topic) => {
  const candidateStrings = papers
    .filter((paper) => {
      const haystack = [
        paper.subject,
        paper.specialty,
        paper.level,
        paper.paper_name,
        paper.title,
        paper.name,
        paper.topic,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const subjectMatch = !subject || !paper.subject || String(paper.subject).toLowerCase().includes(String(subject).toLowerCase());
      const topicMatch = !topic || !paper.topic || String(paper.topic).toLowerCase().includes(String(topic).toLowerCase()) || haystack.includes(String(topic).toLowerCase());

      return subjectMatch && (topicMatch || !topic);
    })
    .map((paper) => [
      paper.subject,
      paper.specialty,
      paper.level,
      paper.paper_name,
      paper.title,
      paper.name,
      paper.topic,
    ].join(" "))
    .join(" ");

  const words = normalizeText(candidateStrings)
    .split(" ")
    .filter((word) => word.length > 3 && !PAPER_STOPWORDS.has(word));

  const counts = {};
  for (const word of words) {
    counts[word] = (counts[word] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 12);
};

const makePaperQuestion = (subject, topic, concept, index) => {
  const templates = [
    {
      question_text: `Using knowledge from past papers in ${subject}, explain the main idea of ${concept} and why it matters in ${topic || subject}.`,
      options: [
        `It helps learners connect a key concept in ${subject} to real exam conditions and applications.`,
        `It is only useful for memorising unrelated general facts.`,
        `It should be ignored because past papers are always outdated.`,
        `It has no connection with the study of ${topic || subject}.`,
      ],
    },
    {
      question_text: `In a past-paper context for ${subject}, which statement best describes the role of ${concept}?`,
      options: [
        `It represents a core idea that is repeatedly examined and tested in ${topic || subject}.`,
        `It is a random word unrelated to the subject topic.`,
        `It only applies to one isolated textbook chapter without any practical use.`,
        `It replaces the need for revision and preparation.`,
      ],
    },
    {
      question_text: `A learner reviews several past papers for ${subject}. Which answer best reflects how ${concept} should be understood in ${topic || subject}?`,
      options: [
        `As a core principle that supports deeper understanding and better application in exam questions.`,
        `As a hidden rule that should never be discussed in class.`,
        `As a mistake to avoid in every practice paper.`,
        `As a topic that is irrelevant to the rest of the syllabus.`,
      ],
    },
    {
      question_text: `Which approach is most appropriate when preparing for questions on ${concept} in ${subject}?`,
      options: [
        `Review the main concepts, definitions, and practical examples connected to ${topic || subject}.`,
        `Skip the topic and answer only from memory without studying.`,
        `Guess without considering the paper theme or topic.`,
        `Ignore the subject and focus only on unrelated examples.`,
      ],
    },
  ];

  const template = templates[index % templates.length];
  return {
    id: `paper-${Date.now()}-${index}`,
    question_text: template.question_text.replace("concept", concept),
    options: template.options,
    answer: template.options[0],
  };
};

export const generateSmartExamFromPapers = async ({ subject, topic, count, papers = null }) => {
  const paperList = papers || (await getPapers());
  if (!paperList || !paperList.length) return [];

  const concepts = extractConceptsFromPapers(paperList, subject, topic);
  if (!concepts.length) return [];

  const questions = [];
  const safeCount = Math.max(1, Number(count) || 5);

  for (let i = 0; i < safeCount; i++) {
    const concept = concepts[i % concepts.length] || "core principles";
    questions.push(makePaperQuestion(subject, topic, concept, i));
  }

  return questions;
};

export const addQuestion = async (question) => {
  return apiRequest("/questions", { method: "POST", body: question });
};
