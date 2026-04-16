const express = require("express");
const path = require("path");
const http = require("http");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { protect } = require("./middleware/authMiddleware");
const { initSocket } = require("./sockets");

dotenv.config();
connectDB();

const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");
const screenTimeRoutes = require("./routes/screenTimeRoutes");
const reportRoutes = require("./routes/reportRoutes");
const alertRoutes = require("./routes/alertRoutes");
const challengeRoutes = require("./routes/challengeRoutes");
const profileRoutes = require("./routes/profileRoutes");
const tracker = require("./tracker");
const ScreenTime = require("./models/ScreenTime");

// Global storage for system app data and website data
global.systemAppData = [];
global.websiteData = [];

const app = express();
const server = http.createServer(app);

initSocket(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.userName || null;
  next();
});

app.use("/", dashboardRoutes);
app.use("/", authRoutes);
app.use("/", screenTimeRoutes);
app.use("/", reportRoutes);
app.use("/", alertRoutes);
app.use("/", challengeRoutes);
app.use("/", profileRoutes);
app.use("/track", require("./routes/trackRoutes"));

// System App Tracking Routes (with Database Storage)
app.post("/api/system-app-data", async (req, res) => {
  const { appName, timeSpent } = req.body;
  const userId = req.session?.userId; // Extract userId from session
  
  if (!appName || !timeSpent) {
    return res.status(400).json({ error: "Missing appName or timeSpent" });
  }
  
  // Add to global storage (keep last 50 entries for real-time display)
  global.systemAppData.push({
    appName,
    timeSpent,
    timestamp: new Date()
  });
  
  if (global.systemAppData.length > 50) {
    global.systemAppData.shift();
  }
  
  // Save to database for reports (if user session exists)
  try {
    await ScreenTime.create({
      appName,
      duration: timeSpent,
      hours: timeSpent / 3600, // Convert seconds to hours
      category: "Other", // Default category for app tracking
      date: new Date(),
      trackedAt: new Date(),
      trackingType: "app",
      user: userId || null, // Use extracted userId from session
    });
  } catch (err) {
    // Error saving app data to database
  }
  res.json({ success: true });
});

app.get("/api/system-app-data", (req, res) => {
  res.json(global.systemAppData);
});

// Website Tracking Routes (from Chrome Extension - with Database Storage)
app.post("/api/website-data", async (req, res) => {
  const { website, url, timeSpent } = req.body;
  const userId = req.session?.userId; // Extract userId from session
  
  if (!website) {
    return res.status(400).json({ error: "Missing website" });
  }
  
  // Add to global storage (keep last 50 entries for real-time display)
  global.websiteData.push({
    website,
    url,
    timeSpent: timeSpent || 10,
    timestamp: new Date()
  });
  
  if (global.websiteData.length > 50) {
    global.websiteData.shift();
  }
  
  // Save to database for reports
  try {
    await ScreenTime.create({
      website,
      url,
      duration: timeSpent || 10,
      hours: (timeSpent || 10) / 3600, // Convert seconds to hours
      category: "Social Media", // Default category for website tracking
      date: new Date(),
      trackedAt: new Date(),
      trackingType: "website",
      user: userId || null, // Use extracted userId from session
    });
  } catch (err) {
    // Error saving website data to database
  }
  res.json({ success: true });
});

app.get("/api/website-data", (req, res) => {
  res.json(global.websiteData);
});

// Combined Live Tracking Data (Apps + Websites)
app.get("/api/live-tracking", (req, res) => {
  const combined = {
    apps: global.systemAppData.slice(-10),
    websites: global.websiteData.slice(-10)
  };
  res.json(combined);
});
 //app.use("/",tracker);

app.use((req, res) => {
  res.status(404).render("404");
});

process.on("SIGINT", () => {
  process.exit();
});

const PORT = process.env.PORT || 5002;

// API endpoint to get server info
app.get("/api/server-info", (req, res) => {
  res.json({
    url: `http://localhost:${PORT}`,
    port: PORT
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});