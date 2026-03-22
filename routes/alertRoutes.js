const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  getAlertsPage,
  markAlertAsRead,
  markAllAlertsAsRead,
} = require("../controllers/alertController");

router.get("/smart-alerts", protect, getAlertsPage);
router.post("/smart-alerts/read/:id", protect, markAlertAsRead);
router.post("/smart-alerts/read-all", protect, markAllAlertsAsRead);

module.exports = router;