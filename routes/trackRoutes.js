const express = require("express");
const router = express.Router();

router.post("/track-screen-time", (req, res) => {
  const { url, timeSpent } = req.body;

  console.log(" Website Data:");
  console.log("URL:", url);
  console.log("Time Spent:", timeSpent, "seconds");
  console.log("User:", userId);
  console.log("-----------------------------");

  console.log("Website Data:", url, timeSpent);

  res.sendStatus(200);
});

module.exports = router;