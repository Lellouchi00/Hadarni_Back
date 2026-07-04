const { Router } = require("express");
const router = Router();
const {
  getExam,
  submitSection,
} = require("../controllers/placementController");

router.get("/:level/:section", getExam);

router.post("/:level/:section/submit", submitSection);

module.exports = router;
