const fs = require("fs").promises;
const path = require("path");

const CONTENT_BANK = path.join(__dirname, "..", "ContentBank");

function getSectionDir(level, section) {
  return path.join(CONTENT_BANK, "placement", level, section);
}

async function readDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath);
    return entries.filter((f) => f.endsWith(".json")).sort();
  } catch {
    return [];
  }
}

async function loadJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function getRandomExam(level, section) {
  const dir = getSectionDir(level, section);
  const files = await readDirectory(dir);

  if (files.length === 0) {
    return null;
  }

  const chosen = getRandomItem(files);
  const exam = await loadJsonFile(path.join(dir, chosen));
  if (!exam.examId) {
    exam.examId = path.basename(chosen, ".json");
  }
  return exam;
}

async function loadExamById(level, section, examId) {
  const dir = getSectionDir(level, section);
  const filePath = path.join(dir, `${examId}.json`);

  try {
    const exam = await loadJsonFile(filePath);
    if (!exam.examId) {
      exam.examId = examId;
    }
    return exam;
  } catch {
    return null;
  }
}

function calculateScore(answers, questions) {
  let correct = 0;
  const total = questions.length;

  for (let i = 0; i < total; i++) {
    const userAnswer = answers[i];
    const correctAnswer = questions[i].correctAnswer;

    if (userAnswer !== undefined && userAnswer !== null && userAnswer === correctAnswer) {
      correct++;
    }
  }

  const wrong = total - correct;
  const percentage = total > 0 ? parseFloat(((correct / total) * 100).toFixed(2)) : 0;

  return { correct, wrong, total, percentage };
}

function pickRandomQuestions(questions, count) {
  if (!Array.isArray(questions) || questions.length === 0) return [];
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, questions.length));
}

function flattenPassageQuestions(passages) {
  if (!Array.isArray(passages)) return [];
  const questions = [];
  for (const passage of passages) {
    if (Array.isArray(passage.questions)) {
      for (const q of passage.questions) {
        questions.push(q);
      }
    }
  }
  return questions;
}

function calculateScoreById(answers, questionIds, allQuestions) {
  let correct = 0;
  const total = questionIds.length;

  for (let i = 0; i < total; i++) {
    const q = allQuestions.find((x) => x.questionId === questionIds[i]);
    if (q && answers[i] !== undefined && answers[i] !== null && answers[i] === q.correctAnswer) {
      correct++;
    }
  }

  const wrong = total - correct;
  const percentage = total > 0 ? parseFloat(((correct / total) * 100).toFixed(2)) : 0;

  return { correct, wrong, total, percentage };
}

module.exports = {
  getSectionDir,
  readDirectory,
  loadJsonFile,
  getRandomItem,
  getRandomExam,
  loadExamById,
  calculateScore,
  pickRandomQuestions,
  flattenPassageQuestions,
  calculateScoreById,
};
