const express = require("express");
const router = express.Router();

// Dynamic offer letter generation using LLM (Gemini)

const buildPrompt = (form) => {
  return `You are an expert HR professional. Generate a professional, formal offer letter using ONLY the following details.

Details:
- Company: ${form.company || "[Company Name]"}
- Candidate: ${form.candidate || "[Candidate Name]"}
- Role/Position: ${form.role || "[Role]"}
- Department: ${form.department || "General"}
- Start Date: ${form.startDate || "To be decided"}
- Location: ${form.location || "To be decided"}
- Monthly Salary (₹): ${form.salary ? form.salary : "As per company standards"}
- HR/Manager Name: ${form.managerName || form.company + " HR Team"}
- Manager Title: ${form.managerTitle || "HR Manager"}
- Work Mode: ${form.workMode || "Hybrid"}
- Probation Period: ${form.probationPeriod || "3 months"}
- Working Hours: ${form.workingHours || "9:00 AM - 6:00 PM"}
- Benefits: ${form.benefits || "As per company policy"}
- Leave Policy: ${form.leavePolicy || "As per company policy"}
- Notice Period: ${form.noticePeriod || "15 days"}

Requirements:
- Use today's date in DD Month YYYY format
- Format as a formal business letter with proper letterhead
- Include: Company letterhead/header, Date, Candidate address (with placeholder), Subject line, Salutation, Multiple body paragraphs covering all terms, Benefits section, Acceptance deadline (7 days from today), Closing with signature block
- Make it realistic and professional - use actual values provided
- Salary: format as ₹XX,XX,XXX per month (gross) if provided
- Include standard employment terms: working hours, work mode, probation, benefits, leave policy, notice period
- Professional tone, no placeholders - use the exact values provided
- Return ONLY the offer letter text, no markdown, no extra commentary

Today's date for reference: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`;
};

// Gemini integration
async function generateWithGemini(form) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });

  const result = await model.generateContent(buildPrompt(form));
  const response = await result.response;
  return (response.text() || "").trim();
}

function fallbackLetter(form) {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const salary = form.salary ? `₹${parseInt(form.salary).toLocaleString("en-IN")}` : "As per company standards";
  
  return `═══════════════════════════════════════════════════════════════
                         ${(form.company || "[COMPANY NAME]").toUpperCase()}
                    Corporate Office, India
═══════════════════════════════════════════════════════════════════════

Date: ${today}

To,
${form.candidate || "[Candidate Name]"}
${form.location || "[City, State]"}

Subject: Offer of Employment – ${form.role || "[Position]"}

Dear ${form.candidate || "[Candidate Name]"},

We are pleased to offer you the position of ${form.role || "[Position]"} in our ${form.department || "General"} department at ${form.company || "[Company Name]"}.

EMPLOYMENT DETAILS:

Position        : ${form.role || "[Position]"}
Department      : ${form.department || "General"}
Start Date      : ${form.startDate || "To be decided"}
Location        : ${form.location || "[Location]"}
Work Mode       : ${form.workMode || "Hybrid"}
Working Hours   : ${form.workingHours || "9:00 AM - 6:00 PM"}
Salary          : ${salary} per month (Gross)

PROBATION & BENEFITS:

Probation Period: ${form.probationPeriod || "3 months"}
Benefits        : ${form.benefits || "Health insurance, PF, and other benefits as per company policy"}
Leave Policy    : ${form.leavePolicy || "As per company policy"}
Notice Period   : ${form.noticePeriod || "15 days"} during probation (30 days after confirmation)

This offer is contingent upon:
• Verification of all original educational and professional credentials
• Successful completion of background verification
• Submission of required documents (ID proof, Address proof, Bank details, etc.)

Please confirm your acceptance of this offer by signing and returning the duplicate copy of this letter within 7 days from the date of this letter.

We look forward to welcoming you to our team.

For ${form.company || "[Company Name]"},

_________________________
${form.managerName || "[HR Manager Name]"}
${form.managerTitle || "HR Manager"}

I, ${form.candidate || "[Candidate Name]"}, hereby accept the above terms and conditions of employment.

_________________________                    _________________________
Candidate Signature                         Date

_________________________
Witness Signature
`;

}

router.post("/generate", async (req, res) => {
  try {
    const form = req.body;

    if (!form || !form.role || !form.company || !form.candidate) {
      return res.status(400).json({ error: "Company, Candidate, and Role are required" });
    }

    let letter = "";

    // Use Gemini API if key is available
    if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("your_")) {
      try {
        letter = await generateWithGemini(form);
      } catch (apiError) {
        console.log("Gemini API error, using fallback:", apiError.message);
        letter = "";
      }
    }

    // Fallback if no API or API failed
    if (!letter || letter.length < 50) {
      letter = fallbackLetter(form);
    }

    res.json({ letter });
  } catch (err) {
    console.error("Offer letter generation error:", err);
    try {
      const letter = fallbackLetter(req.body);
      return res.json({ letter });
    } catch (fallbackErr) {
      res.status(500).json({ error: err.message || "Failed to generate offer letter" });
    }
  }
});

module.exports = router;
