const ScreenTime = require("../models/ScreenTime");

const saveExtensionData = async (req, res) => {
  try {
    const { category, minutes } = req.body;

    if (!category || !minutes) {
      return res.status(400).json({ success: false });
    }

    const hours = minutes / 60;

    await ScreenTime.create({
      user: null, // later we can link user
      category,
      hours: Number(hours.toFixed(2)),
      notes: "Extension tracked"
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

module.exports = { saveExtensionData };