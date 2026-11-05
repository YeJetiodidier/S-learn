import express from 'express';
import { getTopics, generateExam, submitAnswers } from '../services/examService.js';
import { requireDatabase, requireFirebaseUser } from "./appData.js";

const router = express.Router();
router.use(requireDatabase, requireFirebaseUser);

// GET /api/exam/topics?subject=SubjectName
router.get('/topics', async (req, res) => {
    const { subject } = req.query;
    if (!subject) return res.status(400).json({ error: 'Subject query param required' });
    try {
        const topics = await getTopics(subject);
        res.json({ topics });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch topics' });
    }
});

// POST /api/exam/generate  body: { subject, topic, count, papers? }
router.post('/generate', async (req, res) => {
    const { subject, topic, count, papers } = req.body;
    if (!subject || !topic || !count) return res.status(400).json({ error: 'subject, topic, and count required' });
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
        res.status(500).json({ error: 'Failed to generate exam' });
    }
});

// POST /api/exam/submit  body: { answers: [{questionId, answer}] }
router.post('/submit', async (req, res) => {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) return res.status(400).json({ error: 'answers array required' });
    try {
        const result = await submitAnswers({ answers });
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit answers' });
    }
});

export default router;
