const express = require("express");
const router = express.Router();

// In-memory store for demo (use MongoDB in production)
const recordsStore = new Map();

router.post("/log", (req, res) => {
  try {
    const record = req.body;
    if (!record.employeeName || !record.date) {
      return res.status(400).json({ error: "Employee name and date required" });
    }

    const id = Date.now();
    const r = {
      id,
      ...record,
      late: Number(record.late) || 0,
      absent: Number(record.absent) || 0,
      early: Number(record.early) || 0,
    };
    r.totalExceptions = r.late + r.absent + r.early;

    const key = req.headers["x-session-id"] || "default";
    if (!recordsStore.has(key)) recordsStore.set(key, []);
    recordsStore.get(key).push(r);

    res.json({ success: true, record: r });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to log" });
  }
});

router.get("/records", (req, res) => {
  try {
    const key = req.headers["x-session-id"] || "default";
    const records = recordsStore.get(key) || [];
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch" });
  }
});

router.delete("/records/:id", (req, res) => {
  try {
    const key = req.headers["x-session-id"] || "default";
    const records = recordsStore.get(key) || [];
    const id = parseInt(req.params.id, 10);
    const filtered = records.filter(r => r.id !== id);
    recordsStore.set(key, filtered);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete" });
  }
});

module.exports = router;
