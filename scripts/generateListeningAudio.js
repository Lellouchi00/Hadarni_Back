require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs");
const path = require("path");
const audioService = require("../services/audioService");
const filenameService = require("../services/filenameService");

const CONTENT_BANK = path.join(__dirname, "..", "ContentBank", "placement");
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

async function processFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const exam = JSON.parse(raw);
  let changed = false;

  if (!Array.isArray(exam.questions)) {
    console.log(`  Skipped — no questions array`);
    return;
  }

  for (const q of exam.questions) {
    if (q.audioUrl && q.audioUrl.startsWith("http")) {
      continue;
    }

    if (!q.audioText || typeof q.audioText !== "string" || !q.audioText.trim()) {
      console.log(`  Skipped q${q.questionId || q.id} — no audioText`);
      continue;
    }

    const questionId = q.questionId || q.id || "unknown";
    console.log(`  Generating audio for ${exam.examId} / ${questionId}...`);

    try {
      const fname = filenameService.listeningQuestionAudio(exam.level, exam.examId, questionId);
      const result = await audioService.generateTextAudio(q.audioText, "teacher", fname);

      if (result && result.audioUrl) {
        q.audioUrl = result.audioUrl;
        changed = true;
        console.log(`    OK: ${result.audioUrl}`);
      } else {
        console.log(`    FAIL: no URL returned`);
      }
    } catch (err) {
      console.log(`    ERROR: ${err.message}`);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(exam, null, 2), "utf-8");
    console.log(`  Written: ${path.basename(filePath)}`);
  } else {
    console.log(`  No changes needed`);
  }
}

async function main() {
  console.log("=== Listening Audio Generator ===\n");

  for (const level of LEVELS) {
    const dir = path.join(CONTENT_BANK, level, "listening");

    if (!fs.existsSync(dir)) {
      console.log(`${level}/listening — not found, skipping`);
      continue;
    }

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

    if (files.length === 0) {
      console.log(`${level}/listening — no JSON files`);
      continue;
    }

    console.log(`\n--- ${level} (${files.length} files) ---`);

    for (const file of files) {
      const filePath = path.join(dir, file);
      console.log(`\n${file}:`);
      await processFile(filePath);
    }
  }

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
