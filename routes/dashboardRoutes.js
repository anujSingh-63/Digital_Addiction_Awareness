const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { getHomePage } = require("../controllers/dashboardController");

router.get("/dashboard", protect, getHomePage);

module.exports = router;
console.log("dashboardRoutes loaded");