const aiService = require("./aiService");

async function evaluate(level, conversation) {
  if (!Array.isArray(conversation) || conversation.length === 0) {
    const err = new Error("conversation must be a non-empty array");
    err.statusCode = 400;
    throw err;
  }

  for (const item of conversation) {
    if (!item.question || !item.answer) {
      const err = new Error("Each conversation item must have question and answer");
      err.statusCode = 400;
      throw err;
    }
  }

  const result = await aiService.evaluateSpeaking(level, conversation);

  return {
    grammar: result.grammar ?? 0,
    vocabulary: result.vocabulary ?? 0,
    taskCompletion: result.taskCompletion ?? 0,
    fluency: result.fluency ?? 0,
    total: result.total ?? 0,
    feedback: result.feedback || "",
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
  };
}

module.exports = { evaluate };
