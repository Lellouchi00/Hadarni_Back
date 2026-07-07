const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const doc = new PDFDocument({ margin: 50, size: "A4" });
const output = path.join(__dirname, "..", "API_DOCS.pdf");
doc.pipe(fs.createWriteStream(output));

function title(text) {
  doc.fontSize(22).fillColor("#1a1a2e").text(text, { underline: true });
  doc.moveDown(0.5);
}

function h2(text) {
  doc.fontSize(15).fillColor("#5b3df5").text(text);
  doc.moveDown(0.3);
}

function h3(text) {
  doc.fontSize(12).fillColor("#333").text(text, { underline: true });
  doc.moveDown(0.2);
}

function body(text) {
  doc.fontSize(10).fillColor("#444").text(text, { lineGap: 4 });
  doc.moveDown(0.3);
}

function code(text) {
  doc.fontSize(9).fillColor("#c62828").font("Courier").text(text, { indent: 10, lineGap: 2 });
  doc.font("Helvetica").fillColor("#444");
  doc.moveDown(0.3);
}

function bullet(text) {
  doc.fontSize(10).fillColor("#444").text("  •  " + text, { indent: 10, lineGap: 3 });
  doc.moveDown(0.1);
}

function separator() {
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#ccc").text("─".repeat(70), { align: "center" });
  doc.moveDown(0.5);
}

// ============== COVER ==============
doc.fontSize(32).fillColor("#1a1a2e").text("HDANI BACKEND", { align: "center" });
doc.moveDown(0.3);
doc.fontSize(18).fillColor("#5b3df5").text("Placement Test System", { align: "center" });
doc.moveDown(0.2);
doc.fontSize(12).fillColor("#888").text("API Documentation — 7 July 2026", { align: "center" });
doc.moveDown(1.5);

// ============== TABLE OF CONTENTS ==============
doc.fontSize(16).fillColor("#1a1a2e").text("Contents", { underline: true });
doc.moveDown(0.5);
const toc = [
  "1. Placement Flow (Main Exam)",
  "2. Placement Start & Session",
  "3. Deliver Exam (GET)",
  "4. Submit Section (POST)",
  "5. Final Placement Decision",
  "6. Speaking AI Evaluation",
  "7. Writing AI Evaluation",
  "8. Audio / TTS Endpoints",
  "9. Configuration",
  "10. How to Run",
];
toc.forEach((t) => { doc.fontSize(11).fillColor("#333").text(t, { indent: 10, lineGap: 5 }); });
doc.addPage();

// ============== 1. PLACEMENT FLOW ==============
title("1. Placement Flow");
body("The placement test consists of 4 mandatory sections in strict order:");
bullet("Reading → Listening → Writing → Speaking");
body("Each section must be completed before the next is unlocked. After Speaking is submitted, the backend calculates the final placement decision.");
doc.moveDown(0.5);

// ============== 2. START SESSION ==============
title("2. Start Placement Session");
h2("POST /api/placement/progression/start");
body("Creates a new placement session. Returns sessionId and the first section (reading).");
h3("Request Body");
code(JSON.stringify({ estimatedLevel: "A1" }, null, 2));
h3("Response (200)");
code(JSON.stringify({ sessionId: "uuid", level: "A1", nextSection: "reading" }, null, 2));
separator();

// ============== 3. DELIVER EXAM ==============
title("3. Deliver Exam");
h2("GET /api/placement/:level/:section");
body("Fetches exam questions for the given level and section.");
h3("Parameters");
bullet("level: A1, A2, B1, B2, C1, C2");
bullet("section: reading, listening, writing, speaking");
h3("Reading Response (200) — 3 passages × 3 questions");
code(`{
  "examId": "reading_001",
  "sectionTitle": "Reading",
  "passages": [
    {
      "id": "p1",
      "title": "...",
      "text": "...",
      "questions": [
        { "id": "q1", "question": "...", "options": [...], "correctAnswer": 1 }
      ]
    }
  ]
}`);
h3("Listening Response (200) — 3 random questions with audioUrl");
code(`{
  "examId": "listening_001",
  "sectionTitle": "Listening",
  "questions": [
    { "questionId": "q1", "audioUrl": "https://...", "question": "...", "options": [...] }
  ]
}`);
h3("Writing / Speaking Response (200)");
code(`{
  "examId": "writing_001",
  "title": "...",
  "instruction": "...",
  "prompts": ["What is your name?", "..."]
}`);
separator();

// ============== 4. SUBMIT SECTION ==============
title("4. Submit Section");
h2("POST /api/placement/:level/:section/submit");
body("Submits answers for a section. Sections 1–3 return a continue response. Section 4 (speaking) returns the final placement decision.");
h3("Reading Submit Body");
code(JSON.stringify({
  sessionId: "uuid", examId: "reading_001",
  answers: [0, 1, 2, 1, 0, 2, 2, 1, 0]
}, null, 2));
h3("Listening Submit Body");
code(JSON.stringify({
  sessionId: "uuid", examId: "listening_001",
  answers: [0, 1, 2],
  questionIds: ["q1", "q2", "q3"]
}, null, 2));
h3("Writing Submit Body");
code(JSON.stringify({
  sessionId: "uuid", examId: "writing_001",
  text: "My name is test.",
  percentage: 70
}, null, 2));
h3("Speaking Submit Body");
code(JSON.stringify({
  sessionId: "uuid", examId: "speaking_001",
  conversation: "Q: What is your name? A: Test.",
  percentage: 65
}, null, 2));
h3("Continue Response (Sections 1–3)");
code(JSON.stringify({ status: "continue", nextSection: "listening" }, null, 2));
h3("Final Response (Speaking — Section 4)");
code(JSON.stringify({
  success: true,
  average: 67,
  reading: 100,
  listening: 33.33,
  writing: 70,
  speaking: 65,
  decision: "STAY",
  placementLevel: "A1"
}, null, 2));
separator();

// ============== 5. FINAL PLACEMENT DECISION ==============
title("5. Final Placement Decision");
body("Calculated automatically after Speaking is submitted. Logic lives in services/placementDecisionService.js.");
body("Thresholds are read from utils/placementConfig.js:");
bullet("PASS_THRESHOLD = 75");
bullet("STAY_THRESHOLD = 45");
h3("Decision Rules");
bullet("average >= 75  →  NEXT_LEVEL (advance to next CEFR level)");
bullet("45 <= average < 75  →  STAY (remain at current level)");
bullet("average < 45  →  LOWER_LEVEL (move to previous level)");
bullet("A1 with average < 45  →  STAY (no lower level)");
bullet("C2 with average >= 75  →  STAY (max level reached)");
h3("NEXT_LEVEL Response");
code(JSON.stringify({
  success: true, average: 76,
  reading: 80, listening: 72, writing: 68, speaking: 84,
  decision: "NEXT_LEVEL", currentLevel: "A1", nextLevel: "A2"
}, null, 2));
h3("STAY Response");
code(JSON.stringify({
  success: true, average: 60,
  reading: 65, listening: 55, writing: 50, speaking: 70,
  decision: "STAY", placementLevel: "A1"
}, null, 2));
h3("LOWER_LEVEL Response");
code(JSON.stringify({
  success: true, average: 37,
  reading: 30, listening: 42, writing: 35, speaking: 41,
  decision: "LOWER_LEVEL", placementLevel: "A2"
}, null, 2));
separator();

// ============== 6. SPEAKING AI EVALUATION ==============
title("6. Speaking AI Evaluation");
h2("POST /api/speaking/evaluate");
body("Evaluates speaking using OpenRouter AI. Returns structured CEFR scores.");
h3("Request Body");
code(JSON.stringify({
  level: "A1",
  conversation: [
    { question: "What is your name?", answer: "My name is Ahmed." },
    { question: "How old are you?", answer: "I am 20 years old." }
  ]
}, null, 2));
h3("Response (200)");
code(`{
  "success": true,
  "result": {
    "grammar": 18,
    "vocabulary": 15,
    "taskCompletion": 20,
    "fluency": 16,
    "total": 69,
    "feedback": "...",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "cefrLevel": "A2"
  }
}`);
separator();

// ============== 7. WRITING AI EVALUATION ==============
title("7. Writing AI Evaluation");
h2("POST /api/gemini/evaluate-writing");
body("Evaluates writing using OpenRouter AI. Returns structured CEFR scores.");
h3("Request Body");
code(JSON.stringify({
  level: "A1",
  question: "Describe your family.",
  answer: "I have a small family."
}, null, 2));
h3("Response (200)");
code(`{
  "grammar": 18,
  "vocabulary": 16,
  "taskCompletion": 20,
  "coherence": 17,
  "total": 71,
  "feedback": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "cefrLevel": "A2"
}`);
separator();

// ============== 8. AUDIO / TTS ==============
title("8. Audio / TTS Endpoints");
h2("POST /api/audio/generate");
body("Generates speech from text using Edge TTS, uploads to Cloudinary, returns URL.");
h3("Request Body");
code(JSON.stringify({ text: "Hello world", voice: "teacher" }, null, 2));
h3("Response (200)");
code(`{ "audioUrl": "https://res.cloudinary.com/..." }`);
doc.moveDown(1);
h2("GET /test/audio");
body("Simple test endpoint. Returns a static audio file list.");
doc.moveDown(1);
h2("POST /api/gemini/evaluate-speaking");
body("Alternative speaking evaluation endpoint using OpenRouter AI.");
separator();

// ============== 9. CONFIGURATION ==============
title("9. Configuration");
h3("utils/placementConfig.js");
code(`LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"]
PASS_THRESHOLD = 75
STAY_THRESHOLD = 45`);
h3("Environment Variables (.env)");
code(`PORT=3000
MONGODB_URI=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
OPENROUTER_API_KEY=...`);
separator();

// ============== 10. HOW TO RUN ==============
title("10. How to Run");
h3("Start Server");
code("node server.js");
body("Server starts on http://localhost:3000 by default.");
doc.moveDown(0.5);
h3("Frontend Pages");
bullet("http://localhost:3000  —  Main placement test UI");
bullet("http://localhost:3000/tts-test.html  —  TTS audio test");
bullet("http://localhost:3000/speaking-test/  —  Speaking AI evaluation test");
doc.moveDown(0.5);
h3("Offline Audio Generation");
code("node scripts/generateListeningAudio.js");
body("Pre-generates all listening audio URLs via Edge TTS and stores in Cloudinary.");
doc.moveDown(0.5);
h3("Key Files");
bullet("services/placementDecisionService.js  —  New placement decision logic");
bullet("services/placementService.js  —  Main placement orchestration");
bullet("services/placementSessionService.js  —  In-memory session management");
bullet("services/placementProgressionService.js  —  Legacy progression logic");
bullet("services/elevenLabsService.js  —  Edge TTS implementation");
bullet("services/storageService.js  —  Cloudinary upload");
bullet("services/aiService.js  —  Speaking AI evaluation prompt");
bullet("services/speakingService.js  —  Speaking evaluation orchestration");
bullet("providers/openRouterProvider.js  —  AI provider (6-model fallback)");
bullet("utils/fileHelpers.js  —  Score calculation, flatten helpers");
bullet("scripts/generateListeningAudio.js  —  Offline audio pre-generation");

doc.end();

console.log("PDF generated: " + output);
