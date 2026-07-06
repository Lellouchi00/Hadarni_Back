const speakingService = require("../services/speakingService");

async function evaluateSpeaking(req, res, next) {
  try {
    const { level, conversation } = req.body;

    if (!level) {
      return res.status(400).json({ error: "level is required" });
    }
    if (!Array.isArray(conversation) || conversation.length === 0) {
      return res.status(400).json({ error: "conversation must be a non-empty array" });
    }

    const result = await speakingService.evaluate(level, conversation);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
}

module.exports = { evaluateSpeaking };
