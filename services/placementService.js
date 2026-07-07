const {
  getRandomExam,
  loadExamById,
  saveExamFile,
  getRandomItem,
  pickRandomQuestions,
  calculateScore,
  calculateScoreById,
  flattenPassageQuestions,
} = require("../utils/fileHelpers");
const { createSession, submitSectionResult, getSessionStatus } = require("./placementSessionService");
const { SECTIONS } = require("../utils/placementConfig");
const { calculatePlacementResult } = require("./placementDecisionService");
const audioService = require("./audioService");
const filenameService = require("./filenameService");

const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const VALID_SECTIONS = ["reading", "listening", "writing", "speaking"];
const LISTENING_VOICES = ["child", "male", "female"];

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

function prepareListeningExam(exam) {
  const selected = pickRandomQuestions(exam.questions, 3);

  const questions = selected.map((q) => {
    const questionId = q.questionId || q.id;

    return {
      questionId,
      id: questionId,
      audioText: q.audioText || "",
      audioUrl: q.audioUrl || "",
      question: q.question,
      options: q.options,
    };
  });

  return {
    examId: exam.examId,
    sectionTitle: "Listening",
    questions,
  };
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

  if (section === "listening" && Array.isArray(exam.questions)) {
    let changed = false;

    for (const q of exam.questions) {
      if (!q.audioUrl || !q.audioUrl.startsWith("http")) {
        if (q.audioText && typeof q.audioText === "string" && q.audioText.trim()) {
          try {
            const voice = getRandomItem(LISTENING_VOICES);
            const fname = filenameService.listeningQuestionAudio(level, exam.examId, q.questionId || q.id);
            const result = await audioService.generateTextAudio(q.audioText, voice, fname);
            if (result && result.audioUrl) {
              q.audioUrl = result.audioUrl;
              changed = true;
            }
          } catch (err) {
            console.error(`[deliverExam] Audio generation failed for ${exam.examId}/${q.questionId || q.id}: ${err.message}`);
          }
        }
      }
    }

    if (changed) {
      await saveExamFile(level, section, exam.examId, exam).catch((err) =>
        console.error(`[deliverExam] Failed to save exam file: ${err.message}`)
      );
    }

    return prepareListeningExam(exam);
  }

  if (section === "reading" && Array.isArray(exam.passages)) {
    return {
      examId: exam.examId,
      sectionTitle: exam.sectionTitle || "Reading",
      passages: exam.passages,
    };
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

  const { sessionId, examId, answers, text, conversation, percentage, questionIds } = body;

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

  if (section === "reading") {
    if (!Array.isArray(answers)) {
      const err = new Error("answers must be an array");
      err.statusCode = 400;
      throw err;
    }
    const allQuestions = flattenPassageQuestions(exam.passages);
    const score = calculateScore(answers, allQuestions);
    sectionPercentage = score.percentage;
  } else if (section === "listening") {
    if (!Array.isArray(answers)) {
      const err = new Error("answers must be an array");
      err.statusCode = 400;
      throw err;
    }
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      const err = new Error("questionIds is required for listening");
      err.statusCode = 400;
      throw err;
    }
    const score = calculateScoreById(answers, questionIds, exam.questions);
    sectionPercentage = score.percentage;
  } else if (section === "writing") {
    if (!text || typeof text !== "string") {
      const err = new Error("text is required and must be a string");
      err.statusCode = 400;
      throw err;
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
  } else if (section === "speaking") {
    if (!conversation || typeof conversation !== "string") {
      const err = new Error("conversation is required and must be a string");
      err.statusCode = 400;
      throw err;
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
  } else {
    const err = new Error(`Unknown section: "${section}"`);
    err.statusCode = 400;
    throw err;
  }

  const sessionResult = submitSectionResult(sessionId, section, sectionPercentage);

  if (!sessionResult.allCompleted) {
    return {
      status: "continue",
      nextSection: getNextSection(section),
    };
  }

  const sessionStatus = getSessionStatus(sessionId);
  return calculatePlacementResult(sessionStatus.level, sessionStatus.results);
}

module.exports = {
  deliverExam,
  startPlacement,
  submitSection,
};
