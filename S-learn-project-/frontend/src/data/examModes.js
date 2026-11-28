import {
  RobotIcon,
  MarkAnswersIcon,
  SparklesIcon,
  QuizEngineIcon,
} from "../components/ExamModeIcons";

export const EXAM_MODES = [
  {
    id: "model-answers",
    path: "/exam/model-answers",
    title: "Get Model Answers",
    description: "Upload a paper and get exam-standard answers",
    Icon: RobotIcon,
  },
  {
    id: "mark-answers",
    path: "/exam/mark-answers",
    title: "Mark My Answers",
    description: "Answer questions and get AI scores + analysis",
    Icon: MarkAnswersIcon,
  },
  {
    id: "pre-gce-generator",
    path: "/exam/pre-gce",
    title: "Pre-GCE Question Generator",
    description: "Get real-time GCE simulation — be confident, be prepared.",
    Icon: SparklesIcon,
  },
  {
    id: "quiz-engine",
    path: "/exam/quiz-engine",
    title: "Quiz Engine",
    description: "Every quiz drawn fresh from the syllabus — no repeats, no question bank.",
    Icon: QuizEngineIcon,
  },
];
