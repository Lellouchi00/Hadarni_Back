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
let speakingState = null;

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
  submitBtn.style.display = "";
  renderDashboard();
}

async function startExam(section) {
  currentSection = section;
  dashboard.classList.add("hidden");
  sectionResult.classList.add("hidden");
  examSection.classList.remove("hidden");
  submitBtn.style.display = section === "speaking" ? "none" : "";
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
  if (!exam.passages || !exam.passages.length) {
    examContent.innerHTML = '<div style="color:#c62828;text-align:center;">Reading exam has no passages.</div>';
    return;
  }

  let html = "";
  let questionIndex = 0;

  exam.passages.forEach((passage, pi) => {
    html += `<div class="passage-block" style="margin-bottom:20px;">`;
    html += `<div class="passage" style="background:#f8f9fa;padding:16px;border-radius:10px;margin-bottom:16px;white-space:pre-wrap;">${passage.text}</div>`;
    html += '<div class="questions">';

    passage.questions.forEach((q) => {
      const qNum = ++questionIndex;
      html += `
        <div class="question-card" data-q="${q.id}">
          <h3>${qNum}. ${q.question}</h3>
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

    html += "</div></div>";
  });

  examContent.innerHTML = html;
}

function renderListening(exam) {
  if (!exam.questions || !exam.questions.length) {
    examContent.innerHTML = '<div style="color:#c62828;text-align:center;">No listening questions available.</div>';
    return;
  }

  let html = '<div style="background:#fff8e1;padding:12px 16px;border-radius:10px;margin-bottom:20px;font-size:14px;color:#6d5200;">Listen to each audio clip and answer the question.</div>';
  html += '<div class="questions">';

  exam.questions.forEach((q, i) => {
    const qid = q.questionId || q.id || i;
    html += `
      <div class="question-card" data-q="${qid}" style="margin-bottom:20px;">
        <h3>${i + 1}. ${q.question}</h3>`;
    if (q.audioUrl) {
      html += `<audio controls style="width:100%;margin-bottom:10px;" src="${q.audioUrl}"></audio>`;
    } else if (q.audioText) {
      html += `<div style="background:#f0f0f0;padding:10px;border-radius:8px;margin-bottom:10px;font-style:italic;">${q.audioText}</div>`;
    }
    html += `<div class="options">
          ${q.options
            .map(
              (opt, oi) => `
            <label class="option">
              <input type="radio" name="q_${qid}" value="${oi}" />
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
  let prompts = [];
  if (exam.prompts && exam.prompts.length) {
    prompts = exam.prompts.map((p, i) => ({ id: "q" + i, question: p }));
  } else if (exam.questions && exam.questions.length) {
    prompts = exam.questions.map((q, i) => ({ id: q.id || "q" + i, question: q.question || q.prompt || "Question " + (i + 1) }));
  }

  if (!prompts.length) {
    prompts = [
      { id: "q0", question: "Hello! What is your name?" },
      { id: "q1", question: "Where are you from?" },
      { id: "q2", question: "What are your hobbies?" },
      { id: "q3", question: "Tell me about your daily routine." },
    ];
  }

  speakingState = {
    prompts,
    answers: new Array(prompts.length).fill(""),
    currentIndex: 0,
    reviewMode: false,
  };

  renderSpeakingQuestion();
}

function renderSpeakingQuestion() {
  const state = speakingState;
  if (state.currentIndex >= state.prompts.length) {
    renderSpeakingReview();
    return;
  }

  const q = state.prompts[state.currentIndex];
  const total = state.prompts.length;
  const isLast = state.currentIndex === total - 1;

  examContent.innerHTML = `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:12px;color:#999;">Question ${state.currentIndex + 1} of ${total}</span>
        <span style="font-size:12px;color:#999;">${Math.round(((state.currentIndex) / total) * 100)}%</span>
      </div>
      <div style="background:#e0e0e0;border-radius:10px;height:6px;overflow:hidden;">
        <div style="height:100%;width:${((state.currentIndex) / total) * 100}%;background:#5b3df5;border-radius:10px;transition:width 0.3s;"></div>
      </div>
    </div>
    <div class="instruction-box" style="margin-bottom:16px;">${examTitle.textContent.replace(" - Speaking", "").trim()} Speaking — Answer each question aloud or type below.</div>
    <div style="background:#f8f9fa;padding:20px;border-radius:12px;margin-bottom:16px;font-size:18px;font-weight:600;line-height:1.5;">${q.question}</div>
    <textarea id="speaking-answer" placeholder="Type your answer here... (or use the microphone)" style="width:100%;min-height:100px;padding:12px;border:2px solid #ddd;border-radius:10px;font-size:14px;resize:vertical;box-sizing:border-box;">${state.answers[state.currentIndex] || ""}</textarea>
    <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;">
      <button id="speaking-mic-btn" type="button" style="flex:1;padding:10px 20px;border-radius:8px;border:2px solid #5b3df5;background:white;color:#5b3df5;cursor:pointer;font-weight:600;min-width:140px;">🎤 Start Speaking</button>
      <button id="speaking-next-btn" type="button" style="flex:2;padding:10px 20px;border-radius:8px;border:none;background:#5b3df5;color:white;cursor:pointer;font-weight:600;${state.answers[state.currentIndex] ? "" : "opacity:0.5;"}" ${state.answers[state.currentIndex] ? "" : "disabled"}>${isLast ? "Review Answers" : "Next Question"}</button>
    </div>
    <div id="speaking-status" style="margin-top:8px;font-size:13px;color:#666;"></div>
  `;

  submitBtn.style.display = "none";

  const ansInput = document.getElementById("speaking-answer");
  const micBtn = document.getElementById("speaking-mic-btn");
  const nextBtn = document.getElementById("speaking-next-btn");
  const statusEl = document.getElementById("speaking-status");

  ansInput.addEventListener("input", () => {
    state.answers[state.currentIndex] = ansInput.value;
    nextBtn.disabled = !ansInput.value.trim();
    nextBtn.style.opacity = ansInput.value.trim() ? "1" : "0.5";
  });

  nextBtn.addEventListener("click", () => {
    state.answers[state.currentIndex] = ansInput.value.trim();
    if (isLast) {
      renderSpeakingReview();
    } else {
      state.currentIndex++;
      renderSpeakingQuestion();
    }
  });

  micBtn.addEventListener("click", () => toggleSpeakingMic(ansInput, micBtn, statusEl, state));
}

function toggleSpeakingMic(input, btn, status, state) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    status.textContent = "Speech recognition not supported. Use Chrome.";
    return;
  }

  if (btn.dataset.recording === "true") {
    if (window._speakingRecognition) {
      try { window._speakingRecognition.stop(); } catch (e) {}
      window._speakingRecognition = null;
    }
    btn.dataset.recording = "false";
    btn.textContent = "🎤 Start Speaking";
    btn.style.background = "white";
    btn.style.color = "#5b3df5";
    status.textContent = "";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  window._speakingRecognition = recognition;

  let finalTranscript = "";

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += t;
      } else {
        interim += t;
      }
    }
    input.value = finalTranscript + interim;
    input.scrollTop = input.scrollHeight;
  };

  recognition.onerror = (event) => {
    status.textContent = "Error: " + event.error;
    btn.dataset.recording = "false";
    btn.textContent = "🎤 Start Speaking";
    btn.style.background = "white";
    btn.style.color = "#5b3df5";
  };

  recognition.onend = () => {
    if (btn.dataset.recording === "true") {
      try { recognition.start(); } catch (e) {}
    } else {
      btn.textContent = "🎤 Start Speaking";
      btn.style.background = "white";
      btn.style.color = "#5b3df5";
      if (input.value.trim()) {
        state.answers[state.currentIndex] = input.value.trim();
        status.textContent = "Captured! Click Next or edit above.";
        status.style.color = "#2e7d32";
        document.getElementById("speaking-next-btn").disabled = false;
        document.getElementById("speaking-next-btn").style.opacity = "1";
      }
    }
  };

  btn.dataset.recording = "true";
  btn.textContent = "🔴 Recording... (click to stop)";
  btn.style.background = "#c62828";
  btn.style.color = "white";
  status.textContent = "Listening...";
  input.value = "";
  recognition.start();
}

function renderSpeakingReview() {
  const state = speakingState;

  let answersHtml = state.prompts.map((p, i) =>
    `<div style="background:#f8f9fa;padding:12px 16px;border-radius:10px;margin-bottom:10px;">
      <div style="font-weight:600;margin-bottom:4px;font-size:14px;">Q${i + 1}: ${p.question}</div>
      <div style="color:#333;font-size:14px;white-space:pre-wrap;">${escapeHtml(state.answers[i] || "(not answered)")}</div>
    </div>`
  ).join("");

  examContent.innerHTML = `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:12px;color:#999;">Review your answers</span>
        <span style="font-size:12px;color:#999;">100%</span>
      </div>
      <div style="background:#e0e0e0;border-radius:10px;height:6px;overflow:hidden;">
        <div style="height:100%;width:100%;background:#5b3df5;border-radius:10px;"></div>
      </div>
    </div>
    <div class="instruction-box" style="margin-bottom:16px;">Review your answers before submitting. Set your confidence level below.</div>
    <h3 style="margin-bottom:12px;">Your Answers</h3>
    ${answersHtml}
    <div class="percentage-input-group" style="margin-top:20px;padding-top:16px;border-top:2px solid #eee;">
      <label style="font-weight:600;">Self-assessment:</label>
      <input type="number" id="speaking-percentage" min="0" max="100" value="50" style="padding:8px 12px;border:2px solid #ddd;border-radius:8px;width:80px;font-size:16px;" />
      <span style="font-size:16px;">%</span>
      <span class="hint" style="display:block;color:#999;font-size:12px;margin-top:4px;">How confident are you in your answers? (0-100)</span>
    </div>
    <button id="speaking-submit-btn" type="button" style="width:100%;padding:14px;margin-top:16px;border-radius:10px;border:none;background:#5b3df5;color:white;cursor:pointer;font-weight:700;font-size:16px;">Submit for Placement</button>
  `;

  submitBtn.style.display = "none";

  document.getElementById("speaking-submit-btn").addEventListener("click", () => {
    const percentage = parseInt(document.getElementById("speaking-percentage")?.value || "50");
    const conversation = state.prompts.map((p, i) =>
      "Q: " + p.question + "\nA: " + (state.answers[i] || "")
    ).join("\n\n");

    speakingState._submitData = { conversation, percentage };
    submitExam();
  });
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
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
    if (!speakingState || !speakingState._submitData) {
      alert("Please complete the speaking section before submitting.");
      return null;
    }
    const { conversation, percentage } = speakingState._submitData;
    if (!conversation || !conversation.trim()) {
      alert("Please provide your answers before submitting.");
      return null;
    }
    return { ...base, conversation, percentage };
  }

  const questions = currentSection === "reading"
    ? currentExam.passages.flatMap((p) => p.questions)
    : currentExam.questions;

  const questionIds = currentSection === "listening"
    ? questions.map((q) => q.questionId || q.id)
    : undefined;

  const answers = questions.map((q) => {
    const qid = q.questionId || q.id;
    const selected = document.querySelector('input[name="q_' + qid + '"]:checked');
    return selected !== null ? parseInt(selected.value) : null;
  });

  const allAnswered = answers.every((a) => a !== null);
  if (!allAnswered) {
    alert("Please answer all questions before submitting.");
    return null;
  }

  const body = { ...base, answers };
  if (questionIds) body.questionIds = questionIds;
  return body;
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

  const avg = result.average;
  const decision = result.decision;
  let statusText, detailText, btnText, action;

  if (decision === "NEXT_LEVEL") {
    const next = result.nextLevel;
    statusText = "Move to next level!";
    detailText = `Your average is ${avg}%. You're ready for ${next}.`;
    btnText = `Start ${next}`;
    action = () => startSession(next);
  } else if (decision === "LOWER_LEVEL") {
    const place = result.placementLevel;
    statusText = "Try a lower level";
    detailText = `Your average is ${avg}%. Consider starting at ${place}.`;
    btnText = `Try ${place}`;
    action = () => startSession(place);
  } else {
    const place = result.placementLevel || currentLevel.toUpperCase();
    statusText = "Placement Complete!";
    detailText = `Your placement level is ${place} with an average of ${avg}%.`;
    btnText = "Start Over";
    action = () => location.reload();
  }

  const sectionDetails = SECTIONS.map((s) => {
    const score = result[s.key];
    const displayScore = score !== undefined ? `${score}%` : (completedSections[s.key] ? "✔" : "—");
    return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">
      <span>${s.icon} ${s.label}</span>
      <span style="font-weight:700;">${displayScore}</span>
    </div>`;
  }).join("");

  progressionContent.innerHTML = `
    <div class="progression-status ${decision.toLowerCase()}">${statusText}</div>
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
