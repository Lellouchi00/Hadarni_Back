const API_BASE = "/api/placement";
const PROGRESSION_BASE = "/api/placement/progression";

let sessionId = null;
let currentLevel = null;
let currentExam = null;
let currentSection = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const levelScreen = $("#level-screen");
const dashboard = $("#dashboard");
const examSection = $("#exam-section");
const sectionResult = $("#section-result");
const progressionResult = $("#progression-result");

const currentLevelEl = $("#current-level");
const progressBadge = $("#progress-badge");
const sectionDashboard = $("#section-dashboard");
const examTitle = $("#exam-title");
const examId = $("#exam-id");
const examSectionBadge = $("#exam-section-badge");
const examContent = $("#exam-content");
const submitBtn = $("#submit-btn");
const backBtn = $("#back-btn");
const loading = $("#loading");
const sectionResultTitle = $("#section-result-title");
const sectionResultContent = $("#section-result-content");
const sectionResultBtn = $("#section-result-btn");
const progressionContent = $("#progression-content");
const progressionBtn = $("#progression-btn");

const SECTIONS = [
  { key: "reading", label: "Reading", icon: "📖" },
  { key: "listening", label: "Listening", icon: "🎧" },
  { key: "writing", label: "Writing", icon: "✍️" },
  { key: "speaking", label: "Speaking", icon: "🎤" },
];

let completedSections = {};
let nextSection = null;

$$(".level-btn").forEach((btn) => {
  btn.addEventListener("click", () => startSession(btn.dataset.level));
});

backBtn.addEventListener("click", showDashboard);
sectionResultBtn.addEventListener("click", onSectionResultContinue);
progressionBtn.addEventListener("click", onProgressionContinue);
submitBtn.addEventListener("click", submitExam);

function getNextPendingSection() {
  for (const s of SECTIONS) {
    if (!completedSections[s.key]) return s.key;
  }
  return null;
}

async function startSession(level) {
  currentLevel = level;
  completedSections = {};
  try {
    const res = await fetch(`${PROGRESSION_BASE}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estimatedLevel: level }),
    });
    if (!res.ok) throw new Error("Failed to start session");
    const data = await res.json();
    sessionId = data.sessionId;
    nextSection = data.nextSection;
    levelScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");
    currentLevelEl.textContent = level.toUpperCase();
    renderDashboard();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

function renderDashboard() {
  const doneCount = SECTIONS.filter((s) => completedSections[s.key]).length;
  const nextKey = getNextPendingSection();
  progressBadge.textContent = `${doneCount} / 4 completed`;
  if (doneCount === 4) progressBadge.classList.add("complete");
  else progressBadge.classList.remove("complete");

  sectionDashboard.innerHTML = SECTIONS.map((s) => {
    const isDone = !!completedSections[s.key];
    const isNext = s.key === nextKey;
    return `
      <div class="section-dash-item ${isNext && !isDone ? "" : "locked"}" data-section="${s.key}">
        <span class="section-icon">${s.icon}</span>
        <span class="section-name">${s.label}</span>
        <span class="section-status ${isDone ? "done" : "pending"}">
          ${isDone ? "✔ Completed" : isNext ? "Start →" : "Locked"}
        </span>
      </div>`;
  }).join("");

  sectionDashboard.querySelectorAll(".section-dash-item").forEach((el) => {
    el.addEventListener("click", () => {
      const key = el.dataset.section;
      if (key !== getNextPendingSection()) return;
      startExam(key);
    });
  });
}

function showDashboard() {
  examSection.classList.add("hidden");
  sectionResult.classList.add("hidden");
  progressionResult.classList.add("hidden");
  dashboard.classList.remove("hidden");
  renderDashboard();
}

async function startExam(section) {
  currentSection = section;
  dashboard.classList.add("hidden");
  sectionResult.classList.add("hidden");
  examSection.classList.remove("hidden");
  examSectionBadge.textContent = `${currentLevel.toUpperCase()} - ${section.charAt(0).toUpperCase() + section.slice(1)}`;
  showLoading();

  try {
    const res = await fetch(`${API_BASE}/${currentLevel}/${section}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to load exam");
    }
    currentExam = await res.json();
    renderExam();
    hideLoading();
  } catch (err) {
    hideLoading();
    examContent.innerHTML = `<div style="color:#c62828;padding:20px;text-align:center;">${err.message}</div>`;
  }
}

function showLoading() {
  loading.classList.remove("hidden");
  if (examContent) examContent.classList.add("hidden");
}

function hideLoading() {
  loading.classList.add("hidden");
  if (examContent) examContent.classList.remove("hidden");
}

function renderExam() {
  const exam = currentExam;
  examTitle.textContent = exam.title || `${currentSection} Exam`;
  examId.textContent = exam.examId;

  if (currentSection === "reading") renderReading(exam);
  else if (currentSection === "listening") renderListening(exam);
  else if (currentSection === "writing") renderWriting(exam);
  else if (currentSection === "speaking") renderSpeaking(exam);
}

function renderReading(exam) {
  let html = `<div class="passage">${exam.passage}</div>`;
  html += '<div class="questions">';
  exam.questions.forEach((q, i) => {
    html += `
      <div class="question-card" data-q="${q.id}">
        <h3>${i + 1}. ${q.question}</h3>
        <div class="options">
          ${q.options
            .map(
              (opt, oi) => `
            <label class="option">
              <input type="radio" name="q_${q.id}" value="${oi}" />
              ${opt}
            </label>`
            )
            .join("")}
        </div>
      </div>`;
  });
  html += "</div>";
  examContent.innerHTML = html;
}

function renderListening(exam) {
  let html = "";
  if (exam.transcript) {
    html += `<div class="passage"><em>Transcript:</em><br/>${exam.transcript}</div>`;
  } else {
    html += `<div class="passage" style="color:#666;"><em>Listen to the audio and answer the questions below.</em></div>`;
  }
  html += '<div class="questions">';
  exam.questions.forEach((q, i) => {
    html += `
      <div class="question-card" data-q="${q.id}">
        <h3>${i + 1}. ${q.question}</h3>
        ${q.audioUri ? `<audio controls style="width:100%;margin-bottom:8px;" src="${q.audioUri}"></audio>` : ""}
        <div class="options">
          ${q.options
            .map(
              (opt, oi) => `
            <label class="option">
              <input type="radio" name="q_${q.id}" value="${oi}" />
              ${opt}
            </label>`
            )
            .join("")}
        </div>
      </div>`;
  });
  html += "</div>";
  examContent.innerHTML = html;
}

function renderWriting(exam) {
  let html = `<div class="instruction-box">${exam.instruction || "Write your answer below."}</div>`;
  html += '<textarea id="writing-text" placeholder="Write your answer here..."></textarea>';
  html += `
    <div class="percentage-input-group">
      <label>Self-assessment:</label>
      <input type="number" id="self-percentage" min="0" max="100" value="50" />
      <span>%</span>
      <span class="hint">How confident are you in your answer? (0-100)</span>
    </div>`;
  examContent.innerHTML = html;
}

function renderSpeaking(exam) {
  let html = `<div class="instruction-box">${exam.instruction || "Record your answer below."}</div>`;
  if (exam.prompts && exam.prompts.length) {
    html += '<div class="prompts"><h3>Prompts:</h3><ul>';
    exam.prompts.forEach((p) => { html += "<li>" + p + "</li>"; });
    html += "</ul></div>";
  }
  html += '<textarea id="speaking-text" placeholder="Write what you would say..."></textarea>';
  html += `
    <div class="percentage-input-group">
      <label>Self-assessment:</label>
      <input type="number" id="self-percentage" min="0" max="100" value="50" />
      <span>%</span>
      <span class="hint">How confident are you in your answer? (0-100)</span>
    </div>`;
  examContent.innerHTML = html;
}

function buildSubmitBody() {
  const base = { sessionId, examId: currentExam.examId };

  if (currentSection === "writing") {
    const text = $("#writing-text")?.value;
    if (!text || !text.trim()) {
      alert("Please write your answer before submitting.");
      return null;
    }
    const percentage = parseInt($("#self-percentage")?.value || "50");
    return { ...base, text, percentage };
  }

  if (currentSection === "speaking") {
    const conversation = $("#speaking-text")?.value;
    if (!conversation || !conversation.trim()) {
      alert("Please write your conversation before submitting.");
      return null;
    }
    const percentage = parseInt($("#self-percentage")?.value || "50");
    return { ...base, conversation, percentage };
  }

  const questions = currentExam.questions;
  const answers = questions.map((q) => {
    const selected = document.querySelector('input[name="q_' + q.id + '"]:checked');
    return selected !== null ? parseInt(selected.value) : null;
  });

  const allAnswered = answers.every((a) => a !== null);
  if (!allAnswered) {
    alert("Please answer all questions before submitting.");
    return null;
  }

  return { ...base, answers };
}

async function submitExam() {
  if (!currentExam) return;

  const body = buildSubmitBody();
  if (!body) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const res = await fetch(`${API_BASE}/${currentLevel}/${currentSection}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Submission failed");
    }

    const result = await res.json();

    completedSections[currentSection] = true;

    if (result.status === "continue") {
      nextSection = result.nextSection;
      showContinueResult(currentSection, result.nextSection);
    } else {
      showFinalResult(result);
    }
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit";
  }
}

function showContinueResult(section, next) {
  examSection.classList.add("hidden");
  sectionResult.classList.remove("hidden");
  progressionResult.classList.add("hidden");

  const doneCount = SECTIONS.filter((s) => completedSections[s.key]).length;
  const sectionLabel = section.charAt(0).toUpperCase() + section.slice(1);
  const nextLabel = next.charAt(0).toUpperCase() + next.slice(1);

  sectionResultTitle.textContent = `${sectionLabel} done! (${doneCount}/4)`;
  sectionResultContent.innerHTML = `
    <p style="font-size:18px;font-weight:600;color:#2e7d32;margin-bottom:8px;">Section completed</p>
    <p style="color:#666;font-size:14px;">Ready for <strong>${nextLabel}</strong>.</p>`;
  sectionResultBtn.textContent = `Start ${nextLabel}`;
  sectionResultBtn.dataset.nextSection = next;
  sectionResultBtn.onclick = () => {
    sectionResult.classList.add("hidden");
    startExam(next);
  };
}

function showFinalResult(result) {
  examSection.classList.add("hidden");
  sectionResult.classList.add("hidden");
  progressionResult.classList.remove("hidden");

  const avg = result.percentage;
  const status = result.status;
  let statusText, detailText, btnText, action;

  if (status === "next_level") {
    const next = result.nextLevel;
    statusText = "Move to next level!";
    detailText = `Your average is above 75%. You're ready for ${next}.`;
    btnText = `Start ${next}`;
    action = () => startSession(next);
  } else if (status === "lower_level") {
    const lower = result.nextLevel;
    statusText = "Try a lower level";
    detailText = `Your average is below 40%. Consider starting at ${lower}.`;
    btnText = `Try ${lower}`;
    action = () => startSession(lower);
  } else {
    const place = result.placementLevel || currentLevel.toUpperCase();
    statusText = "Placement Complete!";
    detailText = `Your placement level is ${place} with an average of ${avg}%.`;
    btnText = "Start Over";
    action = () => location.reload();
  }

  const sectionDetails = SECTIONS.map((s) =>
    `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">
      <span>${s.icon} ${s.label}</span>
      <span style="font-weight:700;">${completedSections[s.key] ? "✔" : "—"}</span>
    </div>`
  ).join("");

  progressionContent.innerHTML = `
    <div class="progression-status ${status}">${statusText}</div>
    <div class="progression-detail" style="margin-bottom:16px;">${detailText}</div>
    <div style="background:#f8f9fa;border-radius:12px;padding:16px;margin-bottom:16px;text-align:left;">
      ${sectionDetails}
    </div>
    <div style="font-size:36px;font-weight:800;color:#5b3df5;">${avg}%</div>
    <div style="font-size:13px;color:#999;">final average</div>`;

  progressionBtn.textContent = btnText;
  progressionBtn.onclick = action;
}

function onSectionResultContinue() {
}

function onProgressionContinue() {
}
