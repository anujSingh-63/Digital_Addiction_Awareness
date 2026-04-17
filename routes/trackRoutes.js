const express = require("express");
const router = express.Router();

router.post("/track-screen-time", (req, res) => {
  const { url, timeSpent } = req.body;

  res.sendStatus(200);
});

module.exports = router;