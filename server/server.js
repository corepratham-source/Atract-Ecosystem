// // // // server.js
// // // const express = require("express");
// // // const mongoose = require("mongoose");
// // // const cors = require("cors");
// // // const cookieParser = require("cookie-parser");
// // // const path = require("path");
// // // require("dotenv").config();

// // // const AppMetric = require("./models/appmetric");
// // // const analysisRoutes = require("./routes/analysisRoutes");
// // // const paymentRoutes = require("./routes/paymentRoutes");
// // // const attendanceRoutes = require("./routes/attendanceRoutes");
// // // const exitInterviewRoutes = require("./routes/exitInterviewRoutes");
// // // const interviewRoutes = require("./routes/interviewRoutes");
// // // const offerLetterRoutes = require("./routes/offerLetterRoutes");
// // // const performanceReviewRoutes = require("./routes/performanceReviewRoutes");
// // // const policyBuilderRoutes = require("./routes/policyBuilderRoutes");
// // // const resumeFormatterRoutes = require("./routes/resumeFormatterRoutes");
// // // const salaryBenchmarkRoutes = require("./routes/salaryBenchmarkRoutes");
// // // const resumeRoutes = require("./routes/resumeRoutes");
// // // const authRoutes = require("./routes/authRoutes");
// // // const interviewQuestionsRouter = require('./routes/interviewQuestions');

// // // const app = express();

// // // app.use(cors({
// // //   origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
// // //   credentials: true
// // // }));
// // // app.use(cookieParser());
// // // app.use(express.json());

// // // // Other auth routes from router
// // // app.use("/api/auth", authRoutes);
// // // app.get("/api/health", (req, res) => {
// // //   res.json({
// // //     status: "ok",
// // //     mongodb: isMongoConnected ? "connected" : "disconnected (demo mode)",
// // //     timestamp: new Date().toISOString()
// // //   });
// // // });
// // // app.use("/api/analysis", analysisRoutes);
// // // app.use("/api/payment", paymentRoutes);
// // // app.use("/api/attendance", attendanceRoutes);
// // // app.use("/api/exit-interview", exitInterviewRoutes);
// // // app.use('/api/interview', require('./routes/interviewQuestions'));
// // // app.use("/api/offer-letter", offerLetterRoutes);
// // // app.use("/api/performance-review", performanceReviewRoutes);
// // // app.use("/api/policy-builder", policyBuilderRoutes);
// // // app.use("/api/resume-formatter", resumeFormatterRoutes);
// // // app.use("/api/resume", resumeRoutes);
// // // app.use("/api/salary-benchmark", salaryBenchmarkRoutes);

// // // // Flag to track MongoDB connection status
// // // let isMongoConnected = false;

// // // // MongoDB connection options with better error handling
// // // const mongoOptions = {
// // //   serverSelectionTimeoutMS: 10000, // Timeout after 10s
// // //   socketTimeoutMS: 45000, // Socket timeout
// // //   maxPoolSize: 10,
// // //   retryWrites: true,
// // // };

// // // // Try to connect to MongoDB with retry and improved logging
// // // mongoose.set('strictQuery', false);

// // // const connectWithRetry = async (attempt = 1) => {
// // //   try {
// // //     await mongoose.connect(process.env.MONGO_URI, mongoOptions);
// // //     console.log("MongoDB connected successfully");
// // //     isMongoConnected = true;
// // //   } catch (err) {
// // //     isMongoConnected = false;
// // //     console.error(`MongoDB connection attempt #${attempt} failed:`);
// // //     console.error(err && err.message ? err.message : err);
// // //     if (err && err.stack) console.error(err.stack);
// // //     console.warn("Running in demo mode without database. Will retry connection in 30 seconds.");
// // //     // Retry with exponential backoff capped at 5 minutes
// // //     const delay = Math.min(30000 * attempt, 300000);
// // //     setTimeout(() => connectWithRetry(attempt + 1), delay);
// // //   }
// // // };

// // // if (process.env.MONGO_URI) {
// // //   connectWithRetry();
// // // } else {
// // //   console.warn('No MONGO_URI provided in environment; running in demo mode');
// // // }

// // // // In-memory fallback when MongoDB unavailable (dynamic, works without DB)
// // // const memoryStore = [];
// // // let memoryIdCounter = 1;

// // // function sanitizeApp(body) {
// // //   return {
// // //     appName: String(body.appName || "").trim() || "Untitled",
// // //     users7d: Number(body.users7d) || 0,
// // //     users30d: Number(body.users30d) || 0,
// // //     revenue30d: Number(body.revenue30d) || 0,
// // //     retention: Math.min(100, Math.max(0, Number(body.retention) || 0)),
// // //     cost: Number(body.cost) || 0,
// // //     status: ["Build", "Live", "Pause", "Kill", "Scale"].includes(body.status) ? body.status : "Build",
// // //     decision: ["Scale", "Watch", "Kill"].includes(body.decision) ? body.decision : "Watch",
// // //     owner: String(body.owner || "").trim(),
// // //   };
// // // }

// // // // GET all apps
// // // app.get("/apps", async (req, res) => {
// // //   try {
// // //     if (isMongoConnected && mongoose.connection.readyState === 1) {
// // //       const apps = await AppMetric.find();
// // //       return res.json(apps);
// // //     }
// // //   } catch (err) {
// // //     console.warn("MongoDB GET error, using memory store:", err.message);
// // //   }
// // //   res.json(memoryStore.length ? memoryStore : []);
// // // });

// // // // CREATE new app metric
// // // app.post("/apps", async (req, res) => {
// // //   if (!req.body.appName || !req.body.appName.trim()) {
// // //     return res.status(400).json({ error: "App name is required" });
// // //   }
// // //   const payload = sanitizeApp(req.body);
// // //   try {
// // //     if (isMongoConnected && mongoose.connection.readyState === 1) {
// // //       const appData = new AppMetric({ ...payload, lastUpdated: new Date() });
// // //       await appData.save();
// // //       return res.status(201).json(appData);
// // //     }
// // //   } catch (err) {
// // //     console.warn("MongoDB POST error, using memory store:", err.message);
// // //   }
// // //   const newItem = {
// // //     _id: `mem_${memoryIdCounter++}`,
// // //     ...payload,
// // //     lastUpdated: new Date(),
// // //   };
// // //   memoryStore.push(newItem);
// // //   res.status(201).json(newItem);
// // // });

// // // // UPDATE app metric
// // // app.put("/apps/:id", async (req, res) => {
// // //   const id = req.params.id;
// // //   const payload = sanitizeApp(req.body);
// // //   try {
// // //     if (isMongoConnected && mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
// // //       const updated = await AppMetric.findByIdAndUpdate(id, { ...payload, lastUpdated: new Date() }, { new: true, runValidators: true });
// // //       if (updated) return res.json(updated);
// // //     }
// // //   } catch (err) {
// // //     console.warn("MongoDB PUT error, using memory store:", err.message);
// // //   }
// // //   const idx = memoryStore.findIndex((a) => String(a._id) === String(id));
// // //   if (idx >= 0) {
// // //     memoryStore[idx] = { ...memoryStore[idx], ...payload, lastUpdated: new Date() };
// // //     return res.json(memoryStore[idx]);
// // //   }
// // //   res.status(404).json({ error: "App not found" });
// // // });

// // // // DELETE app metric
// // // app.delete("/apps/:id", async (req, res) => {
// // //   const id = req.params.id;
// // //   try {
// // //     if (isMongoConnected && mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
// // //       const deleted = await AppMetric.findByIdAndDelete(id);
// // //       if (deleted) return res.json({ message: "App deleted successfully" });
// // //     }
// // //   } catch (err) {
// // //     console.warn("MongoDB DELETE error, using memory store:", err.message);
// // //   }
// // //   const idx = memoryStore.findIndex((a) => String(a._id) === String(id));
// // //   if (idx >= 0) {
// // //     memoryStore.splice(idx, 1);
// // //     return res.json({ message: "App deleted successfully" });
// // //   }
// // //   res.status(404).json({ error: "App not found" });
// // // });

// // // // Serve static files from the React build folder
// // // const clientBuildPath = path.join(__dirname, '../client/dist');
// // // app.use(express.static(clientBuildPath));

// // // // Fallback: serve index.html for all non-API routes (React Router support)
// // // app.get(/^(?!\/api\/).+$/, (req, res) => {
// // //   res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
// // //     if (err) {
// // //       res.status(404).send("ATRact Backend Running - Please build the frontend or access /api endpoints");
// // //     }
// // //   });
// // // });

// // // // API 404 fallback
// // // app.use((req, res) => {
// // //   res.status(404).json({ error: "API endpoint not found" });
// // // });

// // // const PORT = process.env.PORT || 5000;

// // // app.listen(PORT, () => {
// // //   console.log(`Server running on port ${PORT}`);
// // //   console.log(`MongoDB status: ${isMongoConnected ? "Connected" : "Disconnected (demo mode)"}`);
// // // });


// // const express = require("express");
// // const mongoose = require("mongoose");
// // const cors = require("cors");
// // const cookieParser = require("cookie-parser");
// // const path = require("path");
// // require("dotenv").config();

// // const AppMetric = require("./models/appmetric");
// // const analysisRoutes = require("./routes/analysisRoutes");
// // const paymentRoutes = require("./routes/paymentRoutes");
// // const attendanceRoutes = require("./routes/attendanceRoutes");
// // const exitInterviewRoutes = require("./routes/exitInterviewRoutes");
// // const interviewRoutes = require("./routes/interviewRoutes");
// // const offerLetterRoutes = require("./routes/offerLetterRoutes");
// // const performanceReviewRoutes = require("./routes/performanceReviewRoutes");
// // const policyBuilderRoutes = require("./routes/policyBuilderRoutes");
// // const resumeFormatterRoutes = require("./routes/resumeFormatterRoutes");
// // const salaryBenchmarkRoutes = require("./routes/salaryBenchmarkRoutes");
// // const resumeRoutes = require("./routes/resumeRoutes");
// // const authRoutes = require("./routes/authRoutes");
// // const interviewQuestionsRouter = require('./routes/interviewQuestions');

// // const app = express();

// // // ────────────────────────────────────────────────────────────────
// // // IMPORTANT FIX: Increase body-parser limits (was default 100kb)
// // // This prevents "Payload Too Large" error when sending large resumes
// // // ────────────────────────────────────────────────────────────────
// // app.use(express.json({ limit: '10mb' }));                    // JSON payloads up to 10MB
// // app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Form data up to 10MB

// // // CORS configuration - Fully dynamic for any deployment
// // // In development: accepts localhost ports (5173, 5174, 5000)
// // // In production: accepts ANY origin (works on any domain/platform)
// // const isProduction = process.env.NODE_ENV === 'production';

// // const corsOptions = {
// //   origin: function (origin, callback) {
// //     // Allow requests with no origin (like mobile apps or curl requests)
// //     if (!origin) {
// //       return callback(null, true);
// //     }
    
// //     // In production, allow any origin
// //     if (isProduction) {
// //       return callback(null, true);
// //     }
    
// //     // Development origins only
// //     const devOrigins = [
// //       'http://localhost:5173',
// //       'http://localhost:5174',
// //       'http://localhost:5000'
// //     ];
    
// //     if (devOrigins.some(o => origin?.startsWith(o))) {
// //       callback(null, true);
// //     } else {
// //       callback(new Error('Not allowed by CORS'));
// //     }
// //   },
// //   credentials: true
// // };

// // app.use(cors(corsOptions));
// // app.use(cookieParser());

// // // Routes
// // app.use("/api/auth", authRoutes);

// // app.get("/api/health", (req, res) => {
// //   res.json({
// //     status: "ok",
// //     mongodb: isMongoConnected ? "connected" : "disconnected (demo mode)",
// //     timestamp: new Date().toISOString()
// //   });
// // });

// // app.use("/api/analysis", analysisRoutes);
// // app.use("/api/payment", paymentRoutes);
// // app.use("/api/attendance", attendanceRoutes);
// // app.use("/api/exit-interview", exitInterviewRoutes);
// // app.use('/api/interview', interviewQuestionsRouter);          // Fixed: use the imported router
// // app.use("/api/offer-letter", offerLetterRoutes);
// // app.use("/api/performance-review", performanceReviewRoutes);
// // app.use("/api/policy-builder", policyBuilderRoutes);
// // app.use("/api/resume-formatter", resumeFormatterRoutes);
// // app.use("/api/resume", resumeRoutes);
// // app.use("/api/salary-benchmark", salaryBenchmarkRoutes);

// // // Add /api/apps route for app usage tracking
// // app.get("/api/apps", async (req, res) => {
// //   try {
// //     if (isMongoConnected && mongoose.connection.readyState === 1) {
// //       const apps = await AppMetric.find();
// //       return res.json(apps);
// //     }
// //   } catch (err) {
// //     console.warn("MongoDB GET /api/apps error, using memory:", err.message);
// //   }
// //   res.json(memoryStore.length ? memoryStore : []);
// // });

// // // ────────────────────────────────────────────────────────────────
// // // In-memory fallback for AppMetric (your existing code)
// // // ────────────────────────────────────────────────────────────────
// // let isMongoConnected = false;

// // const mongoOptions = {
// //   serverSelectionTimeoutMS: 10000,
// //   socketTimeoutMS: 45000,
// //   maxPoolSize: 10,
// //   retryWrites: true,
// // };

// // mongoose.set('strictQuery', false);

// // const connectWithRetry = async (attempt = 1) => {
// //   try {
// //     await mongoose.connect(process.env.MONGO_URI, mongoOptions);
// //     console.log("MongoDB connected successfully");
// //     isMongoConnected = true;
// //   } catch (err) {
// //     isMongoConnected = false;
// //     console.error(`MongoDB connection attempt #${attempt} failed:`, err.message);
// //     console.warn("Running in demo mode without database. Retrying in 30s...");
// //     const delay = Math.min(30000 * attempt, 300000);
// //     setTimeout(() => connectWithRetry(attempt + 1), delay);
// //   }
// // };

// // if (process.env.MONGO_URI) {
// //   connectWithRetry();
// // } else {
// //   console.warn('No MONGO_URI provided; running in demo mode');
// // }

// // const memoryStore = [];
// // let memoryIdCounter = 1;

// // function sanitizeApp(body) {
// //   return {
// //     appName: String(body.appName || "").trim() || "Untitled",
// //     users7d: Number(body.users7d) || 0,
// //     users30d: Number(body.users30d) || 0,
// //     revenue30d: Number(body.revenue30d) || 0,
// //     retention: Math.min(100, Math.max(0, Number(body.retention) || 0)),
// //     cost: Number(body.cost) || 0,
// //     status: ["Build", "Live", "Pause", "Kill", "Scale"].includes(body.status) ? body.status : "Build",
// //     decision: ["Scale", "Watch", "Kill"].includes(body.decision) ? body.decision : "Watch",
// //     owner: String(body.owner || "").trim(),
// //   };
// // }

// // app.get("/apps", async (req, res) => {
// //   try {
// //     if (isMongoConnected && mongoose.connection.readyState === 1) {
// //       const apps = await AppMetric.find();
// //       return res.json(apps);
// //     }
// //   } catch (err) {
// //     console.warn("MongoDB GET error, using memory:", err.message);
// //   }
// //   res.json(memoryStore.length ? memoryStore : []);
// // });

// // app.post("/apps", async (req, res) => {
// //   if (!req.body.appName || !req.body.appName.trim()) {
// //     return res.status(400).json({ error: "App name is required" });
// //   }
// //   const payload = sanitizeApp(req.body);
// //   try {
// //     if (isMongoConnected && mongoose.connection.readyState === 1) {
// //       const appData = new AppMetric({ ...payload, lastUpdated: new Date() });
// //       await appData.save();
// //       return res.status(201).json(appData);
// //     }
// //   } catch (err) {
// //     console.warn("MongoDB POST error, using memory:", err.message);
// //   }
// //   const newItem = { _id: `mem_${memoryIdCounter++}`, ...payload, lastUpdated: new Date() };
// //   memoryStore.push(newItem);
// //   res.status(201).json(newItem);
// // });

// // app.put("/apps/:id", async (req, res) => {
// //   const id = req.params.id;
// //   const payload = sanitizeApp(req.body);
// //   try {
// //     if (isMongoConnected && mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
// //       const updated = await AppMetric.findByIdAndUpdate(id, { ...payload, lastUpdated: new Date() }, { new: true });
// //       if (updated) return res.json(updated);
// //     }
// //   } catch (err) {
// //     console.warn("MongoDB PUT error, using memory:", err.message);
// //   }
// //   const idx = memoryStore.findIndex(a => String(a._id) === String(id));
// //   if (idx >= 0) {
// //     memoryStore[idx] = { ...memoryStore[idx], ...payload, lastUpdated: new Date() };
// //     return res.json(memoryStore[idx]);
// //   }
// //   res.status(404).json({ error: "App not found" });
// // });

// // app.delete("/apps/:id", async (req, res) => {
// //   const id = req.params.id;
// //   try {
// //     if (isMongoConnected && mongoose.connection.readyState === 1 && !id.startsWith("mem_")) {
// //       const deleted = await AppMetric.findByIdAndDelete(id);
// //       if (deleted) return res.json({ message: "App deleted" });
// //     }
// //   } catch (err) {
// //     console.warn("MongoDB DELETE error, using memory:", err.message);
// //   }
// //   const idx = memoryStore.findIndex(a => String(a._id) === String(id));
// //   if (idx >= 0) {
// //     memoryStore.splice(idx, 1);
// //     return res.json({ message: "App deleted" });
// //   }
// //   res.status(404).json({ error: "App not found" });
// // });

// // // Serve React build - try multiple possible paths for Render compatibility
// // const fs = require('fs');
// // let clientBuildPath;

// // const possiblePaths = [
// //   path.join(__dirname, "dist"),
// //   path.join(__dirname, "../dist"),
// //   path.join(__dirname, "../client/dist"),
// //   path.join(__dirname, "../../client/dist"),
// //   path.join(__dirname, "client/dist"),
// //   path.join(process.cwd(), "dist"),
// //   path.join(process.cwd(), "../dist"),
// //   path.join(process.cwd(), "../client/dist"),
// //   path.join(process.cwd(), "client/dist")
// // ];

// // for (const p of possiblePaths) {
// //   if (fs.existsSync(p)) {
// //     clientBuildPath = p;
// //     console.log("React build found at:", clientBuildPath);
// //     break;
// //   }
// // }

// // if (!clientBuildPath) {
// //   console.error("React build NOT found in any of these locations:");
// //   possiblePaths.forEach(p => console.error(" - ", p));
// // }

// // // Serve static files with explicit MIME types
// // if (clientBuildPath) {
// //   app.use(express.static(clientBuildPath, {
// //     maxAge: '1h',
// //     etag: true,
// //     lastModified: true,
// //     setHeaders: (res, filePath) => {
// //       // Force proper MIME types
// //       if (filePath.endsWith('.css')) {
// //         res.setHeader('Content-Type', 'text/css');
// //       } else if (filePath.endsWith('.js')) {
// //         res.setHeader('Content-Type', 'application/javascript');–––
// //       } else if (filePath.endsWith('.png')) {
// //         res.setHeader('Content-Type', 'image/png');
// //       } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
// //         res.setHeader('Content-Type', 'image/jpeg');
// //       } else if (filePath.endsWith('.svg')) {
// //         res.setHeader('Content-Type', 'image/svg+xml');
// //       } else if (filePath.endsWith('.ico')) {
// //         res.setHeader('Content-Type', 'image/x-icon');
// //       } else if (filePath.endsWith('.json')) {
// //         res.setHeader('Content-Type', 'application/json');
// //       } else if (filePath.endsWith('.woff')) {
// //         res.setHeader('Content-Type', 'font/woff');
// //       } else if (filePath.endsWith('.woff2')) {
// //         res.setHeader('Content-Type', 'font/woff2');
// //       }
// //     }
// //   }));

// //   // Also serve the client/public folder for service worker and manifest
// //   const publicPath = path.join(__dirname, "../client/public");
// //   if (fs.existsSync(publicPath)) {
// //     app.use(express.static(publicPath));
// //   }
// // }

// // // React router fallback - serve index.html for non-API routes
// // // Only match routes WITHOUT file extensions (let express.static handle those)
// // app.get(/^(?!\/api\/)(?!.*\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|gif|webp)$)/, (req, res) => {

// //   if (clientBuildPath) {
// //     res.sendFile(path.join(clientBuildPath, "index.html"), (err) => {
// //       if (err) {
// //         console.error('Error sending index.html:', err);
// //         res.status(500).send("Error loading application");
// //       }
// //     });
// //   } else {
// //     res.status(500).send("React build not found. Please deploy the frontend.");
// //   }
// // });

// // // 404 fallback
// // app.use((req, res) => {
// //   res.status(404).json({ error: "API endpoint not found" });
// // });

// // const PORT = process.env.PORT || 5000;

// // app.listen(PORT, () => {
// //   console.log(`Server running on port ${PORT}`);
// //   console.log(`MongoDB status: ${isMongoConnected ? "Connected" : "Disconnected (demo mode)"}`);
// // });


// // server/server.js
// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");
// const path = require("path");
// const fs = require("fs");

// // Prevent hard-crash on unexpected async errors (log instead of exiting)
// process.on("unhandledRejection", (reason) => {
//   console.error("[Process] Unhandled promise rejection:", reason);
// });
// process.on("uncaughtException", (err) => {
//   console.error("[Process] Uncaught exception:", err);
// });

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
// const interviewQuestionsRouter = require("./routes/interviewQuestions");

// const app = express();

// // ────────────────────────────────────────────────
// // Middleware
// // ────────────────────────────────────────────────
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// // CORS - permissive in production, restricted in dev
// const isProduction = process.env.NODE_ENV === "production";

// app.use(
//   cors({
//     origin: isProduction ? true : ["http://localhost:5173", "http://localhost:5174"],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// app.use(cookieParser());

// // ────────────────────────────────────────────────
// // MongoDB Connection with Retry
// // ────────────────────────────────────────────────
// let isMongoConnected = false;

// const mongoOptions = {
//   serverSelectionTimeoutMS: 15000,
//   socketTimeoutMS: 60000,
//   maxPoolSize: 10,
//   retryWrites: true,
// };

// mongoose.set("strictQuery", false);

// const connectWithRetry = async (attempt = 1) => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI, mongoOptions);
//     console.log("MongoDB connected successfully");
//     isMongoConnected = true;
//   } catch (err) {
//     isMongoConnected = false;
//     console.error(`MongoDB connection attempt #${attempt} failed:`, err.message);
//     if (attempt < 10) {
//       const delay = Math.min(10000 * attempt, 60000);
//       console.log(`Retrying MongoDB in ${delay / 1000}s...`);
//       setTimeout(() => connectWithRetry(attempt + 1), delay);
//     } else {
//       console.error("MongoDB connection failed after retries → using memory mode");
//     }
//   }
// };

// if (process.env.MONGO_URI) {
//   connectWithRetry();
// } else {
//   console.warn("No MONGO_URI provided → running in memory/demo mode");
// }

// // ────────────────────────────────────────────────
// // In-memory fallback store for AppMetric
// // ────────────────────────────────────────────────
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
//     status: ["Build", "Live", "Pause", "Kill", "Scale"].includes(body.status)
//       ? body.status
//       : "Build",
//     decision: ["Scale", "Watch", "Kill"].includes(body.decision) ? body.decision : "Watch",
//     owner: String(body.owner || "").trim(),
//     lastUpdated: new Date(),
//   };
// }

// // ────────────────────────────────────────────────
// // /apps CRUD Endpoints (Mongo + Memory fallback)
// // NOTE: Keep both legacy `/apps` and new `/api/apps` for compatibility.
// // ────────────────────────────────────────────────
// async function handleGetApps(req, res) {
//   try {
//     if (isMongoConnected) {
//       const apps = await AppMetric.find();
//       return res.json(apps);
//     }
//   } catch (err) {
//     console.warn("MongoDB GET /apps failed:", err.message);
//   }
//   res.json(memoryStore.length ? memoryStore : []);
// }

// async function handlePostApps(req, res) {
//   const payload = sanitizeApp(req.body);
//   try {
//     if (isMongoConnected) {
//       const appData = new AppMetric(payload);
//       await appData.save();
//       return res.status(201).json(appData);
//     }
//   } catch (err) {
//     console.warn("MongoDB POST /apps failed:", err.message);
//   }
//   const newItem = { _id: `mem_${memoryIdCounter++}`, ...payload };
//   memoryStore.push(newItem);
//   res.status(201).json(newItem);
// }

// async function handlePutApps(req, res) {
//   const id = req.params.id;
//   const payload = sanitizeApp(req.body);
//   try {
//     if (isMongoConnected && !id.startsWith("mem_")) {
//       const updated = await AppMetric.findByIdAndUpdate(id, payload, { new: true });
//       if (updated) return res.json(updated);
//     }
//   } catch (err) {
//     console.warn("MongoDB PUT /apps failed:", err.message);
//   }
//   const idx = memoryStore.findIndex((a) => String(a._id) === String(id));
//   if (idx >= 0) {
//     memoryStore[idx] = { ...memoryStore[idx], ...payload };
//     return res.json(memoryStore[idx]);
//   }
//   res.status(404).json({ error: "App not found" });
// }

// async function handleDeleteApps(req, res) {
//   const id = req.params.id;
//   try {
//     if (isMongoConnected && !id.startsWith("mem_")) {
//       const deleted = await AppMetric.findByIdAndDelete(id);
//       if (deleted) return res.json({ message: "App deleted" });
//     }
//   } catch (err) {
//     console.warn("MongoDB DELETE /apps failed:", err.message);
//   }
//   const idx = memoryStore.findIndex((a) => String(a._id) === String(id));
//   if (idx >= 0) {
//     memoryStore.splice(idx, 1);
//     return res.json({ message: "App deleted" });
//   }
//   res.status(404).json({ error: "App not found" });
// }

// // Legacy routes
// app.get("/apps", handleGetApps);
// app.post("/apps", handlePostApps);
// app.put("/apps/:id", handlePutApps);
// app.delete("/apps/:id", handleDeleteApps);

// // New API-prefixed routes
// app.get("/api/apps", handleGetApps);
// app.post("/api/apps", handlePostApps);
// app.put("/api/apps/:id", handlePutApps);
// app.delete("/api/apps/:id", handleDeleteApps);

// // ────────────────────────────────────────────────
// // API Routes
// // ────────────────────────────────────────────────
// app.use("/api/auth", authRoutes);
// app.use("/api/analysis", analysisRoutes);
// app.use("/api/payment", paymentRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/exit-interview", exitInterviewRoutes);
// app.use("/api/interview", interviewQuestionsRouter);
// app.use("/api/offer-letter", offerLetterRoutes);
// app.use("/api/performance-review", performanceReviewRoutes);
// app.use("/api/policy-builder", policyBuilderRoutes);
// app.use("/api/resume-formatter", resumeFormatterRoutes);
// app.use("/api/resume", resumeRoutes);
// app.use("/api/salary-benchmark", salaryBenchmarkRoutes);

// // Health check endpoint
// app.get("/api/health", (req, res) => {
//   res.json({
//     status: "ok",
//     mongodb: isMongoConnected ? "connected" : "memory mode",
//     timestamp: new Date().toISOString(),
//   });
// });

// // ────────────────────────────────────────────────
// // Serve React Frontend (SPA)
// // ────────────────────────────────────────────────
// let clientDistPath = null;

// const possiblePaths = [
//   path.join(__dirname, "../client/dist"),
//   path.join(__dirname, "../../client/dist"),
//   path.join(process.cwd(), "client/dist"),
//   path.join(process.cwd(), "dist"),
//   path.join(__dirname, "dist"),
// ];

// for (const candidate of possiblePaths) {
//   const indexPath = path.join(candidate, "index.html");
//   if (fs.existsSync(indexPath)) {
//     clientDistPath = candidate;
//     console.log(`✅ React build found at: ${clientDistPath}`);
//     break;
//   }
// }

// if (clientDistPath) {
//   // Serve static files (JS, CSS, images, etc.)
//   app.use(
//     express.static(clientDistPath, {
//       maxAge: "1h",
//       setHeaders: (res, filePath) => {
//         if (filePath.endsWith(".css")) res.type("text/css");
//         if (filePath.endsWith(".js")) res.type("application/javascript");
//         if (filePath.endsWith(".json")) res.type("application/json");
//         if (filePath.match(/\.(png|jpg|jpeg|gif|webp)$/)) res.type("image");
//         if (filePath.endsWith(".svg")) res.type("image/svg+xml");
//         if (filePath.endsWith(".ico")) res.type("image/x-icon");
//         if (filePath.match(/\.(woff|woff2)$/)) res.type("font/woff2");
//       },
//     })
//   );

//   // Serve public folder (manifest.json, sw.js, etc.) if exists
//   const publicPath = path.join(__dirname, "../client/public");
//   if (fs.existsSync(publicPath)) {
//     app.use(express.static(publicPath));
//   }

//   // SPA fallback route - Use regex to match all non-API routes
//   // This avoids path-to-regexp issues with the /* pattern
//   app.get(/^(?!\/api\/).*$/, (req, res) => {
//     const indexPath = path.join(clientDistPath, "index.html");
//     res.sendFile(indexPath, (err) => {
//       if (err) {
//         console.error("Error sending index.html:", err);
//         res.status(500).send("Error loading application");
//       }
//     });
//   });
// } else {
//   console.error("React dist folder NOT FOUND in any expected location");
//   app.use((req, res) => {
//     res.status(503).send(
//       "Frontend build missing.\n" +
//         "Run 'cd client && npm run build' and redeploy."
//     );
//   });
// }

// // ────────────────────────────────────────────────
// // 404 Fallback
// // ────────────────────────────────────────────────
// app.use((req, res) => {
//   res.status(404).json({ error: "Route not found" });
// });

// // ────────────────────────────────────────────────
// // Start Server
// // ────────────────────────────────────────────────
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Environment: ${isProduction ? "production" : "development"}`);
//   console.log(`MongoDB: ${isMongoConnected ? "connected" : "memory mode"}`);
// });

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

const app = express();

// ─────────────────────────────────────────────
// Crash guards
// ─────────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
  console.error("[Process] Unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Process] Uncaught exception:", err);
});

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: isProduction ? true : ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-id"],
  })
);

app.use(cookieParser());

// ─────────────────────────────────────────────
// MongoDB Connection
// ─────────────────────────────────────────────
let isMongoConnected = false;

const connectWithRetry = async (attempt = 1) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 60000,
      maxPoolSize: 10,
    });
    console.log("✅ MongoDB connected");
    isMongoConnected = true;
  } catch (err) {
    isMongoConnected = false;
    console.error(`MongoDB attempt #${attempt} failed:`, err.message);
    if (attempt < 10) {
      const delay = Math.min(10000 * attempt, 60000);
      console.log(`Retrying in ${delay / 1000}s...`);
      setTimeout(() => connectWithRetry(attempt + 1), delay);
    } else {
      console.warn("MongoDB unavailable — running in memory mode");
    }
  }
};

if (process.env.MONGO_URI) {
  connectWithRetry();
} else {
  console.warn("No MONGO_URI — running in memory/demo mode");
}

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────
app.use("/api/auth",               require("./routes/authRoutes"));
app.use("/api/analysis",           require("./routes/analysisRoutes"));
app.use("/api/payment",            require("./routes/paymentRoutes"));
app.use("/api/attendance",         require("./routes/attendanceRoutes"));
app.use("/api/exit-interview",     require("./routes/exitInterviewRoutes"));
app.use("/api/interview",          require("./routes/interviewQuestions"));
app.use("/api/offer-letter",       require("./routes/offerLetterRoutes"));
app.use("/api/performance-review", require("./routes/performanceReviewRoutes"));
app.use("/api/policy-builder",     require("./routes/policyBuilderRoutes"));
app.use("/api/resume-formatter",   require("./routes/resumeFormatterRoutes"));
app.use("/api/resume",             require("./routes/resumeRoutes"));
app.use("/api/salary-benchmark",   require("./routes/salaryBenchmarkRoutes"));

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb: isMongoConnected ? "connected" : "memory mode",
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// Serve React build
// ─────────────────────────────────────────────
const possibleClientPaths = [
  path.join(__dirname, "../client/dist"),
  path.join(__dirname, "../../client/dist"),
  path.join(process.cwd(), "client/dist"),
  path.join(process.cwd(), "dist"),
  path.join(__dirname, "dist"),
];

let clientDistPath = null;
for (const candidate of possibleClientPaths) {
  if (fs.existsSync(path.join(candidate, "index.html"))) {
    clientDistPath = candidate;
    console.log("✅ React build found at:", clientDistPath);
    break;
  }
}

if (clientDistPath) {
  // Serve all static assets (JS, CSS, images, fonts, etc.)
  app.use(express.static(clientDistPath, { maxAge: "1h" }));

  // Also serve client/public (service worker, manifest, etc.)
  const publicPath = path.join(__dirname, "../client/public");
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // ─────────────────────────────────────────
  // SPA FALLBACK — THE KEY FIX:
  // Express 5 removed support for `app.get('*', ...)` wildcard.
  // Must use `/*splat` instead.
  // ─────────────────────────────────────────
  app.get("/*splat", (req, res) => {
    // Don't intercept /api routes (safety net, shouldn't reach here anyway)
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
      if (err) {
        console.error("Error serving index.html:", err);
        res.status(500).send("Error loading application");
      }
    });
  });
} else {
  console.error("❌ React build NOT found. Run: cd client && npm run build");
  // Still need a catch-all or the server will hang on unknown routes
  app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.status(503).send(
      "Frontend not built. Run 'cd client && npm run build' then redeploy."
    );
  });
}

// ─────────────────────────────────────────────
// Start server
// // ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`Environment: ${isProduction ? "production" : "development"}`);
// });

// IMPORTANT: use 0.0.0.0 for Railway
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${isProduction ? "production" : "development"}`);
});