const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");

const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
  console.warn("[elevenLabs] ELEVENLABS_API_KEY is not set. Audio generation will fail at runtime.");
}

const client = new ElevenLabsClient({ apiKey: apiKey || "" });

const MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";

module.exports = { client, MODEL_ID, OUTPUT_FORMAT };
