const placementService = require("../services/placementService");
const sessionService = require("../services/placementSessionService");

async function startSession(req, res, next) {
  try {
    const { estimatedLevel } = req.body;

    if (!estimatedLevel) {
      return res.status(400).json({ error: "estimatedLevel is required" });
    }

    const result = await placementService.startPlacement(estimatedLevel);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

function getStatus(req, res, next) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const status = sessionService.getSessionStatus(sessionId);
    res.json(status);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  startSession,
  getStatus,
};
