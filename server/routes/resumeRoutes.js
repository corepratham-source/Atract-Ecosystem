// const express = require("express");
// const router = express.Router();
// const multiparty = require('multiparty');
// const fs = require('fs');
// const Resume = require("../models/Resume");

// // PDF text extraction
// let pdfParse;
// try {
//   pdfParse = require("pdf-parse");
//   console.log("[Resume] pdf-parse loaded");
// } catch (e) {
//   console.warn("[Resume] pdf-parse missing → npm install pdf-parse");
// }

// // DOCX extraction
// let mammoth;
// try {
//   mammoth = require("mammoth");
// } catch (e) {
//   console.warn("[Resume] mammoth missing → npm install mammoth");
// }

// // OCR
// let tesseract;
// try {
//   tesseract = require("tesseract.js");
//   console.log("[Resume] tesseract.js loaded for OCR");
// } catch (e) {
//   console.warn("[Resume] tesseract.js missing → npm install tesseract.js");
// }

// // PDF -> image rendering for OCR of scanned PDFs
// let pdfjsLib;
// let createCanvas;
// try {
//   // pdfjs-dist is optional but required for scanned PDF OCR.
//   // Try common paths for different versions
//   const candidates = [
//     "pdfjs-dist/legacy/build/pdf.js",
//     "pdfjs-dist/legacy/build/pdf.cjs",
//     "pdfjs-dist/legacy/build/pdf.mjs",
//     "pdfjs-dist/build/pdf.js",
//     "pdfjs-dist/build/pdf.cjs",
//   ];
//   for (const modPath of candidates) {
//     try {
//       const mod = require(modPath);
//       const resolved = mod?.getDocument ? mod : mod?.default;
//       if (resolved?.getDocument) {
//         pdfjsLib = resolved;
//         console.log("[Resume] pdfjs loaded from:", modPath);
//         break;
//       }
//     } catch {
//       // try next path
//     }
//   }
// } catch {
//   pdfjsLib = null;
// }

// try {
//   // @napi-rs/canvas is optional but recommended (prebuilt binaries)
//   ({ createCanvas } = require("@napi-rs/canvas"));
// } catch {
//   createCanvas = null;
// }

// // ────────────────────────────────────────────────
// // OCR fallback
// // ────────────────────────────────────────────────
// async function extractTextWithOCR(buffer) {
//   if (!tesseract) {
//     throw new Error("OCR not available – install tesseract.js");
//   }
//   try {
//     console.log("[OCR] Starting...");
//     const { data } = await tesseract.recognize(buffer, "eng", {
//       logger: (m) => console.log(`[OCR] ${Math.round(m.progress * 100)}%`),
//     });
//     const text = (data.text || "").trim();
//     console.log(`[OCR] Done – ${text.length} chars`);
//     // Lower threshold to 15 chars to accept partial OCR results
//     if (text.length < 15) {
//       throw new Error("OCR extracted almost no text");
//     }
//     return { text, method: "ocr", isImageBased: true };
//   } catch (err) {
//     console.error("[OCR] Failed:", err.message);
//     // Wrap low-level errors so callers can handle gracefully without crashing the process
//     const wrapped = new Error("Error attempting to read image via OCR");
//     wrapped.cause = err;
//     throw wrapped;
//   }
// }

// async function extractTextFromScannedPdf(buffer, opts = {}) {
//   const maxPages = Number(opts.maxPages || 2);
//   const scale = Number(opts.scale || 2);

//   if (!pdfjsLib || !createCanvas) {
//     return {
//       text: "",
//       method: "pdf-scanned-no-renderer",
//       isScanned: true,
//       error:
//         "Scanned PDF detected, but PDF-to-image OCR dependencies are missing. Install pdfjs-dist and @napi-rs/canvas.",
//     };
//   }

//   const loadingTask = pdfjsLib.getDocument({ data: buffer });
//   const pdf = await loadingTask.promise;
//   const pagesToProcess = Math.min(pdf.numPages || 0, maxPages);

//   if (pagesToProcess <= 0) {
//     return {
//       text: "",
//       method: "pdf-scanned-empty",
//       isScanned: true,
//       error: "PDF has no pages",
//     };
//   }

//   let combined = "";

//   for (let pageNumber = 1; pageNumber <= pagesToProcess; pageNumber++) {
//     console.log(`[PDF->IMG] Rendering page ${pageNumber}/${pagesToProcess}...`);
//     const page = await pdf.getPage(pageNumber);
//     const viewport = page.getViewport({ scale });
//     const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
//     const ctx = canvas.getContext("2d");

//     await page.render({ canvasContext: ctx, viewport }).promise;
//     const pngBuffer = canvas.toBuffer("image/png");

//     console.log(`[PDF->IMG] OCR page ${pageNumber}...`);
//     const ocr = await extractTextWithOCR(pngBuffer);
//     if (ocr?.text) {
//       combined += (combined ? "\n\n" : "") + ocr.text;
//     }
//   }

//   const text = (combined || "").trim();
//   // Lower threshold to accept partial OCR results
//   if (text.length < 15) {
//     return {
//       text: text, // Return even if minimal - don't fail completely
//       method: "pdfjs+ocr",
//       isScanned: true,
//       error: "OCR extracted limited text from scanned PDF",
//     };
//   }

//   return { text, method: "pdfjs+ocr", isImageBased: true };
// }

// // ────────────────────────────────────────────────
// // Main text extraction logic
// // ────────────────────────────────────────────────
// async function extractTextFromBuffer(buffer, mimetype, filename = "") {
//   const ext = filename.toLowerCase().split(".").pop();

//   // Images → force OCR
//   if (mimetype && mimetype.startsWith("image/")) {
//     return extractTextWithOCR(buffer);
//   }

//   // PDF
//   if (mimetype === "application/pdf" || ext === "pdf") {
//     if (!pdfParse) throw new Error("pdf-parse not installed");

//     try {
//       const data = await pdfParse(buffer);
//       let text = (data.text || "").trim();

//       const alphaRatio = (text.match(/[a-zA-Z]/g) || []).length / (text.length || 1);

//       // Heuristic: likely scanned / image PDF - lower threshold to avoid false positives
//       if (text.length < 50 || alphaRatio < 0.20) {
//         console.warn(
//           `[PDF] Suspicious – ${text.length} chars, alpha ${alphaRatio.toFixed(
//             2
//           )} → trying OCR`
//         );
//         // IMPORTANT: Tesseract cannot OCR PDFs directly.
//         // Render PDF pages to images first, then OCR images.
//         try {
//           // Try with more pages and higher scale for better OCR
//           return await extractTextFromScannedPdf(buffer, { maxPages: 3, scale: 3 });
//         } catch (ocrErr) {
//           console.error("[PDF] Scanned PDF OCR failed:", ocrErr.message);
//           // Try one more time with different settings
//           try {
//             return await extractTextFromScannedPdf(buffer, { maxPages: 5, scale: 2 });
//           } catch (retryErr) {
//             console.error("[PDF] Scanned PDF OCR retry failed:", retryErr.message);
//             return {
//               text: text, // Return original text even if minimal
//               method: "pdf-parse+partial-ocr",
//               isScanned: true,
//               error: "Scanned PDF OCR had limited success",
//             };
//           }
//         }
//       }

//       return { text, method: "pdf-parse" };
//     } catch (err) {
//       console.error("[PDF] parse error:", err.message);

//       const msg = err.message.toLowerCase();

//       if (msg.includes("stream ended") || msg.includes("unexpected end")) {
//         console.log("[PDF] stream error → attempting scanned-PDF OCR");
//         const ocrResult = await extractTextFromScannedPdf(buffer);
//         if (ocrResult?.text) return ocrResult;
//         throw new Error("PDF appears corrupted/incomplete and OCR could not recover text");
//       }

//       if (msg.includes("password") || msg.includes("encrypted")) {
//         throw new Error("PDF is password protected");
//       }

//       throw err;
//     }
//   }

//   // DOCX
//   if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === "docx") {
//     if (!mammoth) throw new Error("mammoth not installed");
//     const { value } = await mammoth.extractRawText({ buffer });
//     return { text: (value || "").trim(), method: "mammoth" };
//   }

//   // TXT
//   if (mimetype === "text/plain" || ext === "txt") {
//     return { text: buffer.toString("utf-8").trim(), method: "text" };
//   }

//   // Fallback for other formats (basic stripping)
//   const raw = buffer.toString("utf-8");
//   const cleaned = raw
//     .replace(/<[^>]+>/g, " ")
//     .replace(/\s{2,}/g, " ")
//     .trim();

//   return { text: cleaned, method: "fallback" };
// }

// // ────────────────────────────────────────────────
// // POST /upload – Resume (using multiparty)
// // ────────────────────────────────────────────────
// router.post("/upload", (req, res) => {
//   const form = new multiparty.Form({
//     maxFieldsSize: 10 * 1024 * 1024,
//     maxFilesSize: 10 * 1024 * 1024
//   });
  
//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       console.error("[Resume Upload] Parse error:", err.message);
//       return res.status(400).json({ 
//         error: "File upload failed: " + err.message,
//         suggestion: "Please try again with a smaller file" 
//       });
//     }
    
//     // Check for JSON body (client-side extracted text)
//     const textField = fields.text ? fields.text[0] : null;
//     const nameField = fields.name ? fields.name[0] : null;
//     const emailField = fields.email ? fields.email[0] : null;
    
//     if (textField) {
//       // JSON fallback (client-extracted text)
//       if (!textField.trim()) {
//         return res.status(400).json({ error: "No file or text provided" });
//       }
      
//       // Check if MongoDB is connected
//       const mongoose = require("mongoose");
//       if (mongoose.connection.readyState !== 1) {
//         console.warn("[Resume Upload] MongoDB not connected");
//         return res.status(503).json({ 
//           error: "Database not connected - cannot save resume",
//           suggestion: "Please connect to MongoDB to save resumes"
//         });
//       }
      
//       const cleaned = textField.trim().replace(/\n{4,}/g, "\n\n").replace(/[ \t]{3,}/g, " ");
//       const resume = new Resume({
//         name: nameField || "Resume",
//         email: emailField || "",
//         text: cleaned,
//         filename: "",
//         filesize: Buffer.byteLength(cleaned, "utf-8"),
//       });
//       await resume.save();
//       return res.json({
//         success: true,
//         id: resume._id,
//         name: resume.name,
//         email: resume.email,
//         text: cleaned,  // Always include text field
//         textLength: cleaned.length,
//         extractionMethod: "client",
//       });
//     }
    
//     // File upload
//     const resumeFiles = files.resume;
//     if (!resumeFiles || resumeFiles.length === 0) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }
    
//     const file = resumeFiles[0];
//     const originalname = file.originalFilename;
//     const mimetype = file.headers['content-type'];
    
//     try {
//       const buffer = fs.readFileSync(file.path);
//       const result = await extractTextFromBuffer(buffer, mimetype, originalname);
      
//       // Normalize and clean extracted text (even for scanned PDFs)
//       const rawText = (result.text || "").toString();
//       const cleaned = rawText
//         .replace(/\r\n/g, "\n")
//         .replace(/\r/g, "\n")
//         .replace(/\n{4,}/g, "\n\n")
//         .replace(/[ \t]{3,}/g, " ")
//         .trim();
      
//       // If we truly got almost nothing, then fail gracefully
//       if (!cleaned || cleaned.length < 5) {
//         return res.status(422).json({
//           error: result.error || "Very little meaningful text extracted",
//           suggestion: "File may be empty, heavily scanned/image-only or corrupted. Try a clearer PDF or DOCX version.",
//           isScanned: !!result.isScanned,
//         });
//       }
      
//       // Check if MongoDB is connected
//       const mongoose = require("mongoose");
//       if (mongoose.connection.readyState !== 1) {
//         console.warn("[Resume Upload] MongoDB not connected");
//         return res.status(503).json({ 
//           error: "Database not connected - cannot save resume",
//           suggestion: "Please connect to MongoDB to save resumes"
//         });
//       }
      
//       const resume = new Resume({
//         name: nameField || originalname.replace(/\.[^.]+$/, ""),
//         email: emailField || "",
//         text: cleaned,
//         filename: originalname,
//         filesize: buffer.length,
//       });
      
//       await resume.save();
      
//       res.json({
//         success: true,
//         id: resume._id,
//         name: resume.name,
//         email: resume.email,
//         text: cleaned,
//         textLength: cleaned.length,
//         extractionMethod: result.method,
//       });
//     } catch (err) {
//       console.error("[Resume Upload] Error:", err.message);
//       res.status(500).json({ error: "Server error during resume processing" });
//     }
//   });
// });

// // ────────────────────────────────────────────────
// // POST /upload-jd – Job Description (using multiparty)
// // ────────────────────────────────────────────────
// router.post("/upload-jd", (req, res) => {
//   const form = new multiparty.Form({
//     maxFieldsSize: 10 * 1024 * 1024,
//     maxFilesSize: 10 * 1024 * 1024
//   });
  
//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       console.error("[JD Upload] Parse error:", err.message);
//       return res.status(400).json({ 
//         error: "File upload failed: " + err.message,
//         suggestion: "Please try again with a smaller file" 
//       });
//     }
    
//     const jdFiles = files.jd;
//     if (!jdFiles || jdFiles.length === 0) {
//       return res.status(400).json({ 
//         error: "No job description file uploaded",
//         suggestion: "Please select a file to upload"
//       });
//     }
    
//     const file = jdFiles[0];
//     const originalname = file.originalFilename;
//     const mimetype = file.headers['content-type'];
    
//     console.log("[JD Upload] Processing:", originalname, mimetype);
    
//     try {
//       const buffer = fs.readFileSync(file.path);
//       const result = await extractTextFromBuffer(buffer, mimetype, originalname);
      
//       if (result.isScanned) {
//         return res.status(422).json({
//           error: "Scanned / image-based document",
//           suggestion: "Convert to text-searchable PDF using OCR tools",
//           isScanned: true,
//         });
//       }
      
//       const cleaned = result.text
//         .replace(/\r\n/g, "\n")
//         .replace(/\r/g, "\n")
//         .replace(/\n{4,}/g, "\n\n")
//         .replace(/[ \t]{3,}/g, " ")
//         .trim();
        
//       if (cleaned.length < 50) {
//         return res.status(422).json({
//           error: "Could not extract enough text",
//           suggestion: "File may be empty, scanned, or corrupted",
//         });
//       }
      
//       console.log("[JD Upload] Success - extracted", cleaned.length, "chars");
      
//       res.json({
//         success: true,
//         text: cleaned,
//         textLength: cleaned.length,
//         extractionMethod: result.method,
//       });
//     } catch (err) {
//       console.error("[JD Upload] Error:", err.message);
      
//       let errorMsg = "Failed to read job description file";
//       let suggestion = "Please paste the JD text directly or try another file";
      
//       if (err.message.includes("password")) {
//         errorMsg = "PDF is password protected";
//         suggestion = "Remove password and retry";
//       } else if (err.message.includes("stream ended") || err.message.includes("corrupted")) {
//         errorMsg = "File appears corrupted or not a valid PDF";
//       } else if (err.isScanned) {
//         errorMsg = "Scanned / image-only document";
//         suggestion = "Convert using OCR (smallpdf, Adobe, etc.)";
//       }
      
//       res.status(422).json({ error: errorMsg, suggestion });
//     }
//   });
// });

// // ────────────────────────────────────────────────
// // GET / – List all resumes
// // ────────────────────────────────────────────────
// router.get("/", async (req, res) => {
//   try {
//     // Check if MongoDB is connected
//     const mongoose = require("mongoose");
//     if (mongoose.connection.readyState !== 1) {
//       console.warn("[Resume GET /] MongoDB not connected, returning empty list");
//       return res.json({
//         count: 0,
//         resumes: [],
//         message: "Database not connected - demo mode"
//       });
//     }
    
//     const resumes = await Resume.find()
//       .select("name email filename textLength createdAt")
//       .sort({ createdAt: -1 });
    
//     res.json({
//       count: resumes.length,
//       resumes: resumes.map((r) => ({
//         id: r._id,
//         name: r.name,
//         email: r.email,
//         filename: r.filename,
//         textLength: r.text?.length || 0,
//         createdAt: r.createdAt,
//       })),
//     });
//   } catch (err) {
//     console.error("[Resume GET /] Error:", err.message);
//     res.status(500).json({ error: "Failed to fetch resumes" });
//   }
// });

// // GET /my – Get resumes by email
// // ────────────────────────────────────────────────
// router.get("/my", async (req, res) => {
//   try {
//     const email = req.query.email;
//     if (!email) {
//       return res.status(400).json({ error: "Email parameter is required" });
//     }
    
//     // Check if MongoDB is connected
//     const mongoose = require("mongoose");
//     if (mongoose.connection.readyState !== 1) {
//       console.warn("[Resume GET /my] MongoDB not connected, returning empty list");
//       return res.json({
//         count: 0,
//         resumes: [],
//         message: "Database not connected - demo mode"
//       });
//     }
    
//     const resumes = await Resume.find({ email })
//       .select("name email filename textLength createdAt")
//       .sort({ createdAt: -1 });
    
//     res.json({
//       count: resumes.length,
//       resumes: resumes.map((r) => ({
//         id: r._id,
//         name: r.name,
//         email: r.email,
//         filename: r.filename,
//         textLength: r.text?.length || 0,
//         createdAt: r.createdAt,
//       })),
//     });
//   } catch (err) {
//     console.error("[Resume GET /my] Error:", err.message);
//     res.status(500).json({ error: "Failed to fetch resumes" });
//   }
// });

// // GET /:id – Get single resume by ID
// router.get("/:id", async (req, res) => {
//   try {
//     // Check if MongoDB is connected
//     const mongoose = require("mongoose");
//     if (mongoose.connection.readyState !== 1) {
//       console.warn("[Resume GET /:id] MongoDB not connected");
//       return res.status(503).json({ error: "Database not connected - demo mode" });
//     }
    
//     const resume = await Resume.findById(req.params.id);
//     if (!resume) {
//       return res.status(404).json({ error: "Resume not found" });
//     }
//     res.json({
//       id: resume._id,
//       name: resume.name,
//       email: resume.email,
//       text: resume.text,
//       filename: resume.filename,
//       textLength: resume.text?.length || 0,
//       createdAt: resume.createdAt,
//     });
//   } catch (err) {
//     console.error("[Resume GET /:id] Error:", err.message);
//     res.status(500).json({ error: "Failed to fetch resume" });
//   }
// });

// // DELETE /:id – Delete a resume
// router.delete("/:id", async (req, res) => {
//   try {
//     // Check if MongoDB is connected
//     const mongoose = require("mongoose");
//     if (mongoose.connection.readyState !== 1) {
//       console.warn("[Resume DELETE /:id] MongoDB not connected");
//       return res.status(503).json({ error: "Database not connected - demo mode" });
//     }
    
//     const resume = await Resume.findByIdAndDelete(req.params.id);
//     if (!resume) {
//       return res.status(404).json({ error: "Resume not found" });
//     }
//     res.json({ success: true, message: "Resume deleted" });
//   } catch (err) {
//     console.error("[Resume DELETE /:id] Error:", err.message);
//     res.status(500).json({ error: "Failed to delete resume" });
//   }
// });

// module.exports = router;


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

// PDF -> image rendering for OCR of scanned PDFs
let pdfjsLib;
let createCanvas;

try {
  const candidates = [
    "pdfjs-dist/legacy/build/pdf.js",
    "pdfjs-dist/legacy/build/pdf.cjs",
    "pdfjs-dist/legacy/build/pdf.mjs",
    "pdfjs-dist/build/pdf.js",
    "pdfjs-dist/build/pdf.cjs",
  ];
  for (const modPath of candidates) {
    try {
      const mod = require(modPath);
      const resolved = mod?.getDocument ? mod : mod?.default;
      if (resolved?.getDocument) {
        pdfjsLib = resolved;
        console.log("[Resume] pdfjs loaded from:", modPath);
        break;
      }
    } catch {
      // try next
    }
  }
} catch {
  pdfjsLib = null;
}

try {
  ({ createCanvas } = require("@napi-rs/canvas"));
  console.log("[Resume] @napi-rs/canvas loaded");
} catch {
  createCanvas = null;
  console.warn("[Resume] @napi-rs/canvas missing → npm install @napi-rs/canvas");
}

// ────────────────────────────────────────────────
// OCR helper — works on any image buffer
// ────────────────────────────────────────────────
async function extractTextWithOCR(imageBuffer) {
  if (!tesseract) {
    throw new Error("OCR not available – install tesseract.js");
  }
  console.log("[OCR] Starting tesseract on buffer of", imageBuffer.length, "bytes...");
  const { data } = await tesseract.recognize(imageBuffer, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        process.stdout.write(`\r[OCR] ${Math.round(m.progress * 100)}%`);
      }
    },
  });
  console.log(""); // newline after progress
  const text = (data.text || "").trim();
  console.log(`[OCR] Done – ${text.length} chars`);
  return { text, method: "ocr", isImageBased: true };
}

// ────────────────────────────────────────────────
// Render scanned PDF pages → images → OCR
// ────────────────────────────────────────────────
async function extractTextFromScannedPdf(nodeBuffer, opts = {}) {
  const maxPages = Number(opts.maxPages || 3);
  const scale = Number(opts.scale || 2.5);

  if (!pdfjsLib) {
    console.warn("[PDF->IMG] pdfjs-dist not available");
    // Fall back: try OCR directly on the raw PDF buffer
    if (tesseract) {
      console.log("[PDF->IMG] Trying direct OCR on PDF buffer as fallback...");
      try {
        const result = await extractTextWithOCR(nodeBuffer);
        return { ...result, isScanned: true };
      } catch (e) {
        console.error("[PDF->IMG] Direct OCR fallback failed:", e.message);
      }
    }
    return {
      text: "",
      method: "pdf-scanned-no-renderer",
      isScanned: true,
      error: "Install pdfjs-dist and @napi-rs/canvas for scanned PDF support.",
    };
  }

  if (!createCanvas) {
    console.warn("[PDF->IMG] @napi-rs/canvas not available — falling back to direct OCR");
    if (tesseract) {
      try {
        const result = await extractTextWithOCR(nodeBuffer);
        return { ...result, isScanned: true };
      } catch (e) {
        console.error("[PDF->IMG] Direct OCR fallback failed:", e.message);
      }
    }
    return {
      text: "",
      method: "pdf-scanned-no-canvas",
      isScanned: true,
      error: "Install @napi-rs/canvas for scanned PDF rendering.",
    };
  }

  try {
    // *** THE KEY FIX: pdfjs requires Uint8Array, NOT a Node.js Buffer ***
    // A Node.js Buffer shares memory with its underlying ArrayBuffer but may be
    // offset inside it, so we must slice correctly.
    const uint8 = new Uint8Array(
      nodeBuffer.buffer,
      nodeBuffer.byteOffset,
      nodeBuffer.byteLength
    );

    const loadingTask = pdfjsLib.getDocument({
      data: uint8,
      disableWorker: true,
      verbosity: 0,
    });
    const pdf = await loadingTask.promise;
    const pagesToProcess = Math.min(pdf.numPages || 0, maxPages);

    console.log(`[PDF->IMG] PDF has ${pdf.numPages} pages, processing ${pagesToProcess}`);

    if (pagesToProcess === 0) {
      return { text: "", method: "pdf-scanned-empty", isScanned: true, error: "PDF has no pages" };
    }

    let combined = "";

    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      console.log(`[PDF->IMG] Rendering page ${pageNum}/${pagesToProcess}...`);
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvasWidth = Math.ceil(viewport.width);
        const canvasHeight = Math.ceil(viewport.height);

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d");

        // White background improves OCR accuracy
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        await page.render({ canvasContext: ctx, viewport }).promise;
        const pngBuffer = canvas.toBuffer("image/png");

        console.log(`[PDF->IMG] Page ${pageNum} rendered (${pngBuffer.length} bytes), running OCR...`);
        const ocrResult = await extractTextWithOCR(pngBuffer);

        if (ocrResult?.text) {
          combined += (combined ? "\n\n" : "") + ocrResult.text;
          console.log(`[PDF->IMG] Page ${pageNum}: ${ocrResult.text.length} chars`);
        }
      } catch (pageErr) {
        console.error(`[PDF->IMG] Error on page ${pageNum}:`, pageErr.message);
        // Continue with remaining pages
      }
    }

    const text = combined.trim();
    console.log(`[PDF->IMG] Total: ${text.length} chars from ${pagesToProcess} pages`);

    return {
      text,
      method: "pdfjs+ocr",
      isImageBased: true,
      isScanned: true,
    };
  } catch (err) {
    console.error("[PDF->IMG] Fatal error:", err.message);
    // Last-resort: try direct OCR on the raw buffer
    if (tesseract) {
      console.log("[PDF->IMG] Attempting last-resort direct OCR...");
      try {
        const result = await extractTextWithOCR(nodeBuffer);
        return { ...result, isScanned: true };
      } catch (ocrErr) {
        console.error("[PDF->IMG] Last-resort OCR also failed:", ocrErr.message);
      }
    }
    return {
      text: "",
      method: "pdfjs+ocr-failed",
      isScanned: true,
      error: err.message,
    };
  }
}

// ────────────────────────────────────────────────
// Main text extraction dispatcher
// ────────────────────────────────────────────────
async function extractTextFromBuffer(buffer, mimetype, filename = "") {
  const ext = (filename.toLowerCase().split(".").pop() || "").trim();

  // Images → OCR directly
  if (mimetype && mimetype.startsWith("image/")) {
    return extractTextWithOCR(buffer);
  }

  // ── PDF ──────────────────────────────────────
  if (mimetype === "application/pdf" || ext === "pdf") {
    if (!pdfParse) throw new Error("pdf-parse not installed — run: npm install pdf-parse");

    let pdfText = "";
    let parseError = null;

    try {
      const parsed = await pdfParse(buffer);
      pdfText = (parsed.text || "").trim();
      console.log(`[PDF] pdf-parse extracted ${pdfText.length} chars`);
    } catch (err) {
      parseError = err;
      console.error("[PDF] pdf-parse error:", err.message);
      const msg = err.message.toLowerCase();
      if (msg.includes("password") || msg.includes("encrypted")) {
        throw new Error("PDF is password protected — please remove the password first.");
      }
    }

    // Quality check: decide if OCR is needed
    const alphaCount = (pdfText.match(/[a-zA-Z]/g) || []).length;
    const alphaRatio = pdfText.length > 0 ? alphaCount / pdfText.length : 0;
    const needsOCR = parseError !== null || pdfText.length < 80 || alphaRatio < 0.20;

    if (needsOCR) {
      console.warn(
        `[PDF] Needs OCR (${pdfText.length} chars, ${(alphaRatio * 100).toFixed(0)}% alpha)`
      );
      const ocrResult = await extractTextFromScannedPdf(buffer, { maxPages: 5, scale: 2.5 });
      const ocrText = (ocrResult.text || "").trim();

      console.log(`[PDF] OCR got ${ocrText.length} chars vs pdf-parse ${pdfText.length} chars`);

      // Return whichever gave more text; always return *something* if available
      if (ocrText.length >= pdfText.length) {
        return {
          text: ocrText.length > 0 ? ocrText : pdfText,
          method: ocrResult.method,
          isScanned: true,
          isImageBased: true,
          ocrError: ocrResult.error,
        };
      } else {
        return { text: pdfText, method: "pdf-parse" };
      }
    }

    return { text: pdfText, method: "pdf-parse" };
  }

  // ── DOCX ─────────────────────────────────────
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    if (!mammoth) throw new Error("mammoth not installed — run: npm install mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    return { text: (value || "").trim(), method: "mammoth" };
  }

  // ── TXT ──────────────────────────────────────
  if (mimetype === "text/plain" || ext === "txt") {
    return { text: buffer.toString("utf-8").trim(), method: "text" };
  }

  // ── Generic fallback ─────────────────────────
  const raw = buffer.toString("utf-8");
  const cleaned = raw.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
  return { text: cleaned, method: "fallback" };
}

// ────────────────────────────────────────────────
// Shared text cleaner
// ────────────────────────────────────────────────
function cleanExtractedText(raw) {
  return (raw || "")
    .toString()
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{4,}/g, "\n\n")
    .replace(/[ \t]{3,}/g, " ")
    .trim();
}

// ────────────────────────────────────────────────
// POST /upload — Resume upload
// ────────────────────────────────────────────────
router.post("/upload", (req, res) => {
  const form = new multiparty.Form({
    maxFieldsSize: 10 * 1024 * 1024,
    maxFilesSize: 10 * 1024 * 1024,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("[Resume Upload] Form parse error:", err.message);
      return res.status(400).json({ error: "File upload failed: " + err.message });
    }

    const nameField = fields.name?.[0] || null;
    const emailField = fields.email?.[0] || null;
    const textField = fields.text?.[0] || null;

    // ── Client-extracted text path ────────────
    if (textField) {
      if (!textField.trim()) {
        return res.status(400).json({ error: "No file or text provided" });
      }

      const mongoose = require("mongoose");
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not connected", suggestion: "Connect to MongoDB first." });
      }

      const cleaned = cleanExtractedText(textField);
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
        text: cleaned,
        textLength: cleaned.length,
        extractionMethod: "client",
      });
    }

    // ── File upload path ──────────────────────
    const resumeFiles = files.resume;
    if (!resumeFiles || resumeFiles.length === 0) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = resumeFiles[0];
    const originalname = file.originalFilename;
    const mimetype = file.headers["content-type"];

    console.log(`[Resume Upload] Processing: "${originalname}" (${mimetype})`);

    try {
      const buffer = fs.readFileSync(file.path);

      let result;
      try {
        result = await extractTextFromBuffer(buffer, mimetype, originalname);
      } catch (extractErr) {
        console.error("[Resume Upload] Extraction threw:", extractErr.message);
        return res.status(422).json({
          error: extractErr.message,
          suggestion: "Please try a different file format or paste the resume text directly.",
        });
      }

      const cleaned = cleanExtractedText(result.text);

      console.log(`[Resume Upload] Extracted ${cleaned.length} chars via "${result.method}", isScanned=${result.isScanned}`);

      // Only reject if truly nothing was extracted
      if (cleaned.length < 10) {
        return res.status(422).json({
          error: result.ocrError || "Could not extract readable text from this file.",
          suggestion: "Please try: 1) A clearer scan, 2) A text-based PDF, 3) A DOCX version, or 4) Copy-paste the text manually.",
          isScanned: !!result.isScanned,
        });
      }

      const mongoose = require("mongoose");
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not connected", suggestion: "Connect to MongoDB first." });
      }

      const resume = new Resume({
        name: nameField || originalname.replace(/\.[^.]+$/, ""),
        email: emailField || "",
        text: cleaned,
        filename: originalname,
        filesize: buffer.length,
      });

      await resume.save();

      console.log(`[Resume Upload] ✅ Saved "${resume.name}" (id=${resume._id}, ${cleaned.length} chars)`);

      return res.json({
        success: true,
        id: resume._id,
        name: resume.name,
        email: resume.email,
        text: cleaned,
        textLength: cleaned.length,
        extractionMethod: result.method,
        isScanned: !!result.isScanned,
        warning: result.isScanned
          ? "⚠️ Scanned document detected — OCR was used. Accuracy depends on scan quality."
          : undefined,
      });

    } catch (err) {
      console.error("[Resume Upload] Unexpected error:", err.message);
      return res.status(500).json({ error: "Server error: " + err.message });
    }
  });
});

// ────────────────────────────────────────────────
// POST /upload-jd — Job Description upload
// ────────────────────────────────────────────────
router.post("/upload-jd", (req, res) => {
  const form = new multiparty.Form({
    maxFieldsSize: 10 * 1024 * 1024,
    maxFilesSize: 10 * 1024 * 1024,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("[JD Upload] Parse error:", err.message);
      return res.status(400).json({ error: "File upload failed: " + err.message });
    }

    const jdFiles = files.jd;
    if (!jdFiles || jdFiles.length === 0) {
      return res.status(400).json({ error: "No job description file uploaded" });
    }

    const file = jdFiles[0];
    const originalname = file.originalFilename;
    const mimetype = file.headers["content-type"];
    console.log("[JD Upload] Processing:", originalname, mimetype);

    try {
      const buffer = fs.readFileSync(file.path);
      const result = await extractTextFromBuffer(buffer, mimetype, originalname);
      const cleaned = cleanExtractedText(result.text);

      if (cleaned.length < 20) {
        return res.status(422).json({
          error: "Could not extract enough text from this file.",
          suggestion: "The file may be empty, scanned, or corrupted. Please paste the JD text directly.",
        });
      }

      console.log("[JD Upload] Success —", cleaned.length, "chars via", result.method);

      return res.json({
        success: true,
        text: cleaned,
        textLength: cleaned.length,
        extractionMethod: result.method,
        isScanned: !!result.isScanned,
        warning: result.isScanned
          ? "⚠️ Scanned document — OCR was used. Please verify the extracted text."
          : undefined,
      });

    } catch (err) {
      console.error("[JD Upload] Error:", err.message);
      const msg = err.message.toLowerCase();
      const errorMsg = msg.includes("password") ? "PDF is password protected — remove it first." :
        msg.includes("stream") ? "File appears corrupted or incomplete." :
          "Failed to read the job description file.";
      return res.status(422).json({
        error: errorMsg,
        suggestion: "Please paste the JD text directly or try another file.",
      });
    }
  });
});

// ────────────────────────────────────────────────
// GET / — List all resumes
// ────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      return res.json({ count: 0, resumes: [], message: "Database not connected - demo mode" });
    }

    const resumes = await Resume.find()
      .select("name email filename text createdAt")
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

// ────────────────────────────────────────────────
// GET /my — Resumes by email
// ────────────────────────────────────────────────
router.get("/my", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email parameter is required" });

    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      return res.json({ count: 0, resumes: [], message: "Database not connected - demo mode" });
    }

    const resumes = await Resume.find({ email })
      .select("name email filename text createdAt")
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

// ────────────────────────────────────────────────
// GET /:id — Single resume
// ────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ error: "Resume not found" });

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

// ────────────────────────────────────────────────
// DELETE /:id — Delete resume
// ────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const resume = await Resume.findByIdAndDelete(req.params.id);
    if (!resume) return res.status(404).json({ error: "Resume not found" });

    res.json({ success: true, message: "Resume deleted" });
  } catch (err) {
    console.error("[Resume DELETE /:id] Error:", err.message);
    res.status(500).json({ error: "Failed to delete resume" });
  }
});

module.exports = router;