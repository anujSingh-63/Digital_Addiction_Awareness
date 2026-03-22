const bcrypt = require("bcryptjs");
const User = require("../models/User");

const getLoginPage = (req, res) => {
  res.render("auth/login", { error: null });
};

const getSignupPage = (req, res) => {
  res.render("auth/signup", { error: null });
};

const signupUser = async (req, res) => {
  try {
    let { firstName, lastName, email, password, confirmPassword } = req.body;

    firstName = firstName?.trim();
    lastName = lastName?.trim();
    email = email?.trim().toLowerCase();

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.render("auth/signup", { error: "All fields are required" });
    }

    if (password.length < 6) {
      return res.render("auth/signup", { error: "Password must be at least 6 characters long" });
    }

    if (password !== confirmPassword) {
      return res.render("auth/signup", { error: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("auth/signup", { error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`;

    const user = await User.create({
      name: fullName,
      email,
      password: hashedPassword,
    });

    req.session.userId = user._id;
    req.session.userName = user.name;

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.render("auth/signup", { error: "Signup failed" });
  }
};

const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email?.trim().toLowerCase();

    if (!email || !password) {
      return res.render("auth/login", { error: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("auth/login", { error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("auth/login", { error: "Invalid email or password" });
    }

    req.session.userId = user._id;
    req.session.userName = user.name;

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.render("auth/login", { error: "Login failed" });
  }
};

const logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};

module.exports = {
  getLoginPage,
  getSignupPage,
  signupUser,
  loginUser,
  logoutUser,
};