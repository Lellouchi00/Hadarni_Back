const { Router } = require("express");
const router = Router();
const { generate } = require("../controllers/audioController");

router.post("/generate", generate);

module.exports = router;
