const crypto = require("node:crypto");
const WebSocket = require("ws");
const { VOICES } = require("../config/voices");

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM_VERSION = "143.0.3650.75";
const WINDOWS_FILE_TIME_EPOCH = 11644473600n;

const VOICE_ID_TO_EDGE = Object.fromEntries(
  Object.values(VOICES).map((v) => [v.id, v.edgeVoice])
);

function generateSecMsGecToken() {
  const ticks = BigInt(Math.floor(Date.now() / 1000 + Number(WINDOWS_FILE_TIME_EPOCH))) * 10000000n;
  const roundedTicks = ticks - (ticks % 3000000000n);
  const strToHash = `${roundedTicks}${TRUSTED_CLIENT_TOKEN}`;
  const hash = crypto.createHash("sha256").update(strToHash, "ascii").digest("hex").toUpperCase();
  return hash;
}

function escapeXml(str) {
  return str.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case '"': return "&quot;";
      case "'": return "&apos;";
      default: return c;
    }
  });
}

async function generateSpeech(text, voiceId) {
  if (!text || typeof text !== "string" || !text.trim()) {
    const err = new Error("text is required and must be a non-empty string");
    err.statusCode = 400;
    throw err;
  }

  if (!voiceId || typeof voiceId !== "string") {
    const err = new Error("voiceId is required and must be a string");
    err.statusCode = 400;
    throw err;
  }

  const edgeVoice = VOICE_ID_TO_EDGE[voiceId];
  if (!edgeVoice) {
    const err = new Error(
      `Unknown voiceId "${voiceId}". Available IDs: ${Object.keys(VOICE_ID_TO_EDGE).join(", ")}`
    );
    err.statusCode = 400;
    throw err;
  }

  const lang = edgeVoice.startsWith("en-GB") ? "en-GB" : "en-US";

  const wsUrl =
    `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
    `?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}` +
    `&Sec-MS-GEC=${generateSecMsGecToken()}` +
    `&Sec-MS-GEC-Version=1-${CHROMIUM_VERSION}`;

  const ws = new WebSocket(wsUrl, {
    host: "speech.platform.bing.com",
    origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
    headers: {
      "Pragma": "no-cache",
      "Cache-Control": "no-cache",
      "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_VERSION.split(".")[0]}.0.0.0 Safari/537.36 Edg/${CHROMIUM_VERSION.split(".")[0]}.0.0.0`,
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  const chunks = [];

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close();
      const err = new Error("Edge TTS timed out after 15000ms");
      err.statusCode = 504;
      reject(err);
    }, 15000);

    ws.on("open", () => {
      ws.send(
        `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
          JSON.stringify({
            context: {
              synthesis: {
                audio: {
                  metadataoptions: {
                    sentenceBoundaryEnabled: false,
                    wordBoundaryEnabled: true,
                  },
                  outputFormat: "audio-24khz-48kbitrate-mono-mp3",
                },
              },
            },
          })
      );

      const requestId = crypto.randomBytes(16).toString("hex");
      const ssml =
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}">` +
        `<voice name="${edgeVoice}">` +
        `<prosody rate="default" pitch="default" volume="default">` +
        `${escapeXml(text)}` +
        `</prosody>` +
        `</voice>` +
        `</speak>`;

      ws.send(`X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`);
    });

    ws.on("message", (data, isBinary) => {
      if (isBinary) {
        const separator = "Path:audio\r\n";
        const index = data.indexOf(separator) + separator.length;
        const audioData = data.subarray(index);
        chunks.push(audioData);
      } else {
        const message = data.toString();
        if (message.includes("Path:turn.end")) {
          clearTimeout(timeout);
          ws.close();
          resolve(Buffer.concat(chunks));
        }
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      const wrapped = new Error(`Edge TTS connection error: ${err.message}`);
      wrapped.statusCode = 502;
      reject(wrapped);
    });

    ws.on("close", (code, reason) => {
      clearTimeout(timeout);
      if (chunks.length === 0) {
        const err = new Error(`Edge TTS closed unexpectedly (code=${code}, reason=${reason})`);
        err.statusCode = 502;
        reject(err);
      }
    });
  });
}

module.exports = { generateSpeech };
