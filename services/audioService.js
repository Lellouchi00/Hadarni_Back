const elevenLabsService = require("./elevenLabsService");
const storageService = require("./storageService");
const voices = require("../config/voices");
const { genericAudio } = require("./filenameService");

async function generateTextAudio(text, voiceKey, customFilename) {
  if (!text || typeof text !== "string" || !text.trim()) {
    const err = new Error("text is required and must be a non-empty string");
    err.statusCode = 400;
    throw err;
  }

  if (!voiceKey || typeof voiceKey !== "string") {
    const err = new Error("voice is required");
    err.statusCode = 400;
    throw err;
  }

  const voice = voices.getVoice(voiceKey);
  if (!voice) {
    const err = new Error(`Unknown voice "${voiceKey}". Available: ${voices.getAllVoices().map(v => v.key).join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  const audioBuffer = await elevenLabsService.generateSpeech(text, voice.id);

  const filename = customFilename || genericAudio(voiceKey, text);

  try {
    const result = await storageService.uploadAudio(audioBuffer, filename);

    return {
      success: true,
      audioUrl: result.publicUrl,
      filename: result.key,
    };
  } catch (err) {
    if (err.name === "NotImplementedError") {
      return {
        success: true,
        audioUrl: null,
        filename,
        message: "Audio generated. Storage pending — implement storageService to receive a public URL.",
      };
    }
    throw err;
  }
}

module.exports = { generateTextAudio };
