// Exam Service - provides topic list and random question generation
import { pool } from "../config/db.js";
import { generateWithLocalML } from "./mlExamService.js";
import { randomUUID } from "crypto";

const normalizeQuestionItem = (item, index) => {
    if (!item || typeof item !== "object") return null;

    const questionText = item.question_text || item.questionText || item.text || "";
    const options = Array.isArray(item.options)
        ? item.options
        : typeof item.options === "string"
            ? JSON.parse(item.options)
            : [];

    if (!questionText || options.length < 2) return null;

    const answer = item.answer || options[0];

    return {
        id: item.id ?? `llm-${Date.now()}-${index}`,
        question_text: questionText,
        options,
        answer,
    };
};

const parseJsonResponse = (raw) => {
    if (!raw) return [];

    let cleaned = String(raw).trim();
    cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.map((item, index) => normalizeQuestionItem(item, index)).filter(Boolean);
    if (parsed && Array.isArray(parsed.questions)) {
        return parsed.questions.map((item, index) => normalizeQuestionItem(item, index)).filter(Boolean);
    }
    if (parsed && typeof parsed === "object") {
        return [normalizeQuestionItem(parsed, 0)].filter(Boolean);
    }

    return [];
};

const buildExamPrompt = ({ subject, topic, count, papers = [] }) => {
    const paperText = papers.slice(0, 20).map((paper) => ({
        subject: paper.subject || "Unknown subject",
        topic: paper.topic || paper.paper_name || paper.title || "General topic",
        year: paper.year || "Unknown year",
        specialty: paper.specialty || "General",
        title: paper.paper_name || paper.title || paper.name || "Past paper",
    }));

    return `
You are an expert exam designer for S-Learn.
Create ${count} multiple-choice questions for subject "${subject}" and topic "${topic}".
Use these past-paper references to guide difficulty and theme:
${JSON.stringify(paperText, null, 2)}

Return only valid JSON in this exact shape:
[
  {
    "question_text": "...",
    "options": ["correct option", "wrong option 1", "wrong option 2", "wrong option 3"],
    "answer": "correct option"
  }
]
Do not include markdown fences, commentary, or extra text.
    `.trim();
};

const generateQuestionsWithLLM = async ({ subject, topic, count, papers = [] }) => {
    const openAiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (openAiKey) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openAiKey}`,
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: "You are a careful exam-generation assistant. Return only valid JSON." ,
                    },
                    {
                        role: "user",
                        content: buildExamPrompt({ subject, topic, count, papers }),
                    },
                ],
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`OpenAI question generation failed: ${text}`);
        }

        const json = await response.json();
        const raw = json?.choices?.[0]?.message?.content;
        return parseJsonResponse(raw);
    }

    if (geminiKey) {
        const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: buildExamPrompt({ subject, topic, count, papers }) }],
                    },
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                },
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Gemini question generation failed: ${text}`);
        }

        const json = await response.json();
        const raw = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";
        return parseJsonResponse(raw);
    }

    return [];
};

/**
 * Get distinct topics for a given subject.
 * @param {string} subject
 * @returns {Promise<string[]>}
 */
export const getTopics = async (subject) => {
    const result = await pool.query(
        `SELECT DISTINCT topic FROM questions WHERE subject = $1 ORDER BY topic`,
        [subject]
    );
    return result.rows.map((r) => r.topic);
};

export const generateExam = async ({ subject, topic, count, papers = [] }) => {
    const safeCount = Math.max(1, Number(count) || 5);

    // 1. Prefer the locally trained ML model from historical papers.
    const mlQuestions = await generateWithLocalML({ subject, topic, count: safeCount, papers });
    if (mlQuestions.length >= safeCount) {
        return mlQuestions;
    }

    // 2. Try the configured cloud LLM when the local model cannot produce enough questions.
    try {
        const llmQuestions = await generateQuestionsWithLLM({ subject, topic, count: safeCount, papers });
        if (llmQuestions.length >= safeCount) {
            return llmQuestions.slice(0, safeCount);
        }
    } catch (err) {
        console.warn("LLM exam generation unavailable, falling back to local generation:", err.message);
    }

    // 3. Fetch existing questions from DB
    const result = await pool.query(
        `SELECT id, question_text, options, answer FROM questions WHERE LOWER(subject) = LOWER($1) AND LOWER(topic) = LOWER($2) ORDER BY RANDOM() LIMIT $3`,
        [subject, topic, safeCount]
    );
    let questions = result.rows.map((row) => ({
        id: row.id,
        question_text: row.question_text,
        options: typeof row.options === "string" ? JSON.parse(row.options) : row.options,
        answer: row.answer,
    }));

    // 4. If questions are fewer than count, generate fallback ones
    if (questions.length < safeCount) {
        const needed = safeCount - questions.length;
        for (let i = 1; i <= needed; i++) {
            const index = questions.length + i;
            const templates = [
                {
                    text: `Which of the following describes a key fundamental concept of ${topic} in ${subject}?`,
                    options: [
                        `A validated model defining ${topic} interactions.`,
                        `A secondary option unrelated to the study of ${subject}.`,
                        `An atmospheric reaction that does not involve ${topic}.`,
                        `A mechanical approximation.`
                    ]
                },
                {
                    text: `In practical experiments of ${subject}, how is the value of ${topic} typically analysed?`,
                    options: [
                        `By calculating numerical ratios specific to ${topic}.`,
                        `Using static estimates that do not depend on ${topic}.`,
                        `By ignoring the variable representing ${topic}.`,
                        `Through external observations model.`
                    ]
                },
                {
                    text: `What is the most common real-world application of ${topic}?`,
                    options: [
                        `Optimizing processes involving ${topic} properties.`,
                        `Replacing it with unrelated chemical elements.`,
                        `Simulating virtual structures without any parameters.`,
                        `None of the above.`
                    ]
                }
            ];

            const template = templates[index % templates.length];
            const qText = template.text;
            const options = template.options;
            const answer = options[0];

            try {
                const insertRes = await pool.query(
                    `INSERT INTO questions (id, subject, topic, question_text, options, answer)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING id, question_text, options, answer`,
                    [randomUUID(), subject, topic, qText, JSON.stringify(options), answer]
                );
                if (insertRes.rows.length) {
                    questions.push({
                        id: insertRes.rows[0].id,
                        question_text: insertRes.rows[0].question_text,
                        options: typeof insertRes.rows[0].options === "string" ? JSON.parse(insertRes.rows[0].options) : insertRes.rows[0].options,
                        answer: insertRes.rows[0].answer,
                    });
                }
            } catch (err) {
                console.error("Error inserting generated AI question:", err.message);
                questions.push({
                    id: -index,
                    question_text: qText,
                    options: options,
                    answer,
                });
            }
        }
    }
    return questions.slice(0, safeCount);
};

/**
 * (Optional) Submit answers and calculate score.
 * @param {{answers: Array<{questionId:number, answer:string}>}} payload
 * @returns {Promise<{score:number, total:number}>}
 */
export const submitAnswers = async ({ answers }) => {
    const total = answers.length;
    let correct = 0;
    for (const { questionId, answer } of answers) {
        const res = await pool.query(`SELECT answer FROM questions WHERE id = $1`, [questionId]);
        if (res.rows.length && res.rows[0].answer === answer) correct++;
    }
    return { score: correct, total };
};
