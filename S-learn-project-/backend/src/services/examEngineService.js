// Unified AI + structured fallback engine for S-Learn Exam Modes & Learning Notes.
import { randomUUID } from "crypto";
import { generateExam } from "./examService.js";

const parseJsonSafe = (raw) => {
  if (!raw) return null;
  let cleaned = String(raw).trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const startObj = cleaned.indexOf("{");
    const endObj = cleaned.lastIndexOf("}");
    if (startObj !== -1 && endObj > startObj) {
      try {
        return JSON.parse(cleaned.slice(startObj, endObj + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const callLLMJson = async ({ systemPrompt, userPrompt, imageDataUrl = null, maxTokens = 2800 }) => {
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (openAiKey) {
    const userContent = imageDataUrl
      ? [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ]
      : userPrompt;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
        temperature: 0.5,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content || "";
    return parseJsonSafe(raw);
  }

  if (geminiKey) {
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const parts = [{ text: `${systemPrompt}\n\n${userPrompt}` }];
    if (imageDataUrl && imageDataUrl.includes(",")) {
      const [meta, base64] = imageDataUrl.split(",");
      const mimeMatch = meta.match(/data:([^;]+);base64/);
      parts.push({
        inline_data: {
          mime_type: mimeMatch ? mimeMatch[1] : "image/jpeg",
          data: base64,
        },
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini request failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";
    return parseJsonSafe(raw);
  }

  return null;
};

const extractReadableTextFromPdfBuffer = (buffer) => {
  if (!buffer || !buffer.length) return "";
  const latin = buffer.toString("latin1");
  const matches = latin.match(/\(([^()\\]{4,200})\)/g) || [];
  const extracted = matches
    .map((m) => m.slice(1, -1).replace(/[^\x20-\x7E]/g, " ").trim())
    .filter((s) => /[a-zA-Z]{3,}/.test(s))
    .slice(0, 120)
    .join(" ");
  return extracted.slice(0, 6000);
};

/* ─────────────────────────────────────────────────────────────────────────── *
 * 1. GET MODEL ANSWERS
 * ─────────────────────────────────────────────────────────────────────────── */
export const generateModelAnswers = async ({
  level = "O-Level",
  subject = "General",
  paperTitle = "",
  questionsText = "",
  file = null,
}) => {
  let extractedText = String(questionsText || "").trim();
  let imageDataUrl = null;
  let uploadedName = file?.originalname || "";

  if (file?.buffer) {
    const mime = String(file.mimetype || "").toLowerCase();
    if (mime.startsWith("image/")) {
      imageDataUrl = `data:${mime};base64,${file.buffer.toString("base64")}`;
    } else if (mime.includes("text") || uploadedName.toLowerCase().endsWith(".txt")) {
      const textContent = file.buffer.toString("utf8").trim();
      extractedText = [extractedText, textContent].filter(Boolean).join("\n\n").slice(0, 9000);
    } else if (mime.includes("pdf") || uploadedName.toLowerCase().endsWith(".pdf")) {
      const pdfText = extractReadableTextFromPdfBuffer(file.buffer);
      if (pdfText) {
        extractedText = [extractedText, `Extracted PDF text (${uploadedName}):\n${pdfText}`]
          .filter(Boolean)
          .join("\n\n")
          .slice(0, 9000);
      }
    }
  }

  const systemPrompt =
    "You are a senior Cameroon GCE Chief Examiner. Produce crystal-clear, exam-standard model answers with mark allocations, marking scheme points, and concise examiner tips. Return strictly valid JSON.";

  const userPrompt = `
Generate exam-standard model answers for:
- Level: ${level}
- Subject: ${subject}
- Paper Title: ${paperTitle || uploadedName || `${level} ${subject} Paper`}
- Paper Content / Questions:
${extractedText || (imageDataUrl ? "Read all questions shown in the attached exam paper image carefully." : `Create 4 representative ${level} ${subject} GCE exam questions and provide complete exam-standard model answers for ${paperTitle || subject}.`)}

Return valid JSON in this exact shape:
{
  "paperSummary": "Brief 1-2 sentence overview of the paper and syllabus focus",
  "totalMarks": 20,
  "items": [
    {
      "questionNumber": "1(a)",
      "question": "Full question prompt",
      "marks": 5,
      "modelAnswer": "Complete exam-standard solution formatted clearly in paragraphs or numbered steps",
      "markingPoints": ["1 mark for ...", "2 marks for ..."],
      "examinerTip": "Practical advice on avoiding common mistakes"
    }
  ]
}
`.trim();

  try {
    const ai = await callLLMJson({ systemPrompt, userPrompt, imageDataUrl, maxTokens: 3200 });
    if (ai && Array.isArray(ai.items) && ai.items.length > 0) {
      return {
        source: "ai",
        level,
        subject,
        paperTitle: paperTitle || uploadedName || `${level} ${subject}`,
        paperSummary: ai.paperSummary || `Exam-standard model answers for ${level} ${subject}.`,
        totalMarks:
          Number(ai.totalMarks) ||
          ai.items.reduce((sum, item) => sum + (Number(item.marks) || 0), 0),
        items: ai.items.map((item, idx) => ({
          id: `ma-${idx + 1}`,
          questionNumber: String(item.questionNumber || `${idx + 1}`),
          question: String(item.question || `Question ${idx + 1}`),
          marks: Number(item.marks) || 5,
          modelAnswer: String(item.modelAnswer || ""),
          markingPoints: Array.isArray(item.markingPoints) ? item.markingPoints.map(String) : [],
          examinerTip: String(item.examinerTip || ""),
        })),
      };
    }
  } catch (err) {
    console.warn("Model answers AI generation failed, using structured fallback:", err.message);
  }

  const lines = extractedText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 10)
    .slice(0, 5);

  const fallbackQuestions = lines.length
    ? lines
    : [
        `Define the core principles examined in ${paperTitle || subject} at ${level}.`,
        `Explain two practical applications of ${subject} concepts tested in GCE examinations.`,
        `Outline the standard step-by-step method used to solve structured problems in ${subject}.`,
      ];

  const items = fallbackQuestions.map((q, idx) => ({
    id: `ma-fb-${idx + 1}`,
    questionNumber: `${idx + 1}`,
    question: q,
    marks: 5,
    modelAnswer: `State the precise ${level} ${subject} definition first, then develop two clearly separated analytical points supported with a relevant syllabus example or formula. Conclude by directly linking your explanation back to the command word in the question.`,
    markingPoints: [
      "1 mark for accurate syllabus definition using standard terminology",
      "2 marks for two clearly developed explanation points",
      "2 marks for correct application, diagram/formula, or worked illustration",
    ],
    examinerTip:
      "Underline command words (Define, Explain, Compare, Calculate) and match the depth of your response to the marks allocated.",
  }));

  return {
    source: "fallback",
    level,
    subject,
    paperTitle: paperTitle || uploadedName || `${level} ${subject}`,
    paperSummary: `Structured exam-standard guide for ${level} ${subject}.`,
    totalMarks: items.reduce((s, i) => s + i.marks, 0),
    items,
  };
};

/* ─────────────────────────────────────────────────────────────────────────── *
 * 2. MARK MY ANSWERS (Generate Guided Questions + AI Marking & Analysis)
 * ─────────────────────────────────────────────────────────────────────────── */
export const generateMarkingQuestions = async ({
  level = "O-Level",
  subject = "Accounting",
  topic = "Core Syllabus",
  count = 3,
}) => {
  const safeCount = Math.min(6, Math.max(1, Number(count) || 3));
  const systemPrompt =
    "You are a Cameroon GCE examiner creating short-answer and structured exam questions for students to answer and have marked. Return strictly valid JSON.";

  const userPrompt = `
Create ${safeCount} realistic ${level} GCE structured exam questions for:
- Subject: ${subject}
- Topic: ${topic}

Return valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "Clear GCE-style question with command word",
      "marks": 4,
      "hint": "Short hint on what examiners expect"
    }
  ]
}
`.trim();

  try {
    const ai = await callLLMJson({ systemPrompt, userPrompt, maxTokens: 1600 });
    if (ai && Array.isArray(ai.questions) && ai.questions.length > 0) {
      return {
        source: "ai",
        questions: ai.questions.slice(0, safeCount).map((q, idx) => ({
          id: q.id || `mq-${Date.now()}-${idx}`,
          question: String(q.question || ""),
          marks: Math.min(20, Math.max(1, Number(q.marks) || 4)),
          hint: String(q.hint || ""),
        })),
      };
    }
  } catch (err) {
    console.warn("Guided marking questions AI failed, using fallback:", err.message);
  }

  const defaults = [
    {
      question: `Define the main concept of ${topic} in ${level} ${subject} and state two reasons why it is important.`,
      marks: 4,
      hint: "Give a concise definition (2 marks) followed by two distinct points (1 mark each).",
    },
    {
      question: `With the aid of a relevant example, explain how ${topic} is applied in practical ${subject} scenarios.`,
      marks: 5,
      hint: "Include a real syllabus example and clearly connect it to the theory.",
    },
    {
      question: `Distinguish between two key components or classifications within ${topic} (${subject}).`,
      marks: 6,
      hint: "Use clear comparative points showing both differences clearly.",
    },
  ];

  return {
    source: "fallback",
    questions: defaults.slice(0, safeCount).map((q, idx) => ({
      id: `mq-fb-${Date.now()}-${idx}`,
      ...q,
    })),
  };
};

const gradeFromPercentage = (pct) => {
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  if (pct >= 40) return "E";
  return "U";
};

export const markStudentAnswers = async ({
  level = "O-Level",
  subject = "General",
  topic = "General",
  entries = [],
}) => {
  const cleanEntries = (Array.isArray(entries) ? entries : [])
    .filter((e) => e && String(e.question || "").trim())
    .slice(0, 10)
    .map((e, idx) => ({
      id: e.id || `ans-${idx + 1}`,
      question: String(e.question).trim(),
      studentAnswer: String(e.studentAnswer || "").trim(),
      maxMarks: Math.min(25, Math.max(1, Number(e.maxMarks) || 5)),
    }));

  if (!cleanEntries.length) {
    throw new Error("Please provide at least one question to mark.");
  }

  const systemPrompt =
    "You are a fair, thorough Cameroon GCE Examiner. Grade each student answer strictly against official exam standards, award partial credit fairly, identify exact missing marking points, and write an exam-standard model answer. Return strictly valid JSON.";

  const userPrompt = `
Mark the following ${level} ${subject} (${topic}) student responses:
${JSON.stringify(cleanEntries, null, 2)}

Return valid JSON in this exact shape:
{
  "overallSummary": "Concise encouraging performance analysis highlighting key strengths and next revision focus",
  "studyRecommendations": ["Specific actionable revision tip 1", "Specific tip 2", "Specific tip 3"],
  "evaluations": [
    {
      "id": "matching entry id",
      "score": 3,
      "maxMarks": 5,
      "verdict": "Good attempt",
      "strengths": ["Point the student got right"],
      "missingPoints": ["Key marking point missing or inaccurate"],
      "feedback": "Clear examiner explanation of why this score was awarded",
      "modelAnswer": "Concise full-marks exam-standard answer"
    }
  ]
}
`.trim();

  try {
    const ai = await callLLMJson({ systemPrompt, userPrompt, maxTokens: 3200 });
    if (ai && Array.isArray(ai.evaluations) && ai.evaluations.length > 0) {
      const evaluations = cleanEntries.map((entry, idx) => {
        const matched =
          ai.evaluations.find((ev) => String(ev.id) === String(entry.id)) ||
          ai.evaluations[idx] ||
          {};
        const maxMarks = entry.maxMarks;
        const score = Math.min(maxMarks, Math.max(0, Math.round(Number(matched.score) || 0)));
        return {
          id: entry.id,
          question: entry.question,
          studentAnswer: entry.studentAnswer,
          score,
          maxMarks,
          verdict:
            String(matched.verdict || "") ||
            (score / maxMarks >= 0.75 ? "Strong" : score / maxMarks >= 0.5 ? "Pass" : "Needs Work"),
          strengths: Array.isArray(matched.strengths) ? matched.strengths.map(String) : [],
          missingPoints: Array.isArray(matched.missingPoints)
            ? matched.missingPoints.map(String)
            : [],
          feedback: String(matched.feedback || ""),
          modelAnswer: String(matched.modelAnswer || ""),
        };
      });

      const totalScore = evaluations.reduce((s, e) => s + e.score, 0);
      const totalMax = evaluations.reduce((s, e) => s + e.maxMarks, 0);
      const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

      return {
        source: "ai",
        level,
        subject,
        topic,
        totalScore,
        totalMax,
        percentage,
        grade: gradeFromPercentage(percentage),
        overallSummary: String(
          ai.overallSummary || `You scored ${totalScore}/${totalMax} (${percentage}%).`,
        ),
        studyRecommendations: Array.isArray(ai.studyRecommendations)
          ? ai.studyRecommendations.map(String)
          : [],
        evaluations,
      };
    }
  } catch (err) {
    console.warn("AI answer marking failed, using structured heuristic fallback:", err.message);
  }

  // Deterministic heuristic fallback if external LLM is unavailable.
  const evaluations = cleanEntries.map((entry) => {
    const words = entry.studentAnswer.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const ratio =
      wordCount === 0 ? 0 : wordCount < 8 ? 0.3 : wordCount < 20 ? 0.55 : wordCount < 40 ? 0.75 : 0.85;
    const score = Math.min(entry.maxMarks, Math.round(entry.maxMarks * ratio));
    return {
      id: entry.id,
      question: entry.question,
      studentAnswer: entry.studentAnswer,
      score,
      maxMarks: entry.maxMarks,
      verdict: wordCount === 0 ? "Unanswered" : score / entry.maxMarks >= 0.7 ? "Good Attempt" : "Partial Credit",
      strengths:
        wordCount > 0
          ? ["Attempted the question using relevant written structure."]
          : [],
      missingPoints:
        wordCount === 0
          ? ["No answer was submitted for this question."]
          : [
              "Include precise syllabus definitions and explicit worked examples to secure full marks.",
              "Structure separate marking points clearly to match the mark allocation.",
            ],
      feedback:
        wordCount === 0
          ? "Always attempt every part of a GCE question—partial credit is awarded for correct definitions and working."
          : `Awarded ${score}/${entry.maxMarks}. Expand key technical terms in ${subject} and link directly to the question's command word.`,
      modelAnswer: `A full-marks ${level} ${subject} response defines the central concept in "${topic}", develops ${Math.max(2, Math.ceil(entry.maxMarks / 2))} distinct analytical points, and supports them with an accurate syllabus example.`,
    };
  });

  const totalScore = evaluations.reduce((s, e) => s + e.score, 0);
  const totalMax = evaluations.reduce((s, e) => s + e.maxMarks, 0);
  const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  return {
    source: "fallback",
    level,
    subject,
    topic,
    totalScore,
    totalMax,
    percentage,
    grade: gradeFromPercentage(percentage),
    overallSummary: `Completed marking for ${evaluations.length} question(s) with an overall score of ${percentage}% (Grade ${gradeFromPercentage(percentage)}).`,
    studyRecommendations: [
      `Review official ${level} ${subject} syllabus definitions for ${topic}.`,
      "Practice structuring answers with clear bullet points matched to mark allocations.",
      "Time yourself under Pre-GCE Simulation mode to build exam confidence.",
    ],
    evaluations,
  };
};

/* ─────────────────────────────────────────────────────────────────────────── *
 * 3. PRE-GCE QUESTION GENERATOR (Real-time Simulation)
 * ─────────────────────────────────────────────────────────────────────────── */
export const generatePreGceSimulation = async ({
  level = "O-Level",
  subject = "Chemistry",
  paperType = "paper1",
  topic = "Full Syllabus",
  count = 10,
  durationMinutes = 30,
  papers = [],
}) => {
  const isStructured = paperType === "paper2";
  const safeCount = isStructured
    ? Math.min(10, Math.max(2, Number(count) || 4))
    : Math.min(30, Math.max(5, Number(count) || 10));

  const systemPrompt =
    "You are a Cameroon GCE Board examination setter. Create authentic, rigorous, syllabus-accurate GCE simulation questions with clear phrasing, balanced distractors, and concise examiner explanations. Return strictly valid JSON.";

  const userPrompt = isStructured
    ? `
Create a realistic ${level} GCE Paper 2 (Structured / Essay) simulation for:
- Subject: ${subject}
- Focus: ${topic || "Full Syllabus"}
- Number of Questions: ${safeCount}

Return valid JSON:
{
  "paperCode": "e.g. 0515 / Paper 2",
  "instructions": "Authentic GCE exam instruction line",
  "questions": [
    {
      "id": "p2-1",
      "topicTag": "Specific syllabus topic",
      "question_text": "Full GCE structured question (may include parts a and b)",
      "marks": 6,
      "modelAnswer": "Complete exam-standard marking scheme answer",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ]
}
`.trim()
    : `
Create a realistic ${level} GCE Paper 1 (Multiple Choice) simulation for:
- Subject: ${subject}
- Focus: ${topic || "Full Syllabus"}
- Number of Questions: ${safeCount}

Return valid JSON:
{
  "paperCode": "e.g. 0515 / Paper 1",
  "instructions": "Answer ALL questions. Choose the single best option A, B, C, or D.",
  "questions": [
    {
      "id": "p1-1",
      "topicTag": "Specific syllabus topic",
      "question_text": "Authentic GCE multiple-choice stem",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "answer": "Exact text of the correct option",
      "explanation": "Concise syllabus explanation of why this answer is correct"
    }
  ]
}
`.trim();

  try {
    const ai = await callLLMJson({ systemPrompt, userPrompt, maxTokens: 3600 });
    if (ai && Array.isArray(ai.questions) && ai.questions.length > 0) {
      const normalized = ai.questions
        .slice(0, safeCount)
        .map((q, idx) => {
          if (isStructured) {
            return {
              id: q.id || `gce-p2-${randomUUID()}`,
              topicTag: String(q.topicTag || topic || subject),
              question_text: String(q.question_text || q.question || ""),
              marks: Math.min(20, Math.max(2, Number(q.marks) || 5)),
              modelAnswer: String(q.modelAnswer || ""),
              keyPoints: Array.isArray(q.keyPoints) ? q.keyPoints.map(String) : [],
            };
          }
          const options = Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [];
          const answer = options.includes(String(q.answer)) ? String(q.answer) : options[0] || "";
          return {
            id: q.id || `gce-p1-${randomUUID()}`,
            topicTag: String(q.topicTag || topic || subject),
            question_text: String(q.question_text || q.question || ""),
            options,
            answer,
            explanation: String(q.explanation || ""),
          };
        })
        .filter((q) => q.question_text && (isStructured || q.options.length >= 2));

      if (normalized.length > 0) {
        return {
          source: "ai",
          level,
          subject,
          topic: topic || "Full Syllabus",
          paperType,
          paperCode: String(ai.paperCode || `${level} · ${paperType === "paper2" ? "Paper 2" : "Paper 1"}`),
          instructions: String(
            ai.instructions ||
              (isStructured
                ? "Answer all structured questions clearly, showing all working where necessary."
                : "Select the single best answer for each question before time expires."),
          ),
          durationMinutes: Number(durationMinutes) || 30,
          questions: normalized,
        };
      }
    }
  } catch (err) {
    console.warn("Pre-GCE AI generation failed, falling back to examService:", err.message);
  }

  if (isStructured) {
    const questions = Array.from({ length: safeCount }, (_, idx) => ({
      id: `gce-p2-fb-${idx + 1}`,
      topicTag: topic || subject,
      question_text: `Question ${idx + 1}: In ${level} ${subject} (${topic || "core syllabus"}), state the main principle involved and explain its application using a worked example.`,
      marks: 5,
      modelAnswer: `State the standard ${level} definition accurately, explain the underlying mechanism or rule, and illustrate with a concrete syllabus example.`,
      keyPoints: [
        "Accurate definition (1 mark)",
        "Clear explanation of principle (2 marks)",
        "Relevant syllabus example or working (2 marks)",
      ],
    }));
    return {
      source: "fallback",
      level,
      subject,
      topic: topic || "Full Syllabus",
      paperType,
      paperCode: `${level} · Paper 2`,
      instructions: "Answer all structured questions clearly, showing all working.",
      durationMinutes: Number(durationMinutes) || 30,
      questions,
    };
  }

  const fallbackMcq = await generateExam({
    subject,
    topic: topic || "General",
    count: safeCount,
    papers,
  });

  return {
    source: "fallback",
    level,
    subject,
    topic: topic || "Full Syllabus",
    paperType,
    paperCode: `${level} · Paper 1`,
    instructions: "Answer ALL questions. Select the single best option.",
    durationMinutes: Number(durationMinutes) || 30,
    questions: fallbackMcq.map((q) => ({
      ...q,
      topicTag: topic || subject,
      explanation: `Review the ${level} ${subject} syllabus principles for ${topic || subject} to reinforce this concept.`,
    })),
  };
};

/* ─────────────────────────────────────────────────────────────────────────── *
 * 4. QUIZ ENGINE (Fresh Syllabus Questions — Zero Repeats)
 * ─────────────────────────────────────────────────────────────────────────── */
export const generateFreshQuiz = async ({
  level = "O-Level",
  subject = "Accounting",
  topic = "General",
  difficulty = "standard",
  count = 8,
  excludeQuestions = [],
  papers = [],
}) => {
  const safeCount = Math.min(20, Math.max(3, Number(count) || 8));
  const excludedList = (Array.isArray(excludeQuestions) ? excludeQuestions : [])
    .map((q) => String(q).trim())
    .filter(Boolean)
    .slice(-40);

  const seed = randomUUID().slice(0, 8);
  const systemPrompt =
    "You are an adaptive Cameroon GCE syllabus quiz engine. Every quiz is drawn fresh directly from the syllabus with unique phrasing, varied sub-topics, and clear teaching explanations. Never repeat any excluded question. Return strictly valid JSON.";

  const userPrompt = `
Generate ${safeCount} brand-new, non-repeating multiple-choice quiz questions drawn fresh from the ${level} ${subject} syllabus.
- Syllabus Topic: ${topic}
- Difficulty: ${difficulty} (foundational | standard | challenging)
- Freshness Seed: ${seed}
${excludedList.length ? `- DO NOT repeat or closely paraphrase any of these previously seen questions:\n${excludedList.map((q, i) => `${i + 1}. ${q}`).join("\n")}` : ""}

Return valid JSON:
{
  "quizTitle": "Short dynamic title for this fresh syllabus quiz",
  "questions": [
    {
      "id": "qz-1",
      "concept": "Sub-concept tested",
      "question_text": "Clear, freshly written syllabus question",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "answer": "Exact text of the correct option",
      "explanation": "Clear 1-2 sentence syllabus explanation teaching why the answer is correct"
    }
  ]
}
`.trim();

  try {
    const ai = await callLLMJson({ systemPrompt, userPrompt, maxTokens: 3200 });
    if (ai && Array.isArray(ai.questions) && ai.questions.length > 0) {
      const normalized = ai.questions
        .slice(0, safeCount)
        .map((q) => {
          const options = Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [];
          const answer = options.includes(String(q.answer)) ? String(q.answer) : options[0] || "";
          return {
            id: `qz-${randomUUID()}`,
            concept: String(q.concept || topic),
            question_text: String(q.question_text || q.question || ""),
            options,
            answer,
            explanation: String(q.explanation || ""),
          };
        })
        .filter((q) => q.question_text && q.options.length >= 2);

      if (normalized.length > 0) {
        return {
          source: "ai",
          level,
          subject,
          topic,
          difficulty,
          quizTitle: String(ai.quizTitle || `${subject}: ${topic} Fresh Quiz`),
          questions: normalized,
        };
      }
    }
  } catch (err) {
    console.warn("Quiz Engine AI generation failed, falling back:", err.message);
  }

  const fallback = await generateExam({ subject, topic, count: safeCount, papers });
  return {
    source: "fallback",
    level,
    subject,
    topic,
    difficulty,
    quizTitle: `${subject}: ${topic} Syllabus Quiz`,
    questions: fallback.map((q) => ({
      ...q,
      concept: topic,
      explanation: `This question reinforces core ${level} ${subject} syllabus concepts under ${topic}.`,
    })),
  };
};

/* ─────────────────────────────────────────────────────────────────────────── *
 * 5. LEARNING PAGE — AUTOMATIC TOPIC NOTES ENGINE
 * ─────────────────────────────────────────────────────────────────────────── */
export const generateTopicNotes = async ({
  level = "O-Level",
  subject = "Accounting",
  moduleTitle = "",
  topicTitle = "Accounting Environment",
  concepts = [],
  objectives = [],
}) => {
  const cleanConcepts = Array.isArray(concepts) ? concepts.map(String).filter(Boolean) : [];
  const cleanObjectives = Array.isArray(objectives) ? objectives.map(String).filter(Boolean) : [];

  const systemPrompt =
    "You are an expert Cameroon GCE teacher and textbook author for S-Learn. Generate comprehensive, structured, student-friendly, exam-ready study notes that thoroughly cover every syllabus concept and learning objective. Return strictly valid JSON.";

  const userPrompt = `
Generate complete, structured study notes for:
- Level: ${level}
- Subject: ${subject}
- Module: ${moduleTitle || subject}
- Topic: ${topicTitle}
- Syllabus Concepts to Cover: ${cleanConcepts.length ? cleanConcepts.join(", ") : topicTitle}
- Learning Objectives:
${cleanObjectives.length ? cleanObjectives.map((o) => `- ${o}`).join("\n") : `- Understand and apply ${topicTitle} in ${level} ${subject}`}

Return valid JSON in this exact shape:
{
  "readingTimeMinutes": 6,
  "overview": "Engaging 2-3 sentence introduction explaining what this topic is and why it matters in GCE exams.",
  "keyDefinitions": [
    {
      "term": "Concept name",
      "definition": "Clear, exam-ready definition"
    }
  ],
  "sections": [
    {
      "heading": "Clear section heading",
      "content": "Thorough, easy-to-follow teaching explanation (2-3 paragraphs or clear prose)",
      "bulletPoints": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"],
      "workedExample": "Optional concrete worked example, case study, formula, or journal entry illustrating the concept (empty string if not needed)"
    }
  ],
  "examTips": [
    "High-yield GCE exam tip 1",
    "Common mistake students make and how to avoid it"
  ],
  "quickCheck": [
    {
      "question": "Quick self-test question on this topic",
      "answer": "Concise correct answer"
    }
  ]
}
`.trim();

  try {
    const ai = await callLLMJson({ systemPrompt, userPrompt, maxTokens: 3600 });
    if (ai && Array.isArray(ai.sections) && ai.sections.length > 0) {
      return {
        source: "ai",
        generatedAt: new Date().toISOString(),
        level,
        subject,
        moduleTitle,
        topicTitle,
        readingTimeMinutes: Math.max(3, Number(ai.readingTimeMinutes) || 6),
        overview: String(ai.overview || ""),
        keyDefinitions: Array.isArray(ai.keyDefinitions)
          ? ai.keyDefinitions.map((d) => ({
              term: String(d.term || ""),
              definition: String(d.definition || ""),
            }))
          : [],
        sections: ai.sections.map((s) => ({
          heading: String(s.heading || ""),
          content: String(s.content || ""),
          bulletPoints: Array.isArray(s.bulletPoints) ? s.bulletPoints.map(String) : [],
          workedExample: String(s.workedExample || ""),
        })),
        examTips: Array.isArray(ai.examTips) ? ai.examTips.map(String) : [],
        quickCheck: Array.isArray(ai.quickCheck)
          ? ai.quickCheck.map((qc) => ({
              question: String(qc.question || ""),
              answer: String(qc.answer || ""),
            }))
          : [],
      };
    }
  } catch (err) {
    console.warn("Notes AI generation failed, using structured syllabus fallback:", err.message);
  }

  // Rich structured educational fallback built directly from the syllabus concepts & objectives.
  const keyDefinitions = (cleanConcepts.length ? cleanConcepts : [topicTitle]).map((concept) => ({
    term: concept.charAt(0).toUpperCase() + concept.slice(1),
    definition: `A core ${level} ${subject} syllabus concept under "${topicTitle}" that students must define accurately and apply in structured GCE questions.`,
  }));

  const sections = (
    cleanObjectives.length
      ? cleanObjectives
      : [`Master the core principles of ${topicTitle}`, `Apply ${topicTitle} to GCE exam problems`]
  ).map((objective, idx) => ({
    heading: `${idx + 1}. ${objective}`,
    content: `In ${level} ${subject}, this objective focuses on mastering "${objective.toLowerCase()}". Examiners test both your conceptual clarity and your ability to connect this idea to practical real-world or experimental examples under ${moduleTitle || subject}.`,
    bulletPoints: [
      `Learn the standard syllabus definition and terminology tied to ${cleanConcepts[idx % Math.max(1, cleanConcepts.length)] || topicTitle}.`,
      `Be ready to compare, classify, or demonstrate relationships clearly in structured questions.`,
      `Practice applying this principle to past GCE questions under timed conditions.`,
    ],
    workedExample:
      idx === 0
        ? `Exam Approach Example: When asked to "${objective}", begin with a crisp 1-sentence syllabus definition, follow with 2–3 distinct explained points, and close with a concrete ${subject} illustration.`
        : "",
  }));

  return {
    source: "fallback",
    generatedAt: new Date().toISOString(),
    level,
    subject,
    moduleTitle,
    topicTitle,
    readingTimeMinutes: Math.max(4, sections.length * 2),
    overview: `These structured ${level} ${subject} study notes guide you through "${topicTitle}"${moduleTitle ? ` (${moduleTitle})` : ""}, covering every syllabus concept and learning objective required for exam mastery.`,
    keyDefinitions,
    sections,
    examTips: [
      `Always use exact ${level} ${subject} syllabus keywords when defining terms in "${topicTitle}".`,
      "Match the number of points in your answer to the marks allocated in the question.",
      "Follow up immediately with the Quiz Engine to test recall without notes.",
    ],
    quickCheck: [
      {
        question: `What are the key ideas covered under "${topicTitle}" in ${level} ${subject}?`,
        answer: cleanConcepts.length
          ? `The core syllabus concepts are: ${cleanConcepts.join(", ")}.`
          : `Core principles, definitions, and exam applications of ${topicTitle}.`,
      },
      {
        question: `How can you earn full marks on a structured question about ${topicTitle}?`,
        answer:
          "State accurate definitions first, present clear distinct points aligned with the command word, and include a relevant syllabus example or calculation.",
      },
    ],
  };
};
