// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const path = require("path");

// const AppMetric = require("./models/appmetric");
// const analysisRoutes = require("./routes/analysisRoutes");
// const paymentRoutes = require("./routes/paymentRoutes");
// const interviewRoutes = require("./routes/interviewRoutes");
// const offerLetterRoutes = require("./routes/offerLetterRoutes");
// const salaryBenchmarkRoutes = require("./routes/salaryBenchmarkRoutes");
// const policyBuilderRoutes = require("./routes/policyBuilderRoutes");
// const exitInterviewRoutes = require("./routes/exitInterviewRoutes");
// const attendanceRoutes = require("./routes/attendanceRoutes");
// const performanceReviewRoutes = require("./routes/performanceReviewRoutes");
// const resumeFormatterRoutes = require("./routes/resumeFormatterRoutes");
// const resumeRoutes = require("./routes/resumeRoutes");

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json({ limit: '50mb', type: 'application/json' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // Better mongoose connection handling
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB connected"))
//   .catch(err => console.error("MongoDB connection error:", err));

// // In-memory fallback when MongoDB unavailable (dynamic, works without DB)
// const memoryStore = [];
// let memoryIdCounter = 1;

// const schemaFields = ["appName", "users7d", "users30d", "revenue30d", "retention", "cost", "status", "decision", "owner"];

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
//     if (mongoose.connection.readyState === 1) {
//       const apps = await AppMetric.find();
//       return res.json(apps);
//     }
//   } catch (err) {
//     console.error("MongoDB GET error:", err.message);
//   }
//   res.json(memoryStore.length ? memoryStore : []);
// });

// // CREATE new app metric
// app.post("/apps", async (req, res) => {
//   const payload = sanitizeApp(req.body);
//   try {
//     if (mongoose.connection.readyState === 1) {
//       const appData = new AppMetric({ ...payload, lastUpdated: new Date() });
//       await appData.save();
//       return res.status(201).json(appData);
//     }
//   } catch (err) {
//     console.error("MongoDB POST error:", err.message);
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
//     if (mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
//       const updated = await AppMetric.findByIdAndUpdate(id, { ...payload, lastUpdated: new Date() }, { new: true, runValidators: true });
//       if (updated) return res.json(updated);
//     }
//   } catch (err) {
//     console.error("MongoDB PUT error:", err.message);
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
//     if (mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
//       const deleted = await AppMetric.findByIdAndDelete(id);
//       if (deleted) return res.json({ message: "App deleted successfully" });
//     }
//   } catch (err) {
//     console.error("MongoDB DELETE error:", err.message);
//   }
//   const idx = memoryStore.findIndex((a) => String(a._id) === String(id));
//   if (idx >= 0) {
//     memoryStore.splice(idx, 1);
//     return res.json({ message: "App deleted successfully" });
//   }
//   res.status(404).json({ error: "App not found" });
// });

// // Mount API routes
// app.use("/api/analysis", analysisRoutes);
// app.use("/api/payment", paymentRoutes);
// app.use("/api/interview", interviewRoutes);
// app.use("/api/offer-letter", offerLetterRoutes);
// app.use("/api/salary-benchmark", salaryBenchmarkRoutes);
// app.use("/api/policy-builder", policyBuilderRoutes);
// app.use("/api/exit-interview", exitInterviewRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/performance-review", performanceReviewRoutes);
// app.use("/api/resume-formatter", resumeFormatterRoutes);
// app.use("/api/resume", resumeRoutes);

// // Global error handler for multer and other errors
// app.use((err, req, res, next) => {
//   console.error('[Error] Server error:', err.message);
  
//   // Handle multer/busboy errors gracefully
//   if (err.code === 'LIMIT_FILE_SIZE') {
//     return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
//   }
//   if (err.message && err.message.includes('Unexpected end of form')) {
//     return res.status(400).json({ error: 'File upload failed. Please try again.' });
//   }
//   if (err.message && err.message.includes('Multipart')) {
//     return res.status(400).json({ error: 'Multipart form error. Please try uploading again.' });
//   }
  
//   res.status(500).json({ error: err.message || 'Internal server error' });
// });

// // Serve React build - try multiple possible paths for Render compatibility
// let clientBuildPath;
// try {
//   // Try the direct path first
//   clientBuildPath = path.join(__dirname, '../client/dist');
//   require('fs').accessSync(clientBuildPath); // Verify it exists
// } catch (e) {
//   // Try alternative paths
//   try {
//     clientBuildPath = path.join(__dirname, 'client/dist');
//     require('fs').accessSync(clientBuildPath);
//   } catch (e2) {
//     // Last resort - try the original
//     clientBuildPath = path.join(__dirname, '../client/dist');
//   }
// }

// console.log('Serving static files from:', clientBuildPath);

// // Serve static files with proper MIME types
// app.use(express.static(clientBuildPath, {
//   maxAge: '1h', // Cache static assets for 1 hour
//   etag: true,
//   lastModified: true
// }));

// // Also serve the client/public folder for service worker and manifest
// const publicPath = path.join(__dirname, '../client/public');
// app.use(express.static(publicPath));

// // React Router fallback - ONLY for HTML pages, NOT for static assets
// // This regex matches HTML pages but NOT:
// // - /api/* routes
// // - /assets/* (CSS, JS, images)
// // - Files with extensions (.js, .css, .png, .jpg, .svg, .ico, .woff, etc.)
// app.get(/^\/(?!api\/|assets\/)[^.]*$/, (req, res) => {
//   res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
//     if (err) {
//       console.error('Error sending index.html:', err);
//       res.status(404).send("ATRact Backend Running - Please build frontend or use /api");
//     }
//   });
// });

// // 404 fallback
// app.use((req, res) => {
//   res.status(404).json({ error: "API endpoint not found" });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

const AppMetric = require("./models/appmetric");
const authRoutes = require("./routes/authRoutes");

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

// ================= MONGODB CONNECTION WITH RETRY =================

let isMongoConnected = false;

// Simpler MongoDB options - let Mongoose handle more things automatically
const mongoOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
};

mongoose.set("strictQuery", false);

// Disable query buffering - queries won't queue when disconnected
mongoose.set("bufferCommands", false);

// Log all Mongoose events
mongoose.connection.on("connecting", () => {
  console.log("🔄 MongoDB: Connecting...");
});

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB: Connected!");
  isMongoConnected = true;
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB: Disconnected");
  isMongoConnected = false;
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Error:", err.message);
});

mongoose.connection.on("close", () => {
  console.log("🔌 MongoDB: Connection closed");
});

const connectWithRetry = async (attempt = 1) => {
  const maxRetries = 10;
  const baseDelay = 5000; // 5 seconds
  
  try {
    console.log(`MongoDB connection attempt #${attempt}...`);
    await mongoose.connect(process.env.MONGO_URI, mongoOptions);
    console.log("✅ MongoDB connected successfully!");
    isMongoConnected = true;
  } catch (err) {
    isMongoConnected = false;
    console.error(`❌ MongoDB connection attempt #${attempt} failed:`, err.message);
    
    if (attempt < maxRetries) {
      // Exponential backoff: 5s, 10s, 15s, 20s, 25s... max 30s
      const delay = Math.min(baseDelay * attempt, 30000);
      console.log(`⏳ Retrying MongoDB connection in ${delay/1000}s...`);
      setTimeout(() => connectWithRetry(attempt + 1), delay);
    } else {
      console.error("🚫 MongoDB connection failed after maximum retries. Running in DEMO/MEMORY mode.");
    }
  }
};

// Start MongoDB connection
console.log("MONGO_URI available:", !!process.env.MONGO_URI);
console.log("MONGO_URI value:", process.env.MONGO_URI ? "(present)" : "(missing)");

if (process.env.MONGO_URI) {
  connectWithRetry();
} else {
  console.error("🚫 No MONGO_URI provided! Database will not work.");
}

// ================= CORS =================

// Dynamic CORS - allow all in production, localhost in dev
const isProduction = process.env.NODE_ENV === "production";
const corsOrigin = isProduction 
  ? true  // Allow all origins in production
  : (process.env.CLIENT_URL || "http://localhost:5173");

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Cookie parser for auth
app.use(cookieParser());

// ================= BODY PARSER =================

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ================= HEALTH CHECK =================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb: isMongoConnected ? "connected" : "disconnected (demo mode)",
    timestamp: new Date().toISOString()
  });
});

// ================= MEMORY FALLBACK =================

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

    status: ["Build", "Live", "Pause", "Kill", "Scale"].includes(body.status)
      ? body.status : "Build",

    decision: ["Scale", "Watch", "Kill"].includes(body.decision)
      ? body.decision : "Watch",

    owner: String(body.owner || "").trim(),

  };

}


// ================= CRUD APIs =================

// Helper to check MongoDB connection status
const isDbReady = () => isMongoConnected && mongoose.connection.readyState === 1;

// GET
app.get("/api/apps", async (req, res) => {
  try {
    if (isDbReady()) {
      const apps = await AppMetric.find();
      return res.json(apps);
    }
  } catch (err) {
    console.warn("MongoDB GET /api/apps error:", err.message);
  }
  // Fallback to memory store
  res.json(memoryStore);
});

// POST
app.post("/api/apps", async (req, res) => {
  const payload = sanitizeApp(req.body);
  try {
    if (isDbReady()) {
      const appData = new AppMetric({
        ...payload,
        lastUpdated: new Date()
      });
      await appData.save();
      return res.status(201).json(appData);
    }
  } catch (err) {
    console.warn("MongoDB POST /api/apps error:", err.message);
  }
  // Fallback to memory store
  const newItem = {
    _id: `mem_${memoryIdCounter++}`,
    ...payload,
    lastUpdated: new Date()
  };
  memoryStore.push(newItem);
  res.status(201).json(newItem);
});

// PUT
app.put("/api/apps/:id", async (req, res) => {
  const id = req.params.id;
  const payload = sanitizeApp(req.body);
  try {
    if (isDbReady() && !id.startsWith("mem_")) {
      const updated = await AppMetric.findByIdAndUpdate(
        id,
        { ...payload, lastUpdated: new Date() },
        { new: true }
      );
      if (updated) return res.json(updated);
    }
  } catch (err) {
    console.warn("MongoDB PUT /api/apps error:", err.message);
  }
  // Fallback to memory store
  const index = memoryStore.findIndex(x => x._id == id);
  if (index >= 0) {
    memoryStore[index] = {
      ...memoryStore[index],
      ...payload,
      lastUpdated: new Date()
    };
    return res.json(memoryStore[index]);
  }
  res.status(404).json({ error: "Not found" });
});

// DELETE
app.delete("/api/apps/:id", async (req, res) => {
  const id = req.params.id;
  try {
    if (isDbReady() && !id.startsWith("mem_")) {
      await AppMetric.findByIdAndDelete(id);
      return res.json({ message: "Deleted" });
    }
  } catch (err) {
    console.warn("MongoDB DELETE /api/apps error:", err.message);
  }
  // Fallback to memory store
  const index = memoryStore.findIndex(x => x._id == id);
  if (index >= 0) {
    memoryStore.splice(index, 1);
    return res.json({ message: "Deleted" });
  }
  res.status(404).json({ error: "Not found" });
});



// ================= OTHER ROUTES =================


app.use("/api/auth", authRoutes);

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



// ================= SERVE FRONTEND =================


// React build path - try multiple possible paths for Render compatibility

let clientPath;

const possiblePaths = [
  path.join(__dirname, "dist"),
  path.join(__dirname, "../dist"),
  path.join(__dirname, "../client/dist"),
  path.join(__dirname, "../../client/dist"),
  path.join(__dirname, "client/dist"),
  path.join(process.cwd(), "dist"),
  path.join(process.cwd(), "../dist"),
  path.join(process.cwd(), "../client/dist"),
  path.join(process.cwd(), "client/dist")
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    clientPath = p;
    console.log("React build found at:", clientPath);
    break;
  }
}

if (!clientPath) {
  console.error("React build NOT found in any of these locations:");
  possiblePaths.forEach(p => console.error(" - ", p));
}

// serve static files with explicit MIME types
if (clientPath) {
  app.use(express.static(clientPath, {
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
// Only match routes WITHOUT file extensions (let express.static handle those)
app.get(/^(?!\/api\/)(?!.*\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|gif|webp)$)/, (req, res) => {

  if (clientPath) {
    res.sendFile(path.join(clientPath, "index.html"), (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).send("Error loading application");
      }
    });
  } else {
    res.status(500).send("React build not found. Please deploy the frontend.");
  }
});



// ================= START SERVER =================


const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {

  console.log("Server running on port", PORT);

});