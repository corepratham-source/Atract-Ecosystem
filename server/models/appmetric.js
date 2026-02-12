const mongoose = require("mongoose");

const appMetricSchema = new mongoose.Schema({
  appName: {
    type: String,
    required: true
  },
  users7d: {
    type: Number,
    default: 0
  },
  users30d: {
    type: Number,
    default: 0
  },
  revenue30d: {
    type: Number,
    default: 0
  },
  retention: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  cost: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["Build", "Live", "Pause", "Kill", "Scale"],
    default: "Build"
  },
  decision: {
    type: String,
    enum: ["Scale", "Watch", "Kill"],
    required: true
  },
  owner: {
    type: String,
    default: ""
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("AppMetric", appMetricSchema, "apps_metrics");
