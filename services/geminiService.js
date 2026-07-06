const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL = "gemini-2.0-flash";

async function evaluateWriting(prompt, text) {
  const model = genAI.getGenerativeModel({ model: MODEL });

  const fullPrompt = `${prompt}\n\nStudent answer:\n${text}\n\nEvaluate the answer, provide a score from 0-100, and give detailed feedback.`;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
}

async function evaluateSpeaking(prompt, conversation) {
  const model = genAI.getGenerativeModel({ model: MODEL });

  const fullPrompt = `${prompt}\n\nStudent conversation:\n${conversation}\n\nEvaluate the speaking performance, provide a score from 0-100, and give detailed feedback on fluency, grammar, vocabulary, and pronunciation.`;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
}

module.exports = { evaluateWriting, evaluateSpeaking };
