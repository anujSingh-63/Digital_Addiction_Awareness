const Alert = require("../models/Alert");

const getAlertsPage = async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.session.userId }).sort({ createdAt: -1 });

    const unreadCount = alerts.filter(alert => !alert.isRead).length;
    const dangerCount = alerts.filter(alert => alert.type === "danger").length;
    const warningCount = alerts.filter(alert => alert.type === "warning").length;
    const infoCount = alerts.filter(alert => alert.type === "info").length;

    res.render("store/smartAlerts", {
      userName: req.session.userName || null,
      alerts,
      unreadCount,
      totalCount: alerts.length,
      dangerCount,
      warningCount,
      infoCount,
    });
  } catch (error) {
    console.error(error);
    res.render("store/smartAlerts", {
      userName: req.session.userName || null,
      alerts: [],
      unreadCount: 0,
      totalCount: 0,
      dangerCount: 0,
      warningCount: 0,
      infoCount: 0,
    });
  }
};

const markAlertAsRead = async (req, res) => {
  try {
    await Alert.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      { isRead: true }
    );

    res.redirect("/smart-alerts");
  } catch (error) {
    console.error(error);
    res.redirect("/smart-alerts");
  }
};

const markAllAlertsAsRead = async (req, res) => {
  try {
    await Alert.updateMany(
      { user: req.session.userId, isRead: false },
      { isRead: true }
    );

    res.redirect("/smart-alerts");
  } catch (error) {
    console.error(error);
    res.redirect("/smart-alerts");
  }
};

module.exports = {
  getAlertsPage,
  markAlertAsRead,
  markAllAlertsAsRead,
};