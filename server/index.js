require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const AppMetric = require("./models/appmetric");
const analysisRoutes = require("./routes/analysisRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const offerLetterRoutes = require("./routes/offerLetterRoutes");
const salaryBenchmarkRoutes = require("./routes/salaryBenchmarkRoutes");
const policyBuilderRoutes = require("./routes/policyBuilderRoutes");
const exitInterviewRoutes = require("./routes/exitInterviewRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const performanceReviewRoutes = require("./routes/performanceReviewRoutes");
const resumeFormatterRoutes = require("./routes/resumeFormatterRoutes");
const resumeRoutes = require("./routes/resumeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Better mongoose connection handling
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// In-memory fallback when MongoDB unavailable (dynamic, works without DB)
const memoryStore = [];
let memoryIdCounter = 1;

const schemaFields = ["appName", "users7d", "users30d", "revenue30d", "retention", "cost", "status", "decision", "owner"];

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
    if (mongoose.connection.readyState === 1) {
      const apps = await AppMetric.find();
      return res.json(apps);
    }
  } catch (err) {
    console.error("MongoDB GET error:", err.message);
  }
  res.json(memoryStore.length ? memoryStore : []);
});

// CREATE new app metric
app.post("/apps", async (req, res) => {
  const payload = sanitizeApp(req.body);
  try {
    if (mongoose.connection.readyState === 1) {
      const appData = new AppMetric({ ...payload, lastUpdated: new Date() });
      await appData.save();
      return res.status(201).json(appData);
    }
  } catch (err) {
    console.error("MongoDB POST error:", err.message);
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
    if (mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
      const updated = await AppMetric.findByIdAndUpdate(id, { ...payload, lastUpdated: new Date() }, { new: true, runValidators: true });
      if (updated) return res.json(updated);
    }
  } catch (err) {
    console.error("MongoDB PUT error:", err.message);
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
    if (mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
      const deleted = await AppMetric.findByIdAndDelete(id);
      if (deleted) return res.json({ message: "App deleted successfully" });
    }
  } catch (err) {
    console.error("MongoDB DELETE error:", err.message);
  }
  const idx = memoryStore.findIndex((a) => String(a._id) === String(id));
  if (idx >= 0) {
    memoryStore.splice(idx, 1);
    return res.json({ message: "App deleted successfully" });
  }
  res.status(404).json({ error: "App not found" });
});

// Mount API routes
app.use("/api/analysis", analysisRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/offer-letter", offerLetterRoutes);
app.use("/api/salary-benchmark", salaryBenchmarkRoutes);
app.use("/api/policy-builder", policyBuilderRoutes);
app.use("/api/exit-interview", exitInterviewRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/performance-review", performanceReviewRoutes);
app.use("/api/resume-formatter", resumeFormatterRoutes);
app.use("/api/resume", resumeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});