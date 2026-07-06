const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const FALLBACK_MODELS = [
  process.env.OPENROUTER_MODEL,
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "liquid/lfm-2.5-1.2b-thinking:free",
  "poolside/laguna-xs-2.1:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
].filter(Boolean);

async function callOpenRouter(prompt, textOrConversation, evaluationType) {
  const instructions = {
    writing:
      "Evaluate the answer, provide a score from 0-100, and give detailed feedback.",
    speaking:
      "Evaluate the speaking performance, provide a score from 0-100, and give detailed feedback on fluency, grammar, vocabulary, and pronunciation.",
  };

  const userContent = `${prompt}\n\nStudent ${evaluationType === "writing" ? "answer" : "conversation"}:\n${textOrConversation}\n\n${instructions[evaluationType]}`;

  let lastErr;

  for (const model of FALLBACK_MODELS) {
    try {
      const body = {
        model,
        messages: [{ role: "user", content: userContent }],
      };

      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        const isRateLimit = res.status === 429 || res.status === 402;
        if (isRateLimit) {
          lastErr = new Error(`OpenRouter ${res.status}: ${errText}`);
          continue;
        }
        throw new Error(`OpenRouter ${res.status}: ${errText}`);
      }

      const data = await res.json();
      return data.choices[0].message.content;
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("All OpenRouter models failed");
}

async function evaluateWriting(prompt, text) {
  return callOpenRouter(prompt, text, "writing");
}

async function evaluateSpeaking(prompt, conversation) {
  return callOpenRouter(prompt, conversation, "speaking");
}

module.exports = { evaluateWriting, evaluateSpeaking };
