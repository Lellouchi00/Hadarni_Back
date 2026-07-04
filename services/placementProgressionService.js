const {
  THRESHOLDS,
  getNextHigherLevel,
  getNextLowerLevel,
  hasHigherLevel,
  hasLowerLevel,
} = require("../utils/placementConfig");

function validateLevel(level) {
  const VALID = ["A1", "A2", "B1", "B2", "C1", "C2"];
  if (!VALID.includes(level)) {
    const err = new Error(`Invalid level: "${level}"`);
    err.statusCode = 400;
    throw err;
  }
}

function validatePercentage(percentage) {
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
}

function determinePlacement(level, percentage) {
  validateLevel(level);
  validatePercentage(percentage);

  const { PASS, LOWER } = THRESHOLDS;

  if (percentage > PASS) {
    if (hasHigherLevel(level)) {
      const nextLevel = getNextHigherLevel(level);
      return { status: "next_level", nextLevel };
    }
    return { status: "finished", placementLevel: level };
  }

  if (percentage >= LOWER && percentage <= PASS) {
    return { status: "finished", placementLevel: level };
  }

  if (hasLowerLevel(level)) {
    const nextLevel = getNextLowerLevel(level);
    return { status: "lower_level", nextLevel };
  }

  return { status: "finished", placementLevel: level };
}

module.exports = { determinePlacement };
