const ScreenTime = require("../models/ScreenTime");
const User = require("../models/User");

const getWeeklyReport = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weeklyEntries = await ScreenTime.find({
      user: req.session.userId,
      date: { $gte: sevenDaysAgo },
    }).sort({ date: 1 });

    const weeklyTotal = weeklyEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const averageDailyUsage = weeklyTotal / 7;

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

    let topCategory = "No data";
    let maxHours = 0;

    Object.entries(categoryTotals).forEach(([category, hours]) => {
      if (hours > maxHours) {
        maxHours = hours;
        topCategory = category;
      }
    });

    const dailyMap = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);
      dailyMap[date.toDateString()] = 0;
    }

    weeklyEntries.forEach((entry) => {
      const key = new Date(entry.date).toDateString();
      if (dailyMap[key] !== undefined) {
        dailyMap[key] += entry.hours;
      }
    });

    const dailyLabels = Object.keys(dailyMap).map((dateStr) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { weekday: "short" });
    });

    const dailyData = Object.values(dailyMap).map((value) =>
      Number(value.toFixed(2))
    );

    let highestUsageDay = "No data";
    let highestUsageValue = 0;
    let lowestUsageDay = "No data";
    let lowestUsageValue = Number.MAX_SAFE_INTEGER;

    Object.entries(dailyMap).forEach(([dateStr, value]) => {
      if (value > highestUsageValue) {
        highestUsageValue = value;
        highestUsageDay = new Date(dateStr).toLocaleDateString("en-US", {
          weekday: "long",
        });
      }

      if (value < lowestUsageValue) {
        lowestUsageValue = value;
        lowestUsageDay = new Date(dateStr).toLocaleDateString("en-US", {
          weekday: "long",
        });
      }
    });

    const usageTrend =
      averageDailyUsage <= user.warningLimit
        ? "Improving"
        : averageDailyUsage < user.dangerLimit
        ? "Moderate"
        : "Needs Attention";

    res.render("store/weeklyReport", {
      userName: req.session.userName || null,
      weeklyTotal: Number(weeklyTotal.toFixed(2)),
      averageDailyUsage: Number(averageDailyUsage.toFixed(2)),
      categoryTotals,
      topCategory,
      weeklyEntries,
      dailyLabels,
      dailyData,
      highestUsageDay,
      lowestUsageDay,
      usageTrend,
      warningLimit: user.warningLimit,
      dangerLimit: user.dangerLimit,
    });
  } catch (error) {
    console.error(error);
    res.render("store/weeklyReport", {
      userName: req.session.userName || null,
      weeklyTotal: 0,
      averageDailyUsage: 0,
      categoryTotals: {
        "Social Media": 0,
        Entertainment: 0,
        Study: 0,
        Gaming: 0,
        Other: 0,
      },
      topCategory: "No data",
      weeklyEntries: [],
      dailyLabels: [],
      dailyData: [],
      highestUsageDay: "No data",
      lowestUsageDay: "No data",
      usageTrend: "No data",
      warningLimit: 0,
      dangerLimit: 0,
    });
  }
};

// Get Daily Report
const getDailyReport = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.render("store/dailyReport", {
        error: "User not found",
        categoryTotals: {},
        totalHours: 0,
        timeLeft: 0,
        records: [],
        userName: req.session.userName || null,
        topCategory: "No data",
        dailyLimit: 0,
        warningLimit: 0,
        dangerLimit: 0,
      });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const records = await ScreenTime.find({
      user: userId,
      date: { $gte: startOfToday, $lt: endOfToday },
    }).sort({ createdAt: -1 });

    const categoryTotals = {
      "Social Media": 0,
      Entertainment: 0,
      Study: 0,
      Gaming: 0,
      Other: 0,
    };

    records.forEach((record) => {
      if (categoryTotals[record.category] !== undefined) {
        categoryTotals[record.category] += record.hours;
      }
    });

    const totalHours = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const timeLeft = Math.max(user.dailyLimit - totalHours, 0);

    let topCategory = "No data";
    let maxHours = 0;
    Object.entries(categoryTotals).forEach(([category, hours]) => {
      if (hours > maxHours) {
        maxHours = hours;
        topCategory = category;
      }
    });

    res.render("store/dailyReport", {
      categoryTotals,
      topCategory,
      totalHours: Number(totalHours.toFixed(2)),
      timeLeft: Number(timeLeft.toFixed(2)),
      records,
      userName: req.session.userName || null,
      userId: userId,
      dailyLimit: user.dailyLimit,
      warningLimit: user.warningLimit,
      dangerLimit: user.dangerLimit,
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.render("store/dailyReport", {
      error: "Could not load daily report: " + error.message,
      categoryTotals: {},
      totalHours: 0,
      timeLeft: 0,
      records: [],
      userName: req.session.userName || null,
      topCategory: "No data",
      dailyLimit: 0,
      warningLimit: 0,
      dangerLimit: 0,
    });
  }
};

// Get Monthly Report
const getMonthlyReport = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.render("store/monthlyReport", {
        error: "User not found",
        weeklyData: [],
        monthlyTotals: {},
        totalHours: 0,
        averageDaily: 0,
        monthName: "",
        records: [],
        userName: req.session.userName || null,
        topCategory: "No data",
      });
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 1);

    const records = await ScreenTime.find({
      user: userId,
      date: { $gte: startOfMonth, $lt: endOfMonth },
    }).sort({ createdAt: -1 });

    // Weekly data
    const weeklyData = {};
    for (let i = 0; i < 5; i++) {
      weeklyData[`Week ${i + 1}`] = {
        "Social Media": 0,
        Entertainment: 0,
        Study: 0,
        Gaming: 0,
        Other: 0,
        total: 0,
      };
    }

    records.forEach((record) => {
      const dayOfMonth = new Date(record.date).getDate();
      const weekNum = Math.ceil(dayOfMonth / 7);
      const weekKey = `Week ${weekNum}`;

      if (weeklyData[weekKey] && record.category) {
        weeklyData[weekKey][record.category] += record.hours;
        weeklyData[weekKey].total += record.hours;
      }
    });

    const monthlyTotals = {
      "Social Media": 0,
      Entertainment: 0,
      Study: 0,
      Gaming: 0,
      Other: 0,
    };

    Object.values(weeklyData).forEach((week) => {
      Object.keys(monthlyTotals).forEach((category) => {
        monthlyTotals[category] += week[category];
      });
    });

    const totalHours = Object.values(monthlyTotals).reduce((a, b) => a + b, 0);
    const daysInMonth = endOfMonth.getDate() - startOfMonth.getDate();
    const averageDaily = Number((totalHours / daysInMonth).toFixed(2));

    let topCategory = "No data";
    let maxHours = 0;
    Object.entries(monthlyTotals).forEach(([category, hours]) => {
      if (hours > maxHours) {
        maxHours = hours;
        topCategory = category;
      }
    });

    const monthName = startOfMonth.toLocaleString("default", { month: "long", year: "numeric" });

    res.render("store/monthlyReport", {
      weeklyData: Object.entries(weeklyData),
      monthlyTotals,
      topCategory,
      totalHours: Number(totalHours.toFixed(2)),
      averageDaily,
      monthName,
      records,
      userName: req.session.userName || null,
      userId: userId,
      dailyLimit: user.dailyLimit,
      warningLimit: user.warningLimit,
      dangerLimit: user.dangerLimit,
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.render("store/monthlyReport", {
      error: "Could not load monthly report: " + error.message,
      weeklyData: [],
      monthlyTotals: {},
      totalHours: 0,
      averageDaily: 0,
      monthName: "",
      records: [],
      userName: req.session.userName || null,
      topCategory: "No data",
    });
  }
};

// Download Daily Report
const downloadDailyReport = async (req, res) => {
  try {
    const userId = req.session.userId;
    const format = req.query.format || "pdf";
    const user = await User.findById(userId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const records = await ScreenTime.find({
      user: userId,
      date: { $gte: startOfToday, $lt: endOfToday },
    }).sort({ createdAt: -1 });

    const categoryTotals = {
      "Social Media": 0,
      Entertainment: 0,
      Study: 0,
      Gaming: 0,
      Other: 0,
    };

    records.forEach((record) => {
      if (categoryTotals[record.category] !== undefined) {
        categoryTotals[record.category] += record.hours;
      }
    });

    const totalHours = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const timeLeft = Math.max(user.dailyLimit - totalHours, 0);

    if (format === "csv") {
      return downloadDailyReportCSV(res, records, categoryTotals, totalHours, timeLeft);
    } else {
      return downloadDailyReportPDF(res, records, categoryTotals, totalHours, timeLeft);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to download report" });
  }
};

// Download Weekly Report
const downloadWeeklyReport = async (req, res) => {
  try {
    const userId = req.session.userId;
    const format = req.query.format || "pdf";
    const user = await User.findById(userId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weeklyEntries = await ScreenTime.find({
      user: userId,
      date: { $gte: sevenDaysAgo },
    }).sort({ date: 1 });

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

    const weeklyTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const averageDailyUsage = weeklyTotal / 7;

    if (format === "csv") {
      return downloadWeeklyReportCSV(res, weeklyEntries, categoryTotals, weeklyTotal, averageDailyUsage);
    } else {
      return downloadWeeklyReportPDF(res, weeklyEntries, categoryTotals, weeklyTotal, averageDailyUsage);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to download report" });
  }
};

// Download Monthly Report
const downloadMonthlyReport = async (req, res) => {
  try {
    const userId = req.session.userId;
    const format = req.query.format || "pdf";
    const user = await User.findById(userId);

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 1);

    const records = await ScreenTime.find({
      user: userId,
      date: { $gte: startOfMonth, $lt: endOfMonth },
    }).sort({ createdAt: -1 });

    const monthlyTotals = {
      "Social Media": 0,
      Entertainment: 0,
      Study: 0,
      Gaming: 0,
      Other: 0,
    };

    records.forEach((record) => {
      if (monthlyTotals[record.category] !== undefined) {
        monthlyTotals[record.category] += record.hours;
      }
    });

    const totalHours = Object.values(monthlyTotals).reduce((a, b) => a + b, 0);
    const daysInMonth = endOfMonth.getDate() - startOfMonth.getDate();
    const averageDaily = totalHours / daysInMonth;

    if (format === "csv") {
      return downloadMonthlyReportCSV(res, records, monthlyTotals, totalHours, averageDaily);
    } else {
      return downloadMonthlyReportPDF(res, records, monthlyTotals, totalHours, averageDaily);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to download report" });
  }
};

// CSV Download Functions
const downloadDailyReportCSV = (res, records, categoryTotals, totalHours, timeLeft) => {
  let csv = "Daily Activity Report\n";
  csv += new Date().toLocaleDateString() + "\n\n";
  csv += "Category Totals\n";
  csv += "Category,Hours\n";
  Object.entries(categoryTotals).forEach(([cat, hours]) => {
    csv += `${cat},${hours.toFixed(2)}\n`;
  });
  csv += `\nTotal,${totalHours.toFixed(2)}\n`;
  csv += `Time Left,${timeLeft.toFixed(2)}\n\n`;
  csv += "Records\n";
  csv += "Category,Hours,Notes,Time\n";
  records.forEach((r) => {
    csv += `${r.category},${r.hours},"${r.notes || ""}",${new Date(r.createdAt).toLocaleTimeString()}\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="daily-report-${new Date().toISOString().split("T")[0]}.csv"`);
  res.send(csv);
};

const downloadWeeklyReportCSV = (res, records, categoryTotals, weeklyTotal, averageDaily) => {
  let csv = "Weekly Activity Report\n";
  csv += `Last 7 days (${new Date(new Date().setDate(new Date().getDate() - 6)).toLocaleDateString()} - ${new Date().toLocaleDateString()})\n\n`;
  csv += "Category Totals\n";
  csv += "Category,Hours\n";
  Object.entries(categoryTotals).forEach(([cat, hours]) => {
    csv += `${cat},${hours.toFixed(2)}\n`;
  });
  csv += `\nWeekly Total,${weeklyTotal.toFixed(2)}\n`;
  csv += `Average Daily,${averageDaily.toFixed(2)}\n\n`;
  csv += "Records\n";
  csv += "Category,Hours,Date,Notes\n";
  records.forEach((r) => {
    csv += `${r.category},${r.hours},${new Date(r.date).toLocaleDateString()},"${r.notes || ""}"\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="weekly-report-${new Date().toISOString().split("T")[0]}.csv"`);
  res.send(csv);
};

const downloadMonthlyReportCSV = (res, records, monthlyTotals, totalHours, averageDaily) => {
  let csv = "Monthly Activity Report\n";
  csv += new Date().toLocaleDateString("default", { month: "long", year: "numeric" }) + "\n\n";
  csv += "Category Totals\n";
  csv += "Category,Hours\n";
  Object.entries(monthlyTotals).forEach(([cat, hours]) => {
    csv += `${cat},${hours.toFixed(2)}\n`;
  });
  csv += `\nMonthly Total,${totalHours.toFixed(2)}\n`;
  csv += `Average Daily,${averageDaily.toFixed(2)}\n\n`;
  csv += "Records\n";
  csv += "Category,Hours,Date,Notes\n";
  records.forEach((r) => {
    csv += `${r.category},${r.hours},${new Date(r.date).toLocaleDateString()},"${r.notes || ""}"\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="monthly-report-${new Date().toISOString().split("T")[0]}.csv"`);
  res.send(csv);
};

// PDF Download Functions
const downloadDailyReportPDF = (res, records, categoryTotals, totalHours, timeLeft) => {
  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="daily-report-${new Date().toISOString().split("T")[0]}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).font("Helvetica-Bold").text("Daily Activity Report", 100, 50);
  doc.fontSize(12).font("Helvetica").text(new Date().toLocaleDateString(), 100, 80);

  doc.fontSize(14).font("Helvetica-Bold").text("Category Summary", 100, 120);
  let yPosition = 150;
  Object.entries(categoryTotals).forEach(([cat, hours]) => {
    doc.fontSize(11).text(`${cat}: ${hours.toFixed(2)} hrs`, 120, yPosition);
    yPosition += 20;
  });

  yPosition += 10;
  doc.fontSize(12).font("Helvetica-Bold").text(`Total Usage: ${totalHours.toFixed(2)} hrs`, 120, yPosition);
  yPosition += 20;
  doc.text(`Time Left: ${timeLeft.toFixed(2)} hrs`, 120, yPosition);

  if (records && records.length > 0) {
    yPosition += 40;
    doc.fontSize(14).font("Helvetica-Bold").text("Detailed Records", 100, yPosition);
    yPosition += 30;

    records.forEach((record) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      doc.fontSize(10).font("Helvetica");
      doc.text(`Category: ${record.category} | Hours: ${record.hours} | Time: ${new Date(record.createdAt).toLocaleTimeString()}`, 120, yPosition);
      if (record.notes) {
        doc.text(`Notes: ${record.notes}`, 120, yPosition + 15);
        yPosition += 35;
      } else {
        yPosition += 20;
      }
    });
  }

  doc.end();
};

const downloadWeeklyReportPDF = (res, records, categoryTotals, weeklyTotal, averageDaily) => {
  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="weekly-report-${new Date().toISOString().split("T")[0]}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).font("Helvetica-Bold").text("Weekly Activity Report", 100, 50);
  doc.fontSize(12).font("Helvetica").text(`Last 7 days`, 100, 80);

  doc.fontSize(14).font("Helvetica-Bold").text("Category Summary", 100, 120);
  let yPosition = 150;
  Object.entries(categoryTotals).forEach(([cat, hours]) => {
    doc.fontSize(11).text(`${cat}: ${hours.toFixed(2)} hrs`, 120, yPosition);
    yPosition += 20;
  });

  yPosition += 10;
  doc.fontSize(12).font("Helvetica-Bold").text(`Weekly Total: ${weeklyTotal.toFixed(2)} hrs`, 120, yPosition);
  yPosition += 20;
  doc.text(`Average Daily: ${averageDaily.toFixed(2)} hrs`, 120, yPosition);

  if (records && records.length > 0) {
    yPosition += 40;
    doc.fontSize(14).font("Helvetica-Bold").text("Detailed Records", 100, yPosition);
    yPosition += 30;

    records.forEach((record) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      doc.fontSize(10).font("Helvetica");
      doc.text(`${record.category} | ${record.hours} hrs | ${new Date(record.date).toLocaleDateString()}`, 120, yPosition);
      yPosition += 15;
    });
  }

  doc.end();
};

const downloadMonthlyReportPDF = (res, records, monthlyTotals, totalHours, averageDaily) => {
  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="monthly-report-${new Date().toISOString().split("T")[0]}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).font("Helvetica-Bold").text("Monthly Activity Report", 100, 50);
  doc.fontSize(12).font("Helvetica").text(new Date().toLocaleDateString("default", { month: "long", year: "numeric" }), 100, 80);

  doc.fontSize(14).font("Helvetica-Bold").text("Category Summary", 100, 120);
  let yPosition = 150;
  Object.entries(monthlyTotals).forEach(([cat, hours]) => {
    doc.fontSize(11).text(`${cat}: ${hours.toFixed(2)} hrs`, 120, yPosition);
    yPosition += 20;
  });

  yPosition += 10;
  doc.fontSize(12).font("Helvetica-Bold").text(`Monthly Total: ${totalHours.toFixed(2)} hrs`, 120, yPosition);
  yPosition += 20;
  doc.text(`Average Daily: ${averageDaily.toFixed(2)} hrs`, 120, yPosition);

  if (records && records.length > 0) {
    yPosition += 40;
    doc.fontSize(14).font("Helvetica-Bold").text("Detailed Records", 100, yPosition);
    yPosition += 30;

    records.forEach((record) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      doc.fontSize(10).font("Helvetica");
      doc.text(`${record.category} | ${record.hours} hrs | ${new Date(record.date).toLocaleDateString()}`, 120, yPosition);
      yPosition += 15;
    });
  }

  doc.end();
};

module.exports = { 
  getWeeklyReport, 
  getDailyReport, 
  getMonthlyReport,
  downloadDailyReport,
  downloadWeeklyReport,
  downloadMonthlyReport
};