const { Router } = require("express");
const router = Router();
const {
  startSession,
  getStatus,
} = require("../controllers/placementProgressionController");

router.post("/start", startSession);
router.get("/status/:sessionId", getStatus);

module.exports = router;
