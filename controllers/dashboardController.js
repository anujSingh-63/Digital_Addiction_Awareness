const ScreenTime = require("../models/ScreenTime");

const getHomePage = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.render("store/homePage", {
        userName: null,
        todayTotal: 0,
        totalEntries: 0,
        recentEntries: [],
        chartLabels: [],
        chartData: [],
      });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayEntries = await ScreenTime.find({
      user: req.session.userId,
      date: { $gte: startOfToday },
    });

    const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.hours, 0);

    const totalEntries = await ScreenTime.countDocuments({
      user: req.session.userId,
    });

    const recentEntries = await ScreenTime.find({
      user: req.session.userId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const categoryTotals = {
      "Social Media": 0,
      Entertainment: 0,
      Study: 0,
      Gaming: 0,
      Other: 0,
    };

    recentEntries.forEach((entry) => {
      if (categoryTotals[entry.category] !== undefined) {
        categoryTotals[entry.category] += entry.hours;
      }
    });

    res.render("store/homePage", {
      userName: req.session.userName || null,
      todayTotal,
      totalEntries,
      recentEntries,
      chartLabels: Object.keys(categoryTotals),
      chartData: Object.values(categoryTotals),
    });
  } catch (error) {
    console.error(error);
    res.render("store/homePage", {
      userName: req.session.userName || null,
      todayTotal: 0,
      totalEntries: 0,
      recentEntries: [],
      chartLabels: [],
      chartData: [],
    });
  }
};

module.exports = { getHomePage };