const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 40, bottom: 40, left: 50, right: 50 },
  info: {
    Title: "Placement Module API Routes",
    Author: "Placement System",
  },
});

const outPath = path.join(__dirname, "..", "Placement_Routes.pdf");
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

const PRIMARY = "#5b3df5";
const DARK = "#1a1a2e";
const GREEN = "#2e7d32";
const ORANGE = "#e65100";
const GRAY = "#666";

function title(text, size, color) {
  doc.font("Helvetica-Bold").fontSize(size).fillColor(color || DARK).text(text, { underline: false });
  doc.moveDown(0.5);
}

function body(text, size, color) {
  doc.font("Helvetica").fontSize(size || 11).fillColor(color || GRAY).text(text);
  doc.moveDown(0.3);
}

function spacer(h) {
  doc.moveDown(h || 0.5);
}

function hr() {
  const y = doc.y;
  doc.moveTo(50, y).lineTo(545, y).strokeColor("#e0e0e0").stroke();
  doc.moveDown(0.8);
}

function code(str) {
  doc.font("Courier").fontSize(9).fillColor(DARK).text(str, { indent: 10 });
  doc.moveDown(0.2);
}

function bullet(text, indent) {
  doc.font("Helvetica").fontSize(10).fillColor(DARK).text("  •  " + text, { indent: indent || 10, continued: false });
  doc.moveDown(0.15);
}

// ===== HEADER =====
doc.rect(0, 0, doc.page.width, 8).fill(PRIMARY);
spacer(2);

title("Placement Module - API Routes", 26, DARK);
body("Complete documentation for all placement test API endpoints.", 11, GRAY);
body("Base URL: http://localhost:3000", 10, GRAY);
spacer(0.8);
hr();

// ===== TABLE OF CONTENTS =====
title("Table of Contents", 14, DARK);
doc.font("Helvetica").fontSize(10).fillColor(PRIMARY);
doc.text("1.  Start Session", { link: "#start", underline: false });
doc.text("2.  Load Exam", { link: "#exam", underline: false });
doc.text("3.  Submit Section", { link: "#submit", underline: false });
doc.text("4.  Get Session Status", { link: "#status", underline: false });
doc.text("5.  Full Flow Example", { link: "#flow", underline: false });
doc.text("6.  Response Reference", { link: "#responses", underline: false });
spacer(0.8);
hr();

// ===== 1. START SESSION =====
doc.addPage();
doc.rect(0, 0, doc.page.width, 8).fill(PRIMARY);
spacer(1.5);
title("1. Start Session", 18, DARK);
body("Initiates a new placement test session and returns the first section to take.", 10, GRAY);
spacer();

title("Endpoint", 12, PRIMARY);
code("POST /api/placement/progression/start");
spacer();

title("Request Body", 12, PRIMARY);
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("{");
code('  "estimatedLevel": "A1"   // Required: A1 | A2 | B1 | B2 | C1 | C2');
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("}");
spacer();

title("Success Response (201)", 12, GREEN);
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("{");
code('  "sessionId":    "uuid",        // Unique session identifier');
code('  "level":        "A1",          // The level you selected');
code('  "nextSection":  "reading"      // First section to take');
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("}");
spacer();

title("Error Response (400)", 12, ORANGE);
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("{");
code('  "error": "Invalid level: \\"X\\""');
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("}");
spacer();
hr();

// ===== 2. LOAD EXAM =====
title("2. Load Exam", 18, DARK);
body("Fetches a random exam for the specified level and section from ContentBank.", 10, GRAY);
spacer();

title("Endpoint", 12, PRIMARY);
code("GET /api/placement/:level/:section");
spacer();

title("Path Parameters", 12, PRIMARY);
bullet("level   - A1, A2, B1, B2, C1, C2");
bullet("section - reading | listening | writing | speaking");
spacer();

title("Example Request", 12, PRIMARY);
code("GET /api/placement/A1/reading");
spacer();

title("Success Response (200)", 12, GREEN);
body("Returns the full exam JSON from ContentBank. Structure varies by section:", 10, GRAY);
bullet("examId    - Unique exam identifier (auto-added if missing from file)");
bullet("section   - reading | listening | writing | speaking");
bullet("level     - CEFR level");
bullet("title     - Exam title");
bullet("questions - Array of question objects");
bullet("passage   - (reading) Text passage");
bullet("transcript / audioUri - (listening) Audio reference");
bullet("instruction / prompts - (writing/speaking) Task description");
spacer();
hr();

// ===== 3. SUBMIT SECTION =====
doc.addPage();
doc.rect(0, 0, doc.page.width, 8).fill(PRIMARY);
spacer(1.5);
title("3. Submit Section", 18, DARK);
body("Submits answers for a section. The backend saves the result and returns the next step.", 10, GRAY);
spacer();

title("Endpoint", 12, PRIMARY);
code("POST /api/placement/:level/:section/submit");
spacer();

title("Path Parameters", 12, PRIMARY);
bullet("level   - A1, A2, B1, B2, C1, C2");
bullet("section - reading | listening | writing | speaking");
spacer();

title("Request Body", 12, PRIMARY);
body("Common fields:", 10, DARK);
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("{");
code('  "sessionId": "uuid",                // Required - from /start');
code('  "examId":    "exam_001",            // Required - from GET exam');
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("}");
spacer();

title("Reading / Listening", 12, PRIMARY);
body("Add answers array:", 10, DARK);
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("{");
code('  "answers": [0, 1, 2]               // Array of selected option indices');
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("}");
spacer();

title("Writing", 12, PRIMARY);
body("Add text and self-assessment percentage:", 10, DARK);
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("{");
code('  "text":       "My written answer...",   // Written response');
code('  "percentage": 70                         // Self-assessment 0-100');
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("}");
spacer();

title("Speaking", 12, PRIMARY);
body("Add conversation and self-assessment percentage:", 10, DARK);
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("{");
code('  "conversation": "My recorded speech...", // Spoken response');
code('  "percentage":    80                       // Self-assessment 0-100');
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("}");
spacer();

title("Response - Continue (Sections 1-3)", 12, PRIMARY);
body("After reading, listening, or writing:", 10, GRAY);
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("{");
code('  "status":      "continue"');
code('  "nextSection": "listening"     // Next section to take');
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("}");
spacer();

title("Response - Final (After Speaking)", 12, PRIMARY);
body("Three possible outcomes:", 10, GRAY);

doc.font("Helvetica-Bold").fontSize(10).fillColor(GREEN).text("PASS (average > 75%)");
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("{");
code('  "status":    "next_level"');
code('  "nextLevel": "A2"           // Move to this level');
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("}");
spacer(0.3);

doc.font("Helvetica-Bold").fontSize(10).fillColor(PRIMARY).text("STAY (40% <= average <= 75%)");
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("{");
code('  "status":         "finished"');
code('  "placementLevel": "A1"');
code('  "percentage":     68');
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("}");
spacer(0.3);

doc.font("Helvetica-Bold").fontSize(10).fillColor(ORANGE).text("LOWER (average < 40%)");
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("{");
code('  "status":    "lower_level"');
code('  "nextLevel": "A1"           // Move down to this level');
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("}");
spacer(0.3);
hr();

// ===== 4. GET SESSION STATUS =====
title("4. Get Session Status", 18, DARK);
body("Returns the current state of a session (all results, percentages, progression).", 10, GRAY);
spacer();

title("Endpoint", 12, PRIMARY);
code("GET /api/placement/progression/status/:sessionId");
spacer();

title("Example Request", 12, PRIMARY);
code("GET /api/placement/progression/status/3d7fcc92-f8c6-442b-9e1b-60bb426b9b84");
spacer();

title("Success Response (200)", 12, GREEN);
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("{");
code('  "sessionId":        "uuid"');
code('  "level":            "A1"');
code('  "results":          { "reading": 80, "listening": 70, "writing": 60, "speaking": 90 }');
code('  "completedSections": 4');
code('  "totalSections":     4');
code('  "allCompleted":      true');
code('  "finalPercentage":   75');
code('  "progression":       { "status": "finished", "placementLevel": "A1" }');
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("}");
spacer();
hr();

// ===== 5. FULL FLOW =====
doc.addPage();
doc.rect(0, 0, doc.page.width, 8).fill(PRIMARY);
spacer(1.5);
title("5. Full Flow Example", 18, DARK);
body("Complete sequence for a placement test from start to finish.", 10, GRAY);
spacer();

title("Step 1 - Start Session", 12, PRIMARY);
code("POST /api/placement/progression/start");
code('Body:  { "estimatedLevel": "A1" }');
code('Reply: { "sessionId": "abc", "level": "A1", "nextSection": "reading" }');
spacer(0.5);

title("Step 2 - Load Reading Exam", 12, PRIMARY);
code("GET /api/placement/A1/reading");
code("Reply: { examId, passage, questions, ... }");
spacer(0.5);

title("Step 3 - Submit Reading", 12, PRIMARY);
code("POST /api/placement/A1/reading/submit");
code('Body:  { "sessionId": "abc", "examId": "exam_001", "answers": [1, 2, 1] }');
code('Reply: { "status": "continue", "nextSection": "listening" }');
spacer(0.5);

title("Step 4 - Submit Listening", 12, PRIMARY);
code("POST /api/placement/A1/listening/submit");
code('Body:  { "sessionId": "abc", "examId": "exam_002", "answers": [1, 2, 1] }');
code('Reply: { "status": "continue", "nextSection": "writing" }');
spacer(0.5);

title("Step 5 - Submit Writing", 12, PRIMARY);
code("POST /api/placement/A1/writing/submit");
code('Body:  { "sessionId": "abc", "examId": "exam_003", "text": "...", "percentage": 70 }');
code('Reply: { "status": "continue", "nextSection": "speaking" }');
spacer(0.5);

title("Step 6 - Submit Speaking (Final)", 12, PRIMARY);
code("POST /api/placement/A1/speaking/submit");
code('Body:  { "sessionId": "abc", "examId": "exam_004", "conversation": "...", "percentage": 80 }');
code('Reply: { "status": "finished", "placementLevel": "A1", "percentage": 68 }');
spacer(0.5);

title("Optional - Check Session Status", 12, PRIMARY);
code("GET /api/placement/progression/status/abc");
spacer();
hr();

// ===== 6. RESPONSE REFERENCE =====
title("6. Response Reference", 18, DARK);
spacer();

title("HTTP Status Codes", 12, PRIMARY);
bullet("200 - Success");
bullet("201 - Session created");
bullet("400 - Bad request (missing/invalid fields)");
bullet("404 - Level, section, exam, or session not found");
spacer();

title("Error Response Format", 12, PRIMARY);
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("{");
code('  "error": "Descriptive error message"');
doc.font("Helvetica").fontSize(10).fillColor(DARK).text("}");
spacer();

title("Placement Rules Summary", 12, PRIMARY);
spacer(0.2);

// Draw a simple table
const tableTop = doc.y;
const col1 = 50;
const col2 = 160;
const col3 = 320;
const rowH = 20;

doc.font("Helvetica-Bold").fontSize(10).fillColor("#fff");
doc.rect(col1, tableTop, 495, rowH).fill(PRIMARY);
doc.text("  Average", col1 + 5, tableTop + 5);
doc.text("  Result", col2 + 5, tableTop + 5);
doc.text("  Response", col3 + 5, tableTop + 5);

const rows = [
  ["> 75%", "Next Level", '{ status: "next_level", nextLevel: "A2" }'],
  ["40% - 75%", "Finished", '{ status: "finished", placementLevel: "A1", percentage }'],
  ["< 40% (not A1)", "Lower Level", '{ status: "lower_level", nextLevel: "A1" }'],
  ["< 40% (A1)", "Finished (A1)", '{ status: "finished", placementLevel: "A1", percentage }'],
];

rows.forEach((r, i) => {
  const y = tableTop + rowH + i * rowH;
  const bg = i % 2 === 0 ? "#f8f6ff" : "#fff";
  doc.rect(col1, y, 495, rowH).fill(bg);
  doc.font("Helvetica").fontSize(9).fillColor(DARK);
  doc.text("  " + r[0], col1 + 5, y + 5);
  doc.text("  " + r[1], col2 + 5, y + 5);
  doc.text("  " + r[2], col3 + 5, y + 5, { width: 220 });
});

spacer(2);

// ===== FOOTER =====
doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill("#f0f2f5");
doc.font("Helvetica").fontSize(8).fillColor(GRAY).text(
  "Placement Module API Documentation  |  Generated " + new Date().toISOString().split("T")[0],
  50,
  doc.page.height - 22,
  { align: "center" }
);

doc.end();

stream.on("finish", () => {
  console.log("PDF created: " + outPath);
});
