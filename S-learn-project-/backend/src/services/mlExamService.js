import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(backendRoot, "../..");
const pythonScript = path.resolve(backendRoot, "ml_exam_generator.py");
const defaultModelPath = path.resolve(backendRoot, "ml_models/slearn_exam_model.joblib");

const resolvePythonCommand = () => {
  const envPy = process.env.PYTHON_EXECUTABLE;
  if (envPy && fs.existsSync(envPy)) {
    return { executable: envPy, args: [] };
  }

  const localVenvCandidates =
    process.platform === "win32"
      ? [
          path.resolve(backendRoot, ".venv-ml/Scripts/python.exe"),
          path.resolve(repoRoot, ".venv/Scripts/python.exe"),
        ]
      : [
          path.resolve(backendRoot, ".venv-ml/bin/python"),
          path.resolve(repoRoot, ".venv/bin/python"),
        ];

  const found = localVenvCandidates.find((candidate) => fs.existsSync(candidate));
  if (found) {
    return { executable: found, args: [] };
  }

  if (process.platform === "win32") {
    return { executable: "py", args: ["-3.12"] };
  }
  return { executable: "python3", args: [] };
};

const resolvePaperFolder = () => {
  const envFolder = process.env.PAST_PAPERS_FOLDER;
  if (envFolder && fs.existsSync(envFolder)) {
    return envFolder;
  }
  const docsRoot = path.resolve(repoRoot, "documents");
  if (fs.existsSync(docsRoot)) return docsRoot;
  return path.resolve(docsRoot, "papers");
};

const normalizeQuestion = (question, index, paperType = "paper1") => {
  const rawQuestion = question.question_text || question.question || question.text;
  if (!rawQuestion) return null;

  if (paperType === "paper2" || paperType === "paper3") {
    return {
      id: question.id || `ml-${paperType}-${Date.now()}-${index}`,
      topicTag: question.topicTag || question.topic || "",
      question_text: rawQuestion,
      marks: Number(question.marks) || (paperType === "paper3" ? 10 : 6),
      modelAnswer: question.modelAnswer || "",
      keyPoints: Array.isArray(question.keyPoints) ? question.keyPoints.map(String) : [],
      source: question.source || "slearn-ml",
    };
  }

  const options = Array.isArray(question.options)
    ? question.options
    : Array.isArray(question.options_list)
      ? question.options_list
      : [];
  const answer = question.answer || options[0] || "";

  return {
    id: question.id || `ml-${Date.now()}-${index}`,
    topicTag: question.topicTag || question.topic || "",
    concept: question.topic || question.topicTag || "",
    question_text: rawQuestion,
    options:
      options.length >= 2
        ? options.slice(0, 4)
        : [
            "A valid concept from the learned paper pattern.",
            "An unrelated concept that does not match the source material.",
            "A fact that contradicts the learned topic.",
            "A statement that cannot be supported by the past paper.",
          ],
    answer: options.includes(answer) ? answer : options[0] || "",
    explanation: question.explanation || "",
    source: question.source || "slearn-ml",
  };
};

export const generateWithLocalML = async ({
  level = "O-Level",
  subject,
  topic = "",
  paperType = "paper1",
  count = 10,
  excludeQuestions = [],
}) => {
  const { executable, args } = resolvePythonCommand();
  const paperFolder = resolvePaperFolder();
  const safeType = ["paper1", "paper2", "paper3"].includes(paperType) ? paperType : "paper1";
  const outputFile = path.join(os.tmpdir(), `s-learn-exam-${process.pid}-${Date.now()}.json`);
  let excludeFile = "";

  try {
    const cliArgs = [
      ...args,
      pythonScript,
      "--folder",
      paperFolder,
      "--model",
      defaultModelPath,
      "--level",
      level,
      "--paper-type",
      safeType,
      "--subject",
      subject,
      "--topic",
      topic,
      "--count",
      String(Math.max(1, Number(count) || 5)),
      "--output",
      outputFile,
    ];

    if (Array.isArray(excludeQuestions) && excludeQuestions.length > 0) {
      excludeFile = path.join(os.tmpdir(), `s-learn-exclude-${process.pid}-${Date.now()}.json`);
      fs.writeFileSync(excludeFile, JSON.stringify(excludeQuestions.slice(-80)), "utf8");
      cliArgs.push("--exclude-file", excludeFile);
    }

    await execFileAsync(executable, cliArgs, {
      env: process.env,
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true,
    });

    const output = JSON.parse(fs.readFileSync(outputFile, "utf8"));
    const questions = Array.isArray(output.questions) ? output.questions : [];
    const normalized = questions
      .map((q, idx) => normalizeQuestion(q, idx, safeType))
      .filter(Boolean)
      .slice(0, Math.max(1, Number(count) || 5));

    // Attach metadata cleanly onto the returned array while staying backward-compatible.
    normalized.meta = {
      subjectMatched: Boolean(output.subject_matched),
      paperKeywords: Array.isArray(output.paper_keywords) ? output.paper_keywords : [],
      yearRange: Array.isArray(output.year_range) ? output.year_range : [0, 0],
      modelTrainedAt: output.model_trained_at || null,
    };
    return normalized;
  } catch (err) {
    console.warn("Local ML exam generation unavailable:", err.message);
    return [];
  } finally {
    for (const tmp of [outputFile, excludeFile]) {
      try {
        if (tmp && fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch {
        // best-effort cleanup
      }
    }
  }
};

export const assistWithLocalML = async ({
  level = "O-Level",
  subject = "",
  topic = "",
  query = "",
  count = 4,
}) => {
  const { executable, args } = resolvePythonCommand();
  const outputFile = path.join(os.tmpdir(), `s-learn-assist-${process.pid}-${Date.now()}.json`);

  try {
    await execFileAsync(
      executable,
      [
        ...args,
        pythonScript,
        "--assist",
        "--model",
        defaultModelPath,
        "--level",
        level,
        "--subject",
        subject,
        "--topic",
        topic,
        "--query",
        query || topic || subject,
        "--count",
        String(Math.max(1, Math.min(8, Number(count) || 4))),
        "--output",
        outputFile,
      ],
      {
        env: process.env,
        timeout: 45000,
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
      },
    );

    return JSON.parse(fs.readFileSync(outputFile, "utf8"));
  } catch (err) {
    console.warn("Local ML learning assist unavailable:", err.message);
    return null;
  } finally {
    try {
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    } catch {
      // best-effort cleanup
    }
  }
};
