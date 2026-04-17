const mongoose = require("mongoose");

const screenTimeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Social Media", "Entertainment", "Study", "Gaming", "Other"],
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      default: "",
    },
    domain: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    url: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      enum: ["manual", "live-session", "extension"],
      default: "manual",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    // New fields for live tracking
    appName: {
      type: String,
      default: null,
    },
    website: {
      type: String,
      default: null,
    },
    url: {
      type: String,
      default: null,
    },
    trackedAt: {
      type: Date,
      default: Date.now,
    },
    trackingType: {
      type: String,
      enum: ["manual", "app", "website", "session"],
      default: "manual",
    },
    duration: {
      // Duration in seconds
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for faster queries
screenTimeSchema.index({ user: 1, date: 1 });
screenTimeSchema.index({ user: 1, trackedAt: 1 });
screenTimeSchema.index({ user: 1, trackingType: 1 });

module.exports = mongoose.model("ScreenTime", screenTimeSchema);