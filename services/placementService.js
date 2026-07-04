const {
  getRandomExam,
  loadExamById,
  calculateScore,
} = require("../utils/fileHelpers");
const { createSession, submitSectionResult } = require("./placementSessionService");
const { SECTIONS, THRESHOLDS, hasHigherLevel, hasLowerLevel, getNextHigherLevel, getNextLowerLevel } = require("../utils/placementConfig");

const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const VALID_SECTIONS = ["reading", "listening", "writing", "speaking"];
const OBJECTIVE_SECTIONS = ["reading", "listening"];

function validateLevel(level) {
  if (!VALID_LEVELS.includes(level)) {
    const err = new Error(`Level "${level}" is not supported`);
    err.statusCode = 404;
    throw err;
  }
}

function validateSection(section) {
  if (!VALID_SECTIONS.includes(section)) {
    const err = new Error(`Section "${section}" is not valid`);
    err.statusCode = 400;
    throw err;
  }
}

function getNextSection(currentSection) {
  const idx = SECTIONS.indexOf(currentSection);
  if (idx < 0 || idx >= SECTIONS.length - 1) return null;
  return SECTIONS[idx + 1];
}

async function deliverExam(level, section) {
  validateLevel(level);
  validateSection(section);

  const exam = await getRandomExam(level, section);

  if (!exam) {
    const err = new Error(`No exams found for ${level}/${section}`);
    err.statusCode = 404;
    throw err;
  }

  return exam;
}

async function startPlacement(estimatedLevel) {
  validateLevel(estimatedLevel);
  const session = createSession(estimatedLevel);
  return {
    sessionId: session.sessionId,
    level: session.level,
    nextSection: "reading",
  };
}

async function submitSection(level, section, body) {
  validateLevel(level);
  validateSection(section);

  const { sessionId, examId, answers, text, conversation, percentage } = body;

  if (!sessionId) {
    const err = new Error("sessionId is required");
    err.statusCode = 400;
    throw err;
  }

  if (!examId) {
    const err = new Error("examId is required");
    err.statusCode = 400;
    throw err;
  }

  const exam = await loadExamById(level, section, examId);
  if (!exam) {
    const err = new Error(`Exam "${examId}" not found`);
    err.statusCode = 404;
    throw err;
  }

  let sectionPercentage;

  if (OBJECTIVE_SECTIONS.includes(section)) {
    if (!Array.isArray(answers)) {
      const err = new Error("answers must be an array");
      err.statusCode = 400;
      throw err;
    }
    const score = calculateScore(answers, exam.questions);
    sectionPercentage = score.percentage;
  } else {
    if (section === "writing") {
      if (!text || typeof text !== "string") {
        const err = new Error("text is required and must be a string");
        err.statusCode = 400;
        throw err;
      }
    } else {
      if (!conversation || typeof conversation !== "string") {
        const err = new Error("conversation is required and must be a string");
        err.statusCode = 400;
        throw err;
      }
    }
    if (percentage === undefined || percentage === null || typeof percentage !== "number") {
      const err = new Error("percentage is required and must be a number for writing/speaking");
      err.statusCode = 400;
      throw err;
    }
    if (percentage < 0 || percentage > 100) {
      const err = new Error("percentage must be between 0 and 100");
      err.statusCode = 400;
      throw err;
    }
    sectionPercentage = percentage;
  }

  const sessionResult = submitSectionResult(sessionId, section, sectionPercentage);

  if (!sessionResult.allCompleted) {
    return {
      status: "continue",
      nextSection: getNextSection(section),
    };
  }

  return buildFinalResult(sessionResult.level, sessionResult.finalPercentage);
}

function buildFinalResult(level, average) {
  const { PASS, LOWER } = THRESHOLDS;

  if (average > PASS) {
    if (hasHigherLevel(level)) {
      return { status: "next_level", nextLevel: getNextHigherLevel(level) };
    }
    return { status: "finished", placementLevel: level, percentage: average };
  }

  if (average >= LOWER && average <= PASS) {
    return { status: "finished", placementLevel: level, percentage: average };
  }

  if (hasLowerLevel(level)) {
    return { status: "lower_level", nextLevel: getNextLowerLevel(level) };
  }

  return { status: "finished", placementLevel: level, percentage: average };
}

module.exports = {
  deliverExam,
  startPlacement,
  submitSection,
};
