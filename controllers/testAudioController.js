const elevenLabsService = require("../services/elevenLabsService");

async function rawGenerate(req, res, next) {
  try {
    const { text, voice } = req.query;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "text query parameter is required" });
    }

    if (!voice || typeof voice !== "string") {
      return res.status(400).json({ error: "voice query parameter is required" });
    }

    const voices = require("../config/voices");
    const voiceConfig = voices.getVoice(voice);
    if (!voiceConfig) {
      return res.status(400).json({
        error: `Unknown voice "${voice}". Available: ${voices.getAllVoices().map((v) => v.key).join(", ")}`,
      });
    }

    const audioBuffer = await elevenLabsService.generateSpeech(text, voiceConfig.id);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `inline; filename="${voiceConfig.key}.mp3"`,
      "Content-Length": audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { rawGenerate };
