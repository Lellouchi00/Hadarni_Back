const VOICES = {
  teacher: {
    id: "21m00Tcm4TlvDq8ikWAM",
    edgeVoice: "en-US-AriaNeural",
    label: "Teacher (Aria)",
    category: "professional",
  },
  male: {
    id: "IKne3meq5aSn9XLyUdCD",
    edgeVoice: "en-US-GuyNeural",
    label: "Male (Guy)",
    category: "gender",
  },
  female: {
    id: "EXAVITQu4vrRV8LG4Z1I",
    edgeVoice: "en-US-JennyNeural",
    label: "Female (Jenny)",
    category: "gender",
  },
  narrator: {
    id: "ODq5zmih8GrVes37Dizd",
    edgeVoice: "en-GB-RyanNeural",
    label: "Narrator (Ryan)",
    category: "style",
  },
  child: {
    id: "Xb7hH8MSUJpSbSDYk0k2",
    edgeVoice: "en-US-AnaNeural",
    label: "Child (Ana)",
    category: "age",
  },
  exam: {
    id: "N2lXS1wI3Sz5Y6Kk0F0m",
    edgeVoice: "en-US-AriaNeural",
    label: "Exam (Aria)",
    category: "professional",
  },
};

function getVoice(key) {
  const voice = VOICES[key];
  if (!voice) {
    return null;
  }
  return voice;
}

function getAllVoices() {
  return Object.entries(VOICES).map(([key, v]) => ({
    key,
    id: v.id,
    edgeVoice: v.edgeVoice,
    label: v.label,
    category: v.category,
  }));
}

module.exports = { VOICES, getVoice, getAllVoices };
