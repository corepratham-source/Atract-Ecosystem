
const express = require("express");
const router = express.Router();
const multer = require("multer");
const Resume = require("../models/Resume");

// PDF text extraction using pdf-parse 
// Install: npm install pdf-parse
// This is the most reliable Node.js PDF text extractor
let pdfParse;
try {
  pdfParse = require("pdf-parse");
  console.log("[Resume] pdf-parse loaded successfully");
} catch (e) {
  console.warn("[Resume] pdf-parse not installed. Run: npm install pdf-parse");
}

// DOCX text extraction using mammoth 
let mammoth;
try {
  mammoth = require("mammoth");
} catch (e) {
  console.warn("[Resume] mammoth not installed. Run: npm install mammoth");
}

// Store files in memory so we can extract text before saving to DB
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    if (allowed.includes(file.mimetype) ||
        file.originalname.match(/\.(pdf|docx|doc|txt)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX, DOC, and TXT files are allowed"));
    }
  },
});

//  Text extraction function 
async function extractTextFromBuffer(buffer, mimetype, filename) {
  const ext = (filename || "").toLowerCase().split(".").pop();

  // PDF extraction
  if (mimetype === "application/pdf" || ext === "pdf") {
    if (!pdfParse) throw new Error("pdf-parse not installed. Run: npm install pdf-parse");
    try {
      const data = await pdfParse(buffer);
      const text = data.text || "";
      console.log(`[TextExtract] PDF extracted: ${text.length} chars, ${data.numpages} pages`);
      console.log(`[TextExtract] PDF text preview:\n${text.substring(0, 500)}`);
      
      // Check if extracted text is too short - likely a scanned/image PDF
      if (text.trim().length < 50) {
        console.warn("[TextExtract] PDF appears to be scanned/image-based - very little text extracted");
        // Return a special indicator for scanned PDF
        return { text: "", method: "scanned-pdf", isScanned: true, error: "This PDF appears to be a scanned document or image-based PDF. Please convert to a text-based PDF or DOCX format for better results." };
      }
      
      // Check text quality - if it contains mostly special characters, it's likely scanned
      const alphaRatio = (text.match(/[a-zA-Z]/g) || []).length / (text.length || 1);
      if (alphaRatio < 0.3) {
        console.warn("[TextExtract] PDF has low text quality - likely scanned");
        return { text: "", method: "scanned-pdf", isScanned: true, error: "This PDF appears to contain primarily images or scanned content. Please use a text-based PDF or convert to DOCX format." };
      }
      
      return { text, method: "pdf-parse" };
    } catch (err) {
      console.error("[TextExtract] PDF parse error:", err.message);
      throw err;
    }
  }

  // DOCX extraction
  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === "docx") {
    if (!mammoth) throw new Error("mammoth not installed. Run: npm install mammoth");
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value || "";
      console.log(`[TextExtract] DOCX extracted: ${text.length} chars`);
      console.log(`[TextExtract] DOCX text preview:\n${text.substring(0, 500)}`);
      if (text.trim().length < 50) {
        throw new Error("DOCX text extraction returned very little text");
      }
      return { text, method: "mammoth" };
    } catch (err) {
      console.error("[TextExtract] DOCX parse error:", err.message);
      throw err;
    }
  }

  // Plain text
  if (mimetype === "text/plain" || ext === "txt") {
    const text = buffer.toString("utf-8");
    console.log(`[TextExtract] TXT: ${text.length} chars`);
    return { text, method: "plain-text" };
  }

  // DOC (old format) — basic extraction
  if (ext === "doc") {
    // Try mammoth for old .doc format
    if (mammoth) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        return { text: result.value || "", method: "mammoth" };
      } catch (_) {}
    }
    // Fallback: read as buffer and strip binary
    const raw = buffer.toString("latin1");
    const text = raw.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, " ").trim();
    return { text, method: "fallback" };
  }

  throw new Error(`Unsupported file type: ${mimetype} / .${ext}`);
}

// POST /upload — upload and store a resume 
// Supports both:
//   1. multipart/form-data with file field "resume" (server-side extraction)
//   2. application/json with { name, text } (client-side extraction)
router.post("/upload", (req, res, next) => {
  // If content-type is JSON, skip multer and go straight to handler
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (ct.includes("application/json")) {
    return next();
  }
  // Otherwise, use multer for file upload
  upload.single("resume")(req, res, next);
}, async (req, res) => {
  try {
    let cleanedText, resumeName, resumeEmail, resumeFilename, resumeFilesize;
    let extractedMethod = "unknown";

    if (req.file) {
      // ── Multipart file upload: extract text server-side ──
      const { originalname, mimetype, buffer, size } = req.file;
      const { name, email } = req.body;

      console.log(`\n[Resume] File Upload: ${originalname} | ${mimetype} | ${size} bytes`);

      let extracted;
      let extractedMethod = "unknown";
      try {
        const result = await extractTextFromBuffer(buffer, mimetype, originalname);
        
        // Handle scanned PDF specially
        if (result.isScanned) {
          return res.status(422).json({
            error: result.error || "Scanned PDF detected",
            suggestion: "Please convert your scanned PDF to a text-based PDF or DOCX format. You can use tools like Adobe Acrobat or online converters.",
            isScanned: true
          });
        }
        
        extracted = result.text;
        extractedMethod = result.method;
      } catch (extractErr) {
        console.error("[Resume] Text extraction failed:", extractErr.message);
        return res.status(422).json({
          error: `Text extraction failed: ${extractErr.message}`,
          suggestion: "Please ensure the file is not password-protected or a scanned image PDF. Try converting to DOCX or TXT format.",
        });
      }

      cleanedText = extracted
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n{4,}/g, "\n\n")
        .replace(/[ \t]{3,}/g, " ")
        .trim();

      resumeName = name || originalname.replace(/\.[^.]+$/, "");
      resumeEmail = email || "";
      resumeFilename = originalname;
      resumeFilesize = size;
    } else if (req.body && req.body.text) {
      //  JSON upload: text already extracted client-side 
      const { name, email, text } = req.body;
      console.log(`\n[Resume] JSON Upload: name=${name} | textLen=${text.length}`);

      cleanedText = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n{4,}/g, "\n\n")
        .replace(/[ \t]{3,}/g, " ")
        .trim();

      resumeName = name || "Uploaded Resume";
      resumeEmail = email || "";
      resumeFilename = name || "";
      resumeFilesize = Buffer.byteLength(cleanedText, "utf-8");
      extractedMethod = "client-side";
    } else {
      return res.status(400).json({ error: "No file or text provided. Upload a file or send { name, text } as JSON." });
    }

    console.log(`[Resume] Cleaned text: ${cleanedText.length} chars`);
    console.log(`[Resume] Text sample:\n---\n${cleanedText.substring(0, 600)}\n---`);

    if (cleanedText.length < 50) {
      return res.status(422).json({
        error: "Could not extract meaningful text from this file",
        suggestion: "The file may be a scanned image PDF. Please use a text-based PDF or convert to DOCX.",
      });
    }

    // Save to database
    const resume = new Resume({
      name: resumeName,
      email: resumeEmail,
      text: cleanedText,
      filename: resumeFilename,
      filesize: resumeFilesize,
    });

    await resume.save();
    console.log(`[Resume] Saved to DB: ${resume._id} | text length: ${cleanedText.length}`);

    return res.json({
      success: true,
      id: resume._id,
      name: resume.name,
      email: resume.email,
      textLength: cleanedText.length,
      text: cleanedText,  
      textPreview: cleanedText.substring(0, 200) + "...",
      extractionMethod: extractedMethod,
      message: `Resume uploaded successfully. Extracted ${cleanedText.length} characters of text.`,
    });
  } catch (err) {
    console.error("[Resume] Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /upload-jd — extract text from uploaded JD file 
router.post("/upload-jd", upload.single("jd"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { originalname, mimetype, buffer } = req.file;
    console.log(`\n[JD] Upload: ${originalname} | ${mimetype}`);

    // Extract text from buffer
    const extracted = await extractTextFromBuffer(buffer, mimetype, originalname);
    
    // Validate extracted result
    if (!extracted || typeof extracted !== 'object') {
      console.error("[JD] Invalid extraction result:", extracted);
      return res.status(422).json({ error: "Failed to extract text from file - invalid result" });
    }
    
    if (typeof extracted.text !== 'string') {
      console.error("[JD] Extracted text is not a string:", typeof extracted.text, extracted);
      return res.status(422).json({ error: "Failed to extract text from file - invalid text format" });
    }
    
    const extractedText = extracted.text;

    const cleanedText = extractedText
      .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
      .replace(/\n{4,}/g, "\n\n").replace(/[ \t]{3,}/g, " ").trim();

    console.log(`[JD] Extracted ${cleanedText.length} chars`);
    console.log(`[JD] Preview:\n${cleanedText.substring(0, 400)}`);

    return res.json({
      success: true,
      text: cleanedText,
      textLength: cleanedText.length,
      textPreview: cleanedText.substring(0, 300),
    });
  } catch (err) {
    console.error("[JD] Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

//  GET /my — get current user's resumes by email 
router.get("/my", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const resumes = await Resume.find({ email: String(email).trim().toLowerCase() })
      .select("name email filename createdAt")
      .sort({ createdAt: -1 });
    res.json(resumes.map((r) => ({
      id: r._id,
      name: r.name,
      email: r.email,
      filename: r.filename,
      createdAt: r.createdAt,
      matchPercentage: null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//GET /resumes — list all stored resumes 
router.get("/", async (req, res) => {
  try {
    const resumes = await Resume.find().select("name email filename textLength createdAt");
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
    res.status(500).json({ error: err.message });
  }
});

//  DELETE /resumes/:id
router.delete("/:id", async (req, res) => {
  try {
    await Resume.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Resume deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  GET /resumes/:id/text — debug: see extracted text for a resume
router.get("/:id/text", async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id).select("name text");
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    res.json({
      name: resume.name,
      textLength: resume.text?.length || 0,
      text: resume.text,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;