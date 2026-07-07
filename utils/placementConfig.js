const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

const PASS_THRESHOLD = 75;
const STAY_THRESHOLD = 45;

const THRESHOLDS = {
  PASS: PASS_THRESHOLD,
  LOWER: STAY_THRESHOLD,
};

const SECTIONS = ["reading", "listening", "writing", "speaking"];

const LEVEL_LABELS = {
  Beginner: "A1",
  Elementary: "A2",
  Intermediate: "B1",
  "Upper Intermediate": "B2",
  Advanced: "C1",
  Proficient: "C2",
};

function getLevelIndex(level) {
  return LEVEL_ORDER.indexOf(level);
}

function hasHigherLevel(level) {
  const idx = getLevelIndex(level);
  return idx >= 0 && idx < LEVEL_ORDER.length - 1;
}

function hasLowerLevel(level) {
  const idx = getLevelIndex(level);
  return idx > 0;
}

function getNextHigherLevel(level) {
  const idx = getLevelIndex(level);
  if (idx < 0 || idx >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[idx + 1];
}

function getNextLowerLevel(level) {
  const idx = getLevelIndex(level);
  if (idx <= 0) return null;
  return LEVEL_ORDER[idx - 1];
}

module.exports = {
  LEVEL_ORDER,
  PASS_THRESHOLD,
  STAY_THRESHOLD,
  THRESHOLDS,
  SECTIONS,
  LEVEL_LABELS,
  getLevelIndex,
  hasHigherLevel,
  hasLowerLevel,
  getNextHigherLevel,
  getNextLowerLevel,
};
