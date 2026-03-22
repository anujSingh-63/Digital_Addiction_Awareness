const bcrypt = require("bcryptjs");
const User = require("../models/User");

const getProfilePage = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select("-password");

    if (!user) {
      return res.redirect("/login");
    }

    res.render("store/profileSettings", {
      user,
      userName: req.session.userName || null,
      error: null,
      success: null,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/");
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, dailyLimit } = req.body;

    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.redirect("/login");
    }

    const trimmedName = name ? name.trim() : "";

    if (!trimmedName) {
      return res.render("store/profileSettings", {
        user,
        userName: req.session.userName || null,
        error: "Name is required",
        success: null,
      });
    }

    if (!dailyLimit || Number(dailyLimit) < 1 || Number(dailyLimit) > 24) {
      return res.render("store/profileSettings", {
        user,
        userName: req.session.userName || null,
        error: "Daily limit must be between 1 and 24 hours",
        success: null,
      });
    }

    user.name = trimmedName;
    user.dailyLimit = Number(dailyLimit);
    await user.save();

    req.session.userName = user.name;

    res.render("store/profileSettings", {
      user,
      userName: req.session.userName || null,
      error: null,
      success: "Profile updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.redirect("/profile-settings");
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.redirect("/login");
    }

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.render("store/profileSettings", {
        user,
        userName: req.session.userName || null,
        error: "All password fields are required",
        success: null,
      });
    }

    if (newPassword.length < 6) {
      return res.render("store/profileSettings", {
        user,
        userName: req.session.userName || null,
        error: "New password must be at least 6 characters long",
        success: null,
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.render("store/profileSettings", {
        user,
        userName: req.session.userName || null,
        error: "New passwords do not match",
        success: null,
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.render("store/profileSettings", {
        user,
        userName: req.session.userName || null,
        error: "Current password is incorrect",
        success: null,
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.render("store/profileSettings", {
      user,
      userName: req.session.userName || null,
      error: null,
      success: "Password updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.redirect("/profile-settings");
  }
};

module.exports = {
  getProfilePage,
  updateProfile,
  updatePassword,
};