const express = require("express");
const router = express.Router();
const multiparty = require('multiparty');
const fs = require('fs');
const Resume = require("../models/Resume");

// PDF text extraction
let pdfParse;
try {
  pdfParse = require("pdf-parse");
  console.log("[Resume] pdf-parse loaded");
} catch (e) {
  console.warn("[Resume] pdf-parse missing → npm install pdf-parse");
}

// DOCX extraction
let mammoth;
try {
  mammoth = require("mammoth");
} catch (e) {
  console.warn("[Resume] mammoth missing → npm install mammoth");
}

// OCR
let tesseract;
try {
  tesseract = require("tesseract.js");
  console.log("[Resume] tesseract.js loaded for OCR");
} catch (e) {
  console.warn("[Resume] tesseract.js missing → npm install tesseract.js");
}

// ────────────────────────────────────────────────
// OCR fallback
// ────────────────────────────────────────────────
async function extractTextWithOCR(buffer) {
  if (!tesseract) {
    throw new Error("OCR not available – install tesseract.js");
  }
  try {
    console.log("[OCR] Starting...");
    const { data } = await tesseract.recognize(buffer, "eng", {
      logger: m => console.log(`[OCR] ${Math.round(m.progress*100)}%`),
    });
    const text = (data.text || "").trim();
    console.log(`[OCR] Done – ${text.length} chars`);
    if (text.length < 30) {
      throw new Error("OCR extracted almost no text");
    }
    return { text, method: "ocr", isImageBased: true };
  } catch (err) {
    console.error("[OCR] Failed:", err.message);
    throw err;
  }
}

// ────────────────────────────────────────────────
// Main text extraction logic
// ────────────────────────────────────────────────
async function extractTextFromBuffer(buffer, mimetype, filename = "") {
  const ext = filename.toLowerCase().split(".").pop();

  // Images → force OCR
  if (mimetype && mimetype.startsWith("image/")) {
    return extractTextWithOCR(buffer);
  }

  // PDF
  if (mimetype === "application/pdf" || ext === "pdf") {
    if (!pdfParse) throw new Error("pdf-parse not installed");

    try {
      const data = await pdfParse(buffer);
      let text = (data.text || "").trim();

      const alphaRatio = (text.match(/[a-zA-Z]/g) || []).length / (text.length || 1);

      // Heuristic: likely scanned / image PDF
      if (text.length < 120 || alphaRatio < 0.38) {
        console.warn(`[PDF] Suspicious – ${text.length} chars, alpha ${alphaRatio.toFixed(2)} → trying OCR`);
        if (tesseract) {
          return await extractTextWithOCR(buffer);
        }
        return {
          text: "",
          method: "pdf-scanned-no-ocr",
          isScanned: true,
          error: "Likely scanned PDF – OCR not available"
        };
      }

      return { text, method: "pdf-parse" };
    } catch (err) {
      console.error("[PDF] parse error:", err.message);

      const msg = err.message.toLowerCase();

      if (msg.includes("stream ended") || msg.includes("unexpected end")) {
        if (tesseract) {
          console.log("[PDF] stream error → falling back to OCR");
          return await extractTextWithOCR(buffer);
        }
        throw new Error("PDF appears corrupted or incomplete (stream ended)");
      }

      if (msg.includes("password") || msg.includes("encrypted")) {
        throw new Error("PDF is password protected");
      }

      throw err;
    }
  }

  // DOCX
  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === "docx") {
    if (!mammoth) throw new Error("mammoth not installed");
    const { value } = await mammoth.extractRawText({ buffer });
    return { text: (value || "").trim(), method: "mammoth" };
  }

  // TXT
  if (mimetype === "text/plain" || ext === "txt") {
    return { text: buffer.toString("utf-8").trim(), method: "text" };
  }

  // Fallback for other formats (basic stripping)
  const raw = buffer.toString("utf-8");
  const cleaned = raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { text: cleaned, method: "fallback" };
}

// ────────────────────────────────────────────────
// POST /upload – Resume (using multiparty)
// ────────────────────────────────────────────────
router.post("/upload", (req, res) => {
  const form = new multiparty.Form({
    maxFieldsSize: 10 * 1024 * 1024,
    maxFilesSize: 10 * 1024 * 1024
  });
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("[Resume Upload] Parse error:", err.message);
      return res.status(400).json({ 
        error: "File upload failed: " + err.message,
        suggestion: "Please try again with a smaller file" 
      });
    }
    
    // Check for JSON body (client-side extracted text)
    const textField = fields.text ? fields.text[0] : null;
    const nameField = fields.name ? fields.name[0] : null;
    const emailField = fields.email ? fields.email[0] : null;
    
    if (textField) {
      // JSON fallback (client-extracted text)
      if (!textField.trim()) {
        return res.status(400).json({ error: "No file or text provided" });
      }
      
      // Check if MongoDB is connected
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState !== 1) {
        console.warn("[Resume Upload] MongoDB not connected");
        return res.status(503).json({ 
          error: "Database not connected - cannot save resume",
          suggestion: "Please connect to MongoDB to save resumes"
        });
      }
      
      const cleaned = textField.trim().replace(/\n{4,}/g, "\n\n").replace(/[ \t]{3,}/g, " ");
      const resume = new Resume({
        name: nameField || "Resume",
        email: emailField || "",
        text: cleaned,
        filename: "",
        filesize: Buffer.byteLength(cleaned, "utf-8"),
      });
      await resume.save();
      return res.json({
        success: true,
        id: resume._id,
        name: resume.name,
        email: resume.email,
        text: cleaned,  // Always include text field
        textLength: cleaned.length,
        extractionMethod: "client",
      });
    }
    
    // File upload
    const resumeFiles = files.resume;
    if (!resumeFiles || resumeFiles.length === 0) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const file = resumeFiles[0];
    const originalname = file.originalFilename;
    const mimetype = file.headers['content-type'];
    
    try {
      const buffer = fs.readFileSync(file.path);
      const result = await extractTextFromBuffer(buffer, mimetype, originalname);
      
      if (result.isScanned) {
        return res.status(422).json({
          error: result.error || "Scanned document – no text layer",
          suggestion: "Use OCR to make it searchable or upload text-based version",
          isScanned: true,
        });
      }
      
      const cleaned = result.text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n{4,}/g, "\n\n")
        .replace(/[ \t]{3,}/g, " ")
        .trim();
        
      if (cleaned.length < 60) {
        return res.status(422).json({
          error: "Very little meaningful text extracted",
          suggestion: "File may be empty, image-only or corrupted",
        });
      }
      
      // Check if MongoDB is connected
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState !== 1) {
        console.warn("[Resume Upload] MongoDB not connected");
        return res.status(503).json({ 
          error: "Database not connected - cannot save resume",
          suggestion: "Please connect to MongoDB to save resumes"
        });
      }
      
      const resume = new Resume({
        name: nameField || originalname.replace(/\.[^.]+$/, ""),
        email: emailField || "",
        text: cleaned,
        filename: originalname,
        filesize: buffer.length,
      });
      
      await resume.save();
      
      res.json({
        success: true,
        id: resume._id,
        name: resume.name,
        email: resume.email,
        text: cleaned,
        textLength: cleaned.length,
        extractionMethod: result.method,
      });
    } catch (err) {
      console.error("[Resume Upload] Error:", err.message);
      res.status(500).json({ error: "Server error during resume processing" });
    }
  });
});

// ────────────────────────────────────────────────
// POST /upload-jd – Job Description (using multiparty)
// ────────────────────────────────────────────────
router.post("/upload-jd", (req, res) => {
  const form = new multiparty.Form({
    maxFieldsSize: 10 * 1024 * 1024,
    maxFilesSize: 10 * 1024 * 1024
  });
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("[JD Upload] Parse error:", err.message);
      return res.status(400).json({ 
        error: "File upload failed: " + err.message,
        suggestion: "Please try again with a smaller file" 
      });
    }
    
    const jdFiles = files.jd;
    if (!jdFiles || jdFiles.length === 0) {
      return res.status(400).json({ 
        error: "No job description file uploaded",
        suggestion: "Please select a file to upload"
      });
    }
    
    const file = jdFiles[0];
    const originalname = file.originalFilename;
    const mimetype = file.headers['content-type'];
    
    console.log("[JD Upload] Processing:", originalname, mimetype);
    
    try {
      const buffer = fs.readFileSync(file.path);
      const result = await extractTextFromBuffer(buffer, mimetype, originalname);
      
      if (result.isScanned) {
        return res.status(422).json({
          error: "Scanned / image-based document",
          suggestion: "Convert to text-searchable PDF using OCR tools",
          isScanned: true,
        });
      }
      
      const cleaned = result.text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n{4,}/g, "\n\n")
        .replace(/[ \t]{3,}/g, " ")
        .trim();
        
      if (cleaned.length < 50) {
        return res.status(422).json({
          error: "Could not extract enough text",
          suggestion: "File may be empty, scanned, or corrupted",
        });
      }
      
      console.log("[JD Upload] Success - extracted", cleaned.length, "chars");
      
      res.json({
        success: true,
        text: cleaned,
        textLength: cleaned.length,
        extractionMethod: result.method,
      });
    } catch (err) {
      console.error("[JD Upload] Error:", err.message);
      
      let errorMsg = "Failed to read job description file";
      let suggestion = "Please paste the JD text directly or try another file";
      
      if (err.message.includes("password")) {
        errorMsg = "PDF is password protected";
        suggestion = "Remove password and retry";
      } else if (err.message.includes("stream ended") || err.message.includes("corrupted")) {
        errorMsg = "File appears corrupted or not a valid PDF";
      } else if (err.isScanned) {
        errorMsg = "Scanned / image-only document";
        suggestion = "Convert using OCR (smallpdf, Adobe, etc.)";
      }
      
      res.status(422).json({ error: errorMsg, suggestion });
    }
  });
});

// ────────────────────────────────────────────────
// GET / – List all resumes
// ────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    // Check if MongoDB is connected
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      console.warn("[Resume GET /] MongoDB not connected, returning empty list");
      return res.json({
        count: 0,
        resumes: [],
        message: "Database not connected - demo mode"
      });
    }
    
    const resumes = await Resume.find()
      .select("name email filename textLength createdAt")
      .sort({ createdAt: -1 });
    
    res.json({
      count: resumes.length,
      resumes: resumes.map((r) => ({
        id: r._id,
        name: r.name,
        email: r.email,
        filename: r.filename,
        textLength: r.text?.length || 0,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("[Resume GET /] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
});

// GET /my – Get resumes by email
// ────────────────────────────────────────────────
router.get("/my", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: "Email parameter is required" });
    }
    
    // Check if MongoDB is connected
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      console.warn("[Resume GET /my] MongoDB not connected, returning empty list");
      return res.json({
        count: 0,
        resumes: [],
        message: "Database not connected - demo mode"
      });
    }
    
    const resumes = await Resume.find({ email })
      .select("name email filename textLength createdAt")
      .sort({ createdAt: -1 });
    
    res.json({
      count: resumes.length,
      resumes: resumes.map((r) => ({
        id: r._id,
        name: r.name,
        email: r.email,
        filename: r.filename,
        textLength: r.text?.length || 0,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("[Resume GET /my] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
});

// GET /:id – Get single resume by ID
router.get("/:id", async (req, res) => {
  try {
    // Check if MongoDB is connected
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      console.warn("[Resume GET /:id] MongoDB not connected");
      return res.status(503).json({ error: "Database not connected - demo mode" });
    }
    
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }
    res.json({
      id: resume._id,
      name: resume.name,
      email: resume.email,
      text: resume.text,
      filename: resume.filename,
      textLength: resume.text?.length || 0,
      createdAt: resume.createdAt,
    });
  } catch (err) {
    console.error("[Resume GET /:id] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch resume" });
  }
});

// DELETE /:id – Delete a resume
router.delete("/:id", async (req, res) => {
  try {
    // Check if MongoDB is connected
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      console.warn("[Resume DELETE /:id] MongoDB not connected");
      return res.status(503).json({ error: "Database not connected - demo mode" });
    }
    
    const resume = await Resume.findByIdAndDelete(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }
    res.json({ success: true, message: "Resume deleted" });
  } catch (err) {
    console.error("[Resume DELETE /:id] Error:", err.message);
    res.status(500).json({ error: "Failed to delete resume" });
  }
});

module.exports = router;
