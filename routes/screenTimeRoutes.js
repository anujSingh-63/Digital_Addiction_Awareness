const express = require("express");
const router = express.Router();


const {trackSystemUsage}  = require("../controllers/screenTimeController");
const { protect } = require("../middleware/authMiddleware");
const {
  getTrackPage,
  addScreenTime,
  saveTrackedSession,
  getEditScreenTimePage,
  updateScreenTime,
  deleteScreenTime,
} = require("../controllers/screenTimeController");

router.get("/track-screen-time", protect, getTrackPage);
router.post("/track-screen-time", protect, addScreenTime);
router.post("/track-screen-time/session", protect, saveTrackedSession);
router.get("/track-screen-time/edit/:id", protect, getEditScreenTimePage);
router.post("/track-screen-time/update/:id", protect, updateScreenTime);
router.post("/track-screen-time/delete/:id", protect, deleteScreenTime);
router.post("/track-screen-time", trackSystemUsage);

module.exports = router;