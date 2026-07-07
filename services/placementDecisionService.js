const {
  SECTIONS,
  PASS_THRESHOLD,
  STAY_THRESHOLD,
  getNextHigherLevel,
  getNextLowerLevel,
  hasLowerLevel,
} = require("../utils/placementConfig");

function calculatePlacementResult(level, results) {
  const scores = {};
  let total = 0;

  for (const s of SECTIONS) {
    const val = results[s];
    if (typeof val === "number" && !Number.isNaN(val)) {
      scores[s] = val;
      total += val;
    } else {
      scores[s] = 0;
    }
  }

  const average = Math.round(total / SECTIONS.length);
  const base = { success: true, average, ...scores };

  if (average >= PASS_THRESHOLD) {
    const nextLevel = getNextHigherLevel(level);
    if (nextLevel) {
      return { ...base, decision: "NEXT_LEVEL", currentLevel: level, nextLevel };
    }
    return { ...base, decision: "STAY", placementLevel: level };
  }

  if (average >= STAY_THRESHOLD) {
    return { ...base, decision: "STAY", placementLevel: level };
  }

  if (hasLowerLevel(level)) {
    return { ...base, decision: "LOWER_LEVEL", placementLevel: getNextLowerLevel(level) };
  }

  return { ...base, decision: "STAY", placementLevel: level };
}

module.exports = { calculatePlacementResult };
