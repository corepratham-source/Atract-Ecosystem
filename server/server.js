// // server.js
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");
// const path = require("path");
// require("dotenv").config();

// const AppMetric = require("./models/appmetric");
// const analysisRoutes = require("./routes/analysisRoutes");
// const paymentRoutes = require("./routes/paymentRoutes");
// const attendanceRoutes = require("./routes/attendanceRoutes");
// const exitInterviewRoutes = require("./routes/exitInterviewRoutes");
// const interviewRoutes = require("./routes/interviewRoutes");
// const offerLetterRoutes = require("./routes/offerLetterRoutes");
// const performanceReviewRoutes = require("./routes/performanceReviewRoutes");
// const policyBuilderRoutes = require("./routes/policyBuilderRoutes");
// const resumeFormatterRoutes = require("./routes/resumeFormatterRoutes");
// const salaryBenchmarkRoutes = require("./routes/salaryBenchmarkRoutes");
// const resumeRoutes = require("./routes/resumeRoutes");
// const authRoutes = require("./routes/authRoutes");
// const interviewQuestionsRouter = require('./routes/interviewQuestions');

// const app = express();

// app.use(cors({
//   origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
//   credentials: true
// }));
// app.use(cookieParser());
// app.use(express.json());

// // Other auth routes from router
// app.use("/api/auth", authRoutes);
// app.get("/api/health", (req, res) => {
//   res.json({
//     status: "ok",
//     mongodb: isMongoConnected ? "connected" : "disconnected (demo mode)",
//     timestamp: new Date().toISOString()
//   });
// });
// app.use("/api/analysis", analysisRoutes);
// app.use("/api/payment", paymentRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/exit-interview", exitInterviewRoutes);
// app.use('/api/interview', require('./routes/interviewQuestions'));
// app.use("/api/offer-letter", offerLetterRoutes);
// app.use("/api/performance-review", performanceReviewRoutes);
// app.use("/api/policy-builder", policyBuilderRoutes);
// app.use("/api/resume-formatter", resumeFormatterRoutes);
// app.use("/api/resume", resumeRoutes);
// app.use("/api/salary-benchmark", salaryBenchmarkRoutes);

// // Flag to track MongoDB connection status
// let isMongoConnected = false;

// // MongoDB connection options with better error handling
// const mongoOptions = {
//   serverSelectionTimeoutMS: 10000, // Timeout after 10s
//   socketTimeoutMS: 45000, // Socket timeout
//   maxPoolSize: 10,
//   retryWrites: true,
// };

// // Try to connect to MongoDB with retry and improved logging
// mongoose.set('strictQuery', false);

// const connectWithRetry = async (attempt = 1) => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI, mongoOptions);
//     console.log("MongoDB connected successfully");
//     isMongoConnected = true;
//   } catch (err) {
//     isMongoConnected = false;
//     console.error(`MongoDB connection attempt #${attempt} failed:`);
//     console.error(err && err.message ? err.message : err);
//     if (err && err.stack) console.error(err.stack);
//     console.warn("Running in demo mode without database. Will retry connection in 30 seconds.");
//     // Retry with exponential backoff capped at 5 minutes
//     const delay = Math.min(30000 * attempt, 300000);
//     setTimeout(() => connectWithRetry(attempt + 1), delay);
//   }
// };

// if (process.env.MONGO_URI) {
//   connectWithRetry();
// } else {
//   console.warn('No MONGO_URI provided in environment; running in demo mode');
// }

// // In-memory fallback when MongoDB unavailable (dynamic, works without DB)
// const memoryStore = [];
// let memoryIdCounter = 1;

// function sanitizeApp(body) {
//   return {
//     appName: String(body.appName || "").trim() || "Untitled",
//     users7d: Number(body.users7d) || 0,
//     users30d: Number(body.users30d) || 0,
//     revenue30d: Number(body.revenue30d) || 0,
//     retention: Math.min(100, Math.max(0, Number(body.retention) || 0)),
//     cost: Number(body.cost) || 0,
//     status: ["Build", "Live", "Pause", "Kill", "Scale"].includes(body.status) ? body.status : "Build",
//     decision: ["Scale", "Watch", "Kill"].includes(body.decision) ? body.decision : "Watch",
//     owner: String(body.owner || "").trim(),
//   };
// }

// // GET all apps
// app.get("/apps", async (req, res) => {
//   try {
//     if (isMongoConnected && mongoose.connection.readyState === 1) {
//       const apps = await AppMetric.find();
//       return res.json(apps);
//     }
//   } catch (err) {
//     console.warn("MongoDB GET error, using memory store:", err.message);
//   }
//   res.json(memoryStore.length ? memoryStore : []);
// });

// // CREATE new app metric
// app.post("/apps", async (req, res) => {
//   if (!req.body.appName || !req.body.appName.trim()) {
//     return res.status(400).json({ error: "App name is required" });
//   }
//   const payload = sanitizeApp(req.body);
//   try {
//     if (isMongoConnected && mongoose.connection.readyState === 1) {
//       const appData = new AppMetric({ ...payload, lastUpdated: new Date() });
//       await appData.save();
//       return res.status(201).json(appData);
//     }
//   } catch (err) {
//     console.warn("MongoDB POST error, using memory store:", err.message);
//   }
//   const newItem = {
//     _id: `mem_${memoryIdCounter++}`,
//     ...payload,
//     lastUpdated: new Date(),
//   };
//   memoryStore.push(newItem);
//   res.status(201).json(newItem);
// });

// // UPDATE app metric
// app.put("/apps/:id", async (req, res) => {
//   const id = req.params.id;
//   const payload = sanitizeApp(req.body);
//   try {
//     if (isMongoConnected && mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
//       const updated = await AppMetric.findByIdAndUpdate(id, { ...payload, lastUpdated: new Date() }, { new: true, runValidators: true });
//       if (updated) return res.json(updated);
//     }
//   } catch (err) {
//     console.warn("MongoDB PUT error, using memory store:", err.message);
//   }
//   const idx = memoryStore.findIndex((a) => String(a._id) === String(id));
//   if (idx >= 0) {
//     memoryStore[idx] = { ...memoryStore[idx], ...payload, lastUpdated: new Date() };
//     return res.json(memoryStore[idx]);
//   }
//   res.status(404).json({ error: "App not found" });
// });

// // DELETE app metric
// app.delete("/apps/:id", async (req, res) => {
//   const id = req.params.id;
//   try {
//     if (isMongoConnected && mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
//       const deleted = await AppMetric.findByIdAndDelete(id);
//       if (deleted) return res.json({ message: "App deleted successfully" });
//     }
//   } catch (err) {
//     console.warn("MongoDB DELETE error, using memory store:", err.message);
//   }
//   const idx = memoryStore.findIndex((a) => String(a._id) === String(id));
//   if (idx >= 0) {
//     memoryStore.splice(idx, 1);
//     return res.json({ message: "App deleted successfully" });
//   }
//   res.status(404).json({ error: "App not found" });
// });

// // Serve static files from the React build folder
// const clientBuildPath = path.join(__dirname, '../client/dist');
// app.use(express.static(clientBuildPath));

// // Fallback: serve index.html for all non-API routes (React Router support)
// app.get(/^(?!\/api\/).+$/, (req, res) => {
//   res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
//     if (err) {
//       res.status(404).send("ATRact Backend Running - Please build the frontend or access /api endpoints");
//     }
//   });
// });

// // API 404 fallback
// app.use((req, res) => {
//   res.status(404).json({ error: "API endpoint not found" });
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`MongoDB status: ${isMongoConnected ? "Connected" : "Disconnected (demo mode)"}`);
// });


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
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
const authRoutes = require("./routes/authRoutes");
const interviewQuestionsRouter = require('./routes/interviewQuestions');

const app = express();

// ────────────────────────────────────────────────────────────────
// IMPORTANT FIX: Increase body-parser limits (was default 100kb)
// This prevents "Payload Too Large" error when sending large resumes
// ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));                    // JSON payloads up to 10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Form data up to 10MB

// CORS configuration - Fully dynamic for any deployment
// In development: accepts localhost ports (5173, 5174, 5000)
// In production: accepts ANY origin (works on any domain/platform)
const isProduction = process.env.NODE_ENV === 'production';

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // In production, allow any origin
    if (isProduction) {
      return callback(null, true);
    }
    
    // Development origins only
    const devOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5000'
    ];
    
    if (devOrigins.some(o => origin?.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb: isMongoConnected ? "connected" : "disconnected (demo mode)",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/analysis", analysisRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/exit-interview", exitInterviewRoutes);
app.use('/api/interview', interviewQuestionsRouter);          // Fixed: use the imported router
app.use("/api/offer-letter", offerLetterRoutes);
app.use("/api/performance-review", performanceReviewRoutes);
app.use("/api/policy-builder", policyBuilderRoutes);
app.use("/api/resume-formatter", resumeFormatterRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/salary-benchmark", salaryBenchmarkRoutes);

// Add /api/apps route for app usage tracking
app.get("/api/apps", async (req, res) => {
  try {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const apps = await AppMetric.find();
      return res.json(apps);
    }
  } catch (err) {
    console.warn("MongoDB GET /api/apps error, using memory:", err.message);
  }
  res.json(memoryStore.length ? memoryStore : []);
});

// ────────────────────────────────────────────────────────────────
// In-memory fallback for AppMetric (your existing code)
// ────────────────────────────────────────────────────────────────
let isMongoConnected = false;

const mongoOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
};

mongoose.set('strictQuery', false);

const connectWithRetry = async (attempt = 1) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, mongoOptions);
    console.log("MongoDB connected successfully");
    isMongoConnected = true;
  } catch (err) {
    isMongoConnected = false;
    console.error(`MongoDB connection attempt #${attempt} failed:`, err.message);
    console.warn("Running in demo mode without database. Retrying in 30s...");
    const delay = Math.min(30000 * attempt, 300000);
    setTimeout(() => connectWithRetry(attempt + 1), delay);
  }
};

if (process.env.MONGO_URI) {
  connectWithRetry();
} else {
  console.warn('No MONGO_URI provided; running in demo mode');
}

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

app.get("/apps", async (req, res) => {
  try {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const apps = await AppMetric.find();
      return res.json(apps);
    }
  } catch (err) {
    console.warn("MongoDB GET error, using memory:", err.message);
  }
  res.json(memoryStore.length ? memoryStore : []);
});

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
    console.warn("MongoDB POST error, using memory:", err.message);
  }
  const newItem = { _id: `mem_${memoryIdCounter++}`, ...payload, lastUpdated: new Date() };
  memoryStore.push(newItem);
  res.status(201).json(newItem);
});

app.put("/apps/:id", async (req, res) => {
  const id = req.params.id;
  const payload = sanitizeApp(req.body);
  try {
    if (isMongoConnected && mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
      const updated = await AppMetric.findByIdAndUpdate(id, { ...payload, lastUpdated: new Date() }, { new: true });
      if (updated) return res.json(updated);
    }
  } catch (err) {
    console.warn("MongoDB PUT error, using memory:", err.message);
  }
  const idx = memoryStore.findIndex(a => String(a._id) === String(id));
  if (idx >= 0) {
    memoryStore[idx] = { ...memoryStore[idx], ...payload, lastUpdated: new Date() };
    return res.json(memoryStore[idx]);
  }
  res.status(404).json({ error: "App not found" });
});

app.delete("/apps/:id", async (req, res) => {
  const id = req.params.id;
  try {
    if (isMongoConnected && mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
      const deleted = await AppMetric.findByIdAndDelete(id);
      if (deleted) return res.json({ message: "App deleted" });
    }
  } catch (err) {
    console.warn("MongoDB DELETE error, using memory:", err.message);
  }
  const idx = memoryStore.findIndex(a => String(a._id) === String(id));
  if (idx >= 0) {
    memoryStore.splice(idx, 1);
    return res.json({ message: "App deleted" });
  }
  res.status(404).json({ error: "App not found" });
});

// Serve React build - try multiple possible paths for Render compatibility
const fs = require('fs');
let clientBuildPath;

const possiblePaths = [
  path.join(__dirname, "../client/dist"),
  path.join(__dirname, "../../client/dist"),
  path.join(__dirname, "client/dist"),
  path.join(process.cwd(), "../client/dist"),
  path.join(process.cwd(), "client/dist")
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    clientBuildPath = p;
    console.log("React build found at:", clientBuildPath);
    break;
  }
}

if (!clientBuildPath) {
  console.error("React build NOT found in any of these locations:");
  possiblePaths.forEach(p => console.error(" - ", p));
}

// Serve static files with explicit MIME types
if (clientBuildPath) {
  app.use(express.static(clientBuildPath, {
    maxAge: '1h',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Force proper MIME types
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (filePath.endsWith('.ico')) {
        res.setHeader('Content-Type', 'image/x-icon');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      } else if (filePath.endsWith('.woff')) {
        res.setHeader('Content-Type', 'font/woff');
      } else if (filePath.endsWith('.woff2')) {
        res.setHeader('Content-Type', 'font/woff2');
      }
    }
  }));

  // Also serve the client/public folder for service worker and manifest
  const publicPath = path.join(__dirname, "../client/public");
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }
}

// React router fallback - serve index.html for non-API routes
app.get("*", (req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }

  // Don't handle requests with file extensions - let them 404
  if (req.originalUrl.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|gif|webp)$/)) {
    return res.status(404).send("File not found");
  }

  if (clientBuildPath) {
    res.sendFile(path.join(clientBuildPath, "index.html"), (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).send("Error loading application");
      }
    });
  } else {
    res.status(500).send("React build not found. Please deploy the frontend.");
  }
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB status: ${isMongoConnected ? "Connected" : "Disconnected (demo mode)"}`);
});
