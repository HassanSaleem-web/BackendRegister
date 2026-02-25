const express = require("express");
const router = express.Router();
const { generateReport, generateDynamicInsights } = require("../controllers/reportController");
const auth = require("../middlewares/authMiddleware");

router.use(auth);
router.post("/generate", generateReport);
router.post("/insights", generateDynamicInsights);

module.exports = router;
