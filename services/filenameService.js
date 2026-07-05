function listeningQuestionAudio(level, examId, questionId) {
  const normLevel = level.toLowerCase();
  return `placement/${normLevel}/listening/${examId}_${questionId}.mp3`;
}

function readingExamAudio(level, examId, passageId) {
  const normLevel = level.toLowerCase();
  return `placement/${normLevel}/reading/${examId}_${passageId}.mp3`;
}

function genericAudio(voiceKey, text) {
  const hash = require("crypto").createHash("md5").update(text).digest("hex").slice(0, 8);
  return `${voiceKey}/${hash}.mp3`;
}

module.exports = { listeningQuestionAudio, readingExamAudio, genericAudio };
