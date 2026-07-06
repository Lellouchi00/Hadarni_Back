const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const FALLBACK_MODELS = [
  process.env.OPENROUTER_MODEL,
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "liquid/lfm-2.5-1.2b-thinking:free",
  "poolside/laguna-xs-2.1:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
].filter(Boolean);

const EVALUATION_PROMPT = `You are a STRICT official CEFR placement examiner.

This is NOT a learning exercise.

This is a Placement Test.

Your goal is to accurately estimate the student's English level.

Never give full marks unless the answer is essentially free of grammar, vocabulary, and coherence mistakes for the target CEFR level.

Grammar mistakes MUST reduce the grammar score.

Vocabulary misuse MUST reduce the vocabulary score.

If the answer contains obvious grammatical mistakes, the total score should not exceed 85.

Do not reward incorrect English.

Be objective and conservative.

=========================
CONTEXT
=========================

This is a placement exam for an English learning application.

The student's estimated level is:
{{LEVEL}}

Writing Question:
{{QUESTION}}

Student Answer:
{{ANSWER}}

=========================
EVALUATION RULES
=========================

Evaluate ONLY according to the CEFR level provided.

Do NOT compare the student to higher levels.

For example:

If the level is A1:
- simple present
- basic vocabulary
- very short sentences
- basic spelling mistakes are acceptable
- do not expect complex grammar

If the level is B2:
- expect good grammar
- richer vocabulary
- good organization
- better coherence

Evaluate these criteria:

1. Grammar (0-25)
2. Vocabulary (0-25)
3. Task Completion (0-25)
4. Coherence & Organization (0-25)

Total score = 100

=========================
FEEDBACK
=========================

Feedback must:

- be short
- maximum 3 sentences
- encourage the learner
- explain only the most important mistakes
- give one improvement suggestion

=========================
IMPORTANT
=========================

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT write explanations.

Do NOT wrap inside \`\`\`.

Do NOT write any text outside JSON.

=========================
JSON FORMAT
=========================

{
  "grammar": 0,
  "vocabulary": 0,
  "taskCompletion": 0,
  "coherence": 0,
  "total": 0,
  "feedback": "",
  "strengths": [
    ""
  ],
  "weaknesses": [
    ""
  ]
}

Rules:

grammar + vocabulary + taskCompletion + coherence = total

All values must be integers.

strengths contains 1-3 short points.

weaknesses contains 1-3 short points.

feedback must contain at most 3 sentences.`;

async function callOpenRouter(userContent) {
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

async function evaluateWriting(level, question, answer) {
  const content = EVALUATION_PROMPT
    .replace("{{LEVEL}}", level)
    .replace("{{QUESTION}}", question)
    .replace("{{ANSWER}}", answer);

  const raw = await callOpenRouter(content);

  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

async function evaluateSpeaking(prompt, conversation) {
  const content = `${prompt}\n\nStudent conversation:\n${conversation}\n\nEvaluate the speaking performance, provide a score from 0-100, and give detailed feedback on fluency, grammar, vocabulary, and pronunciation.`;
  return callOpenRouter(content);
}

module.exports = { evaluateWriting, evaluateSpeaking };
