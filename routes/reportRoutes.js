const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getWeeklyReport } = require("../controllers/reportController");

router.get("/weekly-report", protect, getWeeklyReport);

module.exports = router;