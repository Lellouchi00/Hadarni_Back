const geminiService = require("../services/geminiService");

async function evaluateWriting(req, res, next) {
  try {
    const { prompt, text } = req.body;
    if (!prompt || !text) {
      return res.status(400).json({ error: "prompt and text are required" });
    }
    const result = await geminiService.evaluateWriting(prompt, text);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
}

async function evaluateSpeaking(req, res, next) {
  try {
    const { prompt, conversation } = req.body;
    if (!prompt || !conversation) {
      return res.status(400).json({ error: "prompt and conversation are required" });
    }
    const result = await geminiService.evaluateSpeaking(prompt, conversation);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
}

module.exports = { evaluateWriting, evaluateSpeaking };
