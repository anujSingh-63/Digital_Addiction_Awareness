const ScreenTime = require("../models/ScreenTime");
const User = require("../models/User");
const Alert = require("../models/Alert");
const { getIO } = require("../sockets");

const getTrackPage = async (req, res) => {
  try {
    const entries = await ScreenTime.find({ user: req.session.userId }).sort({ createdAt: -1 });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayEntries = await ScreenTime.find({
      user: req.session.userId,
      date: { $gte: startOfToday },
    });

    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const sessionCount = todayEntries.length;

    res.render("store/trackScreenTime", {
      entries,
      editEntry: null,
      error: null,
      success: null,
      userName: req.session.userName || null,
      todayTotal: Number(todayTotal.toFixed(2)),
      sessionCount,
    });
  } catch (error) {
    console.error(error);
    res.render("store/trackScreenTime", {
      entries: [],
      editEntry: null,
      error: "Could not load screen time records",
      success: null,
      userName: req.session.userName || null,
      todayTotal: 0,
      sessionCount: 0,
    });
  }
};

const addScreenTime = async (req, res) => {
  try {
    const { category, hours, notes } = req.body;

    if (!category || !hours || Number(hours) < 0 || Number(hours) > 24) {
      const entries = await ScreenTime.find({ user: req.session.userId }).sort({ createdAt: -1 });

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const todayEntries = await ScreenTime.find({
        user: req.session.userId,
        date: { $gte: startOfToday },
      });

      const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.hours, 0);

      return res.render("store/trackScreenTime", {
        entries,
        editEntry: null,
        error: "Please enter valid category and hours between 0 and 24",
        success: null,
        userName: req.session.userName || null,
        todayTotal: Number(todayTotal.toFixed(2)),
        sessionCount: todayEntries.length,
      });
    }

    await ScreenTime.create({
      user: req.session.userId,
      category,
      hours: Number(hours),
      notes: notes ? notes.trim() : "",
    });

    await handleDailyLimitAlert(req.session.userId);

    getIO().emit("screenTimeUpdated", {
      userId: req.session.userId,
      message: "Screen time updated",
    });

    const entries = await ScreenTime.find({ user: req.session.userId }).sort({ createdAt: -1 });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayEntries = await ScreenTime.find({
      user: req.session.userId,
      date: { $gte: startOfToday },
    });

    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.hours, 0);

    res.render("store/trackScreenTime", {
      entries,
      editEntry: null,
      error: null,
      success: "Screen time added successfully",
      userName: req.session.userName || null,
      todayTotal: Number(todayTotal.toFixed(2)),
      sessionCount: todayEntries.length,
    });
  } catch (error) {
    console.error(error);

    const entries = await ScreenTime.find({ user: req.session.userId }).sort({ createdAt: -1 });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayEntries = await ScreenTime.find({
      user: req.session.userId,
      date: { $gte: startOfToday },
    });

    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.hours, 0);

    res.render("store/trackScreenTime", {
      entries,
      editEntry: null,
      error: "Failed to save screen time",
      success: null,
      userName: req.session.userName || null,
      todayTotal: Number(todayTotal.toFixed(2)),
      sessionCount: todayEntries.length,
    });
  }
};

const saveTrackedSession = async (req, res) => {
  try {
    const { category, minutes, notes } = req.body;

    if (!category || minutes === undefined || Number(minutes) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid tracking session data",
      });
    }

    const hours = Number(minutes) / 60;

    if (hours <= 0 || hours > 24) {
      return res.status(400).json({
        success: false,
        message: "Tracked session duration must be between 0 and 24 hours",
      });
    }

    const entry = await ScreenTime.create({
      user: req.session.userId,
      category,
      hours: Number(hours.toFixed(2)),
      notes: notes ? notes.trim() : "Auto tracked session",
    });

    await handleDailyLimitAlert(req.session.userId);

    getIO().emit("screenTimeUpdated", {
      userId: req.session.userId,
      message: "Screen time updated",
    });

    return res.status(201).json({
      success: true,
      message: "Tracked session saved successfully",
      entry,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to save tracked session",
    });
  }
};

const getEditScreenTimePage = async (req, res) => {
  try {
    const entries = await ScreenTime.find({ user: req.session.userId }).sort({ createdAt: -1 });
    const editEntry = await ScreenTime.findOne({
      _id: req.params.id,
      user: req.session.userId,
    });

    if (!editEntry) {
      return res.redirect("/track-screen-time");
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayEntries = await ScreenTime.find({
      user: req.session.userId,
      date: { $gte: startOfToday },
    });

    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.hours, 0);

    res.render("store/trackScreenTime", {
      entries,
      editEntry,
      error: null,
      success: null,
      userName: req.session.userName || null,
      todayTotal: Number(todayTotal.toFixed(2)),
      sessionCount: todayEntries.length,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/track-screen-time");
  }
};

const updateScreenTime = async (req, res) => {
  try {
    const { category, hours, notes } = req.body;

    if (!category || !hours || Number(hours) < 0 || Number(hours) > 24) {
      const entries = await ScreenTime.find({ user: req.session.userId }).sort({ createdAt: -1 });
      const editEntry = await ScreenTime.findOne({
        _id: req.params.id,
        user: req.session.userId,
      });

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const todayEntries = await ScreenTime.find({
        user: req.session.userId,
        date: { $gte: startOfToday },
      });

      const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.hours, 0);

      return res.render("store/trackScreenTime", {
        entries,
        editEntry,
        error: "Please enter valid category and hours between 0 and 24",
        success: null,
        userName: req.session.userName || null,
        todayTotal: Number(todayTotal.toFixed(2)),
        sessionCount: todayEntries.length,
      });
    }

    const updatedEntry = await ScreenTime.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      {
        category,
        hours: Number(hours),
        notes: notes ? notes.trim() : "",
      },
      { new: true }
    );

    if (!updatedEntry) {
      return res.redirect("/track-screen-time");
    }

    await handleDailyLimitAlert(req.session.userId);

    getIO().emit("screenTimeUpdated", {
      userId: req.session.userId,
      message: "Screen time updated",
    });

    res.redirect("/track-screen-time");
  } catch (error) {
    console.error(error);
    res.redirect("/track-screen-time");
  }
};

const deleteScreenTime = async (req, res) => {
  try {
    await ScreenTime.findOneAndDelete({
      _id: req.params.id,
      user: req.session.userId,
    });

    getIO().emit("screenTimeUpdated", {
      userId: req.session.userId,
      message: "Screen time updated",
    });

    res.redirect("/track-screen-time");
  } catch (error) {
    console.error(error);
    res.redirect("/track-screen-time");
  }
};

const handleDailyLimitAlert = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayEntries = await ScreenTime.find({
    user: userId,
    date: { $gte: startOfToday },
  });

  const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const warningThreshold = user.dailyLimit * 0.8;

  if (todayTotal >= warningThreshold && todayTotal <= user.dailyLimit) {
    const existingWarning = await Alert.findOne({
      user: userId,
      message: `You are close to your daily limit of ${user.dailyLimit} hours.`,
      createdAt: { $gte: startOfToday },
    });

    if (!existingWarning) {
      await Alert.create({
        user: userId,
        message: `You are close to your daily limit of ${user.dailyLimit} hours.`,
        type: "warning",
      });
    }
  }

  if (todayTotal > user.dailyLimit) {
    const existingDanger = await Alert.findOne({
      user: userId,
      message: `You have crossed your daily limit of ${user.dailyLimit} hours.`,
      createdAt: { $gte: startOfToday },
    });

    if (!existingDanger) {
      await Alert.create({
        user: userId,
        message: `You have crossed your daily limit of ${user.dailyLimit} hours.`,
        type: "danger",
      });
    }
  }
};

module.exports = {
  getTrackPage,
  addScreenTime,
  saveTrackedSession,
  getEditScreenTimePage,
  updateScreenTime,
  deleteScreenTime,
};