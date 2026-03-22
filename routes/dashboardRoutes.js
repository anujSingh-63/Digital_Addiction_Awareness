const express = require("express");
const router = express.Router();
const { getHomePage } = require("../controllers/dashboardController");

router.get("/", getHomePage);

module.exports = router;