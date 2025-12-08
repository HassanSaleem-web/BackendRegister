const express = require("express");
const router = express.Router();
const { generateReport } = require("../controllers/reportController");
const auth = require("../middlewares/authMiddleware");
router.use(auth);
router.post("/generate", generateReport);

module.exports = router;
