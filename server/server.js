// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const AppMetric = require("./models/appmetric");
const analysisRoutes = require("./routes/analysisRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const exitInterviewRoutes = require("./routes/exitInterviewRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const offerLetterRoutes = require("./routes/offerLetterRoutes");
const performanceReviewRoutes = require("./routes/performanceReviewRoutes");
const policyBuilderRoutes = require("./routes/policyBuilderRoutes");
const resumeFormatterRoutes = require("./routes/resumeFormatterRoutes");
const salaryBenchmarkRoutes = require("./routes/salaryBenchmarkRoutes");
const resumeRoutes = require("./routes/resumeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Flag to track MongoDB connection status
let isMongoConnected = false;

// MongoDB connection options with better error handling
const mongoOptions = {
  serverSelectionTimeoutMS: 10000, // Timeout after 10s
  socketTimeoutMS: 45000, // Socket timeout
  maxPoolSize: 10,
  retryWrites: true,
};

// Try to connect to MongoDB
mongoose.connect(process.env.MONGO_URI, mongoOptions)
  .then(() => {
    console.log("MongoDB connected successfully");
    isMongoConnected = true;
  })
  .catch(err => {
    console.warn("MongoDB connection failed - running in demo mode without database");
    console.warn("To enable database, check your MongoDB Atlas IP whitelist or connection string");
    isMongoConnected = false;
  });

// In-memory fallback when MongoDB unavailable (dynamic, works without DB)
const memoryStore = [];
let memoryIdCounter = 1;

function sanitizeApp(body) {
  return {
    appName: String(body.appName || "").trim() || "Untitled",
    users7d: Number(body.users7d) || 0,
    users30d: Number(body.users30d) || 0,
    revenue30d: Number(body.revenue30d) || 0,
    retention: Math.min(100, Math.max(0, Number(body.retention) || 0)),
    cost: Number(body.cost) || 0,
    status: ["Build", "Live", "Pause", "Kill", "Scale"].includes(body.status) ? body.status : "Build",
    decision: ["Scale", "Watch", "Kill"].includes(body.decision) ? body.decision : "Watch",
    owner: String(body.owner || "").trim(),
  };
}

// GET all apps
app.get("/apps", async (req, res) => {
  try {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const apps = await AppMetric.find();
      return res.json(apps);
    }
  } catch (err) {
    console.warn("MongoDB GET error, using memory store:", err.message);
  }
  res.json(memoryStore.length ? memoryStore : []);
});

// CREATE new app metric
app.post("/apps", async (req, res) => {
  if (!req.body.appName || !req.body.appName.trim()) {
    return res.status(400).json({ error: "App name is required" });
  }
  const payload = sanitizeApp(req.body);
  try {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const appData = new AppMetric({ ...payload, lastUpdated: new Date() });
      await appData.save();
      return res.status(201).json(appData);
    }
  } catch (err) {
    console.warn("MongoDB POST error, using memory store:", err.message);
  }
  const newItem = {
    _id: `mem_${memoryIdCounter++}`,
    ...payload,
    lastUpdated: new Date(),
  };
  memoryStore.push(newItem);
  res.status(201).json(newItem);
});

// UPDATE app metric
app.put("/apps/:id", async (req, res) => {
  const id = req.params.id;
  const payload = sanitizeApp(req.body);
  try {
    if (isMongoConnected && mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
      const updated = await AppMetric.findByIdAndUpdate(id, { ...payload, lastUpdated: new Date() }, { new: true, runValidators: true });
      if (updated) return res.json(updated);
    }
  } catch (err) {
    console.warn("MongoDB PUT error, using memory store:", err.message);
  }
  const idx = memoryStore.findIndex((a) => String(a._id) === String(id));
  if (idx >= 0) {
    memoryStore[idx] = { ...memoryStore[idx], ...payload, lastUpdated: new Date() };
    return res.json(memoryStore[idx]);
  }
  res.status(404).json({ error: "App not found" });
});

// DELETE app metric
app.delete("/apps/:id", async (req, res) => {
  const id = req.params.id;
  try {
    if (isMongoConnected && mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
      const deleted = await AppMetric.findByIdAndDelete(id);
      if (deleted) return res.json({ message: "App deleted successfully" });
    }
  } catch (err) {
    console.warn("MongoDB DELETE error, using memory store:", err.message);
  }
  const idx = memoryStore.findIndex((a) => String(a._id) === String(id));
  if (idx >= 0) {
    memoryStore.splice(idx, 1);
    return res.json({ message: "App deleted successfully" });
  }
  res.status(404).json({ error: "App not found" });
});

// API Routes
app.use("/api/analysis", analysisRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/exit-interview", exitInterviewRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/offer-letter", offerLetterRoutes);
app.use("/api/performance-review", performanceReviewRoutes);
app.use("/api/policy-builder", policyBuilderRoutes);
app.use("/api/resume-formatter", resumeFormatterRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/salary-benchmark", salaryBenchmarkRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb: isMongoConnected ? "connected" : "disconnected (demo mode)",
    timestamp: new Date().toISOString()
  });
});

// Serve static files from the React build folder
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Fallback: serve index.html for all non-API routes (React Router support)
app.get(/^(?!\/api\/).+$/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send("ATRact Backend Running - Please build the frontend or access /api endpoints");
    }
  });
});

// API 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB status: ${isMongoConnected ? "Connected" : "Disconnected (demo mode)"}`);
});
