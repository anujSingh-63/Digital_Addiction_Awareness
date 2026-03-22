const ScreenTime = require("../models/ScreenTime");

const getWeeklyReport = async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfWeek = new Date(now);
    const day = now.getDay(); // 0 = Sunday
    firstDayOfWeek.setDate(now.getDate() - day);
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const weeklyEntries = await ScreenTime.find({
      user: req.session.userId,
      date: { $gte: firstDayOfWeek },
    }).sort({ date: -1 });

    const weeklyTotal = weeklyEntries.reduce((sum, entry) => sum + entry.hours, 0);

    const categoryTotals = {
      "Social Media": 0,
      Entertainment: 0,
      Study: 0,
      Gaming: 0,
      Other: 0,
    };

    weeklyEntries.forEach((entry) => {
      if (categoryTotals[entry.category] !== undefined) {
        categoryTotals[entry.category] += entry.hours;
      }
    });

    let topCategory = "None";
    let maxHours = 0;

    for (const category in categoryTotals) {
      if (categoryTotals[category] > maxHours) {
        maxHours = categoryTotals[category];
        topCategory = category;
      }
    }

    res.render("store/weeklyReport", {
      userName: req.session.userName || null,
      weeklyTotal,
      categoryTotals,
      topCategory,
      weeklyEntries,
    });
  } catch (error) {
    console.error(error);
    res.render("store/weeklyReport", {
      userName: req.session.userName || null,
      weeklyTotal: 0,
      categoryTotals: {
        "Social Media": 0,
        Entertainment: 0,
        Study: 0,
        Gaming: 0,
        Other: 0,
      },
      topCategory: "None",
      weeklyEntries: [],
    });
  }
};

module.exports = { getWeeklyReport };