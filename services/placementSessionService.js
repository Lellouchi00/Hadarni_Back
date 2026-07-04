const { v4: uuidv4 } = require("uuid");
const { SECTIONS } = require("../utils/placementConfig");
const { determinePlacement } = require("./placementProgressionService");

const sessions = new Map();

function createSession(estimatedLevel) {
  const VALID = ["A1", "A2", "B1", "B2", "C1", "C2"];
  if (!VALID.includes(estimatedLevel)) {
    const err = new Error(`Invalid level: "${estimatedLevel}"`);
    err.statusCode = 400;
    throw err;
  }

  const session = {
    id: uuidv4(),
    level: estimatedLevel,
    results: {},
    createdAt: Date.now(),
  };

  sessions.set(session.id, session);
  return { sessionId: session.id, level: session.level };
}

function submitSectionResult(sessionId, section, percentage) {
  const session = sessions.get(sessionId);
  if (!session) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  if (!SECTIONS.includes(section)) {
    const err = new Error(`Invalid section: "${section}"`);
    err.statusCode = 400;
    throw err;
  }

  if (percentage === undefined || percentage === null || typeof percentage !== "number") {
    const err = new Error("percentage is required and must be a number");
    err.statusCode = 400;
    throw err;
  }

  if (percentage < 0 || percentage > 100) {
    const err = new Error("percentage must be between 0 and 100");
    err.statusCode = 400;
    throw err;
  }

  session.results[section] = percentage;

  const completedSections = SECTIONS.filter((s) => session.results[s] !== undefined);
  const allCompleted = completedSections.length === SECTIONS.length;

  let progression = null;
  if (allCompleted) {
    const total = SECTIONS.reduce((sum, s) => sum + session.results[s], 0);
    const average = parseFloat((total / SECTIONS.length).toFixed(2));
    progression = determinePlacement(session.level, average);
    session.finalPercentage = average;
    session.progression = progression;
  }

  return {
    sessionId: session.id,
    level: session.level,
    section,
    percentage,
    completedSections: completedSections.length,
    totalSections: SECTIONS.length,
    allCompleted,
    finalPercentage: session.finalPercentage || null,
    progression,
  };
}

function getSessionStatus(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  const completedSections = SECTIONS.filter((s) => session.results[s] !== undefined);

  return {
    sessionId: session.id,
    level: session.level,
    results: session.results,
    completedSections: completedSections.length,
    totalSections: SECTIONS.length,
    allCompleted: completedSections.length === SECTIONS.length,
    finalPercentage: session.finalPercentage || null,
    progression: session.progression || null,
  };
}

module.exports = {
  createSession,
  submitSectionResult,
  getSessionStatus,
};
