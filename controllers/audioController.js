const audioService = require("../services/audioService");

async function generate(req, res, next) {
  try {
    const { text, voice } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "text is required and must be a non-empty string" });
    }

    if (!voice || typeof voice !== "string") {
      return res.status(400).json({ error: "voice is required" });
    }

    const result = await audioService.generateTextAudio(text, voice);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { generate };
