const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { getHomePage } = require("../controllers/dashboardController");

// Root route - redirect to dashboard if logged in, otherwise show home page
router.get("/", (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect("/dashboard");
  }
  res.redirect("/login");
});

// Dashboard route - protected, shows the main dashboard
router.get("/dashboard", protect, getHomePage);

module.exports = router;