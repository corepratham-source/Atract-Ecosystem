// const express = require("express");
// const router = express.Router();
// const { completeWithGroq } = require("../utils/groq");

// // Template-based resume (used when AI fails or not configured)
// function buildTemplateResume(body) {
//   const {
//     targetRole = "",
//     targetCompany = "",
//     industry = "",
//     seniority = "Mid-level",
//     skills = "",
//     experience = "",
//     education = "",
//     achievements = "",
//     formatStyle = "modern",
//   } = body;

//   const skillsList = (skills || "").split(",").map((s) => s.trim()).filter(Boolean);
//   const expLines = (experience || "").split("\n").filter((l) => l.trim());
//   const timestamp = new Date().toLocaleDateString();

//   let resume = `═══════════════════════════════════════════════════════════════
//                     ATS-OPTIMIZED RESUME
// ═══════════════════════════════════════════════════════════════════════

// ${(targetRole || "PROFESSIONAL").toUpperCase()} | ${targetCompany || "Target Company"}

// ┌─────────────────────────────────────────────────────────────────┐
// │  PROFESSIONAL SUMMARY                                            │
// └─────────────────────────────────────────────────────────────────┘

// Results-driven ${seniority} professional seeking a ${targetRole || "challenging"} role 
// in ${industry || "a dynamic organization"}.

// Key Highlights:
// • ${expLines.length > 0 ? "Proven track record" : "Ready to contribute"}
// • ${skillsList.length > 0 ? `Proficiency in ${skillsList.slice(0, 3).join(", ")}` : "Skilled in multiple domains"}
// • ${achievements ? (achievements.split("\n").filter((l) => l.trim()).length + " notable achievements") : "Committed to excellence"}

// ┌─────────────────────────────────────────────────────────────────┐
// │  CORE COMPETENCIES & SKILLS                                      │
// └─────────────────────────────────────────────────────────────────┘

// ${skillsList.length > 0 ? skillsList.join(" • ") : "Add your key skills above"}

// ┌─────────────────────────────────────────────────────────────────┐
// │  PROFESSIONAL EXPERIENCE                                         │
// └─────────────────────────────────────────────────────────────────┘

// ${expLines.length > 0 ? expLines.map((l) => `• ${l.trim()}`).join("\n") : "[Add your experience above]"}

// ┌─────────────────────────────────────────────────────────────────┐
// │  EDUCATION                                                       │
// └─────────────────────────────────────────────────────────────────┘

// ${(education || "").split("\n").filter((l) => l.trim()).length > 0 ? (education || "").split("\n").filter((l) => l.trim()).map((l) => `• ${l.trim()}`).join("\n") : "[Add your education]"}

// ┌─────────────────────────────────────────────────────────────────┐
// │  ATS KEYWORDS (Optimized for ${targetRole || "General Roles"})   │
// └─────────────────────────────────────────────────────────────────┘

// `;

//   const targetKeywords = (targetRole || "").toLowerCase().split(/[\s,]+/).filter((w) => w.length > 3);
//   const allKeywords = [...new Set([...targetKeywords, ...skillsList])];
//   resume += allKeywords.length > 0 ? allKeywords.map((k) => `✓ ${k}`).join("\n") : "Add target role and skills";
//   resume += `

// ═══════════════════════════════════════════════════════════════════════
// Generated: ${timestamp} | ATRact Resume Formatter Pro
// ═══════════════════════════════════════════════════════════════════════
// `;

//   return resume;
// }

// // AI-powered resume generation (Groq) - falls back to template if API key invalid
// router.post("/generate-ai", async (req, res) => {
//   const body = req.body;

//   try {
//     const {
//       targetRole = "",
//       targetCompany = "",
//       industry = "",
//       seniority = "Mid-level",
//       skills = "",
//       experience = "",
//       education = "",
//       achievements = "",
//       formatStyle = "modern",
//     } = body;

//     const prompt = `You are an expert resume writer specializing in ATS (Applicant Tracking System) optimization. Create a professional, ATS-friendly resume based on the following information:

// TARGET INFORMATION:
// - Target Role: ${targetRole || "Not specified"}
// - Target Company: ${targetCompany || "Any company"}
// - Industry: ${industry || "General"}
// - Seniority Level: ${seniority}

// CANDIDATE INFORMATION:
// Skills: ${skills || "Not provided"}

// Work Experience:
// ${experience || "Not provided"}

// Education:
// ${education || "Not provided"}

// Key Achievements:
// ${achievements || "Not provided"}

// FORMAT STYLE: ${formatStyle}

// REQUIREMENTS:
// 1. Create a complete, professional resume in ${formatStyle} format
// 2. Make it ATS-friendly (no tables, graphics, or complex formatting)
// 3. Use strong action verbs and quantifiable achievements
// 4. Include relevant keywords for ${targetRole || "the target role"}
// 5. Structure with clear sections: Contact Info (placeholder), Professional Summary, Skills, Work Experience, Education, Achievements
// 6. Optimize for ${targetCompany || "top companies"} in ${industry || "the industry"}
// 7. Tailor content to ${seniority} level expectations
// 8. If information is missing, create realistic placeholder examples that fit the role
// 9. Total length: 400-600 words
// 10. Use clean, simple text formatting only (no special characters, bullets with *, - or •)

// Return ONLY the formatted resume text, no explanations. Use plain text with line breaks and simple formatting.`;

//     const resumeText = await completeWithGroq(prompt);

//     if (resumeText) {
//       return res.json({ resume: resumeText });
//     }
//   } catch (err) {
//     console.error("AI resume generation error (falling back to template):", err.message);
//   }

//   // Fallback: template format when API key missing, invalid, or AI errors
//   const resume = buildTemplateResume(body);
//   res.json({ resume });
// });

// router.post("/format", (req, res) => {
//   try {
//     const resume = buildTemplateResume(req.body);
//     res.json({ resume });
//   } catch (err) {
//     console.error("Resume format error:", err);
//     res.status(500).json({ error: err.message || "Format failed" });
//   }
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const { completeWithGroq } = require("../utils/groq");

// Clean, ATS-friendly template fallback (no ugly boxes, horizontal skills)
function buildTemplateResume(body) {
  const {
    targetRole = "",
    targetCompany = "",
    industry = "",
    seniority = "Mid-level",
    skills = "",
    experience = "",
    education = "",
    achievements = "",
    formatStyle = "modern",
  } = body;

  const skillsList = (skills || "").split(",").map(s => s.trim()).filter(Boolean);
  const timestamp = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  let resume = `${(targetRole || "PROFESSIONAL").toUpperCase()}\n`;

  if (targetCompany || industry || seniority) {
    resume += `Targeting: ${targetCompany || "Top Companies"} • ${industry || "Industry"} • ${seniority}\n\n`;
  }

  resume += `PROFESSIONAL SUMMARY\n`;
  resume += `Results-driven ${seniority.toLowerCase()} professional seeking a ${targetRole || "challenging role"} in ${industry || "a dynamic organization"}.\n\n`;

  if (skillsList.length > 0) {
    resume += `SKILLS\n`;
    resume += skillsList.join(" • ") + "\n\n";
  }

  if (experience.trim()) {
    resume += `PROFESSIONAL EXPERIENCE\n`;
    resume += experience.trim().split("\n").map(line => line.trim()).filter(Boolean).join("\n") + "\n\n";
  }

  if (education.trim()) {
    resume += `EDUCATION\n`;
    resume += education.trim().split("\n").map(line => line.trim()).filter(Boolean).join("\n") + "\n\n";
  }

  if (achievements.trim()) {
    resume += `KEY ACHIEVEMENTS\n`;
    const achLines = achievements.trim().split("\n").map(l => l.trim()).filter(Boolean);
    resume += achLines.map(line => `• ${line}`).join("\n") + "\n\n";
  }

  resume += `Generated: ${timestamp} | ATRact Resume Formatter Pro\n`;
  resume += `ATS-Optimized for ${targetRole || "general applications"}`;

  return resume.trim();
}

// AI-powered resume generation
router.post("/generate-ai", async (req, res) => {
  const body = req.body;

  try {
    const {
      targetRole = "",
      targetCompany = "",
      industry = "",
      seniority = "Mid-level",
      skills = "",
      experience = "",
      education = "",
      achievements = "",
      formatStyle = "modern",
    } = body;

    const prompt = `You are an expert resume writer specializing in ATS-friendly resumes. Create a clean, professional resume based on this information:

Target Role: ${targetRole || "Not specified"}
Target Company: ${targetCompany || "Any company"}
Industry: ${industry || "General"}
Seniority: ${seniority}

Skills: ${skills || "Not provided"}

Work Experience:
${experience || "Not provided"}

Education:
${education || "Not provided"}

Key Achievements:
${achievements || "Not provided"}

Style: ${formatStyle} (clean, modern, ATS-compatible - no tables, no fancy characters)

STRICT RULES:
- ATS-friendly: plain text, standard headings, no boxes, no horizontal lines, no special symbols except • for bullets
- Skills must be on ONE horizontal line separated by • (example: React • JavaScript • Node.js • AWS)
- Use uppercase bold-looking headings (PROFESSIONAL SUMMARY, SKILLS, PROFESSIONAL EXPERIENCE, etc.)
- Start with name/title in uppercase centered style
- Include targeting line if company/industry provided
- Use • for bullet points in achievements and experience
- Keep formatting simple: line breaks and spacing only
- No decorative lines, no ┌─┐ boxes, no ═════
- Total length: concise, 400-600 words
- Return ONLY the formatted resume text. No explanations, no markdown outside the resume.

Output example structure:
TARGET ROLE or NAME
Targeting: Company • Industry • Seniority

PROFESSIONAL SUMMARY
Results-driven professional...

SKILLS
Skill1 • Skill2 • Skill3 • Skill4

PROFESSIONAL EXPERIENCE
Company Name - Role
• Achievement one
• Achievement two

EDUCATION
Degree - University - Year

KEY ACHIEVEMENTS
• Award or project one
• Award or project two`;

    let resumeText = await completeWithGroq(prompt);

    // Clean up common AI mistakes
    resumeText = resumeText
      .replace(/[-_=]{3,}/g, "")           // remove long lines
      .replace(/[┌┐└┘│═]/g, "")           // remove box characters
      .replace(/[-*•]\s*[-*•]/g, "•")     // normalize bullets
      .trim();

    if (resumeText && resumeText.length > 200) {
      return res.json({ resume: resumeText });
    }
  } catch (err) {
    console.error("AI generation failed:", err.message);
  }

  // Fallback to clean template
  const resume = buildTemplateResume(body);
  res.json({ resume });
});

router.post("/format", (req, res) => {
  try {
    const resume = buildTemplateResume(req.body);
    res.json({ resume });
  } catch (err) {
    console.error("Resume format error:", err);
    res.status(500).json({ error: err.message || "Format failed" });
  }
});

module.exports = router;