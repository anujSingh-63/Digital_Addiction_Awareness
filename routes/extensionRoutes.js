const express = require("express");
const router = express.Router();
const { saveExtensionData } = require("../controllers/extensionController");

router.post("/extension/track", saveExtensionData);

module.exports = router;