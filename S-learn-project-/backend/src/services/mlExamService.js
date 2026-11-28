import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");
const runtimeModelUrl = new URL("../../ml_models/slearn_exam_model_runtime.json.gz", import.meta.url);
const runtimeModelPath = path.resolve(backendRoot, "ml_models/slearn_exam_model_runtime.json.gz");

const DEFAULT_SUBJECTS = [
  "Accounting",
  "Commerce",
  "Economics",
  "Mathematics",
  "Additional Mathematics",
  "Pure Mathematics with Mechanics",
  "Pure Mathematics with Statistics",
  "Further Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Human Biology",
  "Food and Nutrition",
  "Food Science and Nutrition",
  "Geography",
  "Geology",
  "Computer Science",
  "Information and Communication Technology (ICT)",
  "English Language",
  "Literature in English",
  "French",
  "Special Bilingual Education French",
  "History",
  "Citizenship Education",
  "Religious Studies",
  "Logic",
  "Philosophy",
];

const SUBJECT_ALIASES = {
  "accounting (ohada)": "Accounting",
  "ohada accounting": "Accounting",
  english: "English Language",
  literature: "Literature in English",
  pmaths: "Pure Mathematics with Mechanics",
  "pure math": "Pure Mathematics with Mechanics",
  "pure mathematics": "Pure Mathematics with Mechanics",
  "pure math mechanics": "Pure Mathematics with Mechanics",
  "pure math statistics": "Pure Mathematics with Statistics",
  "additional math": "Mathematics",
  "additional mathematics": "Mathematics",
  maths: "Mathematics",
  math: "Mathematics",
  cs: "Computer Science",
  ict: "Information and Communication Technology (ICT)",
  "food science and nutrition": "Food and Nutrition",
  citizenship: "Citizenship Education",
  "special bilingual education french": "French",
};

const GCE_SUBJECT_CODES = {
  "O-Level": {
    Accounting: "0505",
    Biology: "0510",
    Chemistry: "0515",
    Commerce: "0520",
    Economics: "0525",
    "English Language": "0530",
    "Literature in English": "0535",
    "Food and Nutrition": "0540",
    French: "0545",
    "Special Bilingual Education French": "0546",
    Geography: "0550",
    Geology: "0555",
    History: "0560",
    "Citizenship Education": "0562",
    "Human Biology": "0565",
    Mathematics: "0570",
    "Additional Mathematics": "0575",
    Physics: "0580",
    "Religious Studies": "0585",
    Logic: "0590",
    "Computer Science": "0595",
    "Information and Communication Technology (ICT)": "0596",
  },
  "A-Level": {
    Accounting: "0705",
    Biology: "0710",
    Chemistry: "0715",
    Commerce: "0720",
    Economics: "0725",
    "English Language": "0730",
    "Literature in English": "0735",
    "Food Science and Nutrition": "0740",
    "Food and Nutrition": "0740",
    French: "0745",
    "Special Bilingual Education French": "0746",
    Geography: "0750",
    Geology: "0755",
    History: "0760",
    "Pure Mathematics with Mechanics": "0765",
    "Pure Mathematics with Statistics": "0770",
    "Further Mathematics": "0775",
    Physics: "0780",
    "Religious Studies": "0785",
    Philosophy: "0790",
    "Computer Science": "0795",
    "Information and Communication Technology (ICT)": "0796",
  },
};

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
  "by", "can", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for",
  "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself",
  "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "me",
  "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
  "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should",
  "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
  "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up",
  "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why",
  "with", "would", "you", "your", "yours", "yourself", "yourselves",
]);

let cachedModel = null;
let loadError = null;

export const getOfficialGceCode = (level, subject) => {
  const canonical = canonicalSubject(subject);
  const levelMap = GCE_SUBJECT_CODES[level] || GCE_SUBJECT_CODES["O-Level"];
  return (
    levelMap[subject] ||
    levelMap[canonical] ||
    GCE_SUBJECT_CODES["O-Level"][canonical] ||
    GCE_SUBJECT_CODES["A-Level"][canonical] ||
    (level === "A-Level" ? "0700" : "0500")
  );
};

export const canonicalSubject = (name) => {
  const cleaned = String(name || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "General";
  const low = cleaned.toLowerCase();
  if (SUBJECT_ALIASES[low]) return SUBJECT_ALIASES[low];
  const exact = DEFAULT_SUBJECTS.find((s) => s.toLowerCase() === low);
  if (exact) return exact;
  const partial = DEFAULT_SUBJECTS.find((s) => low.includes(s.toLowerCase()));
  return partial || cleaned;
};

const loadRuntimeModel = () => {
  if (cachedModel) return cachedModel;
  try {
    let gzBuffer;
    try {
      gzBuffer = fs.readFileSync(runtimeModelUrl);
    } catch {
      gzBuffer = fs.readFileSync(runtimeModelPath);
    }
    const jsonStr = zlib.gunzipSync(gzBuffer).toString("utf8");
    const parsed = JSON.parse(jsonStr);

    // Build fast Map lookups for vocab & sparse document vectors
    if (parsed.classifier) {
      parsed.classifier._vocabMap = new Map(Object.entries(parsed.classifier.vocab));
      parsed.classifier._coefMaps = parsed.classifier.sparse_coefs.map(
        (entries) => new Map(entries),
      );
    }
    if (parsed.retrieval) {
      parsed.retrieval._vocabMap = new Map(Object.entries(parsed.retrieval.vocab));
    }

    cachedModel = parsed;
    loadError = null;
    return cachedModel;
  } catch (err) {
    loadError = err.message;
    console.error("Failed to load portable ML runtime model:", err.message);
    return null;
  }
};

// Matches scikit-learn TfidfVectorizer(stop_words="english", ngram_range=(1,2), sublinear_tf=True)
const vectorizeText = (text, vocabMap, idf) => {
  const rawTokens = String(text || "")
    .toLowerCase()
    .match(/[a-z0-9]{2,}/g) || [];
  const tokens = rawTokens.filter((t) => !STOP_WORDS.has(t));

  const counts = new Map();
  for (let i = 0; i < tokens.length; i++) {
    const uni = tokens[i];
    const uniIdx = vocabMap.get(uni);
    if (uniIdx !== undefined) {
      counts.set(uniIdx, (counts.get(uniIdx) || 0) + 1);
    }
    if (i + 1 < tokens.length) {
      const bi = `${uni} ${tokens[i + 1]}`;
      const biIdx = vocabMap.get(bi);
      if (biIdx !== undefined) {
        counts.set(biIdx, (counts.get(biIdx) || 0) + 1);
      }
    }
  }

  let normSq = 0;
  const weights = new Map();
  for (const [idx, tf] of counts.entries()) {
    const val = (1 + Math.log(tf)) * (idf[idx] || 1);
    weights.set(idx, val);
    normSq += val * val;
  }

  const norm = Math.sqrt(normSq) || 1;
  for (const [idx, val] of weights.entries()) {
    weights.set(idx, val / norm);
  }
  return weights;
};

const predictSubjectNative = (model, text) => {
  const clf = model?.classifier;
  if (!clf) return "General";
  const vec = vectorizeText(text, clf._vocabMap, clf.idf);
  if (vec.size === 0) return "General";

  let bestClass = clf.classes[0] || "General";
  let bestScore = -Infinity;

  for (let c = 0; c < clf.classes.length; c++) {
    let score = clf.intercept[c] || 0;
    const coefMap = clf._coefMaps[c];
    for (const [termIdx, tfWeight] of vec.entries()) {
      const w = coefMap.get(termIdx);
      if (w !== undefined) score += w * tfWeight;
    }
    if (score > bestScore) {
      bestScore = score;
      bestClass = clf.classes[c];
    }
  }
  return bestClass;
};

const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const paper3StyleForSubject = (subject) => {
  const low = String(subject || "").toLowerCase();
  if (/accounting|economics|commerce/.test(low)) return "commercial_case";
  if (/computer|ict/.test(low)) return "computing_practical";
  if (/literature|english|french|history|philosophy|religious|logic|citizenship/.test(low)) {
    return "arts_applied";
  }
  return "science_practical";
};

const buildWrittenGceQuestions = ({
  selectedMcqs,
  subject,
  level,
  topic,
  paperType,
  paperKeywords,
}) => {
  const isPaper3 = paperType === "paper3";
  const style = paper3StyleForSubject(subject);

  return selectedMcqs.map((mcq, idx) => {
    const stem = mcq.question_text;
    const correct = mcq.answer;
    const expl = mcq.explanation || "";
    const subtopic = mcq.topic || topic || subject;
    const kw = paperKeywords[idx % paperKeywords.length] || subtopic;

    if (!isPaper3) {
      const marks = [6, 8, 6, 10][idx % 4];
      const partAMarks = 2;
      const partBMarks = marks - partAMarks;
      return {
        id: `ml-paper2-${idx + 1}-${mcq.id || idx}`,
        section: idx < Math.ceil(selectedMcqs.length / 2) ? "SECTION A" : "SECTION B",
        topicTag: subtopic,
        question_text: `(a) ${stem} [${partAMarks} marks]\n(b) Explain the underlying ${level} ${subject} principle behind your answer, illustrating with a clear syllabus example, diagram, or worked calculation related to ${subtopic}. [${partBMarks} marks]`,
        marks,
        modelAnswer: `(a) ${correct}.\n\n(b) ${
          expl ||
          `In ${level} ${subject}, this principle directly governs ${subtopic} (linked to ${kw}). State the formal GCE syllabus rule, develop clear analytical steps, and support with a concrete worked illustration.`
        }`,
        keyPoints: [
          `${partAMarks} marks for accurately identifying/stating: ${correct}`,
          `2 marks for clear ${subject} conceptual explanation tied to ${subtopic}`,
          `${Math.max(2, partBMarks - 2)} marks for worked illustration, diagram, or syllabus application`,
        ],
        source: mcq.source || "slearn-ml",
      };
    }

    const marks = [10, 12, 10, 15][idx % 4];
    if (style === "science_practical") {
      return {
        id: `ml-paper3-${idx + 1}-${mcq.id || idx}`,
        section: "PRACTICAL EXAMINATION",
        topicTag: subtopic,
        question_text: `Practical & Experimental Analysis (${level} ${subject} · ${subtopic}):\nContext: ${stem}\n(a) State the expected scientific outcome or principle. [2 marks]\n(b) Design a concise laboratory procedure (apparatus, controlled variables, safety precautions, and observation table) to verify this principle. [${marks - 4} marks]\n(c) Identify one likely source of experimental error and explain how to minimise it. [2 marks]`,
        marks,
        modelAnswer: `(a) Expected outcome/principle: ${correct}.\n(b) Procedure: Assemble standard ${subject} apparatus for ${subtopic}, control variables systematically, record repeat readings in a labelled table, and observe laboratory safety rules. ${expl}\n(c) Error & Precaution: Minimise parallax and systematic errors by repeating trials and taking average readings.`,
        keyPoints: [
          `2 marks for stating core scientific finding: ${correct}`,
          `${marks - 6} marks for valid apparatus, step-by-step method, and variable control`,
          "2 marks for safety precautions and observation table",
          "2 marks for realistic error analysis and precaution",
        ],
        source: mcq.source || "slearn-ml",
      };
    }

    if (style === "computing_practical") {
      return {
        id: `ml-paper3-${idx + 1}-${mcq.id || idx}`,
        section: "PRACTICAL PROGRAMMING & SYSTEMS TASK",
        topicTag: subtopic,
        question_text: `Practical Task (${level} ${subject} · ${subtopic}):\nScenario: ${stem}\n(a) Identify the correct technical solution. [2 marks]\n(b) Write clean pseudocode, SQL, or structured implementation steps demonstrating this solution. [${marks - 5} marks]\n(c) Design test cases (normal, boundary, and erroneous inputs) to validate your solution. [3 marks]`,
        marks,
        modelAnswer: `(a) Correct technical solution: ${correct}.\n(b) Implementation: Structure clear inputs, processing logic, and outputs aligned with ${subtopic}. ${expl}\n(c) Validation: Test standard inputs, boundary values, and invalid inputs with clear error handling.`,
        keyPoints: [
          `2 marks for accurate technical determination: ${correct}`,
          `${marks - 5} marks for logically correct pseudocode/implementation`,
          "3 marks for complete test-plan coverage (normal, boundary, invalid)",
        ],
        source: mcq.source || "slearn-ml",
      };
    }

    if (style === "commercial_case") {
      return {
        id: `ml-paper3-${idx + 1}-${mcq.id || idx}`,
        section: "APPLIED CASE STUDY & DATA RESPONSE",
        topicTag: subtopic,
        question_text: `Applied Case Study (${level} ${subject} · ${subtopic}):\nCase Prompt: ${stem}\n(a) Determine the correct accounting/economic conclusion. [2 marks]\n(b) Show all supporting OHADA financial workings, schedules, or labelled economic diagrams. [${marks - 5} marks]\n(c) Advise management on two practical strategic decisions based on your findings. [3 marks]`,
        marks,
        modelAnswer: `(a) Conclusion: ${correct}.\n(b) Workings & Analysis: Apply ${level} ${subject} standards for ${subtopic}. ${expl}\n(c) Management Advice: Provide two financially justified recommendations weighing liquidity, efficiency, and risk.`,
        keyPoints: [
          `2 marks for correct core determination: ${correct}`,
          `${marks - 5} marks for accurate workings, schedules, or labelled diagrams`,
          "3 marks for justified practical business/policy recommendations",
        ],
        source: mcq.source || "slearn-ml",
      };
    }

    return {
      id: `ml-paper3-${idx + 1}-${mcq.id || idx}`,
      section: "UNSEEN CRITICAL ANALYSIS & APPLIED ESSAY",
      topicTag: subtopic,
      question_text: `Applied Critical Analysis (${level} ${subject} · ${subtopic}):\nExtract / Prompt: ${stem}\n(a) Identify the central thesis or factual anchor. [2 marks]\n(b) Critically evaluate this issue using two distinct arguments supported by historical, textual, or philosophical evidence. [${marks - 5} marks]\n(c) State a balanced, well-reasoned conclusion. [3 marks]`,
      marks,
      modelAnswer: `(a) Core anchor: ${correct}.\n(b) Critical Discussion: Examine competing perspectives tied to ${subtopic} with concrete textual or historical citations. ${expl}\n(c) Conclusion: Synthesise the strongest evidence into a clear final judgement.`,
      keyPoints: [
        `2 marks for identifying key anchor: ${correct}`,
        `${marks - 5} marks for two developed critical arguments with evidence`,
        "3 marks for coherence, counter-argument evaluation, and conclusion",
      ],
      source: mcq.source || "slearn-ml",
    };
  });
};

export const getMLRuntimeStatus = () => {
  const model = loadRuntimeModel();
  if (!model) {
    return {
      loaded: false,
      runtime: "node-native-ml",
      error: loadError || "Runtime model file not found",
    };
  }
  return {
    loaded: true,
    runtime: "node-native-ml",
    trainedAt: model.trained_at,
    totalQuestions: (model.question_bank || []).length,
    localPapersIndexed: model.local_papers_count || 0,
    subjectsCount: Object.keys(model.dataset_subject_counts || {}).length,
    subjects: model.dataset_subject_counts || {},
    classifierMetrics: model.classifier_metrics || {},
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
  const model = loadRuntimeModel();
  if (!model) return [];

  const targetSubject = canonicalSubject(subject);
  const safeType = ["paper1", "paper2", "paper3"].includes(paperType) ? paperType : "paper1";
  const safeCount = Math.max(1, Math.min(50, Number(count) || 10));
  const excluded = new Set(
    (Array.isArray(excludeQuestions) ? excludeQuestions : [])
      .map((s) => String(s || "").trim().toLowerCase())
      .filter(Boolean),
  );

  const bank = model.question_bank || [];
  let matchingIndices = [];
  for (let i = 0; i < bank.length; i++) {
    const q = bank[i];
    if (
      q.subject.toLowerCase() === targetSubject.toLowerCase() &&
      !excluded.has(q.question_text.toLowerCase())
    ) {
      matchingIndices.push(i);
    }
  }

  const subjectMatched = matchingIndices.length > 0;
  if (!subjectMatched) {
    for (let i = 0; i < bank.length; i++) {
      if (!excluded.has(bank[i].question_text.toLowerCase())) {
        matchingIndices.push(i);
      }
    }
  }

  let chosenIndices = [];
  const ret = model.retrieval;
  const cleanTopic = String(topic || "").trim();
  const hasSpecificTopic =
    cleanTopic && !["general", "full syllabus"].includes(cleanTopic.toLowerCase());

  if (ret && (hasSpecificTopic || !subjectMatched)) {
    const queryVec = vectorizeText(`${targetSubject} ${cleanTopic}`, ret._vocabMap, ret.idf);
    const scored = matchingIndices.map((docIdx) => {
      const docPairs = ret.doc_vectors[docIdx] || [];
      let sim = 0;
      for (let j = 0; j < docPairs.length; j++) {
        const w = queryVec.get(docPairs[j][0]);
        if (w !== undefined) sim += w * docPairs[j][1];
      }
      return { docIdx, sim };
    });
    scored.sort((a, b) => b.sim - a.sim);
    const poolSize = Math.min(scored.length, Math.max(safeCount, Math.floor(safeCount * 2.5)));
    const topPool = shuffleArray(scored.slice(0, poolSize).map((item) => item.docIdx));
    chosenIndices = topPool.slice(0, safeCount);
  } else {
    chosenIndices = shuffleArray(matchingIndices).slice(0, safeCount);
  }

  const selectedMcqs = chosenIndices.map((idx, i) => {
    const item = bank[idx];
    const opts = shuffleArray(item.options || []);
    return {
      id: item.id || `ml-${Date.now()}-${i}`,
      topicTag: item.topic || cleanTopic || targetSubject,
      concept: item.topic || cleanTopic || targetSubject,
      question_text: item.question_text,
      options: opts.slice(0, 4),
      answer: item.answer,
      explanation: item.explanation || "",
      source: item.source || "slearn-ml",
    };
  });

  const paperKeywords = (model.subject_paper_keywords?.[targetSubject] || []).slice(0, 8);
  const finalQuestions =
    safeType === "paper2" || safeType === "paper3"
      ? buildWrittenGceQuestions({
          selectedMcqs,
          subject: targetSubject,
          level,
          topic: cleanTopic,
          paperType: safeType,
          paperKeywords,
        })
      : selectedMcqs;

  finalQuestions.meta = {
    runtime: "node-native-ml",
    subjectMatched,
    paperKeywords,
    yearRange: model.subject_years?.[targetSubject] || [0, 0],
    modelTrainedAt: model.trained_at || null,
    officialCode: getOfficialGceCode(level, subject || targetSubject),
  };
  return finalQuestions;
};

export const assistWithLocalML = async ({
  level = "O-Level",
  subject = "",
  topic = "",
  query = "",
  count = 4,
}) => {
  const model = loadRuntimeModel();
  if (!model) return null;

  const cleanQuery = String(query || "").replace(/\s+/g, " ").trim();
  const targetSubject = subject ? canonicalSubject(subject) : "";
  const predictedSubject = cleanQuery
    ? predictSubjectNative(model, `${subject} ${topic} ${cleanQuery}`.trim())
    : targetSubject || "General";

  const effectiveSubject = targetSubject || predictedSubject;
  const bank = model.question_bank || [];
  let candidateIndices = [];
  for (let i = 0; i < bank.length; i++) {
    if (bank[i].subject.toLowerCase() === effectiveSubject.toLowerCase()) {
      candidateIndices.push(i);
    }
  }
  if (!candidateIndices.length) {
    candidateIndices = bank.map((_, i) => i);
  }

  const ret = model.retrieval;
  const queryVec = ret
    ? vectorizeText(`${effectiveSubject} ${topic} ${cleanQuery}`, ret._vocabMap, ret.idf)
    : new Map();

  const scored = candidateIndices.map((docIdx) => {
    const docPairs = ret?.doc_vectors?.[docIdx] || [];
    let sim = 0;
    for (let j = 0; j < docPairs.length; j++) {
      const w = queryVec.get(docPairs[j][0]);
      if (w !== undefined) sim += w * docPairs[j][1];
    }
    return { docIdx, sim };
  });
  scored.sort((a, b) => b.sim - a.sim);

  const safeCount = Math.max(1, Math.min(8, Number(count) || 4));
  const related_questions = scored.slice(0, safeCount).map(({ docIdx, sim }) => {
    const item = bank[docIdx];
    return {
      id: item.id,
      subject: item.subject,
      topic: item.topic || effectiveSubject,
      relevance: Number(sim.toFixed(3)),
      question_text: item.question_text,
      options: item.options || [],
      answer: item.answer,
      explanation: item.explanation || "",
      source: item.source || "slearn-ml",
    };
  });

  return {
    runtime: "node-native-ml",
    level,
    requested_subject: effectiveSubject,
    predicted_subject: predictedSubject,
    topic,
    query: cleanQuery,
    model_trained_at: model.trained_at || null,
    paper_keywords: (model.subject_paper_keywords?.[effectiveSubject] || []).slice(0, 8),
    related_questions,
  };
};
