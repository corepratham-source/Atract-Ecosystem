const express = require("express");
const router = express.Router();
const { completeWithGroq } = require("../utils/groq");

// Template-based resume (used when AI fails or not configured)
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

  const skillsList = (skills || "").split(",").map((s) => s.trim()).filter(Boolean);
  const expLines = (experience || "").split("\n").filter((l) => l.trim());
  const timestamp = new Date().toLocaleDateString();

  let resume = `═══════════════════════════════════════════════════════════════
                    ATS-OPTIMIZED RESUME
═══════════════════════════════════════════════════════════════════════

${(targetRole || "PROFESSIONAL").toUpperCase()} | ${targetCompany || "Target Company"}

┌─────────────────────────────────────────────────────────────────┐
│  PROFESSIONAL SUMMARY                                            │
└─────────────────────────────────────────────────────────────────┘

Results-driven ${seniority} professional seeking a ${targetRole || "challenging"} role 
in ${industry || "a dynamic organization"}.

Key Highlights:
• ${expLines.length > 0 ? "Proven track record" : "Ready to contribute"}
• ${skillsList.length > 0 ? `Proficiency in ${skillsList.slice(0, 3).join(", ")}` : "Skilled in multiple domains"}
• ${achievements ? (achievements.split("\n").filter((l) => l.trim()).length + " notable achievements") : "Committed to excellence"}

┌─────────────────────────────────────────────────────────────────┐
│  CORE COMPETENCIES & SKILLS                                      │
└─────────────────────────────────────────────────────────────────┘

${skillsList.length > 0 ? skillsList.join(" • ") : "Add your key skills above"}

┌─────────────────────────────────────────────────────────────────┐
│  PROFESSIONAL EXPERIENCE                                         │
└─────────────────────────────────────────────────────────────────┘

${expLines.length > 0 ? expLines.map((l) => `• ${l.trim()}`).join("\n") : "[Add your experience above]"}

┌─────────────────────────────────────────────────────────────────┐
│  EDUCATION                                                       │
└─────────────────────────────────────────────────────────────────┘

${(education || "").split("\n").filter((l) => l.trim()).length > 0 ? (education || "").split("\n").filter((l) => l.trim()).map((l) => `• ${l.trim()}`).join("\n") : "[Add your education]"}

┌─────────────────────────────────────────────────────────────────┐
│  ATS KEYWORDS (Optimized for ${targetRole || "General Roles"})   │
└─────────────────────────────────────────────────────────────────┘

`;

  const targetKeywords = (targetRole || "").toLowerCase().split(/[\s,]+/).filter((w) => w.length > 3);
  const allKeywords = [...new Set([...targetKeywords, ...skillsList])];
  resume += allKeywords.length > 0 ? allKeywords.map((k) => `✓ ${k}`).join("\n") : "Add target role and skills";
  resume += `

═══════════════════════════════════════════════════════════════════════
Generated: ${timestamp} | ATRact Resume Formatter Pro
═══════════════════════════════════════════════════════════════════════
`;

  return resume;
}

// AI-powered resume generation (Groq) - falls back to template if API key invalid
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

    const prompt = `You are an expert resume writer specializing in ATS (Applicant Tracking System) optimization. Create a professional, ATS-friendly resume based on the following information:

TARGET INFORMATION:
- Target Role: ${targetRole || "Not specified"}
- Target Company: ${targetCompany || "Any company"}
- Industry: ${industry || "General"}
- Seniority Level: ${seniority}

CANDIDATE INFORMATION:
Skills: ${skills || "Not provided"}

Work Experience:
${experience || "Not provided"}

Education:
${education || "Not provided"}

Key Achievements:
${achievements || "Not provided"}

FORMAT STYLE: ${formatStyle}

REQUIREMENTS:
1. Create a complete, professional resume in ${formatStyle} format
2. Make it ATS-friendly (no tables, graphics, or complex formatting)
3. Use strong action verbs and quantifiable achievements
4. Include relevant keywords for ${targetRole || "the target role"}
5. Structure with clear sections: Contact Info (placeholder), Professional Summary, Skills, Work Experience, Education, Achievements
6. Optimize for ${targetCompany || "top companies"} in ${industry || "the industry"}
7. Tailor content to ${seniority} level expectations
8. If information is missing, create realistic placeholder examples that fit the role
9. Total length: 400-600 words
10. Use clean, simple text formatting only (no special characters, bullets with *, - or •)

Return ONLY the formatted resume text, no explanations. Use plain text with line breaks and simple formatting.`;

    const resumeText = await completeWithGroq(prompt);

    if (resumeText) {
      return res.json({ resume: resumeText });
    }
  } catch (err) {
    console.error("AI resume generation error (falling back to template):", err.message);
  }

  // Fallback: template format when API key missing, invalid, or AI errors
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
