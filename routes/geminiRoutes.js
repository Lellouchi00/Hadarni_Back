const { Router } = require("express");
const router = Router();
const { evaluateWriting, evaluateSpeaking } = require("../controllers/geminiController");

router.post("/evaluate-writing", evaluateWriting);
router.post("/evaluate-speaking", evaluateSpeaking);

module.exports = router;
