const express = require("express");
const router = express.Router();
const { createAssessment } = require("../controllers/assessmentController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/create", authMiddleware, createAssessment);

module.exports = router;
