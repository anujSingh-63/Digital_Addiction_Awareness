const express = require("express");
const router = express.Router();

const {
  getLoginPage,
  getSignupPage,
  signupUser,
  loginUser,
  logoutUser,
} = require("../controllers/authController");

router.get("/login", getLoginPage);
router.get("/signup", getSignupPage);
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);

module.exports = router;