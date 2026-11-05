import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pythonScript = path.resolve(__dirname, "../../ml_exam_generator.py");

const normalizeQuestion = (question, index) => {
    const rawQuestion = question.question_text || question.question || question.text;
    const options = Array.isArray(question.options)
        ? question.options
        : Array.isArray(question.options_list)
            ? question.options_list
            : [];
    const answer = question.answer || options[0] || "";

    if (!rawQuestion) return null;

    return {
        id: `ml-${Date.now()}-${index}`,
        question_text: rawQuestion,
        options: options.length >= 2 ? options.slice(0, 4) : [
            "A valid concept from the learned paper pattern.",
            "An unrelated concept that does not match the source material.",
            "A fact that contradicts the learned topic.",
            "A statement that cannot be supported by the past paper.",
        ],
        answer: options.includes(answer) ? answer : options[0] || "",
    };
};

export const generateWithLocalML = async ({ subject, topic, count, papers = [] }) => {
    const pythonExecutable = process.env.PYTHON_EXECUTABLE || (process.platform === "win32" ? "py" : "python3");
    const pythonArguments = process.platform === "win32" && !process.env.PYTHON_EXECUTABLE ? ["-3.12"] : [];
    const paperFolder = process.env.PAST_PAPERS_FOLDER || path.resolve(__dirname, "../../../../documents/papers");
    const outputFile = path.join(os.tmpdir(), `s-learn-exam-${process.pid}-${Date.now()}.json`);

    try {
        const { stdout } = await execFileAsync(
            pythonExecutable,
            [
                ...pythonArguments,
                pythonScript,
                "--folder",
                paperFolder,
                "--subject",
                subject,
                "--topic",
                topic,
                "--count",
                String(Math.max(1, Number(count) || 5)),
                "--output",
                outputFile,
            ],
            {
                env: process.env,
                timeout: 120000,
                maxBuffer: 10 * 1024 * 1024,
                windowsHide: true,
            },
        );

        const output = JSON.parse(fs.readFileSync(outputFile, "utf8"));
        const questions = Array.isArray(output.questions) ? output.questions : [];
        return questions
            .map(normalizeQuestion)
            .filter(Boolean)
            .slice(0, Math.max(1, Number(count) || 5));
    } catch (err) {
        console.warn("Local ML exam generation unavailable:", err.message);
        return [];
    } finally {
        try {
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        } catch {
            // Temporary output cleanup is best-effort.
        }
    }
};
