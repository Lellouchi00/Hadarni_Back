const API_BASE = "/api";
const SPEAKING_API = `${API_BASE}/speaking`;
const PLACEMENT_API = `${API_BASE}/placement`;

let currentExam = null;
let currentLevel = "B1";
let questions = [];
let answers = [];
let currentIndex = 0;
let recognition = null;
let isRecording = false;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const setupScreen = $("#setup-screen");
const speakingScreen = $("#speaking-screen");
const reviewScreen = $("#review-screen");
const resultScreen = $("#result-screen");
const loadingOverlay = $("#loading-overlay");

const levelSelect = $("#level-select");
const loadBtn = $("#load-btn");
const examInfo = $("#exam-info");
const progressBar = $("#progress-bar");
const questionCounter = $("#question-counter");
const questionPrompt = $("#question-prompt");
const answerInput = $("#answer-input");
const micBtn = $("#mic-btn");
const micLabel = $("#mic-label");
const nextBtn = $("#next-btn");
const statusMsg = $("#status-msg");
const reviewList = $("#review-list");
const submitBtn = $("#submit-btn");
const scoresGrid = $("#scores-grid");
const feedbackBox = $("#feedback-box");
const detailsGrid = $("#details-grid");
const retryBtn = $("#retry-btn");

loadBtn.addEventListener("click", loadExam);
nextBtn.addEventListener("click", nextQuestion);
micBtn.addEventListener("click", toggleMic);
submitBtn.addEventListener("click", submitEvaluation);
retryBtn.addEventListener("click", resetAll);

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

function setStatus(msg, type) {
  statusMsg.textContent = msg;
  statusMsg.className = "status-msg" + (type ? " " + type : "");
}

function showLoading(msg) {
  loadingOverlay.querySelector("p").textContent = msg || "Loading...";
  show(loadingOverlay);
}

function hideLoading() {
  hide(loadingOverlay);
}

async function loadExam() {
  currentLevel = levelSelect.value;
  loadBtn.disabled = true;
  loadBtn.textContent = "Loading...";

  try {
    const res = await fetch(`${PLACEMENT_API}/${currentLevel}/speaking`);
    if (!res.ok) throw new Error("Failed to load exam");
    currentExam = await res.json();

    if (currentExam.prompts && currentExam.prompts.length) {
      questions = currentExam.prompts.map((p, i) => ({
        id: `q${i + 1}`,
        question: p,
        title: currentExam.title || `Speaking ${currentLevel}`,
        instruction: currentExam.instruction || "",
      }));
    } else if (currentExam.questions && currentExam.questions.length) {
      questions = currentExam.questions.map((q, i) => ({
        id: q.id || `q${i + 1}`,
        question: q.question || q.prompt || `Question ${i + 1}`,
      }));
    } else {
      questions = [
        { id: "q1", question: "Hello! What is your name?", default: true },
        { id: "q2", question: "Where are you from?", default: true },
        { id: "q3", question: "What are your hobbies?", default: true },
        { id: "q4", question: "Tell me about your daily routine.", default: true },
      ];
    }

    answers = new Array(questions.length).fill("");
    currentIndex = 0;

    examInfo.textContent = `Loaded: ${currentExam.examId || "speaking"} — ${questions.length} questions`;
    show(examInfo);

    hide(setupScreen);
    show(speakingScreen);
    renderQuestion();
  } catch (err) {
    setStatus("Error: " + err.message, "error");
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = "Load Exam";
  }
}

function renderQuestion() {
  if (currentIndex >= questions.length) {
    showReview();
    return;
  }

  const q = questions[currentIndex];
  questionPrompt.textContent = q.question;
  answerInput.value = answers[currentIndex] || "";
  answerInput.disabled = false;
  answerInput.focus();

  const total = questions.length;
  progressBar.style.width = `${((currentIndex) / total) * 100}%`;
  questionCounter.textContent = `Question ${currentIndex + 1} of ${total}`;

  nextBtn.disabled = !answers[currentIndex]?.trim();
  nextBtn.textContent = currentIndex === total - 1 ? "Review Answers" : "Next Question";
  setStatus("");
}

function nextQuestion() {
  answers[currentIndex] = answerInput.value.trim();
  currentIndex++;
  if (currentIndex >= questions.length) {
    showReview();
  } else {
    renderQuestion();
  }
}

function showReview() {
  hide(speakingScreen);
  show(reviewScreen);

  reviewList.innerHTML = answers.map((ans, i) => `
    <div class="review-item">
      <div class="q">Q${i + 1}: ${escapeHtml(questions[i].question)}</div>
      <div class="a">${escapeHtml(ans || "(not answered)")}</div>
    </div>
  `).join("");
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

async function submitEvaluation() {
  showLoading("Evaluating your speaking...");

  const conversation = questions.map((q, i) => ({
    question: q.question,
    answer: answers[i] || "",
  }));

  try {
    const res = await fetch(`${SPEAKING_API}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: currentLevel, conversation }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Evaluation failed");
    }

    const data = await res.json();
    hideLoading();
    hide(reviewScreen);
    showResults(data.result);
  } catch (err) {
    hideLoading();
    setStatus("Error: " + err.message, "error");
    show(reviewScreen);
  }
}

function showResults(result) {
  show(resultScreen);

  const total = result.total || 0;
  const totalClass = total >= 70 ? "pass" : total < 40 ? "fail" : "";

  scoresGrid.innerHTML = `
    <div class="score-card main">
      <div class="value ${totalClass}">${total}</div>
      <div class="label">Total Score</div>
    </div>
    <div class="score-card">
      <div class="value">${result.grammar}</div>
      <div class="label">Grammar</div>
    </div>
    <div class="score-card">
      <div class="value">${result.vocabulary}</div>
      <div class="label">Vocabulary</div>
    </div>
    <div class="score-card">
      <div class="value">${result.taskCompletion}</div>
      <div class="label">Task Completion</div>
    </div>
    <div class="score-card">
      <div class="value">${result.fluency}</div>
      <div class="label">Fluency</div>
    </div>
  `;

  feedbackBox.innerHTML = `<strong>Feedback:</strong> ${escapeHtml(result.feedback || "No feedback provided.")}`;

  detailsGrid.innerHTML = `
    <div class="detail-col strengths">
      <h3>Strengths</h3>
      <ul>${(result.strengths || []).map(s => `<li>${escapeHtml(s)}</li>`).join("") || "<li>None noted</li>"}</ul>
    </div>
    <div class="detail-col weaknesses">
      <h3>Weaknesses</h3>
      <ul>${(result.weaknesses || []).map(w => `<li>${escapeHtml(w)}</li>`).join("") || "<li>None noted</li>"}</ul>
    </div>
  `;
}

function resetAll() {
  currentExam = null;
  questions = [];
  answers = [];
  currentIndex = 0;
  resultScreen.classList.add("hidden");
  reviewScreen.classList.add("hidden");
  speakingScreen.classList.add("hidden");
  show(setupScreen);
  hide(examInfo);
  statusMsg.textContent = "";
}

// --- Web Speech API ---
function toggleMic() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setStatus("Speech recognition is not supported in this browser. Try Chrome.", "error");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

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
    answerInput.value = finalTranscript + interim;
    answerInput.scrollTop = answerInput.scrollHeight;
  };

  recognition.onerror = (event) => {
    setStatus("Speech error: " + event.error, "error");
    stopRecording();
  };

  recognition.onend = () => {
    if (isRecording) {
      recognition.start();
    } else {
      micBtn.classList.remove("recording");
      micLabel.textContent = "Start Speaking";
      if (answerInput.value.trim()) {
        answers[currentIndex] = answerInput.value.trim();
        nextBtn.disabled = false;
        setStatus("Speech captured! Click Next or edit above.", "success");
      } else {
        setStatus("No speech detected. Try again.", "error");
      }
    }
  };

  isRecording = true;
  micBtn.classList.add("recording");
  micLabel.textContent = "Recording... (click to stop)";
  setStatus("Listening...", "success");
  answerInput.value = "";
  recognition.start();
}

function stopRecording() {
  isRecording = false;
  if (recognition) {
    try { recognition.stop(); } catch (e) { /* ignore */ }
    recognition = null;
  }
  micBtn.classList.remove("recording");
  micLabel.textContent = "Start Speaking";
}
