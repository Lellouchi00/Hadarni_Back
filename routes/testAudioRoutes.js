const express = require("express");
const router = express.Router();
const { rawGenerate } = require("../controllers/testAudioController");

router.get("/raw", rawGenerate);

module.exports = router;
