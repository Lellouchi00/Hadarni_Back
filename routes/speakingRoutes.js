const { Router } = require("express");
const router = Router();
const { evaluateSpeaking } = require("../controllers/speakingController");

router.post("/evaluate", evaluateSpeaking);

module.exports = router;
