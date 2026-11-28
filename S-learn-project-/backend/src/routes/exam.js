import express from "express";
import multer from "multer";
import { getTopics, generateExam, submitAnswers } from "../services/examService.js";
import {
  generateModelAnswers,
  generateMarkingQuestions,
  markStudentAnswers,
  generatePreGceSimulation,
  generateFreshQuiz,
  generateTopicNotes,
} from "../services/examEngineService.js";
import { requireDatabase, requireFirebaseUser } from "./appData.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Authenticate all exam/learning engine endpoints with Firebase Auth.
router.use(requireFirebaseUser);

// GET /api/exam/topics?subject=SubjectName
router.get("/topics", requireDatabase, async (req, res) => {
  const { subject } = req.query;
  if (!subject) return res.status(400).json({ error: "Subject query param required" });
  try {
    const topics = await getTopics(subject);
    res.json({ topics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch topics" });
  }
});

// POST /api/exam/generate  body: { subject, topic, count, papers? }
router.post("/generate", requireDatabase, async (req, res) => {
  const { subject, topic, count, papers } = req.body;
  if (!subject || !topic || !count) {
    return res.status(400).json({ error: "subject, topic, and count required" });
  }
  try {
    const questions = await generateExam({
      subject,
      topic,
      count: Math.min(50, Math.max(1, Number(count) || 1)),
      papers: Array.isArray(papers) ? papers.slice(0, 40) : [],
    });
    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate exam" });
  }
});

// POST /api/exam/submit  body: { answers: [{questionId, answer}] }
router.post("/submit", requireDatabase, async (req, res) => {
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: "answers array required" });
  }
  try {
    const result = await submitAnswers({ answers });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit answers" });
  }
});

// POST /api/exam/model-answers (supports multipart paper upload OR JSON)
router.post("/model-answers", upload.single("paper"), async (req, res) => {
  const { level, subject, paperTitle, questionsText } = req.body || {};
  if (!subject && !questionsText && !req.file) {
    return res.status(400).json({
      error: "Please select a subject, upload a paper, or paste exam questions.",
    });
  }
  try {
    const result = await generateModelAnswers({
      level: level || "O-Level",
      subject: subject || "General",
      paperTitle: paperTitle || "",
      questionsText: questionsText || "",
      file: req.file || null,
    });
    res.json(result);
  } catch (err) {
    console.error("Model answers error:", err);
    res.status(500).json({ error: "Failed to generate model answers." });
  }
});

// POST /api/exam/mark-questions (generate guided exam questions to answer & mark)
router.post("/mark-questions", async (req, res) => {
  const { level, subject, topic, count } = req.body || {};
  if (!subject) {
    return res.status(400).json({ error: "Subject is required." });
  }
  try {
    const result = await generateMarkingQuestions({
      level: level || "O-Level",
      subject,
      topic: topic || "Core Syllabus",
      count: Number(count) || 3,
    });
    res.json(result);
  } catch (err) {
    console.error("Mark questions error:", err);
    res.status(500).json({ error: "Failed to generate practice questions." });
  }
});

// POST /api/exam/mark-answers (grade student answers & return AI analysis)
router.post("/mark-answers", async (req, res) => {
  const { level, subject, topic, entries } = req.body || {};
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: "Please provide at least one question and answer to mark." });
  }
  try {
    const result = await markStudentAnswers({
      level: level || "O-Level",
      subject: subject || "General",
      topic: topic || "General",
      entries,
    });
    res.json(result);
  } catch (err) {
    console.error("Mark answers error:", err);
    res.status(500).json({ error: err.message || "Failed to mark answers." });
  }
});

// POST /api/exam/pre-gce (generate realistic GCE simulation paper)
router.post("/pre-gce", async (req, res) => {
  const { level, subject, paperType, topic, count, durationMinutes, papers } = req.body || {};
  if (!subject) {
    return res.status(400).json({ error: "Subject is required." });
  }
  try {
    const result = await generatePreGceSimulation({
      level: level || "O-Level",
      subject,
      paperType: paperType === "paper2" ? "paper2" : "paper1",
      topic: topic || "Full Syllabus",
      count: Number(count) || 10,
      durationMinutes: Number(durationMinutes) || 30,
      papers: Array.isArray(papers) ? papers.slice(0, 30) : [],
    });
    res.json(result);
  } catch (err) {
    console.error("Pre-GCE error:", err);
    res.status(500).json({ error: "Failed to generate Pre-GCE simulation." });
  }
});

// POST /api/exam/quiz-engine (fresh syllabus quiz, zero repeats)
router.post("/quiz-engine", async (req, res) => {
  const { level, subject, topic, difficulty, count, excludeQuestions, papers } = req.body || {};
  if (!subject) {
    return res.status(400).json({ error: "Subject is required." });
  }
  try {
    const result = await generateFreshQuiz({
      level: level || "O-Level",
      subject,
      topic: topic || "General",
      difficulty: difficulty || "standard",
      count: Number(count) || 8,
      excludeQuestions: Array.isArray(excludeQuestions) ? excludeQuestions : [],
      papers: Array.isArray(papers) ? papers.slice(0, 30) : [],
    });
    res.json(result);
  } catch (err) {
    console.error("Quiz engine error:", err);
    res.status(500).json({ error: "Failed to generate fresh quiz." });
  }
});

// POST /api/exam/generate-notes (Learning page automatic topic content engine)
router.post("/generate-notes", async (req, res) => {
  const { level, subject, moduleTitle, topicTitle, concepts, objectives } = req.body || {};
  if (!subject || !topicTitle) {
    return res.status(400).json({ error: "Subject and topicTitle are required." });
  }
  try {
    const result = await generateTopicNotes({
      level: level || "O-Level",
      subject,
      moduleTitle: moduleTitle || "",
      topicTitle,
      concepts: Array.isArray(concepts) ? concepts : [],
      objectives: Array.isArray(objectives) ? objectives : [],
    });
    res.json(result);
  } catch (err) {
    console.error("Generate notes error:", err);
    res.status(500).json({ error: "Failed to generate topic notes." });
  }
});

export default router;
