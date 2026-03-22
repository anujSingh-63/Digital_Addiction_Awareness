const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  getProfilePage,
  updateProfile,
  updatePassword,
} = require("../controllers/profileController");

router.get("/profile-settings", protect, getProfilePage);
router.post("/profile-settings/update", protect, updateProfile);
router.post("/profile-settings/password", protect, updatePassword);

module.exports = router;