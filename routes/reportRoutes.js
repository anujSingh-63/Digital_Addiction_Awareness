const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { 
  getWeeklyReport, 
  getDailyReport, 
  getMonthlyReport,
  downloadDailyReport,
  downloadWeeklyReport,
  downloadMonthlyReport
} = require("../controllers/reportController");

router.get("/daily-report", protect, getDailyReport);
router.get("/daily-report/download", protect, downloadDailyReport);
router.get("/weekly-report", protect, getWeeklyReport);
router.get("/weekly-report/download", protect, downloadWeeklyReport);
router.get("/monthly-report", protect, getMonthlyReport);
router.get("/monthly-report/download", protect, downloadMonthlyReport);

module.exports = router;